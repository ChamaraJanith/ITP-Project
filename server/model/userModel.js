// model/userModel.js
import mongoose from "mongoose";

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
  verifyOtp: { 
    type: String, 
    default: '' 
  },
  verifyOtpExpireAt: { 
    type: Number, 
    default: 0 
  },
  isAccountVerified: { 
    type: Boolean, 
    default: false 
  },
  resetOtp: { 
    type: String, 
    default: '' 
  },
  resetOtpExpireAt: { 
    type: Number, 
    default: 0 
  },
  // Subscription fields
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscribedAt: {
    type: Date,
    default: null
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },
  subscriptionToken: {
    type: String,
    default: ''
  },
  subscriptionTokenExpiry: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
    default: 'user'
  },
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Remove the mongoose.models check - it can cause issues in development
const UserModel = mongoose.model('User', userSchema);
export default UserModel;
