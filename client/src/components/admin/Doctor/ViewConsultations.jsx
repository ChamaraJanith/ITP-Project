import React, { useState, useEffect } from 'react';
import './ViewConsultations.css';

const ViewConsultations = () => {
  const [consultations, setConsultations] = useState([]);

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
    <div className="view-consultations">
        <h2>📋 View Consultations</h2>
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
export default ViewConsultations;