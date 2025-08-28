import mongoose from "mongoose";
import 'dotenv/config';
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" }
  },
    // name: { type: String, required: true },
    // email: { type: String, required: true, unique: true },
    // phone: { type: String },
    // age: { type: Number },
    // gender: { type: String, enum: ["Male", "Female", "Other"] },
    // address: { type: String },
    // medicalHistory: { type: String },
    // allergies: { type: String },
    // password: { type: String, required: true },
    // role: { type: String, default: "Patient" }
  
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};



// ✅ Create the model
const User = mongoose.model("User", userSchema);

// ✅ Export the model
export default User;
