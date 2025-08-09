import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MedicalNavbar from './components/NavBar'; // Import your navbar
import Login from './pages/Login';
import Homepage from './components/Homepage';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <div className="App">
        {/* NavBar appears on all pages */}
        <MedicalNavbar />
        
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/hospitals" element={<div>Hospitals Page</div>} />
          <Route path="/emergency" element={<div>Emergency Page</div>} />
          <Route path="/book-appointment" element={<div>Book Appointment</div>} />
          <Route path="/appointments" element={<div>My Appointments</div>} />
          <Route path="/medical-records" element={<div>Medical Records</div>} />
          <Route path="/doctors" element={<div>Doctors Page</div>} />
          <Route path="/specialty/:id" element={<div>Specialty Page</div>} />
          <Route path="/search" element={<div>Search Results</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
