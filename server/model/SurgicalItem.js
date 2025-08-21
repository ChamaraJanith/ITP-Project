import mongoose from 'mongoose';
import EmailService from '../services/emailService.js';

const surgicalItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Cutting Instruments',
      'Grasping Instruments', 
      'Hemostatic Instruments',
      'Retractors',
      'Sutures',
      'Disposables',
      'Implants',
      'Monitoring Equipment',
      'Anesthesia Equipment',
      'Sterilization Equipment',
      'Other'
    ]
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  supplier: {
    name: {
      type: String,
      required: [true, 'Supplier name is required']
    },
    contact: String,
    email: {
      type: String,
      validate: {
        validator: function(email) {
          return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email format'
      }
    }
  },
  location: {
    room: String,
    shelf: String,
    bin: String
  },
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Discontinued'],
    default: 'Available'
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  batchNumber: String,
  serialNumber: String,
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  usageHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    quantityUsed: {
      type: Number,
      required: true
    },
    usedBy: {
      type: String,
      required: true
    },
    purpose: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },

  // ✅ ADDED: Notification-related fields
  notifications: {
    emailEnabled: {
      type: Boolean,
      default: true
    },
    lastLowStockAlert: {
      type: Date
    },
    lastOutOfStockAlert: {
      type: Date
    },
    alertFrequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly'],
      default: 'immediate'
    },
    recipients: [{
      type: String,
      default: ['chamarasweed44@gmail.com']
    }],
    thresholdPercentage: {
      type: Number,
      default: 20, // Alert when stock falls below 20% of max capacity
      min: 0,
      max: 100
    }
  },
  
  // ✅ ADDED: Notification history tracking
  notificationHistory: [{
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'restock_needed', 'expiry_warning'],
      required: true
    },
    message: String,
    sentTo: [String],
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'sent'
    },
    triggeredBy: {
      quantity: Number,
      previousQuantity: Number,
      action: String
    }
  }],

  // ✅ ADDED: Automatic reorder settings
  autoReorder: {
    enabled: {
      type: Boolean,
      default: false
    },
    reorderPoint: Number,
    reorderQuantity: Number,
    preferredSupplier: String
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock status
surgicalItemSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'Out of Stock';
  if (this.quantity <= this.minStockLevel) return 'Low Stock';
  return 'Available';
});

// ✅ ADDED: Virtual for notification urgency
surgicalItemSchema.virtual('notificationUrgency').get(function() {
  if (this.quantity === 0) return 'critical';
  if (this.quantity <= this.minStockLevel * 0.5) return 'high';
  if (this.quantity <= this.minStockLevel) return 'medium';
  return 'low';
});

// ✅ ADDED: Virtual for days until expiry
surgicalItemSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const timeDiff = this.expiryDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Index for efficient searching
surgicalItemSchema.index({ name: 'text', description: 'text', category: 'text' });
surgicalItemSchema.index({ category: 1, status: 1 });
surgicalItemSchema.index({ quantity: 1 });
// ✅ ADDED: Notification-specific indexes
surgicalItemSchema.index({ 'notifications.emailEnabled': 1, quantity: 1 });
surgicalItemSchema.index({ expiryDate: 1 });
surgicalItemSchema.index({ status: 1, 'notifications.emailEnabled': 1 });

// Middleware to update status based on quantity
surgicalItemSchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.minStockLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'Available';
  }
  next();
});

// ✅ ADDED: Post-save middleware for notifications
surgicalItemSchema.post('save', async function(doc, next) {
  try {
    // Check if notifications are enabled
    if (!doc.notifications.emailEnabled) {
      return next();
    }

    const now = new Date();
    const shouldSendNotification = (lastAlert, frequency) => {
      if (!lastAlert) return true;
      
      const timeDiff = now - lastAlert;
      switch (frequency) {
        case 'immediate': return true;
        case 'daily': return timeDiff > 24 * 60 * 60 * 1000;
        case 'weekly': return timeDiff > 7 * 24 * 60 * 60 * 1000;
        default: return true;
      }
    };

    // Check for out of stock notification
    if (doc.quantity === 0 && 
        shouldSendNotification(doc.notifications.lastOutOfStockAlert, doc.notifications.alertFrequency)) {
      
      await this.sendNotificationEmail('out_of_stock');
      doc.notifications.lastOutOfStockAlert = now;
      await doc.save();
    }
    
    // Check for low stock notification
    else if (doc.quantity <= doc.minStockLevel && doc.quantity > 0 &&
             shouldSendNotification(doc.notifications.lastLowStockAlert, doc.notifications.alertFrequency)) {
      
      await this.sendNotificationEmail('low_stock');
      doc.notifications.lastLowStockAlert = now;
      await doc.save();
    }

    // Check for expiry warning (30 days before expiry)
    if (doc.daysUntilExpiry && doc.daysUntilExpiry <= 30 && doc.daysUntilExpiry > 0) {
      await this.sendNotificationEmail('expiry_warning');
    }

    next();
  } catch (error) {
    console.error('❌ Error in notification middleware:', error);
    next();
  }
});

