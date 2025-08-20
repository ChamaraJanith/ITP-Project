import express from "express";
import { getProfile, updateProfile } from "../controller/patientController.js";

const router = express.Router();

router.get("/:id", getProfile);
router.put("/:id", updateProfile);

export default router;
