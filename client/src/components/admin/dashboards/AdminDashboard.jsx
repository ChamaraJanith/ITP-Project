import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import AdminErrorBoundary from '../AdminErrorBoundary';
import ProfileDetailModal from '../../admin/ProfileDetailModal.jsx';
import { adminDashboardApi } from '../../../services/adminApi.js';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalPatients: 0,
    systemHealth: 'loading'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [growthAnalytics, setGrowthAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [realTimeProfiles, setRealTimeProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [dashboardRoleAccess, setDashboardRoleAccess] = useState({});
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // Profile modal state
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, [navigate]);

  // Auto-refresh real-time profiles every 30 seconds when visible
  useEffect(() => {
    let interval;
    if (showProfiles) {
      interval = setInterval(() => {
        loadRealTimeProfiles();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [showProfiles]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      // Check admin authentication with better error handling
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        try {
          const parsedAdmin = JSON.parse(adminData);
          
          // Validate admin data structure
          if (parsedAdmin && parsedAdmin.role && parsedAdmin.email) {
            if (parsedAdmin.role !== 'admin') {
              console.log('⚠️ Non-admin user trying to access admin dashboard');
              navigate('/admin/login');
              return;
            }
            setAdmin(parsedAdmin);
          } else {
            throw new Error('Invalid admin data structure');
          }
        } catch (parseError) {
          console.error('❌ Error parsing admin data:', parseError);
          localStorage.removeItem('admin');
          navigate('/admin/login');
          return;
        }
      } else {
        // Try to verify admin session from server
        try {
          const sessionCheck = await adminDashboardApi.verifyAdminSession();
          if (sessionCheck.success && sessionCheck.data && sessionCheck.data.role === 'admin') {
            setAdmin(sessionCheck.data);
            localStorage.setItem('admin', JSON.stringify(sessionCheck.data));
          } else {
            console.log('❌ Session verification failed');
            navigate('/admin/login');
            return;
          }
        } catch (sessionError) {
          console.error('❌ Session verification error:', sessionError);
          navigate('/admin/login');
          return;
        }
      }

      // Load dashboard data only after admin is confirmed
      await loadDashboardData();

    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      setError('Failed to initialize dashboard');
      
      // Clear invalid data and redirect
      localStorage.removeItem('admin');
      setTimeout(() => navigate('/admin/login'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard statistics
      const statsResponse = await adminDashboardApi.getDashboardStats();
      
      if (statsResponse.success) {
        const data = statsResponse.data;
        setSystemStats({
          totalUsers: data.totalUsers,
          totalStaff: data.totalStaff,
          totalPatients: data.totalPatients,
          verifiedUsers: data.verifiedUsers,
          unverifiedUsers: data.unverifiedUsers,
          recentRegistrations: data.recentRegistrations,
          monthlyGrowth: data.monthlyGrowth,
          staffBreakdown: data.staffBreakdown,
          systemHealth: data.systemHealth.status,
          lastUpdated: data.lastUpdated
        });

        // Set recent patients for the buttons
        setRecentPatients(data.recentPatients || []);

        console.log('✅ Dashboard stats loaded:', data);
      } else {
        throw new Error(statsResponse.message || 'Failed to fetch dashboard stats');
      }

      // Fetch growth analytics
      const analyticsResponse = await adminDashboardApi.getUserGrowthAnalytics(7);
      if (analyticsResponse.success) {
        setGrowthAnalytics(analyticsResponse.data);
      }

      // Fetch activity logs
      const logsResponse = await adminDashboardApi.getSystemActivityLogs(10);
      if (logsResponse.success) {
        setActivityLogs(logsResponse.data.activityLogs);
      }

      // Fetch dashboard role access
      const roleAccessResponse = await adminDashboardApi.getDashboardRoleAccess();
      if (roleAccessResponse.success) {
        setDashboardRoleAccess(roleAccessResponse.data);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeProfiles = async () => {
    try {
      setProfilesLoading(true);
      const response = await adminDashboardApi.getRealTimeProfiles('all', 1, 20);
      
      if (response.success) {
        setRealTimeProfiles(response.data.profiles);
        console.log('✅ Real-time profiles updated:', response.data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading real-time profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  const toggleRealTimeProfiles = async () => {
    if (!showProfiles) {
      await loadRealTimeProfiles();
    }
    setShowProfiles(!showProfiles);
  };

  const refreshData = async () => {
    await loadDashboardData();
    if (showProfiles) {
      await loadRealTimeProfiles();
    }
  };

  // Handle profile click
  const handleProfileClick = (profile) => {
    console.log('👤 Opening profile:', profile);
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  // Close profile modal
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    // Refresh profiles after modal closes
    if (showProfiles) {
      loadRealTimeProfiles();
    }
  };

  const handleDashboardAccess = async (dashboardType) => {
    try {
      let response;
      switch (dashboardType) {
        case 'receptionist':
          response = await adminDashboardApi.accessReceptionistDashboard();
          if (response.success) {
            console.log('✅ Accessing Receptionist Dashboard:', response.data);
            navigate('/admin/receptionist-dashboard');
          }
          break;
        case 'doctor':
          response = await adminDashboardApi.accessDoctorDashboard();
          if (response.success) {
            console.log('✅ Accessing Doctor Dashboard:', response.data);
            navigate('/admin/doctor-dashboard');
          }
          break;
        case 'financial':
          response = await adminDashboardApi.accessFinancialDashboard();
          if (response.success) {
            console.log('✅ Accessing Financial Dashboard:', response.data);
            navigate('/admin/financial-dashboard');
          }
          break;
        default:
          console.error('Unknown dashboard type:', dashboardType);
      }
    } catch (error) {
      console.error(`❌ Error accessing ${dashboardType} dashboard:`, error);
      setError(`Failed to access ${dashboardType} dashboard`);
    }
  };

  // Print functionality
  const handlePrint = () => {
    // Hide floating buttons before printing
    const fabButtons = document.querySelector('.floating-action-buttons');
    if (fabButtons) {
      fabButtons.style.display = 'none';
    }
    
    // Print the page
    window.print();
    
    // Show floating buttons after printing
    setTimeout(() => {
      if (fabButtons) {
        fabButtons.style.display = 'flex';
      }
    }, 1000);
  };

  // Contact support functionality
  const handleContactSupport = () => {
    // Option 1: Open email client with pre-filled details
    const subject = encodeURIComponent('Admin Dashboard Support Request');
    const body = encodeURIComponent(`Hello Support Team,

I need assistance with the Admin Dashboard.

Admin Details:
- Name: ${admin?.name || 'N/A'}
- Email: ${admin?.email || 'N/A'}
- Role: ${admin?.role || 'N/A'}
- Dashboard: System Administrator
- Timestamp: ${new Date().toLocaleString()}

Issue Description:
[Please describe your issue here]

Best regards,
${admin?.name || 'Admin User'}`);
    
    window.open(`mailto:support@yourhospital.com?subject=${subject}&body=${body}`);
    
    // Alternative: Show support modal
    // setShowSupportModal(true);
  };

  // Better loading state handling
  if (loading) {
    return (
      <AdminErrorBoundary>
        <div className="admin-loading-container">
          <div className="admin-loading-content">
            <div className="loading-spinner"></div>
            <h2>Loading Admin Dashboard...</h2>
            <p>Verifying your admin session</p>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  // Better error state handling
  if (error && !admin) {
    return (
      <AdminErrorBoundary>
        <div className="admin-error-container">
          <div className="admin-error-content">
            <h2>⚠️ Dashboard Error</h2>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry
              </button>
              <button 
                onClick={() => navigate('/admin/login')}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔑 Re-login
              </button>
            </div>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  // Final safety check
  if (!admin || !admin.role) {
    return (
      <AdminErrorBoundary>
        <div className="admin-auth-error">
          <div className="admin-error-content">
            <h2>Authentication Required</h2>
            <p>Redirecting to login...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminLayout admin={admin} title="System Administrator Dashboard">
        <div className="admin-dashboard">
          {/* Header with actions */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>📊 System Administrator Dashboard</h1>
              <div className="header-actions">
                <button onClick={() => window.open('/', '_blank')} className="homepage-btn">
                  🏠 Homepage
                </button>
                <button onClick={toggleRealTimeProfiles} className="profiles-btn">
                  {showProfiles ? '📋 Hide Profiles' : '📋 Real-Time Profiles'}
                </button>
                <button onClick={refreshData} className="refresh-btn">
                  🔄 Refresh
                </button>
                {systemStats.lastUpdated && (
                  <span className="last-updated">
                    Last updated: {new Date(systemStats.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Real-time Profiles Section - Clickable */}
          {showProfiles && (
            <div className="realtime-profiles-section">
              <div className="profiles-header">
                <h2>👥 Real-Time Profile List (Click to View Details)</h2>
                {profilesLoading && <div className="mini-spinner">⏳</div>}
              </div>
              <div className="profiles-grid">
                {realTimeProfiles.map((profile, index) => (
                  <div 
                    key={profile._id || index} 
                    className={`profile-card ${profile.type} clickable-profile`}
                    onClick={() => handleProfileClick(profile)}
                    title="Click to view profile details"
                  >
                    <div className="profile-avatar">
                      {profile.type === 'patient' ? '👤' : 
                       profile.role === 'doctor' ? '👩‍⚕️' :
                       profile.role === 'receptionist' ? '👩‍💼' :
                       profile.role === 'financial_manager' ? '💰' : '👨‍💼'}
                    </div>
                    <div className="profile-info">
                      <h4>{profile.name}</h4>
                      <p>{profile.email}</p>
                      <div className="profile-meta">
                        <span className={`role-badge ${profile.role || profile.type}`}>
                          {profile.role || profile.type}
                        </span>
                        <span className={`status-badge ${profile.status}`}>
                          {profile.status}
                        </span>
                      </div>
                      <small>
                        Last activity: {new Date(profile.lastActivity).toLocaleString()}
                      </small>
                    </div>
                    <div className="profile-click-indicator">
                      👆 Click to view
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="stats-grid">
            <div className="stat-card users">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{systemStats.totalUsers.toLocaleString()}</h3>
                <p>Total Users</p>
                <small>
                  ✅ {systemStats.verifiedUsers} verified | 
                  ⏳ {systemStats.unverifiedUsers} pending
                </small>
              </div>
            </div>
            
            <div className="stat-card staff">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-info">
                <h3>{systemStats.totalStaff.toLocaleString()}</h3>
                <p>Staff Members</p>
                <small>
                  Admin: {systemStats.staffBreakdown?.admin || 0} | 
                  Doctors: {systemStats.staffBreakdown?.doctor || 0}
                </small>
              </div>
            </div>
            
            <div className="stat-card patients">
              <div className="stat-icon">🏥</div>
              <div className="stat-info">
                <h3>{systemStats.totalPatients.toLocaleString()}</h3>
                <p>Active Patients</p>
                <small>Verified user accounts</small>
              </div>
            </div>
            
            <div className="stat-card health">
              <div className="stat-icon">
                {systemStats.systemHealth === 'healthy' ? '✅' : 
                 systemStats.systemHealth === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="stat-info">
                <h3 className={`status-${systemStats.systemHealth}`}>
                  {systemStats.systemHealth.charAt(0).toUpperCase() + systemStats.systemHealth.slice(1)}
                </h3>
                <p>System Status</p>
              </div>
            </div>
          </div>

          {/* Dashboard Access Section - 3 Role-based Buttons */}
          <div className="dashboard-access-section">
            <h2>🎛️ Role-Based Dashboard Access</h2>
            <div className="role-dashboard-grid">
              <button 
                className="role-dashboard-btn receptionist-btn"
                onClick={() => handleDashboardAccess('receptionist')}
              >
                <div className="dashboard-icon">👩‍💼</div>
                <div className="dashboard-info">
                  <h4>Receptionist Dashboard</h4>
                  <p>Appointment scheduling & patient management</p>
                  <div className="dashboard-stats">
                    <small>
                      Staff: {dashboardRoleAccess.roleAccess?.receptionist?.count || 0} | 
                      Features: Appointments, Check-ins
                    </small>
                  </div>
                </div>
                <div className="access-indicator">
                  {dashboardRoleAccess.roleAccess?.receptionist?.accessible ? '✅' : '🔒'}
                </div>
              </button>

              <button 
                className="role-dashboard-btn doctor-btn"
                onClick={() => handleDashboardAccess('doctor')}
              >
                <div className="dashboard-icon">👩‍⚕️</div>
                <div className="dashboard-info">
                  <h4>Doctor Dashboard</h4>
                  <p>Medical records & patient consultations</p>
                  <div className="dashboard-stats">
                    <small>
                      Staff: {dashboardRoleAccess.roleAccess?.doctor?.count || 0} | 
                      Features: Records, Prescriptions
                    </small>
                  </div>
                </div>
                <div className="access-indicator">
                  {dashboardRoleAccess.roleAccess?.doctor?.accessible ? '✅' : '🔒'}
                </div>
              </button>

              <button 
                className="role-dashboard-btn financial-btn"
                onClick={() => handleDashboardAccess('financial')}
              >
                <div className="dashboard-icon">💰</div>
                <div className="dashboard-info">
                  <h4>Financial Manager Dashboard</h4>
                  <p>Billing, payments & financial reports</p>
                  <div className="dashboard-stats">
                    <small>
                      Staff: {dashboardRoleAccess.roleAccess?.financial_manager?.count || 0} | 
                      Features: Billing, Reports
                    </small>
                  </div>
                </div>
                <div className="access-indicator">
                  {dashboardRoleAccess.roleAccess?.financial_manager?.accessible ? '✅' : '🔒'}
                </div>
              </button>
            </div>
          </div>

          {/* Recent Patient Profiles - Also Clickable */}
          <div className="patient-profiles-section">
            <h2>👨‍⚕️ Recent Patient Profiles (Click to View Details)</h2>
            <div className="patient-buttons-grid">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient, index) => (
                  <button 
                    key={patient._id || index} 
                    className="patient-profile-btn clickable-profile"
                    onClick={() => handleProfileClick({
                      _id: patient._id,
                      name: patient.name,
                      email: patient.email,
                      type: 'patient',
                      role: 'patient',
                      status: patient.isAccountVerified ? 'verified' : 'pending',
                      lastActivity: patient.createdAt
                    })}
                  >
                    <div className="patient-icon">👤</div>
                    <div className="patient-info">
                      <h4>{patient.name}</h4>
                      <p>{patient.email}</p>
                      <small>
                        {patient.isAccountVerified ? '✅ Verified' : '⏳ Pending'} | 
                        Registered: {new Date(patient.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="no-patients-message">
                  <p>No recent patients. System is ready for patient registration.</p>
                  <button className="patient-profile-btn" onClick={() => navigate('/admin/patients')}>
                    <div className="patient-icon">👥</div>
                    <div className="patient-info">
                      <h4>View All Patients</h4>
                      <p>Access complete patient database</p>
                      <small>Manage all registered patients</small>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Growth Analytics */}
          {growthAnalytics && (
            <div className="analytics-section">
              <h2>📈 Growth Analytics (Last 7 Days)</h2>
              <div className="analytics-cards">
                <div className="analytics-card">
                  <h4>📅 New Registrations</h4>
                  <p className="big-number">{systemStats.recentRegistrations}</p>
                  <small>Last 7 days</small>
                </div>
                <div className="analytics-card">
                  <h4>📊 Monthly Growth</h4>
                  <p className="big-number">{systemStats.monthlyGrowth}</p>
                  <small>Last 30 days</small>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {activityLogs.length > 0 && (
            <div className="activity-section">
              <h2>🔄 Recent System Activity</h2>
              <div className="activity-list">
                {activityLogs.slice(0, 5).map((log, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {log.type === 'user_registration' ? '👤' : '🔐'}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>{log.user}</strong> 
                        {log.type === 'user_registration' 
                          ? ' registered as a new user' 
                          : ` logged in as ${log.role}`}
                      </p>
                      <small>{new Date(log.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Detail Modal */}
          <ProfileDetailModal
            isOpen={showProfileModal}
            onClose={closeProfileModal}
            profileId={selectedProfile?._id}
            profileType={selectedProfile?.type}
          />

          {/* Support Modal */}
          {showSupportModal && (
            <div className="support-modal-overlay" onClick={() => setShowSupportModal(false)}>
              <div className="support-modal" onClick={e => e.stopPropagation()}>
                <div className="support-modal-header">
                  <h3>💬 Contact Support</h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowSupportModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="support-modal-body">
                  <div className="support-options">
                    <button 
                      className="support-option"
                      onClick={() => {
                        handleContactSupport();
                        setShowSupportModal(false);
                      }}
                    >
                      📧 Send Email
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('tel:+1234567890');
                        setShowSupportModal(false);
                      }}
                    >
                      📞 Call Support
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('https://your-chat-support.com', '_blank');
                        setShowSupportModal(false);
                      }}
                    >
                      💬 Live Chat
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('https://your-knowledge-base.com', '_blank');
                        setShowSupportModal(false);
                      }}
                    >
                      📚 Knowledge Base
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Buttons */}
          <div className="floating-action-buttons">
            <button 
              className="fab-button print-button"
              onClick={handlePrint}
              title="Print Dashboard"
            >
              🖨️
            </button>
            <button 
              className="fab-button support-button"
              onClick={() => setShowSupportModal(true)}
              title="Contact Support"
            >
              💬
            </button>
          </div>
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;
