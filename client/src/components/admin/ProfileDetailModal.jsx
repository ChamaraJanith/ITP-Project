import React, { useState, useEffect } from 'react';
import { adminDashboardApi } from '../../services/adminApi.js';
import './ProfileDetailModal.css';  // 

const ProfileDetailModal = ({ isOpen, onClose, profileId, profileType }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && profileId && profileType) {
      loadProfileDetails();
    }
  }, [isOpen, profileId, profileType]);

  const loadProfileDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminDashboardApi.getProfileDetails(profileType, profileId);
      
      if (response.success) {
        setProfile(response.data);
        console.log('✅ Profile details loaded:', response.data);
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setError(error.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, data = {}) => {
    try {
      setUpdating(true);
      
      const response = await adminDashboardApi.updateProfileStatus(
        profileType, 
        profileId, 
        action, 
        data
      );
      
      if (response.success) {
        console.log('✅ Profile updated:', response.message);
        // Reload profile details
        await loadProfileDetails();
        
        // Show success message
        alert(response.message);
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>
            {profileType === 'patient' ? '👤' : '👨‍💼'} Profile Details
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile details...</p>
          </div>
        ) : error ? (
          <div className="modal-error">
            <p>⚠️ {error}</p>
            <button onClick={loadProfileDetails} className="retry-btn">
              🔄 Retry
            </button>
          </div>
        ) : profile ? (
          <div className="profile-modal-body">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar-large">
                {profileType === 'patient' ? '👤' : 
                 profile.profile.role === 'doctor' ? '👩‍⚕️' :
                 profile.profile.role === 'receptionist' ? '👩‍💼' :
                 profile.profile.role === 'financial_manager' ? '💰' : '👨‍💼'}
              </div>
              <div className="profile-basic-info">
                <h3>{profile.profile.name}</h3>
                <p>{profile.profile.email}</p>
                <div className="profile-badges">
                  <span className={`role-badge ${profile.profile.role}`}>
                    {profile.profile.role.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`status-badge ${profile.profile.accountStatus}`}>
                    {profile.profile.accountStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="profile-details-grid">
              <div className="detail-section">
                <h4>📋 Basic Information</h4>
                <div className="detail-items">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{profile.profile.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{profile.profile.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{profile.profile.type}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-text ${profile.profile.accountStatus}`}>
                      {profile.profile.accountStatus}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Registration Date:</label>
                    <span>{new Date(profile.profile.registrationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Activity:</label>
                    <span>{new Date(profile.profile.lastActivity).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Staff-specific details */}
              {profileType === 'staff' && profile.profile.employeeInfo && (
                <div className="detail-section">
                  <h4>👨‍💼 Employee Information</h4>
                  <div className="detail-items">
                    <div className="detail-item">
                      <label>Employee ID:</label>
                      <span>{profile.profile.employeeInfo.employeeId}</span>
                    </div>
                    <div className="detail-item">
                      <label>Department:</label>
                      <span>{profile.profile.employeeInfo.department}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{profile.profile.employeeInfo.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Permissions:</label>
                      <span>{profile.profile.employeeInfo.permissions?.join(', ') || 'None'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient-specific details */}
              {profileType === 'patient' && profile.profile.emailVerification && (
                <div className="detail-section">
                  <h4>📧 Email Verification</h4>
                  <div className="detail-items">
                    <div className="detail-item">
                      <label>Verified:</label>
                      <span className={profile.profile.emailVerification.isVerified ? 'verified' : 'pending'}>
                        {profile.profile.emailVerification.isVerified ? '✅ Yes' : '⏳ No'}
                      </span>
                    </div>
                    {profile.profile.emailVerification.otpExpiry && (
                      <div className="detail-item">
                        <label>OTP Expiry:</label>
                        <span>{new Date(profile.profile.emailVerification.otpExpiry).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Activity History */}
            {profile.activityHistory && profile.activityHistory.length > 0 && (
              <div className="activity-history-section">
                <h4>📅 Recent Activity</h4>
                <div className="activity-timeline">
                  {profile.activityHistory.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-timestamp">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                      <div className="activity-content">
                        <strong>{activity.action}</strong>
                        <p>{activity.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="profile-actions">
              <h4>🛠️ Available Actions</h4>
              <div className="action-buttons-grid">
                {profileType === 'patient' && (
                  <>
                    {!profile.profile.emailVerification?.isVerified && (
                      <button 
                        className="action-btn verify-btn"
                        onClick={() => handleAction('verify_email')}
                        disabled={updating}
                      >
                        ✅ Verify Email
                      </button>
                    )}
                    <button 
                      className="action-btn notification-btn"
                      onClick={() => handleAction('send_notification')}
                      disabled={updating}
                    >
                      📧 Send Notification
                    </button>
                    <button 
                      className="action-btn reset-btn"
                      onClick={() => handleAction('reset_password')}
                      disabled={updating}
                    >
                      🔑 Reset Password
                    </button>
                  </>
                )}

                {profileType === 'staff' && (
                  <>
                    <button 
                      className={`action-btn ${profile.profile.accountStatus === 'active' ? 'deactivate-btn' : 'activate-btn'}`}
                      onClick={() => handleAction('toggle_status')}
                      disabled={updating}
                    >
                      {profile.profile.accountStatus === 'active' ? '🔴 Deactivate' : '🟢 Activate'}
                    </button>
                    <button 
                      className="action-btn notification-btn"
                      onClick={() => handleAction('send_notification')}
                      disabled={updating}
                    >
                      📧 Send Notification
                    </button>
                    <button 
                      className="action-btn department-btn"
                      onClick={() => {
                        const newDept = prompt('Enter new department:', profile.profile.employeeInfo?.department);
                        if (newDept) {
                          handleAction('update_department', { department: newDept });
                        }
                      }}
                      disabled={updating}
                    >
                      🏢 Update Department
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {updating && (
          <div className="updating-overlay">
            <div className="updating-spinner">⏳</div>
            <p>Updating profile...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDetailModal;
