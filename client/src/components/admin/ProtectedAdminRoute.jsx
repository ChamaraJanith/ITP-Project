// src/components/admin/ProtectedAdminRoute.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children, allowedRoles = [] }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      // Check localStorage first
      const adminData = localStorage.getItem('admin');
      if (!adminData) {
        navigate('/admin/login');
        return;
      }

      const parsedAdmin = JSON.parse(adminData);

      // Check role authorization
      if (allowedRoles.length === 0 || allowedRoles.includes(parsedAdmin.role)) {
        setAuthorized(true);
      } else {
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('admin');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>Verifying admin access...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="admin-unauthorized" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ef4444' }}>⚠️ Access Denied</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>You don't have permission to access this admin area.</p>
        <button 
          onClick={() => navigate('/admin/login')}
          style={{
            background: '#667eea',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Go to Admin Login
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedAdminRoute;
