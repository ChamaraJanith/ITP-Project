import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaTimes, FaUserMd, FaHeartbeat, FaStethoscope, FaHospital, 
  FaCalendarAlt, FaStar, FaPhone, FaMapMarkerAlt, FaComments, FaPaperPlane,
  FaChevronDown, FaChevronUp, FaPlay, FaFacebook, FaTwitter, FaInstagram,
  FaLinkedin, FaYoutube, FaNewspaper, FaCertificate, FaAward, 
  FaShieldAlt, FaQuestionCircle, FaEnvelope, FaClock, FaUsers, FaThumbsUp, 
  FaCalculator, FaPills, FaCreditCard, FaEye, FaWeight, FaTooth, FaBrain, 
  FaLungs, FaTrash, FaRedo, FaChevronLeft, FaChevronRight, FaDownload, 
  FaFileAlt, FaHeadset, FaGraduationCap, FaFlask, FaAmbulance, FaRobot,
  FaVideo, FaMicrophone, FaMicrophoneSlash, FaCamera, FaMapPin, FaGlobe, 
  FaWifi, FaBell, FaChartLine, FaClipboardCheck, FaUserCheck, FaMedkit, 
  FaCaretDown, FaBookmark, FaShareAlt, FaVolumeUp, FaVolumeOff, FaExpand, 
  FaCompress, FaLanguage, FaSyncAlt, FaHistory, FaSave, FaCopy, FaPrint, 
  FaQrcode, FaStop, FaStopCircle, FaHeart, FaChild, FaFemale, FaMale, 
  FaBaby, FaXRay, FaDna, FaTablets, FaBandAid, FaStarOfLife, FaCheckCircle,
  FaRuler, FaApple
} from 'react-icons/fa';

// Import FaRocket from react-icons/ri as alternative
import { RiRocketLine as FaRocket } from 'react-icons/ri';

// Import additional icons if needed
import { FaHeartPulse } from 'react-icons/fa6';

import AdvancedFloatingChatbot from './AI/chatbot.jsx';
import './AI/chatbot.css';
import './Homepage.css';
import './bmi.css'

// Emoji Constants
const EMOJIS = {
  robot: '🤖',
  hospital: '🏥',
  stethoscope: '🩺',
  pills: '💊',
  syringe: '💉',
  heartbeat: '💓',
  microscope: '🔬',
  testTube: '🧪',
  dna: '🧬',
  phone: '📞',
  phoneIcon: '📱',
  envelope: '📧',
  bell: '🔔',
  megaphone: '📢',
  speaker: '🔊',
  checkMark: '✅',
  crossMark: '❌',
  warning: '⚠️',
  emergency: '🚨',
  shield: '🛡️',
  lock: '🔒',
  key: '🔑',
  magnifyingGlass: '🔍',
  target: '🎯',
  compass: '🧭',
  location: '📍',
  map: '🗺️',
  calendar: '📅',
  clock: '🕒',
  hourglass: '⏳',
  stopwatch: '⏱️',
  clipboard: '📋',
  fileAlt: '📄',
  chart: '📊',
  graph: '📈',
  bookmark: '🔖',
  creditCard: '💳',
  moneyBag: '💰',
  dollarSign: '💲',
  receipt: '🧾',
  computer: '💻',
  smartphone: '📱',
  wifi: '📶',
  satellite: '📡',
  battery: '🔋',
  wave: '👋',
  thumbsUp: '👍',
  clap: '👏',
  heart: '❤️',
  star: '⭐',
  rightArrow: '➡️',
  leftArrow: '⬅️',
  upArrow: '⬆️',
  downArrow: '⬇️',
  refresh: '🔄',
  wrench: '🔧',
  gear: '⚙️',
  hammer: '🔨',
  broom: '🧹',
  magnet: '🧲',
  leaf: '🍃',
  seedling: '🌱',
  apple: '🍎',
  water: '💧',
  fire: '🔥',
  trophy: '🏆',
  medal: '🏅',
  crown: '👑',
  gem: '💎',
  sparkles: '✨',
  ambulance: '🚑',
  car: '🚗',
  plane: '✈️',
  rocket: '🚀',
  scale: '⚖️',
  ruler: '📏'
};

