import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  address: { type: String },
  medicalHistory: { type: String },
  allergies: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: "Patient" }
}, { timestamps: true });

export default mongoose.model("Patient", patientSchema);
