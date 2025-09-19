import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScheduleConsultation.css';

const ScheduleConsultation = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: "",
    notes: "",
  });

  const [consultations, setConsultations] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Function to format doctor name properly
  const formatDoctorName = (name) => {
    if (!name) return '';
    
    // Remove extra spaces and normalize
    const cleanName = name.trim().replace(/\s+/g, ' ');
    
    // Check if name already starts with "Dr."
    if (cleanName.toLowerCase().startsWith('dr.')) {
      return cleanName;
    }
    
    // Add "Dr." prefix if not present
    return `Dr. ${cleanName}`;
  };

  // Validation function for alphabetic characters and spaces only
  const isAlphabeticWithSpaces = (str) => {
    return /^[a-zA-Z\s]*$/.test(str);
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/admin/doctor');
  };

  // Handle input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply validation for doctor name and reason fields
    if (name === 'doctor' || name === 'reason') {
      // Only allow alphabetic characters and spaces
      if (value === '' || isAlphabeticWithSpaces(value)) {
        setFormData({
          ...formData,
          [name]: value
        });
      }
      // If validation fails, don't update the field (prevents typing)
      return;
    }
    
    // For other fields (date, time, notes), no validation restrictions
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle keypress to prevent non-alphabetic characters
  const handleKeyPress = (e, fieldName) => {
    if (fieldName === 'doctor' || fieldName === 'reason') {
      const char = String.fromCharCode(e.which);
      // Allow only alphabetic characters and space
      if (!/[a-zA-Z\s]/.test(char)) {
        e.preventDefault();
      }
    }
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format the doctor name before submitting
    const submissionData = {
      ...formData,
      doctor: formData.doctor.trim().replace(/\s+/g, ' '), // Clean up spacing but don't add Dr. prefix in form data
      reason: formData.reason.trim().replace(/\s+/g, ' ') // Clean up spacing for reason as well
    };

    if (editingId) {
      // Update consultation
      await fetch(`http://localhost:7000/api/prescription/consultations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      setEditingId(null);
    } else {
      // Create consultation
      await fetch('http://localhost:7000/api/prescription/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
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
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      await fetch(`http://localhost:7000/api/prescription/consultations/${id}`, {
        method: 'DELETE',
      });
      fetchConsultations();
    }
  };

  // Edit consultation
  const handleEdit = (consultation) => {
    // Remove "Dr." prefix when editing to avoid duplication
    const doctorName = consultation.doctor.replace(/^Dr\.\s*/i, '').trim();
    
    setFormData({
      doctor: doctorName,
      date: consultation.date.split("T")[0],
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
    <div className="sched-consult-wrapper">
      <div className="sched-consult-container">
        {/* Back to Dashboard Button */}
        <div className="sched-consult-nav">
          <button 
            onClick={handleBackToDashboard}
            className="sched-consult-back-btn"
            title="Back to Dashboard"
          >
            <span className="sched-consult-back-icon">←</span>
            <span className="sched-consult-back-text">Back to Dashboard</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="sched-consult-header">
          <div className="sched-consult-title">
            <div className="sched-consult-icon">🩺</div>
            <h1 className="sched-consult-heading">
              {editingId ? "Update Consultation" : "Schedule New Consultation"}
            </h1>
          </div>
          <p className="sched-consult-subtitle">
            Manage your medical appointments efficiently
          </p>
        </div>

        {/* Form Section */}
        <div className="sched-consult-form-card">
          <form onSubmit={handleSubmit} className="sched-consult-form">
            <div className="sched-consult-form-grid">
              <div className="sched-consult-form-group">
                <label className="sched-consult-label">Doctor Name</label>
                <input
                  name="doctor"
                  type="text"
                  placeholder="Enter doctor's name (e.g., John Smith)"
                  value={formData.doctor}
                  onChange={handleChange}
                  onKeyPress={(e) => handleKeyPress(e, 'doctor')}
                  className="sched-consult-input"
                  required
                />
                <small className="sched-consult-input-hint">
                  Enter name without "Dr." prefix - it will be added automatically. Only letters allowed.
                </small>
              </div>

              <div className="sched-consult-form-group">
                <label className="sched-consult-label">Date</label>
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="sched-consult-input"
                  min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  required
                />
              </div>

              <div className="sched-consult-form-group">
                <label className="sched-consult-label">Time</label>
                <input
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="sched-consult-input"
                  required
                />
              </div>

              <div className="sched-consult-form-group sched-consult-full-width">
                <label className="sched-consult-label">Reason for Consultation</label>
                <input
                  name="reason"
                  type="text"
                  placeholder="Brief description of the consultation reason"
                  value={formData.reason}
                  onChange={handleChange}
                  onKeyPress={(e) => handleKeyPress(e, 'reason')}
                  className="sched-consult-input"
                  required
                />
                <small className="sched-consult-input-hint">
                  Only alphabetic characters are allowed.
                </small>
              </div>

              <div className="sched-consult-form-group sched-consult-full-width">
                <label className="sched-consult-label">Additional Notes</label>
                <textarea
                  name="notes"
                  placeholder="Any additional information or special requirements..."
                  value={formData.notes}
                  onChange={handleChange}
                  className="sched-consult-textarea"
                  rows="4"
                />
              </div>
            </div>

            <div className="sched-consult-form-actions">
              <button type="submit" className="sched-consult-submit-btn">
                <span className="sched-consult-btn-icon">
                  {editingId ? "📝" : "📅"}
                </span>
                {editingId ? "Update Consultation" : "Schedule Consultation"}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ doctor: "", date: "", time: "", reason: "", notes: "" });
                  }}
                  className="sched-consult-cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Consultations List Section */}
        <div className="sched-consult-list-section">
          <div className="sched-consult-list-header">
            <h2 className="sched-consult-list-title">Scheduled Consultations</h2>
            <div className="sched-consult-count">
              {consultations.length} appointment{consultations.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="sched-consult-cards-container">
            {consultations.length === 0 ? (
              <div className="sched-consult-empty-state">
                <div className="sched-consult-empty-icon">📋</div>
                <h3>No consultations scheduled</h3>
                <p>Schedule your first consultation using the form above</p>
              </div>
            ) : (
              consultations.map((consultation, index) => (
                <div key={consultation._id || index} className="sched-consult-card">
                  <div className="sched-consult-card-header">
                    <div className="sched-consult-doctor-info">
                      <h3 className="sched-consult-doctor-name">
                        👨‍⚕️ {formatDoctorName(consultation.doctor)}
                      </h3>
                      <div className="sched-consult-datetime">
                        <span className="sched-consult-date">
                          📅 {new Date(consultation.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="sched-consult-time">
                          ⏰ {consultation.time}
                        </span>
                      </div>
                    </div>
                    <div className="sched-consult-actions">
                      <button
                        className="sched-consult-action-btn sched-consult-edit-btn"
                        onClick={() => handleEdit(consultation)}
                        title="Edit consultation"
                      >
                        ✏️
                      </button>
                      <button
                        className="sched-consult-action-btn sched-consult-delete-btn"
                        onClick={() => handleDelete(consultation._id)}
                        title="Delete consultation"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="sched-consult-card-body">
                    <div className="sched-consult-reason">
                      <strong>Reason:</strong> {consultation.reason}
                    </div>
                    {consultation.notes && consultation.notes.trim() && (
                      <div className="sched-consult-notes">
                        <strong>Notes:</strong> {consultation.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConsultation;
