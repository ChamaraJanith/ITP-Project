// ===== 1. EmergencyAlert.js (Model) =====
import mongoose from 'mongoose';

const emergencyAlertSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      ref: 'Patient'
    },
    patientName: {
      type: String,
      required: true
    },
    patientEmail: {
      type: String
    },
    patientPhone: {
      type: String
    },
    patientGender: {
      type: String
    },
    type: {
      type: String,
      required: true,
      enum: ['Critical', 'Urgent', 'Non-urgent'],
      default: 'Non-urgent'
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Resolved', 'Dismissed'],
      default: 'Active'
    },
    assignedDoctorId: {
      type: String,
      required: true
    },
    assignedDoctorName: {
      type: String,
      required: true
    },
    assignedDoctorSpecialization: {
      type: String,
      default: ''
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: String
    },
    notes: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);
export default EmergencyAlert;