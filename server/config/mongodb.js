import mongoose from "mongoose";

mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully");
});

mongoose.connection.on("error", err => {
    console.error("MongoDB connection error:", err);
});

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/SERVER`); // <-- Use backticks!
        // No need to log here if you log on event, or keep both if you want
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;
