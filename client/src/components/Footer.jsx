import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHeart, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, 
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube,
  FaStethoscope, FaRobot, FaShieldAlt, FaVideo, FaCalendarAlt,
  FaPaperPlane, FaHeartbeat, FaAward, FaCertificate, 
  FaUserMd, FaHospital, FaAmbulance, FaTooth, FaEye, 
  FaBrain, FaPills, FaWeight, FaPlay
} from 'react-icons/fa';
import { RiRocketLine as FaRocket } from 'react-icons/ri';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setIsSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Find Doctors', path: '/doctors' },
    { name: 'Book Appointment', path: '/appointment' },
    { name: 'Health Records', path: '/records' },
    { name: 'Emergency', path: '/emergency' }
  ];

  const services = [
    { name: 'AI Symptom Analysis', icon: <FaRobot />, path: '/ai-diagnosis' },
    { name: 'Private Telehealth', icon: <FaVideo />, path: '/telehealth' },
    { name: 'BMI Calculator', icon: <FaWeight />, path: '/bmi-calculator' },
    { name: 'Health Monitoring', icon: <FaHeartbeat />, path: '/monitoring' },
    { name: 'Cardiology', icon: <FaHeart />, path: '/cardiology' },
    { name: 'General Medicine', icon: <FaUserMd />, path: '/general-medicine' }
  ];

  const specialties = [
    { name: 'Cardiology', icon: <FaHeart /> },
    { name: 'Neurology', icon: <FaBrain /> },
    { name: 'Ophthalmology', icon: <FaEye /> },
    { name: 'Dentistry', icon: <FaTooth /> },
    { name: 'Pharmacy', icon: <FaPills /> },
    { name: 'Emergency Care', icon: <FaAmbulance /> }
  ];

  const contactInfo = [
    { 
      icon: <FaPhone />, 
      title: '24/7 Private Helpline',
      content: '+1 (555) 123-4567',
      subContent: 'Emergency: +1 (555) 911-HELP'
    },
    { 
      icon: <FaEnvelope />, 
      title: 'Email Support',
      content: 'support@ariahealthcare.com',
      subContent: 'emergency@ariahealthcare.com'
    },
    { 
      icon: <FaMapMarkerAlt />, 
      title: 'Private Medical Center',
      content: '123 Healthcare Boulevard',
      subContent: 'Medical District, NY 10001'
    },
    { 
      icon: <FaClock />, 
      title: 'Operating Hours',
      content: '24/7 Private Services',
      subContent: 'Premium Care Always Available'
    }
  ];

  const achievements = [
    { icon: <FaAward />, text: '5K+ Private Patients' },
    { icon: <FaCertificate />, text: '95% AI Accuracy' },
    { icon: <FaShieldAlt />, text: 'HIPAA Compliant' },
    { icon: <FaStethoscope />, text: '2 Expert Doctors' }
  ];

  return (
    <>


      {/* Main Footer */}
      <footer className="main-footer">
        {/* Newsletter Section */}
        <div className="footer-newsletter">
          <div className="container">
            <div className="newsletter-content">
              <div className="newsletter-text">
                <h4>Stay Updated with Private Health Insights</h4>
                <p>Get the latest medical breakthroughs and personalized health tips delivered to your inbox</p>
              </div>
              <div className="newsletter-form-wrapper">
                {!isSubscribed ? (
                  <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                    <input 
                      type="email" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address" 
                      className="newsletter-input"
                      required
                    />
                    <button type="submit" className="newsletter-btn">
                      <FaPaperPlane />
                      Subscribe
                    </button>
                  </form>
                ) : (
                  <div className="success-message">
                    <span>✅ Thank you for subscribing! Check your email for confirmation.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="container">
            <div className="footer-grid">
              
              {/* Company Information */}
              <div className="footer-section company-info">
                <div className="footer-logo">
                  <FaHeart className="logo-icon" />
                  <h3>ARIA Healthcare</h3>
                </div>
                <p className="company-description">
                  Experience revolutionary AI-powered private healthcare with exclusive consultations, 
                  BMI health tracking, and cutting-edge telehealth technology. Your health, our priority.
                </p>
                
                <div className="achievements-grid">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="achievement-item">
                      {achievement.icon}
                      <span>{achievement.text}</span>
                    </div>
                  ))}
                </div>

                <div className="certifications">
                  <div className="cert-badge">
                    <FaShieldAlt />
                    <span>HIPAA Certified</span>
                  </div>
                  <div className="cert-badge">
                    <FaCertificate />
                    <span>FDA Approved</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="footer-section">
                <h4>Quick Links</h4>
                <ul className="footer-links">
                  {quickLinks.map((link, index) => (
                    <li key={index}>
                      <a href={link.path} onClick={(e) => {
                        e.preventDefault();
                        navigate(link.path);
                      }}>
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div className="footer-section">
                <h4>Private Services</h4>
                <ul className="footer-services">
                  {services.map((service, index) => (
                    <li key={index}>
                      <a href={service.path} onClick={(e) => {
                        e.preventDefault();
                        navigate(service.path);
                      }}>
                        {service.icon}
                        <span>{service.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Medical Specialties */}
              <div className="footer-section">
                <h4>Medical Specialties</h4>
                <ul className="footer-specialties">
                  {specialties.map((specialty, index) => (
                    <li key={index}>
                      {specialty.icon}
                      <span>{specialty.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Information */}
              <div className="footer-section contact-section">
                <h4>Contact Us</h4>
                <div className="contact-info">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="contact-item">
                      <div className="contact-icon">{info.icon}</div>
                      <div className="contact-details">
                        <h5>{info.title}</h5>
                        <p>{info.content}</p>
                        <small>{info.subContent}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="container">
            <div className="footer-bottom-content">
              
              {/* Social Media Links */}
              <div className="social-links">
                <a href="#" className="social-link facebook" aria-label="Facebook">
                  <FaFacebook />
                </a>
                <a href="#" className="social-link twitter" aria-label="Twitter">
                  <FaTwitter />
                </a>
                <a href="#" className="social-link instagram" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="#" className="social-link linkedin" aria-label="LinkedIn">
                  <FaLinkedin />
                </a>
                <a href="#" className="social-link youtube" aria-label="YouTube">
                  <FaYoutube />
                </a>
              </div>

              {/* Copyright and Legal */}
              <div className="footer-legal">
                <div className="copyright">
                  <p>&copy; {currentYear} ARIA Healthcare. All rights reserved.</p>
                  <p>Providing Premium Private Healthcare Since 2020</p>
                </div>
                
                <div className="legal-links">
                  <a href="/privacy-policy" onClick={(e) => {
                    e.preventDefault();
                    navigate('/privacy-policy');
                  }}>Privacy Policy</a>
                  <a href="/terms-of-service" onClick={(e) => {
                    e.preventDefault();
                    navigate('/terms-of-service');
                  }}>Terms of Service</a>
                  <a href="/hipaa-compliance" onClick={(e) => {
                    e.preventDefault();
                    navigate('/hipaa-compliance');
                  }}>HIPAA Compliance</a>
                  <a href="/medical-disclaimer" onClick={(e) => {
                    e.preventDefault();
                    navigate('/medical-disclaimer');
                  }}>Medical Disclaimer</a>
                  <a href="/accessibility" onClick={(e) => {
                    e.preventDefault();
                    navigate('/accessibility');
                  }}>Accessibility</a>
                </div>
              </div>

              {/* Emergency Notice */}
              <div className="emergency-notice">
                <div className="emergency-icon">
                  <FaAmbulance />
                </div>
                <div className="emergency-text">
                  <strong>Medical Emergency?</strong>
                  <p>Call 911 or visit your nearest emergency room immediately</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="medical-disclaimer">
          <div className="container">
            <p>
              <strong>Medical Disclaimer:</strong> The information provided on this website is for educational 
              and informational purposes only. It is not intended as a substitute for professional medical advice, 
              diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider 
              with any questions you may have regarding a medical condition. Never disregard professional medical 
              advice or delay in seeking it because of something you have read on this website.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
