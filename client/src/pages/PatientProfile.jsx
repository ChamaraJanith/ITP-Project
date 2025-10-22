// src/pages/PatientProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/PatientProfile.css';

// ==================== CONFIGURATION ====================
const BACKEND_URL = 'http://localhost:7000';
const MIN_AGE = 13;
const PHONE_LENGTH = 10;
const MIN_PASSWORD_LENGTH = 6;

// ==================== UTILITY FUNCTIONS ====================

const formatDate = (dateString) => {
  if (!dateString) return 'Not provided';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not provided';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Not provided';
  }
};

const formatPhoneNumber = (phone) => {
  if (!phone) return 'Not provided';
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  } catch (error) {
    return null;
  }
};

const calculateAccountAge = (createdAt) => {
  if (!createdAt) return null;
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return months > 0 
        ? `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
        : `${years} year${years !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error calculating account age:', error);
    return null;
  }
};

const calculateProfileCompletion = (user) => {
  const fields = ['name', 'email', 'phone', 'dateOfBirth', 'gender'];
  const filledFields = fields.filter(field => user[field]);
  return Math.round((filledFields.length / fields.length) * 100);
};

const copyToClipboard = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const message = document.createElement('div');
    message.textContent = '✅ User ID copied!';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(message);
    setTimeout(() => {
      message.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => message.remove(), 300);
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
};

// ==================== SUB-COMPONENTS ====================

const LoadingSpinner = () => (
  <div className="profile-loading-container">
    <div className="profile-spinner"></div>
    <p className="profile-loading-text">Loading profile...</p>
  </div>
);

const MessageAlert = ({ message }) => {
  const getMessageType = () => {
    if (message.includes('✅')) return 'success';
    if (message.includes('ℹ️')) return 'info';
    return 'error';
  };

  return (
    <div className={`profile-message profile-message-${getMessageType()}`}>
      {message}
    </div>
  );
};

