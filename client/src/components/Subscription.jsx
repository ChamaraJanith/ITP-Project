import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../components/styles/Subscription.css';

const Subscription = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isSubscribed: false,
    subscribedAt: null,
    unsubscribedAt: null
  });
  const navigate = useNavigate();
  const backendUrl = 'http://localhost:7000';

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchSubscriptionStatus();
    }
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/subscription/status`, {
        withCredentials: true
      });

      if (response.data.success) {
        setSubscriptionStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      setMessage('❌ Please login to subscribe to our newsletter');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${backendUrl}/api/subscription/subscribe`, {
        email: user.email,
        name: user.name
      });

      if (response.data.success) {
        setMessage('✅ ' + response.data.message);
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) {
      setMessage('❌ Please login to manage your subscription');
      return;
    }

    if (window.confirm('Are you sure you want to unsubscribe from our newsletter?')) {
      setLoading(true);
      setMessage('');

      try {
        const response = await axios.post(`${backendUrl}/api/subscription/unsubscribe`, {
          email: user.email
        }, {
          withCredentials: true
        });

        if (response.data.success) {
          setMessage('✅ ' + response.data.message);
          setSubscriptionStatus(prev => ({
            ...prev,
            isSubscribed: false,
            unsubscribedAt: new Date()
          }));
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to unsubscribe. Please try again.';
        setMessage('❌ ' + errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="subscription-container">
      <div className="subscription-card">
        <div className="subscription-header">
          <div className="newsletter-icon">📧</div>
          <h2>Newsletter Subscription</h2>
          <p>Stay updated with the latest health news and tips</p>
        </div>

        {message && (
          <div className={`subscription-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="subscription-content">
          {user ? (
            <div className="user-subscription">
              <div className="user-info">
                <div className="user-avatar">
                  <span>{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="user-details">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="subscription-status">
                {subscriptionStatus.isSubscribed ? (
                  <div className="status-subscribed">
                    <div className="status-indicator">
                      <span className="status-icon">✅</span>
                      <span className="status-text">Subscribed</span>
                    </div>
                    <p className="status-date">
                      Since: {new Date(subscriptionStatus.subscribedAt).toLocaleDateString()}
                    </p>
                    <button 
                      onClick={handleUnsubscribe}
                      disabled={loading}
                      className="btn-unsubscribe"
                    >
                      {loading ? 'Processing...' : 'Unsubscribe'}
                    </button>
                  </div>
                ) : (
                  <div className="status-not-subscribed">
                    <div className="status-indicator">
                      <span className="status-icon">📢</span>
                      <span className="status-text">Not Subscribed</span>
                    </div>
                    <div className="newsletter-benefits">
                      <h4>Get exclusive access to:</h4>
                      <ul>
                        <li>🏥 Latest healthcare news</li>
                        <li>💡 Health tips and advice</li>
                        <li>📅 Appointment reminders</li>
                        <li>🔬 Medical research insights</li>
                      </ul>
                    </div>
                    <button 
                      onClick={handleSubscribe}
                      disabled={loading}
                      className="btn-subscribe"
                    >
                      {loading ? (
                        <>
                          <div className="spinner"></div>
                          Sending Confirmation...
                        </>
                      ) : (
                        'Subscribe to Newsletter'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="guest-subscription">
              <div className="login-prompt">
                <h3>Join Our Newsletter</h3>
                <p>Please login to subscribe to our healthcare newsletter and stay updated with the latest health information.</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-login"
                >
                  Login to Subscribe
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="subscription-footer">
          <p>📧 We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
