// DoctorDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../AdminLayout";
import { adminDashboardApi } from "../../../services/adminApi.js";
import { useNavigate } from "react-router-dom";
import EmergencyAlertsPage from "../Doctor/EmergencyAlertsPage.jsx";
import { getAllPrescriptions } from "../../../services/prescriptionService";
import axios from "axios";
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState('dashboard');
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [todayPrescriptionsCount, setTodayPrescriptionsCount] = useState(0);
  const [todayPatientsCount, setTodayPatientsCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  
  const backendUrl = "http://localhost:7000";
  const isMounted = useRef(true);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for when API is unavailable
  const mockDashboardData = {
    stats: {
      todayPatients: 8,
      pendingReports: 3,
      consultationsCompleted: 12,
      emergencyAlerts: 1
    },
    recentActivities: [
      { id: 1, text: "Completed consultation with Patient #1234", time: "10:30 AM" },
      { id: 2, text: "Reviewed lab results for Patient #5678", time: "9:15 AM" },
      { id: 3, text: "Updated prescription for Patient #9012", time: "Yesterday" }
    ],
    upcomingAppointments: [
      { id: 1, patient: "John Smith", time: "11:00 AM", type: "Follow-up" },
      { id: 2, patient: "Emma Johnson", time: "1:30 PM", type: "Consultation" },
      { id: 3, patient: "Michael Brown", time: "3:00 PM", type: "Examination" }
    ],
    doctorSchedule: [
      { id: 1, day: "Monday", time: "9:00 AM - 5:00 PM", available: true },
      { id: 2, day: "Tuesday", time: "9:00 AM - 1:00 PM", available: true },
      { id: 3, day: "Wednesday", time: "10:00 AM - 4:00 PM", available: true },
      { id: 4, day: "Thursday", time: "9:00 AM - 5:00 PM", available: false },
      { id: 5, day: "Friday", time: "9:00 AM - 3:00 PM", available: true },
    ]
  };

  // Function to check if a date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Function to check if appointment time has passed
  const isTimePassed = (appointmentTime) => {
    if (!appointmentTime) return false;
    
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date();
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    return appointmentDateTime < currentTime;
  };

  // Function to format time
  const formatTime = (time) => {
    if (!time || typeof time !== "string") return "Time not set";
    const parts = time.split(":");
    if (parts.length !== 2) return time;
    const hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${parts[1]} ${ampm}`;
  };

  // Function to filter prescriptions for today
  const filterTodaysPrescriptions = (prescriptions) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return prescriptions.filter((prescription) => {
      const prescriptionDate = prescription.date?.slice(0, 10);
      return prescriptionDate === todayStr;
    });
  };

  // Fetch today's prescriptions count
  const fetchTodayPrescriptionsCount = async () => {
    if (!isMounted.current) return;
    
    try {
      const res = await getAllPrescriptions();
      const allPrescriptions = res.data?.data || [];
      const todaysPrescriptions = filterTodaysPrescriptions(allPrescriptions);
      
      if (isMounted.current) {
        setTodayPrescriptionsCount(todaysPrescriptions.length);
      }
    } catch (err) {
      console.error("Failed to fetch today's prescriptions count:", err);
      if (isMounted.current) {
        setTodayPrescriptionsCount(0);
      }
    }
  };

  // Fetch today's upcoming appointments
  const fetchUpcomingAppointments = async () => {
    if (!isMounted.current) return;
    
    try {
      const res = await axios.get(`${backendUrl}/api/appointments/accepted`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const allAppointments = res.data.appointments || [];
      
      // Filter today's appointments that haven't passed yet
      const todayUpcoming = allAppointments.filter(appt => {
        return isToday(appt.appointmentDate) && !isTimePassed(appt.appointmentTime);
      });
      
      // Sort by time (earliest first)
      todayUpcoming.sort((a, b) => {
        const timeA = a.appointmentTime || "23:59";
        const timeB = b.appointmentTime || "23:59";
        return timeA.localeCompare(timeB);
      });
      
      // Count unique patients for today
      const todayAppts = allAppointments.filter(appt => isToday(appt.appointmentDate));
      const uniquePatients = new Set(todayAppts.map(appt => appt.email || appt.phone || appt.name));
      
      if (isMounted.current) {
        setUpcomingAppointments(todayUpcoming);
        setTodayPatientsCount(uniquePatients.size);
      }
    } catch (err) {
      console.error("Failed to fetch upcoming appointments:", err);
      if (isMounted.current) {
        setUpcomingAppointments([]);
        setTodayPatientsCount(0);
      }
    }
  };

  // Doctor information
  const [doctor] = useState({
    id: 'DOC001',
    name: 'Dr. Gayath Dahanayake',
    specialization: 'Emergency Medicine'
  });

  const fetchEmergencyAlertCount = async () => {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch('http://localhost:7000/api/doctor/emergency-alerts/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && isMounted.current) {
          setDashboardData(prev => ({
            ...prev,
            stats: {
              ...prev?.stats,
              emergencyAlerts: data.data.overview?.activeAlerts || 0
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching emergency alert count:", error);
    }
  };

  const initializeDashboard = async () => {
    if (!isMounted.current) return;
    
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      const response = await adminDashboardApi.accessDoctorDashboard();
      if (response.success) {
        if (isMounted.current) {
          setDashboardData(response.data);
          setApiUnavailable(false);
        }
      } else {
        if (isMounted.current) {
          setDashboardData(mockDashboardData);
          setApiUnavailable(true);
        }
      }
      
      await fetchEmergencyAlertCount();
      await fetchTodayPrescriptionsCount();
      await fetchUpcomingAppointments();
    } catch (error) {
      console.error("❌ Error loading doctor dashboard:", error);
      if (isMounted.current) {
        setError("Failed to load doctor dashboard. Using demo data.");
        setDashboardData(mockDashboardData);
        setApiUnavailable(true);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleEmergencyAlertsClick = () => {
    if (isMounted.current) {
      setCurrentView('emergency-alerts');
    }
  };

  const handleStartConsultation = (appointment) => {
    // Navigate to consultation page or open consultation modal
    navigate(`/admin/doctor/consultation/${appointment._id}`, {
      state: { patient: appointment }
    });
  };

  const handleRetryApiConnection = () => {
    if (isMounted.current) {
      setLoading(true);
      setError("");
      initializeDashboard();
    }
  };

  useEffect(() => {
    isMounted.current = true;
    initializeDashboard();
    
    // Refresh appointments every 5 minutes
    const appointmentInterval = setInterval(fetchUpcomingAppointments, 300000);
    
    return () => {
      isMounted.current = false;
      clearInterval(appointmentInterval);
    };
  }, []);

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Doctor Dashboard">
        <div className="doctor-dashboard-loading-container">
          <div className="doctor-dashboard-loading-spinner"></div>
          <p>Loading doctor dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (currentView === 'emergency-alerts') {
    return (
      <AdminLayout admin={admin} title="Emergency Alerts">
        <div className="doctor-dashboard-back-button-container">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="doctor-dashboard-back-button"
          >
            ← Back to Dashboard
          </button>
        </div>
        <EmergencyAlertsPage doctor={doctor} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Doctor Dashboard">
      <div className="doctor-dashboard-container">
        {/* Header Section */}
        <div className="doctor-dashboard-header-section">
          <div className="doctor-dashboard-welcome">
            <h1>Doctor Dashboard</h1>
            <p>Welcome back, Dr. Dahanayake</p>
          </div>
          <div className="doctor-dashboard-doctor-info">
            <div className="doctor-dashboard-doctor-avatar">
              <div className="doctor-dashboard-male-doctor-icon">👨‍⚕️</div>
            </div>
            <div className="doctor-dashboard-doctor-details">
              <h3>{doctor.name}</h3>
              <p>{doctor.specialization}</p>
            </div>
          </div>
        </div>

        {apiUnavailable && (
          <div className="doctor-dashboard-api-unavailable">
            <div className="doctor-dashboard-api-unavailable-content">
              <span>⚠️ Backend connection unavailable. Using demo data.</span>
              <button 
                onClick={handleRetryApiConnection}
                className="doctor-dashboard-retry-button"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {error && !apiUnavailable && (
          <div className="doctor-dashboard-error">
            ⚠️ {error}
            <button 
              onClick={handleRetryApiConnection}
              className="doctor-dashboard-retry-button"
            >
              Retry
            </button>
          </div>
        )}

        {dashboardData && (
          <>
            {/* Stats Section */}
            <div className="doctor-dashboard-stats-section">
              <div className="doctor-dashboard-stats-grid">
                <div className="doctor-dashboard-stat-card doctor-dashboard-patients-card">
                  <div className="doctor-dashboard-stat-icon">👥</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{todayPatientsCount}</h3>
                    <p>Today's Patients</p>
                  </div>
                </div>
                <div className="doctor-dashboard-stat-card doctor-dashboard-reports-card">
                  <div className="doctor-dashboard-stat-icon">📋</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{dashboardData.stats?.pendingReports || 0}</h3>
                    <p>Pending Reports</p>
                  </div>
                </div>
                <div className="doctor-dashboard-stat-card doctor-dashboard-consultations-card">
                  <div className="doctor-dashboard-stat-icon">💬</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{todayPrescriptionsCount}</h3>
                    <p>Consultations</p>
                  </div>
                </div>
                <div className={`doctor-dashboard-stat-card doctor-dashboard-alerts-card ${
                  dashboardData.stats?.emergencyAlerts > 0 ? 'doctor-dashboard-has-alerts' : ''
                }`} onClick={handleEmergencyAlertsClick}>
                  <div className="doctor-dashboard-stat-icon">🚨</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{dashboardData.stats?.emergencyAlerts || 0}</h3>
                    <p>Emergency Alerts</p>
                  </div>
                  {dashboardData.stats?.emergencyAlerts > 0 && (
                    <div className="doctor-dashboard-alert-badge">{dashboardData.stats.emergencyAlerts}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="doctor-dashboard-content-grid">
              {/* Upcoming Appointments Section - MODIFIED */}
              <div className="doctor-dashboard-appointments-section">
                <div className="doctor-dashboard-section-header">
                  <h2>Today's Appointments</h2>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => navigate("/admin/doctor/appointments")}
                  >
                    View All
                  </button>
                </div>
                <div className="doctor-dashboard-appointments-list">
                  {upcomingAppointments.length === 0 ? (
                    <div className="doctor-dashboard-no-appointments">
                      <div className="no-appointments-icon">🎉</div>
                      <h3>No more appointments today</h3>
                      <p>You're all caught up! Enjoy your free time.</p>
                    </div>
                  ) : (
                    upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className="doctor-dashboard-appointment-card">
                        <div className="doctor-dashboard-appointment-time">
                          🕐 {formatTime(appointment.appointmentTime)}
                        </div>
                        <div className="doctor-dashboard-appointment-details">
                          <h4>{appointment.name}</h4>
                          <p>{appointment.doctorSpecialty || "General Consultation"}</p>
                          <div className="doctor-dashboard-patient-contact">
                            <span>📱 {appointment.phone}</span>
                            {appointment.symptoms && (
                              <span className="doctor-dashboard-symptoms">💭 {appointment.symptoms.substring(0, 50)}...</span>
                            )}
                          </div>
                        </div>
                        <div className="doctor-dashboard-appointment-actions">
                          <button 
                            className="doctor-dashboard-appointment-action"
                            onClick={() => handleStartConsultation(appointment)}
                          >
                            Start
                          </button>
                          <div className={`doctor-dashboard-urgency-indicator ${appointment.urgency || 'normal'}`}>
                            {appointment.urgency || 'Normal'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Doctor Schedule Section - UNCHANGED */}
              <div className="doctor-dashboard-schedule-section">
                <div className="doctor-dashboard-section-header">
                  <h2>Weekly Schedule</h2>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => navigate("/admin/doctor/schedule")}
                  >
                    Manage
                  </button>
                </div>
                <div className="doctor-dashboard-schedule-list">
                  {dashboardData.doctorSchedule?.map((schedule) => (
                    <div key={schedule.id} className={`doctor-dashboard-schedule-card ${!schedule.available ? 'doctor-dashboard-unavailable' : ''}`}>
                      <div className="doctor-dashboard-schedule-day">{schedule.day}</div>
                      <div className="doctor-dashboard-schedule-time">{schedule.time}</div>
                      <div className={`doctor-dashboard-schedule-status ${schedule.available ? 'doctor-dashboard-available' : 'doctor-dashboard-unavailable-status'}`}>
                        {schedule.available ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features Section - UNCHANGED */}
            <div className="doctor-dashboard-features-section">
              <h2 className="doctor-dashboard-section-title">Medical Features</h2>
              <div className="doctor-dashboard-features-grid">
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => navigate("/admin/doctor/schedule-consultation")}
                >
                  <div className="doctor-dashboard-feature-icon">📅</div>
                  <h3>Schedule Consultation</h3>
                  <p>Set your availability</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => navigate("/admin/doctor/patient-records")}
                >
                  <div className="doctor-dashboard-feature-icon">📁</div>
                  <h3>Patient Records</h3>
                  <p>Access medical history</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => alert("Lab Reports clicked")}
                >
                  <div className="doctor-dashboard-feature-icon">🔬</div>
                  <h3>Lab Reports</h3>
                  <p>View test results</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => navigate("/admin/doctor/prescriptions")}
                >
                  <div className="doctor-dashboard-feature-icon">💊</div>
                  <h3>Prescriptions</h3>
                  <p>Manage medications</p>
                </button>
                <button
                  className={`doctor-dashboard-feature-card doctor-dashboard-emergency-alert-feature ${
                    dashboardData.stats?.emergencyAlerts > 0 ? 'doctor-dashboard-has-alerts' : ''
                  }`}
                  onClick={handleEmergencyAlertsClick}
                >
                  <div className="doctor-dashboard-feature-icon">🚨</div>
                  <h3>Emergency Alerts</h3>
                  <p>Critical patient situations</p>
                  {dashboardData.stats?.emergencyAlerts > 0 && (
                    <div className="doctor-dashboard-alert-count">{dashboardData.stats.emergencyAlerts} urgent</div>
                  )}
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => navigate("/admin/doctor/inventory")}
                >
                  <div className="doctor-dashboard-feature-icon">📦</div>
                  <h3>Item Requests</h3>
                  <p>Medical supplies</p>
                </button>
              </div>
            </div>

            {/* Recent Activities Section - UNCHANGED */}
            <div className="doctor-dashboard-activity-section">
              <div className="doctor-dashboard-section-header">
                <h2>Recent Activities</h2>
              </div>
              <div className="doctor-dashboard-activity-list">
                {dashboardData.recentActivities?.map((activity) => (
                  <div key={activity.id} className="doctor-dashboard-activity-item">
                    <div className="doctor-dashboard-activity-icon">
                      <div className="doctor-dashboard-activity-dot"></div>
                    </div>
                    <div className="doctor-dashboard-activity-content">
                      <p>{activity.text}</p>
                      <span className="doctor-dashboard-activity-time">{activity.time}</span>
                    </div>
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