const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Booking = require("../models/Booking");

// Create a booking
router.post("/", async (req, res) => {
  try {
    const { patientName, doctorId, date, time } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check doctor availability for that day
    const bookingDate = new Date(date);
    const day = bookingDate.toLocaleString("en-US", { weekday: "long" });

    const available = doctor.availableHours.find(h => h.day === day);
    if (!available) {
      return res.status(400).json({ message: "Doctor not available on this day" });
    }

    // Check time is within available slot
    if (!(time >= available.startTime && time <= available.endTime)) {
      return res.status(400).json({ message: "Selected time is outside doctor's hours" });
    }

    // Check if slot already booked
    const existing = await Booking.findOne({ doctor: doctorId, date, time });
    if (existing) {
      return res.status(400).json({ message: "Time slot already booked" });
    }

    const booking = new Booking({ patientName, doctor: doctorId, date, time });
    await booking.save();

    res.status(201).json({ message: "Booking confirmed", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("doctor", "name specialization");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
