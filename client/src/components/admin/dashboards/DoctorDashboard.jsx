import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import { adminDashboardApi } from "../../../services/adminApi.js";
import ScheduleConsultation from "../Doctor/ScheduleConsultation.jsx";
import { Navigate } from "react-router-dom";
import './DoctorDashboard.css'; // Assuming you have a CSS file for styling
import { useNavigate } from "react-router-dom";

const DoctorDashboard = () => {
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

      const response = await adminDashboardApi.accessDoctorDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("❌ Error loading doctor dashboard:", error);
      setError("Failed to load doctor dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Doctor Dashboard">
        <div className="loading">Loading doctor dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Doctor Dashboard">
      <div className="doctor-dashboard">
        <div className="dashboard-header">
          <h1>👩‍⚕️ Doctor Dashboard</h1>
          <p>Medical records & patient consultations</p>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            {/* Stats Section */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{dashboardData.stats?.todayPatients || 0}</h3>
                <p>Today's Patients</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.pendingReports || 0}</h3>
                <p>Pending Reports</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.consultationsCompleted || 0}</h3>
                <p>Consultations Completed</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.emergencyAlerts || 0}</h3>
                <p>Emergency Alerts</p>
              </div>
            </div>

            {/* Medical Features Section - MODIFIED */}
            <div className="features-section">
              <h2>🩺 Medical Features</h2>
              <div className="features-grid">
                <button
                  className="feature-card"
                  onClick={() => navigate("/admin/doctor/schedule-consultation")}
                >
                  SCHEDULE CONSULTATION
                </button>
                <button
                  className="feature-card"
                  onClick={() =>navigate("/admin/doctor/view-consultations") }
                >
                  PATIENT RECORDS
                </button>
                <button
                  className="feature-card"
                  onClick={() => alert("Lab Reports clicked")}
                >
                  LAB REPORTS
                </button>
                <button
                  className="feature-card"
                  onClick={() => alert("Prescriptions clicked")}
                >
                  PRESCRIPTIONS
                </button>
                <button
                  className="feature-card"
                  onClick={() => alert("Emergency Alerts clicked")}
                >
                  EMERGENCY ALERTS
                </button>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="activity-section">
              <h2>📋 Recent Medical Activities</h2>
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

export default DoctorDashboard;
