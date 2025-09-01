// client/src/components/admin/Receptionist/PatientDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:7000/api/patients/${id}`);
      if (response.data.success) {
        setPatient(response.data.data);
        toast.success('Patient details loaded successfully');
      } else {
        toast.error('Patient not found');
        navigate('/receptionist/patients');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Failed to fetch patient details');
      navigate('/receptionist/patients');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleCopyPatientId = () => {
    navigator.clipboard.writeText(patient.patientId);
    toast.success('Patient ID copied to clipboard!');
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}'s record? This action cannot be undone.`)) {
      try {
        await axios.delete(`http://localhost:7000/api/patients/${id}`);
        toast.success('Patient deleted successfully');
        navigate('/receptionist/patients');
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error('Failed to delete patient');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading patient details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Not Found</h2>
          <p className="text-gray-600 mb-6">The patient you're looking for doesn't exist or may have been deleted.</p>
          <button
            onClick={() => navigate('/receptionist/patients')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Patient List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">
                  {patient.gender === 'Male' ? '👨' : patient.gender === 'Female' ? '👩' : '👤'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {patient.patientId}
                  </span>
                  • {patient.gender} • {calculateAge(patient.dateOfBirth)} years old
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/receptionist/patients')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <span>←</span>
                Back to List
              </button>
              
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span>🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information Card */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span>👤</span>
                Personal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <span>📧</span>
                      <a href={`mailto:${patient.email}`} className="text-blue-600 hover:underline">
                        {patient.email}
                      </a>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <span>📞</span>
                      <a href={`tel:${patient.phone}`} className="text-blue-600 hover:underline">
                        {patient.phone}
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <span>📅</span>
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                      <span className="text-sm text-gray-500">({calculateAge(patient.dateOfBirth)} years old)</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <span>{patient.gender === 'Male' ? '♂️' : patient.gender === 'Female' ? '♀️' : '⚧️'}</span>
                      {patient.gender}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Registration Date</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <span>📋</span>
                      {new Date(patient.registrationDate).toLocaleDateString()}
                      <span className="text-sm text-gray-500">
                        at {new Date(patient.registrationDate).toLocaleTimeString()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information Card */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span>🩺</span>
                Medical Information
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Blood Group</label>
                  {patient.bloodGroup ? (
                    <span className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-lg font-semibold">
                      🩸 {patient.bloodGroup}
                    </span>
                  ) : (
                    <p className="text-gray-500 italic">Not specified</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Allergies</label>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          ⚠️ {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No known allergies</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Medical History</label>
                  {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                    <div className="space-y-2">
                      {patient.medicalHistory.map((history, index) => (
                        <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <p className="text-blue-800">{history}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No medical history recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          {(patient.emergencyContact && (patient.emergencyContact.name || patient.emergencyContact.phone)) && (
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>🚨</span>
                  Emergency Contact
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {patient.emergencyContact.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                      <p className="text-gray-900">{patient.emergencyContact.name}</p>
                    </div>
                  )}
                  
                  {patient.emergencyContact.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                      <p className="text-gray-900 flex items-center gap-2">
                        <span>📞</span>
                        <a href={`tel:${patient.emergencyContact.phone}`} className="text-blue-600 hover:underline">
                          {patient.emergencyContact.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {patient.emergencyContact.relationship && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Relationship</label>
                      <p className="text-gray-900">{patient.emergencyContact.relationship}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - QR Code and Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg sticky top-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span>📱</span>
                Patient QR Code
              </h2>
            </div>
            
            <div className="p-6 text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <img src={patient.qrCodeData} alt="Patient QR Code" className="w-full max-w-64 mx-auto" />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔍</span>
                  View Fullscreen
                </button>
                
                <a
                  href={patient.qrCodeData}
                  download={`patient_${patient.patientId}_qr.png`}
                  className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
                >
                  <span className="mr-2">💾</span>
                  Download QR Code
                </a>
                
                <button
                  onClick={handleCopyPatientId}
                  className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📋</span>
                  Copy Patient ID
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  Print Patient Card
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </p>
                  <p><strong>Patient ID:</strong> {patient.patientId}</p>
                  <p><strong>Registered:</strong> {new Date(patient.registrationDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">QR Code - {patient.firstName} {patient.lastName}</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg mb-4">
                <img
                  src={patient.qrCodeData}
                  alt="Patient QR Code"
                  className="w-full max-w-80 mx-auto"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Patient ID: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{patient.patientId}</span>
              </p>
              
              <div className="flex gap-2">
                <a
                  href={patient.qrCodeData}
                  download={`patient_${patient.patientId}_qr.png`}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  💾 Download
                </a>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;
