import axios from "axios";

const Prescriptionapi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:7000/api/doctor", // match backend mount
  headers: {
    "Content-Type": "application/json",
  },
});

Prescriptionapi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default Prescriptionapi;
