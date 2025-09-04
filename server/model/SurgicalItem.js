import mongoose from 'mongoose';

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
  
  // ✅ NEW: Auto-restock configuration (added while keeping everything else)
  autoRestock: {
    enabled: { 
      type: Boolean, 
      default: false,
      index: true // Index for efficient queries
    },
    maxStockLevel: { 
      type: Number, 
      default: 0,
      min: [0, 'Maximum stock level cannot be negative'],
      validate: {
        validator: function(val) {
          // Max stock should be greater than or equal to min stock
          return !this.minStockLevel || val >= this.minStockLevel;
        },
        message: 'Maximum stock level must be greater than or equal to minimum stock level'
      }
    },
    reorderQuantity: { 
      type: Number, 
      default: 0,
      min: [0, 'Reorder quantity cannot be negative']
    },
    restockMethod: { 
      type: String, 
      enum: ['to_max', 'fixed_quantity'], 
      default: 'to_max',
      validate: {
        validator: function(method) {
          // If method is fixed_quantity, reorderQuantity must be > 0
          if (method === 'fixed_quantity') {
            return this.autoRestock.reorderQuantity > 0;
          }
          return true;
        },
        message: 'Reorder quantity must be greater than 0 when using fixed quantity method'
      }
    },
    supplier: {
      name: String,
      contactEmail: {
        type: String,
        validate: {
          validator: function(email) {
            return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          },
          message: 'Invalid supplier email format'
        }
      },
      leadTimeDays: { 
        type: Number, 
        default: 3,
        min: [0, 'Lead time cannot be negative'],
        max: [365, 'Lead time cannot exceed 365 days']
      }
    },
    lastAutoRestock: {
      type: Date,
      index: true // Index for efficient queries on recent restocks
    },
    autoRestockCount: { 
      type: Number, 
      default: 0,
      min: [0, 'Auto restock count cannot be negative']
    },
    lastAutoRestockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Last auto restock quantity cannot be negative']
    },
    nextScheduledCheck: {
      type: Date,
      index: true // Index for scheduler queries
    },
    restockHistory: [{
      date: {
        type: Date,
        default: Date.now
      },
      quantityAdded: {
        type: Number,
        required: true,
        min: [0, 'Quantity added cannot be negative']
      },
      previousStock: {
        type: Number,
        required: true,
        min: [0, 'Previous stock cannot be negative']
      },
      newStock: {
        type: Number,
        required: true,
        min: [0, 'New stock cannot be negative']
      },
      method: {
        type: String,
        enum: ['manual', 'auto_restock', 'scheduled'],
        default: 'auto_restock'
      },
      triggeredBy: {
        type: String,
        default: 'system'
      },
      reason: String
    }],
    settings: {
      alertBeforeRestock: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      minimumRestockInterval: {
        type: Number, // Hours
        default: 24,
        min: [1, 'Minimum restock interval must be at least 1 hour'],
        max: [168, 'Minimum restock interval cannot exceed 1 week (168 hours)']
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock status (your existing virtual)
surgicalItemSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'Out of Stock';
  if (this.quantity <= this.minStockLevel) return 'Low Stock';
  return 'Available';
});

// ✅ NEW: Virtual for auto-restock status
surgicalItemSchema.virtual('autoRestockStatus').get(function() {
  if (!this.autoRestock.enabled) return 'Disabled';
  
  const needsRestock = this.quantity <= this.minStockLevel;
  const hasRecentRestock = this.autoRestock.lastAutoRestock && 
    (Date.now() - this.autoRestock.lastAutoRestock.getTime()) < (this.autoRestock.settings.minimumRestockInterval * 60 * 60 * 1000);
  
  if (needsRestock && hasRecentRestock) return 'Recently Restocked';
  if (needsRestock) return 'Needs Restock';
  return 'Active';
});

// ✅ NEW: Virtual for restock recommendation
surgicalItemSchema.virtual('restockRecommendation').get(function() {
  if (!this.autoRestock.enabled || this.quantity > this.minStockLevel) {
    return null;
  }
  
  const currentStock = this.quantity;
  const minStock = this.minStockLevel;
  const maxStock = this.autoRestock.maxStockLevel || (minStock * 3);
  
  let recommendedQuantity;
  if (this.autoRestock.restockMethod === 'fixed_quantity') {
    recommendedQuantity = this.autoRestock.reorderQuantity;
  } else {
    recommendedQuantity = maxStock - currentStock;
  }
  
  return {
    currentStock,
    minStock,
    maxStock,
    recommendedQuantity,
    newTotal: currentStock + recommendedQuantity,
    method: this.autoRestock.restockMethod,
    estimatedCost: (this.price * recommendedQuantity).toFixed(2)
  };
});

// Index for efficient searching (your existing indexes)
surgicalItemSchema.index({ name: 'text', description: 'text', category: 'text' });
surgicalItemSchema.index({ category: 1, status: 1 });
surgicalItemSchema.index({ quantity: 1 });

// ✅ NEW: Additional indexes for auto-restock functionality
surgicalItemSchema.index({ 'autoRestock.enabled': 1, quantity: 1, minStockLevel: 1 });
surgicalItemSchema.index({ 'autoRestock.lastAutoRestock': 1 });
surgicalItemSchema.index({ 'autoRestock.nextScheduledCheck': 1 });
surgicalItemSchema.index({ 
  'autoRestock.enabled': 1, 
  'autoRestock.settings.minimumRestockInterval': 1 
});

