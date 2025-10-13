import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../pages/styles/PatientProfile.css';

const PatientProfile = () => {
  const [patient, setPatient] = useState(null);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  // --- COMPONENT INITIALIZATION ---
  useEffect(() => {
    let userData = localStorage.getItem('user');
    
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      userData = JSON.parse(userData);
      if (userData.gender) {
        userData.gender = userData.gender.toLowerCase();
      }
      
      setPatient(userData);
      setFormData(userData);
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  // --- HANDLERS ---
  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    let patientId = patient?._id || patient?.id;

    if (!patientId) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        patientId = userData._id || userData.id;
        console.log('State ID was missing, used fallback ID from localStorage:', patientId);
      } catch (e) {
        console.error("Could not get user ID from localStorage", e);
        return alert("Could not determine patient ID. Please log in again.");
      }
    }

    if (!patientId) {
      return alert("Patient ID missing!");
    }

    console.log('Using patient ID:', patientId, 'Type:', typeof patientId);

    try {
      // FIX: Changed the API endpoint from /api/patients to /api/users
      const url = `http://localhost:7000/api/users/profile/${patientId}`;
      
      const response = await axios.put(url, formData);

      const updatedPatient = response.data.data;

      setPatient(updatedPatient);
      setFormData(updatedPatient);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      localStorage.setItem('user', JSON.stringify(updatedPatient));
    } catch (error) {
      console.error('Update error:', error);
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  // --- RENDER LOGIC ---
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
          <div className={`message ${message.toLowerCase().includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="profile-header">
          <h2>Welcome, {patient.name}</h2>
          <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
        </div>

        <div className="profile-info">
          {['name', 'email', 'phone', 'gender', 'dateOfBirth', 'role'].map(field => (
            <div className="info-item" key={field}>
              <span className="label">{field.charAt(0).toUpperCase() + field.slice(1)}:</span>
              {isEditing && field !== 'role' ? (
                field === 'gender' ? (
                  <select name="gender" value={formData.gender || ''} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <input
                    type={field === 'dateOfBirth' ? 'date' : 'text'}
                    name={field}
                    value={formData[field] || ''}
                    onChange={handleChange}
                  />
                )
              ) : (
                <span className="value">
                  {field === 'dateOfBirth' && patient[field]
                    ? new Date(patient[field]).toLocaleDateString()
                    : patient[field] || 'N/A'}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="update-btn" onClick={handleUpdate}>Save</button>
              <button className="cancel-btn" onClick={() => { setIsEditing(false); setFormData(patient); }}>Cancel</button>
            </>
          ) : (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;