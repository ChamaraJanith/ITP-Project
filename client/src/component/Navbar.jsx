import React, { useState } from "react";
import {
  Box,
  Flex,
  Button,
  HStack,
  IconButton,
  Input,
  VStack,
  Text,
  Badge,
  Container,
  Separator,
  CloseButton,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUser,
  FaSearch,
  FaBars,
  FaTimes,
  FaBell,
  FaHeartbeat,
  FaStethoscope,
  FaUserMd,
  FaHospital,
  FaPrescriptionBottleAlt,
  FaAmbulance,
  FaClock,
} from "react-icons/fa";

// Doctor specialties and hospital mapping for smart search
const SPECIALTY_TO_ID = {
  "cardiologist": "s1",
  "dermatologist": "s2", 
  "neurologist": "s3",
  "pediatrician": "s4",
  "orthopedic": "s5",
  "gynecologist": "s6",
  "psychiatrist": "s7",
  "dentist": "s8",
};

// Search suggestions for autocomplete
const SEARCH_SUGGESTIONS = [
  "Cardiologist",
  "Dermatologist", 
  "Neurologist",
  "Pediatrician",
  "Orthopedic Surgeon",
  "Gynecologist",
  "Psychiatrist",
  "General Physician",
  "Dentist",
  "Eye Specialist",
  "Heart Specialist",
  "Skin Doctor",
];

