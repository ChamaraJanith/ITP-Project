// client/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:7000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientAPI = {
  // Register new patient
  register: async (patientData) => {
    const response = await api.post('/patients/register', patientData);
    return response.data;
  },

  // Get all patients
  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  // Get patient by ID
  getById: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  // Update patient
  update: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  // Delete patient
  delete: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
};

export default api;
