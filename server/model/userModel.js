import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: false
  },
  role: {
    type: String,
    // FIXED: Added 'patient' and 'Patient' to enum values
    enum: ['user', 'admin', 'doctor', 'receptionist', 'financial', 'patient', 'Patient'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Email verification fields
  verificationOtp: {
    type: String,
    required: false
  },
  verificationOtpExpiry: {
    type: Date,
    required: false
  },
  
  // Password reset fields
  resetPasswordOtp: {
    type: String,
    required: false
  },
  resetPasswordOtpExpiry: {
    type: Date,
    required: false
  },
  
  // Additional user info
  dateOfBirth: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: false
  },
  address: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zipCode: { type: String, required: false },
    country: { type: String, required: false, default: 'Sri Lanka' }
  },
  
  // Medical information
  emergencyContact: {
    name: { type: String, required: false },
    phone: { type: String, required: false },
    relationship: { type: String, required: false }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    required: false
  },
  
  // Profile image
  profileImage: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordOtp;
      delete ret.resetPasswordOtpExpiry;
      delete ret.verificationOtp;
      delete ret.verificationOtpExpiry;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ resetPasswordOtp: 1 });
userSchema.index({ verificationOtp: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Instance method to check if OTP is valid and not expired
userSchema.methods.isValidOTP = function(otp, type = 'reset') {
  const now = new Date();
  
  if (type === 'reset') {
    return this.resetPasswordOtp === otp && 
           this.resetPasswordOtpExpiry && 
           this.resetPasswordOtpExpiry > now;
  } else if (type === 'verification') {
    return this.verificationOtp === otp && 
           this.verificationOtpExpiry && 
           this.verificationOtpExpiry > now;
  }
  
  return false;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Pre-save middleware to hash password if modified
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and not already hashed
  if (!this.isModified('password')) return next();
  
  // Don't hash if password is already hashed (starts with $2a$ or $2b$)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }
  
  try {
    const bcrypt = await import('bcryptjs');
    this.password = await bcrypt.default.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.default.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Fix for model overwrite error
let userModel;
try {
  // Try to get existing model first
  userModel = mongoose.model('User');
} catch (error) {
  // If model doesn't exist, create it
  userModel = mongoose.model('User', userSchema);
}

export default userModel;