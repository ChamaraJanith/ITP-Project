import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    date: {
      type: Date, // better for querying
      required: true,
    },
    time: {
      type: String, // keep if you want to display separately
      required: true,
    },
    doctor: {
      type: String,
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient", // or "User" if that's your actual model
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
