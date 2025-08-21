import express from 'express';
import Consultation from '../model/Consultation.js';




const ConsultationRoutes = express.Router();

ConsultationRoutes.post('/consultations', async (req, res) => {
    try {
        const newConsultation = new Consultation({
            doctor: req.body.doctor,
            date: req.body.date,
            time: req.body.time,
            reason: req.body.reason,
            notes: req.body.notes
        });

        await newConsultation.save();

        res.status(201).json({
            success: true,
            message: 'Consultation added successfully',
            data: newConsultation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding consultation',
            error: error.message
        });
    }
    
});

// GET - fetch all consultations
ConsultationRoutes.get('/consultations', async (req, res) => {
    try {
        const consultations = await Consultation.find().sort({ createdAt: -1 });
        res.status(200).json(consultations);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching consultations',
            error: error.message
        });
    }
});

export default ConsultationRoutes;
