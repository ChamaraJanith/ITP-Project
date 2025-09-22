import express from 'express';
import { authMiddleware, authorizeRoles } from './auth.js';
import { manageAppointment } from '../controllers/appointmentController.js';

const router = express.Router();

// Receptionist can manage appointments
router.post('/appointments/manage', authMiddleware, authorizeRoles(['receptionist']), manageAppointment);

export default router;
