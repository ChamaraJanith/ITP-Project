// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './styles/SpecialtyPage.css';

// const SpecialtyPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [doctors, setDoctors] = useState([]);
//   const [filteredDoctors, setFilteredDoctors] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [selectedSpecialty, setSelectedSpecialty] = useState('All');

//   const specialties = [
//     'All',
//     'Cardiology',
//     'Neurology',
//     'Ophthalmology',
//     'Orthopedics',
//     'Pediatrics',
//     'Dermatology',
//     'Psychiatry',
//     'General Medicine',
//     'Surgery'
//   ];

//   // Fetch all doctors on component mount
//   useEffect(() => {
//     fetchDoctors();
//   }, []);

//   // Filter doctors when search query or specialty changes
//   useEffect(() => {
//     filterDoctors();
//   }, [searchQuery, selectedSpecialty, doctors]);

//   const fetchDoctors = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const response = await axios.get('http://localhost:7000/api/doctors');
//       setDoctors(response.data);
//       setFilteredDoctors(response.data);
//     } catch (err) {
//       setError('Failed to fetch doctors. Please try again later.');
//       console.error('Error fetching doctors:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterDoctors = () => {
//     let filtered = doctors;

//     // Filter by specialty
//     if (selectedSpecialty !== 'All') {
//       filtered = filtered.filter(
//         doctor => doctor.specialization?.toLowerCase() === selectedSpecialty.toLowerCase()
//       );
//     }

//     // Filter by search query (name or specialization)
//     if (searchQuery.trim()) {
//       filtered = filtered.filter(doctor =>
//         doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         doctor.qualifications?.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     setFilteredDoctors(filtered);
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     filterDoctors();
//   };

//   const handleBookAppointment = (doctorId) => {
//     navigate(`/book-appointment?doctorId=${doctorId}`);
//   };

//   const clearSearch = () => {
//     setSearchQuery('');
//     setSelectedSpecialty('All');
//   };

//   return (
//     <div className="specialty-page">
//       {/* Header Section */}
//       <div className="specialty-header">
//         <div className="header-content">
//           <h1>🩺 Medical Specialty</h1>
//           <p>Find specialized medical services and expert healthcare professionals</p>
//         </div>
//       </div>

//       {/* Search Section */}
//       <div className="search-section">
//         <div className="search-container">
//           <form onSubmit={handleSearch} className="search-form">
//             <div className="search-input-wrapper">
//               <input
//                 type="text"
//                 placeholder="Search by doctor name, specialty, or qualifications..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="search-input"
//               />
//               <button type="submit" className="search-button">
//                 🔍 Search
//               </button>
//               {(searchQuery || selectedSpecialty !== 'All') && (
//                 <button type="button" onClick={clearSearch} className="clear-button">
//                   ✕ Clear
//                 </button>
//               )}
//             </div>
//           </form>

//           {/* Specialty Filter */}
//           <div className="specialty-filter">
//             <label>Filter by Specialty:</label>
//             <select
//               value={selectedSpecialty}
//               onChange={(e) => setSelectedSpecialty(e.target.value)}
//               className="specialty-select"
//             >
//               {specialties.map(specialty => (
//                 <option key={specialty} value={specialty}>
//                   {specialty}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Results Section */}
//       <div className="results-section">
//         <div className="results-header">
//           <h2>
//             {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} Found
//           </h2>
//           {(searchQuery || selectedSpecialty !== 'All') && (
//             <p className="search-info">
//               Showing results for: 
//               {searchQuery && <span className="search-tag">"{searchQuery}"</span>}
//               {selectedSpecialty !== 'All' && (
//                 <span className="search-tag">{selectedSpecialty}</span>
//               )}
//             </p>
//           )}
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="loading-container">
//             <div className="spinner"></div>
//             <p>Loading doctors...</p>
//           </div>
//         )}

//         {/* Error State */}
//         {error && (
//           <div className="error-container">
//             <p className="error-message">⚠️ {error}</p>
//             <button onClick={fetchDoctors} className="retry-button">
//               Try Again
//             </button>
//           </div>
//         )}

//         {/* Doctors Grid */}
//         {!loading && !error && (
//           <div className="doctors-grid">
//             {filteredDoctors.length > 0 ? (
//               filteredDoctors.map((doctor) => (
//                 <div key={doctor._id} className="doctor-card">
//                   <div className="doctor-image">
//                     {doctor.image ? (
//                       <img src={doctor.image} alt={doctor.name} />
//                     ) : (
//                       <div className="doctor-placeholder">
//                         👨‍⚕️
//                       </div>
//                     )}
//                   </div>
                  
//                   <div className="doctor-info">
//                     <h3 className="doctor-name">{doctor.name}</h3>
//                     <p className="doctor-specialty">
//                       <span className="specialty-badge">
//                         {doctor.specialization || 'General Medicine'}
//                       </span>
//                     </p>
                    
//                     {doctor.qualifications && (
//                       <p className="doctor-qualifications">
//                         🎓 {doctor.qualifications}
//                       </p>
//                     )}
                    
