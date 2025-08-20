import Patient from "../model/Patient.js";

// Get Patient Profile
export const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select("-password");
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Patient Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, age, gender, address, medicalHistory, allergies } = req.body;

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, age, gender, address, medicalHistory, allergies },
      { new: true }
    ).select("-password");

    res.json(updatedPatient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
