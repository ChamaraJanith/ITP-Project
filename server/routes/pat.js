// routes/pat.js
import express from 'express';
import QRCode from 'qrcode';
import Patient from '../model/patientmodel.js';
import { generatePatientId } from '../utils/generatePatientId.js';

// ✅ DEFINE the router first
const patrouter = express.Router();

// Register new patient with QR code generation
patrouter.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      medicalHistory
    } = req.body;

    // Check if email already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient with this email already exists' 
      });
    }

    // Generate unique patient ID
    let patientId;
    let isUnique = false;
    
    while (!isUnique) {
      patientId = generatePatientId();
      const existingId = await Patient.findOne({ patientId });
      if (!existingId) {
        isUnique = true;
      }
    }

    // Create patient data for QR code
    const patientQRData = {
      patientId: patientId,
      name: `${firstName} ${lastName}`,
      phone: phone,
      bloodGroup: bloodGroup,
      registrationDate: new Date().toISOString(),
      emergencyContact: emergencyContact?.phone
    };

    // Generate QR code as base64 data URL
    const qrCodeData = await QRCode.toDataURL(JSON.stringify(patientQRData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create new patient
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
      allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map(item => item.trim()) : []),
      medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : (medicalHistory ? medicalHistory.split(',').map(item => item.trim()) : []),
      qrCodeData
    });

    const savedPatient = await newPatient.save();

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        patient: savedPatient,
        qrCode: qrCodeData
      }
    });

  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all patients
patrouter.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ registrationDate: -1 });
    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
});

// Get patient by ID
patrouter.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
});

// Update patient
patrouter.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
});

// Delete patient
patrouter.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
});

// ✅ NOW export the defined router
export default patrouter;
