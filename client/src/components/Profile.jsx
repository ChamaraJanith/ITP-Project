import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const backendUrl = 'http://localhost:7000';

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setLoading(false);
    } else {
      // If no user data, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, {
        withCredentials: true
      });
      
      // Clear localStorage
      localStorage.removeItem('user');
      
      // Redirect to homepage
      navigate('/');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local data
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>No user data found. Please login.</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <h2>My Profile</h2>
          <p>Manage your account information</p>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="profile-info">
          <div className="info-group">
            <label>Full Name</label>
            <div className="info-value">{user.name}</div>
          </div>

          <div className="info-group">
            <label>Email Address</label>
            <div className="info-value">{user.email}</div>
          </div>

          <div className="info-group">
            <label>Account Status</label>
            <div className={`info-value status ${user.isAccountVerified ? 'verified' : 'pending'}`}>
              {user.isAccountVerified ? '✅ Verified' : '⏳ Pending Verification'}
            </div>
          </div>

          <div className="info-group">
            <label>User ID</label>
            <div className="info-value user-id">{user.id}</div>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="btn-primary"
            onClick={() => setMessage('✨ Profile editing coming soon!')}
          >
            Edit Profile
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
          
          <button 
            className="btn-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