// BMI Calculator Component
const BMICalculator = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const calculateBMI = () => {
    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      const bmiValue = weightInKg / (heightInMeters * heightInMeters);
      
      setBmi(bmiValue.toFixed(1));
      
      // Determine BMI category and recommendations
      let bmiCategory = '';
      let bmiRecommendations = [];
      
      if (bmiValue < 18.5) {
        bmiCategory = 'Underweight';
        bmiRecommendations = [
          'Increase caloric intake with nutritious foods',
          'Consider strength training exercises',
          'Consult with a private nutritionist',
          'Focus on protein-rich foods'
        ];
      } else if (bmiValue >= 18.5 && bmiValue < 25) {
        bmiCategory = 'Healthy Weight';
        bmiRecommendations = [
          'Maintain your current lifestyle',
          'Continue regular physical activity',
          'Eat a balanced diet',
          'Regular private health check-ups'
        ];
      } else if (bmiValue >= 25 && bmiValue < 30) {
        bmiCategory = 'Overweight';
        bmiRecommendations = [
          'Increase physical activity',
          'Focus on portion control',
          'Choose healthier food options',
          'Consider consulting a private dietitian'
        ];
      } else {
        bmiCategory = 'Obese';
        bmiRecommendations = [
          'Consult with private healthcare provider',
          'Create a structured weight loss plan',
          'Regular exercise routine',
          'Consider professional nutritional guidance'
        ];
      }
      
      setCategory(bmiCategory);
      setRecommendations(bmiRecommendations);
    }
  };

  const resetCalculator = () => {
    setHeight('');
    setWeight('');
    setBmi(null);
    setCategory('');
    setRecommendations([]);
  };

  const getBMIColor = (bmiValue) => {
    if (bmiValue < 18.5) return '#f59e0b'; // Orange for underweight
    if (bmiValue >= 18.5 && bmiValue < 25) return '#10b981'; // Green for healthy
    if (bmiValue >= 25 && bmiValue < 30) return '#f59e0b'; // Orange for overweight
    return '#ef4444'; // Red for obese
  };

  const getBMIIcon = (category) => {
    switch (category) {
      case 'Healthy Weight': return EMOJIS.checkMark;
      case 'Underweight': return EMOJIS.warning;
      case 'Overweight': return EMOJIS.warning;
      case 'Obese': return EMOJIS.emergency;
      default: return EMOJIS.scale;
    }
  };

  return (
    <div className="bmi-calculator">
      <div className="bmi-header">
        <h3>{EMOJIS.scale} BMI Calculator</h3>
        <p>Calculate your Body Mass Index and get personalized health recommendations</p>
      </div>
      
      <div className="bmi-inputs">
        <div className="input-group">
          <label>Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Enter height in centimeters"
            className="bmi-input"
          />
          <FaRuler className="input-icon" />
        </div>
        
        <div className="input-group">
          <label>Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight in kilograms"
            className="bmi-input"
          />
          <FaWeight className="input-icon" />
        </div>
      </div>
      
      <div className="bmi-actions">
        <button 
          onClick={calculateBMI}
          className="calculate-btn"
          disabled={!height || !weight}
        >
          <FaCalculator />
          Calculate BMI
        </button>
        <button 
          onClick={resetCalculator}
          className="reset-btn"
        >
          <FaRedo />
          Reset
        </button>
      </div>
      
      {bmi && (
        <div className="bmi-result">
          <div className="bmi-score" style={{ borderColor: getBMIColor(parseFloat(bmi)) }}>
            <div className="bmi-value" style={{ color: getBMIColor(parseFloat(bmi)) }}>
              {bmi}
            </div>
            <div className="bmi-category">
              <span className="category-icon">{getBMIIcon(category)}</span>
              <span className="category-text" style={{ color: getBMIColor(parseFloat(bmi)) }}>
                {category}
              </span>
            </div>
          </div>
          
          <div className="bmi-chart">
            <div className="bmi-ranges">
              <div className="range underweight">
                <span className="range-label">Underweight</span>
                <span className="range-value">&lt; 18.5</span>
              </div>
              <div className="range healthy">
                <span className="range-label">Healthy</span>
                <span className="range-value">18.5 - 24.9</span>
              </div>
              <div className="range overweight">
                <span className="range-label">Overweight</span>
                <span className="range-value">25.0 - 29.9</span>
              </div>
              <div className="range obese">
                <span className="range-label">Obese</span>
                <span className="range-value">&gt;= 30.0</span>
              </div>
            </div>
          </div>
          
          <div className="bmi-recommendations">
            <h4>Personalized Recommendations:</h4>
            <ul>
              {recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
          
          <div className="bmi-actions-secondary">
            <button className="consult-doctor-btn">
              <FaUserMd />
              Consult Private Doctor
            </button>
            <button className="nutrition-plan-btn">
              <FaApple />
              Get Nutrition Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// AI Health Risk Assessment Component
const AIHealthRiskAssessment = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [riskScore, setRiskScore] = useState(null);

  const questions = [
    { id: 'age', question: 'What is your age?', type: 'number', options: null },
    { id: 'gender', question: 'What is your gender?', type: 'select', options: ['Male', 'Female', 'Other'] },
    { id: 'smoking', question: 'Do you smoke?', type: 'select', options: ['Never', 'Former', 'Current'] },
    { id: 'exercise', question: 'How often do you exercise?', type: 'select', options: ['Never', '1-2 times/week', '3-4 times/week', 'Daily'] },
    { id: 'family_history', question: 'Family history of heart disease?', type: 'select', options: ['No', 'Yes'] }
  ];

  const calculateRisk = () => {
    let score = 0;
    if (answers.age > 65) score += 20;
    else if (answers.age > 45) score += 10;
    
    if (answers.smoking === 'Current') score += 25;
    else if (answers.smoking === 'Former') score += 10;
    
    if (answers.exercise === 'Never') score += 15;
    else if (answers.exercise === '1-2 times/week') score += 5;
    
    if (answers.family_history === 'Yes') score += 15;
    
    setRiskScore(score);
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [questions[currentStep].id]: value }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateRisk();
    }
  };

  const getRiskLevel = (score) => {
    if (score < 20) return { level: 'Low', color: '#10b981', message: 'Your health risk is low. Keep up the good work!' };
    if (score < 40) return { level: 'Moderate', color: '#f59e0b', message: 'Moderate risk. Consider lifestyle improvements.' };
    return { level: 'High', color: '#ef4444', message: 'High risk. Please consult with a healthcare provider.' };
  };

  if (riskScore !== null) {
    const risk = getRiskLevel(riskScore);
    return (
      <div className="risk-assessment-result">
        <h3>{EMOJIS.target} Your Health Risk Assessment</h3>
        <div className="risk-score" style={{ borderColor: risk.color }}>
          <div className="risk-level" style={{ color: risk.color }}>
            {risk.level} Risk
          </div>
          <div className="risk-percentage">{riskScore}%</div>
        </div>
        <p>{risk.message}</p>
        <div className="risk-recommendations">
          <h4>Personalized Recommendations:</h4>
          <ul>
            {riskScore > 30 && <li>Schedule a comprehensive health checkup</li>}
            {answers.smoking === 'Current' && <li>Consider smoking cessation programs</li>}
            {answers.exercise === 'Never' && <li>Start with 30 minutes of walking daily</li>}
            <li>Maintain a balanced diet rich in fruits and vegetables</li>
          </ul>
        </div>
        <button 
          className="book-checkup-btn"
          onClick={() => setRiskScore(null)}
        >
          {EMOJIS.calendar} Book Private Consultation
        </button>
      </div>
    );
  }

  return (
    <div className="ai-risk-assessment">
      <div className="assessment-header">
        <h3>{EMOJIS.robot} AI Health Risk Assessment</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">
          Question {currentStep + 1} of {questions.length}
        </span>
      </div>
      
      <div className="assessment-question">
        <h4>{questions[currentStep].question}</h4>
        
        {questions[currentStep].type === 'number' && (
          <input
            type="number"
            className="assessment-input"
            onChange={(e) => handleAnswer(parseInt(e.target.value))}
            placeholder="Enter your age"
          />
        )}
        
        {questions[currentStep].type === 'select' && (
          <div className="assessment-options">
            {questions[currentStep].options.map((option, index) => (
              <button
                key={index}
                className={`assessment-option ${answers[questions[currentStep].id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button 
        className="assessment-next-btn"
        onClick={nextStep}
        disabled={!answers[questions[currentStep].id]}
      >
        {currentStep < questions.length - 1 ? 'Next Question' : 'Calculate Risk'}
      </button>
    </div>
  );
};

// Live Hospital Status Component - Private Healthcare
const LiveHospitalStatus = () => {
  const [departments, setDepartments] = useState([
    {
      id: 1,
      name: 'Private Emergency',
      status: 'open',
      waitTime: '5 min',
      capacity: 85,
      availableBeds: 12,
      doctorsOnDuty: 2
    },
    {
      id: 2,
      name: 'Private Cardiology',
      status: 'open',
      waitTime: '15 min',
      capacity: 60,
      availableBeds: 8,
      doctorsOnDuty: 2
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'full': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCapacityColor = (capacity) => {
    if (capacity < 50) return '#10b981';
    if (capacity < 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="live-hospital-status">
      <div className="status-header">
        <h3>{EMOJIS.hospital} Private Healthcare Status</h3>
        <div className="last-updated">
          <FaSyncAlt className="refresh-icon" />
          <span>Updated 2 minutes ago</span>
        </div>
      </div>
      
      <div className="departments-grid">
        {departments.map(dept => (
          <div key={dept.id} className="department-card">
            <div className="dept-header">
              <h4>{dept.name}</h4>
              <span 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(dept.status) }}
              >
                {dept.status}
              </span>
            </div>
            
            <div className="dept-metrics">
              <div className="metric">
                <span className="metric-label">Wait Time</span>
                <span className="metric-value">{dept.waitTime}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Available Beds</span>
                <span className="metric-value">{dept.availableBeds}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Doctors On Duty</span>
                <span className="metric-value">{dept.doctorsOnDuty}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Capacity</span>
                <div className="capacity-bar">
                  <div 
                    className="capacity-fill"
                    style={{ 
                      width: `${dept.capacity}%`, 
                      backgroundColor: getCapacityColor(dept.capacity) 
                    }}
                  ></div>
                  <span className="capacity-text">{dept.capacity}%</span>
                </div>
              </div>
            </div>
            
            <button className="book-dept-btn">
              <FaCalendarAlt />
              Book Private Appointment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Private Doctor Availability Component - Only 2 Doctors
const AdvancedDoctorAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  
  // Only 2 private doctors
  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      rating: 4.9,
      experience: '15 years',
      nextSlot: 'Today 3:30 PM',
      consultationFee: '$250',
      avatar: '👩‍⚕️',
      status: 'available',
      type: 'Private Practice',
      certifications: ['Board Certified Cardiologist', 'Private Practice License'],
      languages: ['English', 'Spanish'],
      specializations: ['Heart Surgery', 'Preventive Cardiology', 'Cardiac Rehabilitation']
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'General Medicine',
      rating: 4.8,
      experience: '12 years',
      nextSlot: 'Tomorrow 10:15 AM',
      consultationFee: '$200',
      avatar: '👨‍⚕️',
      status: 'available',
      type: 'Private Practice',
      certifications: ['Board Certified Internal Medicine', 'Private Healthcare Provider'],
      languages: ['English', 'Mandarin'],
      specializations: ['Preventive Care', 'Chronic Disease Management', 'Health Screening']
    }
  ];

  const filteredDoctors = doctors.filter(doctor => 
    selectedSpecialty === 'all' || doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
  );

  return (
    <div className="advanced-doctor-availability">
      <div className="availability-header">
        <h3>{EMOJIS.stethoscope} Private Doctor Availability</h3>
        <div className="private-badge">
          <FaShieldAlt />
          <span>Exclusive Private Healthcare</span>
        </div>
        <div className="availability-filters">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-filter"
          />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="specialty-filter"
          >
            <option value="all">All Specialties</option>
            <option value="cardiology">Cardiology</option>
            <option value="general">General Medicine</option>
          </select>
        </div>
      </div>

      <div className="doctors-availability-grid">
        {filteredDoctors.map(doctor => (
          <div key={doctor.id} className="doctor-availability-card private-doctor">
            <div className="private-indicator">
              <FaShieldAlt />
              <span>{doctor.type}</span>
            </div>
            
            <div className="doctor-header">
              <div className="doctor-avatar-section">
                <div className="doctor-avatar">{doctor.avatar}</div>
                <div 
                  className="doctor-status-dot"
                  style={{ backgroundColor: doctor.status === 'available' ? '#10b981' : '#f59e0b' }}
                ></div>
              </div>
              <div className="doctor-info">
                <h4>{doctor.name}</h4>
                <p className="doctor-specialty">{doctor.specialty}</p>
                <div className="doctor-rating">
                  <FaStar className="star-icon" />
                  <span>{doctor.rating} • {doctor.experience}</span>
                </div>
                <div className="languages">
                  <FaLanguage />
                  <span>{doctor.languages.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="doctor-specializations">
              <h5>Specializations:</h5>
              <div className="specialization-tags">
                {doctor.specializations.map((spec, idx) => (
                  <span key={idx} className="specialization-tag">{spec}</span>
                ))}
              </div>
            </div>

            <div className="certifications">
              <h5>Certifications:</h5>
              <ul>
                {doctor.certifications.map((cert, idx) => (
                  <li key={idx}>
                    <FaCertificate />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>

            <div className="availability-info">
              <div className="next-slot">
                <span className="slot-label">Next Available:</span>
                <span className="slot-time">{doctor.nextSlot}</span>
              </div>
              <div className="consultation-fee">
                <span className="fee-label">Private Consultation Fee:</span>
                <span className="fee-amount">{doctor.consultationFee}</span>
              </div>
            </div>

            <div className="booking-options">
              <button className="quick-book-btn">
                <FaCalendarAlt />
                Book Private Consultation
              </button>
              <button className="video-consult-btn">
                <FaVideo />
                Private Video Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Advanced Services Component
const AdvancedServices = () => {
  const services = [
    {
      icon: <FaRobot />,
      title: 'AI Symptom Analysis',
      description: 'Get instant AI-powered symptom analysis with 95% accuracy and personalized recommendations.',
      features: ['Real-time analysis', 'Confidence scoring', 'Disease prediction', 'Treatment suggestions'],
      color: '#8b5cf6'
    },
    {
      icon: <FaVideo />,
      title: 'Private Telehealth',
      description: 'Connect with certified private doctors through secure video calls from the comfort of your home.',
      features: ['HD video calls', '24/7 availability', 'Prescription delivery', 'Follow-up care'],
      color: '#10b981'
    },
    {
      icon: <FaHeartbeat />,
      title: 'Health Monitoring',
      description: 'Advanced health tracking with wearable device integration and predictive analytics.',
      features: ['Vital signs tracking', 'Trend analysis', 'Health alerts', 'Progress reports'],
      color: '#ef4444'
    },
    {
      icon: <FaWeight />,
      title: 'BMI & Health Metrics',
      description: 'Comprehensive BMI calculation with personalized health recommendations and tracking.',
      features: ['BMI calculation', 'Health status', 'Nutrition plans', 'Weight management'],
      color: '#06b6d4'
    },
    {
      icon: <FaPills />,
      title: 'Medication Management',
      description: 'Comprehensive medication tracking with interaction checking and refill reminders.',
      features: ['Drug interactions', 'Refill alerts', 'Dosage tracking', 'Side effect monitoring'],
      color: '#f59e0b'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Private Health Insurance',
      description: 'Exclusive private health insurance plans with comprehensive coverage.',
      features: ['Premium coverage', 'No waiting periods', 'Global coverage', 'VIP services'],
      color: '#84cc16'
    }
  ];

  return (
    <div className="advanced-services">
      <div className="container">
        <h2>{EMOJIS.sparkles} Private Healthcare Services</h2>
        <p className="section-subtitle">
          Exclusive AI-powered private healthcare solutions designed for premium care
        </p>
        
        <div className="advanced-services-grid">
          {services.map((service, index) => (
            <div key={index} className="advanced-service-card" style={{ '--accent-color': service.color }}>
              <div className="service-icon-advanced">
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="service-features">
                {service.features.map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
              </div>
              <button className="service-btn-advanced">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Featured Doctors Component - Only 2 Private Doctors
const FeaturedDoctors = () => {
  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      specialty: 'Private Cardiology',
      rating: 4.9,
      experience: '15 years',
      avatar: '👩‍⚕️',
      status: 'online',
      nextSlot: 'Today 3:30 PM',
      patients: '2,500+',
      achievements: ['Board Certified', 'Private Practice Award', 'Research Excellence']
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      specialty: 'Private General Medicine',
      rating: 4.8,
      experience: '12 years',
      avatar: '👨‍⚕️',
      status: 'online',
      nextSlot: 'Tomorrow 10:15 AM',
      patients: '1,800+',
      achievements: ['Internal Medicine Expert', 'Private Healthcare Leader', 'Patient Choice Award']
    }
  ];

  return (
    <div className="featured-doctors">
      <div className="container">
        <h2>{EMOJIS.stethoscope} Our Private Doctors</h2>
        <p className="section-subtitle">
          Meet our exclusive private healthcare professionals
        </p>
        
        <div className="doctors-grid">
          {doctors.map(doctor => (
            <div key={doctor.id} className="doctor-card private-doctor-card">
              <div className="private-badge">
                <FaShieldAlt />
                <span>Private Practice</span>
              </div>
              <div className="doctor-avatar">
                {doctor.avatar}
              </div>
              <h3>{doctor.name}</h3>
              <p className="specialty">{doctor.specialty}</p>
              
              <div className="doctor-stats">
                <div className="rating">
                  <FaStar />
                  <span>{doctor.rating}</span>
                </div>
                <div className="experience">
                  {doctor.experience}
                </div>
              </div>
              
              <div className="doctor-status">
                <span className={`status-badge ${doctor.status}`}>
                  {doctor.status}
                </span>
                <span className="next-slot">Next: {doctor.nextSlot}</span>
              </div>
              
              <div className="patient-count">
                <FaUsers />
                <span>{doctor.patients} Private Patients</span>
              </div>
              
              <div className="achievements">
                {doctor.achievements.map((achievement, idx) => (
                  <span key={idx} className="achievement-badge">
                    {achievement}
                  </span>
                ))}
              </div>
              
              <button className="book-btn private-book-btn">
                <FaCalendarAlt />
                Book Private Appointment
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AI FAQ Component
const AIFaqSection = () => {
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqs = [
    {
      question: 'How accurate is the AI symptom analysis?',
      answer: 'Our AI symptom analysis achieves 95% accuracy through advanced machine learning algorithms trained on millions of medical cases. However, it should be used as a preliminary assessment tool and not replace professional medical diagnosis.'
    },
    {
      question: 'Is my health data secure and private?',
      answer: 'Absolutely. We use HIPAA-compliant encryption, end-to-end security protocols, and secure data storage. Your personal health information is never shared without your explicit consent and is protected by the highest industry standards.'
    },
    {
      question: 'Can I get prescriptions through private telehealth consultations?',
      answer: 'Yes, our licensed private physicians can prescribe medications during telehealth consultations when medically appropriate. Prescriptions are sent directly to your preferred pharmacy for convenient pickup or delivery.'
    },
    {
      question: 'What makes your private healthcare different?',
      answer: 'Our private healthcare offers exclusive access to top specialists, no waiting times, premium facilities, personalized care plans, and 24/7 concierge medical services for our private patients.'
    },
    {
      question: 'How does the BMI calculator help with health assessment?',
      answer: 'Our BMI calculator provides instant health status assessment and personalized recommendations. It integrates with our AI system to provide comprehensive health insights and connects you directly with our private doctors for further consultation.'
    }
  ];

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <div className="ai-faq-section">
      <div className="container">
        <h2>{EMOJIS.questionCircle} Frequently Asked Questions</h2>
        <p className="section-subtitle">
          Get answers to common questions about our private AI-powered healthcare platform
        </p>
        
        <div className="faq-container">
          <div className="faq-items">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-question">
                <button
                  className="faq-toggle"
                  onClick={() => toggleQuestion(index)}
                >
                  <span>{faq.question}</span>
                  {openQuestion === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {openQuestion === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Newsletter Component
const AINewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="ai-newsletter-section">
      <div className="container">
        {!subscribed ? (
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <h3>{EMOJIS.envelope} Stay Updated with Private Health Insights</h3>
            <p>Get the latest AI health insights, medical breakthroughs, and personalized private health tips delivered to your inbox.</p>
            
            <div className="input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
              <button type="submit">
                <FaPaperPlane />
                Subscribe
              </button>
            </div>
            
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '15px' }}>
              Join our exclusive private healthcare community. Unsubscribe anytime.
            </p>
          </form>
        ) : (
          <div className="success-message">
            <FaCheckCircle />
            <span>Thank you for subscribing! Check your email for confirmation.</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Features Showcase Component
const FeaturesShowcase = () => {
  const features = [
    {
      icon: <FaRobot />,
      title: 'AI-Powered Diagnosis',
      description: 'Advanced machine learning algorithms for accurate symptom analysis and disease prediction.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Private & HIPAA Compliant',
      description: 'Your health data is protected with enterprise-grade security and privacy standards.'
    },
    {
      icon: <FaClock />,
      title: '24/7 Private Access',
      description: 'Access exclusive private healthcare services anytime, anywhere with our premium platform.'
    },
    {
      icon: <FaUsers />,
      title: 'Expert Private Network',
      description: 'Connect with certified private healthcare professionals and specialists exclusively.'
    },
    {
      icon: <FaChartLine />,
      title: 'Advanced Health Analytics',
      description: 'Comprehensive health tracking with BMI calculation and predictive insights.'
    },
    {
      icon: <FaHeart />,
      title: 'Premium Preventive Care',
      description: 'Proactive private health monitoring and early warning systems for optimal outcomes.'
    }
  ];

  return (
    <div className="features-showcase">
      <div className="container">
        <h2>{EMOJIS.sparkles} Why Choose Our Private Platform</h2>
        
        <div className="showcase-grid">
          {features.map((feature, index) => (
            <div key={index} className="showcase-item">
              <div className="showcase-icon">
                {feature.icon}
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Final CTA Component
const FinalAdvancedCTA = () => {
  const navigate = useNavigate();

  return (
    <div className="final-advanced-cta">
      <div className="container">
        <h2>Ready to Experience Premium Private Healthcare?</h2>
        <p>
          Join our exclusive private healthcare community with personalized AI assistance, 
          BMI health tracking, and access to top private doctors. Experience luxury healthcare today.
        </p>
        
        <div className="final-advanced-stats">
          <div className="advanced-stat">
            <strong>5K+</strong>
            <span>Private Patients</span>
          </div>
          <div className="advanced-stat">
            <strong>95%</strong>
            <span>Accuracy Rate</span>
          </div>
          <div className="advanced-stat">
            <strong>24/7</strong>
            <span>Premium Access</span>
          </div>
          <div className="advanced-stat">
            <strong>2</strong>
            <span>Expert Private Doctors</span>
          </div>
        </div>
        
        <div className="final-advanced-buttons">
          <button 
            onClick={() => navigate('/register')}
            className="final-btn-advanced primary"
          >
            <FaRocket />
            Start Private Healthcare
          </button>
          <button 
            onClick={() => navigate('/demo')}
            className="final-btn-advanced secondary"
          >
            <FaPlay />
            Watch Private Demo
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Homepage Component
const Homepage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="advanced-homepage">
      {/* Hero Section */}
      <section className="advanced-hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>{EMOJIS.rocket} Private Healthcare Excellence</h1>
            <p>Experience revolutionary AI-powered private healthcare with ARIA, featuring exclusive private consultations, BMI health tracking, auto-symptom analysis, and cutting-edge telehealth technology.</p>
            
            {user.name ? (
              <div className="welcome-user-advanced">
                <p>Welcome back, <strong>{user.name}</strong>! {EMOJIS.target}</p>
                <div className="user-health-summary">
                  <div className="health-metric">
                    <span className="metric-value">98%</span>
                    <span className="metric-label">Health Score</span>
                  </div>
                  <div className="health-metric">
                    <span className="metric-value">2</span>
                    <span className="metric-label">Private Appointments</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="dashboard-btn"
                >
                  {EMOJIS.target} View Private Health Dashboard
                </button>
              </div>
            ) : (
              <div className="auth-prompt-advanced">
                <p>Join our exclusive private healthcare community</p>
                <div className="auth-features">
                  <span>{EMOJIS.sparkles} Private AI Assistant</span>
                  <span>{EMOJIS.scale} BMI Health Tracking</span>
                  <span>{EMOJIS.phoneIcon} Premium Monitoring</span>
                </div>
                <div className="auth-buttons">
                  <button 
                    onClick={() => navigate('/register')}
                    className="auth-btn primary-advanced"
                  >
                    {EMOJIS.rocket} Start Private Healthcare Journey
                  </button>
                  <button 
                    onClick={() => navigate('/login')}
                    className="auth-btn secondary-advanced"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
            
            <div className="advanced-cta-buttons">
              <button 
                onClick={() => navigate('/ai-booking')}
                className="cta-primary-advanced"
              >
                <FaRobot /> AI Private Booking
              </button>
              <button 
                onClick={() => navigate('/telehealth')}
                className="cta-secondary-advanced"
              >
                <FaVideo /> Start Private Consult
              </button>
            </div>
          </div>
          
          <div className="hero-ai-features">
            <div className="ai-feature-card">
              <FaRobot className="ai-icon" />
              <h4>ARIA AI Assistant</h4>
              <p>Auto-symptom analysis as you type</p>
            </div>
            <div className="ai-feature-card">
              <FaWeight className="ai-icon" />
              <h4>BMI Health Tracker</h4>
              <p>Instant health status assessment</p>
            </div>
            <div className="ai-feature-card">
              <FaShieldAlt className="ai-icon" />
              <h4>Private Care</h4>
              <p>Exclusive healthcare access</p>
            </div>
          </div>
        </div>
      </section>

      {/* BMI Calculator Section */}
      <section className="bmi-calculator-section">
        <div className="container">
          <h2>{EMOJIS.scale} BMI Health Assessment</h2>
          <p className="section-subtitle">Calculate your BMI and get personalized health recommendations</p>
          <BMICalculator />
        </div>
      </section>

      {/* AI Health Risk Assessment Section */}
      <section className="ai-assessment-section">
        <div className="container">
          <h2>{EMOJIS.robot} AI Health Risk Assessment</h2>
          <p className="section-subtitle">Get personalized health insights with our advanced AI analysis</p>
          <AIHealthRiskAssessment />
        </div>
      </section>

      {/* Live Hospital Status Section */}
      <section className="live-status-section">
        <div className="container">
          <h2>{EMOJIS.hospital} Private Healthcare Status</h2>
          <p className="section-subtitle">Real-time private facility capacity and availability updates</p>
          <LiveHospitalStatus />
        </div>
      </section>

      {/* Doctor Availability Section */}
      <section className="doctor-availability-section">
        <div className="container">
          <h2>{EMOJIS.calendar} Private Doctor Availability</h2>
          <p className="section-subtitle">Find and book appointments with our exclusive private specialists</p>
          <AdvancedDoctorAvailability />
        </div>
      </section>

      {/* Advanced Services Section */}
      <AdvancedServices />

      {/* Featured Doctors Section */}
      <FeaturedDoctors />

      {/* Features Showcase Section */}
      <FeaturesShowcase />

      {/* FAQ Section */}
      <AIFaqSection />

      {/* Newsletter Section */}
      <AINewsletterSection />

      {/* Final CTA Section */}
      <FinalAdvancedCTA />

      {/* Chatbot Component */}
      <AdvancedFloatingChatbot />
    </div>
  );
};

export default Homepage;
