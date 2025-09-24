// server/controller/appointmentController.js

import Appointment from "../model/appointment.js";

// Create a new appointment
// server/controller/appointmentController.js


export const createAppointment = async (req, res) => {
  try {
    const {
      // Personal Information
      name,
      gender,
      dateOfBirth,
      age,
      email,
      phone,
      bloodGroup,
      allergies,
      // Appointment Details
      appointmentDate,
      appointmentTime,
      doctorSpecialty,
      doctorName,
      appointmentType,
      symptoms,
      urgency,
      // Emergency Contact
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !gender ||
      !dateOfBirth ||
      age == null ||
      !email ||
      !phone ||
      !bloodGroup ||
      !appointmentDate ||
      !appointmentTime ||
      !doctorSpecialty ||
      !appointmentType
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const newAppointment = new Appointment({
      name,
      gender,
      dateOfBirth,
      age,
      email,
      phone,
      bloodGroup,
      allergies: allergies || "",
      appointmentDate,
      appointmentTime,
      doctorSpecialty,
      doctorName: doctorName || "",
      appointmentType,
      symptoms: symptoms || "",
      urgency: urgency || "normal",
      emergencyContactName: emergencyContactName || "",
      emergencyContactPhone: emergencyContactPhone || "",
      emergencyContactRelationship: emergencyContactRelationship || ""
    });

    const saved = await newAppointment.save();
    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment: saved
    });
  } catch (error) {
    console.error("❌ createAppointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all appointments
export const getAppointments = async (req, res) => {
  try {
    const list = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, appointments: list });
  } catch (error) {
    console.error("❌ getAppointments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json({ success: true, appointment: appt });
  } catch (error) {
    console.error("❌ getAppointmentById error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    Object.assign(appt, req.body);
    const updated = await appt.save();
    res.json({ success: true, message: "Appointment updated", appointment: updated });
  } catch (error) {
    console.error("❌ updateAppointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    await appt.deleteOne();
    res.json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    console.error("❌ deleteAppointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
