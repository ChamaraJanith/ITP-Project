// src/components/admin/dashboards/FinancialDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import './FinancialDashboard.css';

const FinancialDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0
  });

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const parsedAdmin = JSON.parse(adminData);
      if (parsedAdmin.role !== 'financial_manager') {
        navigate('/admin/login');
        return;
      }
      setAdmin(parsedAdmin);
      loadFinancialData();
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  const loadFinancialData = async () => {
    // Mock data - replace with actual API calls
    setDashboardData({
      todayRevenue: 15750,
      monthlyRevenue: 485200,
      pendingPayments: 23400,
      overduePayments: 8900
    });
  };

  if (!admin) {
    return <div className="loading">Loading financial dashboard...</div>;
  }

  return (
    <AdminLayout admin={admin} title="Financial Manager Dashboard">
      <div className="financial-dashboard">
        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>${dashboardData.todayRevenue.toLocaleString()}</h3>
              <p>Today's Revenue</p>
            </div>
          </div>
          <div className="stat-card monthly">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>${dashboardData.monthlyRevenue.toLocaleString()}</h3>
              <p>Monthly Revenue</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>${dashboardData.pendingPayments.toLocaleString()}</h3>
              <p>Pending Payments</p>
            </div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>${dashboardData.overduePayments.toLocaleString()}</h3>
              <p>Overdue Payments</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="financial-actions-section">
          <h2>💼 Financial Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary">
              <span className="btn-icon">📊</span>
              <div className="btn-content">
                <h4>Generate Report</h4>
                <p>Create financial reports</p>
              </div>
            </button>
            
            <button className="action-btn secondary">
              <span className="btn-icon">💳</span>
              <div className="btn-content">
                <h4>Process Payments</h4>
                <p>Handle patient payments</p>
              </div>
            </button>
            
            <button className="action-btn tertiary">
              <span className="btn-icon">📋</span>
              <div className="btn-content">
                <h4>View Invoices</h4>
                <p>Manage billing invoices</p>
              </div>
            </button>
            
            <button className="action-btn quaternary">
              <span className="btn-icon">🏦</span>
              <div className="btn-content">
                <h4>Insurance Claims</h4>
                <p>Process insurance claims</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinancialDashboard;
