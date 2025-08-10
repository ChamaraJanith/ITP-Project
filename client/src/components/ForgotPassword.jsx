import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../pages/styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const backendUrl = 'http://localhost:7000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      console.log('📧 Requesting password reset for:', email);
      
      const response = await axios.post(`${backendUrl}/api/auth/sendResetOtp`, {
        email: email
      });

      console.log('✅ Send reset OTP response:', response.data);

      if (response.data.success) {
        setMessage('✅ OTP sent to your email successfully!');
        
        // Store email for next step and navigate to password reset
        localStorage.setItem('resetEmail', email);
        setTimeout(() => {
          navigate('/reset-password');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Send reset OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h2>Forgot Password</h2>
          <p>Enter your email address to receive an OTP</p>
        </div>

        {message && (
          <div className={`message ${message.includes('sent') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
            />
          </div>

          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <div className="back-to-login">
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
