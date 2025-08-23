const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: String,
  availableHours: [
    {
      day: String, // e.g., "Monday"
      startTime: String, // e.g., "09:00"
      endTime: String,   // e.g., "17:00"
    }
  ]
});

module.exports = mongoose.model("Doctor", doctorSchema);
