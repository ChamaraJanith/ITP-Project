import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    doctor: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
