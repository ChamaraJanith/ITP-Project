import express from 'express';
import ConsultationController from '../controller/consultationController.js';

const consultationRouter = express.Router();

// POST - create new consultation
consultationRouter.post('/consultations', ConsultationController.createConsultation);

// GET - fetch all consultations
consultationRouter.get('/consultations', ConsultationController.getAllConsultations);

// GET - fetch consultation by ID
consultationRouter.get('/consultations/:id', ConsultationController.getConsultationById);

// PUT - update consultation by ID
consultationRouter.put('/consultations/:id', ConsultationController.updateConsultation);

// DELETE - delete consultation by ID
consultationRouter.delete('/consultations/:id', ConsultationController.deleteConsultation);

export default consultationRouter;
