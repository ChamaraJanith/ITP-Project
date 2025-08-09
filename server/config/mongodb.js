// config/mongodb.js
import mongoose from "mongoose";

// MongoDB connection event listeners
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected successfully");
});

mongoose.connection.on("error", err => {
  console.error("❌ MongoDB connection error:", err);
});

const connectDB = async () => {
  try {
    // Try all possible MongoDB URI variable names
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('No MongoDB URI found in environment variables');
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error("💥 MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
