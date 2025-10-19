import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  FaStethoscope,
  FaSpinner
} from 'react-icons/fa';
import './HospitalsPage.css';

const HospitalsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7000';

  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        fetchNearbyHospitals(latitude, longitude);
      },
      (error) => {
        console.error('Error getting user location:', error);
        setLoading(false);
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while fetching location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchNearbyHospitals = async (latitude, longitude) => {
    try {
      setLoading(true);
      
      console.log(`Fetching hospitals near: ${latitude}, ${longitude}`);
      
      const response = await axios.get(
        `${API_URL}/api/hospitals/nearby`,
        {
          params: {
            latitude,
            longitude,
            radius: 5000
          }
        }
      );

      console.log('API Response:', response.data);

      if (response.data.status === 'OK' && response.data.results) {
        // Format hospital data and filter out invalid entries
        const hospitalsData = response.data.results
          .map((place) => formatHospitalData(place, latitude, longitude))
          .filter(hospital => hospital !== null); // ✅ Filter out null values
        
        // Remove duplicate hospitals
        const uniqueHospitals = removeDuplicateHospitals(hospitalsData);
        
        console.log(`Found ${response.data.results.length} hospitals, ${hospitalsData.length} valid, ${uniqueHospitals.length} unique`);
        
        setHospitals(uniqueHospitals);
        setError(null);
      } else if (response.data.status === 'ZERO_RESULTS') {
        setHospitals([]);
        setError('No hospitals found in your area (within 5km radius).');
      } else {
        setError(`Failed to fetch hospitals: ${response.data.status || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError(`Failed to fetch nearby hospitals: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Remove duplicate hospitals with null checks
  const removeDuplicateHospitals = (hospitals) => {
    const seen = new Map();
    
    return hospitals.filter(hospital => {
      // Skip if invalid coordinates
      if (!hospital.latitude || !hospital.longitude) {
        return false;
      }

      // Create a unique key based on name and approximate location
      const locationKey = `${hospital.name.toLowerCase().trim()}_${hospital.latitude.toFixed(3)}_${hospital.longitude.toFixed(3)}`;
      
      if (seen.has(locationKey)) {
        console.log(`Duplicate removed: ${hospital.name}`);
        return false;
      }
      
      seen.set(locationKey, true);
      return true;
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  // ✅ FIXED: Return null if coordinates are invalid
  const formatHospitalData = (place, userLat, userLng) => {
    try {
      const lat = place.geometry?.location?.lat;
      const lng = place.geometry?.location?.lng;
      
      // ✅ CRITICAL: Validate coordinates exist
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for hospital: ${place.name}`);
        return null;
      }
      
      const distance = calculateDistance(userLat, userLng, lat, lng);

      // Better address extraction
      let address = 'Address not available';
      
      if (place.vicinity) {
        address = place.vicinity;
      } else if (place.tags) {
        address = formatOSMAddress(place.tags);
      } else if (place.formatted_address) {
        address = place.formatted_address;
      }

      let imageUrl = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400';
      if (place.photos && place.photos[0]) {
        if (typeof place.photos[0] === 'string') {
          imageUrl = place.photos[0];
        }
      }

      return {
        id: place.place_id || `hospital_${Date.now()}_${Math.random()}`,
        name: place.name || 'Hospital',
        address: address,
        phone: place.phone || place.formatted_phone_number || place.tags?.phone || place.tags?.['contact:phone'] || 'Not available',
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        distance: `${distance} km`,
        type: determineHospitalType(place.types || []),
        services: extractServices(place),
        specialties: extractSpecialties(place.types || [], place.tags),
        beds: place.tags?.beds || Math.floor(Math.random() * 400) + 50,
        established: place.tags?.start_date || new Date().getFullYear() - Math.floor(Math.random() * 50),
        features: extractFeatures(place),
        image: imageUrl,
        website: place.website || place.tags?.website || place.tags?.['contact:website'] || null,
        isOpen: place.opening_hours?.open_now,
        latitude: lat,
        longitude: lng
      };
    } catch (error) {
      console.error(`Error formatting hospital data:`, error, place);
      return null;
    }
  };

  const formatOSMAddress = (tags) => {
    const parts = [];
    
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    
    if (tags['addr:city']) {
      parts.push(tags['addr:city']);
    } else if (tags['addr:town']) {
      parts.push(tags['addr:town']);
    } else if (tags['addr:village']) {
      parts.push(tags['addr:village']);
    }
    
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    
    if (parts.length < 2) {
      if (tags['addr:district']) parts.push(tags['addr:district']);
      if (tags['addr:state']) parts.push(tags['addr:state']);
    }
    
    if (parts.length === 0 && tags.name) {
      return `${tags.name} area`;
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const determineHospitalType = (types) => {
    if (types.includes('hospital')) return 'General Hospital';
    if (types.includes('health')) return 'Medical Center';
    if (types.includes('clinic')) return 'Clinic';
    return 'Healthcare Facility';
  };

  const extractServices = (place) => {
    const services = [];
    
    if (place.tags?.emergency === 'yes' || place.types?.includes('hospital')) {
      services.push('Emergency Care');
    }
    
    services.push('Outpatient Services');
    services.push('Diagnostic Services');
    
    if (place.tags?.['healthcare:speciality']) {
      const specialities = place.tags['healthcare:speciality'].split(';');
      services.push(...specialities.slice(0, 2));
    }
    
    return services;
  };

  const extractSpecialties = (types, tags) => {
    const specialties = new Set();
    
    const specialtyMap = {
      'doctor': 'General Medicine',
      'hospital': 'Emergency Care',
      'health': 'Primary Care',
      'medical_center': 'Multi-specialty',
      'clinic': 'General Medicine'
    };
    
    types.forEach(type => {
      if (specialtyMap[type]) {
        specialties.add(specialtyMap[type]);
      }
    });
    
    if (tags?.['healthcare:speciality']) {
      const osmSpecialties = tags['healthcare:speciality'].split(';');
      osmSpecialties.forEach(spec => specialties.add(spec.trim()));
    }
    
    if (specialties.size === 0) {
      specialties.add('General Medicine');
      specialties.add('Emergency Care');
    }
    
    return Array.from(specialties);
  };

  const extractFeatures = (place) => {
    const features = [];
    
    if (place.opening_hours?.open_now) {
      features.push('Currently Open');
    }
    
    if (place.tags?.opening_hours === '24/7') {
      features.push('24/7 Open');
    }
    
    if (place.rating >= 4.5) {
      features.push('Highly Rated');
    }
    
    if (place.user_ratings_total > 100) {
      features.push('Well Reviewed');
    }
    
    if (place.tags?.wheelchair === 'yes') {
      features.push('Wheelchair Accessible');
    }
    
    if (place.tags?.emergency === 'yes') {
      features.push('Emergency Services');
    }
    
    if (place.tags?.parking === 'yes') {
      features.push('Parking Available');
    }
    
    if (place.tags?.internet_access === 'wlan') {
      features.push('WiFi Available');
    }
    
    return features;
  };

  useEffect(() => {
    getUserLocation();
  }, []);

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
    const spec = specialty.toLowerCase();
    if (spec.includes('cardio')) return <FaHeart className="specialty-icon" />;
    if (spec.includes('neuro')) return <FaBrain className="specialty-icon" />;
    if (spec.includes('pediatric') || spec.includes('child')) return <FaBaby className="specialty-icon" />;
    if (spec.includes('orthop') || spec.includes('bone')) return <FaBone className="specialty-icon" />;
    if (spec.includes('eye') || spec.includes('ophthal')) return <FaEye className="specialty-icon" />;
    return <FaStethoscope className="specialty-icon" />;
  };

  const handleGetDirections = (latitude, longitude) => {
    if (userLocation) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${latitude},${longitude}`,
        '_blank'
      );
    } else {
      alert('Your location is not available. Please enable location services.');
    }
  };

  return (
    <div className="hospitals-page">
      <div className="hospitals-header">
        <div className="header-content">
          <h1>
            <FaHospital className="header-icon" />
            Nearby Hospitals
          </h1>
          <p>Find hospitals and medical centers near your location</p>
          
          {userLocation && (
            <div className="location-info">
              <FaMapMarkerAlt /> 
              Your Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </div>
          )}

          <div className="header-stats">
            <div className="stat">
              <strong>{hospitals.length}</strong>
              <span>Hospitals Found</span>
            </div>
            <div className="stat">
              <strong>5km</strong>
              <span>Search Radius</span>
            </div>
            <div className="stat">
              <strong>Real-time</strong>
              <span>Location Data</span>
            </div>
          </div>

          <button onClick={getUserLocation} className="reload-btn">
            <FaMapMarkerAlt /> Refresh Location
          </button>
        </div>
      </div>

      <div className="hospitals-container">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={getUserLocation} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Finding nearby hospitals...</p>
          </div>
        )}

        {!loading && !error && hospitals.length > 0 && (
          <>
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

            <div className="results-info">
              <p>Showing {filteredHospitals.length} of {hospitals.length} hospitals within 5km</p>
            </div>

            <div className="hospitals-grid">
              {filteredHospitals.map(hospital => (
                <div key={hospital.id} className="hospital-card">
                  <div className="hospital-image">
                    <img 
                      src={hospital.image} 
                      alt={hospital.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400';
                      }}
                    />
                    <div className="hospital-type">{hospital.type}</div>
                    {hospital.isOpen !== undefined && (
                      <div className={`open-status ${hospital.isOpen ? 'open' : 'closed'}`}>
                        {hospital.isOpen ? 'Open Now' : 'Closed'}
                      </div>
                    )}
                  </div>

                  <div className="hospital-content">
                    <div className="hospital-header">
                      <h3>{hospital.name}</h3>
                      <div className="rating-section">
                        <div className="stars">
                          {renderStars(hospital.rating)}
                        </div>
                        <span className="rating-text">
                          {hospital.rating > 0 ? hospital.rating.toFixed(1) : 'N/A'} 
                          {hospital.reviews > 0 && ` (${hospital.reviews} reviews)`}
                        </span>
                      </div>
                    </div>

                    <div className="hospital-info">
                      <div className="info-item">
                        <FaMapMarkerAlt className="info-icon" />
                        <span>{hospital.address}</span>
                        <span className="distance">{hospital.distance}</span>
                      </div>

                      {hospital.phone !== 'Not available' && (
                        <div className="info-item">
                          <FaPhone className="info-icon" />
                          <a href={`tel:${hospital.phone}`}>{hospital.phone}</a>
                        </div>
                      )}
                    </div>

                    <div className="specialties-list">
                      <h4>Specialties:</h4>
                      <div className="specialties">
                        {hospital.specialties.slice(0, 4).map((specialty, index) => (
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

                    {hospital.features.length > 0 && (
                      <div className="features-list">
                        <h4>Features:</h4>
                        <div className="features">
                          {hospital.features.map((feature, index) => (
                            <span key={index} className="feature-taghos">{feature}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="hospital-actions">
                      <button className="primary-btn">
                        <FaUserMd />
                        Book Appointment
                      </button>
                      <button 
                        className="secondary-btn"
                        onClick={() => handleGetDirections(hospital.latitude, hospital.longitude)}
                      >
                        <FaMapMarkerAlt />
                        Get Directions
                      </button>
                      {hospital.phone !== 'Not available' && (
                        <button className="tertiary-btn">
                          <a href={`tel:${hospital.phone}`} style={{textDecoration: 'none', color: 'inherit'}}>
                            <FaPhone />
                            Call Now
                          </a>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && filteredHospitals.length === 0 && hospitals.length > 0 && (
          <div className="no-results">
            <FaHospital className="no-results-icon" />
            <h3>No hospitals found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}

        {!loading && !error && hospitals.length === 0 && (
          <div className="no-results">
            <FaHospital className="no-results-icon" />
            <h3>No hospitals found in your area</h3>
            <p>Try refreshing your location or check back later</p>
          </div>
        )}

        <div className="emergency-notice">
          <FaAmbulance className="emergency-icon" />
          <div className="emergency-content">
            <h4>Medical Emergency?</h4>
            <p>If you're experiencing a medical emergency, call 1990 (Sri Lanka) immediately.</p>
            <button className="emergency-btn">
              <a href="tel:1990" style={{textDecoration: 'none', color: 'inherit'}}>
                <FaPhone />
                Call 1990
              </a>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalsPage;
