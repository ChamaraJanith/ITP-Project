import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaUserMd, FaHeartbeat, FaStethoscope, FaHospital, FaCalendarAlt, FaStar, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Search state
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  // Search suggestions for healthcare
  const SEARCH_SUGGESTIONS = [
    "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician",
    "Orthopedic Surgeon", "Gynecologist", "Psychiatrist", "General Physician",
    "Dentist", "Eye Specialist", "Heart Specialist", "Skin Doctor",
    "COVID-19 Test", "Blood Test", "X-Ray", "MRI Scan", "CT Scan",
    "Vaccination", "Health Checkup", "Emergency Care"
  ];

  // Featured doctors data
  const FEATURED_DOCTORS = [
    { id: 1, name: "Dr. Sarah Johnson", specialty: "Cardiologist", rating: 4.9, experience: "15+ years" },
    { id: 2, name: "Dr. Michael Chen", specialty: "Neurologist", rating: 4.8, experience: "12+ years" },
    { id: 3, name: "Dr. Emily Davis", specialty: "Pediatrician", rating: 4.9, experience: "10+ years" },
    { id: 4, name: "Dr. Robert Wilson", specialty: "Orthopedic", rating: 4.7, experience: "18+ years" }
  ];

  // Services data
  const SERVICES = [
    { icon: <FaHeartbeat />, title: "Cardiology", desc: "Heart care specialists" },
    { icon: <FaUserMd />, title: "General Medicine", desc: "Primary healthcare" },
    { icon: <FaStethoscope />, title: "Pediatrics", desc: "Child healthcare" },
    { icon: <FaHospital />, title: "Surgery", desc: "Advanced surgical care" }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    
    if (query.includes("doctor") || query.includes("specialist")) {
      navigate("/doctors");
    } else if (query.includes("appointment") || query.includes("booking")) {
      navigate("/appointments");
    } else if (query.includes("test") || query.includes("scan")) {
      navigate("/diagnostics");
    } else if (query) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
    
    setSearch("");
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (value.length > 0) {
      const filtered = SEARCH_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    
    const query = suggestion.toLowerCase();
    if (query.includes("cardiologist") || query.includes("heart")) {
      navigate("/specialty/cardiology");
    } else if (query.includes("dermatologist") || query.includes("skin")) {
      navigate("/specialty/dermatology");
    } else if (query.includes("test") || query.includes("scan")) {
      navigate("/diagnostics");
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Premium Healthcare at Your Doorstep</h1>
            <p>Experience world-class medical care with our team of expert doctors and cutting-edge technology</p>
            
            {user.name && (
              <div className="welcome-user">
                <p>Welcome back, <strong>{user.name}</strong>! 👋</p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="profile-btn"
                >
                  View Profile
                </button>
              </div>
            )}
          </div>

          {/* Advanced Search Bar */}
          <div className="search-container">
            <h3>Find Doctors, Services & More</h3>
            <div className="search-wrapper">
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search doctors, specialties, services..."
                    value={search}
                    onChange={handleInputChange}
                    onFocus={() => search.length > 0 && setShowSuggestions(true)}
                    className="search-input"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="clear-btn"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                <button type="submit" className="search-btn">
                  Search
                </button>
              </form>

              {/* Search Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="suggestions-dropdown" onMouseDown={e => e.preventDefault()}>
                  {filteredSuggestions.slice(0, 6).map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-item"
                    >
                      <FaSearch className="suggestion-icon" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <div className="container">
          <div className="actions-grid">
            <button 
              className="action-card primary"
              onClick={() => navigate('/book-appointment')}
            >
              <FaCalendarAlt className="action-icon" />
              <h3>Book Appointment</h3>
              <p>Schedule with top doctors</p>
            </button>
            
            <button 
              className="action-card"
              onClick={() => navigate('/doctors')}
            >
              <FaUserMd className="action-icon" />
              <h3>Find Doctors</h3>
              <p>Expert specialists available</p>
            </button>
            
            <button 
              className="action-card"
              onClick={() => navigate('/diagnostics')}
            >
              <FaStethoscope className="action-icon" />
              <h3>Lab Tests</h3>
              <p>Home sample collection</p>
            </button>
            
            <button 
              className="action-card emergency"
              onClick={() => navigate('/emergency')}
            >
              <FaHospital className="action-icon" />
              <h3>Emergency</h3>
              <p>24/7 emergency care</p>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="featured-doctors">
        <div className="container">
          <h2>Meet Our Top Doctors</h2>
          <div className="doctors-grid">
            {FEATURED_DOCTORS.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-avatar">
                  <FaUserMd />
                </div>
                <h3>{doctor.name}</h3>
                <p className="specialty">{doctor.specialty}</p>
                <div className="doctor-stats">
                  <span className="rating">
                    <FaStar /> {doctor.rating}
                  </span>
                  <span className="experience">{doctor.experience}</span>
                </div>
                <button className="book-btn">Book Appointment</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="services">
        <div className="container">
          <h2>Our Specialties</h2>
          <div className="services-grid">
            {SERVICES.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="contact-info">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <h3>Emergency Hotline</h3>
              <p>+1 (555) 911-HELP</p>
            </div>
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <h3>Visit Our Clinic</h3>
              <p>123 Healthcare St, Medical City</p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section for Non-logged Users */}
      {!user.name && (
        <section className="auth-section">
          <div className="container">
            <h2>Get Started Today</h2>
            <p>Join thousands of patients who trust our healthcare services</p>
            <div className="auth-buttons">
              <button 
                onClick={() => navigate('/login')}
                className="auth-btn login"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="auth-btn register"
              >
                Sign Up
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Homepage;
