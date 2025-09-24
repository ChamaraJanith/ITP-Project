import React, { useState, useEffect } from 'react';
import { X, Search, User, AlertTriangle, MapPin, Activity } from 'lucide-react';

const CreateAlertModal = ({ isOpen, onClose, onSubmit, doctorInfo }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'Non-urgent',
    priority: 'Medium',
    description: '',
    location: '',
    symptoms: [],
    vitalSigns: {
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      respiratoryRate: '',
      bloodSugar: ''
    }
  });
  
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentSymptom, setCurrentSymptom] = useState('');

  // Common symptoms for quick selection
  const commonSymptoms = [
    'Chest pain', 'Shortness of breath', 'Dizziness', 'Nausea', 'Vomiting',
    'Fever', 'Headache', 'Abdominal pain', 'Back pain', 'Weakness',
    'Confusion', 'Rapid heartbeat', 'Low blood pressure', 'High blood pressure'
  ];

  // Search patients
  const searchPatients = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:7000/api/patients?search=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient._id || patient.patientId
    }));
    setSearchResults([]);
    setSearchTerm(`${patient.firstName} ${patient.lastName}`);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'bloodPressure') {
        setFormData(prev => ({
          ...prev,
          vitalSigns: {
            ...prev.vitalSigns,
            bloodPressure: {
              ...prev.vitalSigns.bloodPressure,
              [child]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          vitalSigns: {
            ...prev.vitalSigns,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add symptom
  const addSymptom = (symptom) => {
    if (symptom && !formData.symptoms.includes(symptom)) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptom]
      }));
    }
    setCurrentSymptom('');
  };

  // Remove symptom
  const removeSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedPatient) newErrors.patient = 'Please select a patient';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Clean up vital signs data
    const cleanedVitalSigns = {};
    Object.keys(formData.vitalSigns).forEach(key => {
      if (key === 'bloodPressure') {
        if (formData.vitalSigns.bloodPressure.systolic || formData.vitalSigns.bloodPressure.diastolic) {
          cleanedVitalSigns.bloodPressure = {
            systolic: parseInt(formData.vitalSigns.bloodPressure.systolic) || 0,
            diastolic: parseInt(formData.vitalSigns.bloodPressure.diastolic) || 0
          };
        }
      } else if (formData.vitalSigns[key]) {
        cleanedVitalSigns[key] = parseFloat(formData.vitalSigns[key]);
      }
    });

    const alertData = {
      ...formData,
      vitalSigns: cleanedVitalSigns,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      patientEmail: selectedPatient.email,
      patientPhone: selectedPatient.phone,
      patientGender: selectedPatient.gender,
      patientBloodGroup: selectedPatient.bloodGroup
    };

    onSubmit(alertData);
    
    // Reset form
    setFormData({
      patientId: '',
      type: 'Non-urgent',
      priority: 'Medium',
      description: '',
      location: '',
      symptoms: [],
      vitalSigns: {
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        bloodSugar: ''
      }
    });
    setSelectedPatient(null);
    setSearchTerm('');
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-red-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="text-red-600 mr-3" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Create Emergency Alert</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient *
            </label>
            <div className="relative">
              <div className="flex">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value.trim()) {
                      setSelectedPatient(null);
                      setFormData(prev => ({ ...prev, patientId: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.patient ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map(patient => (
                    <div
                      key={patient._id || patient.patientId}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="flex items-center">
                        <User className="text-gray-400 mr-3" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {patient.patientId} | {patient.phone} | {patient.gender}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                </div>
              )}
            </div>
            {errors.patient && <p className="mt-1 text-sm text-red-600">{errors.patient}</p>}
            
            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">
                  Selected: {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-green-600">
                  ID: {selectedPatient.patientId} | Phone: {selectedPatient.phone} | 
                  Gender: {selectedPatient.gender} | Blood Group: {selectedPatient.bloodGroup || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Alert Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Critical">🔴 Critical - Life threatening</option>
                <option value="Urgent">🟠 Urgent - Needs immediate attention</option>
                <option value="Non-urgent">🔵 Non-urgent - Can wait</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Emergency Room - Bed 3, ICU Room 205, Ward A..."
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe the emergency situation, symptoms observed, and any immediate actions needed..."
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
            
            {/* Add Custom Symptom */}
            <div className="flex mb-3">
              <input
                type="text"
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                placeholder="Add custom symptom..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSymptom(currentSymptom);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addSymptom(currentSymptom)}
                className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Common Symptoms */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Quick add common symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map(symptom => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => addSymptom(symptom)}
                    disabled={formData.symptoms.includes(symptom)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      formData.symptoms.includes(symptom)
                        ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-300'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Symptoms */}
            {formData.symptoms.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Selected symptoms:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.symptoms.map(symptom => (
                    <span
                      key={symptom}
                      className="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full"
                    >
                      {symptom}
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vital Signs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Activity className="inline mr-2" size={16} />
              Vital Signs (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Blood Pressure */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Blood Pressure</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="bloodPressure.systolic"
                    value={formData.vitalSigns.bloodPressure.systolic}
                    onChange={handleInputChange}
                    placeholder="Systolic"
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                  />
                  <span className="self-center text-gray-500">/</span>
                  <input
                    type="number"
                    name="bloodPressure.diastolic"
                    value={formData.vitalSigns.bloodPressure.diastolic}
                    onChange={handleInputChange}
                    placeholder="Diastolic"
                    className="w-1/2 px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Heart Rate */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 80"
                  className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleInputChange}
                  placeholder="e.g., 98.6"
                  className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Oxygen Saturation */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="oxygenSaturation"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={handleInputChange}
                  placeholder="e.g., 98"
                  className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Respiratory Rate */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Respiratory Rate</label>
                <input
                  type="number"
                  name="respiratoryRate"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 16"
                  className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                />
              </div>

              {/* Blood Sugar */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  name="bloodSugar"
                  value={formData.vitalSigns.bloodSugar}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <AlertTriangle className="mr-2" size={20} />
              Create Emergency Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;