//                     {doctor.experience && (
//                       <p className="doctor-experience">
//                         💼 {doctor.experience} years of experience
//                       </p>
//                     )}
                    
//                     {doctor.hospital && (
//                       <p className="doctor-hospital">
//                         🏥 {doctor.hospital}
//                       </p>
//                     )}

//                     {doctor.rating && (
//                       <div className="doctor-rating">
//                         {'⭐'.repeat(Math.floor(doctor.rating))}
//                         <span className="rating-value">({doctor.rating})</span>
//                       </div>
//                     )}

//                     {/* Available Hours */}
//                     {doctor.availableHours && doctor.availableHours.length > 0 && (
//                       <div className="available-hours">
//                         <p className="hours-title">📅 Available Hours:</p>
//                         <div className="hours-list">
//                           {doctor.availableHours.slice(0, 3).map((hour, index) => (
//                             <div key={index} className="hour-item">
//                               <span className="day">{hour.day}:</span>
//                               <span className="time">
//                                 {hour.startTime} - {hour.endTime}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* Contact Info */}
//                     <div className="doctor-contact">
//                       {doctor.phone && (
//                         <p className="contact-item">
//                           📞 {doctor.phone}
//                         </p>
//                       )}
//                       {doctor.email && (
//                         <p className="contact-item">
//                           ✉️ {doctor.email}
//                         </p>
//                       )}
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="doctor-actions">
//                       <button
//                         onClick={() => handleBookAppointment(doctor._id)}
//                         className="book-button"
//                       >
//                         📅 Book Appointment
//                       </button>
//                       <button className="view-profile-button">
//                         👁️ View Profile
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="no-results">
//                 <div className="no-results-icon">🔍</div>
//                 <h3>No Doctors Found</h3>
//                 <p>
//                   We couldn't find any doctors matching your search criteria.
//                   <br />
//                   Try adjusting your search or filters.
//                 </p>
//                 <button onClick={clearSearch} className="reset-button">
//                   Reset Search
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Newsletter Section */}
//       <div className="newsletter-section">
//         <div className="newsletter-content">
//           <h3>Stay Updated with Private Health Insights</h3>
//           <p>Get the latest medical breakthroughs and personalized health tips delivered to your inbox</p>
//           <div className="newsletter-form">
//             <input
//               type="email"
//               placeholder="Enter your email address"
//               className="newsletter-input"
//             />
//             <button className="subscribe-button">
//               📧 Subscribe
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SpecialtyPage;

// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import './styles/SpecialtyPage.css';

// const doctorData = [
//   {
//     _id: "1",
//     name: "Dr. Alice",
//     specialization: "pediatrics",
//     qualifications: "MBBS",
//     experience: 5,
//     hospital: "City Hospital",
//     email: "alice@example.com",
//     phone: "0123456789",
//     rating: 4,
//     availableHours: [
//       { day: "Monday", startTime: "10:00", endTime: "14:00" },
//       { day: "Wednesday", startTime: "12:00", endTime: "16:00" }
//     ]
//   },
//   {
//     _id: "2",
//     name: "Dr. Frank",
//     specialization: "dentist",
//     qualifications: "BDS",
//     experience: 8,
//     hospital: "Dental Care Center",
//     email: "frank@example.com",
//     phone: "0112345678",
//     rating: 5,
//     availableHours: [
//       { day: "Tuesday", startTime: "09:00", endTime: "13:00" },
//       { day: "Thursday", startTime: "11:00", endTime: "15:00" }
//     ]
//   },
//   {
//     _id: "3",
//     name: "Dr. Bob",
//     specialization: "cardiology",
//     qualifications: "MD",
//     experience: 10,
//     hospital: "Heart Care Center",
//     email: "bob@example.com",
//     phone: "0198765432",
//     rating: 4.5,
//     availableHours: [
//       { day: "Monday", startTime: "08:00", endTime: "12:00" },
//       { day: "Friday", startTime: "10:00", endTime: "14:00" }
//     ]
//   },
//   {
//     _id: "4",
//     name: "Dr. Grace",
//     specialization: "dentist",
//     qualifications: "BDS",
//     experience: 5,
//     hospital: "Smile Dental Clinic",
//     email: "grace@example.com",
//     phone: "0123987654",
//     rating: 4,
//     availableHours: [
//       { day: "Wednesday", startTime: "10:00", endTime: "14:00" },
//       { day: "Friday", startTime: "09:00", endTime: "12:00" }
//     ]
//   }
// ];

// const SpecialtyPage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const queryParams = new URLSearchParams(location.search);
//   const specialty = queryParams.get("specialty") || "";
//   const searchName = queryParams.get("name") || "";

//   const [filteredDoctors, setFilteredDoctors] = useState([]);

//   useEffect(() => {
//     // Filter hardcoded doctors by specialty and search name
//     let filtered = doctorData;

//     if (specialty) {
//       filtered = filtered.filter(
//         doc => doc.specialization.toLowerCase() === specialty.toLowerCase()
//       );
//     }

