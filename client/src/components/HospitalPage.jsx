// HospitalsPage.jsx
import React, { useState } from 'react';
import { 
  FaHospital, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaStar, 
  FaFilter, 
  FaSearch, 
  FaClock, 
  FaBed, 
  FaUserMd, 
  FaAmbulance,
  FaHeart,
  FaBrain,
  FaBaby,
  FaEye,
  FaBone,
  FaStethoscope
} from 'react-icons/fa';
import './HospitalsPage.css';

const HospitalsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  const hospitals = [
    {
      id: 1,
      name: "Metropolitan General Hospital",
      address: "123 Healthcare Ave, Medical District",
      phone: "(555) 123-4567",
      rating: 4.8,
      reviews: 2847,
      distance: "1.2 miles",
      type: "General Hospital",
      services: ["Emergency Care", "Surgery", "ICU", "Maternity"],
      specialties: ["Cardiology", "Neurology", "Oncology", "Pediatrics"],
      beds: 450,
      established: 1985,
      features: ["24/7 Emergency", "Trauma Center Level 1", "Helicopter Pad"],
      image: "/api/placeholder/400/250"
    },
    {
      id: 2,
      name: "Heart & Vascular Institute",
      address: "456 Cardiac Center Blvd, Downtown",
      phone: "(555) 234-5678",
      rating: 4.9,
      reviews: 1923,
      distance: "2.5 miles",
      type: "Specialty Hospital",
      services: ["Cardiac Surgery", "Interventional Cardiology", "Heart Transplant"],
      specialties: ["Cardiology", "Cardiovascular Surgery"],
      beds: 200,
      established: 1992,
      features: ["Heart Transplant Center", "Robotic Surgery", "24/7 Cardiac ICU"],
      image: "/api/placeholder/400/250"
    },
    {
      id: 3,
      name: "Children's Medical Center",
      address: "789 Pediatric Way, Family District",
      phone: "(555) 345-6789",
      rating: 4.7,
      reviews: 3421,
      distance: "3.1 miles",
      type: "Children's Hospital",
      services: ["Pediatric Emergency", "NICU", "Pediatric Surgery"],
      specialties: ["Pediatrics", "Neonatology", "Pediatric Surgery"],
      beds: 320,
      established: 1978,
      features: ["NICU Level 4", "Child Life Program", "Ronald McDonald House"],
      image: "/api/placeholder/400/250"
    },
    {
      id: 4,
      name: "Neurological Sciences Hospital",
      address: "321 Brain Health Dr, Research Park",
      phone: "(555) 456-7890",
      rating: 4.6,
      reviews: 1567,
      distance: "4.3 miles",
      type: "Specialty Hospital",
      services: ["Neurosurgery", "Stroke Care", "Epilepsy Treatment"],
      specialties: ["Neurology", "Neurosurgery", "Psychiatry"],
      beds: 180,
      established: 1995,
      features: ["Stroke Center", "Brain Tumor Program", "Sleep Disorders Clinic"],
      image: "/api/placeholder/400/250"
    },
    {
      id: 5,
      name: "Women's Health & Maternity",
      address: "654 Mother & Baby Lane, Family Zone",
      phone: "(555) 567-8901",
      rating: 4.8,
      reviews: 2156,
      distance: "2.8 miles",
      type: "Women's Hospital",
      services: ["Labor & Delivery", "Gynecology", "Breast Health"],
      specialties: ["Obstetrics", "Gynecology", "Reproductive Medicine"],
      beds: 150,
      established: 1988,
      features: ["NICU Level 3", "Birthing Suites", "Lactation Support"],
      image: "/api/placeholder/400/250"
    },
    {
      id: 6,
      name: "Orthopedic & Sports Medicine",
      address: "987 Athletic Recovery Rd, Sports Complex",
      phone: "(555) 678-9012",
      rating: 4.5,
      reviews: 1234,
      distance: "5.2 miles",
      type: "Specialty Hospital",
      services: ["Joint Replacement", "Sports Medicine", "Physical Therapy"],
      specialties: ["Orthopedics", "Sports Medicine", "Rheumatology"],
      beds: 100,
      established: 2001,
      features: ["Robotic Joint Surgery", "Sports Performance Lab", "Rehab Center"],
      image: "/api/placeholder/400/250"
    }
  ];

  const specialties = [
    { value: 'all', label: 'All Specialties', icon: <FaStethoscope /> },
    { value: 'cardiology', label: 'Cardiology', icon: <FaHeart /> },
    { value: 'neurology', label: 'Neurology', icon: <FaBrain /> },
    { value: 'pediatrics', label: 'Pediatrics', icon: <FaBaby /> },
    { value: 'orthopedics', label: 'Orthopedics', icon: <FaBone /> },
    { value: 'ophthalmology', label: 'Ophthalmology', icon: <FaEye /> }
  ];

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.specialties.some(specialty => 
                           specialty.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            hospital.specialties.some(specialty => 
                              specialty.toLowerCase().includes(selectedSpecialty));
    
    const matchesRating = selectedRating === 'all' || 
                         hospital.rating >= parseFloat(selectedRating);

    return matchesSearch && matchesSpecialty && matchesRating;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar 
        key={i} 
        className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'} 
      />
    ));
  };

  const getSpecialtyIcon = (specialty) => {
    switch(specialty.toLowerCase()) {
      case 'cardiology': return <FaHeart className="specialty-icon" />;
      case 'neurology': return <FaBrain className="specialty-icon" />;
      case 'pediatrics': return <FaBaby className="specialty-icon" />;
      case 'orthopedics': return <FaBone className="specialty-icon" />;
      case 'ophthalmology': return <FaEye className="specialty-icon" />;
      default: return <FaStethoscope className="specialty-icon" />;
    }
  };

  return (
    <div className="hospitals-page">
      {/* Header Section */}
      <div className="hospitals-header">
        <div className="header-content">
          <h1>
            <FaHospital className="header-icon" />
            Hospitals Directory
          </h1>
          <p>Find the best hospitals and medical centers near you</p>
          <div className="header-stats">
            <div className="stat">
              <strong>{hospitals.length}</strong>
              <span>Hospitals</span>
            </div>
            <div className="stat">
              <strong>24/7</strong>
              <span>Emergency Care</span>
            </div>
            <div className="stat">
              <strong>50+</strong>
              <span>Specialties</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hospitals-container">
        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search hospitals, specialties, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            <div className="filter-group">
              <FaFilter className="filter-icon" />
              <select 
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                {specialties.map(specialty => (
                  <option key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <FaStar className="filter-icon" />
              <select 
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
              >
                <option value="all">All Ratings</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>Showing {filteredHospitals.length} of {hospitals.length} hospitals</p>
        </div>

        {/* Hospitals Grid */}
        <div className="hospitals-grid">
          {filteredHospitals.map(hospital => (
            <div key={hospital.id} className="hospital-card">
              <div className="hospital-image">
                <img src={hospital.image} alt={hospital.name} />
                <div className="hospital-type">{hospital.type}</div>
              </div>

              <div className="hospital-content">
                <div className="hospital-header">
                  <h3>{hospital.name}</h3>
                  <div className="rating-section">
                    <div className="stars">
                      {renderStars(hospital.rating)}
                    </div>
                    <span className="rating-text">
                      {hospital.rating} ({hospital.reviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="hospital-info">
                  <div className="info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <span>{hospital.address}</span>
                    <span className="distance">{hospital.distance}</span>
                  </div>

                  <div className="info-item">
                    <FaPhone className="info-icon" />
                    <a href={`tel:${hospital.phone}`}>{hospital.phone}</a>
                  </div>
                </div>

                <div className="hospital-stats">
                  <div className="stat-item">
                    <FaBed className="stat-icon" />
                    <span>{hospital.beds} beds</span>
                  </div>
                  <div className="stat-item">
                    <FaClock className="stat-icon" />
                    <span>Est. {hospital.established}</span>
                  </div>
                </div>

                <div className="specialties-list">
                  <h4>Specialties:</h4>
                  <div className="specialties">
                    {hospital.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag">
                        {getSpecialtyIcon(specialty)}
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="services-list">
                  <h4>Services:</h4>
                  <div className="services">
                    {hospital.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>

                <div className="features-list">
                  <h4>Features:</h4>
                  <div className="features">
                    {hospital.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>

                <div className="hospital-actions">
                  <button className="primary-btn">
                    <FaUserMd />
                    Book Appointment
                  </button>
                  <button className="secondary-btn">
                    <FaMapMarkerAlt />
                    Get Directions
                  </button>
                  <button className="tertiary-btn">
                    <FaPhone />
                    Call Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredHospitals.length === 0 && (
          <div className="no-results">
            <FaHospital className="no-results-icon" />
            <h3>No hospitals found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}

        {/* Emergency Notice */}
        <div className="emergency-notice">
          <FaAmbulance className="emergency-icon" />
          <div className="emergency-content">
            <h4>Medical Emergency?</h4>
            <p>If you're experiencing a medical emergency, call 911 immediately or go to your nearest emergency room.</p>
            <button className="emergency-btn">
              <FaPhone />
              Call 911
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalsPage;
