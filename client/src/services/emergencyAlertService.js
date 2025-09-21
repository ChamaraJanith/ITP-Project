// ===== 4. Updated EmergencyAlertApi.js (Frontend API) =====
import axios from "axios";

const EmergencyAlertApi = axios.create({
  baseURL: "http://localhost:7000/api/doctor/emergency-alerts", // Updated to match server route
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor
EmergencyAlertApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
EmergencyAlertApi.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Create emergency alert
export const createEmergencyAlert = (payload) =>
  EmergencyAlertApi.post("/", payload);

// Get all emergency alerts
export const getAllEmergencyAlerts = (params = {}) =>
  EmergencyAlertApi.get("/", { params });

// Get emergency alert by ID
export const getEmergencyAlertById = (id) =>
  EmergencyAlertApi.get(`/${id}`);

// Update emergency alert
export const updateEmergencyAlert = (id, payload) =>
  EmergencyAlertApi.put(`/${id}`, payload);

// Delete emergency alert
export const deleteEmergencyAlert = (id) =>
  EmergencyAlertApi.delete(`/${id}`);

// Get emergency alert statistics
export const getEmergencyAlertStats = (params = {}) =>
  EmergencyAlertApi.get("/stats", { params });

// Test connection
export const testConnection = () =>
  EmergencyAlertApi.get("/test/health");

export default EmergencyAlertApi;