const mongoose = require('mongoose');

const restockOrderSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurgicalItem', required: true },
  itemName: { type: String, required: true },
  currentStock: { type: Number, required: true },
  minStockLevel: { type: Number, required: true },
  reorderQuantity: { type: Number, required: true },
  supplier: {
    name: { type: String, required: true },
    contact: { type: String },
    email: { type: String }
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'ORDERED', 'DELIVERED', 'CANCELLED', 'ERROR'],
    default: 'PENDING'
  },
  urgency: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  estimatedCost: { type: Number },
  actualCost: { type: Number },
  purchaseOrderId: { type: String },
  expectedDelivery: { type: Date },
  actualDelivery: { type: Date },
  createdAt: { type: Date, default: Date.now },
  approvedBy: { type: String },
  notes: { type: String },
  errorMessage: { type: String }
});

module.exports = mongoose.model('RestockOrder', restockOrderSchema);
