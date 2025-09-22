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
    required: [true, 'Billing period end date is required'],
    validate: {
      validator: function(v) {
        return v >= this.billing_period_start;
      },
      message: 'Billing period end date must be after start date'
    }
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

// Static method to update by utility ID
FinancialUtilitiesSchema.statics.updateByUtilityId = function(utilityId, updateData, options = {}) {
  return this.findOneAndUpdate(
    { utilityId: utilityId.toUpperCase() }, 
    updateData, 
    { new: true, runValidators: true, ...options }
  );
};

// Static method to delete by utility ID
FinancialUtilitiesSchema.statics.deleteByUtilityId = function(utilityId) {
  return this.findOneAndDelete({ utilityId: utilityId.toUpperCase() });
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

// Index for better query performance
FinancialUtilitiesSchema.index({ utilityId: 1 }, { unique: true }); // Primary index for utilityId
FinancialUtilitiesSchema.index({ category: 1, payment_status: 1 });
FinancialUtilitiesSchema.index({ billing_period_start: 1, billing_period_end: 1 });
FinancialUtilitiesSchema.index({ vendor_name: 1 });
FinancialUtilitiesSchema.index({ payment_status: 1, billing_period_end: 1 }); // For overdue tracking
FinancialUtilitiesSchema.index({ createdAt: -1 }); // For recent records


const FinancialUtilities = mongoose.model('FinancialUtilities', FinancialUtilitiesSchema);

export default FinancialUtilities;
