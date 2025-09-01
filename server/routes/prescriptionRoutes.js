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

// DELETE - delete prescription by ID
prescriptionRouter.delete('/:id', PrescriptionController.deletePrescription);

//update prescription by ID
prescriptionRouter.put('/:id', validatePrescription, validate, PrescriptionController.updatePrescription);

export default prescriptionRouter;
