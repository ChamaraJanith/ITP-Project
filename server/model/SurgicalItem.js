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

// Index for efficient searching
surgicalItemSchema.index({ name: 'text', description: 'text', category: 'text' });
surgicalItemSchema.index({ category: 1, status: 1 });
surgicalItemSchema.index({ quantity: 1 });

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

const SurgicalItem = mongoose.model('SurgicalItem', surgicalItemSchema);

export default SurgicalItem;
