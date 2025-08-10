import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const backendUrl = 'http://localhost:7000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔐 Attempting login for:', formData.email);
      
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      }, {
        withCredentials: true
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        setMessage(`✅ Welcome back, ${response.data.user.name}!`);
        console.log('User logged in:', response.data.user);
        
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Login</h2>
          <p>Sign in with your registered credentials</p>
        </div>

        {message && (
          <div className={`message ${message.includes('Welcome') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter registered email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
            />
          </div>

          <button 
            type="submit" 
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          {/* Forgot Password Link - Fixed navigation path */}
          <div className="forgot-password-link">
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
