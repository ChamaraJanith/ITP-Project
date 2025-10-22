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
  FaSearch,
  FaUserShield,
  FaSignOutAlt
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
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState(3);
  const [upcomingAppointments] = useState(2);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [scrolled, setScrolled] = useState(false);
  
  // ✅ NEW: Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ Check authentication status on mount and storage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          setIsAuthenticated(true);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuth();

    // Listen for auth state changes (from login/logout)
    window.addEventListener('authStateChanged', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('authStateChanged', checkAuth);
      window.removeEventListener('storage', checkAuth);
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

  // ✅ Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/login');
    setIsOpen(false);
  };

  // ✅ Enhanced Nav Links - Show different links based on auth state
  const navLinks = (
    <>
      {!isAuthenticated ? (
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
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden"
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
      ) : (
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
          <span>Hi, {user?.name?.split(' ')[0] || 'User'}</span>
        </div>
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

  // ✅ Enhanced Action Items with Authentication Check
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
          
          {/* ✅ FIXED: Profile Button with Consistent Path */}
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

          {/* ✅ Logout Button */}
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
            onClick={handleLogout}
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
      
      {/* Admin Login Button */}
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
          boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          position: "relative",
          overflow: "hidden"
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

  // ✅ Enhanced Mobile Menu with Authentication
  const mobileMenu = isOpen && (
    <>
      <div 
        style={{
          position: "fixed", 
          inset: 0, 
          background: "rgba(15, 23, 42, 0.6)", 
          zIndex: 1200,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "fadeIn 0.3s ease-out"
        }} 
        onClick={() => setIsOpen(false)} 
      />
      <div style={{
        position: "fixed", 
        top: 0, 
        right: 0, 
        width: Math.min(360, window.innerWidth * 0.85), 
        height: "100vh",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", 
        boxShadow: "-20px 0 60px rgba(15, 23, 42, 0.3)", 
        zIndex: 1300, 
        padding: "32px 24px",
        transform: "translateX(0)", 
        display: "flex", 
        flexDirection: "column", 
        gap: 20,
        borderTopLeftRadius: 24,
        borderBottomLeftRadius: 24,
        animation: "slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        overflowY: "auto"
      }}>
        <button 
          onClick={() => setIsOpen(false)} 
          style={{
            alignSelf: "flex-end", 
            background: "rgba(100, 116, 139, 0.1)", 
            border: "none", 
            fontSize: 20,
            color: "#64748b",
            padding: "10px",
            borderRadius: 12,
            transition: "all 0.2s ease",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            e.target.style.color = "#ef4444";
            e.target.style.transform = "rotate(90deg)";
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = "rgba(100, 116, 139, 0.1)";
            e.target.style.color = "#64748b";
            e.target.style.transform = "rotate(0deg)";
          }}
        >
          <FaTimes />
        </button>
        
        <Link 
          to="/" 
          onClick={() => setIsOpen(false)} 
          style={{
            display: "flex", 
            alignItems: "center", 
            fontWeight: "800", 
            fontSize: 28, 
            color: "#6366f1",
            textDecoration: "none",
            gap: 12,
            padding: "12px 0",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          <FaHeartbeat style={{ color: "#6366f1" }} /> Heal X
        </Link>
        
        {/* ✅ User Info in Mobile Menu */}
        {isAuthenticated && user && (
          <div style={{
            padding: "16px",
            background: "rgba(99, 102, 241, 0.08)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20
            }}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 16 }}>
                {user.name || 'User'}
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {user.email || ''}
              </div>
            </div>
          </div>
        )}
        
        <div style={{ 
          marginBottom: 12,
          padding: "16px",
          background: "rgba(241, 245, 249, 0.5)",
          borderRadius: 16
        }}>
          <AdvancedSearchBar isMobile={true} />
        </div>
        
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 8,
          padding: "12px 0"
        }}>
          <h3 style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: "#94a3b8", 
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 8px 12px"
          }}>
            Navigation
          </h3>
          
          {!isAuthenticated ? (
            <>
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none", 
                  color: "#475569", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(241, 245, 249, 0.8)"
                }}
              >
                <FaUserMd /> Login
              </Link>
              
              <Link 
                to="/register" 
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: "none", 
                  color: "#475569", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(241, 245, 249, 0.8)"
                }}
              >
                <FaStethoscope /> Register
              </Link>
            </>
          ) : null}
          
          <Link 
            to="/hospitals" 
            onClick={() => setIsOpen(false)}
            style={{
              textDecoration: "none", 
              color: "#475569", 
              display: "flex", 
              alignItems: "center",
              gap: 12,
              fontSize: 15,
              fontWeight: 600,
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(241, 245, 249, 0.8)"
            }}
          >
            <FaHospital /> Hospitals
          </Link>
          
          <Link 
            to="/emergency" 
            onClick={() => setIsOpen(false)}
            style={{
              textDecoration: "none", 
              color: "#dc2626", 
              display: "flex", 
              alignItems: "center",
              gap: 12,
              fontSize: 15,
              fontWeight: 700,
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(239, 68, 68, 0.1)"
            }}
          >
            <FaAmbulance /> Emergency
          </Link>
        </div>
        
        {isAuthenticated && (
          <>
            <hr style={{ 
              borderColor: "rgba(226, 232, 240, 0.8)", 
              margin: "12px 0",
              border: "none",
              height: "1px",
              background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)"
            }} />
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 8 
            }}>
              <h3 style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: "#94a3b8", 
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 8px 12px"
              }}>
                Quick Actions
              </h3>
              
              <Link 
                to="/book-appointment" 
                onClick={() => setIsOpen(false)} 
                style={{
                  textDecoration: "none", 
                  color: "#ffffff", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)"
                }}
              >
                <FaCalendarAlt /> Book Appointment
              </Link>
              
              <Link 
                to="/appointments" 
                onClick={() => setIsOpen(false)} 
                style={{
                  textDecoration: "none", 
                  color: "#475569", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(241, 245, 249, 0.8)"
                }}
              >
                <FaClock /> My Appointments
              </Link>
              
              <Link 
                to="/medical-records" 
                onClick={() => setIsOpen(false)} 
                style={{
                  textDecoration: "none", 
                  color: "#475569", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(241, 245, 249, 0.8)"
                }}
              >
                <FaPrescriptionBottleAlt /> Medical Records
              </Link>
              
              {/* ✅ FIXED: Mobile Profile Link */}
              <Link 
                to="/PatientProfile" 
                onClick={() => setIsOpen(false)} 
                style={{
                  textDecoration: "none", 
                  color: "#475569", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(241, 245, 249, 0.8)"
                }}
              >
                <FaUser /> My Profile
              </Link>
              
              {/* ✅ Logout in Mobile Menu */}
              <button 
                onClick={handleLogout}
                style={{
                  textDecoration: "none", 
                  color: "#dc2626", 
                  display: "flex", 
                  alignItems: "center",
                  gap: 12,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left"
                }}
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </>
        )}
        
        <hr style={{ 
          borderColor: "rgba(226, 232, 240, 0.8)", 
          margin: "12px 0",
          border: "none",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)"
        }} />
        
        {/* Admin Login in Mobile Menu */}
        <Link 
          to="/admin/login" 
          onClick={() => setIsOpen(false)} 
          style={{
            textDecoration: "none", 
            color: "#ffffff", 
            display: "flex", 
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 15,
            fontWeight: 700,
            padding: "14px 20px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
            border: "2px solid rgba(251, 191, 36, 0.3)",
            marginTop: "auto"
          }}
        >
          <FaUserShield style={{ fontSize: 18 }} /> Admin Login
        </Link>
      </div>
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
      `}</style>
      
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
            {/* LEFT: Logo & Nav Links */}
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

            {/* CENTER: Search Bar */}
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

            {/* RIGHT: Action Icons */}
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

      {/* MOBILE NAVBAR */}
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
                onMouseEnter={e => {
                  e.target.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={e => {
                  e.target.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
                  e.target.style.transform = "scale(1)";
                }}
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
          {mobileMenu}
        </>
      )}
    </>
  );
}

export default MedicalNavbar;
