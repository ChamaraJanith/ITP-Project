import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../appointments/styles/Appointment.css';


const Appointment = () => {
  const [formData, setFormData] = useState({
    // Personal Information - Empty for patient to fill
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    email: '',
    phone: '',
    bloodGroup: '',
    allergies: '',
    
    // Appointment Details
    appointmentDate: '',
    appointmentTime: '',
    doctorSpecialty: '',
    doctorName: '',
    appointmentType: 'consultation',
    symptoms: '',
    urgency: 'normal',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // Multi-step form
  const navigate = useNavigate();


  const backendUrl = 'http://localhost:7000';


  // Check if user is logged in and pre-fill some data
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          gender: userData.gender || '',
          dateOfBirth: userData.dateOfBirth || ''
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);


  // Calculate age from date of birth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  }, [formData.dateOfBirth]);


  // Validation handlers for different input types
  const handleAlphabeticalInput = (e, fieldName) => {
    const { value } = e.target;
    // Allow only letters and spaces
    const alphabeticalValue = value.replace(/[^a-zA-Z\s]/g, '');
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: alphabeticalValue
    }));
  };

  const handleNumericalInput = (e, fieldName, maxLength = null) => {
    const { value } = e.target;
    // Allow only numbers
    const numericalValue = value.replace(/[^0-9]/g, '');
    
    // Apply length restriction if specified
    const finalValue = maxLength ? numericalValue.slice(0, maxLength) : numericalValue;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: finalValue
    }));
  };

  const handleNoSpecialCharactersInput = (e, fieldName) => {
    const { value } = e.target;
    // Allow letters, numbers, spaces, and basic punctuation (.,!?-)
    const cleanValue = value.replace(/[^a-zA-Z0-9\s.,!?\-]/g, '');
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: cleanValue
    }));
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const validateStep1 = () => {
    const { name, gender, dateOfBirth, email, phone, bloodGroup } = formData;
    
    if (!name.trim()) {
      setMessage('❌ Full name is required');
      return false;
    }
    
    if (!gender) {
      setMessage('❌ Gender is required');
      return false;
    }
    
    if (!dateOfBirth) {
      setMessage('❌ Date of birth is required');
      return false;
    }
    
    if (!email.trim()) {
      setMessage('❌ Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('❌ Please enter a valid email address');
      return false;
    }
    
    if (!phone.trim()) {
      setMessage('❌ Phone number is required');
      return false;
    }
    
    if (phone.length !== 10) {
      setMessage('❌ Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (!bloodGroup) {
      setMessage('❌ Blood group is required');
      return false;
    }
    
    return true;
  };


  const validateStep2 = () => {
    const { appointmentDate, appointmentTime, doctorSpecialty, appointmentType, emergencyContactPhone } = formData;
    
    if (!appointmentDate) {
      setMessage('❌ Appointment date is required');
      return false;
    }
    
    // Check if appointment date is not in the past
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setMessage('❌ Please select a future date');
      return false;
    }
    
    if (!appointmentTime) {
      setMessage('❌ Appointment time is required');
      return false;
    }
    
    if (!doctorSpecialty) {
      setMessage('❌ Doctor specialty is required');
      return false;
    }
    
    if (!appointmentType) {
      setMessage('❌ Appointment type is required');
      return false;
    }

    // Validate emergency contact phone if provided
    if (emergencyContactPhone && emergencyContactPhone.length !== 10) {
      setMessage('❌ Emergency contact phone must be 10 digits');
      return false;
    }
    
    return true;
  };


  const handleNext = () => {
    setMessage('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };


  const handleBack = () => {
    setMessage('');
    setStep(1);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');


    if (!validateStep2()) {
      return;
    }


    setLoading(true);


    try {
      console.log('📅 Booking appointment:', formData);
      
      // Create flat data object for the backend (matching your controller)
      const appointmentData = {
        name: formData.name,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        age: parseInt(formData.age) || 0,
        email: formData.email,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies || '',
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        doctorSpecialty: formData.doctorSpecialty,
        doctorName: formData.doctorName || '',
        appointmentType: formData.appointmentType,
        symptoms: formData.symptoms || '',
        urgency: formData.urgency,
        emergencyContactName: formData.emergencyContactName || '',
        emergencyContactPhone: formData.emergencyContactPhone || '',
        emergencyContactRelationship: formData.emergencyContactRelationship || ''
      };


      const response = await axios.post(`${backendUrl}/api/appointments/book`, appointmentData);


      console.log('✅ Appointment booked:', response.data);


      if (response.data.success || response.data.appointment) {
        setMessage('✅ Appointment booked successfully! Redirecting to payment...');
        
        // Get appointment ID from response
        const appointmentId = response.data.appointment?._id || response.data._id;
        
        // Redirect to payment page after short delay
        setTimeout(() => {
          if (appointmentId) {
            navigate(`/payment/${appointmentId}`);
          } else {
            navigate('/payment/default'); // fallback
          }
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Appointment booking error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };


  const timeSlots = generateTimeSlots();


  return (
    <div className="appointment-container">
      <div className="appointment-card">
        <div className="appointment-header">
          <h2>Book Your Appointment</h2>
          <p>Schedule your healthcare consultation with our qualified doctors</p>
          
          {/* Progress indicator */}
          <div className="progress-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <small>Personal Info</small>
            </div>
            <div className="progress-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <small>Appointment Details</small>
            </div>
          </div>
        </div>


        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}


        <form onSubmit={handleSubmit} className="appointment-form">
          {step === 1 && (
            <div className="form-step">
              <h3>Personal Information</h3>
              <p className="step-description">Please provide your basic information for the appointment</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <span className="label-icon">👤</span>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleAlphabeticalInput(e, 'name')}
                    placeholder="Enter your full name"
                    required
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="gender">
                    <span className="label-icon">⚥</span>
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>


              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">
                    <span className="label-icon">🎂</span>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="age">
                    <span className="label-icon">📅</span>
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    readOnly
                    className="readonly-field"
                    placeholder="Age will be calculated"
                  />
                </div>
              </div>


              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">📧</span>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="phone">
                    <span className="label-icon">📱</span>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleNumericalInput(e, 'phone', 10)}
                    placeholder="Enter your 10-digit phone number"
                    required
                  />
                </div>
              </div>


              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bloodGroup">
                    <span className="label-icon">🩸</span>
                    Blood Group *
                  </label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select blood group</option>
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


                <div className="form-group">
                  <label htmlFor="allergies">
                    <span className="label-icon">⚠️</span>
                    Known Allergies
                  </label>
                  <input
                    type="text"
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleNoSpecialCharactersInput(e, 'allergies')}
                    placeholder="Enter any known allergies (optional)"
                  />
                </div>
              </div>


              <button
                type="button"
                className="next-btn"
                onClick={handleNext}
              >
                Continue to Appointment Details →
              </button>
            </div>
          )}


          {step === 2 && (
            <div className="form-step">
              <h3>Appointment Details</h3>
              <p className="step-description">Choose your preferred appointment date, time, and doctor specialty</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="appointmentDate">
                    <span className="label-icon">📅</span>
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    id="appointmentDate"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="appointmentTime">
                    <span className="label-icon">🕐</span>
                    Preferred Time *
                  </label>
                  <select
                    id="appointmentTime"
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot} {parseInt(slot) >= 12 ? 'PM' : 'AM'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>


              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="doctorSpecialty">
                    <span className="label-icon">🩺</span>
                    Doctor Specialty *
                  </label>
                  <select
                    id="doctorSpecialty"
                    name="doctorSpecialty"
                    value={formData.doctorSpecialty}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select specialty</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist (Heart Specialist)</option>
                    <option value="Dermatologist">Dermatologist (Skin Specialist)</option>
                    <option value="Neurologist">Neurologist (Brain & Nerve Specialist)</option>
                    <option value="Pediatrician">Pediatrician (Child Specialist)</option>
                    <option value="Orthopedic">Orthopedic Surgeon (Bone & Joint)</option>
                    <option value="Gynecologist">Gynecologist (Women's Health)</option>
                    <option value="Psychiatrist">Psychiatrist (Mental Health)</option>
                    <option value="Dentist">Dentist (Dental Care)</option>
                    <option value="Eye Specialist">Ophthalmologist (Eye Specialist)</option>
                    <option value="ENT">ENT Specialist (Ear, Nose, Throat)</option>
                  </select>
                </div>


                <div className="form-group">
                  <label htmlFor="appointmentType">
                    <span className="label-icon">📋</span>
                    Appointment Type *
                  </label>
                  <select
                    id="appointmentType"
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="consultation">New Consultation</option>
                    <option value="follow-up">Follow-up Visit</option>
                    <option value="checkup">Regular Health Checkup</option>
                    <option value="emergency">Emergency Consultation</option>
                  </select>
                </div>
              </div>


              <div className="form-group">
                <label htmlFor="doctorName">
                  <span className="label-icon">👨‍⚕️</span>
                  Preferred Doctor (Optional)
                </label>
                <input
                  type="text"
                  id="doctorName"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => handleAlphabeticalInput(e, 'doctorName')}
                  placeholder="Enter doctor's name if you have a preference"
                />
              </div>


              <div className="form-group">
                <label htmlFor="symptoms">
                  <span className="label-icon">📝</span>
                  Symptoms / Reason for Visit
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => handleNoSpecialCharactersInput(e, 'symptoms')}
                  placeholder="Please describe your symptoms or the reason for your visit (this helps us prepare better for your consultation)"
                  rows="4"
                ></textarea>
              </div>


              <div className="form-group">
                <label htmlFor="urgency">
                  <span className="label-icon">🚨</span>
                  Urgency Level
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                >
                  <option value="normal">Normal (Routine appointment)</option>
                  <option value="urgent">Urgent (Need attention within 24-48 hours)</option>
                  <option value="emergency">Emergency (Immediate medical attention needed)</option>
                </select>
              </div>


              <div className="emergency-contact-section">
                <h4>Emergency Contact (Optional but Recommended)</h4>
                <p className="section-description">Please provide an emergency contact in case we need to reach someone on your behalf</p>


                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="emergencyContactName">
                      <span className="label-icon">👥</span>
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      id="emergencyContactName"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleAlphabeticalInput(e, 'emergencyContactName')}
                      placeholder="Enter emergency contact name"
                    />
                  </div>


                  <div className="form-group">
                    <label htmlFor="emergencyContactPhone">
                      <span className="label-icon">📞</span>
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleNumericalInput(e, 'emergencyContactPhone', 10)}
                      placeholder="Enter 10-digit emergency contact phone"
                    />
                  </div>
                </div>


                <div className="form-group">
                  <label htmlFor="emergencyContactRelationship">
                    <span className="label-icon">🤝</span>
                    Relationship to You
                  </label>
                  <select
                    id="emergencyContactRelationship"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                  >
                    <option value="">Select relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse/Partner</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>


              <div className="form-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={handleBack}
                >
                  ← Back to Personal Info
                </button>
                
                <button 
                  type="submit" 
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Booking Your Appointment...' : 'Book Appointment & Pay'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


export default Appointment;
