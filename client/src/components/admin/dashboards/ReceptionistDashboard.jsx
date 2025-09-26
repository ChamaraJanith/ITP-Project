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
        <div className="rd-loading">Loading receptionist dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Receptionist Dashboard">
      <div className="rd-main-container">
        <div className="rd-header">
          <h1>👩‍💼 Receptionist Dashboard</h1>
          <p>Appointment scheduling & patient management</p>
        </div>

        {error && <div className="rd-error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            {/* ✅ Stats Section */}
            <div className="rd-stats-grid">
              <div className="rd-stat-card">
                <h3>{dashboardData.stats?.todayAppointments || 0}</h3>
                <p>Today's Appointments</p>
              </div>
              <div className="rd-stat-card">
                <h3>{dashboardData.stats?.waitingPatients || 0}</h3>
                <p>Waiting Patients</p>
              </div>
              <div className="rd-stat-card">
                <h3>{dashboardData.stats?.completedToday || 0}</h3>
                <p>Completed Today</p>
              </div>
              <div className="rd-stat-card">
                <h3>{dashboardData.stats?.upcomingToday || 0}</h3>
                <p>Upcoming Today</p>
              </div>
            </div>

            {/* ✅ Features Section - Updated with correct paths */}
            <div className="rd-features-section">
              <h2>🛠️ Available Features</h2>
              <div className="rd-features-grid">
                <button
                  className="rd-feature-card"
                  onClick={() => navigate("/receptionist/manage_appointments")}
                >
                  MANAGE APPOINTMENTS
                </button>
                
                {/* ✅ Updated: View Patients - Navigate to Patient List */}
                <button
                  className="rd-feature-card"
                  onClick={() => navigate("/receptionist/patients")}
                >
                  VIEW PATIENTS
                </button>
                
                <button
                  className="rd-feature-card"
                  onClick={() => navigate("/receptionist/check_in_patients")}
                >
                  CHECK IN PATIENTS
                </button>
                
                <button
                  className="rd-feature-card"
                  onClick={() => navigate("/admin/doctor/view-consultations")}
                >
                  VIEW CONSULTATIONS
                </button>
                
                {/* ✅ Updated: Patient Registration - Navigate to Registration Form */}
                <button
                  className="rd-feature-card rd-patient-registration-card"
                  onClick={() => navigate("/receptionist/patient_registration")}
                >
                  <div className="rd-feature-icon">👥</div>
                  <div className="rd-feature-title">PATIENT REGISTRATION</div>
                  <div className="rd-feature-subtitle">Register new patients & generate QR codes</div>
                </button>

                {/* ✅ New: Quick Patient Search */}
                <button
                  className="rd-feature-card rd-patient-search-card"
                  onClick={() => navigate("/receptionist/patients")}
                >
                  <div className="rd-feature-icon">🔍</div>
                  <div className="rd-feature-title">PATIENT DATABASE</div>
                  <div className="rd-feature-subtitle">Search & manage patient records</div>
                </button>
              </div>
            </div>

            {/* ✅ Quick Actions Section - New Patient Management Tools */}
            <div className="rd-quick-actions-section">
              <h2>Quick Actions</h2>
              <div className="rd-quick-actions-grid">
                <button
                  className="rd-quick-action-btn rd-register-patient"
                  onClick={() => navigate("/receptionist/patient_registration")}
                >
                  <span className="rd-action-icon">➕</span>
                  <span className="rd-action-text">Register New Patient</span>
                </button>
                
                <button
                  className="rd-quick-action-btn rd-view-patients"
                  onClick={() => navigate("/receptionist/patients")}
                >
                  <span className="rd-action-icon">📋</span>
                  <span className="rd-action-text">View All Patients</span>
                </button>
                
                <button
                  className="rd-quick-action-btn rd-emergency"
                  onClick={() => navigate("/emergency")}
                >
                  <span className="rd-action-icon">🚨</span>
                  <span className="rd-action-text">Emergency Registration</span>
                </button>
              </div>
            </div>

            {/* ✅ Recent Activities Section */}
            <div className="rd-activity-section">
              <h2>Recent Activities</h2>
              <div className="rd-activity-list">
                {dashboardData.recentActivities?.length > 0 ? (
                  dashboardData.recentActivities.map((activity, index) => (
                    <div key={index} className="rd-activity-item">
                      <p>{activity}</p>
                    </div>
                  ))
                ) : (
                  <div className="rd-no-activities">
                    <p>No recent activities to display</p>
                    <button
                      className="rd-start-activity-btn"
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
