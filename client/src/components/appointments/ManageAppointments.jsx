import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../appointments/styles/ManageAppointments.css';

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const navigate = useNavigate();
  const backendUrl = 'http://localhost:7000';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${backendUrl}/api/appointments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // If using auth
        }
      });
      
      console.log('API Response:', response.data); // Debug log
      
      // Handle different response structures
      if (response.data.appointments) {
        setAppointments(response.data.appointments);
      } else if (Array.isArray(response.data)) {
        setAppointments(response.data);
      } else if (response.data.success && response.data.data) {
        setAppointments(response.data.data);
      } else {
        setAppointments([]);
        setError('Unexpected response format');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setAppointments([]);
      setError(error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appointmentId, action) => {
    setActionLoading(prev => ({ ...prev, [appointmentId]: action }));
    
    try {
      const response = await axios.put(
        `${backendUrl}/api/appointments/${appointmentId}/${action}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        // Update the specific appointment in state instead of refetching all
        setAppointments(prev => 
          prev.map(appointment => 
            appointment._id === appointmentId 
              ? { ...appointment, status: action === 'accept' ? 'accepted' : 'rejected' }
              : appointment
          )
        );
        
        // Show success message
        alert(`Appointment ${action}ed successfully!`);
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      alert(`Failed to ${action} appointment: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleBackToDashboard = () => {
    navigate('/admin/receptionist');
  };

  // Enhanced search function with better null handling and multiple property checks
  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    
    // If no search term, only apply status filter
    if (!searchTerm || searchTerm.trim() === '') {
      return matchesFilter;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Helper function to safely check if a value contains the search term
    const containsSearchTerm = (value) => {
      if (!value) return false;
      return String(value).toLowerCase().includes(searchLower);
    };
    
    // Check multiple possible property names for patient info
    const matchesSearch = 
      // Patient name variations
      containsSearchTerm(appointment.name) ||
      containsSearchTerm(appointment.patientName) ||
      containsSearchTerm(appointment.patient?.name) ||
      
      // Email variations
      containsSearchTerm(appointment.email) ||
      containsSearchTerm(appointment.patientEmail) ||
      containsSearchTerm(appointment.patient?.email) ||
      
      // Phone variations
      containsSearchTerm(appointment.phone) ||
      containsSearchTerm(appointment.phoneNumber) ||
      containsSearchTerm(appointment.patientPhone) ||
      containsSearchTerm(appointment.patient?.phone) ||
      containsSearchTerm(appointment.patient?.phoneNumber) ||
      
      // Additional searchable fields
      containsSearchTerm(appointment.emergencyContactName) ||
      containsSearchTerm(appointment.doctorSpecialty) ||
      containsSearchTerm(appointment.appointmentType);
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusClass = {
      'pending': 'ma-unique-status-pending',
      'accepted': 'ma-unique-status-accepted',
      'rejected': 'ma-unique-status-rejected'
    };
    
    return (
      <span className={`ma-unique-status-badge ${statusClass[status] || 'ma-unique-status-pending'}`}>
        {status || 'pending'}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyClass = {
      'normal': 'ma-unique-urgency-normal',
      'urgent': 'ma-unique-urgency-urgent',
      'emergency': 'ma-unique-urgency-emergency'
    };
    
    return (
      <span className={`ma-unique-urgency-badge ${urgencyClass[urgency] || 'ma-unique-urgency-normal'}`}>
        {urgency || 'normal'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // Add null/undefined check
    if (!timeString || typeof timeString !== 'string') {
      return 'Time not set';
    }
    
    // Check if timeString contains ':'
    if (!timeString.includes(':')) {
      return timeString; // Return as-is if it's not in HH:MM format
    }
    
    try {
      const [hours, minutes] = timeString.split(':');
      
      // Additional validation
      if (!hours || !minutes) {
        return timeString; // Return original if split didn't work properly
      }
      
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString || 'Invalid time';
    }
  };

  // Helper function to safely get patient data
  const getPatientData = (appointment, field) => {
    return appointment[field] || 
           appointment.patient?.[field] || 
           appointment[`patient${field.charAt(0).toUpperCase() + field.slice(1)}`] || 
           'N/A';
  };

  if (loading) {
    return (
      <div className="ma-unique-manage-appointments">
        <div className="ma-unique-loading-container">
          <div className="ma-unique-loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ma-unique-manage-appointments">
      <div className="ma-unique-page-header">
        <button 
          onClick={handleBackToDashboard} 
          className="ma-unique-back-btn"
        >
          ← Back to Dashboard
        </button>
        <h1>Manage Appointments</h1>
        <p>Review and manage patient appointment requests</p>
      </div>

      {error && (
        <div className="ma-unique-error-message">
          <span className="ma-unique-error-icon">⚠️</span>
          {error}
          <button onClick={fetchAppointments} className="ma-unique-retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="ma-unique-controls-section">
        <div className="ma-unique-search-container">
          <input
            type="text"
            placeholder="Search by patient name, email, phone, or doctor specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ma-unique-search-input"
          />
          <span className="ma-unique-search-icon">🔍</span>
        </div>

        <div className="ma-unique-filter-container">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ma-unique-filter-select"
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button onClick={fetchAppointments} className="ma-unique-refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="ma-unique-appointments-stats">
        <div className="ma-unique-stat-card ma-unique-stat-pending">
          <h3>{appointments.filter(a => a.status === 'pending' || !a.status).length}</h3>
          <p>Pending</p>
        </div>
        <div className="ma-unique-stat-card ma-unique-stat-accepted">
          <h3>{appointments.filter(a => a.status === 'accepted').length}</h3>
          <p>Accepted</p>
        </div>
        <div className="ma-unique-stat-card ma-unique-stat-rejected">
          <h3>{appointments.filter(a => a.status === 'rejected').length}</h3>
          <p>Rejected</p>
        </div>
        <div className="ma-unique-stat-card ma-unique-stat-total">
          <h3>{appointments.length}</h3>
          <p>Total</p>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="ma-unique-search-info">
          <p>
            Showing {filteredAppointments.length} result{filteredAppointments.length !== 1 ? 's' : ''} 
            for "{searchTerm}"
            {filter !== 'all' && ` with status: ${filter}`}
          </p>
        </div>
      )}

      {filteredAppointments.length === 0 ? (
        <div className="ma-unique-no-appointments">
          <div className="ma-unique-no-appointments-icon">📅</div>
          <h3>No appointments found</h3>
          <p>
            {searchTerm 
              ? `No appointments match your search "${searchTerm}"`
              : filter !== 'all'
                ? `No ${filter} appointments available`
                : 'No appointments have been booked yet'
            }
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="ma-unique-clear-search-btn"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="ma-unique-appointments-table-container">
          <table className="ma-unique-appointments-table">
            <thead>
              <tr>
                <th>Patient Info</th>
                <th>Contact</th>
                <th>Appointment Details</th>
                <th>Medical Info</th>
                <th>Status</th>
                <th>Urgency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(appointment => (
                <tr key={appointment._id} className="ma-unique-appointment-row">
                  <td className="ma-unique-patient-info">
                    <div className="ma-unique-patient-name">
                      {getPatientData(appointment, 'name')}
                    </div>
                    <div className="ma-unique-patient-details">
                      <span>Age: {getPatientData(appointment, 'age')}</span>
                      <span>Gender: {getPatientData(appointment, 'gender')}</span>
                      <span>Blood: {getPatientData(appointment, 'bloodGroup') || appointment.bloodType || 'N/A'}</span>
                    </div>
                  </td>

                  <td className="ma-unique-contact-info">
                    <div className="ma-unique-contact-email">
                      {getPatientData(appointment, 'email')}
                    </div>
                    <div className="ma-unique-contact-phone">
                      {getPatientData(appointment, 'phone') || getPatientData(appointment, 'phoneNumber')}
                    </div>
                  </td>

                  <td className="ma-unique-appointment-details">
                    <div className="ma-unique-appointment-date">
                      📅 {formatDate(appointment.appointmentDate || appointment.date)}
                    </div>
                    <div className="ma-unique-appointment-time">
                      🕐 {formatTime(appointment.appointmentTime || appointment.time)}
                    </div>
                    <div className="ma-unique-appointment-doctor">
                      🩺 {appointment.doctorSpecialty || appointment.specialty || appointment.doctor || 'N/A'}
                    </div>
                    <div className="ma-unique-appointment-type">
                      📋 {appointment.appointmentType || appointment.type || 'General'}
                    </div>
                  </td>

                  <td className="ma-unique-medical-info">
                    {appointment.allergies && (
                      <div className="ma-unique-allergies">
                        <strong>Allergies:</strong> {appointment.allergies}
                      </div>
                    )}
                    {appointment.symptoms && (
                      <div className="ma-unique-symptoms">
                        <strong>Symptoms:</strong> {appointment.symptoms}
                      </div>
                    )}
                    {appointment.emergencyContactName && (
                      <div className="ma-unique-emergency-contact">
                        <strong>Emergency:</strong> {appointment.emergencyContactName} 
                        ({appointment.emergencyContactPhone})
                      </div>
                    )}
                    {!appointment.allergies && !appointment.symptoms && !appointment.emergencyContactName && (
                      <div className="ma-unique-no-medical-info">No additional medical info</div>
                    )}
                  </td>

                  <td className="ma-unique-status-cell">
                    {getStatusBadge(appointment.status)}
                  </td>

                  <td className="ma-unique-urgency-cell">
                    {getUrgencyBadge(appointment.urgency || appointment.priority)}
                  </td>

                  <td className="ma-unique-actions-cell">
                    {(!appointment.status || appointment.status === 'pending') && (
                      <div className="ma-unique-action-buttons">
                        <button
                          onClick={() => handleAction(appointment._id, 'accept')}
                          disabled={actionLoading[appointment._id] === 'accept'}
                          className="ma-unique-accept-btn"
                        >
                          {actionLoading[appointment._id] === 'accept' ? (
                            <>
                              <span className="ma-unique-loading-spinner ma-unique-small"></span>
                              Accepting...
                            </>
                          ) : (
                            <>
                              ✅ Accept
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAction(appointment._id, 'reject')}
                          disabled={actionLoading[appointment._id] === 'reject'}
                          className="ma-unique-reject-btn"
                        >
                          {actionLoading[appointment._id] === 'reject' ? (
                            <>
                              <span className="ma-unique-loading-spinner ma-unique-small"></span>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              ❌ Reject
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {appointment.status === 'accepted' && (
                      <div className="ma-unique-status-message ma-unique-accepted">
                        ✅ Accepted
                      </div>
                    )}

                    {appointment.status === 'rejected' && (
                      <div className="ma-unique-status-message ma-unique-rejected">
                        ❌ Rejected
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments;
