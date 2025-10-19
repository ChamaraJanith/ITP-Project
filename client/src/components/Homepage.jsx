import React, { useState, useEffect } from 'react';
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

import { RiRocketLine as FaRocket } from 'react-icons/ri';
import { FaHeartPulse, FaQuestion } from 'react-icons/fa6';

import AdvancedFloatingChatbot from './AI/chatbot.jsx';
import './Homepage.css';

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
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');

  const validateHeight = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return 'Height must be a positive number';
    }
    if (numValue > 300) {
      return 'Height cannot exceed 300 cm';
    }
    return '';
  };

  const validateWeight = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return 'Weight must be a positive number';
    }
    if (numValue > 650) {
      return 'Weight cannot exceed 650 kg';
    }
    return '';
  };

  const handleHeightChange = (e) => {
    let value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    } else {
      value = numericValue;
    }
    const regex = /^\d{0,3}(\.\d{0,2})?$/;
    if (regex.test(value) || value === '') {
      setHeight(value);
      if (value) {
        const numValue = parseFloat(value);
        if (numValue > 300) {
          setHeight('300');
          setHeightError('Maximum height is 300 cm');
        } else if (numValue < 0) {
          setHeight('');
          setHeightError('Height must be positive');
        } else {
          setHeightError('');
        }
      } else {
        setHeightError('');
      }
    }
  };

  const handleWeightChange = (e) => {
    let value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    } else {
      value = numericValue;
    }
    const regex = /^\d{0,3}(\.\d{0,2})?$/;
    if (regex.test(value) || value === '') {
      setWeight(value);
      if (value) {
        const numValue = parseFloat(value);
        if (numValue > 650) {
          setWeight('650');
          setWeightError('Maximum weight is 650 kg');
        } else if (numValue < 0) {
          setWeight('');
          setWeightError('Weight must be positive');
        } else {
          setWeightError('');
        }
      } else {
        setWeightError('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const calculateBMI = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const heightValidation = validateHeight(height);
    const weightValidation = validateWeight(weight);
    
    setHeightError(heightValidation);
    setWeightError(weightValidation);
    
    if (heightValidation || weightValidation) {
      return;
    }

    if (heightNum && weightNum && heightNum > 0 && weightNum > 0) {
      const heightInMeters = heightNum / 100;
      const bmiValue = weightNum / (heightInMeters * heightInMeters);
      
      setBmi(bmiValue.toFixed(1));
      
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
    setHeightError('');
    setWeightError('');
  };

  const getBMIColor = (bmiValue) => {
    if (bmiValue < 18.5) return '#f59e0b';
    if (bmiValue >= 18.5 && bmiValue < 25) return '#10b981';
    if (bmiValue >= 25 && bmiValue < 30) return '#f59e0b';
    return '#ef4444';
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

  const isFormValid = () => {
    return height && 
           weight && 
           !heightError && 
           !weightError && 
           parseFloat(height) > 0 && 
           parseFloat(weight) > 0 &&
           parseFloat(height) <= 300 &&
           parseFloat(weight) <= 650;
  };

  return (
    <div className="bmi-calculator-wrapper scroll-animate">
      <div className="bmi-calculator-header scroll-animate">
        <h3>{EMOJIS.scale} BMI Calculator</h3>
        <p>Calculate your Body Mass Index and get personalized health recommendations</p>
      </div>
      
      <div className="bmi-inputs-container scroll-animate">
        <div className="height-input-group">
          <label>Height (cm)</label>
          <input
            type="text"
            value={height}
            onChange={handleHeightChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter height (0-300 cm)"
            className={`height-input ${heightError ? 'error' : ''}`}
            maxLength="6"
          />
          <FaRuler className="height-input-icon" />
          {heightError && <span className="height-error-message">{heightError}</span>}
          <div className="height-input-hint">Valid range: 0 - 300 cm</div>
        </div>
        
        <div className="weight-input-group">
          <label>Weight (kg)</label>
          <input
            type="text"
            value={weight}
            onChange={handleWeightChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter weight (0-650 kg)"
            className={`weight-input ${weightError ? 'error' : ''}`}
            maxLength="6"
          />
          <FaWeight className="weight-input-icon" />
          {weightError && <span className="weight-error-message">{weightError}</span>}
          <div className="weight-input-hint">Valid range: 0 - 650 kg</div>
        </div>
      </div>
      
      <div className="bmi-actions-container scroll-animate">
        <button 
          onClick={calculateBMI}
          className="calculate-bmi-btn"
          disabled={!isFormValid()}
        >
          <FaCalculator />
          Calculate BMI
        </button>
        <button 
          onClick={resetCalculator}
          className="reset-bmi-btn"
        >
          <FaRedo />
          Reset
        </button>
      </div>
      
      {bmi && (
        <div className="bmi-result-container scroll-animate">
          <div className="bmi-score-container" data-category={category.toLowerCase().replace(' ', '-')}>
            <div className="bmi-value-display" data-bmi-value={bmi}>
              {bmi}
            </div>
            <div className="bmi-category-display">
              <span className="category-icon">{getBMIIcon(category)}</span>
              <span className="category-text">
                {category}
              </span>
            </div>
          </div>
          
          <div className="bmi-chart-container">
            <div className="bmi-ranges-container">
              <div className="bmi-range-underweight">
                <span className="range-label">Underweight</span>
                <span className="range-value">&lt; 18.5</span>
              </div>
              <div className="bmi-range-healthy">
                <span className="range-label">Healthy</span>
                <span className="range-value">18.5 - 24.9</span>
              </div>
              <div className="bmi-range-overweight">
                <span className="range-label">Overweight</span>
                <span className="range-value">25.0 - 29.9</span>
              </div>
              <div className="bmi-range-obese">
                <span className="range-label">Obese</span>
                <span className="range-value">&gt;= 30.0</span>
              </div>
            </div>
          </div>
          
          <div className="bmi-recommendations-container">
            <h4>Personalized Recommendations:</h4>
            <ul>
              {recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
          
          <div className="bmi-secondary-actions-container">
            <button className="consult-doctor-bmi-btn">
              <FaUserMd />
              Consult Private Doctor
            </button>
            <button className="nutrition-plan-bmi-btn">
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
  const [ageError, setAgeError] = useState('');

  const questions = [
    { id: 'age', question: 'What is your age?', type: 'number', options: null },
    { id: 'gender', question: 'What is your gender?', type: 'select', options: ['Male', 'Female', 'Other'] },
    { id: 'smoking', question: 'Do you smoke?', type: 'select', options: ['Never', 'Former', 'Current'] },
    { id: 'exercise', question: 'How often do you exercise?', type: 'select', options: ['Never', '1-2 times/week', '3-4 times/week', 'Daily'] },
    { id: 'family_history', question: 'Family history of heart disease?', type: 'select', options: ['No', 'Yes'] }
  ];

  const validateAge = (value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      return 'Age must be at least 1 year';
    }
    if (numValue > 120) {
      return 'Age cannot exceed 120 years';
    }
    return '';
  };

  const handleAgeChange = (e) => {
    let value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length <= 3) {
      const numValue = parseInt(numericValue);
      
      if (numericValue === '' || (numValue >= 1 && numValue <= 120)) {
        setAnswers(prev => ({ ...prev, age: numValue || '' }));
        setAgeError('');
      } else if (numValue > 120) {
        setAnswers(prev => ({ ...prev, age: 120 }));
        setAgeError('Maximum age is 120 years');
      } else if (numValue < 1) {
        setAnswers(prev => ({ ...prev, age: '' }));
        setAgeError('Age must be at least 1 year');
      }
    }
  };

  const handleAgeKeyPress = (e) => {
    if ([8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

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
    if (questions[currentStep].id === 'age') {
      return;
    }
    setAnswers(prev => ({ ...prev, [questions[currentStep].id]: value }));
  };

  const nextStep = () => {
    if (questions[currentStep].id === 'age') {
      const validation = validateAge(answers.age);
      if (validation) {
        setAgeError(validation);
        return;
      }
    }

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

  const isCurrentStepValid = () => {
    const currentQuestion = questions[currentStep];
    if (currentQuestion.id === 'age') {
      return answers.age && 
             !ageError && 
             answers.age >= 1 && 
             answers.age <= 120;
    }
    return answers[currentQuestion.id];
  };

  if (riskScore !== null) {
    const risk = getRiskLevel(riskScore);
    return (
      <div className="risk-assessment-result-container scroll-animate">
        <h3>{EMOJIS.target} Your Health Risk Assessment</h3>
        <div className="risk-score-display" data-risk-level={risk.level.toLowerCase()}>
          <div className="risk-level-text">
            {risk.level} Risk
          </div>
          <div className="risk-percentage-text">{riskScore}%</div>
        </div>
        <p>{risk.message}</p>
        <div className="risk-recommendations-container">
          <h4>Personalized Recommendations:</h4>
          <ul>
            {riskScore > 30 && <li>Schedule a comprehensive health checkup</li>}
            {answers.smoking === 'Current' && <li>Consider smoking cessation programs</li>}
            {answers.exercise === 'Never' && <li>Start with 30 minutes of walking daily</li>}
            <li>Maintain a balanced diet rich in fruits and vegetables</li>
          </ul>
        </div>
        <button 
          className="book-checkup-risk-btn"
          onClick={() => {
            setRiskScore(null);
            setCurrentStep(0);
            setAnswers({});
            setAgeError('');
          }}
        >
          {EMOJIS.calendar} Book Private Consultation
        </button>
      </div>
    );
  }

  return (
    <div className="ai-risk-assessment-container scroll-animate">
      <div className="assessment-header-container scroll-animate">
        <h3>{EMOJIS.robot} AI Health Risk Assessment</h3>
        <div className="progress-bar-container">
          <div 
            className="progress-fill-bar" 
            data-progress={`${((currentStep + 1) / questions.length) * 100}%`}
          ></div>
        </div>
        <span className="progress-text-display">
          Question {currentStep + 1} of {questions.length}
        </span>
      </div>
      
      <div className="assessment-question-container scroll-animate">
        <h4>{questions[currentStep].question}</h4>
        
        {questions[currentStep].type === 'number' && (
          <div className="age-input-group">
            <input
              type="text"
              className={`age-assessment-input ${ageError ? 'error' : ''}`}
              value={answers.age || ''}
              onChange={handleAgeChange}
              onKeyDown={handleAgeKeyPress}
              placeholder="Enter your age (1-120 years)"
              maxLength="3"
            />
            {ageError && <span className="age-error-message">{ageError}</span>}
            <div className="age-input-hint">Valid range: 1 - 120 years</div>
          </div>
        )}
        
        {questions[currentStep].type === 'select' && (
          <div className="assessment-options-container">
            {questions[currentStep].options.map((option, index) => (
              <button
                key={index}
                className={`assessment-option-btn ${answers[questions[currentStep].id] === option ? 'selected' : ''}`}
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
        disabled={!isCurrentStepValid()}
      >
        {currentStep < questions.length - 1 ? 'Next Question' : 'Calculate Risk'}
      </button>
    </div>
  );
};

// Live Hospital Status Component
const LiveHospitalStatus = () => {
  const departments = [
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
  ];

  return (
    <div className="live-hospital-status-container scroll-animate">
      <div className="status-header-container scroll-animate">
        <h3>{EMOJIS.hospital} Private Healthcare Status</h3>
        <div className="last-updated-container">
          <FaSyncAlt className="refresh-icon" />
          <span>Updated 2 minutes ago</span>
        </div>
      </div>
      
      <div className="departments-grid-container scroll-animate">
        {departments.map(dept => (
          <div key={dept.id} className="department-card-container scroll-animate">
            <div className="dept-header-container">
              <h4>{dept.name}</h4>
              <span 
                className="status-indicator-text"
                data-status={dept.status}
              >
                {dept.status}
              </span>
            </div>
            
            <div className="dept-metrics-container">
              <div className="wait-time-metric">
                <span className="metric-label">Wait Time</span>
                <span className="metric-value">{dept.waitTime}</span>
              </div>
              
              <div className="beds-metric">
                <span className="metric-label">Available Beds</span>
                <span className="metric-value">{dept.availableBeds}</span>
              </div>
              
              <div className="doctors-metric">
                <span className="metric-label">Doctors On Duty</span>
                <span className="metric-value">{dept.doctorsOnDuty}</span>
              </div>
              
              <div className="capacity-metric">
                <span className="metric-label">Capacity</span>
                <div className="capacity-bar-container">
                  <div 
                    className="capacity-fill-bar"
                    data-capacity={dept.capacity}
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

// Private Doctor Availability Component
const AdvancedDoctorAvailability = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const todayString = today.toISOString().split('T')[0];
  const maxDateString = dayAfterTomorrow.toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [dateError, setDateError] = useState('');

  const validateDate = (dateString) => {
    const selectedDateObj = new Date(dateString);
    const todayObj = new Date(todayString);
    const maxDateObj = new Date(maxDateString);

    if (selectedDateObj < todayObj) {
      return 'Cannot select past dates';
    }
    if (selectedDateObj > maxDateObj) {
      return 'Cannot select dates beyond 2 days from today';
    }
    return '';
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    const validation = validateDate(dateValue);
    
    if (validation) {
      setDateError(validation);
      return;
    }
    
    setSelectedDate(dateValue);
    setDateError('');
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const doctors = [
    {
      id: 1,
      name: 'Dr. Gayath Dahanayake',
      specialty: 'Cardiology',
      rating: 4.9,
      experience: '15 years',
      nextSlot: selectedDate === todayString ? 'Today 3:30 PM' : 
                selectedDate === tomorrow.toISOString().split('T')[0] ? 'Tomorrow 10:15 AM' : 
                `${formatDateForDisplay(selectedDate)} 9:00 AM`,
      consultationFee: '$250',
      avatar: '👨‍⚕️',
      status: 'available',
      type: 'Private Practice',
      certifications: ['Board Certified Cardiologist', 'Private Practice License'],
      languages: [' English ', ' Spanish'],
      specializations: [' Heart Surgery ', ' Preventive Cardiology ', ' Cardiac Rehabilitation ']
    },
    {
      id: 2,
      name: 'Dr. Anne Fonseka',
      specialty: 'General Medicine',
      rating: 4.8,
      experience: '12 years',
      nextSlot: selectedDate === todayString ? 'Today 4:15 PM' : 
                selectedDate === tomorrow.toISOString().split('T')[0] ? 'Tomorrow 10:15 AM' : 
                `${formatDateForDisplay(selectedDate)} 11:30 AM`,
      consultationFee: '$200',
      avatar: '👩‍⚕️',
      status: 'available',
      type: 'Private Practice',
      certifications: ['Board Certified Internal Medicine', 'Private Healthcare Provider'],
      languages: [' English ', ' Mandarin'],
      specializations: [' Preventive Care ', ' Chronic Disease Management ', ' Health Screening ']
    }
  ];

  const filteredDoctors = doctors.filter(doctor => 
    selectedSpecialty === 'all' || doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
  );

  return (
    <div className="advanced-doctor-availability-container scroll-animate">
      <div className="availability-header-container scroll-animate">
        <h3>{EMOJIS.stethoscope} Private Doctor Availability</h3>
        <div className="private-badge-container">
          <FaShieldAlt />
          <span>Exclusive Private Healthcare</span>
        </div>
        <div className="availability-filters-container">
          <div className="date-filter-container">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={todayString}
              max={maxDateString}
              className={`date-filter-input ${dateError ? 'error' : ''}`}
            />
            {dateError && <span className="date-error-message">{dateError}</span>}
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="specialty-filter-select"
          >
            <option value="all">All Specialties</option>
            <option value="cardiology">Cardiology</option>
            <option value="general">General Medicine</option>
          </select>
        </div>
      </div>

      <div className="doctors-availability-grid-container scroll-animate">
        {filteredDoctors.map(doctor => (
          <div key={doctor.id} className="doctor-availability-card-container private-doctor-card scroll-animate">
            <div className="private-indicator-container">
              <FaShieldAlt />
              <span>{doctor.type}</span>
            </div>
            
            <div className="doctor-header-container">
              <div className="doctor-avatar-section-container">
                <div className="doctor-avatar">{doctor.avatar}</div>
                <div 
                  className="doctor-status-dot"
                  data-status={doctor.status}
                ></div>
              </div>
              <div className="doctor-info-container">
                <h4>{doctor.name}</h4>
                <p className="doctor-specialty-text">{doctor.specialty}</p>
                <div className="doctor-rating-container">
                  <FaStar className="star-icon" />
                  <span>{doctor.rating} • {doctor.experience}</span>
                </div>
              </div>
            </div>

            <div className="doctor-specializations-container">
              <h5>Specializations:</h5>
              <ul>
                {doctor.specializations.map((spec, idx) => (
                  <li key={idx}>{spec}</li>
                ))}
              </ul>
            </div>

            <div className="certifications-container">
              <h5>Certifications:</h5>
              <ul>
                {doctor.certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>

            <div className="availability-info-container">
              <div className="next-slot-container">
                <span className="slot-label">Next Available:</span>
                <span className="slot-time">{doctor.nextSlot}</span>
              </div>
              <div className="consultation-fee-container">
                <span className="fee-label">Private Consultation Fee:</span>
                <span className="fee-amount">{doctor.consultationFee}</span>
              </div>
            </div>

            <div className="booking-options-container">
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
    <div className="advanced-services-container scroll-animate">
      <div className="services-content-container scroll-animate">
        <h2>{EMOJIS.sparkles} Private Healthcare Services</h2>
        <p className="services-subtitle-text">
          Exclusive AI-powered private healthcare solutions designed for premium care
        </p>
        
        <div className="advanced-services-grid-container">
          {services.map((service, index) => (
            <div key={index} className="advanced-service-card-container scroll-animate" data-service-color={service.color}>
              <div className="service-icon-advanced-container">
                {service.icon}
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="service-features-container">
                {service.features.map((feature, idx) => (
                  <span key={idx} className="feature-tag-text">{feature}</span>
                ))}
              </div>
              <button className="service-btn-advanced-container">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Featured Doctors Component
const FeaturedDoctors = () => {
  const doctors = [
    {
      id: 1,
      name: 'Dr. Gayath Dahanayaka',
      specialty: 'Private Cardiology',
      rating: 4.9,
      experience: '15 years',
      avatar: '👨‍⚕️',
      status: 'online',
      nextSlot: 'Today 3:30 PM',
      patients: '2,500+',
      achievements: ['Board Certified', 'Private Practice Award', 'Research Excellence']
    },
    {
      id: 2,
      name: 'Dr. Anne Fonseka',
      specialty: 'Private General Medicine',
      rating: 4.8,
      experience: '12 years',
      avatar: '👩‍⚕️',
      status: 'online',
      nextSlot: 'Tomorrow 10:15 AM',
      patients: '1,800+',
      achievements: ['Internal Medicine Expert', 'Private Healthcare Leader', 'Patient Choice Award']
    }
  ];

  return (
    <div className="featured-doctors-container scroll-animate">
      <div className="doctors-content-container scroll-animate">
        <h2>{EMOJIS.stethoscope} Our Private Doctors</h2>
        <p className="doctors-subtitle-text">
          Meet our exclusive private healthcare professionals
        </p>
        
        <div className="doctors-grid-container">
          {doctors.map(doctor => (
            <div key={doctor.id} className="doctor-card-container private-doctor-card scroll-animate">
              <div className="private-badge-container">
                <FaShieldAlt />
                <span>Private Practice</span>
              </div>
              <div className="doctor-avatar-container">
                {doctor.avatar}
              </div>
              <h3>{doctor.name}</h3>
              <p className="specialty-text">{doctor.specialty}</p>
              
              <div className="doctor-stats-container">
                <div className="rating-container">
                  <FaStar />
                  <span>{doctor.rating}</span>
                </div>
                <div className="experience-container">
                  {doctor.experience}
                </div>
              </div>
              
              <div className="doctor-status-container">
                <span className={`status-badge ${doctor.status}`}>
                  {doctor.status}
                </span>
                <span className="next-slot-text">Next: {doctor.nextSlot}</span>
              </div>
              
              <div className="patient-count-container">
                <FaUsers />
                <span>{doctor.patients} Private Patients</span>
              </div>
              
              <div className="achievements-container">
                {doctor.achievements.map((achievement, idx) => (
                  <span key={idx} className="achievement-badge-text">
                    {achievement}
                  </span>
                ))}
              </div>
              
              <button className="book-btn-container private-book-btn">
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
    <div className="ai-faq-section-container scroll-animate">
      <div className="faq-content-container scroll-animate">
        <h2>Frequently Asked Questions <FaQuestionCircle/></h2>
        <p className="faq-subtitle-text">
          Get answers to common questions about our private AI-powered healthcare platform
        </p>
        
        <div className="faq-container-wrapper">
          <div className="faq-items-container">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-question-container scroll-animate">
                <button
                  className="faq-toggle-btn"
                  onClick={() => toggleQuestion(index)}
                >
                  <span>{faq.question}</span>
                  {openQuestion === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {openQuestion === index && (
                  <div className="faq-answer-container">
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
    <div className="features-showcase-container scroll-animate">
      <div className="showcase-content-container scroll-animate">
        <h2>{EMOJIS.sparkles} Why Choose Our Private Platform</h2>
        
        <div className="showcase-grid-container">
          {features.map((feature, index) => (
            <div key={index} className="showcase-item-container scroll-animate">
              <div className="showcase-icon-container">
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
    <div className="final-advanced-cta-container scroll-animate">
      <div className="cta-content-container scroll-animate">
        <h2>Ready to Experience Premium Private Healthcare?</h2>
        <p>
          Join our exclusive private healthcare community with personalized AI assistance, 
          BMI health tracking, and access to top private doctors. Experience luxury healthcare today.
        </p>
        
        <div className="final-advanced-stats-container">
          <div className="advanced-stat-container">
            <strong>5K+</strong>
            <span>Private Patients</span>
          </div>
          <div className="advanced-stat-container">
            <strong>95%</strong>
            <span>Accuracy Rate</span>
          </div>
          <div className="advanced-stat-container">
            <strong>24/7</strong>
            <span>Premium Access</span>
          </div>
          <div className="advanced-stat-container">
            <strong>2</strong>
            <span>Expert Private Doctors</span>
          </div>
        </div>
        
        <div className="final-advanced-buttons-container">
          <button 
            onClick={() => navigate('/book-appointment')}
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
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);

  // Scroll Animation Effect - moved inside the component
  useEffect(() => {
    const handleScrollAnimation = () => {
      const elements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
      
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    // Initial check on mount
    handleScrollAnimation();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScrollAnimation);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScrollAnimation);
    };
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (storedUser && storedUser.id) {
        setLoading(true);
        try {
          const response = await fetch(`/api/auth/${storedUser.id}`);
          if (response.ok) {
            const currentUser = await response.json();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <div className="advanced-homepage-container">
      <section className="advanced-hero-section-container">
        <div className="hero-content-container">
          <div className="hero-text-container">
            <h1>HEAL-X</h1>
            <h2>{EMOJIS.rocket} Private Healthcare Excellence</h2>
            <p>Experience revolutionary AI-powered private healthcare with ARIA, featuring exclusive private consultations, BMI health tracking, auto-symptom analysis, and cutting-edge telehealth technology.</p>
            
            {user.name ? (
              <div className="welcome-user-advanced-container">
                <p>Welcome back, <strong>{user.name}</strong>! {EMOJIS.target}</p>
                {loading && <span className="loading-indicator-text">Syncing your data...</span>}
                <div className="user-health-summary-container">
                  <div className="health-metric-container">
                    <span className="metric-value-text">98%</span>
                    <span className="metric-label-text">Health Score</span>
                  </div>
                  <div className="health-metric-container">
                    <span className="metric-value-text">2</span>
                    <span className="metric-label-text">Private Appointments</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="dashboard-btn-container"
                >
                  {EMOJIS.target} View Private Health Dashboard
                </button>
              </div>
            ) : (
              <div className="auth-prompt-advanced-container">
                <p>Join our exclusive private healthcare community</p>
                <div className="auth-features-container">
                  <span>{EMOJIS.sparkles} Private AI Assistant</span>
                  <span>{EMOJIS.scale} BMI Health Tracking</span>
                  <span>{EMOJIS.phoneIcon} Premium Monitoring</span>
                </div>
                <div className="auth-buttons-container">
                  <button 
                    onClick={() => navigate('/register')}
                    className="auth-btn primary-advanced"
                  >
                    {EMOJIS.rocket} Start Private Healthcare Journey
                  </button>
                  <button 
                    onClick={() => navigate('/Login')}
                    className="auth-btn secondary-advanced"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
            
            <div className="advanced-cta-buttons-container">
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
          
          <div className="hero-ai-features-container">
            <div className="ai-feature-card-container">
              <FaRobot className="ai-icon" />
              <h4>ARIA AI Assistant</h4>
              <p>Auto-symptom analysis as you type</p>
            </div>
            <div className="ai-feature-card-container">
              <FaWeight className="ai-icon" />
              <h4>BMI Health Tracker</h4>
              <p>Instant health status assessment</p>
            </div>
            <div className="ai-feature-card-container">
              <FaShieldAlt className="ai-icon" />
              <h4>Private Care</h4>
              <p>Exclusive healthcare access</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bmi-calculator-section-container scroll-animate">
        <div className="bmi-section-content-container scroll-animate">
          <h2>{EMOJIS.scale} BMI Health Assessment</h2>
          <p className="bmi-section-subtitle-text">Calculate your BMI and get personalized health recommendations</p>
          <BMICalculator />
        </div>
      </section>

      <section className="ai-assessment-section-container scroll-animate">
        <div className="assessment-section-content-container scroll-animate">
          <h2>{EMOJIS.robot} AI Health Risk Assessment</h2>
          <p className="assessment-section-subtitle-text">Get personalized health insights with our advanced AI analysis</p>
          <AIHealthRiskAssessment />
        </div>
      </section>

      <section className="live-status-section-container scroll-animate">
        <div className="status-section-content-container scroll-animate">
          <h2>{EMOJIS.hospital} Private Healthcare Status</h2>
          <p className="status-section-subtitle-text">Real-time private facility capacity and availability updates</p>
          <LiveHospitalStatus />
        </div>
      </section>

      <section className="doctor-availability-section-container scroll-animate">
        <div className="availability-section-content-container scroll-animate">
          <h2>{EMOJIS.calendar} Private Doctor Availability</h2>
          <p className="availability-section-subtitle-text">Find and book appointments with our exclusive private specialists</p>
          <AdvancedDoctorAvailability />
        </div>
      </section>

      <AdvancedServices />
      <FeaturedDoctors />
      <FeaturesShowcase />
      <AIFaqSection />
      <FinalAdvancedCTA />
      <AdvancedFloatingChatbot />
    </div>
  );
};

export default Homepage;