// components/admin/AdminLayout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLayout.css';

const AdminLayout = ({ children, admin, title }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/admin-logout', {}, {
        withCredentials: true
      });
      
      localStorage.removeItem('admin');
      navigate('/admin/login');
    } catch (error) {
      console.error('Admin logout error:', error);
      localStorage.removeItem('admin');
      navigate('/admin/login');
    }
  };

  const getRoleIcon = (role) => {
    const icons = {
      receptionist: '👩‍💼',
      doctor: '👨‍⚕️',
      financial_manager: '💰',
      admin: '👑'
    };
    return icons[role] || '👤';
  };

  const getRoleName = (role) => {
    const names = {
      receptionist: 'Receptionist',
      doctor: 'Doctor',
      financial_manager: 'Financial Manager',
      admin: 'Administrator'
    };
    return names[role] || 'Staff';
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="header-left">
          <div className="admin-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">HealX Healthcare</span>
          </div>
          <div className="page-title">
            <h1>{title}</h1>
          </div>
        </div>
        
        <div className="header-right">
          <div className="admin-profile">
            <div className="admin-avatar">
              <span>{getRoleIcon(admin.role)}</span>
            </div>
            <div className="admin-info">
              <span className="admin-name">{admin.name}</span>
              <span className="admin-role">{getRoleName(admin.role)}</span>
            </div>
          </div>
          
          <div className="admin-actions">
            <button className="notification-btn">
              <span>🔔</span>
              <span className="notification-count">3</span>
            </button>
            
            <button className="settings-btn">
              <span>⚙️</span>
            </button>
            
            <button onClick={handleLogout} className="logout-btn">
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>

      {/* Quick Navigation */}
      <div className="admin-quick-nav">
        <button 
          onClick={() => navigate('/')}
          className="quick-nav-btn"
          title="Main Website"
        >
          🏠
        </button>
        <button 
          onClick={() => navigate('/admin/help')}
          className="quick-nav-btn"
          title="Help"
        >
          ❓
        </button>
        <button 
          onClick={() => window.print()}
          className="quick-nav-btn"
          title="Print"
        >
          🖨️
        </button>
      </div>
    </div>
  );
};

export default AdminLayout;
