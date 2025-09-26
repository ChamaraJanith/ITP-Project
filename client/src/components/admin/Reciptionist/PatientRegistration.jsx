// client/src/components/admin/Receptionist/PatientRegistration.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PatientRegistration.css';

const PatientRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeError, setQrCodeError] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  // Validate QR code format
  const validateQRCode = (qrData) => {
    if (!qrData) return false;
    return (
      qrData.startsWith('data:image/') || 
      qrData.startsWith('http://') || 
      qrData.startsWith('https://') ||
      qrData.startsWith('/') // For relative URLs
    );
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setQrCodeError(false);
    
    try {
      // Convert date string to Date object
      data.dateOfBirth = new Date(data.dateOfBirth);
      
      // Handle allergies and medical history as arrays
      data.allergies = data.allergies ? data.allergies.split(',').map(item => item.trim()) : [];
      data.medicalHistory = data.medicalHistory ? data.medicalHistory.split(',').map(item => item.trim()) : [];

      console.log('Sending registration data:', data);

      const response = await axios.post('http://localhost:7000/api/patients/register', data);
      
      // Debug logging
      console.log('Full API Response:', response);
      console.log('Response Data:', response.data);
      console.log('Response Success:', response.data.success);
      console.log('Response Structure:', {
        hasData: !!response.data.data,
        hasPatient: !!response.data.data?.patient,
        hasQRCode: !!response.data.data?.qrCode,
        directPatient: !!response.data.patient,
        directQRCode: !!response.data.qrCode
      });
      
      if (response.data.success) {
        // Handle multiple possible response structures
        let patientData = null;
        let qrCodeData = null;

        // Try different response structures
        if (response.data.data) {
          patientData = response.data.data.patient || response.data.data;
          qrCodeData = response.data.data.qrCode || response.data.data.qrCodeData;
        } else {
          patientData = response.data.patient;
          qrCodeData = response.data.qrCode || response.data.qrCodeData;
        }

        console.log('Extracted Patient Data:', patientData);
        console.log('Extracted QR Code Data:', qrCodeData);
        console.log('QR Code Type:', typeof qrCodeData);
        console.log('QR Code Length:', qrCodeData?.length);

        if (patientData) {
          setRegisteredPatient(patientData);
          
          // Validate and set QR code
          if (validateQRCode(qrCodeData)) {
            setQrCodeData(qrCodeData);
            console.log('QR Code set successfully');
          } else {
            console.error('Invalid or missing QR code:', qrCodeData);
            setQrCodeError(true);
            
            // Try to generate a fallback QR code or show error
            if (patientData.patientId) {
              console.log('Patient ID available for QR generation:', patientData.patientId);
              // You could call a separate QR generation endpoint here
            }
          }
          
          toast.success('Patient registered successfully!');
          reset();
        } else {
          console.error('No patient data in response');
          toast.error('Registration failed - no patient data received');
        }
      } else {
        console.error('API returned success: false');
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 400) {
        toast.error('Invalid data provided');
      } else if (error.response?.status === 500) {
        toast.error('Server error - please try again');
      } else {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRegistration = () => {
    setRegisteredPatient(null);
    setQrCodeData('');
    setQrCodeError(false);
  };

  const handleBackToDashboard = () => {
    navigate('/admin/receptionist/');
  };

  // QR Code regeneration function
  const handleRegenerateQR = async () => {
    if (!registeredPatient?.patientId) return;
    
    try {
      const response = await axios.post(`http://localhost:7000/api/patients/${registeredPatient._id}/generate-qr`);
      if (response.data.success && response.data.qrCode) {
        setQrCodeData(response.data.qrCode);
        setQrCodeError(false);
        toast.success('QR Code regenerated successfully!');
      }
    } catch (error) {
      console.error('QR regeneration failed:', error);
      toast.error('Failed to regenerate QR code');
    }
  };

  if (registeredPatient) {
    return (
      <div className="registration-success-container">
        {/* Back to Dashboard Button */}
        <div className="back-to-dashboard-container">
          <button
            onClick={handleBackToDashboard}
            className="back-to-dashboard-btn"
          >
            <span className="back-icon">🏠</span>
            Back to Dashboard
          </button>
        </div>

        <div className="registration-success-header">
          <div className="success-icon-container">
            <span className="success-icon">✅</span>
          </div>
          <h2 className="success-title">Registration Successful!</h2>
          <p className="success-subtitle">Patient has been registered with unique ID and QR code</p>
        </div>

        <div className="success-content-grid">
          {/* Patient Information */}
          <div className="patient-details-card">
            <h3 className="details-card-title">
              <span className="details-icon">👤</span>
              Patient Information
            </h3>
            <div className="patient-info-list">
              <div className="info-item">
                <span className="info-label">Patient ID:</span>
                <span className="patient-id-display">
                  {registeredPatient.patientId}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{registeredPatient.firstName} {registeredPatient.lastName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{registeredPatient.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{registeredPatient.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Blood Group:</span>
                <span className="info-value">{registeredPatient.bloodGroup || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Registration Date:</span>
                <span className="info-value">{new Date(registeredPatient.registrationDate || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="qr-code-display-card">
            <h3 className="qr-card-title">
              <span className="qr-icon">📱</span>
              Patient QR Code
            </h3>
            <div className="qr-code-wrapper">
              {qrCodeData && !qrCodeError ? (
                <img 
                  src={qrCodeData} 
                  alt="Patient QR Code" 
                  className="qr-code-success-image"
                  onError={() => {
                    console.error('QR Code image failed to load');
                    setQrCodeError(true);
                  }}
                />
              ) : (
                <div className="qr-code-error-state">
                  <div className="qr-error-content">
                    <span className="qr-error-icon">
                      {qrCodeError ? '❌' : '⏳'}
                    </span>
                    <p className="qr-error-text">
                      {qrCodeError ? 'QR Code generation failed' : 'Generating QR Code...'}
                    </p>
                    {qrCodeError && (
                      <button
                        onClick={handleRegenerateQR}
                        className="qr-retry-button"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="qr-action-buttons">
              {qrCodeData && !qrCodeError && (
                <a
                  href={qrCodeData}
                  download={`patient_${registeredPatient.patientId}_qr.png`}
                  className="qr-download-btn"
                >
                  <span className="btn-icon">💾</span>
                  Download QR Code
                </a>
              )}
              
              {qrCodeError && (
                <button
                  onClick={handleRegenerateQR}
                  className="qr-regenerate-btn"
                >
                  <span className="btn-icon">🔄</span>
                  Regenerate QR Code
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="success-footer-actions">
          <div className="success-action-buttons">
            <button
              onClick={handleNewRegistration}
              className="new-registration-btn"
            >
              <span className="btn-icon">➕</span>
              Register Another Patient
            </button>
            <button
              onClick={handleBackToDashboard}
              className="success-dashboard-btn"
            >
              <span className="btn-icon">🏠</span>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Debug Information (Remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info-container">
            <details className="debug-details">
              <summary className="debug-summary">Debug Info (Dev Only)</summary>
              <div className="debug-content">
                <p className="debug-item"><strong>Patient ID:</strong> {registeredPatient.patientId}</p>
                <p className="debug-item"><strong>QR Code Available:</strong> {qrCodeData ? 'Yes' : 'No'}</p>
                <p className="debug-item"><strong>QR Code Error:</strong> {qrCodeError ? 'Yes' : 'No'}</p>
                <p className="debug-item"><strong>QR Code Type:</strong> {typeof qrCodeData}</p>
                <p className="debug-item"><strong>QR Code Length:</strong> {qrCodeData?.length || 0}</p>
                <p className="debug-item"><strong>QR Code Preview:</strong> {qrCodeData?.substring(0, 50)}...</p>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="patient-registration-container">
      {/* Back to Dashboard Button */}
      <div className="back-to-dashboard-container">
        <button
          onClick={handleBackToDashboard}
          className="back-to-dashboard-btn"
        >
          <span className="back-icon">🏠</span>
          Back to Dashboard
        </button>
      </div>

      <div className="registration-header">
        <div className="registration-icon-container">
          <span className="registration-icon">👤</span>
        </div>
        <h1 className="registration-main-title">Patient Registration</h1>
        <p className="registration-subtitle">Register a new patient and generate unique QR code</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="registration-form">
        {/* Personal Information */}
        <div className="form-section personal-info-section">
          <h2 className="section-title">
            <span className="section-icon">👤</span>
            Personal Information
          </h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">
                First Name *
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="form-input"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="field-error">{errors.firstName.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                Last Name *
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="form-input"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="field-error">{errors.lastName.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                Email *
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="form-input"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                Phone Number *
              </label>
              <input
                {...register('phone', { required: 'Phone number is required' })}
                className="form-input"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="field-error">{errors.phone.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                Date of Birth *
              </label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className="form-input date-input"
              />
              {errors.dateOfBirth && (
                <p className="field-error">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                Gender *
              </label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="form-select"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="field-error">{errors.gender.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="form-section medical-info-section">
          <h2 className="section-title">
            <span className="section-icon">🩺</span>
            Medical Information
          </h2>
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">
                Blood Group
              </label>
              <select
                {...register('bloodGroup')}
                className="form-select"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-field">
              <label className="field-label">
                Allergies
              </label>
              <input
                {...register('allergies')}
                className="form-input"
                placeholder="Enter allergies (comma separated)"
              />
            </div>

            <div className="form-field form-field-full">
              <label className="field-label">
                Medical History
              </label>
              <textarea
                {...register('medicalHistory')}
                rows={3}
                className="form-textarea"
                placeholder="Enter medical history (comma separated)"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="form-section emergency-contact-section">
          <h2 className="section-title">
            <span className="section-icon">📞</span>
            Emergency Contact
          </h2>
          <div className="emergency-contact-grid">
            <div className="form-field">
              <label className="field-label">
                Contact Name
              </label>
              <input
                {...register('emergencyContact.name')}
                className="form-input"
                placeholder="Enter contact name"
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Contact Phone
              </label>
              <input
                {...register('emergencyContact.phone')}
                className="form-input"
                placeholder="Enter contact phone"
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Relationship
              </label>
              <input
                {...register('emergencyContact.relationship')}
                className="form-input"
                placeholder="e.g., Spouse, Parent"
              />
            </div>
          </div>
        </div>

        <div className="form-submit-container">
          <button
            type="submit"
            disabled={isLoading}
            className={`registration-submit-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Registering...
              </>
            ) : (
              <>
                <span className="submit-icon">👤</span>
                Register Patient & Generate QR
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;