// Advanced Search Bar Component
function AdvancedSearchBar({ isMobile = false }) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = search.trim().toLowerCase();

    if (query.includes("doctor") || query.includes("specialist")) {
      navigate("/doctors");
    } else if (query.includes("appointment") || query.includes("booking")) {
      navigate("/appointments");
    } else if (SPECIALTY_TO_ID[query]) {
      navigate(`/specialty/${SPECIALTY_TO_ID[query]}`);
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
    } else if (SPECIALTY_TO_ID[query]) {
      navigate(`/specialty/${SPECIALTY_TO_ID[query]}`);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
  };

  return (
    <Box position="relative" w={isMobile ? "100%" : { base: "200px", md: "300px", lg: "400px" }}>
      <form onSubmit={handleSearch}>
        <Box position="relative">
          <Input
            type="text"
            placeholder="Search doctors, specialties..."
            value={search}
            onChange={handleInputChange}
            onFocus={() => search.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            color="black"
            bg="white"
            border="2px solid"
            borderColor="teal.200"
            _hover={{ borderColor: "teal.300" }}
            _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
            borderRadius="full"
            ps="3rem"
            pe={search ? "3rem" : "1rem"}
          />
          {/* Search Icon */}
          <Box
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            pointerEvents="none"
            color="teal.400"
          >
            <FaSearch />
          </Box>
          {/* Clear Button */}
          {search && (
            <Box
              position="absolute"
              right="8px"
              top="50%"
              transform="translateY(-50%)"
            >
              <IconButton
                aria-label="Clear search"
                size="sm"
                variant="ghost"
                onClick={clearSearch}
                minW="24px"
                h="24px"
                color="teal.500"
              >
                <FaTimes />
              </IconButton>
            </Box>
          )}
        </Box>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          color="black"
          bg="white"
          border="1px solid"
          borderColor="teal.200"
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          mt={1}
        >
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <Box
              key={index}
              px={4}
              py={2}
              cursor="pointer"
              _hover={{ bg: "teal.50" }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Text fontSize="sm" color="gray.800">{suggestion}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Mobile Menu Component
function MobileMenu({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={1300}
          onClick={onClose}
        />
      )}
      
      <Box
        position="fixed"
        top="0"
        right={isOpen ? "0" : "-100%"}
        h="100vh"
        w={{ base: "280px", sm: "320px" }}
        bg="white"
        boxShadow="lg"
        zIndex={1400}
        transition="right 0.3s ease-in-out"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" p={4} borderBottom="1px" borderColor="teal.200">
          <Text fontWeight="bold" color="teal.600" fontSize="lg">
            🏥 MedCenter
          </Text>
          <CloseButton onClick={onClose} />
        </Box>
        
        <Box p={4} overflowY="auto" h="calc(100vh - 80px)">
          <VStack spacing={6} align="stretch">
            {/* Mobile Search */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" mb={2} color="teal.600">
                Find Doctors
              </Text>
              <AdvancedSearchBar isMobile={true} />
            </Box>

            <Separator />

            {/* Navigation Links */}
            <VStack spacing={3} align="stretch">
              <Link to="/" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  🏠 Home
                </Button>
              </Link>
              <Link to="/doctors" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  👨‍⚕️ Find Doctors
                </Button>
              </Link>
              <Link to="/specialties" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  🩺 Specialties
                </Button>
              </Link>
              <Link to="/hospitals" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  🏥 Hospitals
                </Button>
              </Link>
              <Link to="/emergency" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="red.600" w="100%">
                  🚑 Emergency
                </Button>
              </Link>
            </VStack>

            <Separator />

            {/* User Actions */}
            <VStack spacing={3} align="stretch">
              <Link to="/appointments" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaCalendarAlt />
                    <Text>My Appointments</Text>
                  </Box>
                </Button>
              </Link>
              <Link to="/medical-records" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaPrescriptionBottleAlt />
                    <Text>Medical Records</Text>
                  </Box>
                </Button>
              </Link>
              <Link to="/profile" onClick={onClose}>
                <Button variant="ghost" justifyContent="flex-start" color="teal.700" w="100%">
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaUser />
                    <Text>My Profile</Text>
                  </Box>
                </Button>
              </Link>
            </VStack>
          </VStack>
        </Box>
      </Box>
    </>
  );
}

// Main Medical Center Navbar Component
function MedicalNavbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [upcomingAppointments] = useState(2);
  const [notifications] = useState(3);

  return (
    <>
      {/* Main Navbar */}
      <Box
        bg="white"
        borderBottom="2px solid"
        borderColor="teal.200"
        position="sticky"
        top="0"
        zIndex={1000}
        boxShadow="md"
      >
        <Container maxW="container.xl">
          <Box display="flex" h={16} alignItems="center" justifyContent="space-between">
            {/* Logo */}
            <Link to="/">
              <Button
                variant="ghost"
                fontWeight="bold"
                fontSize="xl"
                color="teal.600"
                _hover={{ bg: "transparent", transform: "scale(1.05)" }}
                p={0}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <FaHeartbeat size="24" />
                  <Text>MedCenter</Text>
                </Box>
              </Button>
            </Link>

            {/* Desktop Navigation Links */}
            <HStack spacing={6} display={{ base: "none", lg: "flex" }}>
              <Link to="/doctors">
                <Button variant="ghost" size="sm" color="teal.700" _hover={{ bg: "teal.50" }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaUserMd />
                    <Text>Find Doctors</Text>
                  </Box>
                </Button>
              </Link>
              <Link to="/specialties">
                <Button variant="ghost" size="sm" color="teal.700" _hover={{ bg: "teal.50" }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaStethoscope />
                    <Text>Specialties</Text>
                  </Box>
                </Button>
              </Link>
              <Link to="/hospitals">
                <Button variant="ghost" size="sm" color="teal.700" _hover={{ bg: "teal.50" }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaHospital />
                    <Text>Hospitals</Text>
                  </Box>
                </Button>
              </Link>
              <Link to="/emergency">
                <Button variant="ghost" size="sm" color="red.600" _hover={{ bg: "red.50" }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaAmbulance />
                    <Text>Emergency</Text>
                  </Box>
                </Button>
              </Link>
            </HStack>

            {/* Desktop Search Bar */}
            <Box display={{ base: "none", md: "block" }} flex="1" maxW="500px" mx={8}>
              <AdvancedSearchBar />
            </Box>

            {/* Desktop Actions */}
            <HStack spacing={2} display={{ base: "none", md: "flex" }}>
              {/* Book Appointment Button */}
              <Button
                colorScheme="teal"
                size="sm"
                onClick={() => navigate("/book-appointment")}
                _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                transition="all 0.2s"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <FaCalendarAlt />
                  <Text>Book Now</Text>
                </Box>
              </Button>

              {/* Notifications */}
              <Box position="relative">
                <IconButton
                  variant="ghost"
                  aria-label="Notifications"
                  color="teal.600"
                  _hover={{ bg: "teal.50" }}
                >
                  <FaBell />
                </IconButton>
                {notifications > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    fontSize="xs"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    minW="20px"
                    h="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {notifications}
                  </Badge>
                )}
              </Box>

              {/* My Appointments */}
              <Box position="relative">
                <IconButton
                  variant="ghost"
                  aria-label="My Appointments"
                  color="teal.600"
                  _hover={{ bg: "teal.50" }}
                  onClick={() => navigate("/appointments")}
                >
                  <FaClock />
                </IconButton>
                {upcomingAppointments > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    fontSize="xs"
                    borderRadius="full"
                    bg="teal.500"
                    color="white"
                    minW="20px"
                    h="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {upcomingAppointments}
                  </Badge>
                )}
              </Box>

              {/* Medical Records */}
              <IconButton
                variant="ghost"
                aria-label="Medical Records"
                color="teal.600"
                _hover={{ bg: "teal.50" }}
                onClick={() => navigate("/medical-records")}
              >
                <FaPrescriptionBottleAlt />
              </IconButton>

              {/* User Profile */}
              <IconButton
                variant="ghost"
                aria-label="User Profile"
                color="teal.600"
                _hover={{ bg: "teal.50" }}
                onClick={() => navigate("/profile")}
              >
                <FaUser />
              </IconButton>
            </HStack>

            {/* Mobile Actions */}
            <HStack spacing={2} display={{ base: "flex", md: "none" }}>
              {/* Mobile Book Appointment */}
              <Button
                colorScheme="teal"
                size="sm"
                onClick={() => navigate("/book-appointment")}
              >
                Book
              </Button>

              {/* Mobile Appointments */}
              <Box position="relative">
                <IconButton
                  variant="ghost"
                  aria-label="My Appointments"
                  color="teal.600"
                  _hover={{ bg: "teal.50" }}
                  onClick={() => navigate("/appointments")}
                  size="sm"
                >
                  <FaClock />
                </IconButton>
                {upcomingAppointments > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    fontSize="xs"
                    borderRadius="full"
                    bg="teal.500"
                    color="white"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {upcomingAppointments}
                  </Badge>
                )}
              </Box>

              <IconButton
                variant="ghost"
                aria-label="Open menu"
                color="teal.600"
                _hover={{ bg: "teal.50" }}
                onClick={() => setIsOpen(true)}
                size="sm"
              >
                <FaBars />
              </IconButton>
            </HStack>
          </Box>
        </Container>
      </Box>

      {/* Mobile Search Bar */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="teal.200"
        p={4}
        display={{ base: "block", md: "none" }}
      >
        <AdvancedSearchBar isMobile={true} />
      </Box>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default MedicalNavbar;
