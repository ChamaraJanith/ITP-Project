// EmergencyPage.jsx
import React from 'react';
import { FaPhoneAlt, FaAmbulance, FaHospital, FaClock, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';
import './EmergencyPage.css';

const EmergencyPage = () => {
  const emergencyServices = [
    {
      icon: <FaAmbulance />,
      title: "Ambulance Service",
      description: "24/7 Emergency ambulance with advanced life support",
      response: "5-8 minutes"
    },
    {
      icon: <FaHospital />,
      title: "Emergency Room",
      description: "Fully equipped ER with trauma specialists",
      response: "Immediate"
    },
    {
      icon: <FaPhoneAlt />,
      title: "Crisis Hotline",
      description: "Mental health crisis intervention and support",
      response: "24/7"
    }
  ];

  const quickActions = [
    { action: "Call 911", number: "911", type: "emergency" },
    { action: "Poison Control", number: "1-800-222-1222", type: "poison" },
    { action: "Mental Health Crisis", number: "988", type: "crisis" }
  ];

  return (
    <div className="emergency-page">
      {/* Emergency Header */}
      <div className="emergency-header">
        <div className="emergency-alert">
          <FaExclamationTriangle className="alert-icon" />
          <div className="alert-content">
            <h1>🚨 Emergency Services</h1>
            <p>If this is a life-threatening emergency, call 911 immediately</p>
          </div>
        </div>
      </div>

      <div className="emergency-container">
        {/* Emergency Contacts */}
        <div className="emergency-contacts">
          <h2>Emergency Contacts</h2>
          <div className="contacts-grid">
            {quickActions.map((contact, index) => (
              <div key={index} className={`emergency-contact ${contact.type}`}>
                <div className="contact-info">
                  <h3>{contact.action}</h3>
                  <a href={`tel:${contact.number}`} className="emergency-number">
                    <FaPhoneAlt />
                    {contact.number}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Services */}
        <div className="emergency-services">
          <h2>Available Emergency Services</h2>
          <div className="services-grid">
            {emergencyServices.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="response-time">
                    <FaClock />
                    <span>Response: {service.response}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Location */}
        <div className="hospital-location">
          <h2>Emergency Room Location</h2>
          <div className="location-card">
            <div className="location-info">
              <div className="location-details">
                <h3>
                  <FaMapMarkerAlt />
                  Private Healthcare Emergency Center
                </h3>
                <p>123 Medical Center Drive, Healthcare City, HC 12345</p>
                <div className="location-features">
                  <span className="feature">24/7 Emergency Care</span>
                  <span className="feature">Trauma Level 1</span>
                  <span className="feature">Helicopter Landing Pad</span>
                </div>
              </div>
              <div className="location-actions">
                <button className="directions-btn">
                  <FaMapMarkerAlt />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Preparation Tips */}
        <div className="emergency-tips">
          <h2>Emergency Preparation</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>Before You Call</h4>
              <ul>
                <li>Stay calm and assess the situation</li>
                <li>Ensure the area is safe</li>
                <li>Check for responsiveness</li>
                <li>Look for obvious injuries</li>
              </ul>
            </div>
            <div className="tip-card">
              <h4>Information to Provide</h4>
              <ul>
                <li>Your exact location</li>
                <li>Nature of the emergency</li>
                <li>Number of people involved</li>
                <li>Current condition of patient(s)</li>
              </ul>
            </div>
            <div className="tip-card">
              <h4>What to Do While Waiting</h4>
              <ul>
                <li>Follow dispatcher instructions</li>
                <li>Provide basic first aid if trained</li>
                <li>Keep the patient comfortable</li>
                <li>Stay on the line until help arrives</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Alert */}
        <div className="emergency-disclaimer">
          <div className="disclaimer-content">
            <FaExclamationTriangle />
            <div>
              <h4>Important Notice</h4>
              <p>This website does not provide emergency medical services. In case of a medical emergency, call 911 or go to your nearest emergency room immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
