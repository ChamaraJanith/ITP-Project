import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../pages/styles/RegisterUser.css';

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const backendUrl = 'http://localhost:7000';

  // Enhanced input change handler with validations
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;

    // Apply field-specific validations
    switch (name) {
      case 'name':
        // Only allow alphabetical characters and spaces
        filteredValue = value.replace(/[^A-Za-z\s]/g, '');
        break;
       
      case 'phone':
        // Only allow numerical characters and limit to 10 digits
        filteredValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        break;
       
      case 'email':
        // Keep email as is (no filtering, just validation on submit)
        filteredValue = value;
        break;
       
      case 'password':
      case 'confirmPassword':
      case 'dateOfBirth':
      case 'gender':
      case 'role':
        // No filtering for these fields
        filteredValue = value;
        break;
       
      default:
        filteredValue = value;
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  // Prevent paste of invalid characters
  const handlePaste = (e, fieldType) => {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    let filteredData = pasteData;

    switch (fieldType) {
      case 'name':
        // Only allow alphabetical characters and spaces
        filteredData = pasteData.replace(/[^A-Za-z\s]/g, '');
        break;
      case 'phone':
        // Only allow numerical characters and limit to 10 digits
        filteredData = pasteData.replace(/[^0-9]/g, '').slice(0, 10);
        break;
      default:
        filteredData = pasteData;
    }

    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: filteredData }));
  };

  // Prevent certain key presses for specific fields
  const handleKeyPress = (e, fieldType) => {
    switch (fieldType) {
      case 'name':
        // Prevent non-alphabetical characters and non-space keys
        if (!/[A-Za-z\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }
        break;
      case 'phone':
        // Prevent non-numerical characters
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }
        // Prevent typing if already 10 digits
        if (e.target.value.length >= 10 && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }
        break;
    }
  };

  const validateStep1 = () => {
    const { name, email, password, confirmPassword } = formData;
    if (!name.trim()) {
      setMessage('❌ Full name is required');
      return false;
    }
    if (!email.trim()) {
      setMessage('❌ Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('❌ Please enter a valid email address');
      return false;
    }
    if (!password) {
      setMessage('❌ Password is required');
      return false;
    }
    if (password.length < 6) {
      setMessage('❌ Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { phone, dateOfBirth } = formData;
    if (phone && phone.length !== 10) {
      setMessage('❌ Phone number must be exactly 10 digits');
      return false;
    }
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        setMessage('❌ You must be at least 13 years old to register');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setMessage('');
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => {
    setMessage('');
    setStep(1);
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '' };
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    if (strength < 3) return { strength: 1, text: 'Weak', color: '#dc3545' };
    if (strength < 5) return { strength: 2, text: 'Medium', color: '#ffc107' };
    return { strength: 3, text: 'Strong', color: '#28a745' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validateStep2()) return;
    setLoading(true);

    try {
      console.log('📝 Registering user:', { ...formData, password: '[HIDDEN]' });
      const response = await axios.post(`${backendUrl}/api/auth/register`, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        role: formData.role
      });

      console.log('✅ Registration response:', response.data);

      if (response.data.success) {
        setMessage('✅ Registration successful! Welcome to HealX.');

        // CRITICAL FIX: Use the complete user data from the response
        const userData = response.data.user || response.data.data;
        
        // Make sure we have the ID from the response
        if (!userData._id && !userData.id) {
          console.error('❌ No user ID in response:', userData);
          setMessage('❌ Registration succeeded but user data is incomplete. Please try logging in.');
          setLoading(false);
          return;
        }

        // Persist token
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          
          // CRITICAL FIX: Set the authorization header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }

        // Persist complete user data from the server
        localStorage.setItem('user', JSON.stringify(userData));

        // Redirect to profile after a brief delay
        setTimeout(() => {
          navigate('/PatientProfile');
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      if (error.response?.status === 409) {
        setMessage('❌ An account with this email already exists. Please log in instead.');
      } else {
        const errMsg = error.response?.data?.message || 'Registration failed. Please try again.';
        setMessage('❌ ' + errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Create Account</h2>
          <p>Join HealX Healthcare - Your Health, Our Priority</p>
          <div className="progress-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <small>Account Details</small>
            </div>
            <div className="progress-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <small>Personal Info</small>
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {step === 1 && (
            <div className="form-step">
              <h3>Account Information</h3>
              <div className="form-group">
                <label htmlFor="name"><span className="label-icon">👤</span>Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onPaste={(e) => handlePaste(e, 'name')}
                  onKeyDown={(e) => handleKeyPress(e, 'name')}
                  placeholder="Enter your full name"
                  title="Only letters and spaces are allowed"
                  required
                />
                <small style={{ color: '#666', fontSize: '0.8em' }}>
                  ℹ️ Only letters and spaces allowed
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="email"><span className="label-icon">📧</span>Email Address</label>
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
                <label htmlFor="password"><span className="label-icon">🔒</span>Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <small style={{ color: passwordStrength.color }}>
                      Password strength: {passwordStrength.text}
                    </small>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword"><span className="label-icon">🔐</span>Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                  />
                  <button type="button" className="password-toggle" onClick={toggleConfirmPasswordVisibility}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="password-mismatch">
                    <small>❌ Passwords do not match</small>
                  </div>
                )}
              </div>
              <button type="button" className="next-btn" onClick={handleNext}>
                Next Step →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h3>Personal Information</h3>
              <div className="form-group">
                <label htmlFor="phone"><span className="label-icon">📱</span>Phone Number (Optional)</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onPaste={(e) => handlePaste(e, 'phone')}
                  onKeyDown={(e) => handleKeyPress(e, 'phone')}
                  placeholder="Enter your phone number"
                  title="Only numbers are allowed, exactly 10 digits"
                  maxLength="10"
                />
                <small style={{ color: '#666', fontSize: '0.8em' }}>
                  ℹ️ Only numbers allowed (10 digits) {formData.phone && `(${formData.phone.length}/10)`}
                </small>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth"><span className="label-icon">🎂</span>Date of Birth (Optional)</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gender"><span className="label-icon">⚥</span>Gender (Optional)</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="role"><span className="label-icon">👥</span>Account Type</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="user">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
          <div className="terms-info">
            <small>
              By creating an account, you agree to our{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;