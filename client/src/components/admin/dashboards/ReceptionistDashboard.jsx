import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import { adminDashboardApi } from "../../../services/adminApi.js";
import "./ReceptionistDashboard.css";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";

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

            {/* ✅ Features Section - Styled like Medical Features */}
            <div className="features-section">
              <h2>🛠️ Available Features</h2>
              <div className="features-grid">
                <button
                  className="feature-card"
                  onClick={() =>
                    (window.location.href = "/receptionist/manage_appointments")
                  }
                >
                  MANAGE APPOINTMENTS
                </button>
                <button
                  className="feature-card"
                  onClick={() =>
                    (window.location.href = "/receptionist/view_patients")
                  }
                >
                  VIEW PATIENTS
                </button>
                <button
                  className="feature-card"
                  onClick={() =>
                    (window.location.href = "/receptionist/check_in_patients")
                  }
                >
                  CHECK IN PATIENTS
                </button>
                <button
                  className="feature-card"
                  onClick={() =>navigate("/admin/doctor/view-consultations") }
                >
                  SCHEDULE APPOINTMENTS
                </button>
                <button
                  className="feature-card"
                  onClick={() =>
                    (window.location.href = "/receptionist/patient_registration")
                  }
                >
                  PATIENT REGISTRATION
                </button>
              </div>
            </div>

            {/* ✅ Recent Activities Section */}
            <div className="activity-section">
              <h2>📋 Recent Activities</h2>
              <div className="activity-list">
                {dashboardData.recentActivities?.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <p>{activity}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReceptionistDashboard;
