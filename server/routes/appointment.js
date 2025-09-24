// server/routes/appointmentRoutes.js

import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
} from "../controller/appointmentController.js";

const router = express.Router();

// 1) BOOK route must come before :id
router.post("/book", createAppointment);

// 2) Primary create route
router.post("/", createAppointment);

// 3) List all appointments
router.get("/", getAppointments);

// 4) Get, update, delete by ID
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