// ✅ ADDED: Instance method for sending notification emails
surgicalItemSchema.methods.sendNotificationEmail = async function(type) {
  try {
    const recipients = this.notifications.recipients.length > 0 
      ? this.notifications.recipients 
      : ['chamarasweed44@gmail.com'];

    let subject, htmlContent;

    switch (type) {
      case 'out_of_stock':
        subject = `🚨 URGENT: ${this.name} is Out of Stock - HealX Healthcare`;
        htmlContent = this.generateOutOfStockEmailHTML();
        break;
      
      case 'low_stock':
        subject = `⚠️ Low Stock Alert: ${this.name} - HealX Healthcare`;
        htmlContent = this.generateLowStockEmailHTML();
        break;
      
      case 'expiry_warning':
        subject = `📅 Expiry Warning: ${this.name} expires in ${this.daysUntilExpiry} days - HealX Healthcare`;
        htmlContent = this.generateExpiryWarningEmailHTML();
        break;
      
      default:
        return;
    }

    // Send email using EmailService
    const emailResult = await EmailService.sendCustomNotification(recipients, subject, htmlContent);
    
    // Log notification history
    this.notificationHistory.push({
      type,
      message: subject,
      sentTo: recipients,
      sentAt: new Date(),
      status: 'sent',
      triggeredBy: {
        quantity: this.quantity,
        action: 'auto_notification'
      }
    });

    console.log(`✅ ${type} notification sent for item: ${this.name}`);
    return emailResult;

  } catch (error) {
    console.error(`❌ Failed to send ${type} notification for ${this.name}:`, error);
    
    // Log failed notification
    this.notificationHistory.push({
      type,
      message: `Failed to send ${type} notification`,
      sentTo: this.notifications.recipients,
      sentAt: new Date(),
      status: 'failed',
      triggeredBy: {
        quantity: this.quantity,
        action: 'auto_notification_failed'
      }
    });
    
    throw error;
  }
};

// ✅ ADDED: Method to generate out of stock email HTML
surgicalItemSchema.methods.generateOutOfStockEmailHTML = function() {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: #d32f2f; color: white; padding: 25px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🚨 URGENT: Out of Stock Alert</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px;">HealX Healthcare Management System</p>
      </div>
      
      <div style="background: white; padding: 25px; border: 1px solid #ddd; border-top: none;">
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; border-left: 5px solid #d32f2f; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; color: #d32f2f;">Item Completely Out of Stock</h2>
          <p style="margin: 0; font-size: 16px;"><strong>${this.name}</strong> has run out completely!</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; font-weight: bold;">Item Name:</td><td style="padding: 8px;">${this.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Category:</td><td style="padding: 8px;">${this.category}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Current Stock:</td><td style="padding: 8px; color: #d32f2f; font-weight: bold;">0 units</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Min Required:</td><td style="padding: 8px;">${this.minStockLevel} units</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Location:</td><td style="padding: 8px;">${this.location.room || 'N/A'} - ${this.location.shelf || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Supplier:</td><td style="padding: 8px;">${this.supplier.name} (${this.supplier.contact || 'No contact'})</td></tr>
        </table>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin-top: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">🚨 IMMEDIATE ACTION REQUIRED</h3>
          <ul style="margin: 0; color: #856404;">
            <li>Contact supplier immediately for emergency restock</li>
            <li>Check alternative suppliers if primary is unavailable</li>
            <li>Update surgical schedules if this item is critical</li>
            <li>Consider temporary alternatives if available</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px;">
        <strong>Alert Generated:</strong> ${new Date().toLocaleString()} | <strong>HealX Healthcare System</strong>
      </div>
    </div>
  `;
};

// ✅ ADDED: Method to generate low stock email HTML
surgicalItemSchema.methods.generateLowStockEmailHTML = function() {
  const urgencyColor = this.quantity <= this.minStockLevel * 0.5 ? '#d32f2f' : '#ff9800';
  const urgencyText = this.quantity <= this.minStockLevel * 0.5 ? 'CRITICAL' : 'WARNING';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: ${urgencyColor}; color: white; padding: 25px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">⚠️ ${urgencyText}: Low Stock Alert</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px;">HealX Healthcare Management System</p>
      </div>
      
      <div style="background: white; padding: 25px; border: 1px solid #ddd; border-top: none;">
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid ${urgencyColor}; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; color: #856404;">Stock Running Low</h2>
          <p style="margin: 0; font-size: 16px;"><strong>${this.name}</strong> needs restocking soon!</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; font-weight: bold;">Item Name:</td><td style="padding: 8px;">${this.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Category:</td><td style="padding: 8px;">${this.category}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Current Stock:</td><td style="padding: 8px; color: ${urgencyColor}; font-weight: bold;">${this.quantity} units</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Min Required:</td><td style="padding: 8px;">${this.minStockLevel} units</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Stock Percentage:</td><td style="padding: 8px;">${Math.round((this.quantity / this.minStockLevel) * 100)}% of minimum</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Location:</td><td style="padding: 8px;">${this.location.room || 'N/A'} - ${this.location.shelf || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Supplier:</td><td style="padding: 8px;">${this.supplier.name} (${this.supplier.email || this.supplier.contact || 'No contact'})</td></tr>
        </table>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 5px solid #2196f3; margin-top: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #1976d2;">📋 Recommended Actions</h3>
          <ul style="margin: 0; color: #1976d2;">
            <li>Schedule restock order within the next 2-3 days</li>
            <li>Contact supplier: ${this.supplier.name}</li>
            <li>Estimated reorder quantity: ${Math.max(50, this.minStockLevel * 2)} units</li>
            <li>Monitor usage closely until restock arrives</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px;">
        <strong>Alert Generated:</strong> ${new Date().toLocaleString()} | <strong>HealX Healthcare System</strong>
      </div>
    </div>
  `;
};

