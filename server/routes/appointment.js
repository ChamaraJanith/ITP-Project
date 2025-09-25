// routes/appointment.js
import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAllAppointmentsAccepted,
  getAppointmentById,
  updateAppointment,
  acceptAppointment,
  rejectAppointment,
  deleteAppointment
} from "../controller/appointmentController.js";

const router = express.Router();

// 1. Book a new appointment
//    POST /api/appointments/book
router.post("/book", createAppointment);

// 2. Fetch all appointments
//    GET /api/appointments
router.get("/", getAllAppointments);

// 3. Fetch only accepted appointments
//    GET /api/appointments/accepted
router.get("/accepted", getAllAppointmentsAccepted);

// 4. Fetch single appointment by ID
//    GET /api/appointments/:id
router.get("/:id", getAppointmentById);

// 5. Update an appointment by ID
//    PUT /api/appointments/:id
router.put("/:id", updateAppointment);

// 6. Accept an appointment
//    PUT /api/appointments/:id/accept
router.put("/:id/accept", acceptAppointment);

// 7. Reject an appointment
//    PUT /api/appointments/:id/reject
router.put("/:id/reject", rejectAppointment);

// 8. Delete an appointment
//    DELETE /api/appointments/:id
router.delete("/:id", deleteAppointment);

export default router;
