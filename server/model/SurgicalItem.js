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
      'Oxigen Delivery Equipment',
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

  // 🔥 NEW: Usage tracking for auto-restock simulation
  usage: {
    totalUsed: { 
      type: Number, 
      default: 0,
      min: [0, 'Total used cannot be negative']
    },
    totalUsedValue: { 
      type: Number, 
      default: 0,
      min: [0, 'Total used value cannot be negative']
    },
    history: [{
      amount: {
        type: Number,
        required: true,
        min: [0, 'Usage amount cannot be negative']
      },
      value: {
        type: Number,
        required: true,
        min: [0, 'Usage value cannot be negative']
      },
      date: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['manual', 'auto_simulation', 'patient_use', 'disposal', 'other'],
        default: 'manual'
      },
      reason: {
        type: String,
        maxlength: [200, 'Usage reason cannot exceed 200 characters']
      },
      performedBy: {
        type: String,
        default: 'system'
      }
    }]
  },

  disposalHistory: [{
    quantityDisposed: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      maxLength: 500
    },
    disposedBy: {
      type: String,
      required: true,
      maxLength: 100
    },
    disposalDate: {
      type: Date,
      default: Date.now
    },
    previousQuantity: {
      type: Number,
      required: true
    },
    remainingQuantity: {
      type: Number,
      required: true
    },
    disposalType: {
      type: String,
      enum: ['manual', 'bulk', 'auto', 'expired'],
      default: 'manual'
    },
    operation: String,
    purpose: String,
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 🔥 NEW: Restock tracking for complete inventory lifecycle
  restock: {
    totalRestocked: { 
      type: Number, 
      default: 0,
      min: [0, 'Total restocked cannot be negative']
    },
    totalRestockValue: { 
      type: Number, 
      default: 0,
      min: [0, 'Total restock value cannot be negative']
    },
    history: [{
      amount: {
        type: Number,
        required: true,
        min: [0, 'Restock amount cannot be negative']
      },
      value: {
        type: Number,
        required: true,
        min: [0, 'Restock value cannot be negative']
      },
      date: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['manual', 'auto_restock', 'scheduled', 'emergency', 'bulk_order'],
        default: 'auto_restock'
      },
      reason: {
        type: String,
        maxlength: [200, 'Restock reason cannot exceed 200 characters']
      },
      supplierOrder: {
        type: String,
        maxlength: [100, 'Supplier order number cannot exceed 100 characters']
      },
      emailSent: {
        type: Boolean,
        default: false
      },
      performedBy: {
        type: String,
        default: 'system'
      },
      previousStock: {
        type: Number,
        min: [0, 'Previous stock cannot be negative']
      },
      newStock: {
        type: Number,
        min: [0, 'New stock cannot be negative']
      }
    }]
  },

  // Auto-restock configuration (enhanced)
  autoRestock: {
    enabled: { 
      type: Boolean, 
      default: false,
      index: true
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
      index: true
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
    // 🔥 NEW: Enhanced tracking for usage simulation
    lastUsageSimulated: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Last usage simulated amount cannot be negative']
      },
      value: {
        type: Number,
        default: 0,
        min: [0, 'Last usage simulated value cannot be negative']
      },
      date: {
        type: Date
      }
    },
    lastSupplierOrder: {
      type: String,
      maxlength: [100, 'Supplier order number cannot exceed 100 characters']
    },
    lastEmailSent: {
      type: Boolean,
      default: false
    },
    lastEmailTime: {
      type: Date
    },
    lastRestockMethod: {
      type: String,
      enum: ['to_max', 'fixed_quantity', 'auto']
    },
    usedManualQuantity: {
      type: Boolean,
      default: false
    },
    nextScheduledCheck: {
      type: Date,
      index: true
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

// 🔥 NEW: Enhanced virtuals with usage/restock tracking
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

// 🔥 NEW: Inventory value tracking virtual
surgicalItemSchema.virtual('inventoryValue').get(function() {
  const currentValue = this.quantity * this.price;
  const totalUsedValue = this.usage.totalUsedValue || 0;
  const totalRestockValue = this.restock.totalRestockValue || 0;
  const netValue = totalRestockValue - totalUsedValue;
  
  return {
    currentStockValue: currentValue.toFixed(2),
    totalUsedValue: totalUsedValue.toFixed(2),
    totalRestockValue: totalRestockValue.toFixed(2),
    netValueChange: netValue.toFixed(2),
    pricePerUnit: this.price.toFixed(2)
  };
});

// 🔥 NEW: Usage analytics virtual
surgicalItemSchema.virtual('usageAnalytics').get(function() {
  const totalUsed = this.usage.totalUsed || 0;
  const totalRestocked = this.restock.totalRestocked || 0;
  const netStockChange = totalRestocked - totalUsed;
  
  return {
    totalUsed,
    totalRestocked,
    netStockChange,
    usageRate: totalUsed > 0 ? (totalUsed / (this.usage.history?.length || 1)).toFixed(2) : '0',
    restockEfficiency: totalRestocked > 0 ? ((this.quantity / totalRestocked) * 100).toFixed(1) + '%' : '0%'
  };
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
    estimatedCost: (this.price * recommendedQuantity).toFixed(2),
    // 🔥 NEW: Enhanced recommendation with usage data
    recentUsage: this.usage.totalUsed || 0,
    averageRestockAmount: this.restock.totalRestocked > 0 ? 
      (this.restock.totalRestocked / (this.restock.history?.length || 1)).toFixed(1) : '0',
    lastUsageSimulated: this.autoRestock.lastUsageSimulated?.amount || 0
  };
});