// ✅ ADDED: Method to generate expiry warning email HTML
surgicalItemSchema.methods.generateExpiryWarningEmailHTML = function() {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: #ff9800; color: white; padding: 25px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📅 Expiry Warning</h1>
        <p style="margin: 8px 0 0 0; font-size: 16px;">HealX Healthcare Management System</p>
      </div>
      
      <div style="background: white; padding: 25px; border: 1px solid #ddd; border-top: none;">
        <div style="background: #fff8e1; padding: 20px; border-radius: 8px; border-left: 5px solid #ff9800; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; color: #e65100;">Item Approaching Expiry</h2>
          <p style="margin: 0; font-size: 16px;"><strong>${this.name}</strong> expires in ${this.daysUntilExpiry} days</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; font-weight: bold;">Item Name:</td><td style="padding: 8px;">${this.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Current Stock:</td><td style="padding: 8px;">${this.quantity} units</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Expiry Date:</td><td style="padding: 8px; color: #ff9800; font-weight: bold;">${this.expiryDate ? this.expiryDate.toLocaleDateString() : 'Not set'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Days Until Expiry:</td><td style="padding: 8px; color: #ff9800; font-weight: bold;">${this.daysUntilExpiry} days</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Batch Number:</td><td style="padding: 8px;">${this.batchNumber || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Location:</td><td style="padding: 8px;">${this.location.room || 'N/A'} - ${this.location.shelf || 'N/A'}</td></tr>
        </table>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 5px solid #4caf50; margin-top: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #2e7d32;">📋 Recommended Actions</h3>
          <ul style="margin: 0; color: #2e7d32;">
            <li>Use this item for upcoming procedures before expiry</li>
            <li>Check if item can be returned to supplier if unused</li>
            <li>Update procurement schedule to avoid future waste</li>
            <li>Consider reducing order quantities for slow-moving items</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px;">
        <strong>Alert Generated:</strong> ${new Date().toLocaleString()} | <strong>HealX Healthcare System</strong>
      </div>
    </div>
  `;
};

// ✅ ADDED: Static method to find items needing notifications
surgicalItemSchema.statics.findItemsNeedingNotification = function() {
  return this.find({
    isActive: true,
    'notifications.emailEnabled': true,
    $or: [
      { quantity: 0 },
      { quantity: { $lte: this.minStockLevel } }
    ]
  });
};

// ✅ ADDED: Static method for bulk notification check
surgicalItemSchema.statics.checkAndSendBulkNotifications = async function() {
  try {
    const itemsNeedingAlert = await this.find({
      isActive: true,
      'notifications.emailEnabled': true,
      $or: [
        { quantity: 0 },
        { quantity: { $lte: '$minStockLevel' } }
      ]
    });

    console.log(`📧 Found ${itemsNeedingAlert.length} items needing notifications`);
    
    const notifications = [];
    for (const item of itemsNeedingAlert) {
      if (item.quantity === 0) {
        await item.sendNotificationEmail('out_of_stock');
        notifications.push({ item: item.name, type: 'out_of_stock' });
      } else if (item.quantity <= item.minStockLevel) {
        await item.sendNotificationEmail('low_stock');
        notifications.push({ item: item.name, type: 'low_stock' });
      }
    }

    return notifications;
  } catch (error) {
    console.error('❌ Error in bulk notification check:', error);
    throw error;
  }
};

const SurgicalItem = mongoose.model('SurgicalItem', surgicalItemSchema);

export default SurgicalItem;
