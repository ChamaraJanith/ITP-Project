// controllers/appointmentController.js
import Appointment from "../model/appointment.js";

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const {
      name,
      gender,
      dateOfBirth,
      age,
      email,
      phone,
      bloodGroup,
      allergies,
      appointmentDate,
      appointmentTime,
      doctorSpecialty,
      doctorName,
      appointmentType,
      symptoms,
      urgency,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship
    } = req.body;

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
      return res.status(400).json({ message: "All required fields must be provided" });
    }
      
      // --- Double-booking prevention ---
    const existing = await Appointment.findOne({
      appointmentDate,
      appointmentTime,
      doctorName
    });
    if (existing) {
      return res.status(409).json({ message: "This time slot is already booked for the selected doctor." });
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
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    console.error("❌ getAllAppointments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    res.json({ success: true, appointment });
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

// Accept appointment
export const acceptAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "accepted", acceptedAt: new Date() },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    res.json({ success: true, message: "Appointment accepted successfully", appointment });
  } catch (error) {
    console.error("❌ acceptAppointment error:", error);
    res.status(500).json({ success: false, message: "Failed to accept appointment", error: error.message });
  }
};

// Reject appointment
export const rejectAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: reason || "No reason provided"
      },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    res.json({ success: true, message: "Appointment rejected successfully", appointment });
  } catch (error) {
    console.error("❌ rejectAppointment error:", error);
    res.status(500).json({ success: false, message: "Failed to reject appointment", error: error.message });
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
// controllers/appointmentController.js

// Fetch only accepted appointments
export const getAllAppointmentsAccepted = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "accepted" })
      .sort({ acceptedAt: -1 })
      .lean();

    console.log("DEBUG: accepted appointments count →", appointments.length);
    console.dir(appointments, { depth: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("❌ getAllAppointmentsAccepted error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