const ProfileHeader = ({ user, role, onLogout }) => (
  <div className="profile-header-container">
    <div className="profile-avatar-wrapper">
      <span className="profile-avatar-icon">
        {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
      </span>
    </div>
    <div className="profile-header-content">
      <h2 className="profile-user-name">{user.name}</h2>
      <p className="profile-user-role">
        {role === 'admin' ? '👨‍💼 Administrator' : 
         role === 'doctor' ? '👨‍⚕️ Doctor' : 
         '👤 Patient'}
      </p>
    </div>
    <div className="profile-header-actions">
      <button 
        className="profile-btn profile-btn-logout" 
        onClick={onLogout}
        title="Logout"
        type="button"
      >
        🚪 Logout
      </button>
    </div>
  </div>
);

const ProfileStats = ({ user }) => {
  const completionPercentage = calculateProfileCompletion(user);
  
  return (
    <div className="profile-stats-container">
      <div className="profile-stat-card">
        <div className="profile-stat-icon">📊</div>
        <div className="profile-stat-content">
          <div className="profile-stat-label">Profile Completion</div>
          <div className="profile-stat-value">{completionPercentage}%</div>
          <div className="profile-progress-bar">
            <div 
              className="profile-progress-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          {completionPercentage < 100 && (
            <small className="profile-stat-hint">
              Complete your profile to get personalized recommendations
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== PREMIUM PACKAGE ADVERTISEMENT ====================
const PremiumPackageAdvertisement = ({ userRole }) => {
  // Only show for regular patients (users), hide for admins/doctors
  if (userRole !== 'user') {
    return null;
  }

  const handleUpgradeToPremium = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('🎉 Premium Package Coming Soon!\n\nUpgrade to unlock:\n✅ Personal Blood Sugar Monitor\n✅ Quick Hospital Finder\n✅ Priority Appointments\n✅ 24/7 Health Consultation\n✅ Free Ambulance Service\n\nStay tuned!');
  };

  return (
    <div className="profile-premium-banner">
      <div className="profile-premium-badge">
        <span className="profile-premium-badge-text">⭐ PREMIUM</span>
      </div>

      <div className="profile-premium-content">
        <div className="profile-premium-icon">
          <span className="profile-premium-crown">👑</span>
          <div className="profile-premium-glow"></div>
        </div>
        
        <div className="profile-premium-text">
          <h3 className="profile-premium-title">
            ✨ Upgrade to Premium Healthcare
          </h3>
          <p className="profile-premium-description">
            Get exclusive access to advanced health monitoring and priority care
          </p>
          
          <div className="profile-premium-features">
            <div className="profile-premium-feature">
              <span className="profile-premium-icon-wrapper">🩸</span>
              <div className="profile-premium-feature-content">
                <strong>Blood Sugar Monitor</strong>
                <small>Real-time glucose tracking at home</small>
              </div>
            </div>
            
            <div className="profile-premium-feature">
              <span className="profile-premium-icon-wrapper">🏥</span>
              <div className="profile-premium-feature-content">
                <strong>Quick Hospital Finder</strong>
                <small>Instant nearby hospital locations</small>
              </div>
            </div>
            
            <div className="profile-premium-feature">
              <span className="profile-premium-icon-wrapper">⚡</span>
              <div className="profile-premium-feature-content">
                <strong>Priority Appointments</strong>
                <small>Skip the queue, book instantly</small>
              </div>
            </div>
            
            <div className="profile-premium-feature">
              <span className="profile-premium-icon-wrapper">👨‍⚕️</span>
              <div className="profile-premium-feature-content">
                <strong>24/7 Health Consultation</strong>
                <small>Expert doctors anytime, anywhere</small>
              </div>
            </div>
            
            <div className="profile-premium-feature">
              <span className="profile-premium-icon-wrapper">🚑</span>
              <div className="profile-premium-feature-content">
                <strong>Free Ambulance Service</strong>
                <small>Emergency transport included</small>
              </div>
            </div>
            
            <div className="profile-premium-feature">
              <span className="profile-premium-icon-wrapper">💊</span>
              <div className="profile-premium-feature-content">
                <strong>Prescription Discounts</strong>
                <small>Save up to 40% on medicines</small>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-premium-action">
          <div className="profile-premium-pricing">
            <div className="profile-premium-price">
              <span className="profile-premium-currency">$</span>
              <span className="profile-premium-amount">29</span>
              <span className="profile-premium-period">/month</span>
            </div>
            <div className="profile-premium-save">
              Save $100 with annual plan
            </div>
          </div>
          
          <button 
            className="profile-premium-btn"
            onClick={handleUpgradeToPremium}
            type="button"
          >
            <span className="profile-premium-btn-icon">⭐</span>
            <span>Upgrade to Premium</span>
            <span className="profile-premium-btn-arrow">→</span>
          </button>
          
          <p className="profile-premium-note">
            🔒 Secure payment • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
      
      <div className="profile-premium-decoration">
        <div className="profile-premium-particle profile-premium-particle-1">✨</div>
        <div className="profile-premium-particle profile-premium-particle-2">⭐</div>
        <div className="profile-premium-particle profile-premium-particle-3">💫</div>
        <div className="profile-premium-particle profile-premium-particle-4">✨</div>
      </div>
    </div>
  );
};

const PersonalInfoDisplay = ({ user }) => {
  const age = calculateAge(user.dateOfBirth);
  
  return (
    <div className="profile-section-container">
      <h3 className="profile-section-title">Personal Information</h3>
      <div className="profile-info-grid">
        <div className="profile-info-item">
          <label className="profile-info-label">📧 Email</label>
          <p className="profile-info-value">{user.email || 'Not provided'}</p>
        </div>
        
        <div className="profile-info-item">
          <label className="profile-info-label">📱 Phone</label>
          <p className="profile-info-value">
            {formatPhoneNumber(user.phone)}
          </p>
          {!user.phone && (
            <span className="profile-empty-hint">Add your phone number for better communication</span>
          )}
        </div>
        
        <div className="profile-info-item">
          <label className="profile-info-label">🎂 Date of Birth</label>
          <p className="profile-info-value">
            {formatDate(user.dateOfBirth)}
            {age && <span className="profile-age-badge">{age} years old</span>}
          </p>
          {!user.dateOfBirth && (
            <span className="profile-empty-hint">Add your date of birth</span>
          )}
        </div>
        
        <div className="profile-info-item">
          <label className="profile-info-label">⚥ Gender</label>
          <p className="profile-info-value">
            {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not provided'}
          </p>
          {!user.gender && (
            <span className="profile-empty-hint">Specify your gender (optional)</span>
          )}
        </div>
      </div>
    </div>
  );
};

const AccountDetailsDisplay = ({ user }) => {
  const memberSince = formatDate(user.createdAt);
  const accountAge = calculateAccountAge(user.createdAt);
  
  return (
    <div className="profile-section-container">
      <h3 className="profile-section-title">Account Details</h3>
      <div className="profile-info-grid">
        <div className="profile-info-item">
          <label className="profile-info-label">🆔 User ID</label>
          <p className="profile-info-value profile-user-id">
            {user._id || user.id || 'Unknown'}
          </p>
          <button 
            className="profile-copy-btn"
            onClick={() => copyToClipboard(user._id || user.id)}
            title="Copy User ID"
            type="button"
          >
            📋 Copy ID
          </button>
        </div>
        
        <div className="profile-info-item">
          <label className="profile-info-label">📅 Member Since</label>
          <p className="profile-info-value">
            {memberSince}
          </p>
          {accountAge && (
            <span className="profile-account-age">
              Member for {accountAge}
            </span>
          )}
        </div>
        
        <div className="profile-info-item">
          <label className="profile-info-label">👤 Account Type</label>
          <p className="profile-info-value">
            {user.role === 'admin' ? '👨‍💼 Administrator' : 
             user.role === 'doctor' ? '👨‍⚕️ Healthcare Provider' : 
             '🏥 Patient Account'}
          </p>
        </div>
        
        <div className="profile-info-item">
          <label className="profile-info-label">✅ Account Status</label>
          <p className="profile-info-value">
            <span className="profile-status-badge profile-status-active">
              ● Active
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileActions = ({ onEdit, onBePatient, role, loading }) => (
  <div className="profile-actions-container">
    <button 
      className="profile-btn profile-btn-edit" 
      onClick={onEdit}
      type="button"
    >
      ✏️ Edit Profile
    </button>
    {role !== 'user' && (
      <button 
        className="profile-btn profile-btn-switch-role" 
        onClick={onBePatient}
        disabled={loading}
        type="button"
      >
        {loading ? 'Switching...' : '🏥 Be a Patient'}
      </button>
    )}
  </div>
);

const FormInput = ({ 
  label, 
  icon, 
  type = "text", 
  id, 
  name, 
  value, 
  onChange, 
  onPaste, 
  onKeyDown, 
  placeholder, 
  required = false, 
  maxLength,
  helpText 
}) => (
  <div className="profile-form-group">
    <label htmlFor={id} className="profile-form-label">
      {icon} {label}
    </label>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onPaste={onPaste}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="profile-form-input"
    />
    {helpText && <small className="profile-form-help-text">{helpText}</small>}
  </div>
);

const FormSelect = ({ label, icon, id, name, value, onChange, options }) => (
  <div className="profile-form-group">
    <label htmlFor={id} className="profile-form-label">
      {icon} {label}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className="profile-form-select"
    >
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const PersonalInfoForm = ({ 
  formData, 
  onChange, 
  onPaste, 
  onKeyPress 
}) => (
  <div className="profile-section-container">
    <h3 className="profile-section-title">Edit Personal Information</h3>
    
    <FormInput
      label="Full Name"
      icon="👤"
      id="name"
      name="name"
      value={formData.name}
      onChange={onChange}
      onPaste={(e) => onPaste(e, 'name')}
      onKeyDown={(e) => onKeyPress(e, 'name')}
      placeholder="Enter your full name"
      required
      helpText="ℹ️ Only letters and spaces allowed"
    />

    <FormInput
      label="Email Address"
      icon="📧"
      type="email"
      id="email"
      name="email"
      value={formData.email}
      onChange={onChange}
      placeholder="Enter your email"
      required
    />

    <FormInput
      label="Phone Number"
      icon="📱"
      type="tel"
      id="phone"
      name="phone"
      value={formData.phone}
      onChange={onChange}
      onPaste={(e) => onPaste(e, 'phone')}
      onKeyDown={(e) => onKeyPress(e, 'phone')}
      placeholder="Enter your phone number"
      maxLength="10"
      helpText={`ℹ️ Only numbers allowed (10 digits) ${formData.phone ? `(${formData.phone.length}/10)` : ''}`}
    />

    <div className="profile-form-row">
      <FormInput
        label="Date of Birth"
        icon="🎂"
        type="date"
        id="dateOfBirth"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={onChange}
      />
      
      <FormSelect
        label="Gender"
        icon="⚥"
        id="gender"
        name="gender"
        value={formData.gender}
        onChange={onChange}
        options={[
          { value: '', label: 'Select gender' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ]}
      />
    </div>
  </div>
);

const PasswordChangeSection = ({ 
  showSection, 
  onToggle, 
  passwordData, 
  onChange, 
  onSubmit, 
  showPassword, 
  togglePassword, 
  loading 
}) => (
  <div className="profile-section-container">
    <div className="profile-section-header-toggle" onClick={onToggle}>
      <h3 className="profile-section-title">Change Password</h3>
      <button 
        type="button"
        className="profile-toggle-btn"
        aria-label={showSection ? 'Collapse' : 'Expand'}
      >
        {showSection ? '▲' : '▼'}
      </button>
    </div>

    {showSection && (
      <form onSubmit={onSubmit} className="profile-password-form">
        <div className="profile-form-group">
          <label htmlFor="currentPassword" className="profile-form-label">
            🔒 Current Password
          </label>
          <div className="profile-password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={onChange}
              placeholder="Enter current password"
              className="profile-form-input"
            />
            <button 
              type="button" 
              className="profile-password-toggle-btn" 
              onClick={togglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="profile-form-group">
          <label htmlFor="newPassword" className="profile-form-label">
            🔐 New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={onChange}
            placeholder="Enter new password"
            className="profile-form-input"
          />
        </div>

        <div className="profile-form-group">
          <label htmlFor="confirmNewPassword" className="profile-form-label">
            🔐 Confirm New Password
          </label>
          <input
            type="password"
            id="confirmNewPassword"
            name="confirmNewPassword"
            value={passwordData.confirmNewPassword}
            onChange={onChange}
            placeholder="Confirm new password"
            className="profile-form-input"
          />
        </div>

        <button 
          type="submit" 
          className="profile-btn profile-btn-change-password"
          disabled={loading}
        >
          {loading ? 'Changing...' : '🔄 Change Password'}
        </button>
      </form>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================

const PatientProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    role: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    initializeUserData();
  }, [navigate]);

  const initializeUserData = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      const initialData = {
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        dateOfBirth: parsedUser.dateOfBirth ? parsedUser.dateOfBirth.split('T')[0] : '',
        gender: parsedUser.gender || '',
        role: parsedUser.role || 'user'
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      navigate('/login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;

    switch (name) {
      case 'name':
        filteredValue = value.replace(/[^A-Za-z\s]/g, '');
        break;
      case 'phone':
        filteredValue = value.replace(/[^0-9]/g, '').slice(0, PHONE_LENGTH);
        break;
      default:
        filteredValue = value;
    }

    setFormData(prev => ({ ...prev, [name]: filteredValue }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaste = (e, fieldType) => {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    let filteredData = pasteData;

    switch (fieldType) {
      case 'name':
        filteredData = pasteData.replace(/[^A-Za-z\s]/g, '');
        break;
      case 'phone':
        filteredData = pasteData.replace(/[^0-9]/g, '').slice(0, PHONE_LENGTH);
        break;
      default:
        filteredData = pasteData;
    }

    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: filteredData }));
  };

  const handleKeyPress = (e, fieldType) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    
    switch (fieldType) {
      case 'name':
        if (!/[A-Za-z\s]/.test(e.key) && !allowedKeys.includes(e.key)) {
          e.preventDefault();
        }
        break;
      case 'phone':
        if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
          e.preventDefault();
        }
        if (e.target.value.length >= PHONE_LENGTH && !allowedKeys.includes(e.key)) {
          e.preventDefault();
        }
        break;
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessage('❌ Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setMessage('❌ Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('❌ Please enter a valid email address');
      return false;
    }
    
    if (formData.phone && formData.phone.length !== PHONE_LENGTH) {
      setMessage(`❌ Phone number must be exactly ${PHONE_LENGTH} digits`);
      return false;
    }
    
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < MIN_AGE) {
        setMessage(`❌ You must be at least ${MIN_AGE} years old`);
        return false;
      }
    }
    
    return true;
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      setMessage('❌ All password fields are required');
      return false;
    }

    if (passwordData.newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage(`❌ New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setMessage('❌ New passwords do not match');
      return false;
    }

    return true;
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      setFormData(originalData);
      setMessage('');
    }
    setIsEditMode(!isEditMode);
    setShowPasswordSection(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = user._id || user.id;

      const response = await axios.put(
        `${BACKEND_URL}/api/users/profile/${userId}`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user || response.data.data;
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setOriginalData(formData);
        setIsEditMode(false);
        setMessage('✅ Profile updated successfully!');
        
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Update error:', error);
      const errMsg = error.response?.data?.message || 'Failed to update profile';
      setMessage('❌ ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validatePassword()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const userId = user._id || user.id;

      const response = await axios.put(
        `${BACKEND_URL}/api/users/change-password/${userId}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage('✅ Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        setShowPasswordSection(false);
        
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Password change error:', error);
      const errMsg = error.response?.data?.message || 'Failed to change password';
      setMessage('❌ ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBePatient = async () => {
    if (formData.role === 'user') {
      setMessage('ℹ️ You are already a patient');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const userId = user._id || user.id;

      const response = await axios.put(
        `${BACKEND_URL}/api/users/switch-role/${userId}`,
        { role: 'user' },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user || response.data.data;
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setFormData(prev => ({ ...prev, role: 'user' }));
        setOriginalData(prev => ({ ...prev, role: 'user' }));
        
        setMessage('✅ Successfully switched to patient role!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Role switch error:', error);
      const errMsg = error.response?.data?.message || 'Failed to switch role';
      setMessage('❌ ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/login');
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile-page-container">
      <div className="profile-card-wrapper">
        <ProfileHeader 
          user={user} 
          role={formData.role} 
          onLogout={handleLogout} 
        />

        {message && <MessageAlert message={message} />}

        <div className="profile-content-body">
          {!isEditMode ? (
            <div className="profile-display-mode">
              <ProfileStats user={user} />
              
              {/* Premium Package Advertisement - Shows only for regular patients */}
              <PremiumPackageAdvertisement userRole={formData.role} />
              
              <PersonalInfoDisplay user={user} />
              <AccountDetailsDisplay user={user} />
              <ProfileActions 
                onEdit={handleEditToggle}
                onBePatient={handleBePatient}
                role={formData.role}
                loading={loading}
              />
            </div>
          ) : (
            <div className="profile-edit-mode">
              <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                <PersonalInfoForm
                  formData={formData}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  onKeyPress={handleKeyPress}
                />

                <div className="profile-form-actions">
                  <button 
                    type="button" 
                    className="profile-btn profile-btn-cancel" 
                    onClick={handleEditToggle}
                    disabled={loading}
                  >
                    ❌ Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="profile-btn profile-btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </form>

              <PasswordChangeSection
                showSection={showPasswordSection}
                onToggle={() => setShowPasswordSection(!showPasswordSection)}
                passwordData={passwordData}
                onChange={handlePasswordChange}
                onSubmit={handleChangePassword}
                showPassword={showPassword}
                togglePassword={() => setShowPassword(!showPassword)}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
