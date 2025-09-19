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

  // Auto-restock configuration
  autoRestock: {
    enabled: { 
      type: Boolean, 
      default: false,
      index: true // path-level single-field index kept
    },
    maxStockLevel: { 
      type: Number, 
      default: 0,
      min: [0, 'Maximum stock level cannot be negative'],
      validate: {
        validator: function(val) {
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
      index: true // keep path-level single-field index; remove schema-level duplicate
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
      index: true // keep path-level single-field index; remove schema-level duplicate
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

// Virtuals
surgicalItemSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'Out of Stock';
  if (this.quantity <= this.minStockLevel) return 'Low Stock';
  return 'Available';
});

surgicalItemSchema.virtual('autoRestockStatus').get(function() {
  if (!this.autoRestock.enabled) return 'Disabled';
  const needsRestock = this.quantity <= this.minStockLevel;
  const hasRecentRestock = this.autoRestock.lastAutoRestock && 
    (Date.now() - this.autoRestock.lastAutoRestock.getTime()) < (this.autoRestock.settings.minimumRestockInterval * 60 * 60 * 1000);
  if (needsRestock && hasRecentRestock) return 'Recently Restocked';
  if (needsRestock) return 'Needs Restock';
  return 'Active';
});

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

// Indexes
surgicalItemSchema.index({ name: 'text', description: 'text', category: 'text' });
surgicalItemSchema.index({ category: 1, status: 1 });
surgicalItemSchema.index({ quantity: 1 });

// Additional indexes for auto-restock functionality
surgicalItemSchema.index({ 'autoRestock.enabled': 1, quantity: 1, minStockLevel: 1 });
// Removed duplicates of single-field indexes below; path-level index:true is retained
// surgicalItemSchema.index({ 'autoRestock.lastAutoRestock': 1 });
// surgicalItemSchema.index({ 'autoRestock.nextScheduledCheck': 1 });
surgicalItemSchema.index({ 
  'autoRestock.enabled': 1, 
  'autoRestock.settings.minimumRestockInterval': 1 
});

// Middleware
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

surgicalItemSchema.pre('save', function(next) {
  if (this.autoRestock.enabled && !this.autoRestock.maxStockLevel) {
    this.autoRestock.maxStockLevel = this.minStockLevel * 3;
  }
  if (this.autoRestock.enabled && 
      this.autoRestock.restockMethod === 'fixed_quantity' && 
      !this.autoRestock.reorderQuantity) {
    this.autoRestock.reorderQuantity = this.minStockLevel * 2;
  }
  if (this.autoRestock.enabled && !this.autoRestock.nextScheduledCheck) {
    this.autoRestock.nextScheduledCheck = new Date(Date.now() + (1 * 60 * 1000));
  }
  next();
});

// Methods
surgicalItemSchema.methods.needsAutoRestock = function() {
  if (!this.autoRestock.enabled) return false;
  if (this.quantity > this.minStockLevel) return false;
  if (this.autoRestock.lastAutoRestock) {
    const timeSinceLastRestock = Date.now() - this.autoRestock.lastAutoRestock.getTime();
    const minimumInterval = this.autoRestock.settings.minimumRestockInterval * 60 * 60 * 1000;
    if (timeSinceLastRestock < minimumInterval) {
      return false;
    }
  }
  return true;
};

surgicalItemSchema.methods.calculateRestockAmount = function() {
  if (!this.needsAutoRestock()) return 0;
  const currentStock = this.quantity;
  const maxStock = this.autoRestock.maxStockLevel || (this.minStockLevel * 3);
  if (this.autoRestock.restockMethod === 'fixed_quantity') {
    return this.autoRestock.reorderQuantity || this.minStockLevel;
  } else {
    return Math.max(0, maxStock - currentStock);
  }
};

surgicalItemSchema.methods.performAutoRestock = function() {
  const restockAmount = this.calculateRestockAmount();
  if (restockAmount <= 0) return false;
  const previousStock = this.quantity;
  this.quantity += restockAmount;
  this.autoRestock.restockHistory.push({
    date: new Date(),
    quantityAdded: restockAmount,
    previousStock: previousStock,
    newStock: this.quantity,
    method: 'auto_restock',
    triggeredBy: 'system',
    reason: `Auto-restock triggered: quantity (${previousStock}) <= minStock (${this.minStockLevel})`
  });
  this.autoRestock.lastAutoRestock = new Date();
  this.autoRestock.autoRestockCount += 1;
  this.autoRestock.lastAutoRestockQuantity = restockAmount;
  this.autoRestock.nextScheduledCheck = new Date(Date.now() + (1 * 60 * 1000));
  this.lastRestocked = new Date();
  return {
    success: true,
    previousStock,
    restockAmount,
    newStock: this.quantity,
    method: this.autoRestock.restockMethod
  };
};

// Statics
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
      $gte: new Date(Date.now() - (24 * 60 * 60 * 1000))
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

// Dev-safe export to prevent OverwriteModelError and duplicate model compilation during HMR
const MODEL_NAME = 'SurgicalItem';
if (process.env.NODE_ENV !== 'production') {
  try { mongoose.deleteModel(MODEL_NAME); } catch (_) {}
}
const SurgicalItem =
  mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, surgicalItemSchema);

export default SurgicalItem;
