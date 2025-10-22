// backend/model/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import generateUserId from '../utils/generateUserId.js';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address"
    ]
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false
  },
  phone: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: "Phone number must be 10 digits"
    }
  },
  dateOfBirth: { 
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: "Date of birth cannot be in the future"
    }
  },
  gender: { 
    type: String, 
    enum: ["male", "female", "other", ""],
    lowercase: true,
    default: ""
  },
  role: { 
    type: String, 
    default: "user",
    lowercase: true,
    enum: ["user", "doctor", "admin", "receptionist", "financial_manager"]
  },
  
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationOtp: {
    type: String,
    select: false
  },
  verificationOtpExpiry: {
    type: Date,
    select: false
  },
  
  // Password Reset
  resetPasswordOtp: {
    type: String,
    select: false
  },
  resetPasswordOtpExpiry: {
    type: Date,
    select: false
  },
  
  // Medical Info
  medicalHistory: [{ type: String }],
  allergies: [{ type: String }],
  
  // Login tracking
  lastLogin: { type: Date }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  _id: false
});

// ==================== GENERATE UNIQUE USER ID ====================
userSchema.statics.generateUniqueUserId = async function(registrationDate = new Date()) {
  let userId;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (exists && attempts < maxAttempts) {
    userId = generateUserId(registrationDate);
    exists = await this.findOne({ userId });
    attempts++;
  }
  
  if (exists) {
    throw new Error('Failed to generate unique user ID after multiple attempts');
  }
  
  return userId;
};

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Validate OTP method
userSchema.methods.isValidOTP = function(otp, type = 'verification') {
  const otpField = type === 'verification' ? 'verificationOtp' : 'resetPasswordOtp';
  const expiryField = type === 'verification' ? 'verificationOtpExpiry' : 'resetPasswordOtpExpiry';
  
  return this[otpField] === otp && this[expiryField] > new Date();
};

// Virtual for user's age
userSchema.virtual("age").get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ createdAt: -1 });

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
