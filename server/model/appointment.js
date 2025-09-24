// server/models/Appointment.js

import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // Personal Information
    name: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    age: {
      type: Number,
      required: true,
      min: 0
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true
    },
    allergies: {
      type: String,
      trim: true,
      default: ""
    },

    // Appointment Details
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true,
      validate: {
        validator: v => /^\d{2}:\d{2}$/.test(v),
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    },
    doctorSpecialty: {
      type: String,
      required: true,
      trim: true
    },
    doctorName: {
      type: String,
      trim: true,
      default: ""
    },
    appointmentType: {
      type: String,
      enum: ["consultation", "follow-up", "checkup", "emergency"],
      required: true
    },
    symptoms: {
      type: String,
      trim: true,
      default: ""
    },
    urgency: {
      type: String,
      enum: ["normal", "urgent", "emergency"],
      default: "normal"
    },

    // Emergency Contact
    emergencyContactName: {
      type: String,
      trim: true,
      default: ""
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: ""
    },
    emergencyContactRelationship: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Avoid OverwriteModelError in watch mode
let Appointment;
try {
  Appointment = mongoose.model("Appointment");
} catch {
  Appointment = mongoose.model("Appointment", appointmentSchema);
}

export default Appointment;
