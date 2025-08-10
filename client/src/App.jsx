import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MedicalNavbar from './components/NavBar';
import Login from './pages/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import Profile from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Subscription from './components/Subscription'; // ← Add this import
import SubscriptionConfirmation from './components/SubscriptionConfirmation';

function App() {
  return (
    <Router>
      <div className="App">
        <MedicalNavbar />
        
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/confirm-subscription" element={<SubscriptionConfirmation />} />
          
          {/* Other routes */}
          <Route path="/hospitals" element={<div style={{padding: '2rem'}}>Hospitals Page</div>} />
          <Route path="/emergency" element={<div style={{padding: '2rem', color: 'red'}}>Emergency Services</div>} />
          <Route path="/book-appointment" element={<div style={{padding: '2rem'}}>Book Appointment</div>} />
          <Route path="/appointments" element={<div style={{padding: '2rem'}}>My Appointments</div>} />
          <Route path="/medical-records" element={<div style={{padding: '2rem'}}>Medical Records</div>} />
          <Route path="/doctors" element={<div style={{padding: '2rem'}}>Doctors Page</div>} />
          <Route path="/specialty/:id" element={<div style={{padding: '2rem'}}>Specialty Page</div>} />
          <Route path="/search" element={<div style={{padding: '2rem'}}>Search Results</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
