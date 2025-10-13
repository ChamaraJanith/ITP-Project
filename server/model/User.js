import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const patientSchema = new mongoose.Schema({
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
  phone: { 
    type: String, 
    trim: true
  },
  gender: { 
    type: String, 
    enum: ["male", "female", "other"],
    lowercase: true,
    default: "other"
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
  medicalHistory: [{ 
    type: String 
  }],
  allergies: [{ 
    type: String 
  }],
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false // Don't include password in queries by default
  },
  role: { 
    type: String, 
    default: "patient",
    lowercase: true,
    enum: ["patient", "doctor", "admin"]
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
patientSchema.pre("save", async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();
  
  try {
    // Hash password with cost factor of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for patient's age
patientSchema.virtual("age").get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Create and export the model
const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);
export default Patient;