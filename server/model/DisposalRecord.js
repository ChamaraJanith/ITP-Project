// models/DisposalRecord.js

import mongoose from 'mongoose';
const { Schema } = mongoose;

const DisposalRecordSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'SurgicalItem', required: true },
  itemName: { type: String, required: true },
  category: { type: String },
  quantityDisposed: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  disposedBy: { type: String, required: true },
  disposedDate: { type: Date, default: Date.now },
  estimatedValue: { type: Number, required: true },
  disposalType: { type: String, default: 'manual' },
  batchDisposal: { type: Boolean, default: false },
  metadata: {
    previousQuantity: { type: Number },
    remainingQuantity: { type: Number },
    unitPrice: { type: Number },
    batchId: { type: String }
  }
});

// Index for fast queries by disposedDate
DisposalRecordSchema.index({ disposedDate: -1 });

export default mongoose.model('DisposalRecord', DisposalRecordSchema);
