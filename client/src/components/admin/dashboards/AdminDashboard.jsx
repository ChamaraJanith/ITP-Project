// src/components/admin/dashboards/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalPatients: 0,
    systemHealth: 'healthy'
  });

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      if (parsedAdmin.role !== 'admin') {
        navigate('/admin/login');
        return;
      }
      setAdmin(parsedAdmin);
      loadSystemData();
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  const loadSystemData = async () => {
    // Mock data - replace with actual API calls
    setSystemStats({
      totalUsers: 1250,
      totalStaff: 45,
      totalPatients: 980,
      systemHealth: 'healthy'
    });
  };

  if (!admin) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <AdminLayout admin={admin} title="System Administrator Dashboard">
      <div className="admin-dashboard">
        {/* System Overview */}
        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{systemStats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card staff">
            <div className="stat-icon">👨‍⚕️</div>
            <div className="stat-info">
              <h3>{systemStats.totalStaff}</h3>
              <p>Staff Members</p>
            </div>
          </div>
          <div className="stat-card patients">
            <div className="stat-icon">🏥</div>
            <div className="stat-info">
              <h3>{systemStats.totalPatients}</h3>
              <p>Patients</p>
            </div>
          </div>
          <div className="stat-card health">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Healthy</h3>
              <p>System Status</p>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="admin-actions-section">
          <h2>🛠️ System Management</h2>
          <div className="action-buttons">
            <button className="action-btn primary">
              <span className="btn-icon">👤</span>
              <div className="btn-content">
                <h4>Manage Users</h4>
                <p>User and staff management</p>
              </div>
            </button>
            
            <button className="action-btn secondary">
              <span className="btn-icon">📊</span>
              <div className="btn-content">
                <h4>System Analytics</h4>
                <p>View system reports</p>
              </div>
            </button>
            
            <button className="action-btn tertiary">
              <span className="btn-icon">⚙️</span>
              <div className="btn-content">
                <h4>System Settings</h4>
                <p>Configure system</p>
              </div>
            </button>
            
            <button className="action-btn quaternary">
              <span className="btn-icon">🔒</span>
              <div className="btn-content">
                <h4>Security Logs</h4>
                <p>View security logs</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
