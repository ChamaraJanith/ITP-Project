import Prescriptions from "../model/Prescriptions.js";
import Patient from "../model/Patient.js";

class PrescriptionController {
  // Create new prescription
  static async createPrescription(req, res) {
    try {
      const { patientId, date, diagnosis, medicines, notes } = req.body;
      const doctor = req.user || {
        id: "TEMP_DOCTOR_ID",
        name: "Dr. Gayath",
        specialization: "General",
      };

      // Fetch patient details from Patient model
      const patient = await Patient.findById(patientId).select("-password");
      if (!patient) {
        return res.status(404).json({ success: false, message: "Patient not found" });
      }

      const newPrescription = new Prescriptions({
        date: date ? new Date(date) : Date.now(),
        diagnosis,
        medicines,
        notes: notes || "",

        // ✅ Patient details from DB
        patientId: patient._id,
        patientName: patient.name,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        patientGender: patient.gender,
        patientBloodGroup: patient.bloodGroup || "",
        patientAllergies: patient.allergies || [],

        // ✅ Doctor details
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

  // Update prescription
  static async updatePrescription(req, res) {
    try {
      const { id } = req.params;
      const { patientId, date, diagnosis, medicines, notes } = req.body;

      // Fetch patient details if patientId is provided
      let patientDetails = {};
      if (patientId) {
        const patient = await Patient.findById(patientId).select("-password");
        if (!patient) {
          return res.status(404).json({ success: false, message: "Patient not found" });
        }
        patientDetails = {
          patientId: patient._id,
          patientName: patient.name,
          patientEmail: patient.email,
          patientPhone: patient.phone,
          patientGender: patient.gender,
          patientBloodGroup: patient.bloodGroup || "",
          patientAllergies: patient.allergies || [],
        };
      }

      const updatedPrescription = await Prescriptions.findByIdAndUpdate(
        id,
        {
          date,
          diagnosis,
          medicines,
          notes,
          ...patientDetails, // Merge patient details if updated
        },
        { new: true, runValidators: true }
      );

      if (!updatedPrescription) {
        return res.status(404).json({ success: false, message: "Prescription not found" });
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
}

export default PrescriptionController;
