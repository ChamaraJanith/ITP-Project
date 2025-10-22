import mongoose from 'mongoose';
import Patient from '../model/userModel.js';

class PatientController {
  // Get patient profile
  static async getProfile(req, res) {
    try {
      const { id } = req.params;
      console.log('Fetching profile for ID:', id, 'Type:', typeof id);
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid ObjectId format:', id);
        return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
      }
      
      const patient = await Patient.findById(id).select('-password');
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
      res.status(200).json({ success: true, data: patient });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
  }
// ... other imports and methods in patientController.js

// Get current logged-in user profile (no ID needed from URL)
static async getCurrentProfile(req, res) {
  try {
    // The user's ID comes from the middleware, which decoded the token
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated properly.' });
    }
    
    // Find the patient by the ID from the token
    const patient = await Patient.findById(userId).select('-password');
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }
    
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching current profile:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

// ... export default PatientController;
  // Update patient profile
  static async updateProfile(req, res) {
    try {
      // DEBUGGING LOG: Check the ID received by the server
      console.log('Received request to update profile for ID:', req.params.id, 'Type:', typeof req.params.id);

      const { id } = req.params;
      const { name, email, phone, gender, dateOfBirth } = req.body;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('Invalid ObjectId format:', id);
        return res.status(400).json({ success: false, message: 'Invalid patient ID format' });
      }

      const patient = await Patient.findById(id);
      if (!patient) {
        // If you see this error, the console.log above will tell you what ID was not found.
        console.log('Patient not found for ID:', id);
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }

      patient.name = name || patient.name;
      patient.email = email || patient.email;
      patient.phone = phone || patient.phone;
      patient.gender = gender || patient.gender;
      patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;

      await patient.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: patient,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
  }
}

export default PatientController;