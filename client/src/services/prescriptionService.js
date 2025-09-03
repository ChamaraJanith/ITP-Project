import Prescriptionapi from "./prescriptionApi";

// create prescription
export const createPrescription = (payload) =>
  Prescriptionapi.post("/prescriptions", payload);

// get all prescriptions
export const getAllPrescriptions = () =>
  Prescriptionapi.get("/prescriptions");

// get prescription by ID
export const getPrescriptionById = (id) =>
  Prescriptionapi.get(`/prescriptions/${id}`);

// update prescription by ID
export const updatePrescription = (id, payload) =>
  Prescriptionapi.put(`/prescriptions/${id}`, payload);

// delete prescription by ID
export const deletePrescription = (id) =>
  Prescriptionapi.delete(`/prescriptions/${id}`);
