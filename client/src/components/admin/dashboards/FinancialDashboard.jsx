import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { adminDashboardApi } from '../../../services/adminApi.js';

const FinancialDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      const response = await adminDashboardApi.accessFinancialDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading financial dashboard:', error);
      setError('Failed to load financial dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Financial Dashboard">
        <div className="loading">Loading financial dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Financial Dashboard">
      <div className="financial-dashboard">
        <div className="dashboard-header">
          <h1>💰 Financial Manager Dashboard</h1>
          <p>Billing, payments & financial reports</p>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>${dashboardData.stats?.todayRevenue?.toLocaleString() || 0}</h3>
                <p>Today's Revenue</p>
              </div>
              <div className="stat-card">
                <h3>${dashboardData.stats?.pendingPayments?.toLocaleString() || 0}</h3>
                <p>Pending Payments</p>
              </div>
              <div className="stat-card">
                <h3>${dashboardData.stats?.monthlyTarget?.toLocaleString() || 0}</h3>
                <p>Monthly Target</p>
              </div>
              <div className="stat-card">
                <h3>{dashboardData.stats?.collectionRate || 0}%</h3>
                <p>Collection Rate</p>
              </div>
            </div>

            <div className="features-section">
              <h2>💼 Financial Features</h2>
              <div className="features-grid">
                {dashboardData.features?.map((feature, index) => (
                  <div key={index} className="feature-card">
                    <h4>{feature.replace('_', ' ').toUpperCase()}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="activity-section">
              <h2>📋 Recent Financial Activities</h2>
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

export default FinancialDashboard;
