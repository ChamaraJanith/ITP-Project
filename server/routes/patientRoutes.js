import express from 'express';
import PatientController from '../controller/patientController.js';
import { authenticateUser } from '../middleware/auth.js'; // This will now work

const patientRoutes = express.Router();

// --- Public Routes (or routes requiring different authorization) ---
// These routes get the user by a specific ID in the URL.
// They might be used by an admin or a doctor viewing another user's profile.
// You might want to add another middleware here to check if the requester has permission.
patientRoutes.get('/profile/:id', PatientController.getProfile);
patientRoutes.put('/profile/:id', PatientController.updateProfile);

// --- Protected Route ---
// This route is for the currently logged-in user to get their own profile.
// The `authenticateUser` middleware runs BEFORE `PatientController.getCurrentProfile`.
// It ensures `req.user` is populated with the logged-in user's ID.
patientRoutes.get('/me', authenticateUser, PatientController.getCurrentProfile);

export default patientRoutes;