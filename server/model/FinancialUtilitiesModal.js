import mongoose from 'mongoose';

const FinancialUtilitiesSchema = new mongoose.Schema({
  utilityId: {
    type: String,
    required: [true, 'Utility ID is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v.length === 6 && /^[A-Z0-9]{6}$/.test(v);
      },
      message: 'Utility ID must be exactly 6 characters long and contain only uppercase letters and numbers'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Electricity', 'Water & Sewage', 'Waste Management', 'Internet & Communication', 'Generator Fuel', 'Other'],
      message: '{VALUE} is not a valid category'
    },
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    minlength: [5, 'Description must be at least 5 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0 && Number.isFinite(v);
      },
      message: 'Amount must be a valid positive number'
    }
  },
  billing_period_start: {
    type: Date,
    required: [true, 'Billing period start date is required'],
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Billing period start date cannot be in the future'
    }
  },
  billing_period_end: {
    type: Date,
    required: [true, 'Billing period end date is required']
    // REMOVED the problematic cross-field validation
    // Cross-field validation is now handled in the controller
  },
  payment_status: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['Pending', 'Paid', 'Overdue'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'Pending'
  },
  vendor_name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
    maxlength: [200, 'Vendor name cannot exceed 200 characters'],
    minlength: [2, 'Vendor name must be at least 2 characters']
  },
  invoice_number: {
    type: String,
    trim: true,
    maxlength: [100, 'Invoice number cannot exceed 100 characters'],
    sparse: true // Allows multiple documents with null/undefined values
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // Prevents modification after creation
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'financial_utilities',
  timestamps: false, // We're handling timestamps manually
  versionKey: false,
  strict: true
});

// Pre-save middleware to update the updatedAt field
FinancialUtilitiesSchema.pre('save', function(next) {
  // Add cross-field validation during save (for create operations)
  if (this.billing_period_end && this.billing_period_start) {
    if (this.billing_period_end < this.billing_period_start) {
      const error = new Error('Billing period end date must be after start date');
      error.name = 'ValidationError';
      return next(error);
    }
  }

  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware to update the updatedAt field
FinancialUtilitiesSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Static method to generate a unique 6-character utility ID
FinancialUtilitiesSchema.statics.generateUniqueId = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uniqueId;
  let isUnique = false;

  while (!isUnique) {
    uniqueId = '';
    for (let i = 0; i < 6; i++) {
      uniqueId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if this utility ID already exists
    const existingRecord = await this.findOne({ utilityId: uniqueId });
    if (!existingRecord) {
      isUnique = true;
    }
  }
  
  return uniqueId;
};

// Static method to find by utility ID
FinancialUtilitiesSchema.statics.findByUtilityId = function(utilityId) {
  return this.findOne({ utilityId: utilityId.toUpperCase() });
};

// FIXED: Static method to update by utility ID
FinancialUtilitiesSchema.statics.updateByUtilityId = function(utilityId, updateData, options = {}) {
  return this.findOneAndUpdate(
    { utilityId: utilityId.toUpperCase() }, 
    updateData, 
    { 
      new: true, 
      runValidators: false, // CHANGED: Disable validation since we handle it in controller
      context: 'query',
      ...options 
    }
  );
};

// Static method to delete by utility ID
FinancialUtilitiesSchema.statics.deleteByUtilityId = function(utilityId) {
  return this.findOneAndDelete({ utilityId: utilityId.toUpperCase() });
};

// ENHANCED: Static method to validate update data
FinancialUtilitiesSchema.statics.validateUpdateData = function(updateData, existingData) {
  const errors = [];

  // Validate cross-field date logic
  if (updateData.billing_period_start || updateData.billing_period_end) {
    const startDate = updateData.billing_period_start || existingData.billing_period_start;
    const endDate = updateData.billing_period_end || existingData.billing_period_end;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errors.push('Billing period end date must be after start date');
    }
  }

  // Validate future date
  if (updateData.billing_period_start && new Date(updateData.billing_period_start) > new Date()) {
    errors.push('Billing period start date cannot be in the future');
  }

  // Validate enum values
  if (updateData.category && !['Electricity', 'Water & Sewage', 'Waste Management', 'Internet & Communication', 'Generator Fuel', 'Other'].includes(updateData.category)) {
    errors.push('Invalid category selected');
  }

  if (updateData.payment_status && !['Pending', 'Paid', 'Overdue'].includes(updateData.payment_status)) {
    errors.push('Invalid payment status selected');
  }

  // Validate string lengths
  if (updateData.description !== undefined && (!updateData.description || updateData.description.trim().length < 5)) {
    errors.push('Description must be at least 5 characters long');
  }

  if (updateData.vendor_name !== undefined && (!updateData.vendor_name || updateData.vendor_name.trim().length < 2)) {
    errors.push('Vendor name must be at least 2 characters long');
  }

  // Validate amount
  if (updateData.amount !== undefined) {
    const amount = parseFloat(updateData.amount);
    if (isNaN(amount) || amount < 0) {
      errors.push('Amount must be a valid positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Instance method to calculate billing period duration
FinancialUtilitiesSchema.methods.getBillingPeriodDuration = function() {
  const diffTime = Math.abs(this.billing_period_end - this.billing_period_start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Static method to find overdue payments
FinancialUtilitiesSchema.statics.findOverduePayments = function() {
  return this.find({ payment_status: 'Overdue' });
};

// ENHANCED: Static method for comprehensive search
FinancialUtilitiesSchema.statics.searchUtilities = function(searchQuery, filters = {}) {
  const query = { ...filters };

  if (searchQuery) {
    query.$or = [
      { utilityId: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { vendor_name: { $regex: searchQuery, $options: 'i' } },
      { invoice_number: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  return this.find(query);
};

// Static method to get utilities summary
FinancialUtilitiesSchema.statics.getUtilitiesSummary = async function() {
  const summary = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUtilities: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$payment_status', 'Pending'] }, 1, 0] }
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$payment_status', 'Paid'] }, 1, 0] }
        },
        overdueCount: {
          $sum: { $cond: [{ $eq: ['$payment_status', 'Overdue'] }, 1, 0] }
        }
      }
    }
  ]);

  return summary[0] || {
    totalUtilities: 0,
    totalAmount: 0,
    avgAmount: 0,
    pendingCount: 0,
    paidCount: 0,
    overdueCount: 0
  };
};

// Index for better query performance
FinancialUtilitiesSchema.index({ utilityId: 1 }, { unique: true }); // Primary index for utilityId
FinancialUtilitiesSchema.index({ category: 1, payment_status: 1 });
FinancialUtilitiesSchema.index({ billing_period_start: 1, billing_period_end: 1 });
FinancialUtilitiesSchema.index({ vendor_name: 1 });
FinancialUtilitiesSchema.index({ payment_status: 1, billing_period_end: 1 }); // For overdue tracking
FinancialUtilitiesSchema.index({ createdAt: -1 }); // For recent records
FinancialUtilitiesSchema.index({ description: 'text', vendor_name: 'text' }); // Text search index

const FinancialUtilities = mongoose.model('FinancialUtilities', FinancialUtilitiesSchema);

export default FinancialUtilities;
