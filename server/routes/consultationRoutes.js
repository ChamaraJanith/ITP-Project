import express from 'express';
import ConsultationController from '../controller/consultationController.js';
import Consultation from '../model/Consultation.js';
const consultationRouter = express.Router();

// POST - create new consultation
consultationRouter.post('/consultations', async (req, res) => {
  try {
    const { doctor, date, time, reason, notes } = req.body;

    const newConsultation = new Consultation({
      doctor,
      date,
      time,
      reason,
      notes
    });

    await newConsultation.save();

    res.status(201).json({
      success: true,
      message: 'Consultation added successfully',
      data: newConsultation
    });
  } catch (error) {
    console.error("Error adding consultation:", error);
    res.status(500).json({
      success: false,
      message: 'Error adding consultation',
      error: error.message
    });
  }
});

// GET - fetch all consultations
consultationRouter.get('/consultations', async (req, res) => {
  try {
    const consultations = await Consultation.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Consultations fetched successfully',
      data: consultations
    });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultations',
      error: error.message
    });
  }
});

export default consultationRouter;
