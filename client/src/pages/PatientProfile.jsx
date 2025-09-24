// src/pages/PatientProfile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../pages/styles/PatientProfile.css';

const PatientProfile = () => {
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();

  // Fetch patient data on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }
    try {
      setPatient(JSON.parse(stored));
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const handleSignOut = () => {
    // Clear auth tokens and user data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Optionally notify server (logout endpoint)
    axios.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => {});
    navigate('/login');
  };

  if (!patient) return null;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Welcome, {patient.name}</h2>
          <button className="signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
        <div className="profile-info">
          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{patient.email}</span>
          </div>
          <div className="info-item">
            <span className="label">Phone:</span>
            <span className="value">{patient.phone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Gender:</span>
            <span className="value">{patient.gender || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Date of Birth:</span>
            <span className="value">
              {patient.dateOfBirth
                ? new Date(patient.dateOfBirth).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Role:</span>
            <span className="value">{patient.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
// src/pages/styles/PatientProfile.css