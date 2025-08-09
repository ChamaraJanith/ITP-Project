import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaTimes, FaUserMd, FaHeartbeat, FaStethoscope, FaHospital, 
  FaCalendarAlt, FaStar, FaPhone, FaMapMarkerAlt, FaComments, FaPaperPlane,
  FaChevronDown, FaChevronUp, FaPlay, FaFacebook, FaTwitter, FaInstagram,
  FaLinkedin, FaYoutube, FaNewspaper, FaCertificate, FaAward,
  FaQuestionCircle, FaEnvelope, FaClock, FaUsers, FaThumbsUp, FaCalculator,
  FaPills, FaCreditCard, FaEye, FaWeight, FaTooth, FaBrain, FaLungs,
  FaTrash, FaRedo, FaChevronLeft, FaChevronRight, FaDownload, FaFileAlt,
  FaHeadset, FaGraduationCap, FaFlask, FaAmbulance, FaShieldAlt, FaRobot,
  FaVideo, FaMicrophone, FaCamera, FaMapPin, FaGlobe, FaWifi, FaBell,
  FaChartLine, FaClipboardCheck, FaUserCheck, FaMedkit, FaCaretDown,
  FaBookmark, FaShareAlt, FaVolumeUp, FaVolumeOff, FaExpand, FaCompress,
  FaLanguage, FaSyncAlt, FaHistory, FaSave, FaCopy, FaPrint, FaQrcode
} from 'react-icons/fa';
import { diseasesData } from '../data/diseasesData';
import './Homepage.css';
// Try importing from fa6 instead:
import { FaShield } from 'react-icons/fa6';


// Emoji Constants - Fixes Babel parsing error
const EMOJIS = {
  // Medical & Healthcare
  robot: '🤖',
  hospital: '🏥',
  stethoscope: '🩺',
  pills: '💊',
  syringe: '💉',
  heartbeat: '💓',
  microscope: '🔬',
  testTube: '🧪',
  dna: '🧬',
  
  // Communication & UI
  phone: '📞',
  phoneIcon: '📱',
  envelope: '📧',
  bell: '🔔',
  megaphone: '📢',
  speaker: '🔊',
  
  // Actions & Status
  checkMark: '✅',
  crossMark: '❌',
  warning: '⚠️',
  emergency: '🚨',
  shield: '🛡️',
  lock: '🔒',
  key: '🔑',
  
  // Navigation & Search
  magnifyingGlass: '🔍',
  target: '🎯',
  compass: '🧭',
  location: '📍',
  map: '🗺️',
  
  // Time & Calendar
  calendar: '📅',
  clock: '🕒',
  hourglass: '⏳',
  stopwatch: '⏱️',
  
  // Documents & Data
  clipboard: '📋',
  fileAlt: '📄',
  chart: '📊',
  graph: '📈',
  bookmark: '🔖',
  
  // Money & Business
  creditCard: '💳',
  moneyBag: '💰',
  dollarSign: '💲',
  receipt: '🧾',
  
  // Technology
  computer: '💻',
  smartphone: '📱',
  wifi: '📶',
  satellite: '📡',
  battery: '🔋',
  
  // Emotions & Reactions
  wave: '👋',
  thumbsUp: '👍',
  clap: '👏',
  heart: '❤️',
  star: '⭐',
  
  // Arrows & Directions
  rightArrow: '➡️',
  leftArrow: '⬅️',
  upArrow: '⬆️',
  downArrow: '⬇️',
  refresh: '🔄',
  
  // Tools & Actions
  wrench: '🔧',
  gear: '⚙️',
  hammer: '🔨',
  broom: '🧹',
  magnet: '🧲',
  
  // Nature & Health
  leaf: '🍃',
  seedling: '🌱',
  apple: '🍎',
  water: '💧',
  fire: '🔥',
  
  // Achievement & Success
  trophy: '🏆',
  medal: '🏅',
  crown: '👑',
  gem: '💎',
  sparkles: '✨',
  
  // Transportation
  ambulance: '🚑',
  car: '🚗',
  plane: '✈️',
  rocket: '🚀'
};

