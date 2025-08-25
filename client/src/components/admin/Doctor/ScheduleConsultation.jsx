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

  // handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:7000/api/prescription/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setFormData({
      doctor: "",
      date: "",
      time: "",
      reason: "",
      notes: "",
    });

    fetchConsultations();
  };

  // fetch consultations from the server
  const fetchConsultations = async () => {
    const response = await fetch('http://localhost:7000/api/prescription/consultations');
    const data = await response.json();
    setConsultations(data.data || []);
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  return (
    <div className="schedule-consultation">
      <h2>🩺 Schedule Consultation</h2>

      <form>
        <input
          name='doctor'
          type='text'
          placeholder='Doctor Name'
          value={formData.doctor}
          onChange={handleChange}
          required
        />

        <input
          name='date'
          type='date'
          value={formData.date}
          onChange={handleChange}
          required
        />

        <input
          name='time'
          type='time'
          value={formData.time}
          onChange={handleChange}
          required
        />

        <input
          name='reason'
          type='text'
          placeholder='Reason for Consultation'
          value={formData.reason}
          onChange={handleChange}
          required
        />

        <textarea
          name='notes'
          placeholder='Additional Notes'
          value={formData.notes}
          onChange={handleChange}
        ></textarea>

        <button type='submit' onClick={handleSubmit}>
          Schedule Consultation
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
          </tr>
        </thead>
        <tbody>
          {consultations.map((consultations, index) => (
            <tr key={consultations._id || index}>
              <td>{consultations.doctor}</td>
              <td>{new Date(consultations.date).toLocaleDateString()}</td>
              <td>{consultations.time}</td>
              <td>{consultations.reason}</td>
              <td>{consultations.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleConsultation;
