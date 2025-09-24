import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pages/styles/ResetPassword.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const backendUrl = 'http://localhost:7000';

  useEffect(() => {
    // Get email from localStorage (set from ForgotPassword component)
    const storedEmail = localStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email found, redirect back to forgot password
      navigate('/forgot-password');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      setMessage('❌ All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters long');
      return;
    }

    if (otp.length !== 6) {
      setMessage('❌ OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔄 Resetting password for:', email);
      
      const response = await axios.post(`${backendUrl}/api/auth/resetPassword`, {
        email: email,
        otp: otp,
        newPassword: newPassword
      });

      console.log('✅ Reset password response:', response.data);

      if (response.data.success) {
        setMessage('✅ Password reset successfully!');
        
        // Clear stored email
        localStorage.removeItem('resetEmail');
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setMessage('❌ Email not found. Please go back to forgot password.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('🔄 Resending OTP to:', email);
      
      const response = await axios.post(`${backendUrl}/api/auth/resendResetOtp`, {
        email: email
      });

      if (response.data.success) {
        setMessage('✅ New OTP sent to your email!');
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h2>Reset Password</h2>
          <p>Enter the OTP sent to your email and create a new password</p>
          {email && (
            <div className="email-display">
              <span>📧 {email}</span>
            </div>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="otp">Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              required
              className="otp-input"
            />
            <div className="otp-info">
              <small>Check your email for the 6-digit OTP code</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength="6"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="password-requirements">
              <small>Password must be at least 6 characters long</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength="6"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <div className="password-mismatch">
                <small>❌ Passwords do not match</small>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="form-actions">
            <button
              type="button"
              className="resend-btn"
              onClick={handleResendOtp}
              disabled={loading}
            >
              Didn't receive OTP? Resend
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Back to Forgot Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;