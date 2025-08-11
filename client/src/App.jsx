import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MedicalNavbar from './components/NavBar';

// ✅ Existing User Components
import Login from './pages/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import Profile from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Subscription from './components/Subscription';
import SubscriptionConfirmation from './components/SubscriptionConfirmation';

// ✅ Admin Components - Fixed inconsistent file extensions
import AdminLogin from './components/admin/AdminLogin';
import ReceptionistDashboard from './components/admin/dashboards/ReceptionistDashboard';
import DoctorDashboard from './components/admin/dashboards/DoctorDashboard';
import FinancialDashboard from './components/admin/dashboards/FinancialDashboard'; // ✅ Removed .jsx
import AdminDashboard from './components/admin/dashboards/AdminDashboard'; // ✅ Removed .jsx
// import RegisterPatient from './components/admin/RegisterPatient';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <MedicalNavbar />
        
        <Routes>
          {/* ✅ Public User Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/confirm-subscription" element={<SubscriptionConfirmation />} />

          {/* ✅ Healthcare Service Routes */}
          <Route 
            path="/hospitals" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>🏥 Hospitals Directory</h2>
                <p>Find hospitals and medical centers near you.</p>
              </div>
            } 
          />
          <Route 
            path="/emergency" 
            element={
              <div style={{padding: '2rem', color: 'red'}}>
                <h2>🚨 Emergency Services</h2>
                <p>24/7 Emergency Medical Services</p>
                <p><strong>Emergency Hotline: 911</strong></p>
              </div>
            } 
          />
          <Route 
            path="/book-appointment" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>📅 Book Appointment</h2>
                <p>Schedule your medical appointment online.</p>
              </div>
            } 
          />
          <Route 
            path="/appointments" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>📋 My Appointments</h2>
                <p>View and manage your appointments.</p>
              </div>
            } 
          />
          <Route 
            path="/medical-records" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>📄 Medical Records</h2>
                <p>Access your medical history and records.</p>
              </div>
            } 
          />
          <Route 
            path="/doctors" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>👨‍⚕️ Find Doctors</h2>
                <p>Browse our network of qualified healthcare professionals.</p>
              </div>
            } 
          />
          <Route 
            path="/specialty/:id" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>🩺 Medical Specialty</h2>
                <p>Specialized medical services and treatments.</p>
              </div>
            } 
          />
          <Route 
            path="/search" 
            element={
              <div style={{padding: '2rem'}}>
                <h2>🔍 Search Results</h2>
                <p>Find healthcare services, doctors, and facilities.</p>
              </div>
            } 
          />

          {/* ✅ Admin Portal Routes */}
          
          {/* Admin Login - Public Access */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Protected Admin Routes - Role-Based Access */}
          <Route 
            path="/admin/receptionist" 
            element={
              <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                <ReceptionistDashboard />
              </ProtectedAdminRoute>
            } 
          />
          
          <Route 
            path="/admin/doctor" 
            element={
              <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                <DoctorDashboard />
              </ProtectedAdminRoute>
            } 
          />
          
          <Route 
            path="/admin/financial" 
            element={
              <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                <FinancialDashboard />
              </ProtectedAdminRoute>
            } 
          />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedAdminRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* ✅ Simplified - Removed complex RegisterPatient route since receptionist button goes to /register */}
          
          {/* ✅ Admin Quick Access Routes */}
          <Route 
            path="/admin" 
            element={
              <div style={{
                padding: '2rem', 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <h1>🏥 HealX Healthcare Admin Portal</h1>
                <p>Secure access for healthcare professionals</p>
                <div style={{ marginTop: '2rem' }}>
                  <a 
                    href="/admin/login" 
                    style={{
                      background: 'white',
                      color: '#667eea',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    Access Admin Portal →
                  </a>
                </div>
                <div style={{ marginTop: '2rem', fontSize: '14px', opacity: '0.8' }}>
                  <p>🔐 Authorized Personnel Only</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span>👩‍💼 Receptionist</span>
                    <span>👨‍⚕️ Doctor</span>
                    <span>💰 Financial Manager</span>
                    <span>👑 Administrator</span>
                  </div>
                </div>
              </div>
            } 
          />

          {/* ✅ 404 Fallback Route */}
          <Route 
            path="*" 
            element={
              <div style={{
                padding: '4rem 2rem', 
                textAlign: 'center',
                background: '#f8fafc',
                minHeight: '50vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: 'white',
                  padding: '3rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  maxWidth: '500px'
                }}>
                  <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>🚫 Page Not Found</h2>
                  <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                    The page you're looking for doesn't exist or has been moved.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a 
                      href="/" 
                      style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '500'
                      }}
                    >
                      🏠 Go Home
                    </a>
                    <a 
                      href="/admin" 
                      style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '500',
                        border: '1px solid #d1d5db'
                      }}
                    >
                      👑 Admin Portal
                    </a>
                  </div>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
