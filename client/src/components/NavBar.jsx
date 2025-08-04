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

// --- Doctor specialties and suggestions ---
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

// --- Search Bar ---
function AdvancedSearchBar({ isMobile = false }) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = e => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    if (query.includes("doctor") || query.includes("specialist"))
      navigate("/doctors");
    else if (query.includes("appointment") || query.includes("booking"))
      navigate("/appointments");
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
      width: isMobile ? "100%" : 340,
      margin: "0 auto"
    }}>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search doctors, specialties..."
          value={search}
          onChange={handleInputChange}
          onFocus={() => search.length > 0 && setShowSuggestions(true)}
          style={{
            width: "100%",
            padding: "8px 34px 8px 34px",
            fontSize: 16,
            borderRadius: 999,
            border: "2px solid #81E6D9",
            outline: "none",
            background: "#fff",
            color: "#234E52",
            boxSizing: "border-box"
          }}
        />
        {/* Search Icon */}
        <span style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#319795",
          pointerEvents: "none"
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
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#319795",
              fontSize: 18,
              cursor: "pointer"
            }}>
            <FaTimes />
          </button>
        )}
      </form>
      {/* Suggestions Box */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: 42,
          left: 0,
          right: 0,
          background: "#fff",
          color: "#234E52",
          border: "1px solid #B2F5EA",
          borderRadius: 8,
          boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
          zIndex: 999
        }}>
          {filteredSuggestions.slice(0, 5).map((s, i) => (
            <div
              key={i}
              onClick={() => handleSuggestionClick(s)}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 14,
                borderBottom: i !== filteredSuggestions.slice(0, 5).length - 1 ? "1px solid #EDF2F7" : "none"
              }}
              onMouseDown={e => e.preventDefault()}
            >{s}</div>
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

  // Responsive mobile break
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Nav Links
  const navLinks = (
    <>
      <Link to="/login" style={{textDecoration: "none", color: "#234E52", display: "flex", alignItems: "center", gap: 4, fontSize: 15}}>
        <FaUserMd /> Login
      </Link>
      <Link to="/register" style={{textDecoration: "none", color: "#234E52", display: "flex", alignItems: "center", gap: 4, fontSize: 15}}>
        <FaStethoscope /> Register
      </Link>
      <Link to="/hospitals" style={{textDecoration: "none", color: "#234E52", display: "flex", alignItems: "center", gap: 4, fontSize: 15}}>
        <FaHospital /> Hospitals
      </Link>
      <Link to="/emergency" style={{textDecoration: "none", color: "#E53E3E", display: "flex", alignItems: "center", gap: 4, fontSize: 15}}>
        <FaAmbulance /> Emergency
      </Link>
    </>
  );

  const actionItems = (
    <>
      <button style={{background: "none", border: "none", cursor: "pointer", color: "#319795", fontSize: 22, marginLeft: 4, marginRight: 4, display: "flex", alignItems: "center"}} onClick={() => navigate("/book-appointment")}>
        <FaCalendarAlt /><span style={{marginLeft: 3, fontSize: 16}}>Book</span>
      </button>
      <span style={{position: "relative"}}>
        <button style={{background: "none", border: "none", cursor: "pointer", color: "#319795", fontSize: 22}} title="Notifications">
          <FaBell />
        </button>
        {notifications > 0 && <span style={{
          position: "absolute", top: -6, right: -6, background: "red",
          color: "#fff", borderRadius: "50%", minWidth: 16, height: 16, fontSize: 12, display: "flex",
          justifyContent: "center", alignItems: "center"
        }}>{notifications}</span>}
      </span>
      <span style={{position: "relative"}}>
        <button style={{background: "none", border: "none", cursor: "pointer", color: "#319795", fontSize: 22}} title="My Appointments" onClick={() => navigate("/appointments")}>
          <FaClock />
        </button>
        {upcomingAppointments > 0 && <span style={{
          position: "absolute", top: -6, right: -6, background: "#319795",
          color: "#fff", borderRadius: "50%", minWidth: 16, height: 16, fontSize: 12, display: "flex",
          justifyContent: "center", alignItems: "center"
        }}>{upcomingAppointments}</span>}
      </span>
      <button style={{background: "none", border: "none", cursor: "pointer", color: "#319795", fontSize: 22}} onClick={() => navigate("/medical-records")}>
        <FaPrescriptionBottleAlt />
      </button>
      <button style={{background: "none", border: "none", cursor: "pointer", color: "#319795", fontSize: 22}} onClick={() => navigate("/profile")}>
        <FaUser />
      </button>
    </>
  );

  // Mobile menu
  const mobileMenu = isOpen && (
    <>
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1200
      }} onClick={() => setIsOpen(false)} />
      <div style={{
        position: "fixed", top: 0, right: 0, width: 260, height: "100vh",
        background: "#fff", boxShadow: "-2px 0 8px rgba(0,0,0,0.08)", zIndex: 1300, padding: 24,
        transform: "translateX(0)", display: "flex", flexDirection: "column", gap: 18
      }}>
        <button onClick={() => setIsOpen(false)} style={{alignSelf: "flex-end", background: "none", border: "none", fontSize: 24}}><FaTimes /></button>
        <Link to="/" onClick={() => setIsOpen(false)} style={{display: "flex", alignItems: "center", fontWeight: "bold", fontSize: 20, color: "#319795"}}> <FaHeartbeat /> MedCenter</Link>
        <AdvancedSearchBar isMobile={true} />
        {navLinks}
        <hr style={{borderColor: "#b2f5ea", margin: "6px 0"}} />
        <Link to="/appointments" onClick={() => setIsOpen(false)} style={{textDecoration: "none", color: "#234E52", display: "flex", alignItems: "center"}}><FaCalendarAlt style={{marginRight:4}} /> My Appointments</Link>
        <Link to="/medical-records" onClick={() => setIsOpen(false)} style={{textDecoration: "none", color: "#234E52", display: "flex", alignItems: "center"}}><FaPrescriptionBottleAlt style={{marginRight:4}} /> Medical Records</Link>
        <Link to="/profile" onClick={() => setIsOpen(false)} style={{textDecoration: "none", color: "#234E52", display: "flex", alignItems: "center"}}><FaUser style={{marginRight:4}} /> My Profile</Link>
      </div>
    </>
  );

  return (
    <>
      {!isMobile && (
        <nav
          style={{
            backgroundColor: "#fff",
            borderBottom: "2px solid #81E6D9",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            padding: "0 24px"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 64,
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
                gap: 22,
                flexShrink: 0
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#319795",
                  fontWeight: "bold",
                  fontSize: 22,
                  textDecoration: "none",
                  gap: 8
                }}
              >
                <FaHeartbeat /> MedCenter
              </Link>
              {navLinks}
            </div>

            {/* CENTER: Search Bar */}
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                minWidth: 0
              }}
            >
              <div style={{ width: "100%", maxWidth: 340 }}>
                <AdvancedSearchBar />
              </div>
            </div>

            {/* RIGHT: Action Icons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexShrink: 0,
                marginLeft: 10
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
              backgroundColor: "#fff",
              borderBottom: "2px solid #81E6D9",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              padding: "0 16px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 60
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#319795",
                  fontWeight: "bold",
                  fontSize: 22,
                  textDecoration: "none",
                  gap: 8
                }}
              >
                <FaHeartbeat /> MedCenter
              </Link>
              <button
                style={{
                  display: "block",
                  fontSize: 30,
                  color: "#319795",
                  background: "none",
                  border: "none"
                }}
                onClick={() => setIsOpen(true)}
              >
                <FaBars />
              </button>
            </div>
          </nav>
          <div style={{ background: "#fff", borderBottom: "1px solid #81E6D9", padding: 12 }}>
            <AdvancedSearchBar isMobile={true} />
          </div>
          {mobileMenu}
        </>
      )}
    </>
  );
}

export default MedicalNavbar;
