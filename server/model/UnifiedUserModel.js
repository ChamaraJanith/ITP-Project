// model/UnifiedUserModel.js - Admin fields only
import mongoose from "mongoose";

const unifiedUserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Admin role system
  role: {
    type: String,
    enum: ['admin', 'receptionist', 'doctor', 'financial_manager'],
    required: true
  },
  
  // Admin permissions
  permissions: [{
    type: String,
    enum: [
      'manage_appointments', 'view_patients', 'add_patient', 'check_in_patients',
      'view_medical_records', 'create_prescriptions', 'update_patient_records',
      'view_billing', 'manage_payments', 'generate_reports',
      'manage_users', 'manage_system_settings', 'view_all_data'
    ]
  }],
  
  // Admin-specific fields
  employeeId: { type: String, sparse: true, unique: true },
  department: {
    type: String,
    enum: ['reception', 'medical', 'finance', 'administration'],
    required: true
  },
  specialization: { type: String, default: '' },
  
  // System fields
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
  isAccountVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Auto-assign permissions based on role
unifiedUserSchema.pre('save', function(next) {
  if (this.isNew && !this.employeeId) {
    this.employeeId = `EMP-${this.role.toUpperCase().substring(0, 3)}-${Date.now()}`;
  }
  
  // Auto-assign permissions
  switch(this.role) {
    case 'receptionist':
      this.permissions = ['manage_appointments', 'view_patients', 'add_patient', 'check_in_patients'];
      this.department = 'reception';
      break;
    case 'doctor':
      this.permissions = ['view_medical_records', 'create_prescriptions', 'update_patient_records', 'view_patients'];
      this.department = 'medical';
      break;
    case 'financial_manager':
      this.permissions = ['view_billing', 'manage_payments', 'generate_reports'];
      this.department = 'finance';
      break;
    case 'admin':
      this.permissions = ['manage_users', 'manage_system_settings', 'view_all_data'];
      this.department = 'administration';
      break;
  }
  next();
});

const UnifiedUserModel = mongoose.model('UnifiedUser', unifiedUserSchema);
export default UnifiedUserModel;