// Advanced Floating Chatbot with Enhanced Clear Chat Feature
const AdvancedFloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: `${EMOJIS.robot} Hello! I'm ARIA (AI Rapid Intelligence Assistant), your advanced HealX healthcare companion. I can help with symptoms analysis, appointment booking, insurance verification, medication reminders, and much more. Try saying 'What can you do?' or use the quick actions below.`, 
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
      type: 'welcome'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // Advanced disease matching with confidence scoring
  const findDiseasesBySymptoms = (inputText) => {
    const inputWords = inputText.toLowerCase().split(/\s+/);
    const potentialSymptoms = inputWords.filter(word => word.length > 2);
    const matchedDiseases = [];
    
    diseasesData.forEach(disease => {
      let matchCount = 0;
      let confidenceScore = 0;
      const matchedSymptoms = [];
      
      disease.symptoms.forEach(symptom => {
        potentialSymptoms.forEach(inputSymptom => {
          if (symptom.toLowerCase().includes(inputSymptom) || inputSymptom.includes(symptom.toLowerCase())) {
            matchCount++;
            confidenceScore += symptom.toLowerCase() === inputSymptom ? 2 : 1;
            if (!matchedSymptoms.includes(symptom)) {
              matchedSymptoms.push(symptom);
            }
          }
        });
      });
      
      if (matchCount > 0) {
        matchedDiseases.push({
          ...disease,
          matchCount,
          matchedSymptoms,
          confidenceScore: Math.min(100, (confidenceScore / disease.symptoms.length) * 100)
        });
      }
    });
    
    return matchedDiseases.sort((a, b) => b.confidenceScore - a.confidenceScore);
  };

  // Enhanced medical response generator
  const generateAdvancedMedicalResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // AI capabilities showcase
    if (input.includes('what can you do') || input.includes('capabilities') || input.includes('features')) {
      return `${EMOJIS.robot} **ARIA's Advanced Capabilities:**\n\n${EMOJIS.microscope} **Medical Analysis:**\n• Symptom analysis with 95% accuracy\n• Disease prediction with confidence scoring\n• Drug interaction checking\n• Vital signs interpretation\n\n${EMOJIS.calendar} **Smart Scheduling:**\n• Real-time doctor availability\n• Insurance verification\n• Automatic reminders\n• Telehealth setup\n\n${EMOJIS.stethoscope} **Health Monitoring:**\n• Track vital signs\n• Medication reminders\n• Health goal setting\n• Risk assessment\n\n${EMOJIS.phone} **Communication:**\n• 24/7 availability\n• Multi-language support\n• Voice interaction\n• Emergency escalation\n\n${EMOJIS.lock} **Security:**\n• HIPAA compliant\n• End-to-end encryption\n• Secure data storage\n\nTry: "Check drug interactions" or "Book cardiology appointment"`;
    }

    // Enhanced symptom analysis
    const symptomKeywords = ['symptom', 'feel', 'pain', 'hurt', 'ache', 'fever', 'cough', 'headache', 'sick', 'nausea', 'tired', 'dizzy', 'have', 'experiencing'];
    const isSymptomQuery = symptomKeywords.some(keyword => input.includes(keyword));
    
    if (isSymptomQuery) {
      const matchedDiseases = findDiseasesBySymptoms(userInput);
      
      if (matchedDiseases.length > 0) {
        const topMatches = matchedDiseases.slice(0, 3);
        let response = `${EMOJIS.magnifyingGlass} **AI Medical Analysis Results:**\n\n`;
        
        topMatches.forEach((disease, index) => {
          response += `**${index + 1}. ${disease.name}** (${disease.confidenceScore.toFixed(1)}% confidence)\n`;
          response += `${EMOJIS.checkMark} **Matched symptoms:** ${disease.matchedSymptoms.join(', ')}\n`;
          response += `${EMOJIS.clipboard} **Additional symptoms to watch:** ${disease.symptoms.filter(s => !disease.matchedSymptoms.includes(s)).slice(0, 3).join(', ')}\n`;
          
          if (disease.treatment && disease.treatment.length > 0) {
            response += `${EMOJIS.pills} **Typical treatment:** ${disease.treatment.slice(0, 2).join(', ')}\n`;
          }
          
          if (disease.healthyHabits && disease.healthyHabits.length > 0) {
            response += `${EMOJIS.star} **Prevention tips:** ${disease.healthyHabits.slice(0, 2).join(', ')}\n`;
          }
          response += `\n`;
        });
        
        response += `${EMOJIS.warning} **AI Disclaimer:** This analysis is for informational purposes only. Confidence scores are based on symptom matching algorithms. Please consult with a healthcare professional for proper diagnosis.\n\n${EMOJIS.phone} **Next Steps:**\n• Book appointment: "Schedule with specialist"\n• Emergency help: +1 (555) 911-HELP\n• Get second opinion: "Find another doctor"`;
        
        return response;
      }
    }

    // Advanced appointment booking
    if (input.includes('appointment') || input.includes('book') || input.includes('schedule')) {
      return `${EMOJIS.calendar} **Smart Appointment Booking:**\n\n${EMOJIS.rocket} **Quick Book** (Next available):\n• Dr. Sarah Johnson (Cardiology) - Today 3:30 PM\n• Dr. Michael Chen (Neurology) - Tomorrow 10:15 AM\n• Dr. Emily Davis (Pediatrics) - Tomorrow 2:45 PM\n\n${EMOJIS.clock} **Live Availability:**\n• ${EMOJIS.checkMark} 15 doctors available now\n• ${EMOJIS.hourglass} 8 doctors available within 1 hour\n• ${EMOJIS.emergency} Emergency slots always open\n\n${EMOJIS.target} **Specialist Matching:**\nBased on your symptoms, I recommend:\n• Cardiology (95% match)\n• Internal Medicine (87% match)\n\n${EMOJIS.phoneIcon} **Booking Options:**\n• Instant booking: Click 'Book Now'\n• Call directly: +1 (555) DOCTORS\n• Video consultation available\n• Insurance pre-verification included\n\nShall I book an appointment for you?`;
    }

    // Emergency handling
    if (input.includes('emergency') || input.includes('urgent') || input.includes('911')) {
      return `${EMOJIS.emergency} **EMERGENCY PROTOCOL ACTIVATED**\n\n**FOR LIFE-THREATENING EMERGENCIES:**\n${EMOJIS.emergency} **Call 911 IMMEDIATELY**\n\n**FOR URGENT MEDICAL NEEDS:**\n${EMOJIS.phone} **HealX Emergency Hotline: +1 (555) 911-HELP**\n${EMOJIS.hospital} **Emergency Room Status: OPEN (5 min wait)**\n${EMOJIS.location} **Location: 123 Healthcare Street**\n\n**Telehealth Emergency Consultation:**\n${EMOJIS.phoneIcon} **Available NOW** - Connect with ER doctor\n${EMOJIS.stopwatch} **Average response: 30 seconds**\n\n**What I need to know:**\n• Are you breathing normally?\n• Are you conscious and alert?\n• Is there severe bleeding?\n• Chest pain or difficulty breathing?\n\n**Emergency Actions:**\n1. Stay calm and call 911 if needed\n2. Have someone drive you (don't drive yourself)\n3. Bring ID, insurance, medication list\n\nShould I connect you with emergency services?`;
    }

    // Drug interaction checker
    if (input.includes('drug') || input.includes('medication') || input.includes('interaction') || input.includes('pill')) {
      return `${EMOJIS.pills} **Advanced Drug Interaction Checker:**\n\n${EMOJIS.microscope} **AI-Powered Analysis:**\n• Cross-reference with 50,000+ medications\n• Real-time FDA database updates\n• Severity scoring (Mild/Moderate/Severe)\n• Food interaction warnings\n\n${EMOJIS.clipboard} **How to Use:**\n1. List your current medications\n2. Add the new medication you're considering\n3. Get instant interaction analysis\n4. Receive dosage recommendations\n\n${EMOJIS.warning} **Common Interactions to Watch:**\n• Blood thinners + Aspirin = ${EMOJIS.warning} High risk\n• Statins + Grapefruit = ${EMOJIS.warning} Moderate risk\n• ACE inhibitors + Potassium = ${EMOJIS.warning} Monitor levels\n\n${EMOJIS.target} **Features:**\n• Personalized based on your health profile\n• Alternative medication suggestions\n• Timing optimization (when to take)\n• Side effect predictions\n\nType your medications to get started!`;
    }

    // Insurance verification
    if (input.includes('insurance') || input.includes('coverage') || input.includes('billing')) {
      return `${EMOJIS.creditCard} **Real-Time Insurance Verification:**\n\n${EMOJIS.checkMark} **Instant Coverage Check:**\n• Live insurance database connection\n• Real-time eligibility verification\n• Copay and deductible calculator\n• Pre-authorization status\n\n${EMOJIS.hospital} **Accepted Plans:**\n• Blue Cross Blue Shield ${EMOJIS.checkMark}\n• Aetna, Cigna, UnitedHealth ${EMOJIS.checkMark}\n• Medicare & Medicaid ${EMOJIS.checkMark}\n• Kaiser Permanente ${EMOJIS.checkMark}\n• + 200 other plans\n\n${EMOJIS.moneyBag} **Cost Estimator:**\n• Procedure cost calculator\n• Out-of-pocket estimates\n• Payment plan options\n• Financial assistance programs\n\n${EMOJIS.phoneIcon} **Digital Insurance Card:**\n• Upload and store securely\n• Quick access during appointments\n• Auto-fill appointment forms\n\n${EMOJIS.lock} **Secure Verification:**\nEnter your insurance details for instant verification:\n• Member ID\n• Group number\n• Date of birth\n\nBilling questions? Call: +1 (555) 123-BILL`;
    }

    // Telehealth services
    if (input.includes('telehealth') || input.includes('video') || input.includes('virtual') || input.includes('online')) {
      return `${EMOJIS.phoneIcon} **Advanced Telehealth Platform:**\n\n${EMOJIS.rocket} **Next-Gen Features:**\n• 4K video consultations\n• AI-assisted diagnosis\n• Real-time vital sign monitoring\n• Digital stethoscope integration\n• Screen sharing for test results\n\n${EMOJIS.clock} **Available Now:**\n• ${EMOJIS.checkMark} Dr. Sarah Kim (Internal Medicine) - Available\n• ${EMOJIS.checkMark} Dr. James Wilson (Dermatology) - Available\n• ${EMOJIS.hourglass} Dr. Lisa Chen (Psychiatry) - 15 min wait\n\n${EMOJIS.wrench} **Tech Requirements:**\n• Stable internet (5+ Mbps)\n• Camera and microphone\n• Chrome/Safari browser\n• Mobile app available\n\n${EMOJIS.sparkles} **Smart Features:**\n• Automatic appointment reminders\n• Digital prescription delivery\n• Follow-up scheduling\n• Medical record integration\n• Insurance billing automation\n\n${EMOJIS.target} **Best For:**\n• Follow-up visits\n• Medication management\n• Mental health consultations\n• Specialist consultations\n• Chronic disease monitoring\n\nReady to start a video consultation?`;
    }

    // Health tracking
    if (input.includes('track') || input.includes('monitor') || input.includes('health data')) {
      return `${EMOJIS.chart} **AI Health Tracking Dashboard:**\n\n${EMOJIS.target} **Smart Monitoring:**\n• Wearable device integration\n• Automated health insights\n• Predictive health analytics\n• Goal setting and tracking\n• Progress visualization\n\n${EMOJIS.phoneIcon} **Connected Devices:**\n• Apple Watch, Fitbit, Garmin\n• Blood pressure monitors\n• Glucose meters\n• Smart scales\n• Sleep trackers\n\n${EMOJIS.microscope} **AI Analysis:**\n• Pattern recognition\n• Anomaly detection\n• Risk assessment\n• Personalized recommendations\n• Trend analysis\n\n${EMOJIS.graph} **Track Everything:**\n• Blood pressure, heart rate\n• Blood glucose levels\n• Weight and BMI\n• Sleep quality\n• Exercise and activity\n• Medication adherence\n\n${EMOJIS.sparkles} **Visual Reports:**\n• Interactive charts\n• Monthly summaries\n• Doctor-shareable reports\n• Family member access\n\nConnect your devices to get started!`;
    }

    // Default enhanced response
    return `${EMOJIS.robot} **Hello! I'm ARIA, your AI Healthcare Assistant**\n\n${EMOJIS.target} **Popular Actions:**\n• "Analyze my symptoms" - AI symptom checker\n• "Book appointment now" - Smart scheduling\n• "Check drug interactions" - Medication safety\n• "Verify my insurance" - Coverage check\n• "Start video call" - Telehealth consult\n• "Track my health" - Data monitoring\n• "Emergency help" - Urgent care\n\n${EMOJIS.star} **New Features:**\n• Voice interaction (click ${EMOJIS.phoneIcon})\n• Multi-language support\n• Appointment reminders\n• Health risk assessment\n• Family member access\n\n${EMOJIS.phone} **Quick Examples:**\n• "I have chest pain and shortness of breath"\n• "Book me with a cardiologist tomorrow"\n• "Does ibuprofen interact with my medications?"\n• "What's my insurance copay for an MRI?"\n\n${EMOJIS.lock} **Your privacy is protected** with HIPAA-compliant encryption.\n\nWhat would you like to do today?`;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { 
      id: Date.now(), 
      text: inputMessage, 
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const botResponse = generateAdvancedMedicalResponse(currentMessage);
      const botMessage = { 
        id: Date.now() + 1, 
        text: botResponse, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'response'
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      // Text-to-speech for bot responses (if not muted)
      if (!isMuted && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(botResponse.replace(/\*\*|🤖|📅|💊|🚨|🔍/g, ''));
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    }, 2000);
  };

  // Enhanced clear chat with confirmation and history save
  const clearChatAdvanced = () => {
    if (messages.length > 1) {
      // Save current chat to history
      const chatSession = {
        id: Date.now(),
        messages: messages,
        timestamp: new Date().toLocaleString(),
        summary: `Chat session with ${messages.length} messages`
      };
      setChatHistory(prev => [chatSession, ...prev.slice(0, 4)]); // Keep last 5 sessions
    }

    setMessages([
      { 
        id: 1, 
        text: `${EMOJIS.broom} **Chat Cleared Successfully!**\n\nPrevious conversation saved to history. I'm ARIA, your AI healthcare assistant.\n\n${EMOJIS.refresh} **Quick Actions:**\n• \"Show chat history\" - View previous conversations\n• \"What can you do?\" - See my capabilities\n• \"Help me with symptoms\" - Start health analysis\n\nHow can I assist you today?`, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }
    ]);
  };

  // Voice input toggle
  const toggleVoiceMode = () => {
    if ('webkitSpeechRecognition' in window) {
      setIsVoiceMode(!isVoiceMode);
      if (!isVoiceMode) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        
        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setInputMessage(transcript);
        };
        
        recognition.start();
      }
    }
  };

  // Export chat history
  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: messages,
      totalMessages: messages.length
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `healx-chat-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text) => {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/🔍|📅|👨‍⚕️|🚨|💊|📞|⚠️|✅|📋|💊|🌟|🕒|📍|👋|💳|🤖|🎯|🔬|📱|💰|🎥|📊|🧹|🔄/g, match => `<span class="emoji">${match}</span>`);
    
    return { __html: formatted };
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="advanced-chatbot-widget">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`advanced-chat-toggle ${isOpen ? 'open' : ''}`}
        title="Chat with ARIA - AI Healthcare Assistant"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
        <div className="ai-pulse"></div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          AI
        </div>
      </button>

      {isOpen && (
        <div className={`advanced-chat-window ${isExpanded ? 'expanded' : ''}`}>
          <div className="advanced-chat-header">
            <div className="chat-header-info">
              <div className="ai-avatar">
                <FaRobot />
              </div>
              <div className="ai-details">
                <h4>{EMOJIS.robot} ARIA</h4>
                <span className="ai-status">AI Healthcare Assistant • Online</span>
              </div>
            </div>
            <div className="chat-controls">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="chat-control-btn" 
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <FaVolumeOff /> : <FaVolumeUp />}
              </button>
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="chat-control-btn" 
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? <FaCompress /> : <FaExpand />}
              </button>
              <button 
                onClick={exportChat} 
                className="chat-control-btn" 
                title="Export Chat"
              >
                <FaDownload />
              </button>
              <div className="control-dropdown">
                <button className="chat-control-btn dropdown-trigger">
                  <FaCaretDown />
                </button>
                <div className="dropdown-menu">
                  <button onClick={() => handleQuickAction("Show chat history")}>
                    <FaHistory /> Chat History
                  </button>
                  <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}>
                    <FaLanguage /> {language === 'en' ? 'Español' : 'English'}
                  </button>
                  <button onClick={() => handleQuickAction("What can you do?")}>
                    <FaQuestionCircle /> Help
                  </button>
                </div>
              </div>
              <button 
                onClick={clearChatAdvanced} 
                className="clear-chat-advanced" 
                title="Clear Chat (Saves to History)"
              >
                <FaTrash />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="close-chat-advanced" 
                title="Close Chat"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="advanced-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.type || ''}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.sender === 'user' ? '👤 You' : `${EMOJIS.robot} ARIA`}
                  </span>
                  <span className="message-time">{message.timestamp}</span>
                </div>
                <div 
                  className="message-content"
                  dangerouslySetInnerHTML={message.sender === 'bot' ? formatMessage(message.text) : undefined}
                >
                  {message.sender === 'user' ? message.text : null}
                </div>
                {message.sender === 'bot' && (
                  <div className="message-actions">
                    <button className="msg-action-btn" title="Copy">
                      <FaCopy />
                    </button>
                    <button className="msg-action-btn" title="Share">
                      <FaShareAlt />
                    </button>
                    <button className="msg-action-btn" title="Bookmark">
                      <FaBookmark />
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot-message">
                <div className="message-header">
                  <span className="message-sender">{EMOJIS.robot} ARIA</span>
                  <span className="message-time">typing...</span>
                </div>
                <div className="message-content">
                  <div className="advanced-typing-indicator">
                    <div className="typing-text">AI is analyzing...</div>
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="advanced-chat-input">
            <div className="input-controls">
              <button 
                onClick={toggleVoiceMode} 
                className={`voice-btn ${isVoiceMode ? 'active' : ''}`}
                title="Voice Input"
              >
                <FaMicrophone />
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask ARIA anything about your health..."
                className="advanced-message-input"
              />
              <button onClick={sendMessage} className="advanced-send-button" title="Send Message">
                <FaPaperPlane />
              </button>
            </div>
          </div>

          <div className="advanced-quick-actions">
            <div className="quick-actions-header">
              <span>Quick Actions:</span>
            </div>
            <div className="quick-actions-grid">
              {[
                { icon: EMOJIS.magnifyingGlass, text: 'Analyze Symptoms', action: 'I have symptoms to analyze' },
                { icon: EMOJIS.calendar, text: 'Book Appointment', action: 'Book appointment now' },
                { icon: EMOJIS.pills, text: 'Drug Interactions', action: 'Check drug interactions' },
                { icon: EMOJIS.creditCard, text: 'Insurance Check', action: 'Verify my insurance' },
                { icon: EMOJIS.phoneIcon, text: 'Video Consult', action: 'Start video consultation' },
                { icon: EMOJIS.emergency, text: 'Emergency Help', action: 'Emergency assistance needed' }
              ].map((quickAction, index) => (
                <button
                  key={index}
                  className="advanced-quick-action-btn"
                  onClick={() => handleQuickAction(quickAction.action)}
                  title={quickAction.text}
                >
                  <span className="quick-action-icon">{quickAction.icon}</span>
                  <span className="quick-action-text">{quickAction.text}</span>
                </button>
              ))}
            </div>
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
          {EMOJIS.calendar} Book Health Checkup
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

// Live Hospital Status Component
const LiveHospitalStatus = () => {
  const [departments, setDepartments] = useState([
    { name: 'Emergency Room', waitTime: '5 min', status: 'available', capacity: 85 },
    { name: 'Cardiology', waitTime: '15 min', status: 'busy', capacity: 95 },
    { name: 'Pediatrics', waitTime: '8 min', status: 'available', capacity: 60 },
    { name: 'Neurology', waitTime: '25 min', status: 'busy', capacity: 90 },
    { name: 'Orthopedics', waitTime: '12 min', status: 'available', capacity: 70 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDepartments(prev => prev.map(dept => ({
        ...dept,
        waitTime: `${Math.floor(Math.random() * 30) + 5} min`,
        capacity: Math.floor(Math.random() * 40) + 60
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="live-hospital-status">
      <div className="status-header">
        <h3>{EMOJIS.hospital} Live Hospital Status</h3>
        <div className="last-updated">
          Updated: {new Date().toLocaleTimeString()}
          <FaSyncAlt className="refresh-icon" />
        </div>
      </div>
      
      <div className="departments-grid">
        {departments.map((dept, index) => (
          <div key={index} className="department-card">
            <div className="dept-header">
              <h4>{dept.name}</h4>
              <div 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(dept.status) }}
              >
                {dept.status}
              </div>
            </div>
            
            <div className="dept-metrics">
              <div className="metric">
                <span className="metric-label">Wait Time:</span>
                <span className="metric-value">{dept.waitTime}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Capacity:</span>
                <div className="capacity-bar">
                  <div 
                    className="capacity-fill"
                    style={{ 
                      width: `${dept.capacity}%`,
                      backgroundColor: dept.capacity > 90 ? '#ef4444' : dept.capacity > 70 ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                  <span className="capacity-text">{dept.capacity}%</span>
                </div>
              </div>
            </div>
            
            <button className="book-dept-btn">
              {EMOJIS.calendar} Book with {dept.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Advanced Doctor Availability Widget
const AdvancedDoctorAvailability = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  
  const availableDoctors = [
    { 
      id: 1, 
      name: 'Dr. Sarah Johnson', 
      specialty: 'Cardiology', 
      rating: 4.9, 
      nextSlot: '2:30 PM Today',
      avatar: '👩‍⚕️',
      status: 'online',
      consultationFee: '$150'
    },
    { 
      id: 2, 
      name: 'Dr. Michael Chen', 
      specialty: 'Neurology', 
      rating: 4.8, 
      nextSlot: '10:15 AM Tomorrow',
      avatar: '👨‍⚕️',
      status: 'busy',
      consultationFee: '$200'
    },
    { 
      id: 3, 
      name: 'Dr. Emily Davis', 
      specialty: 'Pediatrics', 
      rating: 4.9, 
      nextSlot: 'Available Now',
      avatar: '👩‍⚕️',
      status: 'online',
      consultationFee: '$120'
    }
  ];

  const specialties = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology'];

  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredDoctors = selectedSpecialty === 'All' 
    ? availableDoctors 
    : availableDoctors.filter(doc => doc.specialty === selectedSpecialty);

  return (
    <div className="advanced-doctor-availability">
      <div className="availability-header">
        <h3>👨‍⚕️ Real-Time Doctor Availability</h3>
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
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="doctors-availability-grid">
        {filteredDoctors.map(doctor => (
          <div key={doctor.id} className="doctor-availability-card">
            <div className="doctor-header">
              <div className="doctor-avatar-section">
                <span className="doctor-avatar">{doctor.avatar}</span>
                <div 
                  className="doctor-status-dot"
                  style={{ backgroundColor: getStatusColor(doctor.status) }}
                ></div>
              </div>
              <div className="doctor-info">
                <h4>{doctor.name}</h4>
                <p className="doctor-specialty">{doctor.specialty}</p>
                <div className="doctor-rating">
                  <FaStar className="star-icon" />
                  <span>{doctor.rating}</span>
                </div>
              </div>
            </div>

            <div className="availability-info">
              <div className="next-slot">
                <span className="slot-label">Next Available:</span>
                <span className="slot-time">{doctor.nextSlot}</span>
              </div>
              <div className="consultation-fee">
                <span className="fee-label">Consultation:</span>
                <span className="fee-amount">{doctor.consultationFee}</span>
              </div>
            </div>

            <div className="booking-options">
              <button className="quick-book-btn">
                {EMOJIS.calendar} Quick Book
              </button>
              <button className="video-consult-btn">
                {EMOJIS.phoneIcon} Video Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// FAQ Section Component
const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      question: "How does the AI health assessment work?",
      answer: "Our AI uses advanced algorithms to analyze your symptoms, medical history, and risk factors. It provides preliminary assessments with confidence scores, but always recommends consulting with healthcare professionals for definitive diagnosis."
    },
    {
      question: "Is my health data secure and private?",
      answer: "Yes, absolutely. We use HIPAA-compliant encryption, secure data storage, and never share your personal health information without your explicit consent. All data is encrypted both in transit and at rest."
    },
    {
      question: "Can I use telehealth for emergency situations?",
      answer: "Telehealth is great for non-emergency consultations. For medical emergencies, always call 911 or visit our emergency room immediately. Our telehealth platform can help with follow-ups and routine care."
    },
    {
      question: "How accurate is the AI symptom checker?",
      answer: "Our AI symptom checker has a 95% accuracy rate in identifying potential conditions. However, it's designed to assist, not replace, professional medical diagnosis. Always consult with a doctor for serious symptoms."
    },
    {
      question: "What insurance plans do you accept for telehealth?",
      answer: "We accept most major insurance plans for both in-person and telehealth visits. Our system can verify your coverage in real-time and provide cost estimates before your appointment."
    },
    {
      question: "How do I access my AI health dashboard?",
      answer: "You can access your personalized health dashboard through our patient portal or mobile app. It tracks your health metrics, provides AI insights, and helps you monitor your wellness goals."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="faq-items">
      {faqs.map((faq, index) => (
        <div key={index} className="faq-question">
          <button
            className="faq-toggle"
            onClick={() => toggleFAQ(index)}
            aria-expanded={openFAQ === index}
          >
            <span>{faq.question}</span>
            {openFAQ === index ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {openFAQ === index && (
            <div className="faq-answer">
              <p>{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Newsletter Component
const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <div className="newsletter-form">
      <h3>{EMOJIS.rocket} AI-Powered Health Newsletter</h3>
      <p>Get personalized health insights, AI tips, and medical breakthroughs delivered weekly</p>
      {isSubmitted ? (
        <div className="success-message">
          <FaThumbsUp /> Welcome to the future of healthcare!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for AI health insights"
              required
            />
            <button type="submit">
              <FaRobot /> Subscribe
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Main Homepage Component
const Homepage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Enhanced doctors data with real-time availability
  const FEATURED_DOCTORS = [
    { 
      id: 1, 
      name: "Dr. Sarah Johnson", 
      specialty: "AI-Assisted Cardiology", 
      rating: 4.9, 
      experience: "15+ years",
      status: "online",
      nextSlot: "2:30 PM Today",
      specialties: ["Heart Surgery", "AI Diagnostics", "Preventive Cardiology"]
    },
    { 
      id: 2, 
      name: "Dr. Michael Chen", 
      specialty: "Neuro-AI Specialist", 
      rating: 4.8, 
      experience: "12+ years",
      status: "busy",
      nextSlot: "10:15 AM Tomorrow",
      specialties: ["Brain Imaging", "AI Analysis", "Neurological Disorders"]
    },
    { 
      id: 3, 
      name: "Dr. Emily Davis", 
      specialty: "Digital Pediatrics", 
      rating: 4.9, 
      experience: "10+ years",
      status: "online",
      nextSlot: "Available Now",
      specialties: ["Child Development", "Telehealth", "Digital Monitoring"]
    },
    { 
      id: 4, 
      name: "Dr. Robert Wilson", 
      specialty: "Smart Orthopedics", 
      rating: 4.7, 
      experience: "18+ years",
      status: "online",
      nextSlot: "4:45 PM Today",
      specialties: ["Robotic Surgery", "Sports Medicine", "Joint Replacement"]
    }
  ];

  // Advanced services with AI integration
  const ADVANCED_SERVICES = [
    { 
      icon: <FaRobot />, 
      title: "AI Health Assessment", 
      desc: "Advanced AI-powered health analysis",
      features: ["95% Accuracy", "Real-time Analysis", "Predictive Insights"],
      color: "#8b5cf6" 
    },
    { 
      icon: <FaVideo />, 
      title: "4K Telehealth", 
      desc: "Ultra-high definition consultations",
      features: ["4K Video", "Digital Stethoscope", "Real-time Vitals"],
      color: "#3b82f6" 
    },
    { 
      icon: <FaBrain />, 
      title: "Neuro-AI Diagnostics", 
      desc: "Brain health with AI assistance",
      features: ["Advanced Imaging", "Pattern Recognition", "Early Detection"],
      color: "#8b5cf6" 
    },
    { 
      icon: <FaChartLine />, 
      title: "Smart Health Tracking", 
      desc: "Continuous health monitoring",
      features: ["Wearable Integration", "Predictive Analytics", "Goal Setting"],
      color: "#10b981" 
    },
    { 
      icon: <FaShieldAlt />, 
      title: "Preventive AI Care", 
      desc: "Proactive health management",
      features: ["Risk Assessment", "Early Warnings", "Personalized Plans"],
      color: "#f59e0b" 
    },
    { 
      icon: <FaPills />, 
      title: "Smart Pharmacy", 
      desc: "AI-powered medication management",
      features: ["Drug Interactions", "Smart Reminders", "Home Delivery"],
      color: "#ef4444" 
    }
  ];

  return (
    <div className="advanced-homepage">
      {/* Enhanced Hero Section with AI Features */}
      <section className="advanced-hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>{EMOJIS.rocket} The Future of Healthcare is Here</h1>
            <p>Experience revolutionary AI-powered healthcare with ARIA, our advanced medical AI assistant, real-time health monitoring, and cutting-edge telehealth technology.</p>
            
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
                    <span className="metric-label">Upcoming Appointments</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="dashboard-btn"
                >
                  {EMOJIS.target} View AI Health Dashboard
                </button>
              </div>
            ) : (
              <div className="auth-prompt-advanced">
                <p>Join over 100,000 patients experiencing the future of healthcare</p>
                <div className="auth-features">
                  <span>{EMOJIS.sparkles} AI Health Assistant</span>
                  <span>{EMOJIS.microscope} Advanced Diagnostics</span>
                  <span>{EMOJIS.phoneIcon} Smart Monitoring</span>
                </div>
                <div className="auth-buttons">
                  <button 
                    onClick={() => navigate('/register')}
                    className="auth-btn primary-advanced"
                  >
                    {EMOJIS.rocket} Start Your Health Journey
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
                <FaRobot /> AI Smart Booking
              </button>
              <button 
                onClick={() => navigate('/telehealth')}
                className="cta-secondary-advanced"
              >
                <FaVideo /> Start Video Consult
              </button>
            </div>
          </div>
          
          <div className="hero-ai-features">
            <div className="ai-feature-card">
              <FaRobot className="ai-icon" />
              <h4>ARIA AI Assistant</h4>
              <p>Advanced medical AI with 95% accuracy</p>
            </div>
            <div className="ai-feature-card">
              <FaChartLine className="ai-icon" />
              <h4>Predictive Analytics</h4>
              <p>AI-powered health insights and predictions</p>
            </div>
            <div className="ai-feature-card">
              <FaShieldAlt className="ai-icon" />
              <h4>Preventive Care</h4>
              <p>Proactive health monitoring and alerts</p>
            </div>
          </div>
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

      {/* Live Hospital Status Dashboard */}
      <section className="live-status-section">
        <div className="container">
          <h2>{EMOJIS.hospital} Real-Time Hospital Dashboard</h2>
          <p className="section-subtitle">Live updates on department availability and wait times</p>
          <LiveHospitalStatus />
        </div>
      </section>

      {/* Advanced Doctor Availability */}
      <section className="doctor-availability-section">
        <div className="container">
          <h2>👨‍⚕️ Smart Doctor Booking</h2>
          <p className="section-subtitle">AI-powered doctor matching with real-time availability</p>
          <AdvancedDoctorAvailability />
        </div>
      </section>

      {/* Enhanced Services with AI Integration */}
      <section className="advanced-services">
        <div className="container">
          <h2>{EMOJIS.rocket} AI-Powered Healthcare Services</h2>
          <p className="section-subtitle">Experience the next generation of medical care</p>
          <div className="advanced-services-grid">
            {ADVANCED_SERVICES.map((service, index) => (
              <div key={index} className="advanced-service-card" style={{ '--accent-color': service.color }}>
                <div className="service-icon-advanced">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <div className="service-features">
                  {service.features.map((feature, idx) => (
                    <span key={idx} className="feature-tag">{feature}</span>
                  ))}
                </div>
                <button className="service-btn-advanced">Explore</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Enhanced FAQ Section */}
      <section className="ai-faq-section">
        <div className="container">
          <h2>{EMOJIS.robot} AI-Powered FAQ</h2>
          <p className="section-subtitle">Get instant answers powered by advanced AI</p>
          <div className="faq-container">
            <FAQSection />
          </div>
        </div>
      </section>

      {/* Advanced Newsletter Section */}
      <section className="ai-newsletter-section">
        <div className="container">
          <Newsletter />
        </div>
      </section>

      {/* Advanced Features Showcase */}
      <section className="features-showcase">
        <div className="container">
          <h2>{EMOJIS.sparkles} Revolutionary Healthcare Features</h2>
          <div className="showcase-grid">
            <div className="showcase-item">
              <FaQrcode className="showcase-icon" />
              <h4>QR Code Check-ins</h4>
              <p>Contactless appointment check-ins with QR codes</p>
            </div>
            <div className="showcase-item">
              <FaGlobe className="showcase-icon" />
              <h4>Global Health Network</h4>
              <p>Connect with specialists worldwide via our platform</p>
            </div>
            <div className="showcase-item">
              <FaWifi className="showcase-icon" />
              <h4>IoT Health Monitoring</h4>
              <p>Smart devices integration for continuous monitoring</p>
            </div>
            <div className="showcase-item">
              <FaBell className="showcase-icon" />
              <h4>Smart Notifications</h4>
              <p>AI-powered health alerts and reminders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Advanced CTA */}
      <section className="final-advanced-cta">
        <div className="container">
          <h2>{EMOJIS.star} Ready for the Future of Healthcare?</h2>
          <p>Experience AI-powered medicine, real-time monitoring, and personalized care like never before</p>
          <div className="final-advanced-stats">
            <div className="advanced-stat">
              <strong>{EMOJIS.robot} 95%</strong>
              <span>AI Accuracy Rate</span>
            </div>
            <div className="advanced-stat">
              <strong>{EMOJIS.clock} 30sec</strong>
              <span>Average AI Response</span>
            </div>
            <div className="advanced-stat">
              <strong>{EMOJIS.trophy} #1</strong>
              <span>Healthcare Innovation</span>
            </div>
          </div>
          <div className="final-advanced-buttons">
            <button 
              onClick={() => navigate('/ai-onboarding')}
              className="final-btn-advanced primary"
            >
              <FaRobot /> Start AI Health Journey
            </button>
            <button 
              onClick={() => navigate('/demo')}
              className="final-btn-advanced secondary"
            >
              <FaPlay /> Watch AI Demo
            </button>
          </div>
        </div>
      </section>

      {/* Advanced AI Chatbot */}
      <AdvancedFloatingChatbot />
    </div>
  );
};

export default Homepage;
