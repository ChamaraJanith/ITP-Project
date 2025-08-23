import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const consultationSchema = new mongoose.Schema({
    doctor: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    notes: { type: String }, //optional
},{timestamps: true});

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;