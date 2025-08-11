import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isSubscribed: false,
    subscribedAt: null,
    unsubscribedAt: null
  });
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0
  });

  const backendUrl = 'http://localhost:7000';

  // ✅ Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadUserData(JSON.parse(userData));
    } else {
      navigate('/login');
    }

    // ✅ Enhanced subscription confirmation handling for mobile
    const subscribed = searchParams.get('subscribed');
    const subscriptionError = searchParams.get('subscription_error');
    const alreadySubscribed = searchParams.get('already_subscribed');
    const errorType = searchParams.get('error');
    const timestamp = searchParams.get('timestamp');
    
    if (subscribed === 'true') {
      setMessage('🎉 Subscription confirmed! You are now a premium newsletter subscriber with exclusive benefits!');
      
      // ✅ Enhanced animation for mobile and desktop
      setTimeout(() => {
        const subscriberBadge = document.querySelector('.subscription-badge.subscribed');
        if (subscriberBadge) {
          subscriberBadge.classList.add('just-subscribed');
          setTimeout(() => {
            subscriberBadge.classList.remove('just-subscribed');
          }, 2000);
        }

        // Add crown glow effect
        const crown = document.querySelector('.subscriber-crown');
        if (crown) {
          crown.style.animation = 'crownCelebration 1.5s ease-out';
        }
      }, 500);
      
      // Refresh subscription status
      setTimeout(() => {
        refreshSubscriptionStatus();
      }, 1000);

      // ✅ Mobile-specific celebration
      if (isMobile) {
        // Vibrate on mobile if supported
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        
        // Show mobile-specific toast
        showMobileToast('🎉 Premium Subscriber Activated!', 'success');
      }
    }
    
    if (alreadySubscribed === 'true') {
      setMessage('ℹ️ You are already a premium newsletter subscriber!');
      if (isMobile) {
        showMobileToast('ℹ️ Already Subscribed', 'info');
      }
    }
    
    if (subscriptionError === 'true') {
      let errorMessage = 'Subscription confirmation failed. Please try again.';
      
      switch (errorType) {
        case 'missing_token':
          errorMessage = 'Invalid confirmation link. Token is missing.';
          break;
        case 'invalid_token':
          errorMessage = 'Invalid or expired confirmation link.';
          break;
        case 'token_expired':
          errorMessage = 'Confirmation link has expired. Please request a new subscription.';
          break;
        case 'user_not_found':
          errorMessage = 'User account not found. Please register first.';
          break;
        case 'token_mismatch':
          errorMessage = 'Invalid confirmation token. Please request a new subscription.';
          break;
        case 'invalid_action':
          errorMessage = 'Invalid subscription action.';
          break;
        default:
          errorMessage = 'Subscription confirmation failed. Please try again.';
      }
      
      setMessage(`❌ ${errorMessage}`);
      
      if (isMobile) {
        showMobileToast(`❌ ${errorMessage}`, 'error');
      }
    }

    // Clean URL parameters after handling them
    if (subscribed || subscriptionError || alreadySubscribed) {
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, isMobile ? 8000 : 6000); // Longer display time on mobile
    }
  }, [navigate, searchParams, isMobile]);

  // ✅ Mobile toast notification function
  const showMobileToast = (message, type) => {
    const toast = document.createElement('div');
    toast.className = `mobile-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 15px 25px;
      border-radius: 25px;
      z-index: 9999;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: toastSlide 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 4000);
  };

  const loadUserData = async (userData) => {
    try {
      // Mock appointments data
      const mockAppointments = [
        {
          id: 1,
          doctorName: 'Dr. Sarah Johnson',
          specialty: 'Cardiology',
          date: '2025-08-15',
          time: '10:30 AM',
          status: 'confirmed',
          type: 'Consultation',
          hospital: 'City General Hospital'
        },
        {
          id: 2,
          doctorName: 'Dr. Michael Chen',
          specialty: 'Dermatology',
          date: '2025-08-12',
          time: '2:15 PM',
          status: 'completed',
          type: 'Follow-up',
          hospital: 'Metro Medical Center'
        },
        {
          id: 3,
          doctorName: 'Dr. Emily Davis',
          specialty: 'General Medicine',
          date: '2025-08-20',
          time: '11:00 AM',
          status: 'pending',
          type: 'Checkup',
          hospital: 'Health Plus Clinic'
        },
        {
          id: 4,
          doctorName: 'Dr. Robert Wilson',
          specialty: 'Orthopedics',
          date: '2025-07-28',
          time: '3:00 PM',
          status: 'cancelled',
          type: 'Consultation',
          hospital: 'Orthopedic Center'
        }
      ];

      const mockRecords = [
        {
          id: 1,
          date: '2025-08-01',
          type: 'Blood Test',
          doctor: 'Dr. Michael Chen',
          result: 'Normal',
          status: 'completed'
        },
        {
          id: 2,
          date: '2025-07-25',
          type: 'X-Ray',
          doctor: 'Dr. Sarah Johnson',
          result: 'Pending Review',
          status: 'pending'
        },
        {
          id: 3,
          date: '2025-07-15',
          type: 'MRI Scan',
          doctor: 'Dr. Robert Wilson',
          result: 'Normal',
          status: 'completed'
        }
      ];

      setAppointments(mockAppointments);
      setMedicalRecords(mockRecords);
      
      // Calculate stats
      setStats({
        totalAppointments: mockAppointments.length,
        completedAppointments: mockAppointments.filter(app => app.status === 'completed').length,
        upcomingAppointments: mockAppointments.filter(app => app.status === 'confirmed').length,
        cancelledAppointments: mockAppointments.filter(app => app.status === 'cancelled').length
      });

      // ✅ Fetch subscription status
      await refreshSubscriptionStatus();

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  // ✅ Function to refresh subscription status
  const refreshSubscriptionStatus = async () => {
    try {
      const subscriptionResponse = await axios.get(`${backendUrl}/api/subscription/status`, {
        withCredentials: true,
        timeout: isMobile ? 15000 : 10000 // Longer timeout for mobile
      });
      
      if (subscriptionResponse.data.success) {
        setSubscriptionStatus(subscriptionResponse.data.data);
        
        // Update localStorage with new subscription status
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser) {
          currentUser.isSubscribed = subscriptionResponse.data.data.isSubscribed;
          localStorage.setItem('user', JSON.stringify(currentUser));
          setUser(currentUser);
        }
      }
    } catch (subscriptionError) {
      console.error('Error fetching subscription status:', subscriptionError);
      
      if (isMobile) {
        showMobileToast('⚠️ Connection issue, please refresh', 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, {
        withCredentials: true
      });
      
      localStorage.removeItem('user');
      navigate('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const handleVerifyEmail = () => {
    setMessage('📧 Verification email sent! Please check your inbox.');
    if (isMobile) {
      showMobileToast('📧 Verification email sent!', 'success');
    }
  };

  const handleSubscriptionToggle = async () => {
    try {
      if (subscriptionStatus.isSubscribed) {
        // Unsubscribe
        const response = await axios.post(`${backendUrl}/api/subscription/unsubscribe`, {
          email: user.email
        }, {
          withCredentials: true
        });

        if (response.data.success) {
          setMessage('✅ Successfully unsubscribed from newsletter');
          setSubscriptionStatus(prev => ({
            ...prev,
            isSubscribed: false,
            unsubscribedAt: new Date()
          }));
          
          // Update localStorage
          const currentUser = JSON.parse(localStorage.getItem('user'));
          if (currentUser) {
            currentUser.isSubscribed = false;
            localStorage.setItem('user', JSON.stringify(currentUser));
            setUser(currentUser);
          }

          if (isMobile) {
            showMobileToast('✅ Unsubscribed successfully', 'success');
          }
        }
      } else {
        // Subscribe
        const response = await axios.post(`${backendUrl}/api/subscription/subscribe`, {
          email: user.email,
          name: user.name
        });

        if (response.data.success) {
          setMessage('✅ Subscription confirmation email sent! Please check your inbox and spam folder.');
          
          if (isMobile) {
            showMobileToast('📧 Confirmation email sent!', 'success');
          }
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update subscription. Please try again.';
      setMessage('❌ ' + errorMessage);
      
      if (isMobile) {
        showMobileToast('❌ ' + errorMessage, 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'completed': return '#6b7280';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile{isMobile ? ' on mobile' : ''}...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <div className="error-icon">⚠️</div>
        <h3>Access Denied</h3>
        <p>Please login to view your profile.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className={`profile-container ${isMobile ? 'mobile-optimized' : ''}`}>
      {/* ✅ Enhanced Profile Header with Subscriber Badge */}
      <div className="profile-header-section">
        <div className="profile-banner">
          <div className="profile-avatar-large">
            <span>{user.name?.charAt(0).toUpperCase()}</span>
            <div className="avatar-status"></div>
            {/* ✅ Enhanced subscriber crown overlay */}
            {subscriptionStatus.isSubscribed && (
              <div className="subscriber-crown" title="Premium Newsletter Subscriber">
                👑
              </div>
            )}
          </div>
          <div className="profile-header-info">
            <h1>Welcome back, {user.name}!</h1>
            <p>Manage your health journey with ease{isMobile ? ' on mobile' : ''}</p>
            <div className="profile-badges">
              <div className={`badge ${user.isAccountVerified ? 'verified' : 'pending'}`}>
                {user.isAccountVerified ? '✅ Verified Account' : '⏳ Pending Verification'}
              </div>
              {/* ✅ Enhanced Subscriber Badge with Premium Features */}
              <div className={`badge subscription-badge ${subscriptionStatus.isSubscribed ? 'subscribed premium' : 'not-subscribed'}`}>
                {subscriptionStatus.isSubscribed ? (
                  <span className="subscriber-content">
                    <span className="subscriber-icon">👑</span>
                    <span className="subscriber-text">Premium Subscriber</span>
                    <span className="subscriber-shine"></span>
                  </span>
                ) : (
                  '📢 Not Subscribed'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className={`stat-card ${subscriptionStatus.isSubscribed ? 'premium-highlight' : ''}`}>
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{stats.totalAppointments}</h3>
            <p>Total Appointments</p>
          </div>
        </div>
        <div className={`stat-card ${subscriptionStatus.isSubscribed ? 'premium-highlight' : ''}`}>
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.completedAppointments}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className={`stat-card ${subscriptionStatus.isSubscribed ? 'premium-highlight' : ''}`}>
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>{stats.upcomingAppointments}</h3>
            <p>Upcoming</p>
          </div>
        </div>
        <div className={`stat-card ${subscriptionStatus.isSubscribed ? 'premium-highlight' : ''}`}>
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{medicalRecords.length}</h3>
            <p>Medical Records</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-nav">
        <button 
          className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
          Profile
        </button>
        <button 
          className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <span className="tab-icon">📅</span>
          Appointments
        </button>
        <button 
          className={`nav-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <span className="tab-icon">📋</span>
          Medical Records
        </button>
        <button 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          Settings
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') || message.includes('✨') || message.includes('🎉') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' && (
          <div className="profile-info-card">
            <h2>Personal Information</h2>
            <div className="info-grid">
              <div className="info-group">
                <label>Full Name</label>
                <div className="info-value">{user.name}</div>
              </div>
              <div className="info-group">
                <label>Email Address</label>
                <div className="info-value">{user.email}</div>
              </div>
              <div className="info-group">
                <label>User ID</label>
                <div className="info-value user-id">{user.id}</div>
              </div>
              <div className="info-group">
                <label>Member Since</label>
                <div className="info-value">
                  {user.createdAt ? formatDate(user.createdAt) : 'Recently'}
                </div>
              </div>
              <div className="info-group">
                <label>Newsletter Subscription</label>
                <div className={`info-value subscription-status ${subscriptionStatus.isSubscribed ? 'subscribed premium' : 'not-subscribed'}`}>
                  {subscriptionStatus.isSubscribed ? (
                    <span>
                      👑 Premium Subscriber
                      {subscriptionStatus.subscribedAt && (
                        <small style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>
                          Since: {new Date(subscriptionStatus.subscribedAt).toLocaleDateString()}
                        </small>
                      )}
                    </span>
                  ) : (
                    <span>📢 Not Subscribed</span>
                  )}
                </div>
              </div>
              <div className="info-group">
                <label>Device Type</label>
                <div className="info-value">
                  {isMobile ? '📱 Mobile Device' : '💻 Desktop'}
                </div>
              </div>
            </div>
            
            {!user.isAccountVerified && (
              <div className="verification-prompt">
                <div className="prompt-icon">📧</div>
                <div className="prompt-content">
                  <h4>Verify Your Email</h4>
                  <p>Please verify your email address to access all features.</p>
                  <button onClick={handleVerifyEmail} className="btn-primary btn-small">
                    Send Verification Email
                  </button>
                </div>
              </div>
            )}

            {/* ✅ Enhanced Subscriber Perks Section */}
            {subscriptionStatus.isSubscribed && (
              <div className="subscriber-perks premium">
                <h3>👑 Premium Subscriber Benefits</h3>
                <div className="perks-grid">
                  <div className="perk-item premium">
                    <span className="perk-icon">📧</span>
                    <span>Weekly premium health newsletters</span>
                  </div>
                  <div className="perk-item premium">
                    <span className="perk-icon">🎯</span>
                    <span>Exclusive health tips & insights</span>
                  </div>
                  <div className="perk-item premium">
                    <span className="perk-icon">🔔</span>
                    <span>Priority notifications & alerts</span>
                  </div>
                  <div className="perk-item premium">
                    <span className="perk-icon">💎</span>
                    <span>Premium content & research access</span>
                  </div>
                  <div className="perk-item premium">
                    <span className="perk-icon">🏆</span>
                    <span>Early access to new features</span>
                  </div>
                  <div className="perk-item premium">
                    <span className="perk-icon">👨‍⚕️</span>
                    <span>Priority doctor consultations</span>
                  </div>
                </div>
                <p className="subscriber-since">
                  👑 Premium subscriber since: {subscriptionStatus.subscribedAt ? new Date(subscriptionStatus.subscribedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            )}

            <div className="subscription-management">
              <h3>Newsletter Subscription</h3>
              <p>Stay updated with the latest health news, tips, and exclusive premium content.</p>
              <div className="subscription-actions">
                <button 
                  onClick={handleSubscriptionToggle}
                  className={subscriptionStatus.isSubscribed ? "btn-danger btn-small" : "btn-primary btn-small"}
                >
                  {subscriptionStatus.isSubscribed ? 'Unsubscribe' : '👑 Subscribe to Premium Newsletter'}
                </button>
                <button 
                  onClick={() => navigate('/subscription')}
                  className="btn-secondary btn-small"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the tab content remains the same as your original code */}
        {activeTab === 'appointments' && (
          <div className="appointments-section">
            <div className="section-header">
              <h2>Appointment History {subscriptionStatus.isSubscribed ? '👑' : ''}</h2>
              <button 
                onClick={() => navigate('/book-appointment')} 
                className="btn-primary btn-small"
              >
                Book New Appointment
              </button>
            </div>
            
            <div className="appointments-list">
              {appointments.map((appointment, index) => (
                <div key={appointment.id} className={`appointment-card ${subscriptionStatus.isSubscribed ? 'premium-card' : ''}`} style={{'--i': index + 1}}>
                  <div className="appointment-header">
                    <div className="doctor-info">
                      <h4>{appointment.doctorName}</h4>
                      <p>{appointment.specialty}</p>
                    </div>
                    <div 
                      className="appointment-status"
                      style={{ backgroundColor: getStatusColor(appointment.status) }}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏰</span>
                      <span>{appointment.time}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">🏥</span>
                      <span>{appointment.hospital}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📋</span>
                      <span>{appointment.type}</span>
                    </div>
                  </div>
                  
                  <div className="appointment-actions">
                    {appointment.status === 'confirmed' && (
                      <>
                        <button className="btn-secondary btn-small">Reschedule</button>
                        <button className="btn-danger btn-small">Cancel</button>
                      </>
                    )}
                    {appointment.status === 'completed' && (
                      <>
                        <button className="btn-primary btn-small">View Report</button>
                        {subscriptionStatus.isSubscribed && (
                          <button className="btn-secondary btn-small">👑 Premium Analysis</button>
                        )}
                      </>
                    )}
                    {appointment.status === 'pending' && (
                      <button className="btn-primary btn-small">Confirm</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="records-section">
            <div className="section-header">
              <h2>Medical Records {subscriptionStatus.isSubscribed ? '👑' : ''}</h2>
              <button className="btn-primary btn-small">
                Request Records
              </button>
            </div>
            
            <div className="records-list">
              {medicalRecords.map((record, index) => (
                <div key={record.id} className={`record-card ${subscriptionStatus.isSubscribed ? 'premium-card' : ''}`} style={{'--i': index + 1}}>
                  <div className="record-header">
                    <h4>{record.type}</h4>
                    <span className={`record-status ${record.status}`}>
                      {record.status === 'completed' ? '✅' : '⏳'} {record.status}
                    </span>
                  </div>
                  
                  <div className="record-details">
                    <p><strong>Date:</strong> {formatDate(record.date)}</p>
                    <p><strong>Doctor:</strong> {record.doctor}</p>
                    <p><strong>Result:</strong> {record.result}</p>
                  </div>
                  
                  <div className="record-actions">
                    <button className="btn-primary btn-small">View Details</button>
                    {record.status === 'completed' && (
                      <>
                        <button className="btn-secondary btn-small">Download</button>
                        {subscriptionStatus.isSubscribed && (
                          <button className="btn-secondary btn-small">👑 AI Analysis</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>Account Settings {subscriptionStatus.isSubscribed ? '👑' : ''}</h2>
            
            <div className="settings-groups">
              <div className="settings-group">
                <h3>Profile Settings</h3>
                <div className="setting-item">
                  <span>Edit Profile Information</span>
                  <button className="btn-secondary btn-small">Edit</button>
                </div>
                <div className="setting-item">
                  <span>Change Password</span>
                  <button 
                    onClick={() => navigate('/forgot-password')}
                    className="btn-secondary btn-small"
                  >
                    Change
                  </button>
                </div>
              </div>
              
              <div className="settings-group">
                <h3>Notifications</h3>
                <div className="setting-item">
                  <span>Email Notifications</span>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <span>SMS Reminders</span>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <span>Newsletter Subscription {subscriptionStatus.isSubscribed ? '👑' : ''}</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={subscriptionStatus.isSubscribed}
                      onChange={handleSubscriptionToggle}
                    />
                    <span className="slider premium"></span>
                  </label>
                </div>
                {subscriptionStatus.isSubscribed && (
                  <div className="setting-item">
                    <span>👑 Premium Alerts</span>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider premium"></span>
                    </label>
                  </div>
                )}
              </div>
              
              <div className="settings-group danger-zone">
                <h3>Account Actions</h3>
                <div className="setting-item">
                  <span>Logout from all devices</span>
                  <button 
                    onClick={handleLogout}
                    className="btn-danger btn-small"
                  >
                    Logout All
                  </button>
                </div>
                <div className="setting-item">
                  <span>Delete Account</span>
                  <button className="btn-danger btn-small">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="btn-primary"
          onClick={() => navigate('/book-appointment')}
        >
          📅 Book Appointment
        </button>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/')}
        >
          🏠 Back to Home
        </button>
        <button 
          className="btn-danger"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
