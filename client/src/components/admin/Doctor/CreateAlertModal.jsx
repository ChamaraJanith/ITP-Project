// components/CreateAlertModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, User, AlertTriangle, MapPin, Activity } from 'lucide-react';
import './CreateAlertModal.css';


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

  // Input validation functions
  const validateLocation = (value) => {
    // Only alphabetical, numerical, spaces, hyphens, and commas allowed
    const locationRegex = /^[a-zA-Z0-9\s\-,]*$/;
    return locationRegex.test(value);
  };

  const validateDescription = (value) => {
    // Only alphabetical characters and spaces allowed, max 100 characters
    const descriptionRegex = /^[a-zA-Z\s]*$/;
    return descriptionRegex.test(value) && value.length <= 100;
  };

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

  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Apply validation based on field name
    if (name === 'location') {
      if (!validateLocation(value)) {
        return; // Don't update state if validation fails
      }
    } else if (name === 'description') {
      if (!validateDescription(value)) {
        return; // Don't update state if validation fails
      }
    }

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
      } else if (parent === 'vitalSigns') {
        setFormData(prev => ({
          ...prev,
          vitalSigns: {
            ...prev.vitalSigns,
            [child]: value
          }
        }));
      }
    } else {
      // Check if this is a vital signs field
      const vitalSignsFields = ['heartRate', 'temperature', 'oxygenSaturation', 'respiratoryRate', 'bloodSugar'];
      if (vitalSignsFields.includes(name)) {
        setFormData(prev => ({
          ...prev,
          vitalSigns: {
            ...prev.vitalSigns,
            [name]: value
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
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
    <div className="eap-modal-overlay">
      <div className="eap-modal eap-modal-lg">
        {/* Header */}
        <div className="eap-modal-header eap-modal-header-red">
          <div className="eap-modal-title-wrap">
            <div className="eap-modal-title-with-icon">
              <AlertTriangle className="eap-modal-title-icon eap-icon-red" size={24} />
              <h2 className="eap-modal-title">Create Emergency Alert</h2>
            </div>
            <button
              onClick={onClose}
              className="eap-modal-close"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="eap-modal-form">
          {/* Patient Selection */}
          <div className="eap-form-group">
            <label className="eap-form-label">
              Select Patient *
            </label>
            <div className="eap-search-container">
              <div className="eap-search-input-wrapper">
                <Search className="eap-search-icon" size={20} />
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
                  className={`eap-form-input eap-search-input ${errors.patient ? 'eap-input-error' : ''}`}
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="eap-search-results">
                  {searchResults.map(patient => (
                    <div
                      key={patient._id || patient.patientId}
                      onClick={() => handlePatientSelect(patient)}
                      className="eap-search-result-item"
                    >
                      <div className="eap-patient-result">
                        <User className="eap-result-icon" size={20} />
                        <div className="eap-result-info">
                          <p className="eap-result-name">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="eap-result-details">
                            ID: {patient.patientId} | {patient.phone} | {patient.gender}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="eap-search-loading">
                  <div className="eap-spinner"></div>
                </div>
              )}
            </div>
            {errors.patient && <p className="eap-error-message">{errors.patient}</p>}

            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="eap-selected-patient">
                <p className="eap-selected-name">
                  Selected: {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="eap-selected-details">
                  ID: {selectedPatient.patientId} | Phone: {selectedPatient.phone} | 
                  Gender: {selectedPatient.gender} | Blood Group: {selectedPatient.bloodGroup || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Alert Type and Priority */}
          <div className="eap-form-row">
            <div className="eap-form-col">
              <label className="eap-form-label">Alert Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="eap-form-select"
              >
                <option value="Critical">🔴 Critical - Life threatening</option>
                <option value="Urgent">🟠 Urgent - Needs immediate attention</option>
                <option value="Non-urgent">🔵 Non-urgent - Can wait</option>
              </select>
            </div>

            <div className="eap-form-col">
              <label className="eap-form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="eap-form-select"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Location with Validation */}
          <div className="eap-form-group">
            <label className="eap-form-label">
              Location *
            </label>
            <div className="eap-input-with-icon">
              <MapPin className="eap-input-icon" size={20} />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Emergency Room - Bed 3, ICU Room 205, Ward A..."
                className={`eap-form-input ${errors.location ? 'eap-input-error' : ''}`}
              />
            </div>
            <div className="eap-input-help">
              <small className="eap-input-hint">
                📍 Preview: {formData.location || 'Enter location (letters, numbers, spaces, hyphens, commas only)'}
              </small>
            </div>
            {errors.location && <p className="eap-error-message">{errors.location}</p>}
          </div>

          {/* Description with Validation */}
          <div className="eap-form-group">
            <label className="eap-form-label">
              Description * ({formData.description.length}/100 characters)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe the emergency situation and symptoms observed..."
              className={`eap-form-textarea ${errors.description ? 'eap-input-error' : ''}`}
            />
            <div className="eap-input-help">
              <small className={`eap-input-hint ${formData.description.length > 90 ? 'eap-char-warning' : ''}`}>
                ✍️ Preview: {formData.description || 'Enter description (letters and spaces only, max 100 characters)'}
              </small>
            </div>
            {errors.description && <p className="eap-error-message">{errors.description}</p>}
          </div>

          {/* Symptoms */}
          <div className="eap-form-group">
            <label className="eap-form-label">Symptoms</label>

            {/* Add Custom Symptom */}
            <div className="eap-symptom-input-group">
              <input
                type="text"
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                placeholder="Add custom symptom..."
                className="eap-form-input eap-symptom-input"
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
                className="eap-btn eap-btn-primary eap-symptom-add-btn"
              >
                Add
              </button>
            </div>

            {/* Common Symptoms */}
            <div className="eap-common-symptoms">
              <p className="eap-section-subtitle">Quick add common symptoms:</p>
              <div className="eap-symptom-tags">
                {commonSymptoms.map(symptom => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => addSymptom(symptom)}
                    disabled={formData.symptoms.includes(symptom)}
                    className={`eap-symptom-tag ${formData.symptoms.includes(symptom) ? 'eap-symptom-disabled' : ''}`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Symptoms */}
            {formData.symptoms.length > 0 && (
              <div className="eap-selected-symptoms">
                <p className="eap-section-subtitle">Selected symptoms:</p>
                <div className="eap-symptom-list">
                  {formData.symptoms.map(symptom => (
                    <span
                      key={symptom}
                      className="eap-selected-symptom-tag"
                    >
                      {symptom}
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom)}
                        className="eap-symptom-remove"
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
          <div className="eap-form-group">
            <label className="eap-form-label eap-label-with-icon">
              <Activity className="eap-label-icon" size={16} />
              Vital Signs (Optional)
            </label>
            <div className="eap-vitals-grid">
              {/* Blood Pressure */}
              <div className="eap-vital-input-group">
                <label className="eap-vital-label">Blood Pressure</label>
                <div className="eap-bp-inputs">
                  <input
                    type="number"
                    name="bloodPressure.systolic"
                    value={formData.vitalSigns.bloodPressure.systolic}
                    onChange={handleInputChange}
                    placeholder="Systolic"
                    className="eap-form-input eap-bp-input"
                  />
                  <span className="eap-bp-separator">/</span>
                  <input
                    type="number"
                    name="bloodPressure.diastolic"
                    value={formData.vitalSigns.bloodPressure.diastolic}
                    onChange={handleInputChange}
                    placeholder="Diastolic"
                    className="eap-form-input eap-bp-input"
                  />
                </div>
              </div>

              {/* Heart Rate */}
              <div className="eap-vital-input-group">
                <label className="eap-vital-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  name="heartRate"
                  value={formData.vitalSigns.heartRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 80"
                  className="eap-form-input"
                />
              </div>

              {/* Temperature */}
              <div className="eap-vital-input-group">
                <label className="eap-vital-label">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.vitalSigns.temperature}
                  onChange={handleInputChange}
                  placeholder="e.g., 98.6"
                  className="eap-form-input"
                />
              </div>

              {/* Oxygen Saturation */}
              <div className="eap-vital-input-group">
                <label className="eap-vital-label">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="oxygenSaturation"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={handleInputChange}
                  placeholder="e.g., 98"
                  className="eap-form-input"
                />
              </div>

              {/* Respiratory Rate */}
              <div className="eap-vital-input-group">
                <label className="eap-vital-label">Respiratory Rate</label>
                <input
                  type="number"
                  name="respiratoryRate"
                  value={formData.vitalSigns.respiratoryRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 16"
                  className="eap-form-input"
                />
              </div>

              {/* Blood Sugar */}
              <div className="eap-vital-input-group">
                <label className="eap-vital-label">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  name="bloodSugar"
                  value={formData.vitalSigns.bloodSugar}
                  onChange={handleInputChange}
                  placeholder="e.g., 120"
                  className="eap-form-input"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="eap-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="eap-btn eap-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="eap-btn eap-btn-primary eap-btn-alert"
            >
              <AlertTriangle className="eap-btn-icon" size={20} />
              Create Emergency Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;
