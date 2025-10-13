import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../appointments/styles/ManageAppointments.css';

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  

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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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
        setAppointments(prev =>
          prev.map(appointment =>
            appointment._id === appointmentId
              ? { ...appointment, status: action === 'accept' ? 'accepted' : 'rejected' }
              : appointment
          )
        );
        alert(`Appointment ${action}ed successfully!`);
      }
    } catch (error) {
      alert(`Failed to ${action} appointment: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleBackToDashboard = () => {
    navigate('/admin/receptionist');
  };

  const filteredAppointments = appointments.filter(appointment => {
  const matchesFilter = filter === 'all' || appointment.status === filter;

  // Doctor filter
  const matchesDoctor = !doctorFilter ||
    (appointment.doctorName && appointment.doctorName.toLowerCase().includes(doctorFilter.toLowerCase()));

  // Date filter
  const matchesDate = !dateFilter ||
    (appointment.appointmentDate && appointment.appointmentDate.startsWith(dateFilter));

  // Department filter
  const matchesDepartment = !departmentFilter ||
    (appointment.doctorSpecialty && appointment.doctorSpecialty.toLowerCase().includes(departmentFilter.toLowerCase()));

  // Existing search logic
  const searchLower = searchTerm.toLowerCase().trim();
  const containsSearchTerm = (value) => {
    if (!value) return false;
    return String(value).toLowerCase().includes(searchLower);
  };
  const matchesSearch =
    containsSearchTerm(appointment.name) ||
    containsSearchTerm(appointment.patientName) ||
    containsSearchTerm(appointment.patient?.name) ||
    containsSearchTerm(appointment.email) ||
    containsSearchTerm(appointment.patientEmail) ||
    containsSearchTerm(appointment.patient?.email) ||
    containsSearchTerm(appointment.phone) ||
    containsSearchTerm(appointment.phoneNumber) ||
    containsSearchTerm(appointment.patientPhone) ||
    containsSearchTerm(appointment.patient?.phone) ||
    containsSearchTerm(appointment.patient?.phoneNumber) ||
    containsSearchTerm(appointment.emergencyContactName) ||
    containsSearchTerm(appointment.doctorSpecialty) ||
    containsSearchTerm(appointment.appointmentType);

  return matchesFilter && matchesDoctor && matchesDate && matchesDepartment && matchesSearch;
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
    if (!timeString || typeof timeString !== 'string') {
      return 'Time not set';
    }
    if (!timeString.includes(':')) {
      return timeString;
    }
    try {
      const [hours, minutes] = timeString.split(':');
      if (!hours || !minutes) {
        return timeString;
      }
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return timeString || 'Invalid time';
    }
  };

  const getPatientData = (appointment, field) => {
    return appointment[field] ||
      appointment.patient?.[field] ||
      appointment[`patient${field.charAt(0).toUpperCase() + field.slice(1)}`] ||
      'N/A';
  };

  // --- REPORT GENERATION SECTION ---
  const exportToPDF = () => {
    const currentDate = new Date();
    const pendingCount = appointments.filter(a => a.status === 'pending' || !a.status).length;
    const acceptedCount = appointments.filter(a => a.status === 'accepted').length;
    const rejectedCount = appointments.filter(a => a.status === 'rejected').length;
    const totalCount = appointments.length;

    const tableRows = filteredAppointments.map(appointment => `
      <tr>
        <td>
          <div><strong>${getPatientData(appointment, 'name')}</strong></div>
          <div>Age: ${getPatientData(appointment, 'age')}</div>
          <div>Gender: ${getPatientData(appointment, 'gender')}</div>
          <div>Blood: ${getPatientData(appointment, 'bloodGroup') || appointment.bloodType || 'N/A'}</div>
        </td>
        <td>
          <div>${getPatientData(appointment, 'email')}</div>
          <div>${getPatientData(appointment, 'phone') || getPatientData(appointment, 'phoneNumber')}</div>
        </td>
        <td>
          <div>📅 ${formatDate(appointment.appointmentDate || appointment.date)}</div>
          <div>🕐 ${formatTime(appointment.appointmentTime || appointment.time)}</div>
          <div>🩺 ${appointment.doctorSpecialty || appointment.specialty || appointment.doctor || 'N/A'}</div>
          <div>📋 ${appointment.appointmentType || appointment.type || 'General'}</div>
        </td>
        <td>
          ${appointment.allergies ? `<div><strong>Allergies:</strong> ${appointment.allergies}</div>` : ''}
          ${appointment.symptoms ? `<div><strong>Symptoms:</strong> ${appointment.symptoms}</div>` : ''}
          ${appointment.emergencyContactName ? `<div><strong>Emergency:</strong> ${appointment.emergencyContactName} (${appointment.emergencyContactPhone})</div>` : ''}
          ${!appointment.allergies && !appointment.symptoms && !appointment.emergencyContactName ? `<div>No additional medical info</div>` : ''}
        </td>
        <td>
          <span style="padding:3px 9px; border-radius:10px; background:${
            appointment.status === 'accepted'
              ? '#D1FAE5'
              : appointment.status === 'rejected'
              ? '#FEE2E2'
              : '#FEF9C3'
          }; color:#222;">
            ${appointment.status ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : 'Pending'}
          </span>
        </td>
        <td>
          <span style="padding:3px 9px; border-radius:10px; background:${
            appointment.urgency === 'emergency'
              ? '#F87171'
              : appointment.urgency === 'urgent'
              ? '#FBBF24'
              : '#A7F3D0'
          }; color:#111;">
            ${appointment.urgency || appointment.priority || 'normal'}
          </span>
        </td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Appointments Report</title>
      <style>
        body { font-family: Arial,sans-serif; margin: 20px; font-size: 12px; color: #222; }
        .header { text-align: center; border-bottom: 2px solid #1da1f2; padding-bottom: 16px; margin-bottom: 20px;}
        .header h1 { color: #1da1f2; font-size: 23px; margin: 0;}
        .header p { margin: 6px 0 0 0; color: #666; font-size: 14px;}
        .info { text-align: right; color: #555; font-size: 11px; margin-bottom: 14px;}
        .summary-section { background: #f8f9fa; border-radius: 6px; padding: 12px 20px; margin-bottom: 30px;}
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap:14px;}
        .summary-card { background: #fff; border: 1px solid #ddd; border-radius: 5px; padding: 12px;}
        .summary-card h4 { color: #1da1f2; font-size: 13px; margin:0 0 3px 0;}
        .summary-card .metric-value { font-size: 18px; font-weight:bold; color:#222;}
        .summary-card .metric-label { font-size:11px; color:#888;}
        table { width: 100%; border-collapse: collapse; margin-bottom: 23px; font-size:10px;}
        th, td { border: 1px solid #ddd; padding: 8px; vertical-align:top;}
        th { background: #1da1f2; color:#fff; font-weight:bold;}
        tr:nth-child(even) { background: #f4f8fb; }
        .footer { text-align:center; color: #888; font-size:10px; border-top:1px solid #ddd; padding-top:11px; margin-top:26px; }
        .company-stamp { text-align:center; margin-top:24px; margin-left:270px ;padding:10px; border:2px solid #1da1f2; display:inline-block; font-size: 11px; color: #1da1f2; font-weight: bold;}
        @media print { .no-print {display:none;} body{margin:10px;} }
        .no-print { margin-top:22px; text-align:center;}
        .signature-section { margin-top:40px; }
        .signature-block { width:30%; display:inline-block; text-align:center; margin:10px;}
        .signature-line { border-bottom:2px dotted #222; width:140px; height:32px; margin:0 auto 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Heal-X Appointments Report</h1>
        <p>Manual Export &ndash; All Appointment Data Summary</p>
      </div>
      <div class="info">
        <strong>Generated on:</strong> ${currentDate.toLocaleString()}<br>
        <strong>Report Type:</strong> Appointment Management<br>
        <strong>Data Source:</strong> Live Database API<br>
        <strong>Filter:</strong> Status = ${filter.charAt(0).toUpperCase() + filter.slice(1)}, Search = "${searchTerm || 'None'}"
      </div>
      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-card">
            <h4>Pending</h4>
            <div class="metric-value">${pendingCount}</div>
            <div class="metric-label">Unprocessed</div>
          </div>
          <div class="summary-card">
            <h4>Accepted</h4>
            <div class="metric-value">${acceptedCount}</div>
            <div class="metric-label">Confirmed</div>
          </div>
          <div class="summary-card">
            <h4>Rejected</h4>
            <div class="metric-value">${rejectedCount}</div>
            <div class="metric-label">Cancelled</div>
          </div>
          <div class="summary-card">
            <h4>Total Appointments</h4>
            <div class="metric-value">${totalCount}</div>
            <div class="metric-label">Overall</div>
          </div>
          <div class="summary-card">
            <h4>Filtered Results</h4>
            <div class="metric-value">${filteredAppointments.length}</div>
            <div class="metric-label">For Current Search/Filter</div>
          </div>
        </div>
      </div>
      <h3 style="color:#1da1f2;margin-bottom:5px;">Appointments Table</h3>
      <table>
        <thead>
          <tr>
            <th>Patient Info</th>
            <th>Contact</th>
            <th>Appointment Details</th>
            <th>Medical Info</th>
            <th>Status</th>
            <th>Urgency</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || `<tr><td colspan="7" style="text-align:center;color:#999;">No data found</td></tr>`}
        </tbody>
      </table>
      <div class="signature-section">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div style="font-size:11px;font-weight:bold;">Receptionist / Clerk</div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div style="font-size:11px;font-weight:bold;">Admin (Heal-X)</div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div style="font-size:11px;font-weight:bold;">Authorized By</div>
        </div>
      </div>
      <div class="company-stamp">
        SEAL<br>HEAL-X OFFICIAL<br>HEALTHCARE MANAGEMENT SYSTEM
      </div>
      <div class="footer">
        <p><strong>This report is system generated &mdash; Heal-X Healthcare</strong></p>
        <p>Contact: info@heal-x.com | All data confidential</p>
        <p>Generated: ${currentDate.toLocaleString()} | For official use only</p>
      </div>
      <div class="no-print">
        <button onclick="window.print()" style="background:#1da1f2;color:#fff;border:none;padding:10px 24px;border-radius:5px;font-size:13px;cursor:pointer;">Print PDF Report</button>
        <button onclick="window.close()" style="background:#6c757d;color:#fff;border:none;padding:10px 24px;border-radius:5px;font-size:13px;cursor:pointer;margin-left:10px;">Close</button>
      </div>
    </body>
    </html>
    `;

    const printWindow = window.open('', '', 'width=1200,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
  };
  // --- END REPORT GENERATION SECTION ---

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

        <div className="ma-unique-filter-container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label htmlFor="doctor-filter">Doctor:</label>
          <input
            type="text"
            id="doctor-filter"
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            placeholder="Doctor name"
            className="ma-unique-filter-input"
            style={{ minWidth: '120px' }}
          />
          <label htmlFor="date-filter">Date:</label>
          <input
            type="date"
            id="date-filter"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="ma-unique-filter-input"
            style={{ minWidth: '120px' }}
          />
          <label htmlFor="department-filter">Department:</label>
          <input
            type="text"
            id="department-filter"
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            placeholder="Department/Specialty"
            className="ma-unique-filter-input"
            style={{ minWidth: '120px' }}
          />
        </div>

        <button onClick={fetchAppointments} className="ma-unique-refresh-btn">
          🔄 Refresh
        </button>

        {/* --- PDF Report Button --- */}
        <button
          onClick={exportToPDF}
          className="ma-unique-report-btn"
          style={{
            marginLeft: '16px',
            background: '#1da1f2',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            padding: '9px 22px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          📄 Generate PDF Report
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
