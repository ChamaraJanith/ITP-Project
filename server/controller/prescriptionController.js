import Prescriptions from "../model/Prescriptions.js";

class PrescriptionController {
  static async createPrescription(req, res) {
    try {
      const body = req.body;
      const doctor = req.user || {
        id: "TEMP_DOCTOR_ID",
        name: "Dr. Gayath",
        specialization: "General",
      };

      const newPrescription = new Prescriptions({
        date: body.date ? new Date(body.date) : Date.now(),
        diagnosis: body.diagnosis,
        medicines: body.medicines,
        notes: body.notes || "",
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

  static async getPrescriptionById(req, res) {
    try {
      const { id } = req.params;
      const prescription = await Prescriptions.findById(id);
      if (!prescription) return res.status(404).json({ success: false, message: "Prescription not found" });
      return res.status(200).json({ success: true, message: "Prescription fetched successfully", data: prescription });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error fetching prescription", error: error.message });
    }
  }

  static async updatePrescription(req, res) {
    try {
      const { id } = req.params;
      const { date, diagnosis, medicines, notes } = req.body;

      const updatedPrescription = await Prescriptions.findByIdAndUpdate(
        id,
        { date, diagnosis, medicines, notes },
        { new: true, runValidators: true }
      );

      if (!updatedPrescription) return res.status(404).json({ success: false, message: "Prescription not found" });

      return res.status(200).json({ success: true, message: "Prescription updated successfully", data: updatedPrescription });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error updating prescription", error: error.message });
    }
  }

  static async deletePrescription(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Prescriptions.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: "Prescription not found" });
      return res.status(200).json({ success: true, message: "Prescription deleted successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Error deleting prescription", error: error.message });
    }
  }
}

export default PrescriptionController;
