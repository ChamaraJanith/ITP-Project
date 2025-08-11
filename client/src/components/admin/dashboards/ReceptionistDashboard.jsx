// src/components/admin/dashboards/ReceptionistDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    todayAppointments: 12,
    checkedInPatients: 8,
    waitingPatients: 4,
    totalPatients: 245
  });

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      if (parsedAdmin.role !== 'receptionist') {
        navigate('/admin/login');
        return;
      }
      setAdmin(parsedAdmin);
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  // ✅ Simple navigation to existing register.jsx
  const handleRegisterPatient = () => {
    navigate('/register');
  };

  if (!admin) {
    return <div className="loading">Loading receptionist dashboard...</div>;
  }

  return (
    <AdminLayout admin={admin} title="Receptionist Dashboard">
      <div className="receptionist-dashboard">
        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{dashboardData.todayAppointments}</h3>
              <p>Today's Appointments</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{dashboardData.checkedInPatients}</h3>
              <p>Checked In</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>{dashboardData.waitingPatients}</h3>
              <p>Waiting</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{dashboardData.totalPatients}</h3>
              <p>Total Patients</p>
            </div>
          </div>
        </div>

        {/* ✅ Simplified Quick Actions with Register Button */}
        <div className="quick-actions-section">
          <h2>🚀 Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={handleRegisterPatient}
            >
              <span className="btn-icon">➕</span>
              <div className="btn-content">
                <h4>Register Patient</h4>
                <p>Add new patient to system</p>
              </div>
            </button>
            
            <button className="action-btn secondary">
              <span className="btn-icon">📅</span>
              <div className="btn-content">
                <h4>Schedule Appointment</h4>
                <p>Book new appointment</p>
              </div>
            </button>
            
            <button className="action-btn tertiary">
              <span className="btn-icon">🔍</span>
              <div className="btn-content">
                <h4>Search Patient</h4>
                <p>Find patient records</p>
              </div>
            </button>
            
            <button className="action-btn quaternary">
              <span className="btn-icon">📞</span>
              <div className="btn-content">
                <h4>Call Patient</h4>
                <p>Contact patient directly</p>
              </div>
            </button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="schedule-section">
          <div className="section-header">
            <h2>📋 Today's Schedule</h2>
            <button className="btn-primary btn-small">View All</button>
          </div>
          
          <div className="appointment-timeline">
            <div className="appointment-slot">
              <div className="time-slot">09:00 AM</div>
              <div className="appointment-info">
                <h4>John Doe</h4>
                <p>Dr. Smith - General Consultation</p>
                <span className="status scheduled">Scheduled</span>
              </div>
              <div className="appointment-actions">
                <button className="btn-small btn-primary">Check In</button>
              </div>
            </div>
            
            <div className="appointment-slot">
              <div className="time-slot">10:30 AM</div>
              <div className="appointment-info">
                <h4>Jane Wilson</h4>
                <p>Dr. Johnson - Follow-up</p>
                <span className="status checked-in">Checked In</span>
              </div>
              <div className="appointment-actions">
                <button className="btn-small btn-secondary">In Progress</button>
              </div>
            </div>
            
            <div className="appointment-slot">
              <div className="time-slot">02:00 PM</div>
              <div className="appointment-info">
                <h4>Bob Brown</h4>
                <p>Dr. Davis - Check-up</p>
                <span className="status waiting">Waiting</span>
              </div>
              <div className="appointment-actions">
                <button className="btn-small btn-warning">Call Patient</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReceptionistDashboard;
