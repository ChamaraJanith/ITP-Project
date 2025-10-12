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
  const [doctorActivities, setDoctorActivities] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  
  const backendUrl = "http://localhost:7000";
  const isMounted = useRef(true);
  const activityCounterRef = useRef(0);

  // Update current time every second for real-time feel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  // Function to format activity time
  const formatActivityTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMins = Math.floor(diffSeconds / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return activityTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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

  // Function to log doctor activities with real-time feel
  const logDoctorActivity = (action, details = "", category = "general", priority = "normal") => {
    if (!isMounted.current) return;
    
    activityCounterRef.current += 1;
    
    const activity = {
      id: `${Date.now()}-${activityCounterRef.current}`,
      action,
      details,
      category,
      priority,
      timestamp: new Date().toISOString(),
      doctorId: 'DOC001',
      doctorName: 'Dr. Gayath Dahanayake',
      isNew: true
    };
    
    // Update state with new activity at the top
    setDoctorActivities(prev => {
      const updated = [activity, ...prev.slice(0, 14)]; // Keep only latest 15
      // Mark activities as not new after a short delay
      setTimeout(() => {
        setDoctorActivities(current => 
          current.map(a => a.id === activity.id ? {...a, isNew: false} : a)
        );
      }, 3000);
      return updated;
    });
    
    // Log to console for debugging
    console.log(`[${category.toUpperCase()}] ${action}${details ? ': ' + details : ''}`);
  };

  // Fetch today's prescriptions count
  const fetchTodayPrescriptionsCount = async () => {
    logDoctorActivity("Checking prescriptions", "Loading today's prescriptions", "prescription", "high");
    
    try {
      const res = await getAllPrescriptions();
      const allPrescriptions = res.data?.data || [];
      const todaysPrescriptions = filterTodaysPrescriptions(allPrescriptions);
      
      if (isMounted.current) {
        setTodayPrescriptionsCount(todaysPrescriptions.length);
        logDoctorActivity(
          "Prescriptions loaded", 
          `Found ${todaysPrescriptions.length} prescriptions for today`, 
          "prescription",
          "low"
        );
      }
    } catch (err) {
      console.error("Failed to fetch today's prescriptions count:", err);
      if (isMounted.current) {
        setTodayPrescriptionsCount(0);
        logDoctorActivity(
          "Prescription load failed", 
          err.message || "Failed to load prescriptions", 
          "error",
          "high"
        );
      }
    }
  };

  // Fetch today's upcoming appointments
  const fetchUpcomingAppointments = async () => {
    logDoctorActivity("Checking appointments", "Loading upcoming appointments", "appointment", "high");
    
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
        logDoctorActivity(
          "Appointments loaded", 
          `Found ${todayUpcoming.length} upcoming appointments for ${uniquePatients.size} patients`, 
          "appointment",
          "low"
        );
      }
    } catch (err) {
      console.error("Failed to fetch upcoming appointments:", err);
      if (isMounted.current) {
        setUpcomingAppointments([]);
        setTodayPatientsCount(0);
        logDoctorActivity(
          "Appointment load failed", 
          err.message || "Failed to load appointments", 
          "error",
          "high"
        );
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
    logDoctorActivity("Checking alerts", "Looking for emergency alerts", "emergency", "high");
    
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
          const alertCount = data.data.overview?.activeAlerts || 0;
          setDashboardData(prev => ({
            ...prev,
            stats: {
              ...prev?.stats,
              emergencyAlerts: alertCount
            }
          }));
          logDoctorActivity(
            "Alerts checked", 
            `Found ${alertCount} active emergency alerts`, 
            "emergency",
            alertCount > 0 ? "high" : "low"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching emergency alert count:", error);
      logDoctorActivity(
        "Alert check failed", 
        error.message || "Failed to check emergency alerts", 
        "error",
        "medium"
      );
    }
  };

  const initializeDashboard = async () => {
    logDoctorActivity("Dashboard access", "Initializing doctor dashboard", "system", "high");
    
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
          logDoctorActivity(
            "Dashboard loaded", 
            "Successfully loaded dashboard data", 
            "system",
            "low"
          );
        }
      } else {
        if (isMounted.current) {
          setDashboardData(mockDashboardData);
          setApiUnavailable(true);
          logDoctorActivity(
            "Using mock data", 
            "API unavailable, using demo data", 
            "warning",
            "medium"
          );
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
        logDoctorActivity(
          "Dashboard error", 
          error.message || "Failed to initialize dashboard", 
          "error",
          "high"
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        logDoctorActivity(
          "Dashboard ready", 
          "Doctor dashboard initialization complete", 
          "system",
          "low"
        );
      }
    }
  };

  const handleEmergencyAlertsClick = () => {
    if (isMounted.current) {
      setCurrentView('emergency-alerts');
      logDoctorActivity(
        "Viewing emergency alerts", 
        "Navigated to emergency alerts page", 
        "emergency",
        "high"
      );
    }
  };

  const handleStartConsultation = (appointment) => {
    logDoctorActivity(
      "Starting consultation", 
      `Beginning consultation with ${appointment.name}`, 
      "consultation",
      "high"
    );
    
    navigate(`/admin/doctor/consultation/${appointment._id}`, {
      state: { patient: appointment }
    });
  };

  const handleRetryApiConnection = () => {
    if (isMounted.current) {
      setLoading(true);
      setError("");
      logDoctorActivity(
        "Retrying connection", 
        "User requested API retry", 
        "system",
        "medium"
      );
      initializeDashboard();
    }
  };

  // Function to get activity icon based on category
  const getActivityIcon = (category) => {
    switch (category) {
      case 'prescription':
        return '💊';
      case 'appointment':
        return '📅';
      case 'patient':
        return '👤';
      case 'consultation':
        return '🩺';
      case 'emergency':
        return '🚨';
      case 'system':
        return '⚙️';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return '📝';
    }
  };

  // Function to get activity color based on category and priority
  const getActivityColor = (category, priority) => {
    if (priority === 'high') {
      switch (category) {
        case 'emergency': return '#F44336';
        case 'error': return '#F44336';
        case 'prescription': return '#FF5722';
        case 'appointment': return '#FF9800';
        default: return '#FF5722';
      }
    }
    
    switch (category) {
      case 'prescription': return '#4CAF50';
      case 'appointment': return '#2196F3';
      case 'patient': return '#9C27B0';
      case 'consultation': return '#00BCD4';
      case 'emergency': return '#F44336';
      case 'system': return '#607D8B';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'success': return '#4CAF50';
      default: return '#78909C';
    }
  };

  // Initialize activities on component mount
  useEffect(() => {
    isMounted.current = true;
    
    // Add initial activities
    const initialActivities = [
      { 
        id: Date.now() - 1000, 
        action: "System initialized", 
        details: "Doctor dashboard starting up",
        category: "system",
        priority: "low",
        timestamp: new Date(Date.now() - 1000).toISOString(),
        doctorId: 'DOC001',
        doctorName: 'Dr. Gayath Dahanayake',
        isNew: false
      },
      { 
        id: Date.now() - 2000, 
        action: "Connecting to server", 
        details: "Establishing connection to backend services",
        category: "system",
        priority: "medium",
        timestamp: new Date(Date.now() - 2000).toISOString(),
        doctorId: 'DOC001',
        doctorName: 'Dr. Gayath Dahanayake',
        isNew: false
      }
    ];
    
    setDoctorActivities(initialActivities);
    
    // Initialize dashboard
    initializeDashboard();
    
    // Refresh appointments every 5 minutes
    const appointmentInterval = setInterval(() => {
      fetchUpcomingAppointments();
      logDoctorActivity(
        "Auto-refresh", 
        "Automatically refreshed appointments", 
        "system",
        "low"
      );
    }, 300000);
    
    // Log periodic activity every 30 seconds
    const activityInterval = setInterval(() => {
      logDoctorActivity(
        "Dashboard active", 
        "Doctor dashboard is actively monitoring", 
        "system",
        "low"
      );
    }, 30000);
    
    // Simulate some random activities for realism
    const randomActivityInterval = setInterval(() => {
      const randomActivities = [
        { action: "Patient record accessed", details: "Viewing patient history", category: "patient" },
        { action: "Lab results reviewed", details: "Checking recent test results", category: "system" },
        { action: "Medication inventory checked", details: "Verifying stock levels", category: "system" },
        { action: "Schedule updated", details: "Modified availability", category: "appointment" },
        { action: "Reports generated", details: "Creating daily summary", category: "system" }
      ];
      
      const randomActivity = randomActivities[Math.floor(Math.random() * randomActivities.length)];
      logDoctorActivity(
        randomActivity.action,
        randomActivity.details,
        randomActivity.category,
        "low"
      );
    }, 45000); // Every 45 seconds
    
    return () => {
      isMounted.current = false;
      clearInterval(appointmentInterval);
      clearInterval(activityInterval);
      clearInterval(randomActivityInterval);
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
            onClick={() => {
              setCurrentView('dashboard');
              logDoctorActivity(
                "Returning to dashboard", 
                "Navigated back from emergency alerts", 
                "system",
                "medium"
              );
            }}
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
                onClick={() => {
                  handleRetryApiConnection();
                  logDoctorActivity(
                    "Connection retry", 
                    "User clicked retry connection button", 
                    "system",
                    "medium"
                  );
                }}
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
              onClick={() => {
                handleRetryApiConnection();
                logDoctorActivity(
                  "Error retry", 
                  "User clicked retry button after error", 
                  "system",
                  "medium"
                );
              }}
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
                <div 
                  className="doctor-dashboard-stat-card doctor-dashboard-patients-card"
                  onClick={() => logDoctorActivity(
                    "Viewed patients", 
                    "Checked today's patient count", 
                    "patient",
                    "low"
                  )}
                >
                  <div className="doctor-dashboard-stat-icon">👥</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{todayPatientsCount}</h3>
                    <p>Today's Patients</p>
                  </div>
                </div>
                <div 
                  className="doctor-dashboard-stat-card doctor-dashboard-reports-card"
                  onClick={() => logDoctorActivity(
                    "Viewed reports", 
                    "Checked pending reports", 
                    "report",
                    "low"
                  )}
                >
                  <div className="doctor-dashboard-stat-icon">📋</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{dashboardData.stats?.pendingReports || 0}</h3>
                    <p>Pending Reports</p>
                  </div>
                </div>
                <div 
                  className="doctor-dashboard-stat-card doctor-dashboard-consultations-card"
                  onClick={() => logDoctorActivity(
                    "Viewed consultations", 
                    "Checked consultation count", 
                    "consultation",
                    "low"
                  )}
                >
                  <div className="doctor-dashboard-stat-icon">💬</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{todayPrescriptionsCount}</h3>
                    <p>Consultations</p>
                  </div>
                </div>
                <div 
                  className={`doctor-dashboard-stat-card doctor-dashboard-alerts-card ${
                    dashboardData.stats?.emergencyAlerts > 0 ? 'doctor-dashboard-has-alerts' : ''
                  }`} 
                  onClick={() => {
                    handleEmergencyAlertsClick();
                  }}
                >
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
              {/* Upcoming Appointments Section */}
              <div className="doctor-dashboard-appointments-section">
                <div className="doctor-dashboard-section-header">
                  <h2>Today's Appointments</h2>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => {
                      navigate("/admin/doctor/appointments");
                      logDoctorActivity(
                        "Viewed all appointments", 
                        "Navigated to appointments page", 
                        "appointment",
                        "medium"
                      );
                    }}
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

              {/* Doctor Schedule Section */}
              <div className="doctor-dashboard-schedule-section">
                <div className="doctor-dashboard-section-header">
                  <h2>Weekly Schedule</h2>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => {
                      navigate("/admin/doctor/schedule");
                      logDoctorActivity(
                        "Viewed schedule", 
                        "Navigated to schedule management", 
                        "system",
                        "medium"
                      );
                    }}
                  >
                    Manage
                  </button>
                </div>
                <div className="doctor-dashboard-schedule-list">
                  {dashboardData.doctorSchedule?.map((schedule) => (
                    <div 
                      key={schedule.id} 
                      className={`doctor-dashboard-schedule-card ${!schedule.available ? 'doctor-dashboard-unavailable' : ''}`}
                      onClick={() => logDoctorActivity(
                        "Viewed schedule", 
                        `Checked ${schedule.day} schedule`, 
                        "system",
                        "low"
                      )}
                    >
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

            {/* Features Section */}
            <div className="doctor-dashboard-features-section">
              <h2 className="doctor-dashboard-section-title">Medical Features</h2>
              <div className="doctor-dashboard-features-grid">
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/schedule-consultation");
                    logDoctorActivity(
                      "Schedule consultation", 
                      "Navigated to consultation scheduling", 
                      "consultation",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">📅</div>
                  <h3>Schedule Consultation</h3>
                  <p>Set your availability</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/patient-records");
                    logDoctorActivity(
                      "Patient records", 
                      "Accessed patient records", 
                      "patient",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">📁</div>
                  <h3>Patient Records</h3>
                  <p>Access medical history</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    alert("Lab Reports clicked");
                    logDoctorActivity(
                      "Lab reports", 
                      "Viewed lab reports", 
                      "report",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">🔬</div>
                  <h3>Lab Reports</h3>
                  <p>View test results</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/prescriptions");
                    logDoctorActivity(
                      "Prescriptions", 
                      "Accessed prescription management", 
                      "prescription",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">💊</div>
                  <h3>Prescriptions</h3>
                  <p>Manage medications</p>
                </button>
                <button
                  className={`doctor-dashboard-feature-card doctor-dashboard-emergency-alert-feature ${
                    dashboardData.stats?.emergencyAlerts > 0 ? 'doctor-dashboard-has-alerts' : ''
                  }`}
                  onClick={() => {
                    handleEmergencyAlertsClick();
                  }}
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
                  onClick={() => {
                    navigate("/admin/doctor/inventory");
                    logDoctorActivity(
                      "Inventory", 
                      "Accessed medical inventory", 
                      "system",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">📦</div>
                  <h3>Item Requests</h3>
                  <p>Medical supplies</p>
                </button>
              </div>
            </div>

            {/* Doctor Activities Section - REAL-WORLD IMPLEMENTATION */}
            <div className="doctor-dashboard-activity-section">
              <div className="doctor-dashboard-section-header">
                <h2>Live Activity Feed</h2>
                <div className="activity-controls">
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    <span className="live-text">LIVE</span>
                  </div>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => {
                      setDoctorActivities([]);
                      logDoctorActivity(
                        "Cleared activities", 
                        "Activity feed cleared by user", 
                        "system",
                        "medium"
                      );
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="doctor-dashboard-activity-list">
                {doctorActivities.length === 0 ? (
                  <div className="doctor-dashboard-no-activities">
                    <div className="no-activities-icon">📋</div>
                    <h3>No activities yet</h3>
                    <p>Your activities will appear here as you use the system.</p>
                  </div>
                ) : (
                  doctorActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`doctor-dashboard-activity-item ${activity.isNew ? 'new-activity' : ''}`}
                    >
                      <div className="doctor-dashboard-activity-icon">
                        <div 
                          className="doctor-dashboard-activity-dot" 
                          style={{ backgroundColor: getActivityColor(activity.category, activity.priority) }}
                        >
                          {getActivityIcon(activity.category)}
                        </div>
                      </div>
                      <div className="doctor-dashboard-activity-content">
                        <p className="activity-action">{activity.action}</p>
                        {activity.details && (
                          <p className="activity-details">{activity.details}</p>
                        )}
                        <span className="doctor-dashboard-activity-time">
                          {formatActivityTime(activity.timestamp)}
                        </span>
                      </div>
                      <div className="activity-category">
                        <span 
                          className="category-badge" 
                          style={{ backgroundColor: getActivityColor(activity.category, activity.priority) }}
                        >
                          {activity.category}
                        </span>
                      </div>
                      {activity.isNew && (
                        <div className="new-activity-badge">NEW</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DoctorDashboard;