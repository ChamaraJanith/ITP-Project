import mongoose from "mongoose";

// Medicine schema
const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, trim: true },
  duration: { type: String, required: true, trim: true },
  notes: { type: String, trim: true, default: "" },
});

// Prescription schema
const PrescriptionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    diagnosis: { type: String, required: true, trim: true },
    medicines: { type: [MedicineSchema], default: [] },
    notes: { type: String, trim: true, default: "" },

    // Patient details
    patientId: { type: String, required: true }, // String for custom generated patient ID
    patientName: { type: String, required: true },
    patientEmail: { type: String },
    patientPhone: { type: String },
    patientGender: { type: String },
    patientBloodGroup: { type: String },
    patientDateOfBirth: { type: Date },
    patientAllergies: { type: [String], default: [] },

    // Doctor details
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorSpecialization: { type: String, default: "" },

    // Google Cloud Storage fields for PDF
    pdfUrl: { type: String }, // Signed URL for accessing the PDF
    pdfFileName: { type: String }, // File path in Google Cloud Storage
    pdfGsUrl: { type: String }, // gs:// URL format
    pdfUploadedAt: { type: Date }, // When the PDF was uploaded
  },
  { timestamps: true }
);

// Add index for faster queries
PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });

// Virtual for prescription ID display
PrescriptionSchema.virtual('prescriptionId').get(function() {
  return `RX-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Ensure virtuals are included in JSON
PrescriptionSchema.set('toJSON', { virtuals: true });
PrescriptionSchema.set('toObject', { virtuals: true });

const Prescriptions = mongoose.model("Prescriptions", PrescriptionSchema);

export default Prescriptions;