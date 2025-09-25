// components/DoctorAppointments.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Doctor/DocApp.css"


const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const backendUrl = "http://localhost:7000";

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${backendUrl}/api/appointments/accepted`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (time) => {
    if (!time || typeof time !== "string") return "Time not set";
    const parts = time.split(":");
    if (parts.length !== 2) return time;
    const hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${parts[1]} ${ampm}`;
  };

  if (loading) return <p>Loading appointments...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="doctor-appointments">
      <h2>Accepted Appointments</h2>
      {appointments.length === 0 ? (
        <p>No accepted appointments yet.</p>
      ) : (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Specialty</th>
              <th>Symptoms</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => {
              const formattedTime = formatTime(appt.appointmentTime);
              const urgencyValue =
                appt.urgency && typeof appt.urgency === "string"
                  ? appt.urgency
                  : "normal";
              const formattedUrgency =
                urgencyValue.charAt(0).toUpperCase() + urgencyValue.slice(1);

              return (
                <tr key={appt._id}>
                  <td>
                    {appt.name}
                    <div className="contact">{appt.phone}</div>
                    <div className="contact">{appt.email}</div>
                  </td>
                  <td>
                    {appt.appointmentDate
                      ? new Date(appt.appointmentDate).toLocaleDateString()
                      : "Date not set"}
                  </td>
                  <td>🕐 {formattedTime}</td>
                  <td>{appt.doctorSpecialty || "N/A"}</td>
                  <td>{appt.symptoms || "N/A"}</td>
                  <td className={`urgency ${urgencyValue}`}>
                    {formattedUrgency}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DoctorAppointments;
