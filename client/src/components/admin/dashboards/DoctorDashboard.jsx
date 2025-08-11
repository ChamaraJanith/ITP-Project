// components/admin/dashboards/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    todayPatients: 0,
    pendingConsultations: 0,
    completedToday: 0,
    prescriptionsIssued: 0
  });

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      if (parsedAdmin.role !== 'doctor') {
        navigate('/admin/login');
        return;
      }
      setAdmin(parsedAdmin);
      loadDoctorData();
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  const loadDoctorData = async () => {
    // Mock data - replace with actual API calls
    setDashboardData({
      todayPatients: 8,
      pendingConsultations: 3,
      completedToday: 5,
      prescriptionsIssued: 12
    });
  };

  if (!admin) {
    return <div className="loading">Loading doctor dashboard...</div>;
  }

  return (
    <AdminLayout admin={admin} title="Doctor Dashboard">
      <div className="doctor-dashboard">
        {/* Doctor Profile Card */}
        <div className="doctor-profile-card">
          <div className="doctor-avatar">
            <span>{admin.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="doctor-info">
            <h2>Dr. {admin.name}</h2>
            <p>{admin.specialization || 'General Medicine'}</p>
            <div className="doctor-badges">
              <span className="badge verified">✅ Verified</span>
              <span className="badge active">🟢 Active</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card patients">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{dashboardData.todayPatients}</h3>
              <p>Today's Patients</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>{dashboardData.pendingConsultations}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{dashboardData.completedToday}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card prescriptions">
            <div className="stat-icon">💊</div>
            <div className="stat-info">
              <h3>{dashboardData.prescriptionsIssued}</h3>
              <p>Prescriptions</p>
            </div>
          </div>
        </div>

        {/* Quick Medical Actions */}
        <div className="medical-actions-section">
          <h2>🩺 Medical Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary">
              <span className="btn-icon">📝</span>
              <div className="btn-content">
                <h4>Create Prescription</h4>
                <p>Issue new prescription</p>
              </div>
            </button>
            
            <button className="action-btn secondary">
              <span className="btn-icon">📋</span>
              <div className="btn-content">
                <h4>Medical Records</h4>
                <p>View patient history</p>
              </div>
            </button>
            
            <button className="action-btn tertiary">
              <span className="btn-icon">🧪</span>
              <div className="btn-content">
                <h4>Lab Results</h4>
                <p>Review test results</p>
              </div>
            </button>
            
            <button className="action-btn quaternary">
              <span className="btn-icon">📞</span>
              <div className="btn-content">
                <h4>Telemedicine</h4>
                <p>Video consultation</p>
              </div>
            </button>
          </div>
        </div>

        {/* Patient Schedule */}
        <div className="patient-schedule-section">
          <div className="section-header">
            <h2>👨‍⚕️ Today's Patient Schedule</h2>
            <div className="schedule-controls">
              <button className="btn-secondary btn-small">View Calendar</button>
              <button className="btn-primary btn-small">Emergency</button>
            </div>
          </div>
          
          <div className="patient-timeline">
            <div className="patient-appointment">
              <div className="appointment-time">09:00 AM</div>
              <div className="patient-card">
                <div className="patient-info">
                  <h4>Alice Johnson</h4>
                  <p>Age: 34 | Consultation</p>
                  <div className="patient-tags">
                    <span className="tag urgent">Urgent</span>
                    <span className="tag follow-up">Follow-up</span>
                  </div>
                </div>
                <div className="patient-actions">
                  <button className="btn-small btn-primary">Start Consultation</button>
                </div>
              </div>
            </div>
            
            <div className="patient-appointment completed">
              <div className="appointment-time">10:30 AM</div>
              <div className="patient-card">
                <div className="patient-info">
                  <h4>Bob Wilson</h4>
                  <p>Age: 45 | Check-up</p>
                  <div className="patient-tags">
                    <span className="tag completed">Completed</span>
                  </div>
                </div>
                <div className="patient-actions">
                  <button className="btn-small btn-secondary">View Report</button>
                </div>
              </div>
            </div>
            
            <div className="patient-appointment">
              <div className="appointment-time">02:00 PM</div>
              <div className="patient-card">
                <div className="patient-info">
                  <h4>Carol Davis</h4>
                  <p>Age: 28 | Physical Exam</p>
                  <div className="patient-tags">
                    <span className="tag scheduled">Scheduled</span>
                  </div>
                </div>
                <div className="patient-actions">
                  <button className="btn-small btn-primary">Prepare</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DoctorDashboard;
