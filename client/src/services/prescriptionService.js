import Patient from "../../../server/model/Patient";
import Prescriptionapi from "./prescriptionApi";

export const createPrescription = (payload) => Prescriptionapi.post('/prescriptions', payload);
export const getAllPrescriptions = (PatientId) => Prescriptionapi.get('/prescriptions/patient/${PatientId}');

