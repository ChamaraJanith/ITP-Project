import Consultation from '../model/Consultation.js';

class ConsultationController {

  // Create a new consultation
  static async createConsultation(req, res) {
    try {
      const { doctor, date, time, reason, notes } = req.body;

      const newConsultation = new Consultation({ doctor, date, time, reason, notes });
      await newConsultation.save();

      return res.status(201).json({
        success: true,
        message: 'Consultation added successfully',
        data: newConsultation
      });
    } catch (error) {
      console.error("Error creating consultation:", error);
      return res.status(500).json({
        success: false,
        message: 'Error adding consultation',
        error: error.message
      });
    }
  }

  // Get all consultations
  static async getAllConsultations(req, res) {
    try {
      const consultations = await Consultation.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Consultations fetched successfully',
        data: consultations
      });
    } catch (error) {
      console.error("Error fetching consultations:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching consultations',
        error: error.message
      });
    }
  }

  // Get consultation by ID
  static async getConsultationById(req, res) {
    try {
      const { id } = req.params;
      const consultation = await Consultation.findById(id);

      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Consultation fetched successfully',
        data: consultation
      });
    } catch (error) {
      console.error("Error fetching consultation:", error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching consultation',
        error: error.message
      });
    }
  }

  // Delete consultation by ID
  static async deleteConsultation(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Consultation.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }

      return res.status(200).json({ success: true, message: 'Consultation deleted successfully' });
    } catch (error) {
      console.error("Error deleting consultation:", error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting consultation',
        error: error.message
      });
    }
  }
  // Update consultation by ID
  static async updateConsultation(req, res) {
    try {
      const { id } = req.params;
      const { doctor, date, time, reason, notes } = req.body;

      const updatedConsultation = await Consultation.findByIdAndUpdate(
        id,
        { doctor, date, time, reason, notes },
        { new: true, runValidators: true }
      );

      if (!updatedConsultation) {
        return res.status(404).json({ success: false, message: 'Consultation not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Consultation updated successfully',
        data: updatedConsultation
      });
    } catch (error) {
      console.error("Error updating consultation:", error);
      return res.status(500).json({
        success: false,
        message: 'Error updating consultation',
        error: error.message
      });
    }
  }



}

export default ConsultationController;
