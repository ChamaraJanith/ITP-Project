import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import MedicalNavbar from './components/NavBar';
import EmergencyPage from './components/EmergencyPage';
import HospitalsPage from './components/HospitalPage';
import Footer from './components/Footer';

// ✅ Existing User Components
import Register from './components/admin/Patient/Register';
import Login from './components/admin/Patient/Login';
import PatientProfile from './components/admin/Patient/PatientProfile';

// ✅ Admin Components 
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/dashboards/AdminDashboard';
import ReceptionistDashboard from './components/admin/dashboards/ReceptionistDashboard';
import DoctorDashboard from './components/admin/dashboards/DoctorDashboard';
import FinancialDashboard from './components/admin/dashboards/FinancialDashboard';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import SurgicalItemsManagement from './components/admin/Admin/SurgicalItemsManagement';
import FinancialManagePayments from './components/admin/Financial_Manager/FinancialManagePayments';
import ScheduleConsultation from './components/admin/Doctor/ScheduleConsultation';
import ViewConsultations from './components/admin/Doctor/ViewConsultations';
import InventoryTotalView from './components/admin/Admin/InventoryTotalView';
import PrescriptionPage from './components/admin/Doctor/PrescriptionPage';
import PaymentTotalView from './components/admin/Financial_Manager/PaymentTotalView';

// ✅ NEW: Patient Registration Components for Receptionist
import PatientRegistration from './components/admin/Reciptionist/PatientRegistration';
import PatientList from './components/admin/Reciptionist/PatientList';
import PatientDetails from './components/admin/Reciptionist/PatientDetails';

// ✅ Healthcare Service Components
const BookAppointmentPage = () => (
  <div style={{padding: '2rem'}}>
    <h2>📅 Book Appointment</h2>
    <p>Schedule your medical appointment online.</p>
  </div>
);

const AppointmentsPage = () => (
  <div style={{padding: '2rem'}}>
    <h2>📋 My Appointments</h2>
    <p>View and manage your appointments.</p>
  </div>
);

const MedicalRecordsPage = () => (
  <div style={{padding: '2rem'}}>
    <h2>📄 Medical Records</h2>
    <p>Access your medical history and records.</p>
  </div>
);

const DoctorsPage = () => (
  <div style={{padding: '2rem'}}>
    <h2>👨‍⚕️ Find Doctors</h2>
    <p>Browse our network of qualified healthcare professionals.</p>
  </div>
);

const SpecialtyPage = () => (
  <div style={{padding: '2rem'}}>
    <h2>🩺 Medical Specialty</h2>
    <p>Specialized medical services and treatments.</p>
  </div>
);

const SearchPage = () => (
  <div style={{padding: '2rem'}}>
    <h2>🔍 Search Results</h2>
    <p>Find healthcare services, doctors, and facilities.</p>
  </div>
);

const AdminLandingPage = () => (
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
);

const NotFoundPage = () => (
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
);

function App() {
  return (
    <Router>
      <div className="App">
        <MedicalNavbar />
        
        <main className="main-content">
          <Routes>
            {/* ✅ Public User Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/PatientProfile" element={<PatientProfile />} />
            <Route path="/Login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>

            {/* ✅ Healthcare Service Routes */}
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/book-appointment" element={<BookAppointmentPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/medical-records" element={<MedicalRecordsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/specialty/:id" element={<SpecialtyPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* ✅ Admin Portal Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLandingPage />} />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/receptionist-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <ReceptionistDashboard />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/doctor-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/financial-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <FinancialDashboard />
                </ProtectedAdminRoute>
              } 
            />

            {/* ✅ Alternative shorter routes for admin dashboards */}
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

            {/* ✅ Patient Registration Routes for Receptionist */}
            <Route 
              path="/receptionist/patient_registration" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientRegistration />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/receptionist/patients" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientList />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/receptionist/patients/:id" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientDetails />
                </ProtectedAdminRoute>
              } 
            />

            {/* ✅ Alternative routes for patient management under admin */}
            <Route 
              path="/admin/receptionist/patient_registration" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientRegistration />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/receptionist/patients" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientList />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/receptionist/patients/:id" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientDetails />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
             path="/admin/surgical-items" 
             element={<SurgicalItemsManagement />} />

            <Route
             path="/admin/financial/payments"
             element={<FinancialManagePayments />} />

            {/* ✅ Admin Consultation Scheduling */}
            <Route
              path="/admin/doctor/schedule-consultation"
              element={<ScheduleConsultation />} />

            <Route
              path="/admin/doctor/view-consultations"
              element={<ViewConsultations />} />

            <Route
              path="/admin/doctor/prescriptions"
              element={<PrescriptionPage />} />

            <Route
             path="/admin/financial/payments/inventory-view"
              element={<InventoryTotalView />} />

            <Route
              path="/admin/financial/payments/total-view"
              element={<PaymentTotalView />} />

            {/* ✅ 404 Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
