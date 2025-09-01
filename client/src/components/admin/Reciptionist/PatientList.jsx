// client/src/components/admin/Receptionist/PatientList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:7000/api/patients');
      if (response.data.success) {
        setPatients(response.data.data);
        toast.success('Patients loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handleDelete = async (id, patientName) => {
    if (window.confirm(`Are you sure you want to delete ${patientName}'s record? This action cannot be undone.`)) {
      try {
        await axios.delete(`http://localhost:7000/api/patients/${id}`);
        toast.success('Patient deleted successfully');
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast.error('Failed to delete patient');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading patients...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Patient Database</h1>
                <p className="text-gray-600">Manage and search patient records</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                📊 {filteredPatients.length} of {patients.length} patients
              </div>
              <button
                onClick={() => navigate('/receptionist/patient_registration')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                Add New Patient
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="mt-6">
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by name, ID, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medical Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {patient.patientId}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <span className="text-lg">
                          {patient.gender === 'Male' ? '👨' : patient.gender === 'Female' ? '👩' : '👤'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">📧 {patient.email}</div>
                      <div className="text-gray-500">📞 {patient.phone}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {patient.bloodGroup && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium w-fit">
                          🩸 {patient.bloodGroup}
                        </span>
                      )}
                      {patient.allergies && patient.allergies.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs w-fit">
                          ⚠️ {patient.allergies.length} allergies
                        </span>
                      )}
                      {(!patient.bloodGroup && (!patient.allergies || patient.allergies.length === 0)) && (
                        <span className="text-gray-400 text-xs">No medical data</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">{new Date(patient.registrationDate).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(patient.registrationDate).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="bg-green-100 text-green-800 p-2 rounded-lg hover:bg-green-200 transition-colors"
                      title="View QR Code"
                    >
                      <span className="text-lg">📱</span>
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/receptionist/patients/${patient._id}`)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                        title="View Details"
                      >
                        <span className="text-lg">👁️</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(patient._id, `${patient.firstName} ${patient.lastName}`)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete Patient"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                  <p className="text-gray-500 mb-4">
                    No patients match your search criteria "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No patients registered yet</h3>
                  <p className="text-gray-500 mb-4">
                    Get started by registering your first patient
                  </p>
                  <button
                    onClick={() => navigate('/receptionist/patient_registration')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <span>➕</span>
                    Register First Patient
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Patient ID: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{selectedPatient.patientId}</span>
              </p>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <img
                  src={selectedPatient.qrCodeData}
                  alt="Patient QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              <div className="space-y-3">
                <a
                  href={selectedPatient.qrCodeData}
                  download={`patient_${selectedPatient.patientId}_qr.png`}
                  className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Download QR Code
                </a>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPatient.patientId);
                    toast.success('Patient ID copied to clipboard!');
                  }}
                  className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📋 Copy Patient ID
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/receptionist/patients/${selectedPatient._id}`)}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    👁️ View Details
                  </button>
                  
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    ✖️ Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
