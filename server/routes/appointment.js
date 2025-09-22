import express from "express";
import { createAppointment, getAppointments } from "../controller/appointmentController.js";

const router = express.Router();

// POST /api/appointments -> create appointment
router.post("/", createAppointment);

// GET /api/appointments -> get all appointments
router.get("/", getAppointments);

export default router;
