import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../pages/styles/PatientProfile.css';

const PatientProfile = () => {
  const [patient, setPatient] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for navigation state first
    if (location.state?.userData) {
      setPatient(location.state.userData);
      setMessage(location.state.message || '');
      return;
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }
    try {
      const userData = JSON.parse(stored);
      setPatient(userData);
    } catch {
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate, location.state]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    axios.post('/api/auth/logout', {}, { withCredentials: true }).catch(() => {});
    navigate('/login');
  };

  if (!patient) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="profile-header">
          <h2>Welcome, {patient.name}</h2>
          <button className="signout-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <span className="label">Name:</span>
            <span className="value">{patient.name}</span>
          </div>
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
