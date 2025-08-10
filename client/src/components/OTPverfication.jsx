import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/OTPVerification.css';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const backendUrl = 'http://localhost:7000';
  const email = localStorage.getItem('resetEmail');

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Redirect if no email found
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔐 Verifying OTP:', otpString);
      
      const response = await axios.post(`${backendUrl}/api/auth/verify-otp`, {
        email: email,
        otp: otpString
      });

      console.log('✅ OTP verification response:', response.data);

      if (response.data.success) {
        setMessage('✅ OTP verified successfully!');
        
        // Store verification token for password reset
        localStorage.setItem('resetToken', response.data.resetToken);
        setTimeout(() => {
          navigate('/reset-password');
        }, 1500);
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
      setMessage('❌ ' + errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${backendUrl}/api/auth/resend-otp`, {
        email: email
      });

      if (response.data.success) {
        setMessage('✅ New OTP sent successfully!');
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <div className="otp-verification-header">
          <h2>Verify OTP</h2>
          <p>Enter the 6-digit code sent to {email}</p>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="otp-verification-form">
          <div className="otp-input-group">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={loading}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="resend-section">
            {!canResend ? (
              <p>Resend OTP in {resendTimer}s</p>
            ) : (
              <button
                type="button"
                className="link-btn"
                onClick={handleResendOTP}
                disabled={loading}
              >
                Resend OTP
              </button>
            )}
          </div>

          <div className="back-link">
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Change Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
