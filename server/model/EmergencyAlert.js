// model/EmergencyAlert.js - Enhanced Version
import mongoose from 'mongoose';

const emergencyAlertSchema = new mongoose.Schema(
  {
    // Patient Information
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
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    patientBloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    patientAllergies: [{
      type: String
    }],
    
    // Alert Details
    type: {
      type: String,
      required: true,
      enum: ['Critical', 'Urgent', 'Non-urgent'],
      default: 'Non-urgent'
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    description: {
      type: String,
      required: true
    },
    symptoms: [{
      type: String
    }],
    location: {
      type: String,
      default: 'Unknown'
    },
    
    // Vital Signs (if available)
    vitalSigns: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      heartRate: Number,
      temperature: Number,
      oxygenSaturation: Number,
      respiratoryRate: Number,
      bloodSugar: Number
    },
    
    // Status Management
    status: {
      type: String,
      required: true,
      enum: ['Active', 'In Progress', 'Resolved', 'Dismissed'],
      default: 'Active'
    },
    
    // Doctor Assignment
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
    
    // Resolution Information
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: String
    },
    resolutionTime: {
      type: Number // in minutes
    },
    
    // Additional Information
    notes: {
      type: String,
      default: ''
    },
    actionsTaken: [{
      action: String,
      takenBy: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: {
      type: Date
    },
    estimatedResolutionTime: {
      type: Number // in minutes
    },
    
    // Notification Status
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationChannels: [{
      channel: {
        type: String,
        enum: ['SMS', 'Email', 'Push', 'Call']
      },
      status: {
        type: String,
        enum: ['Sent', 'Delivered', 'Failed']
      },
      sentAt: Date
    }],
    
    // Emergency Contact Information
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String,
      notified: {
        type: Boolean,
        default: false
      },
      notifiedAt: Date
    }],
    
    // Audit Trail
    createdBy: {
      type: String,
      default: 'System'
    },
    lastModifiedBy: String,
    
    // Metadata
    tags: [String],
    attachments: [{
      filename: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for response time calculation
emergencyAlertSchema.virtual('responseTimeMinutes').get(function() {
  if (this.resolvedAt && this.createdAt) {
    return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60));
  }
  return null;
});

// Virtual field for urgency score
emergencyAlertSchema.virtual('urgencyScore').get(function() {
  let score = 0;
  if (this.type === 'Critical') score += 10;
  else if (this.type === 'Urgent') score += 7;
  else score += 3;
  
  if (this.priority === 'High') score += 3;
  else if (this.priority === 'Medium') score += 2;
  else score += 1;
  
  return score;
});

// Pre-save middleware to calculate resolution time
emergencyAlertSchema.pre('save', function(next) {
  if (this.status === 'Resolved' && this.resolvedAt && !this.resolutionTime) {
    this.resolutionTime = Math.round((this.resolvedAt - this.createdAt) / (1000 * 60));
  }
  next();
});

// Index for performance
emergencyAlertSchema.index({ status: 1, createdAt: -1 });
emergencyAlertSchema.index({ assignedDoctorId: 1, status: 1 });
emergencyAlertSchema.index({ patientId: 1 });
emergencyAlertSchema.index({ type: 1, priority: 1 });

const EmergencyAlert = mongoose.model('EmergencyAlert', emergencyAlertSchema);

export default EmergencyAlert;