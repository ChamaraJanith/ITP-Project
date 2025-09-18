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
      console.log('🔍 Attempting admin login...');

      // ✅ FIXED: Correct endpoint and port
      const response = await axios.post('http://localhost:7000/api/admin/login', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('📥 Login response:', response.data);

      if (response.data.success) {
        const { role } = response.data.data;
        
        // Store admin data
        localStorage.setItem('admin', JSON.stringify(response.data.data));
        
        console.log('✅ Admin login successful, role:', role);
        setMessage('✅ Login successful! Redirecting...');
        
        // Navigate based on admin role
        setTimeout(() => {
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
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      
      // ✅ Enhanced error handling
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure backend is running on port 7000.';
      } else if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setMessage(`❌ ${errorMessage}`);
      
      // Clear any existing admin data on failed login
      localStorage.removeItem('admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">
            <h2>HealX Healthcare</h2>
          </div>
          <p className="admin-subtitle">Admin Portal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your admin email"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
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

        {/* ✅ Development helper for testing */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>🧪 Test Credentials</h5>
            <div style={{ color: '#6c757d', fontFamily: 'monospace' }}>
              <div>Admin: admin@healx.com / admin123</div>
              <div>Receptionist: receptionist@healx.com / receptionist123</div>
              <div>Doctor: doctor@healx.com / doctor123</div>
              <div>Financial: financial@healx.com / financial123</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
