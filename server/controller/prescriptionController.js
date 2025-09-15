import Prescriptions from "../model/Prescriptions.js";

class PrescriptionController {
  // =============================
  // CREATE Prescription
  // =============================
  static async createPrescription(req, res) {
    try {
      const body = req.body;

      // Use logged-in user or fallback doctor
      const doctor = req.user || {
        id: "TEMP_DOCTOR_ID",
        name: "Dr. Gayath",
        specialization: "General",
      };

      const newPrescription = new Prescriptions({
        // Prescription info
        date: body.date ? new Date(body.date) : Date.now(),
        diagnosis: body.diagnosis,
        medicines: body.medicines,
        notes: body.notes || "",

        // Patient details
        patientId: body.patientId,
        patientName: body.patientName,
        patientEmail: body.patientEmail,
        patientPhone: body.patientPhone,
        patientGender: body.patientGender,
        bloodGroup: body.bloodGroup || "",
        patientAllergies: body.patientAllergies || [],

        // Doctor details
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization || "",
      });

      await newPrescription.save();

      return res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        data: newPrescription,
      });
    } catch (error) {
      console.error("Error creating prescription:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating prescription",
        error: error.message,
      });
    }
  }

  // =============================
  // GET all prescriptions
  // =============================
  static async getAllPrescriptions(req, res) {
    try {
      const prescriptions = await Prescriptions.find().sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        message: "Prescriptions fetched successfully",
        data: prescriptions,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching prescriptions",
        error: error.message,
      });
    }
  }

  // =============================
  // GET prescription by ID
  // =============================
  static async getPrescriptionById(req, res) {
    try {
      const { id } = req.params;
      const prescription = await Prescriptions.findById(id);

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Prescription fetched successfully",
        data: prescription,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching prescription",
        error: error.message,
      });
    }
  }

// =============================
// UPDATE prescription
// =============================
static async updatePrescription(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    // Build update object safely
    const updateFields = {};

    // Prescription info
    if (body.hasOwnProperty("date")) updateFields.date = body.date ? new Date(body.date) : null;
    if (body.hasOwnProperty("diagnosis")) updateFields.diagnosis = body.diagnosis || "";
    if (body.hasOwnProperty("medicines")) updateFields.medicines = body.medicines || [];
    if (body.hasOwnProperty("notes")) updateFields.notes = body.notes || "";

    // Patient details
    if (body.hasOwnProperty("patientId")) updateFields.patientId = body.patientId || "";
    if (body.hasOwnProperty("patientName")) updateFields.patientName = body.patientName || "";
    if (body.hasOwnProperty("patientEmail")) updateFields.patientEmail = body.patientEmail || "";
    if (body.hasOwnProperty("patientPhone")) updateFields.patientPhone = body.patientPhone || "";
    if (body.hasOwnProperty("patientGender")) updateFields.patientGender = body.patientGender || "";
    if (body.hasOwnProperty("bloodGroup")) updateFields.bloodGroup = body.bloodGroup || "";
    if (body.hasOwnProperty("patientAllergies")) updateFields.patientAllergies = body.patientAllergies || [];

    // Doctor details (optional override if needed)
    if (body.hasOwnProperty("doctorId")) updateFields.doctorId = body.doctorId || "";
    if (body.hasOwnProperty("doctorName")) updateFields.doctorName = body.doctorName || "";
    if (body.hasOwnProperty("doctorSpecialization")) updateFields.doctorSpecialization = body.doctorSpecialization || "";

    const updatedPrescription = await Prescriptions.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedPrescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updatedPrescription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating prescription",
      error: error.message,
    });
  }
}


  // =============================
  // DELETE prescription
  // =============================
  static async deletePrescription(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Prescriptions.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Prescription not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Prescription deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting prescription",
        error: error.message,
      });
    }
  }
}

export default PrescriptionController;
