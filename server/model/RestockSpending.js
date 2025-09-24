import mongoose from 'mongoose';

const restockSpendingSchema = new mongoose.Schema({
  totalRestockValue: { 
    type: Number, 
    default: 0,
    required: true 
  },
  monthlyRestockValue: { 
    type: Number, 
    default: 0,
    required: true 
  },
  restockHistory: [{
    action: {
      type: String,
      required: true
    },
    restockValue: {
      type: Number,
      required: true
    },
    timestamp: {
      type: String,
      required: true
    },
    admin: {
      type: String,
      required: true
    },
    details: {
      type: Object,
      default: {}
    }
  }]
}, {
  timestamps: true
});

const RestockSpending = mongoose.model('RestockSpending', restockSpendingSchema);

export default RestockSpending;