// Indexes (optimized for usage/restock queries)
surgicalItemSchema.index({ name: 'text', description: 'text', category: 'text' });
surgicalItemSchema.index({ category: 1, status: 1 });
surgicalItemSchema.index({ quantity: 1 });
surgicalItemSchema.index({ 'autoRestock.enabled': 1, quantity: 1, minStockLevel: 1 });
surgicalItemSchema.index({ 
  'autoRestock.enabled': 1, 
  'autoRestock.settings.minimumRestockInterval': 1 
});
// 🔥 NEW: Indexes for usage/restock analytics
surgicalItemSchema.index({ 'usage.totalUsed': 1 });
surgicalItemSchema.index({ 'restock.totalRestocked': 1 });
surgicalItemSchema.index({ 'usage.history.date': 1 });
surgicalItemSchema.index({ 'restock.history.date': 1 });

// Middleware (enhanced)
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

// 🔥 NEW: Enhanced methods with usage/restock support
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

// 🔥 NEW: Method to simulate usage for testing
surgicalItemSchema.methods.simulateUsage = function(amount, reason = 'Simulated consumption') {
  if (!amount || amount <= 0 || amount > this.quantity) return false;
  
  const usageValue = this.price * amount;
  const previousStock = this.quantity;
  
  this.quantity -= amount;
  this.usage.totalUsed += amount;
  this.usage.totalUsedValue += usageValue;
  this.usage.history.push({
    amount: amount,
    value: usageValue,
    date: new Date(),
    type: 'auto_simulation',
    reason: reason,
    performedBy: 'system'
  });
  
  return {
    success: true,
    previousStock,
    usageAmount: amount,
    usageValue,
    newStock: this.quantity
  };
};

// 🔥 NEW: Enhanced auto-restock method
surgicalItemSchema.methods.performAutoRestock = function(customAmount = null, trackUsage = false) {
  const restockAmount = customAmount || this.calculateRestockAmount();
  if (restockAmount <= 0) return false;
  
  const previousStock = this.quantity;
  const restockValue = this.price * restockAmount;
  
  this.quantity += restockAmount;
  
  // Update restock tracking
  this.restock.totalRestocked += restockAmount;
  this.restock.totalRestockValue += restockValue;
  this.restock.history.push({
    amount: restockAmount,
    value: restockValue,
    date: new Date(),
    type: 'auto_restock',
    reason: `Auto-restock triggered: quantity (${previousStock}) <= minStock (${this.minStockLevel})`,
    performedBy: 'system',
    previousStock: previousStock,
    newStock: this.quantity
  });
  
  // Update autoRestock fields
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
    restockValue,
    newStock: this.quantity,
    method: this.autoRestock.restockMethod
  };
};

// Statics (enhanced with new tracking)
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

// 🔥 NEW: Get comprehensive usage/restock statistics
surgicalItemSchema.statics.getInventoryAnalytics = async function() {
  const pipeline = [
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalCurrentValue: { $sum: { $multiply: ['$quantity', '$price'] } },
        totalUsedValue: { $sum: '$usage.totalUsedValue' },
        totalRestockValue: { $sum: '$restock.totalRestockValue' },
        totalUsedQuantity: { $sum: '$usage.totalUsed' },
        totalRestockedQuantity: { $sum: '$restock.totalRestocked' },
        itemsWithAutoRestock: { 
          $sum: { $cond: ['$autoRestock.enabled', 1, 0] } 
        },
        lowStockItems: { 
          $sum: { 
            $cond: [
              { $lte: ['$quantity', '$minStockLevel'] }, 
              1, 
              0
            ] 
          } 
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  const stats = result[0] || {};
  
  return {
    totalItems: stats.totalItems || 0,
    currentInventoryValue: (stats.totalCurrentValue || 0).toFixed(2),
    totalUsageValue: (stats.totalUsedValue || 0).toFixed(2),
    totalRestockValue: (stats.totalRestockValue || 0).toFixed(2),
    netInventoryValue: ((stats.totalRestockValue || 0) - (stats.totalUsedValue || 0)).toFixed(2),
    totalUsedQuantity: stats.totalUsedQuantity || 0,
    totalRestockedQuantity: stats.totalRestockedQuantity || 0,
    netQuantityChange: (stats.totalRestockedQuantity || 0) - (stats.totalUsedQuantity || 0),
    autoRestockCoverage: stats.totalItems > 0 ? 
      ((stats.itemsWithAutoRestock / stats.totalItems) * 100).toFixed(1) + '%' : '0%',
    lowStockItems: stats.lowStockItems || 0,
    inventoryHealth: stats.lowStockItems === 0 ? 'Excellent' : 
      stats.lowStockItems <= 5 ? 'Good' : 'Needs Attention'
  };
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

// Dev-safe export to prevent OverwriteModelError
const MODEL_NAME = 'SurgicalItem';
if (process.env.NODE_ENV !== 'production') {
  try { mongoose.deleteModel(MODEL_NAME); } catch (_) {}
}
const SurgicalItem =
  mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, surgicalItemSchema);

export default SurgicalItem;
