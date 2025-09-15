import express from 'express';
import QRCode from 'qrcode';
import Patient from '../model/patientmodel.js'; // correct path
import { generatePatientId } from '../utils/generatePatientId.js';

const patrouter = express.Router();

// Register new patient
patrouter.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, gender, address, emergencyContact, bloodGroup, allergies, medicalHistory } = req.body;

    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) return res.status(400).json({ success: false, message: 'Patient with this email already exists' });

    let patientId;
    while (true) {
      patientId = generatePatientId();
      const existingId = await Patient.findOne({ patientId });
      if (!existingId) break;
    }

    const patientQRData = {
      patientId,
      name: `${firstName} ${lastName}`,
      phone,
      bloodGroup,
      registrationDate: new Date().toISOString(),
      emergencyContact: emergencyContact?.phone
    };

    const qrCodeData = await QRCode.toDataURL(JSON.stringify(patientQRData));

    const newPatient = new Patient({
      patientId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address: address || {},
      emergencyContact: emergencyContact || {},
      bloodGroup,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map(i => i.trim()) : []),
      medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : (medicalHistory ? medicalHistory.split(',').map(i => i.trim()) : []),
      qrCodeData
    });

    const savedPatient = await newPatient.save();
    res.status(201).json({ success: true, data: savedPatient, qrCode: qrCodeData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 FIXED: Search patients
patrouter.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    if (!search) {
      return res.json([]); // return empty array if no search term
    }

    const regex = new RegExp(search, "i"); // case-insensitive
    const patients = await Patient.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { patientId: regex },
      ]
    }).limit(10);

    res.json(patients); // ✅ array of matching patients
  } catch (error) {
    console.error("Patient search failed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// adjust path to your Patient model

// Existing routes (search, create, etc.) here...

// ✅ Add this route to get patient by ID
patrouter.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

    res.json({ success: true, patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



export default patrouter;
