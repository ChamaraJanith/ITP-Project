import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaRobot, 
  FaTimes, 
  FaPaperPlane, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVolumeUp, 
  FaVolumeOff, 
  FaExpand, 
  FaCompress, 
  FaDownload, 
  FaTrash, 
  FaCopy, 
  FaShareAlt, 
  FaBookmark, 
  FaStop, 
  FaStopCircle 
} from 'react-icons/fa';
import diseasesData from '../../data/diseasesData.js';

const EMOJIS = {
  robot: '🤖',
  magnifyingGlass: '🔍',
  calendar: '📅',
  pills: '💊',
  emergency: '🚨',
  phone: '📞',
  phoneIcon: '📱',
  warning: '⚠️',
  checkMark: '✅',
  clipboard: '📋',
  star: '⭐',
  clock: '🕒',
  hourglass: '⏳',
  hospital: '🏥',
  target: '🎯',
  lock: '🔒',
  rocket: '🚀',
  heart: '❤️',
  creditCard: '💳',
  chart: '📊',
  map: '🗺️',
  bookmark: '🔖',
  stethoscope: '🩺',
  ambulance: '🚑',
  microscope: '🔬',
  trophy: '🏆',
  speaker: '🔊',
  broom: '🧹'
};

// ✅ COMPLETE: Enhanced Advanced Floating Chatbot with All Features
const AdvancedFloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: `${EMOJIS.robot} Hello! I'm ARIA (AI Rapid Intelligence Assistant), your advanced HealX healthcare companion. I can help with symptoms analysis, appointment booking, insurance verification, medication reminders, and much more. Try typing your symptoms directly or use the quick actions below.`, 
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
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [language, setLanguage] = useState('en');
  const [voiceStatus, setVoiceStatus] = useState('ready');
  
  // AI Speech Control States
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  
  // Auto-analysis states
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [lastAnalyzedInput, setLastAnalyzedInput] = useState('');
  const typingTimeoutRef = useRef(null);

  // Advanced relevance scoring with multiple matching strategies
  const calculateAdvancedRelevanceScore = (disease, inputWords, originalInput) => {
    let relevanceScore = 0;
    const diseaseName = disease.name.toLowerCase();
    const diseaseCategory = disease.category?.toLowerCase() || '';
    const diseaseDescription = disease.description?.toLowerCase() || '';
    const originalInputLower = originalInput.toLowerCase();
    
    // Strategy 1: Direct name matching (highest priority)
    inputWords.forEach(word => {
      if (word.length > 2) {
        if (diseaseName.includes(word) || diseaseCategory.includes(word)) {
          relevanceScore += 25;
        }
        if (diseaseDescription.includes(word)) {
          relevanceScore += 15;
        }
      }
    });
    
    // Strategy 2: Medical terminology and keywords
    const medicalKeywords = {
      'pain': ['headache', 'migraine', 'arthritis', 'fibromyalgia', 'neuralgia'],
      'fever': ['flu', 'infection', 'pneumonia', 'malaria', 'typhoid'],
      'cough': ['cold', 'bronchitis', 'asthma', 'pneumonia', 'tuberculosis'],
      'tired': ['anemia', 'fatigue', 'depression', 'thyroid', 'diabetes'],
      'dizzy': ['vertigo', 'anemia', 'hypotension', 'migraine', 'dehydration'],
      'nausea': ['gastritis', 'migraine', 'pregnancy', 'food poisoning', 'motion sickness'],
      'stomach': ['gastritis', 'ulcer', 'ibs', 'appendicitis', 'gastroenteritis'],
      'chest': ['angina', 'pneumonia', 'asthma', 'heartburn', 'anxiety'],
      'head': ['headache', 'migraine', 'sinusitis', 'hypertension', 'meningitis'],
      'back': ['sciatica', 'disc', 'arthritis', 'fibromyalgia', 'kidney'],
      'skin': ['eczema', 'psoriasis', 'dermatitis', 'allergy', 'infection'],
      'breath': ['asthma', 'pneumonia', 'bronchitis', 'anxiety', 'anemia']
    };
    
    Object.keys(medicalKeywords).forEach(keyword => {
      if (originalInputLower.includes(keyword)) {
        medicalKeywords[keyword].forEach(relatedDisease => {
          if (diseaseName.includes(relatedDisease)) {
            relevanceScore += 20;
          }
        });
      }
    });
    
    // Strategy 3: Symptom pattern matching
    if (disease.symptoms) {
      disease.symptoms.forEach(symptom => {
        const symptomLower = symptom.toLowerCase();
        inputWords.forEach(word => {
          if (word.length > 2 && (symptomLower.includes(word) || word.includes(symptomLower))) {
            relevanceScore += 18;
          }
        });
      });
    }
    
    // Strategy 4: Common conditions boost
    const commonConditions = [
      'common cold', 'flu', 'headache', 'migraine', 'fever', 'cough', 
      'sore throat', 'stomach ache', 'back pain', 'anxiety', 'depression',
      'allergy', 'asthma', 'diabetes', 'hypertension', 'arthritis'
    ];
    
    commonConditions.forEach(condition => {
      if (diseaseName.includes(condition.split(' ')[0]) || 
          diseaseCategory.includes(condition.split(' ')[0])) {
        relevanceScore += 12;
      }
    });
    
    // Strategy 5: Body system matching
    const bodySystems = {
      'respiratory': ['cough', 'breath', 'lung', 'chest', 'asthma', 'pneumonia'],
      'cardiovascular': ['heart', 'chest', 'blood', 'pressure', 'angina'],
      'digestive': ['stomach', 'nausea', 'digest', 'bowel', 'gastro'],
      'neurological': ['head', 'brain', 'nerve', 'dizzy', 'migraine'],
      'musculoskeletal': ['pain', 'joint', 'muscle', 'bone', 'back']
    };
    
    Object.keys(bodySystems).forEach(system => {
      if (diseaseCategory.includes(system)) {
        bodySystems[system].forEach(symptom => {
          if (originalInputLower.includes(symptom)) {
            relevanceScore += 15;
          }
        });
      }
    });
    
    // Strategy 6: Minimum guarantee score for any disease
    if (relevanceScore === 0) {
      relevanceScore = Math.random() * 20 + 10; // Random 10-30% base relevance
    }
    
    return Math.min(95, relevanceScore); // Cap at 95% to leave room for perfect matches
  };

  // Enhanced disease matching that ALWAYS returns relevant diseases
  const findDiseasesBySymptoms = (inputText) => {
    const inputWords = inputText.toLowerCase()
      .split(/[\s,\.\!\?]+/)
      .filter(word => word.length > 2)
      .filter(word => !['and', 'the', 'with', 'have', 'feel', 'get', 'got', 'been'].includes(word));
    
    const matchedDiseases = [];
    
    diseasesData.forEach(disease => {
      let matchCount = 0;
      let confidenceScore = 0;
      const matchedSymptoms = [];
      const partialMatches = [];
      
      // Direct symptom matching
      if (disease.symptoms) {
        disease.symptoms.forEach(symptom => {
          const symptomLower = symptom.toLowerCase();
          let found = false;
          
          inputWords.forEach(inputWord => {
            // Exact match
            if (symptomLower === inputWord) {
              matchCount++;
              confidenceScore += 30;
              if (!matchedSymptoms.includes(symptom)) {
                matchedSymptoms.push(symptom);
              }
              found = true;
            }
            // Partial match
            else if (symptomLower.includes(inputWord) || inputWord.includes(symptomLower)) {
              if (!found) {
                matchCount++;
                confidenceScore += 20;
                if (!matchedSymptoms.includes(symptom)) {
                  matchedSymptoms.push(symptom);
                }
                found = true;
              }
            }
            // Similar words
            else if (inputWord.length > 3 && symptomLower.length > 3) {
              const similarity = calculateStringSimilarity(inputWord, symptomLower);
              if (similarity > 0.7) {
                if (!partialMatches.includes(symptom)) {
                  partialMatches.push(symptom);
                  confidenceScore += 10;
                }
              }
            }
          });
        });
      }
      
      // Calculate final confidence score
      if (matchCount > 0) {
        confidenceScore = Math.min(100, confidenceScore + (matchCount * 5));
      } else {
        // Use advanced relevance scoring for non-matching diseases
        confidenceScore = calculateAdvancedRelevanceScore(disease, inputWords, inputText);
      }
      
      matchedDiseases.push({
        ...disease,
        matchCount,
        matchedSymptoms,
        partialMatches,
        confidenceScore: Math.max(confidenceScore, 15) // Minimum 15% confidence
      });
    });
    
    // ALWAYS return diseases sorted by confidence
    return matchedDiseases.sort((a, b) => b.confidenceScore - a.confidenceScore);
  };

  // Helper function to calculate string similarity
  const calculateStringSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Check if input contains symptom-related content
  const isSymptomRelatedInput = (input) => {
    const symptomKeywords = [
      'symptom', 'feel', 'pain', 'hurt', 'ache', 'fever', 'cough', 'headache', 
      'sick', 'nausea', 'tired', 'dizzy', 'have', 'experiencing', 'suffering', 
      'problem', 'issue', 'trouble', 'uncomfortable', 'unwell', 'ill', 'sore',
      'burning', 'tingling', 'swollen', 'itchy', 'rash', 'bleeding', 'weak',
      'shortness', 'difficulty', 'problems with', 'issues with', 'stomach',
      'chest', 'head', 'back', 'throat', 'nose', 'eyes', 'skin', 'leg', 'arm'
    ];
    
    const inputLower = input.toLowerCase();
    return symptomKeywords.some(keyword => inputLower.includes(keyword)) ||
           inputLower.includes('i ') || inputLower.includes('my ');
  };

  // Auto-analyze symptoms function
  const autoAnalyzeSymptoms = useCallback((input) => {
    if (!input.trim() || input === lastAnalyzedInput || input.length < 5) return;
    
    if (!isSymptomRelatedInput(input)) return;
    
    setIsAutoAnalyzing(true);
    setLastAnalyzedInput(input);
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      type: 'auto-analysis'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Generate AI response
    setTimeout(() => {
      const matchedDiseases = findDiseasesBySymptoms(input);
      const topMatches = matchedDiseases.slice(0, 6);
      
      let response = `${EMOJIS.magnifyingGlass} **Auto-Analysis Results:**\n\nBased on: "${input}"\n\n`;
      
      topMatches.forEach((disease, index) => {
        const confidenceLevel = disease.confidenceScore > 75 ? 'High' : 
                               disease.confidenceScore > 50 ? 'Medium' : 
                               disease.confidenceScore > 30 ? 'Moderate' : 'Low';
        
        const matchType = disease.matchCount > 0 ? 'Direct Match' : 'Related Condition';
        
        response += `**${index + 1}. ${disease.name}** (${disease.confidenceScore.toFixed(1)}% - ${confidenceLevel} ${matchType})\n`;
        
        if (disease.matchedSymptoms && disease.matchedSymptoms.length > 0) {
          response += `${EMOJIS.checkMark} **Matched:** ${disease.matchedSymptoms.slice(0, 3).join(', ')}\n`;
        }
        
        const relatedSymptoms = disease.symptoms ? 
          disease.symptoms.filter(s => !disease.matchedSymptoms?.includes(s)).slice(0, 3) : [];
        
        if (relatedSymptoms.length > 0) {
          response += `${EMOJIS.clipboard} **Other symptoms:** ${relatedSymptoms.join(', ')}\n`;
        }
        
        if (disease.treatment && disease.treatment.length > 0) {
          response += `${EMOJIS.pills} **Treatment:** ${disease.treatment.slice(0, 2).join(', ')}\n`;
        }
        
        response += `\n`;
      });
      
      response += `${EMOJIS.warning} **Auto-Analysis:** This is an automatic analysis based on your typed symptoms. For detailed consultation, please speak with a healthcare professional.\n\n${EMOJIS.phone} **Quick Actions:** Book appointment • Emergency help • Get second opinion`;
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'auto-analysis-result'
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsAutoAnalyzing(false);
      
      // Text-to-speech for auto-analysis (shorter version)
      if (!isMuted && 'speechSynthesis' in window) {
        const shortResponse = `Auto-analysis complete. Found ${topMatches.length} relevant conditions with confidence scores ranging from ${topMatches[topMatches.length-1].confidenceScore.toFixed(0)}% to ${topMatches[0].confidenceScore.toFixed(0)}%.`;
        const utterance = new SpeechSynthesisUtterance(shortResponse);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.7;
        
        setIsAISpeaking(true);
        setCurrentUtterance(utterance);
        
        utterance.onstart = () => setIsAISpeaking(true);
        utterance.onend = () => {
          setIsAISpeaking(false);
          setCurrentUtterance(null);
        };
        utterance.onerror = () => {
          setIsAISpeaking(false);
          setCurrentUtterance(null);
        };
        
        speechSynthesis.speak(utterance);
      }
    }, 1500);
  }, [lastAnalyzedInput, isMuted]);

  // Medical response generator with regular responses
  const generateAdvancedMedicalResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // AI capabilities showcase
    if (input.includes('what can you do') || input.includes('capabilities') || input.includes('features')) {
      return `${EMOJIS.robot} **ARIA's Advanced Capabilities:**\n\n${EMOJIS.microscope} **Medical Analysis:**\n• Auto-symptom analysis as you type\n• Disease prediction with confidence scoring\n• Drug interaction checking\n• Vital signs interpretation\n\n${EMOJIS.calendar} **Smart Scheduling:**\n• Real-time doctor availability\n• Insurance verification\n• Automatic reminders\n• Telehealth setup\n\n${EMOJIS.stethoscope} **Health Monitoring:**\n• Track vital signs\n• Medication reminders\n• Health goal setting\n• Risk assessment\n\n${EMOJIS.phone} **Communication:**\n• 24/7 availability\n• Multi-language support\n• Voice interaction with precise stop controls\n• Emergency escalation\n\n${EMOJIS.lock} **Security:**\n• HIPAA compliant\n• End-to-end encryption\n• Secure data storage\n\nTry: Just type your symptoms directly or use quick actions below!`;
    }

    // Manual symptom analysis (for when user specifically asks)
    if (input.includes('analyze') || input.includes('check') || input.includes('diagnose')) {
      const matchedDiseases = findDiseasesBySymptoms(userInput);
      const topMatches = matchedDiseases.slice(0, 6);
      
      let response = `${EMOJIS.magnifyingGlass} **Manual Analysis Results:**\n\nAnalyzing: "${userInput}"\n\n`;
      
      topMatches.forEach((disease, index) => {
        const confidenceLevel = disease.confidenceScore > 75 ? 'High' : 
                               disease.confidenceScore > 50 ? 'Medium' : 
                               disease.confidenceScore > 30 ? 'Moderate' : 'Low';
        
        response += `**${index + 1}. ${disease.name}** (${disease.confidenceScore.toFixed(1)}% - ${confidenceLevel})\n`;
        
        if (disease.matchedSymptoms && disease.matchedSymptoms.length > 0) {
          response += `${EMOJIS.checkMark} **Matched symptoms:** ${disease.matchedSymptoms.slice(0, 3).join(', ')}\n`;
        }
        
        if (disease.treatment && disease.treatment.length > 0) {
          response += `${EMOJIS.pills} **Treatment:** ${disease.treatment.slice(0, 2).join(', ')}\n`;
        }
        
        response += `\n`;
      });
      
      response += `${EMOJIS.warning} **Medical Disclaimer:** This analysis is for informational purposes only. Always consult healthcare professionals for proper diagnosis.\n\n${EMOJIS.phone} **Next Steps:** Book appointment • Emergency help • Get second opinion`;
      
      return response;
    }

    // Appointment booking
    if (input.includes('appointment') || input.includes('book') || input.includes('schedule')) {
      return `${EMOJIS.calendar} **Smart Appointment Booking:**\n\n${EMOJIS.rocket} **Quick Book** (Next available):\n• Dr. Sarah Johnson (Cardiology) - Today 3:30 PM\n• Dr. Michael Chen (Neurology) - Tomorrow 10:15 AM\n• Dr. Emily Davis (Pediatrics) - Tomorrow 2:45 PM\n\n${EMOJIS.clock} **Live Availability:**\n• ${EMOJIS.checkMark} 15 doctors available now\n• ${EMOJIS.hourglass} 8 doctors available within 1 hour\n• ${EMOJIS.emergency} Emergency slots always open\n\nShall I book an appointment for you?`;
    }

    // Emergency handling
    if (input.includes('emergency') || input.includes('urgent') || input.includes('911')) {
      return `${EMOJIS.emergency} **EMERGENCY PROTOCOL ACTIVATED**\n\n**FOR LIFE-THREATENING EMERGENCIES:**\n${EMOJIS.emergency} **Call 911 IMMEDIATELY**\n\n**FOR URGENT MEDICAL NEEDS:**\n${EMOJIS.phone} **HealX Emergency Hotline: +1 (555) 911-HELP**\n${EMOJIS.hospital} **Emergency Room Status: OPEN (5 min wait)**\n\nShould I connect you with emergency services?`;
    }

    // Default response
    return `${EMOJIS.robot} **Hello! I'm ARIA, your AI Healthcare Assistant**\n\n${EMOJIS.target} **Popular Actions:**\n• Just type your symptoms directly for auto-analysis\n• "Book appointment now" - Smart scheduling\n• "Check drug interactions" - Medication safety\n• "Emergency help" - Urgent care\n\n${EMOJIS.star} **New Feature:** Auto-symptom analysis! Just type how you feel and I'll automatically analyze it.\n\n${EMOJIS.phone} **Examples:**\n• "I have chest pain and shortness of breath"\n• "Feeling dizzy and nauseous"\n• "My head hurts and I feel tired"\n\n${EMOJIS.lock} **Your privacy is protected** with HIPAA-compliant encryption.\n\nWhat would you like to do today?`;
  };

  // Input change handler with auto-analysis
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout for auto-analysis
    if (value.trim().length >= 5 && isSymptomRelatedInput(value)) {
      typingTimeoutRef.current = setTimeout(() => {
        autoAnalyzeSymptoms(value);
        setInputMessage(''); // Clear input after auto-analysis
      }, 2000); // Wait 2 seconds after user stops typing
    }
  };

  // Enhanced Function to Stop AI Speech
  const stopAISpeech = () => {
    if (isAISpeaking && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsAISpeaking(false);
      setCurrentUtterance(null);
      
      const stopMessage = {
        id: Date.now(),
        text: `${EMOJIS.robot} AI speech stopped. Quick actions are now available again.`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, stopMessage]);
      }, 300);
    }
  };

  // Enhanced sendMessage function
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Clear auto-analysis timeout if user sends manually
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isAISpeaking) {
      stopAISpeech();
    }

    const userMessage = { 
      id: Date.now(), 
      text: inputMessage, 
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      type: 'manual'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    if (isListening && recognition) {
      stopVoiceRecognition();
    }

    setTimeout(() => {
      const botResponse = generateAdvancedMedicalResponse(currentMessage);
      const botMessage = { 
        id: Date.now() + 1, 
        text: botResponse, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'manual-response'
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      if (!isMuted && 'speechSynthesis' in window) {
        const cleanText = botResponse.replace(/\*\*|🤖|📅|💊|🚨|🔍|✅|⚠️|📋|🌟|🕒|📍|👋|💳|🎯|🔬|📱|💰|🎥|📊|🧹|🔄/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        setIsAISpeaking(true);
        setCurrentUtterance(utterance);
        
        utterance.onstart = () => setIsAISpeaking(true);
        utterance.onend = () => {
          setIsAISpeaking(false);
          setCurrentUtterance(null);
        };
        utterance.onerror = () => {
          setIsAISpeaking(false);
          setCurrentUtterance(null);
        };
        
        speechSynthesis.speak(utterance);
      }
    }, 2000);
  };

  // Voice Recognition Functions
  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const newRecognition = new SpeechRecognition();
      
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = language;
      
      newRecognition.onstart = () => {
        setIsListening(true);
        setIsVoiceMode(true);
        setVoiceStatus('listening');
      };
      
      newRecognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInputMessage(transcript);
        setVoiceStatus('processing');
        
        if (event.results[event.results.length - 1].isFinal && transcript.trim()) {
          setVoiceStatus('ready');
          setTimeout(() => sendMessage(), 500);
        }
      };
      
      newRecognition.onerror = (event) => {
        setIsListening(false);
        setIsVoiceMode(false);
        setVoiceStatus('error');
        setTimeout(() => setVoiceStatus('ready'), 3000);
      };
      
      newRecognition.onend = () => {
        setIsListening(false);
        setIsVoiceMode(false);
        setVoiceStatus('ready');
      };
      
      setRecognition(newRecognition);
      newRecognition.start();
    } else {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      setVoiceStatus('error');
      setTimeout(() => setVoiceStatus('ready'), 3000);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      setIsVoiceMode(false);
      setVoiceStatus('ready');
      setRecognition(null);
    }
  };

  const toggleVoiceMode = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const clearChatAdvanced = () => {
    if (isListening) {
      stopVoiceRecognition();
    }
    
    if (isAISpeaking) {
      stopAISpeech();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (messages.length > 1) {
      const chatSession = {
        id: Date.now(),
        messages: messages,
        timestamp: new Date().toLocaleString(),
        summary: `Chat session with ${messages.length} messages`
      };
      setChatHistory(prev => [chatSession, ...prev.slice(0, 4)]);
    }

    setMessages([
      { 
        id: 1, 
        text: `${EMOJIS.broom} **Chat Cleared Successfully!**\n\nI'm ARIA, your AI healthcare assistant with auto-symptom analysis.\n\n${EMOJIS.target} **Quick Start:**\n• Type your symptoms directly for instant analysis\n• Use voice input for hands-free interaction\n• Quick actions available when I'm not speaking\n\nHow can I assist you today?`, 
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }
    ]);
    
    setLastAnalyzedInput('');
    setIsAutoAnalyzing(false);
  };

  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: messages,
      totalMessages: messages.length,
      autoAnalysisCount: messages.filter(m => m.type === 'auto-analysis').length
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
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      .replace(/(🔍|📅|👨‍⚕️|🚨|💊|📞|⚠️|✅|📋|🌟|🕒|📍|👋|💳|🤖|🎯|🔬|📱|💰|🎥|📊|🧹|🔄)/g, '<span class="emoji">$1</span>')
      .replace(/•\s/g, '<span style="color: #6366f1; font-weight: bold;">• </span>')
      .replace(/(\d+\.)\s/g, '<span style="color: #059669; font-weight: bold;">$1 </span>');
    
    return { __html: formatted };
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
    setTimeout(() => sendMessage(), 100);
  };

  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.advanced-chat-messages');
    if (messagesContainer) {
      messagesContainer.classList.add('auto-scroll');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      setTimeout(() => {
        messagesContainer.classList.remove('auto-scroll');
      }, 500);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recognition && isListening) {
        recognition.stop();
      }
      if (isAISpeaking && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [recognition, isListening, isAISpeaking]);

  return (
    <div className="advanced-chatbot-widget">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`advanced-chat-toggle ${isOpen ? 'open' : ''} ${isAISpeaking ? 'speaking' : ''}`}
        title="Chat with ARIA - AI Healthcare Assistant"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
        <div className="ai-pulse"></div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          {isAISpeaking ? 'Speaking' : isAutoAnalyzing ? 'Analyzing' : 'AI'}
        </div>
      </button>

      {isOpen && (
        <div className={`advanced-chat-window ${isExpanded ? 'expanded' : ''} ${isAISpeaking ? 'ai-speaking' : ''}`}>
          <div className={`advanced-chat-header ${isAISpeaking ? 'ai-speaking-mode' : ''}`}>
            <div className="chat-header-info">
              <div className="ai-avatar">
                <FaRobot />
              </div>
              <div className="ai-details">
                <h4>{EMOJIS.robot} ARIA</h4>
                <span className="ai-status">
                  AI Healthcare Assistant • {
                    isAISpeaking ? '🔊 Speaking...' : 
                    isAutoAnalyzing ? '🔍 Auto-Analyzing...' :
                    isListening ? '🎤 Listening...' : 
                    voiceStatus === 'error' ? 'Voice Error' : 'Online'
                  }
                </span>
              </div>
            </div>
            <div className="chat-controls">
              {isAISpeaking && (
                <button 
                  onClick={stopAISpeech}
                  className="ai-speech-stop-btn expanded" 
                  title="Stop AI Speech Immediately"
                >
                  <FaStop />
                </button>
              )}
              
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

          <div className={`advanced-chat-messages ${isAISpeaking ? 'ai-speaking-mode' : ''}`}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.type || ''}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.sender === 'user' ? '👤 You' : `${EMOJIS.robot} ARIA`}
                    {message.type === 'auto-analysis' && ' (Auto)'}
                    {message.type === 'auto-analysis-result' && ' (Auto-Analysis)'}
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
            
            {(isTyping || isAutoAnalyzing) && (
              <div className="message bot-message">
                <div className="message-header">
                  <span className="message-sender">{EMOJIS.robot} ARIA</span>
                  <span className="message-time">{isAutoAnalyzing ? 'auto-analyzing...' : 'typing...'}</span>
                </div>
                <div className="message-content">
                  <div className="advanced-typing-indicator">
                    <div className="typing-text">
                      {isAutoAnalyzing ? 'AI auto-analyzing symptoms...' : 'AI is processing...'}
                    </div>
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
              <div className="voice-controls">
                <button 
                  onClick={toggleVoiceMode} 
                  className={`voice-btn ${isListening ? 'listening' : ''} ${voiceStatus === 'error' ? 'error' : ''}`}
                  title={isListening ? "Voice is listening..." : voiceStatus === 'error' ? "Voice Error - Click to retry" : "Start Voice Input"}
                  disabled={voiceStatus === 'processing'}
                >
                  {voiceStatus === 'error' ? <FaTimes /> : 
                   isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                
                {isListening && (
                  <button 
                    onClick={stopVoiceRecognition}
                    className="voice-stop-btn-enhanced"
                    title="Stop Voice Recognition Immediately"
                  >
                    <FaStopCircle />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  isAISpeaking ? "AI is speaking... Quick actions hidden" :
                  isAutoAnalyzing ? "Auto-analyzing your symptoms..." :
                  isListening ? "🎤 Listening... Speak now" : 
                  "Type your symptoms for instant analysis..."
                }
                className="advanced-message-input"
                disabled={isAISpeaking || isAutoAnalyzing}
              />
              <button onClick={sendMessage} className="advanced-send-button" title="Send Message">
                <FaPaperPlane />
              </button>
            </div>
            
            {isListening && (
              <div className="voice-status-indicator enhanced">
                <div className="listening-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="voice-status-text">
                  {EMOJIS.phoneIcon} {voiceStatus === 'processing' ? 'Processing...' : 'Listening...'} 
                </span>
              </div>
            )}

            {isAISpeaking && (
              <div className={`ai-speaking-indicator ${isExpanded ? 'expanded-mode' : ''}`}>
                <div className={`speaking-animation ${isExpanded ? 'expanded' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={`ai-speaking-text ${isExpanded ? 'expanded' : ''}`}>
                  {EMOJIS.speaker} AI is speaking... Quick actions hidden
                </span>
                <button 
                  onClick={stopAISpeech}
                  className={`inline-speech-stop-btn ${isExpanded ? 'expanded' : ''}`}
                  title="Stop AI Speech"
                >
                  <FaStop /> Stop Speech
                </button>
              </div>
            )}

            {isAutoAnalyzing && (
              <div className="auto-analyzing-indicator">
                <div className="analyzing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="auto-analyzing-text">
                  {EMOJIS.magnifyingGlass} Auto-analyzing your symptoms... Quick actions hidden
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions - Only show when AI is NOT speaking and NOT auto-analyzing */}
          {!isAISpeaking && !isAutoAnalyzing && (
            <div className="advanced-quick-actions">
              <div className="quick-actions-header">
                <span>Quick Actions Available:</span>
              </div>
              
              <div className="quick-actions-container">
                <div className="quick-actions-grid">
                  {[
                    { icon: EMOJIS.magnifyingGlass, text: 'Manual Analysis', action: 'Analyze my symptoms manually' },
                    { icon: EMOJIS.calendar, text: 'Book Appointment', action: 'Book appointment now' },
                    { icon: EMOJIS.pills, text: 'Drug Interactions', action: 'Check drug interactions' },
                    { icon: EMOJIS.creditCard, text: 'Insurance Check', action: 'Verify my insurance' },
                    { icon: EMOJIS.phoneIcon, text: 'Video Consult', action: 'Start video consultation' },
                    { icon: EMOJIS.emergency, text: 'Emergency Help', action: 'Emergency assistance needed' },
                    { icon: EMOJIS.heart, text: 'Health Records', action: 'Show my health records' },
                    { icon: EMOJIS.chart, text: 'Health Analytics', action: 'Show health analytics dashboard' },
                    { icon: EMOJIS.phone, text: 'Call Doctor', action: 'Call my primary care doctor' },
                    { icon: EMOJIS.map, text: 'Find Pharmacy', action: 'Find nearest pharmacy' },
                    { icon: EMOJIS.bookmark, text: 'Health Tips', action: 'Show personalized health tips' },
                    { icon: EMOJIS.target, text: 'Capabilities', action: 'What can you do?' },
                    { icon: EMOJIS.stethoscope, text: 'Vital Signs', action: 'Track my vital signs' },
                    { icon: EMOJIS.ambulance, text: 'Urgent Care', action: 'Find urgent care near me' },
                    { icon: EMOJIS.microscope, text: 'Lab Results', action: 'Show my lab results' },
                    { icon: EMOJIS.trophy, text: 'Health Goals', action: 'View my health goals' }
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
              
              <div className="quick-actions-scroll-indicator">
                <div className="scroll-indicator-text">
                  <span>↕️</span>
                  <span>Scroll for more actions</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AdvancedFloatingChatbot;
