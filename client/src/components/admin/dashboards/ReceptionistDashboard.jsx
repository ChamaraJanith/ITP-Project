import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import { adminDashboardApi } from "../../../services/adminApi.js";
import "./ReceptionistDashboard.css";
import { useNavigate } from "react-router-dom";

const ReceptionistDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate(); 

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      const response = await adminDashboardApi.accessReceptionistDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("❌ Error loading receptionist dashboard:", error);
      setError("Failed to load receptionist dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Receptionist Dashboard">
        <div className="loading">Loading receptionist dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Receptionist Dashboard">
      <div className="receptionist-dashboard">
        <div className="dashboard-header">
          <h1>👩‍💼 Receptionist Dashboard</h1>
          <p>Appointment scheduling & patient management</p>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            {/* ✅ Stats Section */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{dashboardData.stats?.todayAppointments || 0}</h3>
                <p>Today's Appointments</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.waitingPatients || 0}</h3>
                <p>Waiting Patients</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.completedToday || 0}</h3>
                <p>Completed Today</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.upcomingToday || 0}</h3>
                <p>Upcoming Today</p>
              </div>
            </div>

            {/* ✅ Features Section - Updated with correct paths */}
            <div className="features-section">
              <h2>🛠️ Available Features</h2>
              <div className="features-grid">
                <button
                  className="feature-card"
                  onClick={() => navigate("/receptionist/manage_appointments")}
                >
                  MANAGE APPOINTMENTS
                </button>
                
                {/* ✅ Updated: View Patients - Navigate to Patient List */}
                <button
                  className="feature-card"
                  onClick={() => navigate("/receptionist/patients")}
                >
                  VIEW PATIENTS
                </button>
                
                <button
                  className="feature-card"
                  onClick={() => navigate("/receptionist/check_in_patients")}
                >
                  CHECK IN PATIENTS
                </button>
                
                <button
                  className="feature-card"
                  onClick={() => navigate("/admin/doctor/view-consultations")}
                >
                  SCHEDULE APPOINTMENTS
                </button>
                
                {/* ✅ Updated: Patient Registration - Navigate to Registration Form */}
                <button
                  className="feature-card patient-registration-card"
                  onClick={() => navigate("/receptionist/patient_registration")}
                >
                  <div className="feature-icon">👥</div>
                  <div className="feature-title">PATIENT REGISTRATION</div>
                  <div className="feature-subtitle">Register new patients & generate QR codes</div>
                </button>

                {/* ✅ New: Quick Patient Search */}
                <button
                  className="feature-card patient-search-card"
                  onClick={() => navigate("/receptionist/patients")}
                >
                  <div className="feature-icon">🔍</div>
                  <div className="feature-title">PATIENT DATABASE</div>
                  <div className="feature-subtitle">Search & manage patient records</div>
                </button>
              </div>
            </div>

            {/* ✅ Quick Actions Section - New Patient Management Tools */}
            <div className="quick-actions-section">
              <h2>⚡ Quick Actions</h2>
              <div className="quick-actions-grid">
                <button
                  className="quick-action-btn register-patient"
                  onClick={() => navigate("/receptionist/patient_registration")}
                >
                  <span className="action-icon">➕</span>
                  <span className="action-text">Register New Patient</span>
                </button>
                
                <button
                  className="quick-action-btn view-patients"
                  onClick={() => navigate("/receptionist/patients")}
                >
                  <span className="action-icon">📋</span>
                  <span className="action-text">View All Patients</span>
                </button>
                
                <button
                  className="quick-action-btn emergency"
                  onClick={() => navigate("/emergency")}
                >
                  <span className="action-icon">🚨</span>
                  <span className="action-text">Emergency Registration</span>
                </button>
              </div>
            </div>

            {/* ✅ Recent Activities Section */}
            <div className="activity-section">
              <h2>📋 Recent Activities</h2>
              <div className="activity-list">
                {dashboardData.recentActivities?.length > 0 ? (
                  dashboardData.recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <p>{activity}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-activities">
                    <p>No recent activities to display</p>
                    <button
                      className="start-activity-btn"
                      onClick={() => navigate("/receptionist/patient_registration")}
                    >
                      Start by registering a patient
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReceptionistDashboard;
