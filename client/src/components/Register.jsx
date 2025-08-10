import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const backendUrl = 'http://localhost:7000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      setMessage('❌ Full name is required');
      return false;
    }
    
    if (formData.name.trim().length < 2) {
      setMessage('❌ Name must be at least 2 characters long');
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      setMessage('❌ Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('❌ Please enter a valid email address');
      return false;
    }

    // Password validation - MATCH BACKEND REQUIREMENTS
    if (!formData.password) {
      setMessage('❌ Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      setMessage('❌ Password must be at least 8 characters long');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage('❌ Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      setMessage('❌ Please confirm your password');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous messages
    setMessage('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Attempting registration for:', formData.email);
      
      const response = await axios.post(`${backendUrl}/api/auth/register`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      }, {
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });

      console.log('✅ Registration response:', response.data);

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        
        // Store user data in localStorage
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setPasswordStrength(0);
        
        // Redirect to homepage after successful registration
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444';
    if (passwordStrength <= 4) return '#f59e0b';
    return '#10b981';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Join HealX Healthcare</h2>
          <p>Create your account to access premium healthcare services</p>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              minLength="2"
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
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
              placeholder="Create a strong password (min 8 characters)"
              required
              minLength="8"
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`strength-bar ${passwordStrength >= level ? 'active' : ''}`}
                      style={{
                        backgroundColor: passwordStrength >= level ? getStrengthColor() : '#e5e7eb'
                      }}
                    />
                  ))}
                </div>
                <span 
                  className="strength-text"
                  style={{ color: getStrengthColor() }}
                >
                  {getStrengthText()}
                </span>
              </div>
            )}
            
            {/* Password Requirements */}
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li className={formData.password.length >= 8 ? 'valid' : ''}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                  One number
                </li>
                <li className={/[@$!%*?&]/.test(formData.password) ? 'valid' : ''}>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
              minLength="8"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="password-mismatch">
                ❌ Passwords do not match
              </div>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
              <div className="password-match">
                ✅ Passwords match
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={`register-btn ${loading ? 'loading' : ''}`}
            disabled={loading || passwordStrength < 5}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account? 
            <Link to="/login" className="login-link"> Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
