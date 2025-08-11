import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
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

  useEffect(() => {
    initializeDashboard();
  }, [navigate]);

  const initializeDashboard = async () => {
    try {
      // Check admin authentication
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        if (parsedAdmin.role !== 'admin') {
          navigate('/admin/login');
          return;
        }
        setAdmin(parsedAdmin);
      } else {
        // Try to verify admin session from server
        const sessionCheck = await adminDashboardApi.verifyAdminSession();
        if (sessionCheck.success && sessionCheck.data.role === 'admin') {
          setAdmin(sessionCheck.data);
          localStorage.setItem('admin', JSON.stringify(sessionCheck.data));
        } else {
          navigate('/admin/login');
          return;
        }
      }

      // Load dashboard data
      await loadDashboardData();

    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      setError('Failed to initialize dashboard');
      navigate('/admin/login');
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

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  if (!admin) {
    return <div className="loading">Authenticating admin...</div>;
  }

  if (loading) {
    return (
      <AdminLayout admin={admin} title="System Administrator Dashboard">
        <div className="admin-dashboard">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="System Administrator Dashboard">
      <div className="admin-dashboard">
        {/* Header with refresh button */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1>📊 System Overview</h1>
            <div className="header-actions">
              <button onClick={refreshData} className="refresh-btn">
                🔄 Refresh Data
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

        {/* Real Data Statistics */}
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

        {/* Admin Actions */}
        <div className="admin-actions-section">
          <h2>🛠️ System Management</h2>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={() => navigate('/admin/users')}>
              <span className="btn-icon">👤</span>
              <div className="btn-content">
                <h4>Manage Users</h4>
                <p>{systemStats.totalUsers} total users</p>
              </div>
            </button>
            
            <button className="action-btn secondary" onClick={() => navigate('/admin/analytics')}>
              <span className="btn-icon">📊</span>
              <div className="btn-content">
                <h4>System Analytics</h4>
                <p>View detailed reports</p>
              </div>
            </button>
            
            <button className="action-btn tertiary" onClick={() => navigate('/admin/settings')}>
              <span className="btn-icon">⚙️</span>
              <div className="btn-content">
                <h4>System Settings</h4>
                <p>Configure system</p>
              </div>
            </button>
            
            <button className="action-btn quaternary" onClick={() => navigate('/admin/logs')}>
              <span className="btn-icon">🔒</span>
              <div className="btn-content">
                <h4>Security Logs</h4>
                <p>{activityLogs.length} recent activities</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
