import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';

// NOTE: Removed MedicalNavbar for a cleaner, full-screen login experience.
// The main app layout (which includes the navbar) should only be shown after login.

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const backendUrl = 'http://localhost:7000';

  // --- IMPROVED: Check for a valid token instead of just user data ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If a token exists, the user is considered logged in.
      navigate('/');
    }
  }, [navigate]);

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
      
      // --- FIX: Removed `withCredentials` as we are using JWTs in headers ---
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data;

        // --- CRITICAL FIX: Store the token and user data ---
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // --- CRITICAL FIX: Set the default Authorization header for all future axios requests ---
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setMessage(`✅ Welcome back, ${user.name}!`);
        console.log('User logged in and token stored:', user);
        
        // Redirect using React Router navigation
        setTimeout(() => {
          navigate('/');
        }, 1500); // Reduced delay for better UX
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
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {message && (
          <div className={`message ${message.includes('Welcome') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Forgot Password Link */}
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