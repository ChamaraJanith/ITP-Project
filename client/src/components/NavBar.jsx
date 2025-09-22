import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHeartbeat,
  FaUserMd,
  FaStethoscope,
  FaHospital,
  FaAmbulance,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaPrescriptionBottleAlt,
  FaBell,
  FaTimes,
  FaBars,
  FaSearch
} from "react-icons/fa";

// Doctor specialties and suggestions
const SPECIALTY_TO_ID = {
  cardiologist: "s1",
  dermatologist: "s2",
  neurologist: "s3",
  pediatrician: "s4",
  orthopedic: "s5",
  gynecologist: "s6",
  psychiatrist: "s7",
  dentist: "s8"
};

const SEARCH_SUGGESTIONS = [
  "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician",
  "Orthopedic Surgeon", "Gynecologist", "Psychiatrist", "General Physician",
  "Dentist", "Eye Specialist", "Heart Specialist", "Skin Doctor"
];

// Enhanced Search Bar Component
function AdvancedSearchBar({ isMobile = false }) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = e => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    if (query.includes("doctor") || query.includes("specialist"))
      navigate("/doctors");
    else if (query.includes("appointment") || query.includes("booking"))
      navigate("/book-appointment");
    else if (SPECIALTY_TO_ID[query])
      navigate(`/specialty/${SPECIALTY_TO_ID[query]}`);
    else if (query)
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
    setShowSuggestions(false);
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setSearch(value);
    if (value.length > 0) {
      const filtered = SEARCH_SUGGESTIONS.filter(sug =>
        sug.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = suggestion => {
    setSearch(suggestion);
    setShowSuggestions(false);
    const query = suggestion.toLowerCase();
    if (query.includes("cardiologist") || query.includes("heart"))
      navigate("/specialty/cardiology");
    else if (query.includes("dermatologist") || query.includes("skin"))
      navigate("/specialty/dermatology");
    else if (SPECIALTY_TO_ID[query])
      navigate(`/specialty/${SPECIALTY_TO_ID[query]}`);
  };

  const clearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
  };

  return (
    <div style={{
      position: "relative",
      width: isMobile ? "100%" : 380,
      margin: "0 auto"
    }}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search doctors, specialties..."
          value={search}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            search.length > 0 && setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          style={{
            width: "100%",
            padding: "12px 45px 12px 45px",
            fontSize: 16,
            borderRadius: 50,
            border: `2px solid ${isFocused ? '#4f46e5' : '#e2e8f0'}`,
            outline: "none",
            background: "#ffffff",
            color: "#1a202c",
            boxSizing: "border-box",
            transition: "all 0.3s ease",
            boxShadow: isFocused ? "0 4px 20px rgba(79, 70, 229, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.05)"
          }}
        />
        
        {/* Search Icon */}
        <span style={{
          position: "absolute",
          left: 15,
          top: "50%",
          transform: "translateY(-50%)",
          color: isFocused ? "#4f46e5" : "#6b7280",
          pointerEvents: "none",
          fontSize: 18,
          transition: "color 0.3s ease"
        }}>
          <FaSearch />
        </span>
        
        {/* Clear Icon */}
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            style={{
              position: "absolute",
              right: 15,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: 16,
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = "#f3f4f6";
              e.target.style.color = "#374151";
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#6b7280";
            }}
          >
            <FaTimes />
          </button>
        )}
      </form>
      
      {/* Enhanced Suggestions Box */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: 55,
          left: 0,
          right: 0,
          background: "#ffffff",
          color: "#1a202c",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          overflow: "hidden"
        }}>
          {filteredSuggestions.slice(0, 5).map((s, i) => (
            <div
              key={i}
              onClick={() => handleSuggestionClick(s)}
              style={{
                padding: "12px 18px",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 500,
                borderBottom: i !== filteredSuggestions.slice(0, 5).length - 1 ? "1px solid #f1f5f9" : "none",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => {
                e.target.style.backgroundColor = "#f8fafc";
                e.target.style.color = "#4f46e5";
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#1a202c";
              }}
            >
              <FaSearch style={{ fontSize: 12, opacity: 0.6 }} />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MedicalNavbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState(3);
  const [upcomingAppointments] = useState(2);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Enhanced Nav Links with hover effects
  const navLinks = (
    <>
      <Link 
        to="/Login" 
        style={{
          textDecoration: "none", 
          color: "#4a5568", 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 15,
          fontWeight: 600,
          padding: "8px 16px",
          borderRadius: 8,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#f7fafc";
          e.target.style.color = "#4f46e5";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#4a5568";
          e.target.style.transform = "translateY(0)";
        }}
      >
        <FaUserMd /> Login
      </Link>
      
      <Link 
        to="/register" 
        style={{
          textDecoration: "none", 
          color: "#4a5568", 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 15,
          fontWeight: 600,
          padding: "8px 16px",
          borderRadius: 8,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#f7fafc";
          e.target.style.color = "#4f46e5";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#4a5568";
          e.target.style.transform = "translateY(0)";
        }}
      >
        <FaStethoscope /> Register
      </Link>
      
      <Link 
        to="/hospitals" 
        style={{
          textDecoration: "none", 
          color: "#4a5568", 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 15,
          fontWeight: 600,
          padding: "8px 16px",
          borderRadius: 8,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#f7fafc";
          e.target.style.color = "#4f46e5";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#4a5568";
          e.target.style.transform = "translateY(0)";
        }}
      >
        <FaHospital /> Hospitals
      </Link>
      
      <Link 
        to="/emergency" 
        style={{
          textDecoration: "none", 
          color: "#e53e3e", 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 15,
          fontWeight: 600,
          padding: "8px 16px",
          borderRadius: 8,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#fed7d7";
          e.target.style.color = "#c53030";
          e.target.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#e53e3e";
          e.target.style.transform = "translateY(0)";
        }}
      >
        <FaAmbulance /> Emergency
      </Link>
    </>
  );

  // Enhanced Action Items with better styling
  const actionItems = (
    <>
      <button 
        style={{
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          color: "#6b7280", 
          fontSize: 20, 
          padding: "10px", 
          borderRadius: 8,
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: 6
        }} 
        onClick={() => navigate("/book-appointment")}
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#f3f4f6";
          e.target.style.color = "#4f46e5";
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#6b7280";
          e.target.style.transform = "scale(1)";
        }}
        title="Book Appointment"
      >
        <FaCalendarAlt />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Book</span>
      </button>
      
      <div style={{ position: "relative" }}>
        <button 
          style={{
            background: "none", 
            border: "none", 
            cursor: "pointer", 
            color: "#6b7280", 
            fontSize: 20,
            padding: "10px",
            borderRadius: 8,
            transition: "all 0.3s ease"
          }} 
          title="Notifications"
          onMouseEnter={e => {
            e.target.style.backgroundColor = "#f3f4f6";
            e.target.style.color = "#4f46e5";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#6b7280";
            e.target.style.transform = "scale(1)";
          }}
        >
          <FaBell />
        </button>
        {notifications > 0 && (
          <span style={{
            position: "absolute", 
            top: 4, 
            right: 4, 
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#fff", 
            borderRadius: "50%", 
            minWidth: 18, 
            height: 18, 
            fontSize: 11, 
            fontWeight: 700,
            display: "flex",
            justifyContent: "center", 
            alignItems: "center",
            border: "2px solid #ffffff",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)"
          }}>
            {notifications}
          </span>
        )}
      </div>
      
      <div style={{ position: "relative" }}>
        <button 
          style={{
            background: "none", 
            border: "none", 
            cursor: "pointer", 
            color: "#6b7280", 
            fontSize: 20,
            padding: "10px",
            borderRadius: 8,
            transition: "all 0.3s ease"
          }} 
          title="My Appointments" 
          onClick={() => navigate("/appointments")}
          onMouseEnter={e => {
            e.target.style.backgroundColor = "#f3f4f6";
            e.target.style.color = "#4f46e5";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#6b7280";
            e.target.style.transform = "scale(1)";
          }}
        >
          <FaClock />
        </button>
        {upcomingAppointments > 0 && (
          <span style={{
            position: "absolute", 
            top: 4, 
            right: 4, 
            background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
            color: "#fff", 
            borderRadius: "50%", 
            minWidth: 18, 
            height: 18, 
            fontSize: 11, 
            fontWeight: 700,
            display: "flex",
            justifyContent: "center", 
            alignItems: "center",
            border: "2px solid #ffffff",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"
          }}>
            {upcomingAppointments}
          </span>
        )}
      </div>
      
      <button 
        style={{
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          color: "#6b7280", 
          fontSize: 20,
          padding: "10px",
          borderRadius: 8,
          transition: "all 0.3s ease"
        }} 
        onClick={() => navigate("/medical-records")}
        title="Medical Records"
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#f3f4f6";
          e.target.style.color = "#4f46e5";
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#6b7280";
          e.target.style.transform = "scale(1)";
        }}
      >
        <FaPrescriptionBottleAlt />
      </button>
      
      <button 
        style={{
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          color: "#6b7280", 
          fontSize: 20,
          padding: "10px",
          borderRadius: 8,
          transition: "all 0.3s ease"
        }} 
        onClick={() => navigate("/PatientProfile")}
        title="Profile"
        onMouseEnter={e => {
          e.target.style.backgroundColor = "#f3f4f6";
          e.target.style.color = "#4f46e5";
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={e => {
          e.target.style.backgroundColor = "transparent";
          e.target.style.color = "#6b7280";
          e.target.style.transform = "scale(1)";
        }}
      >
        <FaUser />
      </button>
    </>
  );

  // Enhanced Mobile Menu
  const mobileMenu = isOpen && (
    <>
      <div 
        style={{
          position: "fixed", 
          inset: 0, 
          background: "rgba(0, 0, 0, 0.5)", 
          zIndex: 1200,
          backdropFilter: "blur(4px)"
        }} 
        onClick={() => setIsOpen(false)} 
      />
      <div style={{
        position: "fixed", 
        top: 0, 
        right: 0, 
        width: 320, 
        height: "100vh",
        background: "#ffffff", 
        boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.1)", 
        zIndex: 1300, 
        padding: 32,
        transform: "translateX(0)", 
        display: "flex", 
        flexDirection: "column", 
        gap: 24,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20
      }}>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{
            alignSelf: "flex-end", 
            background: "none", 
            border: "none", 
            fontSize: 24,
            color: "#6b7280",
            padding: 8,
            borderRadius: 8,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={e => e.target.style.backgroundColor = "#f3f4f6"}
          onMouseLeave={e => e.target.style.backgroundColor = "transparent"}
        >
          <FaTimes />
        </button>
        
        <Link 
          to="/" 
          onClick={() => setIsOpen(false)} 
          style={{
            display: "flex", 
            alignItems: "center", 
            fontWeight: "bold", 
            fontSize: 24, 
            color: "#4f46e5",
            textDecoration: "none",
            gap: 12,
            padding: "12px 0"
          }}
        >
          <FaHeartbeat /> Heal X
        </Link>
        
        <div style={{ marginBottom: 16 }}>
          <AdvancedSearchBar isMobile={true} />
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {navLinks}
        </div>
        
        <hr style={{ borderColor: "#e2e8f0", margin: "16px 0" }} />
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Link 
            to="/appointments" 
            onClick={() => setIsOpen(false)} 
            style={{
              textDecoration: "none", 
              color: "#4a5568", 
              display: "flex", 
              alignItems: "center",
              gap: 12,
              fontSize: 16,
              fontWeight: 600,
              padding: "12px 0"
            }}
          >
            <FaCalendarAlt /> My Appointments
          </Link>
          
          <Link 
            to="/medical-records" 
            onClick={() => setIsOpen(false)} 
            style={{
              textDecoration: "none", 
              color: "#4a5568", 
              display: "flex", 
              alignItems: "center",
              gap: 12,
              fontSize: 16,
              fontWeight: 600,
              padding: "12px 0"
            }}
          >
            <FaPrescriptionBottleAlt /> Medical Records
          </Link>
          
          <Link 
            to="/PatientProfile" 
            onClick={() => setIsOpen(false)} 
            style={{
              textDecoration: "none", 
              color: "#4a5568", 
              display: "flex", 
              alignItems: "center",
              gap: 12,
              fontSize: 16,
              fontWeight: 600,
              padding: "12px 0"
            }}
          >
            <FaUser /> My Profile
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {!isMobile && (
        <nav
          style={{
            backgroundColor: scrolled ? "rgba(255, 255, 255, 0.95)" : "#ffffff",
            borderBottom: scrolled ? "1px solid #e2e8f0" : "2px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
            padding: "0 32px",
            transition: "all 0.3s ease",
            backdropFilter: scrolled ? "blur(10px)" : "none"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 72,
              maxWidth: 1400,
              margin: "0 auto",
              width: "100%"
            }}
          >
            {/* LEFT: Logo & Nav Links */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                flexShrink: 0
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#4f46e5",
                  fontWeight: "800",
                  fontSize: 26,
                  textDecoration: "none",
                  gap: 10,
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"}
              >
                <FaHeartbeat style={{ fontSize: 28 }} /> Heal X
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {navLinks}
              </div>
            </div>

            {/* CENTER: Search Bar */}
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                minWidth: 0,
                margin: "0 40px"
              }}
            >
              <AdvancedSearchBar />
            </div>

            {/* RIGHT: Action Icons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0
              }}
            >
              {actionItems}
            </div>
          </div>
        </nav>
      )}

      {/* MOBILE NAVBAR */}
      {isMobile && (
        <>
          <nav
            style={{
              backgroundColor: "#ffffff",
              borderBottom: "2px solid #e2e8f0",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              padding: "0 20px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 64
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#4f46e5",
                  fontWeight: "800",
                  fontSize: 24,
                  textDecoration: "none",
                  gap: 8
                }}
              >
                <FaHeartbeat /> Heal X
              </Link>
              <button
                style={{
                  display: "block",
                  fontSize: 28,
                  color: "#4f46e5",
                  background: "none",
                  border: "none",
                  padding: "8px",
                  borderRadius: 8,
                  transition: "all 0.2s ease"
                }}
                onClick={() => setIsOpen(true)}
                onMouseEnter={e => e.target.style.backgroundColor = "#f3f4f6"}
                onMouseLeave={e => e.target.style.backgroundColor = "transparent"}
              >
                <FaBars />
              </button>
            </div>
          </nav>
          <div style={{ 
            background: "#ffffff", 
            borderBottom: "1px solid #e2e8f0", 
            padding: 16 
          }}>
            <AdvancedSearchBar isMobile={true} />
          </div>
          {mobileMenu}
        </>
      )}
    </>
  );
}

export default MedicalNavbar;