//     if (searchName) {
//       filtered = filtered.filter(doc =>
//         doc.name.toLowerCase().includes(searchName.toLowerCase())
//       );
//     }

//     setFilteredDoctors(filtered);
//   }, [specialty, searchName]);

//   const handleBookAppointment = (doctorId) => {
//     navigate(`/book-appointment?doctorId=${doctorId}`);
//   };

//   const clearSearch = () => {
//     navigate("/specialty");
//   };

//   return (
//     <div className="specialty-page">
//       <h1>Doctors for: {specialty || "All Specialties"}</h1>

//       {filteredDoctors.length === 0 ? (
//         <p>No doctors found.</p>
//       ) : (
//         <div className="doctors-grid">
//           {filteredDoctors.map(doctor => (
//             <div key={doctor._id} className="doctor-card">
//               <div className="doctor-info">
//                 <h3>{doctor.name}</h3>
//                 <p><strong>Specialty:</strong> {doctor.specialization}</p>
//                 <p><strong>Qualifications:</strong> {doctor.qualifications}</p>
//                 <p><strong>Experience:</strong> {doctor.experience} years</p>
//                 <p><strong>Hospital:</strong> {doctor.hospital}</p>
//                 <p><strong>Email:</strong> {doctor.email}</p>
//                 <p><strong>Phone:</strong> {doctor.phone}</p>
//                 <p><strong>Rating:</strong> {'⭐'.repeat(Math.floor(doctor.rating))} ({doctor.rating})</p>

//                 <div>
//                   <p>📅 Available Hours:</p>
//                   {doctor.availableHours.map((slot, i) => (
//                     <p key={i}>{slot.day}: {slot.startTime} - {slot.endTime}</p>
//                   ))}
//                 </div>

//                 <button onClick={() => handleBookAppointment(doctor._id)}>
//                   📅 Book Appointment
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       <button onClick={clearSearch} style={{ marginTop: "1rem" }}>✕ Clear Search</button>
//     </div>

    
//   );
// };

// export default SpecialtyPage;

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/SpecialtyPage.css";

const doctorData = [
  {
    _id: "1",
    name: "Dr. Alice Perera",
    specialization: "pediatrics",
    qualifications: "MBBS",
    experience: 5,
    hospital: "City Hospital, Colombo",
    email: "alice@example.com",
    phone: "0123456789",
    rating: 4,
    verified: true,
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    _id: "2",
    name: "Dr. Frank Silva",
    specialization: "dentist",
    qualifications: "BDS",
    experience: 8,
    hospital: "Dental Care Center, Kandy",
    email: "frank@example.com",
    phone: "0112345678",
    rating: 5,
    verified: true,
    image: "https://randomuser.me/api/portraits/men/46.jpg",
  },
  {
    _id: "3",
    name: "Dr. Bob Fernando",
    specialization: "cardiology",
    qualifications: "MD",
    experience: 2,
    hospital: "Heart Care Center, Colombo",
    email: "bob@example.com",
    phone: "0198765432",
    rating: 4.5,
    verified: true,
    image: "https://randomuser.me/api/portraits/men/42.jpg",
  },
  {
    _id: "4",
    name: "Dr. Grace Wijesinghe",
    specialization: "dentist",
    qualifications: "BDS",
    experience: 5,
    hospital: "Smile Dental Clinic, Galle",
    email: "grace@example.com",
    phone: "0123987654",
    rating: 4,
    verified: true,
    image: "https://randomuser.me/api/portraits/women/47.jpg",
  },
];

const SpecialtyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const specialty = queryParams.get("specialty") || "";
  const searchName = queryParams.get("name") || "";

  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    let filtered = doctorData;
    if (specialty) {
      filtered = filtered.filter(
        (doc) => doc.specialization.toLowerCase() === specialty.toLowerCase()
      );
    }
    if (searchName) {
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    setFilteredDoctors(filtered);
  }, [specialty, searchName]);

  const handleBookAppointment = (doctorId) => {
    navigate(`/book-appointment?doctorId=${doctorId}`);
  };

  const clearSearch = () => {
    navigate("/");
  };
  

  return (
    <div className="specialty-page">
      <h1>
        Doctors for: <span>{specialty || "All Specialties"}</span>
      </h1>

      {filteredDoctors.length === 0 ? (
        <p>No doctors found.</p>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="doctor-card">
              <div className="verified-badge">✔ Verified</div>
              <img
                src={doctor.image}
                alt={doctor.name}
                className="doctor-image"
              />
              <div className="doctor-info">
                <h3>{doctor.name}</h3>
                <p className="specialization">{doctor.specialization}</p>
                <p>{doctor.experience} Years Experience</p>
                <p>
                  {"⭐".repeat(Math.floor(doctor.rating))} ({doctor.rating}/5)
                </p>
                <p>🏥 {doctor.hospital}</p>
                <button
                  className="book-btn"
                  onClick={() => handleBookAppointment(doctor._id)}
                >
                  📅 Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={clearSearch} className="clear-btn">
        ✕ Clear Search
      </button>

    </div>
  );
};

export default SpecialtyPage;
