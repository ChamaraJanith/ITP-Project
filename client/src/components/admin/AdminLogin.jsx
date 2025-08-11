// components/admin/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/admin-login', formData, {
        withCredentials: true
      });

      if (response.data.success) {
        const { role } = response.data.data;
        
        // Store admin data
        localStorage.setItem('admin', JSON.stringify(response.data.data));
        
        // Navigate based on admin role
        switch(role) {
          case 'receptionist':
            navigate('/admin/receptionist');
            break;
          case 'doctor':
            navigate('/admin/doctor');
            break;
          case 'financial_manager':
            navigate('/admin/financial');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/admin/dashboard');
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setMessage('❌ Invalid admin credentials or access denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">
            <span className="logo-icon">🏥</span>
            <h2>HealX Healthcare</h2>
          </div>
          <p className="admin-subtitle">Admin Portal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your admin email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {message && (
            <div className={`admin-message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="admin-login-btn">
            {loading ? (
              <>
                <div className="spinner"></div>
                Authenticating...
              </>
            ) : (
              <>
                <span>🚀</span>
                Access Admin Portal
              </>
            )}
          </button>

          <div className="admin-footer-links">
            <a href="/forgot-password">Forgot Password?</a>
            <a href="/">← Back to Main Site</a>
          </div>
        </form>

        <div className="admin-role-info">
          <h4>🔐 Authorized Personnel Only</h4>
          <div className="role-badges">
            <span className="role-badge receptionist">👩‍💼 Receptionist</span>
            <span className="role-badge doctor">👨‍⚕️ Doctor</span>
            <span className="role-badge financial">💰 Financial</span>
            <span className="role-badge admin">👑 Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
