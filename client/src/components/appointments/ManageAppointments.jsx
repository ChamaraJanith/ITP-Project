import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../appointments/styles/ManageAppointments.css';

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const backendUrl = 'http://localhost:7000';

// Removed duplicate handleAction function


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

  // Filter appointments based on status and search term
  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusClass = {
      'pending': 'status-pending',
      'accepted': 'status-accepted',
      'rejected': 'status-rejected'
    };
    
    return (
      <span className={`status-badge ${statusClass[status] || 'status-pending'}`}>
        {status || 'pending'}
      </span>
    );
  };

  

  const getUrgencyBadge = (urgency) => {
    const urgencyClass = {
      'normal': 'urgency-normal',
      'urgent': 'urgency-urgent',
      'emergency': 'urgency-emergency'
    };
    
    return (
      <span className={`urgency-badge ${urgencyClass[urgency] || 'urgency-normal'}`}>
        {urgency || 'normal'}
      </span>
    );
  };

  const formatDate = (dateString) => {
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


  if (loading) {
    return (
      <div className="manage-appointments">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-appointments">
      <div className="page-header">
        <h1>Manage Appointments</h1>
        <p>Review and manage patient appointment requests</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={fetchAppointments} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="controls-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by patient name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-container">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button onClick={fetchAppointments} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="appointments-stats">
        <div className="stat-card">
          <h3>{appointments.filter(a => a.status === 'pending' || !a.status).length}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.filter(a => a.status === 'accepted').length}</h3>
          <p>Accepted</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.filter(a => a.status === 'rejected').length}</h3>
          <p>Rejected</p>
        </div>
        <div className="stat-card">
          <h3>{appointments.length}</h3>
          <p>Total</p>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="no-appointments">
          <div className="no-appointments-icon">📅</div>
          <h3>No appointments found</h3>
          <p>
            {searchTerm 
              ? `No appointments match your search "${searchTerm}"`
              : filter !== 'all'
                ? `No ${filter} appointments available`
                : 'No appointments have been booked yet'
            }
          </p>
        </div>
      ) : (
        <div className="appointments-table-container">
          <table className="appointments-table">
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
                <tr key={appointment._id} className="appointment-row">
                  <td className="patient-info">
                    <div className="patient-name">{appointment.name}</div>
                    <div className="patient-details">
                      <span>Age: {appointment.age}</span>
                      <span>Gender: {appointment.gender}</span>
                      <span>Blood: {appointment.bloodGroup}</span>
                    </div>
                  </td>

                  <td className="contact-info">
                    <div className="contact-email">{appointment.email}</div>
                    <div className="contact-phone">{appointment.phone}</div>
                  </td>

                  <td className="appointment-details">
                    <div className="appointment-date">
                      📅 {formatDate(appointment.appointmentDate)}
                    </div>
                    <div className="appointment-time">
                      🕐 {formatTime(appointment.appointmentTime)}
                    </div>
                    <div className="appointment-doctor">
                      🩺 {appointment.doctorSpecialty}
                    </div>
                    <div className="appointment-type">
                      📋 {appointment.appointmentType}
                    </div>
                  </td>

                  <td className="medical-info">
                    {appointment.allergies && (
                      <div className="allergies">
                        <strong>Allergies:</strong> {appointment.allergies}
                      </div>
                    )}
                    {appointment.symptoms && (
                      <div className="symptoms">
                        <strong>Symptoms:</strong> {appointment.symptoms}
                      </div>
                    )}
                    {appointment.emergencyContactName && (
                      <div className="emergency-contact">
                        <strong>Emergency:</strong> {appointment.emergencyContactName} 
                        ({appointment.emergencyContactPhone})
                      </div>
                    )}
                  </td>

                  <td className="status-cell">
                    {getStatusBadge(appointment.status)}
                  </td>

                  <td className="urgency-cell">
                    {getUrgencyBadge(appointment.urgency)}
                  </td>

                  <td className="actions-cell">
                    {(!appointment.status || appointment.status === 'pending') && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleAction(appointment._id, 'accept')}
                          disabled={actionLoading[appointment._id] === 'accept'}
                          className="accept-btn"
                        >
                          {actionLoading[appointment._id] === 'accept' ? (
                            <>
                              <span className="loading-spinner small"></span>
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
                          className="reject-btn"
                        >
                          {actionLoading[appointment._id] === 'reject' ? (
                            <>
                              <span className="loading-spinner small"></span>
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
                      <div className="status-message accepted">
                        ✅ Accepted
                      </div>
                    )}

                    {appointment.status === 'rejected' && (
                      <div className="status-message rejected">
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
