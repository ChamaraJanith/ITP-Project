// client/src/components/admin/Receptionist/PatientList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './PatientList.css'; // Import the CSS file

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/patients');
      if (response.data.success) {
        setPatients(response.data.data);
        toast.success('Patients loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handleDelete = async (id, patientName) => {
    if (window.confirm(`Are you sure you want to delete ${patientName}'s record? This action cannot be undone.`)) {
      try {
        await axios.delete(`http://localhost:7000/api/patients/${id}`);
        toast.success('Patient deleted successfully');
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error('Failed to delete patient');
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate('/admin/receptionist/');
  };

  if (loading) {
    return (
      <div className="patient-list-container">
        <div className="patient-list-card">
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading patients...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-list-container">
      <div className="patient-list-card">
        {/* Back to Dashboard Button */}
        <div className="back-to-dashboard-container">
          <button
            onClick={handleBackToDashboard}
            className="back-to-dashboard-btn"
          >
            <span className="back-icon">🏠</span>
            Back to Dashboard
          </button>
        </div>

        {/* Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-left">
              <div className="icon-container">
                <span className="header-icon">👥</span>
              </div>
              <div>
                <h1 className="header-title">Patient Database</h1>
                <p className="header-subtitle">Manage and search patient records</p>
              </div>
            </div>
            
            <div className="header-actions">
              <div className="patient-count">
                📊 {filteredPatients.length} of {patients.length} patients
              </div>
              <button
                onClick={() => navigate('/receptionist/patient_registration')}
                className="add-patient-btn"
              >
                <span>➕</span>
                Add New Patient
              </button>
              <button
                onClick={handleBackToDashboard}
                className="dashboard-btn-header"
              >
                <span>🏠</span>
                Dashboard
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name, ID, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          <table className="patients-table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Patient ID</th>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Contact Info</th>
                <th className="table-header-cell">Medical Info</th>
                <th className="table-header-cell">Registration Date</th>
                <th className="table-header-cell">QR Code</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="table-row">
                  <td className="table-cell">
                    <span className="patient-id-badge">
                      {patient.patientId}
                    </span>
                  </td>
                  
                  <td className="table-cell">
                    <div className="patient-info">
                      <div className="avatar-container">
                        <span className="avatar-icon">
                          {patient.gender === 'Male' ? '👨' : patient.gender === 'Female' ? '👩' : '👤'}
                        </span>
                      </div>
                      <div>
                        <div className="patient-name">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="patient-meta">
                          {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="table-cell-wrap">
                    <div className="contact-info">
                      <div className="contact-item">📧 {patient.email}</div>
                      <div className="contact-item-secondary">📞 {patient.phone}</div>
                    </div>
                  </td>
                  
                  <td className="table-cell-wrap">
                    <div className="medical-info">
                      {patient.bloodGroup && (
                        <span className="blood-group-badge">
                          🩸 {patient.bloodGroup}
                        </span>
                      )}
                      {patient.allergies && patient.allergies.length > 0 && (
                        <span className="allergies-badge">
                          ⚠️ {patient.allergies.length} allergies
                        </span>
                      )}
                      {(!patient.bloodGroup && (!patient.allergies || patient.allergies.length === 0)) && (
                        <span className="no-medical-data">No medical data</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="table-cell">
                    <div className="date-info">
                      <div className="date-main">{new Date(patient.registrationDate).toLocaleDateString()}</div>
                      <div className="date-sub">{new Date(patient.registrationDate).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  
                  <td className="table-cell">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="qr-code-btn"
                      title="View QR Code"
                    >
                      <span className="qr-icon">📱</span>
                    </button>
                  </td>
                  
                  <td className="table-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => navigate(`/receptionist/patients/${patient._id}`)}
                        className="view-btn"
                        title="View Details"
                      >
                        <span className="action-icon">👁️</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(patient._id, `${patient.firstName} ${patient.lastName}`)}
                        className="delete-btn"
                        title="Delete Patient"
                      >
                        <span className="action-icon">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredPatients.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <span className="empty-state-icon-emoji">👥</span>
              </div>
              {searchTerm ? (
                <>
                  <h3 className="empty-state-title">No patients found</h3>
                  <p className="empty-state-text">
                    No patients match your search criteria "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="clear-search-btn"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="empty-state-title">No patients registered yet</h3>
                  <p className="empty-state-text">
                    Get started by registering your first patient
                  </p>
                  <div className="empty-state-actions">
                    <button
                      onClick={() => navigate('/receptionist/patient_registration')}
                      className="register-first-btn"
                    >
                      <span>➕</span>
                      Register First Patient
                    </button>
                    <button
                      onClick={handleBackToDashboard}
                      className="empty-dashboard-btn"
                    >
                      <span>🏠</span>
                      Back to Dashboard
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-body">
              <div className="modal-icon-container">
                <span className="modal-icon">📱</span>
              </div>
              
              <h3 className="modal-title">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              
              <p className="modal-patient-id">
                Patient ID: <span className="modal-patient-id-value">{selectedPatient.patientId}</span>
              </p>
              
              <div className="qr-code-container">
                <img
                  src={selectedPatient.qrCodeData}
                  alt="Patient QR Code"
                  className="qr-code-image"
                />
              </div>
              
              <div className="modal-actions">
                <a
                  href={selectedPatient.qrCodeData}
                  download={`patient_${selectedPatient.patientId}_qr.png`}
                  className="download-btn"
                >
                  💾 Download QR Code
                </a>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPatient.patientId);
                    toast.success('Patient ID copied to clipboard!');
                  }}
                  className="copy-btn"
                >
                  📋 Copy Patient ID
                </button>
                
                <div className="modal-bottom-actions">
                  <button
                    onClick={() => navigate(`/receptionist/patients/${selectedPatient._id}`)}
                    className="view-details-btn"
                  >
                    👁️ View Details
                  </button>
                  
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="close-btn"
                  >
                    ✖️ Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
