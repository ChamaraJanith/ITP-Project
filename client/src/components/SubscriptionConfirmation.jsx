import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './styles/SubscriptionConfirmation.css';

const SubscriptionConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');
  
  const backendUrl = 'http://localhost:7000';

  useEffect(() => {
    const confirmSubscription = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link. Token is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${backendUrl}/api/subscription/confirm?token=${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message);
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
        const errorMessage = error.response?.data?.message || 'Failed to confirm subscription.';
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    confirmSubscription();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card loading">
          <div className="loading-spinner"></div>
          <h2>Confirming Your Subscription...</h2>
          <p>Please wait while we process your confirmation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className={`confirmation-card ${status}`}>
        <div className="confirmation-icon">
          {status === 'success' ? '🎉' : '❌'}
        </div>
        
        <h2>
          {status === 'success' ? 'Subscription Confirmed!' : 'Confirmation Failed'}
        </h2>
        
        <p className="confirmation-message">{message}</p>
        
        {status === 'success' && (
          <div className="success-content">
            <div className="welcome-message">
              <h3>Welcome to HealX Healthcare Newsletter!</h3>
              <p>You'll now receive:</p>
              <ul>
                <li>📰 Weekly health newsletters</li>
                <li>🎯 Personalized health tips</li>
                <li>🔔 Important health alerts</li>
                <li>🏥 Healthcare updates and news</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="confirmation-actions">
          {status === 'success' ? (
            <>
              <button 
                onClick={() => navigate('/profile')}
                className="btn-primary"
              >
                View Profile
              </button>
              <button 
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Go to Homepage
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/subscription')}
                className="btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Go to Homepage
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionConfirmation;
