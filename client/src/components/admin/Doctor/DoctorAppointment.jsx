// components/DoctorAppointments.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DocApp.css"

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [todayPatientsCount, setTodayPatientsCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("upcoming");

  const backendUrl = "http://localhost:7000";

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Function to get appointment status
  const getAppointmentStatus = (appointment) => {
    if (!isToday(appointment.appointmentDate)) return "scheduled";
    if (isTimePassed(appointment.appointmentTime)) return "completed";
    return "upcoming";
  };

  // Function to fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${backendUrl}/api/appointments/accepted`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const allAppointments = res.data.appointments || [];
      setAppointments(allAppointments);
      
      // Filter today's appointments
      const todayAppts = allAppointments.filter(appt => 
        isToday(appt.appointmentDate)
      );
      
      // Sort by time (earliest first)
      todayAppts.sort((a, b) => {
        const timeA = a.appointmentTime || "23:59";
        const timeB = b.appointmentTime || "23:59";
        return timeA.localeCompare(timeB);
      });
      
      setTodayAppointments(todayAppts);
      
      // Set today's patients count (unique patients)
      const uniquePatients = new Set(todayAppts.map(appt => appt.email || appt.phone || appt.name));
      setTodayPatientsCount(uniquePatients.size);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Group appointments by status
  const upcomingAppointments = todayAppointments.filter(appt => 
    getAppointmentStatus(appt) === "upcoming"
  );
  
  const completedAppointments = todayAppointments.filter(appt => 
    getAppointmentStatus(appt) === "completed"
  );

  // Get current time period for greeting
  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="medical-portal">
      {/* Header with real-time clock */}
      <header className="portal-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>{getTimeGreeting()}, Doctor</h1>
            <p>{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="time-display">
            <div className="digital-clock">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="date-display">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Dashboard */}
      <section className="stats-dashboard">
        <div className="stat-card primary">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{todayPatientsCount}</div>
            <div className="stat-label">Today's Patients</div>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{upcomingAppointments.length}</div>
            <div className="stat-label">Upcoming</div>
          </div>
        </div>
        
        <div className="stat-card tertiary">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{completedAppointments.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        <div className="stat-card quaternary">
          <div className="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{todayAppointments.length}</div>
            <div className="stat-label">Total Today</div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading appointments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-notification">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={fetchAppointments}>Retry</button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Today's Timeline */}
          <section className="timeline-section">
            <div className="section-header">
              <h2>Today's Schedule</h2>
              <div className="timeline-controls">
                <button 
                  className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming ({upcomingAppointments.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
                  onClick={() => setActiveTab("completed")}
                >
                  Completed ({completedAppointments.length})
                </button>
              </div>
            </div>
            
            {todayAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <h3>No appointments today</h3>
                <p>Enjoy your free time!</p>
              </div>
            ) : (
              <div className="timeline-container">
                {activeTab === "upcoming" && upcomingAppointments.length > 0 && (
                  <div className="timeline">
                    {upcomingAppointments.map((appointment, index) => (
                      <div key={appointment._id} className="timeline-item upcoming">
                        <div className="timeline-marker">
                          <div className="marker-dot"></div>
                          {index < upcomingAppointments.length - 1 && <div className="marker-line"></div>}
                        </div>
                        <div className="timeline-content">
                          <div className="appointment-time">{formatTime(appointment.appointmentTime)}</div>
                          <div className="appointment-card">
                            <div className="card-header">
                              <h4>{appointment.name}</h4>
                              <span className={`urgency-badge ${appointment.urgency || 'normal'}`}>
                                {appointment.urgency ? appointment.urgency.charAt(0).toUpperCase() + appointment.urgency.slice(1) : 'Normal'}
                              </span>
                            </div>
                            <div className="card-body">
                              <p className="appointment-type">{appointment.doctorSpecialty || "General Consultation"}</p>
                              <div className="patient-details">
                                <div className="detail-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                  </svg>
                                  {appointment.phone}
                                </div>
                                <div className="detail-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                  </svg>
                                  {appointment.email}
                                </div>
                              </div>
                              {appointment.symptoms && (
                                <div className="symptoms-info">
                                  <span className="symptoms-label">Symptoms:</span>
                                  <span className="symptoms-text">{appointment.symptoms}</span>
                                </div>
                              )}
                            </div>
                            <div className="card-footer">
                              <button className="action-btn primary">
                                Start Consultation
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === "completed" && completedAppointments.length > 0 && (
                  <div className="timeline">
                    {completedAppointments.map((appointment, index) => (
                      <div key={appointment._id} className="timeline-item completed">
                        <div className="timeline-marker">
                          <div className="marker-dot checked">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          {index < completedAppointments.length - 1 && <div className="marker-line"></div>}
                        </div>
                        <div className="timeline-content">
                          <div className="appointment-time">{formatTime(appointment.appointmentTime)}</div>
                          <div className="appointment-card">
                            <div className="card-header">
                              <h4>{appointment.name}</h4>
                              <span className="status-badge completed">Completed</span>
                            </div>
                            <div className="card-body">
                              <p className="appointment-type">{appointment.doctorSpecialty || "General Consultation"}</p>
                              <div className="patient-details">
                                <div className="detail-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                  </svg>
                                  {appointment.phone}
                                </div>
                                <div className="detail-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                  </svg>
                                  {appointment.email}
                                </div>
                              </div>
                            </div>
                            <div className="card-footer">
                              <button className="action-btn secondary">
                                View Notes
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* All Appointments Table */}
          <section className="all-appointments-section">
            <div className="section-header">
              <h2>All Appointments</h2>
              <div className="table-controls">
                <div className="search-box">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input type="text" placeholder="Search appointments..." />
                </div>
                <button className="filter-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  Filter
                </button>
              </div>
            </div>
            
            {appointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <h3>No appointments found</h3>
                <p>There are no appointments to display.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Specialty</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => {
                      const status = getAppointmentStatus(appt);
                      const statusText = status === "upcoming" ? "Upcoming" : 
                                       status === "completed" ? "Completed" : "Scheduled";
                      
                      return (
                        <tr key={appt._id} className={`table-row ${status}`}>
                          <td>
                            <div className="patient-info">
                              <div className="patient-avatar">
                                {appt.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="patient-details">
                                <div className="patient-name">{appt.name}</div>
                                <div className="patient-contact">{appt.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {appt.appointmentDate
                              ? new Date(appt.appointmentDate).toLocaleDateString()
                              : "Date not set"}
                          </td>
                          <td>{formatTime(appt.appointmentTime)}</td>
                          <td>{appt.doctorSpecialty || "N/A"}</td>
                          <td>
                            <span className={`urgency-tag ${appt.urgency || 'normal'}`}>
                              {appt.urgency ? appt.urgency.charAt(0).toUpperCase() + appt.urgency.slice(1) : 'Normal'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-tag ${status}`}>
                              {statusText}
                            </span>
                          </td>
                          <td>
                            <div className="action-menu">
                              <button className="action-menu-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1"></circle>
                                  <circle cx="12" cy="5" r="1"></circle>
                                  <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default DoctorAppointments;