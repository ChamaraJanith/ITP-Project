// client/src/components/admin/Receptionist/PatientRegistration.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';

const PatientRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeError, setQrCodeError] = useState(false);

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
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600">Patient has been registered with unique ID and QR code</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Patient Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-blue-600">Patient ID:</span>
                <span className="ml-2 font-mono bg-blue-100 px-2 py-1 rounded">
                  {registeredPatient.patientId}
                </span>
              </div>
              <div>
                <span className="font-medium">Name:</span>
                <span className="ml-2">{registeredPatient.firstName} {registeredPatient.lastName}</span>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <span className="ml-2">{registeredPatient.email}</span>
              </div>
              <div>
                <span className="font-medium">Phone:</span>
                <span className="ml-2">{registeredPatient.phone}</span>
              </div>
              <div>
                <span className="font-medium">Blood Group:</span>
                <span className="ml-2">{registeredPatient.bloodGroup || 'Not specified'}</span>
              </div>
              <div>
                <span className="font-medium">Registration Date:</span>
                <span className="ml-2">{new Date(registeredPatient.registrationDate || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
              <span className="mr-2">📱</span>
              Patient QR Code
            </h3>
            <div className="bg-white p-4 rounded-lg inline-block">
              {qrCodeData && !qrCodeError ? (
                <img 
                  src={qrCodeData} 
                  alt="Patient QR Code" 
                  className="w-48 h-48"
                  onError={() => {
                    console.error('QR Code image failed to load');
                    setQrCodeError(true);
                  }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">
                      {qrCodeError ? '❌' : '⏳'}
                    </span>
                    <p className="text-sm">
                      {qrCodeError ? 'QR Code generation failed' : 'Generating QR Code...'}
                    </p>
                    {qrCodeError && (
                      <button
                        onClick={handleRegenerateQR}
                        className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 space-y-2">
              {qrCodeData && !qrCodeError && (
                <a
                  href={qrCodeData}
                  download={`patient_${registeredPatient.patientId}_qr.png`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="mr-2">💾</span>
                  Download QR Code
                </a>
              )}
              
              {qrCodeError && (
                <button
                  onClick={handleRegenerateQR}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <span className="mr-2">🔄</span>
                  Regenerate QR Code
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleNewRegistration}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Register Another Patient
          </button>
        </div>

        {/* Debug Information (Remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
            <details>
              <summary className="cursor-pointer font-medium">Debug Info (Dev Only)</summary>
              <div className="mt-2 space-y-1">
                <p><strong>Patient ID:</strong> {registeredPatient.patientId}</p>
                <p><strong>QR Code Available:</strong> {qrCodeData ? 'Yes' : 'No'}</p>
                <p><strong>QR Code Error:</strong> {qrCodeError ? 'Yes' : 'No'}</p>
                <p><strong>QR Code Type:</strong> {typeof qrCodeData}</p>
                <p><strong>QR Code Length:</strong> {qrCodeData?.length || 0}</p>
                <p><strong>QR Code Preview:</strong> {qrCodeData?.substring(0, 50)}...</p>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👤</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Registration</h1>
        <p className="text-gray-600">Register a new patient and generate unique QR code</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">👤</span>
            Personal Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                {...register('phone', { required: 'Phone number is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🩺</span>
            Medical Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <select
                {...register('bloodGroup')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <input
                {...register('allergies')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter allergies (comma separated)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical History
              </label>
              <textarea
                {...register('medicalHistory')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter medical history (comma separated)"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📞</span>
            Emergency Contact
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                {...register('emergencyContact.name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                {...register('emergencyContact.phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <input
                {...register('emergencyContact.relationship')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Spouse, Parent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registering...
              </>
            ) : (
              <>
                <span className="mr-2">👤</span>
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
