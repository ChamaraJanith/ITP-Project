import express from "express";
import PrescriptionController from "../controller/prescriptionController.js";
import { validatePrescription, validate } from "../validation/prescriptionValidator.js";

const prescriptionRouter = express.Router();

// POST - create new prescription
prescriptionRouter.post('/', validatePrescription, validate, PrescriptionController.createPrescription);

// GET - fetch all prescriptions
prescriptionRouter.get('/', PrescriptionController.getAllPrescriptions);

// GET - fetch prescription by ID
prescriptionRouter.get('/:id', PrescriptionController.getPrescriptionById);

// GET - fetch prescriptions by patient ID
prescriptionRouter.get('/patient/:patientId', PrescriptionController.getPrescriptionsByPatientId);

// GET - download prescription PDF
prescriptionRouter.get('/:id/download', PrescriptionController.downloadPrescriptionPDF);

// PUT - update prescription by ID
prescriptionRouter.put('/:id', validatePrescription, validate, PrescriptionController.updatePrescription);

// DELETE - delete prescription by ID
prescriptionRouter.delete('/:id', PrescriptionController.deletePrescription);

export default prescriptionRouter;