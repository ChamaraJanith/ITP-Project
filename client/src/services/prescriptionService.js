import Prescriptionapi from "./prescriptionApi";

// create prescription with PDF upload to Google Cloud
export const createPrescription = (payload) =>
  Prescriptionapi.post("/prescriptions", payload);

// get all prescriptions
export const getAllPrescriptions = () =>
  Prescriptionapi.get("/prescriptions");

// get prescription by ID
export const getPrescriptionById = (id) =>
  Prescriptionapi.get(`/prescriptions/${id}`);

// ⭐ NEW: get prescriptions by patient ID
export const getPrescriptionsByPatientId = (patientId) =>
  Prescriptionapi.get(`/prescriptions/patient/${patientId}`);

// update prescription by ID with PDF upload to Google Cloud
export const updatePrescription = (id, payload) =>
  Prescriptionapi.put(`/prescriptions/${id}`, payload);

// delete prescription by ID
export const deletePrescription = (id) =>
  Prescriptionapi.delete(`/prescriptions/${id}`);

// ⭐ NEW: download prescription PDF from Google Cloud
export const downloadPrescriptionPDF = async (id) => {
  try {
    const response = await Prescriptionapi.get(`/prescriptions/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading prescription PDF:', error);
    throw error;
  }
};

// ⭐ NEW: Helper function to trigger PDF download in browser
export const downloadPrescriptionPDFInBrowser = async (prescriptionId, fileName = 'Prescription.pdf') => {
  try {
    const blob = await downloadPrescriptionPDF(prescriptionId);
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading prescription PDF in browser:', error);
    throw error;
  }
};