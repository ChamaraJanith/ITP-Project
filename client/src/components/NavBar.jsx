// src/components/NavBar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  FaSearch,
  FaUserShield,
  FaSignOutAlt,
  FaExclamationTriangle
} from "react-icons/fa";

// Search suggestions and specialty mapping
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

// ==================== LOGOUT CONFIRMATION MODAL ====================
function LogoutConfirmationModal({ isOpen, onClose, onConfirm, userName }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          animation: "fadeIn 0.3s ease"
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "2rem",
          zIndex: 9999,
          minWidth: "400px",
          maxWidth: "90%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "scaleIn 0.3s ease"
        }}
      >
        {/* Icon */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "bounce 1s ease infinite"
          }}>
            <FaExclamationTriangle style={{
              fontSize: "2.5rem",
              color: "white"
            }} />
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          textAlign: "center",
          fontSize: "1.75rem",
          fontWeight: "800",
          color: "#1e293b",
          marginBottom: "0.75rem"
        }}>
          Logout Confirmation
        </h2>

        {/* Message */}
        <p style={{
          textAlign: "center",
          fontSize: "1rem",
          color: "#64748b",
          marginBottom: "2rem",
          lineHeight: "1.6"
        }}>
          {userName ? (
            <>
              <strong style={{ color: "#6366f1" }}>{userName}</strong>, are you sure you want to logout?
            </>
          ) : (
            "Are you sure you want to logout?"
          )}
          <br />
          <span style={{ fontSize: "0.9rem" }}>
            You'll need to login again to access your account.
          </span>
        </p>

        {/* Buttons */}
        <div style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center"
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "14px 24px",
              borderRadius: "12px",
              border: "2px solid #e2e8f0",
              background: "white",
              color: "#64748b",
              fontSize: "1rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={e => {
              e.target.style.background = "#f1f5f9";
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.color = "#475569";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.target.style.background = "white";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.color = "#64748b";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "14px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              fontSize: "1rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)"
            }}
            onMouseEnter={e => {
              e.target.style.background = "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 25px rgba(239, 68, 68, 0.4)";
            }}
            onMouseLeave={e => {
              e.target.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.3)";
            }}
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </>
  );
}

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
      width: isMobile ? "100%" : 420,
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
            padding: "14px 50px 14px 50px",
            fontSize: 15,
            borderRadius: 16,
            border: `2px solid ${isFocused ? '#6366f1' : 'transparent'}`,
            outline: "none",
            background: isFocused 
              ? "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" 
              : "rgba(241, 245, 249, 0.8)",
            color: "#1e293b",
            boxSizing: "border-box",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: isFocused 
              ? "0 8px 30px rgba(99, 102, 241, 0.2), 0 0 0 4px rgba(99, 102, 241, 0.1)" 
              : "0 2px 8px rgba(15, 23, 42, 0.06)",
            fontWeight: 500,
            backdropFilter: "blur(8px)"
          }}
        />
        
        <span style={{
          position: "absolute",
          left: 18,
          top: "50%",
          transform: "translateY(-50%)",
          color: isFocused ? "#6366f1" : "#64748b",
          pointerEvents: "none",
          fontSize: 18,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: isFocused ? "drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))" : "none"
        }}>
          <FaSearch />
        </span>
        
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            style={{
              position: "absolute",
              right: 18,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(100, 116, 139, 0.1)",
              border: "none",
              color: "#64748b",
              fontSize: 14,
              cursor: "pointer",
              padding: "6px",
              borderRadius: "50%",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
              e.target.style.color = "#ef4444";
              e.target.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "rgba(100, 116, 139, 0.1)";
              e.target.style.color = "#64748b";
              e.target.style.transform = "translateY(-50%) scale(1)";
            }}
          >
            <FaTimes />
          </button>
        )}
      </form>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          color: "#1e293b",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)",
          zIndex: 1000,
          overflow: "hidden",
          animation: "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {filteredSuggestions.slice(0, 5).map((s, i) => (
            <div
              key={i}
              onClick={() => handleSuggestionClick(s)}
              style={{
                padding: "14px 20px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                borderBottom: i !== filteredSuggestions.slice(0, 5).length - 1 
                  ? "1px solid rgba(226, 232, 240, 0.6)" 
                  : "none",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                position: "relative"
              }}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={e => {
                e.target.style.backgroundColor = "rgba(99, 102, 241, 0.08)";
                e.target.style.color = "#6366f1";
                e.target.style.paddingLeft = "26px";
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#1e293b";
                e.target.style.paddingLeft = "20px";
              }}
            >
              <FaSearch style={{ fontSize: 11, opacity: 0.5 }} />
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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState(3);
  const [upcomingAppointments] = useState(2);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [scrolled, setScrolled] = useState(false);
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // ✅ LOGOUT CONFIRMATION STATE
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        handleAuthError();
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    const handleAuthChange = () => {
      checkAuth();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ✅ SHOW LOGOUT CONFIRMATION
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // ✅ CANCEL LOGOUT
  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // ✅ CONFIRM LOGOUT
  const handleLogoutConfirm = () => {
    console.log('🚪 Logging out...');
    
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setIsAuthenticated(false);
    setUser(null);
    
    // Close modal and mobile menu
    setShowLogoutModal(false);
    setIsOpen(false);
    
    // Dispatch event
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Navigate to home
    navigate('/');
    
    console.log('✅ Logged out successfully');
  };

  // Navigation Links
  const navLinks = (
    <>
      {isAuthenticated && user && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "rgba(99, 102, 241, 0.08)",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          color: "#6366f1"
        }}>
          <FaUser style={{ fontSize: 14 }} />
          <span>Hi, {user.name?.split(' ')[0] || 'User'}</span>
        </div>
      )}
      
      {!isAuthenticated && (
        <>
          <Link 
            to="/login" 
            style={{
              textDecoration: "none", 
              color: "#475569", 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              fontSize: 15,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.color = "#6366f1";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FaUserMd style={{ fontSize: 18 }} /> Login
          </Link>
          
          <Link 
            to="/register" 
            style={{
              textDecoration: "none", 
              color: "#475569", 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              fontSize: 15,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.color = "#6366f1";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FaStethoscope style={{ fontSize: 18 }} /> Register
          </Link>
        </>
      )}
      
      <Link 
        to="/hospitals" 
        style={{
          textDecoration: "none", 
          color: "#475569", 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 15,
          fontWeight: 600,
          padding: "10px 18px",
          borderRadius: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
          e.currentTarget.style.color = "#6366f1";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#475569";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <FaHospital style={{ fontSize: 18 }} /> Hospitals
      </Link>
      
      <Link 
        to="/emergency" 
        style={{
          textDecoration: "none", 
          color: "#dc2626", 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          fontSize: 15,
          fontWeight: 700,
          padding: "10px 18px",
          borderRadius: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "rgba(239, 68, 68, 0.05)"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
          e.currentTarget.style.color = "#b91c1c";
          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.25)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
          e.currentTarget.style.color = "#dc2626";
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <FaAmbulance style={{ fontSize: 18 }} /> Emergency
      </Link>
    </>
  );

  // Action Items
  const actionItems = (
    <>
      {isAuthenticated ? (
        <>
          <button 
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", 
              border: "none", 
              cursor: "pointer", 
              color: "#ffffff", 
              fontSize: 14, 
              fontWeight: 700,
              padding: "12px 20px", 
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)"
            }} 
            onClick={() => navigate("/book-appointment")}
            onMouseEnter={e => {
              e.target.style.transform = "translateY(-2px) scale(1.02)";
              e.target.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={e => {
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.3)";
            }}
            title="Book Appointment"
          >
            <FaCalendarAlt />
            <span>Book Now</span>
          </button>
          
          <div style={{ position: "relative" }}>
            <button 
              style={{
                background: "rgba(241, 245, 249, 0.8)", 
                border: "none", 
                cursor: "pointer", 
                color: "#64748b", 
                fontSize: 18,
                padding: "12px",
                borderRadius: 12,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44
              }} 
              title="Notifications"
              onMouseEnter={e => {
                e.target.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
                e.target.style.color = "#6366f1";
                e.target.style.transform = "scale(1.08) rotate(12deg)";
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = "rgba(241, 245, 249, 0.8)";
                e.target.style.color = "#64748b";
                e.target.style.transform = "scale(1) rotate(0deg)";
              }}
            >
              <FaBell />
            </button>
            {notifications > 0 && (
              <span style={{
                position: "absolute", 
                top: 2, 
                right: 2, 
                background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                color: "#fff", 
                borderRadius: "50%", 
                minWidth: 20, 
                height: 20, 
                fontSize: 11, 
                fontWeight: 700,
                display: "flex",
                justifyContent: "center", 
                alignItems: "center",
                border: "2.5px solid #ffffff",
                boxShadow: "0 2px 8px rgba(244, 63, 94, 0.4)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              }}>
                {notifications}
              </span>
            )}
          </div>
          
          <div style={{ position: "relative" }}>
            <button 
              style={{
                background: "rgba(241, 245, 249, 0.8)", 
                border: "none", 
                cursor: "pointer", 
                color: "#64748b", 
                fontSize: 18,
                padding: "12px",
                borderRadius: 12,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44
              }} 
              title="My Appointments" 
              onClick={() => navigate("/appointments")}
              onMouseEnter={e => {
                e.target.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
                e.target.style.color = "#6366f1";
                e.target.style.transform = "scale(1.08)";
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = "rgba(241, 245, 249, 0.8)";
                e.target.style.color = "#64748b";
                e.target.style.transform = "scale(1)";
              }}
            >
              <FaClock />
            </button>
            {upcomingAppointments > 0 && (
              <span style={{
                position: "absolute", 
                top: 2, 
                right: 2, 
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff", 
                borderRadius: "50%", 
                minWidth: 20, 
                height: 20, 
                fontSize: 11, 
                fontWeight: 700,
                display: "flex",
                justifyContent: "center", 
                alignItems: "center",
                border: "2.5px solid #ffffff",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.4)"
              }}>
                {upcomingAppointments}
              </span>
            )}
          </div>
          
          <button 
            style={{
              background: "rgba(241, 245, 249, 0.8)", 
              border: "none", 
              cursor: "pointer", 
              color: "#64748b", 
              fontSize: 18,
              padding: "12px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44
            }} 
            onClick={() => navigate("/medical-records")}
            title="Medical Records"
            onMouseEnter={e => {
              e.target.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.target.style.color = "#6366f1";
              e.target.style.transform = "scale(1.08)";
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "rgba(241, 245, 249, 0.8)";
              e.target.style.color = "#64748b";
              e.target.style.transform = "scale(1)";
            }}
          >
            <FaPrescriptionBottleAlt />
          </button>
          
          <button 
            style={{
              background: "rgba(241, 245, 249, 0.8)", 
              border: "none", 
              cursor: "pointer", 
              color: "#64748b", 
              fontSize: 18,
              padding: "12px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44
            }} 
            onClick={() => navigate("/PatientProfile")}
            title="Profile"
            onMouseEnter={e => {
              e.target.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.target.style.color = "#6366f1";
              e.target.style.transform = "scale(1.08)";
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "rgba(241, 245, 249, 0.8)";
              e.target.style.color = "#64748b";
              e.target.style.transform = "scale(1)";
            }}
          >
            <FaUser />
          </button>

          {/* ✅ LOGOUT BUTTON WITH CONFIRMATION */}
          <button 
            style={{
              background: "rgba(239, 68, 68, 0.1)", 
              border: "none", 
              cursor: "pointer", 
              color: "#dc2626", 
              fontSize: 18,
              padding: "12px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44
            }} 
            onClick={handleLogoutClick}
            title="Logout"
            onMouseEnter={e => {
              e.target.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
              e.target.style.color = "#b91c1c";
              e.target.style.transform = "scale(1.08)";
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              e.target.style.color = "#dc2626";
              e.target.style.transform = "scale(1)";
            }}
          >
            <FaSignOutAlt />
          </button>
        </>
      ) : (
        <button 
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", 
            border: "none", 
            cursor: "pointer", 
            color: "#ffffff", 
            fontSize: 14, 
            fontWeight: 700,
            padding: "12px 20px", 
            borderRadius: 12,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)"
          }} 
          onClick={() => navigate("/login")}
          onMouseEnter={e => {
            e.target.style.transform = "translateY(-2px) scale(1.02)";
            e.target.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={e => {
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.3)";
          }}
          title="Login"
        >
          <FaUserMd />
          <span>Login</span>
        </button>
      )}
      
      <button 
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
          border: "2px solid rgba(251, 191, 36, 0.3)", 
          cursor: "pointer", 
          color: "#ffffff", 
          fontSize: 14,
          fontWeight: 700,
          padding: "11px 18px",
          borderRadius: 12,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
        }} 
        onClick={() => navigate("/admin/login")}
        title="Admin Login"
        onMouseEnter={e => {
          e.target.style.background = "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
          e.target.style.transform = "translateY(-2px) scale(1.02)";
          e.target.style.boxShadow = "0 8px 24px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
        }}
        onMouseLeave={e => {
          e.target.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
          e.target.style.transform = "translateY(0) scale(1)";
          e.target.style.boxShadow = "0 4px 16px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
        }}
      >
        <FaUserShield style={{ fontSize: 16 }} />
        <span>Admin</span>
      </button>
    </>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      
      {/* ✅ LOGOUT CONFIRMATION MODAL */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={user?.name}
      />
      
      {!isMobile && (
        <nav
          style={{
            backgroundColor: scrolled 
              ? "rgba(255, 255, 255, 0.85)" 
              : "#ffffff",
            borderBottom: scrolled 
              ? "1px solid rgba(226, 232, 240, 0.8)" 
              : "1px solid #f1f5f9",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            boxShadow: scrolled 
              ? "0 8px 32px rgba(15, 23, 42, 0.1)" 
              : "0 1px 3px rgba(15, 23, 42, 0.05)",
            padding: "0 40px",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 80,
              maxWidth: 1440,
              margin: "0 auto",
              width: "100%"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                flexShrink: 0
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "800",
                  fontSize: 28,
                  textDecoration: "none",
                  gap: 12,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <FaHeartbeat style={{ 
                  fontSize: 32, 
                  color: "#6366f1",
                  filter: "drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))"
                }} /> 
                Heal X
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {navLinks}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                minWidth: 0,
                margin: "0 48px"
              }}
            >
              <AdvancedSearchBar />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0
              }}
            >
              {actionItems}
            </div>
          </div>
        </nav>
      )}

      {isMobile && (
        <>
          <nav
            style={{
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #f1f5f9",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              padding: "0 20px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 68
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "800",
                  fontSize: 24,
                  textDecoration: "none",
                  gap: 10,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                <FaHeartbeat style={{ color: "#6366f1" }} /> Heal X
              </Link>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: "#6366f1",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "none",
                  padding: "10px",
                  borderRadius: 12,
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  width: 44,
                  height: 44
                }}
                onClick={() => setIsOpen(true)}
              >
                <FaBars />
              </button>
            </div>
          </nav>
          <div style={{ 
            background: "#ffffff", 
            borderBottom: "1px solid #f1f5f9", 
            padding: "16px 20px",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)"
          }}>
            <AdvancedSearchBar isMobile={true} />
          </div>
        </>
      )}
    </>
  );
}

export default MedicalNavbar;
