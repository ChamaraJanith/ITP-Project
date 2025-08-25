import React, { useState, useEffect } from 'react';
import './ScheduleConsultation.css';

const ScheduleConsultation = () => {
  const [formData, setFormData] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: "",
    notes: "",
  });

  const [consultations, setConsultations] = useState([]);
  const [editingId, setEditingId] = useState(null); // track edit mode

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId) {
      // Update consultation
      await fetch(`http://localhost:7000/api/prescription/consultations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setEditingId(null);
    } else {
      // Create consultation
      await fetch('http://localhost:7000/api/prescription/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    setFormData({ doctor: "", date: "", time: "", reason: "", notes: "" });
    fetchConsultations();
  };

  // Fetch consultations
  const fetchConsultations = async () => {
    const response = await fetch('http://localhost:7000/api/prescription/consultations');
    const data = await response.json();
    setConsultations(data.data || []);
  };

  // Delete consultation
  const handleDelete = async (id) => {
    await fetch(`http://localhost:7000/api/prescription/consultations/${id}`, {
      method: 'DELETE',
    });
    fetchConsultations();
  };

  // Edit consultation
  const handleEdit = (consultation) => {
    setFormData({
      doctor: consultation.doctor,
      date: consultation.date.split("T")[0], // format ISO date
      time: consultation.time,
      reason: consultation.reason,
      notes: consultation.notes || "",
    });
    setEditingId(consultation._id);
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  return (
    <div className="schedule-consultation">
      <h2>🩺 {editingId ? "Update Consultation" : "Schedule Consultation"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="doctor"
          type="text"
          placeholder="Doctor Name"
          value={formData.doctor}
          onChange={handleChange}
          required
        />
        <input
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <input
          name="time"
          type="time"
          value={formData.time}
          onChange={handleChange}
          required
        />
        <input
          name="reason"
          type="text"
          placeholder="Reason for Consultation"
          value={formData.reason}
          onChange={handleChange}
          required
        />
        <textarea
          name="notes"
          placeholder="Additional Notes"
          value={formData.notes}
          onChange={handleChange}
        />
        <button type="submit">
          {editingId ? "Update Consultation" : "Schedule Consultation"}
        </button>
      </form>

      <h3>Scheduled Consultations</h3>
      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Reason</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {consultations.map((c, index) => (
            <tr key={c._id || index}>
              <td>{c.doctor}</td>
              <td>{new Date(c.date).toLocaleDateString()}</td>
              <td>{c.time}</td>
              <td>{c.reason}</td>
              <td>{c.notes}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(c)}
                    data-tooltip="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(c._id)}
                    data-tooltip="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleConsultation;