// Middleware to update status based on quantity (your existing middleware)
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

// ✅ NEW: Additional middleware for auto-restock logic
surgicalItemSchema.pre('save', function(next) {
  // Auto-configure max stock level if not set and auto-restock is enabled
  if (this.autoRestock.enabled && !this.autoRestock.maxStockLevel) {
    this.autoRestock.maxStockLevel = this.minStockLevel * 3;
  }
  
  // Auto-configure reorder quantity if not set and using fixed method
  if (this.autoRestock.enabled && 
      this.autoRestock.restockMethod === 'fixed_quantity' && 
      !this.autoRestock.reorderQuantity) {
    this.autoRestock.reorderQuantity = this.minStockLevel * 2;
  }
  
  // Set next scheduled check if auto-restock is enabled
  if (this.autoRestock.enabled && !this.autoRestock.nextScheduledCheck) {
    this.autoRestock.nextScheduledCheck = new Date(Date.now() + (30 * 60 * 1000)); // 30 minutes from now
  }
  
  next();
});

// ✅ NEW: Method to check if item needs auto-restock
surgicalItemSchema.methods.needsAutoRestock = function() {
  if (!this.autoRestock.enabled) return false;
  if (this.quantity > this.minStockLevel) return false;
  
  // Check if minimum interval has passed since last restock
  if (this.autoRestock.lastAutoRestock) {
    const timeSinceLastRestock = Date.now() - this.autoRestock.lastAutoRestock.getTime();
    const minimumInterval = this.autoRestock.settings.minimumRestockInterval * 60 * 60 * 1000; // Convert hours to ms
    
    if (timeSinceLastRestock < minimumInterval) {
      return false;
    }
  }
  
  return true;
};

// ✅ NEW: Method to calculate restock amount
surgicalItemSchema.methods.calculateRestockAmount = function() {
  if (!this.needsAutoRestock()) return 0;
  
  const currentStock = this.quantity;
  const maxStock = this.autoRestock.maxStockLevel || (this.minStockLevel * 3);
  
  if (this.autoRestock.restockMethod === 'fixed_quantity') {
    return this.autoRestock.reorderQuantity || this.minStockLevel;
  } else {
    // Restock to maximum level
    return Math.max(0, maxStock - currentStock);
  }
};

// ✅ NEW: Method to perform auto-restock
surgicalItemSchema.methods.performAutoRestock = function() {
  const restockAmount = this.calculateRestockAmount();
  
  if (restockAmount <= 0) return false;
  
  const previousStock = this.quantity;
  this.quantity += restockAmount;
  
  // Add to restock history
  this.autoRestock.restockHistory.push({
    date: new Date(),
    quantityAdded: restockAmount,
    previousStock: previousStock,
    newStock: this.quantity,
    method: 'auto_restock',
    triggeredBy: 'system',
    reason: `Auto-restock triggered: quantity (${previousStock}) <= minStock (${this.minStockLevel})`
  });
  
  // Update auto-restock tracking
  this.autoRestock.lastAutoRestock = new Date();
  this.autoRestock.autoRestockCount += 1;
  this.autoRestock.lastAutoRestockQuantity = restockAmount;
  this.autoRestock.nextScheduledCheck = new Date(Date.now() + (30 * 60 * 1000)); // Next check in 30 minutes
  this.lastRestocked = new Date();
  
  return {
    success: true,
    previousStock,
    restockAmount,
    newStock: this.quantity,
    method: this.autoRestock.restockMethod
  };
};

// ✅ NEW: Static method to find items needing auto-restock
surgicalItemSchema.statics.findItemsNeedingAutoRestock = function() {
  return this.find({
    'autoRestock.enabled': true,
    isActive: true,
    $expr: {
      $lte: [
        { $toInt: '$quantity' },
        { $toInt: '$minStockLevel' }
      ]
    }
  });
};

// ✅ NEW: Static method to get auto-restock statistics
surgicalItemSchema.statics.getAutoRestockStats = async function() {
  const totalAutoRestockEnabled = await this.countDocuments({ 'autoRestock.enabled': true, isActive: true });
  const itemsNeedingRestock = await this.countDocuments({
    'autoRestock.enabled': true,
    isActive: true,
    $expr: {
      $lte: [
        { $toInt: '$quantity' },
        { $toInt: '$minStockLevel' }
      ]
    }
  });
  
  const recentRestocks = await this.countDocuments({
    'autoRestock.lastAutoRestock': {
      $gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) // Last 24 hours
    }
  });
  
  return {
    totalAutoRestockEnabled,
    itemsNeedingRestock,
    recentRestocks: recentRestocks,
    autoRestockCoverage: totalAutoRestockEnabled > 0 ? 
      ((totalAutoRestockEnabled - itemsNeedingRestock) / totalAutoRestockEnabled * 100).toFixed(1) + '%' : '0%'
  };
};

// ✅ CRITICAL FIX: Use this pattern to prevent OverwriteModelError (your existing pattern)
const SurgicalItem = mongoose.models.SurgicalItem || mongoose.model('SurgicalItem', surgicalItemSchema);

export default SurgicalItem;
