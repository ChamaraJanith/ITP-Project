import express from 'express';
import QRCode from 'qrcode';
import Patient from '../model/patientmodel.js'; // your existing path
import { generatePatientId } from '../utils/generatePatientId.js';

const patrouter = express.Router();


// 🔹 FIXED: Search patients
patrouter.get("/", async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";

    if (!search) {
      return res.json([]);
    }

    // Split words by spaces
    const words = search.split(/\s+/);

    let query;

    if (words.length >= 2) {
      // If two words given: search firstName + lastName
      const [first, last] = words;
      query = {
        $and: [
          { firstName: new RegExp(first, "i") },
          { lastName: new RegExp(last, "i") }
        ]
      };
    } else {
      // Single word: match firstName OR lastName OR patientId
      const regex = new RegExp(search, "i");
      query = {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { patientId: regex }
        ]
      };
    }

    const patients = await Patient.find(query).limit(10);

    res.json(patients);
  } catch (error) {
    console.error("Patient search failed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Register new patient (your existing code)
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

// Search patients (your existing code)
patrouter.get("/", async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";

    if (!search) {
      return res.json([]);
    }



    res.json(patients);
  } catch (error) {
    console.error("Patient search failed:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get patient by ID (your existing code)
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

// =============================
// NEW: Patient Count Routes
// =============================

// GET simple patient count
patrouter.get('/count', async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    
    return res.status(200).json({
      success: true,
      message: "Patient count fetched successfully",
      data: {
        totalPatients,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching patient count:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching patient count",
      error: error.message,
    });
  }
});

// GET detailed patient counts
patrouter.get('/count/detailed', async (req, res) => {
  try {
    // Total patients
    const totalPatients = await Patient.countDocuments();

    // Count by gender
    const genderCounts = await Patient.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);

    // Count by blood group
    const bloodGroupCounts = await Patient.aggregate([
      { $match: { bloodGroup: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
    ]);

    // Count this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthPatients = await Patient.countDocuments({
      registrationDate: { $gte: startOfMonth }
    });

    // Count today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayPatients = await Patient.countDocuments({
      registrationDate: { $gte: startOfToday }
    });

    // Age groups
    const ageGroupCounts = await Patient.aggregate([
      { $match: { dateOfBirth: { $exists: true, $ne: null } } },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$age", 18] }, then: "Under 18" },
                { case: { $lt: ["$age", 30] }, then: "18-29" },
                { case: { $lt: ["$age", 50] }, then: "30-49" },
                { case: { $lt: ["$age", 65] }, then: "50-64" }
              ],
              default: "65+"
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Detailed patient counts fetched successfully",
      data: {
        totalPatients,
        thisMonthPatients,
        todayPatients,
        genderCounts,
        bloodGroupCounts,
        ageGroupCounts,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching detailed patient counts:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching detailed patient counts",
      error: error.message,
    });
  }
});

// GET all patients with filtering
patrouter.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const patients = await Patient.find({})
      .select('-qrCodeData -__v')
      .sort({ registrationDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalCount = await Patient.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Patients fetched successfully",
      data: patients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalPatients: totalCount,
        patientsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching patients",
      error: error.message,
    });
  }
});

export default patrouter;
