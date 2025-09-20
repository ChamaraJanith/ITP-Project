import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ admin, title, children }) => {
  const navigate = useNavigate();

  // ✅ FIXED: Handle null admin gracefully
  if (!admin) {
    return (
      <div className="admin-layout">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading admin session...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Additional safety check for admin properties
  const adminName = admin?.name || 'Admin User';
  const adminRole = admin?.role || 'user';
  const adminEmail = admin?.email || '';

  const handleLogout = () => {
    try {
      // Clear admin data
      localStorage.removeItem('admin');
      
      // Redirect to admin login
      navigate('/admin/login');
      
      // Optional: Call logout API
      fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.log('Logout API error:', err));
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <Link to="/admin/dashboard">
              🏥 HealX Admin
            </Link>
          </div>
          
          <div className="admin-nav">


            <Link to="/admin/dashboard" className="nav-link">
              📊 Dashboard
            </Link>
            <Link to="/admin/procurement" className="nav-link">
              📦 Procurement
            </Link>
            <Link to="/admin/receptionist-dashboard" className="nav-link">
              👩‍💼 Receptionist
            </Link>
            <Link to="/admin/doctor-dashboard" className="nav-link">
              👩‍⚕️ Doctor
            </Link>
            <Link to="/admin/financial-dashboard" className="nav-link">
              💰 Financial
            </Link>
          </div>

          <div className="admin-user-info">
            <div className="admin-user-details">
              <span className="admin-name">{adminName}</span>
              <span className={`admin-role role-${adminRole}`}>
                {adminRole.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="admin-main">
        <div className="admin-content">
          {title && (
            <div className="admin-page-header">
              <h1>{title}</h1>
              <div className="admin-breadcrumb">
                <Link to="/admin/dashboard">Dashboard</Link>
                {title !== "System Administrator Dashboard" && (
                  <>
                    <span> / </span>
                    <span>{title}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
