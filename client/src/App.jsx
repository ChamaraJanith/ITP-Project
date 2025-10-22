// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// ==================== LAYOUT COMPONENTS ====================
import MedicalNavbar from './components/NavBar';
import Footer from './components/Footer';

// ==================== PUBLIC PAGES ====================
import Homepage from './components/Homepage';
import EmergencyPage from './components/EmergencyPage';
import HospitalsPage from './components/HospitalPage';

// ==================== AUTH COMPONENTS ====================
import Login from './pages/Login';
import RegisterUser from './components/RegisterUser';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// ==================== USER PAGES ====================
import PatientProfile from './pages/PatientProfile';
import EditPatientProfile from './pages/EditPatientProfile';
import Appointments from './pages/Appointments';
import SpecialtyPage from './pages/SpecialtyPage';

// ==================== PROTECTED ROUTE WRAPPERS ====================
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

// ==================== APPOINTMENT COMPONENTS ====================
import BookAppointment from './components/appointments/BookAppointment';
import ManageAppointments from './components/appointments/ManageAppointments';
import PaymentForm from './components/appointments/PaymentForm';
import ConfirmationPage from './components/appointments/ConfirmationPage';

// ==================== ADMIN DASHBOARDS ====================
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/dashboards/AdminDashboard';
import ReceptionistDashboard from './components/admin/dashboards/ReceptionistDashboard';
import DoctorDashboard from './components/admin/dashboards/DoctorDashboard';
import FinancialDashboard from './components/admin/dashboards/FinancialDashboard';

// ==================== ADMIN MANAGEMENT ====================
import AllUserManagement from './components/admin/Admin/AllUserManagement';
import SurgicalItemsManagement from './components/admin/Admin/SurgicalItemsManagement';
import InventoryTotalView from './components/admin/Admin/InventoryTotalView';
import InventoryReports from './components/admin/Admin/InventoryReports';
import PatientDetailsWithCharts from './components/admin/Admin/PatientDetailsWithCharts';
import DisposalModal from './components/admin/Admin/disposeModal';
import SupplierManagement from './components/admin/Admin/SupplierManagement';

// ==================== RECEPTIONIST COMPONENTS ====================
import PatientRegistration from './components/admin/Reciptionist/PatientRegistration';
import PatientList from './components/admin/Reciptionist/PatientList';
import PatientDetails from './components/admin/Reciptionist/PatientDetails';

// ==================== DOCTOR COMPONENTS ====================
import DoctorAppointments from './components/admin/Doctor/DoctorAppointment';
import ScheduleConsultation from './components/admin/Doctor/ScheduleConsultation';
import ViewConsultations from './components/admin/Doctor/ViewConsultations';
import PrescriptionPage from './components/admin/Doctor/PrescriptionPage';
import EmergencyAlertsPage from './components/admin/Doctor/EmergencyAlertsPage';
import DoctorInventoryPage from './components/admin/Doctor/DoctorInventoryPage';
import PatientRecordsPage from './components/admin/Doctor/PatientRecordsPage';

// ==================== FINANCIAL MANAGER COMPONENTS ====================
import FinancialManagePayments from './components/admin/Financial_Manager/FinancialManagePayments';
import PaymentTotalView from './components/admin/Financial_Manager/PaymentTotalView';
import FinancialPayroll from './components/admin/Financial_Manager/FinancialPayroll';
import TotalPayrollView from './components/admin/Financial_Manager/TotalPayrollView';
import ExpenseTracking from './components/admin/Financial_Manager/ExpenseTracking';
import ExploreTrends from './components/admin/Financial_Manager/ExploreTrends';
import ProfitOrLoss from './components/admin/Financial_Manager/ProfitOrLoss';
import SendEmail from './components/admin/Financial_Manager/SendEmail';
import FinancialUtilities from './components/admin/Financial_Manager/FinancialUtilities';
import FinancialBudgetPlanning from './components/admin/Financial_Manager/FinancialBudgetPlanning';
import TotalUtilityView from './components/admin/Financial_Manager/TotalUtilityView';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Scroll to top on route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);
  
  return null;
}

// ==================== PLACEHOLDER PAGES ====================

/**
 * Doctors Directory Page
 */
const DoctorsPage = () => (
  <div style={{
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '60vh'
  }}>
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>
        👨‍⚕️ Find Doctors
      </h2>
      <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
        Browse our network of qualified healthcare professionals. Search by specialty, location, or name.
      </p>
    </div>
  </div>
);

/**
 * Search Results Page
 */
const SearchPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  
  return (
    <div style={{
      padding: '4rem 2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '60vh'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>
          🔍 Search Results
        </h2>
        {query && (
          <p style={{ 
            color: '#64748b', 
            fontSize: '1.1rem', 
            marginBottom: '2rem',
            background: '#f1f5f9',
            padding: '1rem',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            Searching for: <strong style={{ color: '#6366f1' }}>{query}</strong>
          </p>
        )}
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Find healthcare services, doctors, and facilities.
        </p>
      </div>
    </div>
  );
};

/**
 * Medical Records Page
 */
const MedicalRecordsPage = () => (
  <div style={{
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '60vh'
  }}>
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>
        📄 Medical Records
      </h2>
      <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
        Access your complete medical history, test results, and health records securely.
      </p>
    </div>
  </div>
);

/**
 * Admin Portal Landing Page
 */
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
    <div style={{ maxWidth: '800px', padding: '2rem' }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '1rem',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontWeight: '800'
      }}>
        🏥 HealX Healthcare Admin Portal
      </h1>
      
      <p style={{ 
        fontSize: '1.2rem', 
        marginBottom: '2rem', 
        opacity: 0.95,
        lineHeight: '1.6'
      }}>
        Secure access for healthcare professionals and administrators
      </p>
      
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/admin/login" 
          style={{
            background: 'white',
            color: '#667eea',
            padding: '16px 40px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 6px 25px rgba(0,0,0,0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }}
        >
          Access Admin Portal →
        </a>
      </div>
      
      <div style={{ 
        marginTop: '3rem', 
        fontSize: '14px', 
        opacity: '0.9',
        padding: '2rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          🔐 Authorized Personnel Only
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          fontSize: '15px'
        }}>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            👩‍💼 Receptionist
          </span>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            👨‍⚕️ Doctor
          </span>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            💰 Financial Manager
          </span>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}>
            👑 Administrator
          </span>
        </div>
      </div>
    </div>
  </div>
);

/**
 * 404 Not Found Page
 */
const NotFoundPage = () => (
  <div style={{
    padding: '4rem 2rem', 
    textAlign: 'center',
    background: '#f8fafc',
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      background: 'white',
      padding: '3rem',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      width: '100%'
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🚫</div>
      
      <h2 style={{ 
        color: '#ef4444', 
        marginBottom: '1rem',
        fontSize: '2rem',
        fontWeight: '700'
      }}>
        Page Not Found
      </h2>
      
      <p style={{ 
        color: '#64748b', 
        marginBottom: '2rem',
        fontSize: '1.1rem',
        lineHeight: '1.6'
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        <a 
          href="/" 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.3s ease',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
        >
          🏠 Go Home
        </a>
        
        <a 
          href="/login" 
          style={{
            background: '#f1f5f9',
            color: '#475569',
            padding: '14px 28px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            transition: 'all 0.3s ease',
            display: 'inline-block'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#e2e8f0';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#f1f5f9';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔐 Login
        </a>
      </div>
    </div>
  </div>
);

// ==================== MAIN APP COMPONENT ====================

function App() {
  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    // Log app initialization
    console.log('🏥 HealX Healthcare App initialized');
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <MedicalNavbar />

      <div className="App">
        <main className="main-content" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Routes>
            {/* ========================= PUBLIC ROUTES ========================= */}
            
            {/* Home & Auth */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Public Healthcare Services */}
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/specialty/:id" element={<SpecialtyPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* ========================= PROTECTED USER ROUTES ========================= */}
            
            {/* Patient Profile - Both paths for compatibility */}
            <Route 
              path="/PatientProfile" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/patient-profile" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />

            {/* Edit Profile */}
            <Route 
              path="/edit-profile" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <EditPatientProfile />
                </ProtectedRoute>
              } 
            />

            {/* Appointments */}
            <Route 
              path="/appointments" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <Appointments />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/book-appointment" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <BookAppointment />
                </ProtectedRoute>
              } 
            />

            {/* Payment & Confirmation */}
            <Route 
              path="/payment/:appointmentId" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <PaymentForm />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/confirmation/:appointmentId" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <ConfirmationPage />
                </ProtectedRoute>
              } 
            />

            {/* Medical Records */}
            <Route 
              path="/medical-records" 
              element={
                <ProtectedRoute allowedRoles={['user', 'doctor', 'admin']}>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              } 
            />

            {/* ========================= ADMIN PORTAL ========================= */}
            
            {/* Admin Public Pages */}
            <Route path="/admin" element={<AdminLandingPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ========================= ADMIN DASHBOARD ========================= */}
            
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />

            {/* User Management */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <AllUserManagement />
                </ProtectedAdminRoute>
              } 
            />

            {/* Patient Management */}
            <Route 
              path="/admin/patients" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin', 'receptionist']}>
                  <PatientDetailsWithCharts />
                </ProtectedAdminRoute>
              }
            />

            {/* Inventory Management */}
            <Route 
              path="/admin/surgical-items" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <SurgicalItemsManagement />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/inventory-reports" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <InventoryReports />
                </ProtectedAdminRoute>
              } 
            />

            {/* Procurement */}
            <Route 
              path="/admin/procurement" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <SupplierManagement />
                </ProtectedAdminRoute>
              } 
            />

            {/* Disposal */}
            <Route 
              path="/admin/dispose-modal" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <DisposalModal apiBaseUrl="http://localhost:7000/api/disposalrecords" />
                </ProtectedAdminRoute>
              } 
            />

            {/* ========================= RECEPTIONIST ROUTES ========================= */}
            
            <Route 
              path="/admin/receptionist-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <ReceptionistDashboard />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/receptionist" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <ReceptionistDashboard />
                </ProtectedAdminRoute>
              } 
            />

            {/* Receptionist - Patient Management */}
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

            <Route 
              path="/receptionist/manage_appointments" 
              element={
                <ProtectedAdminRoute allowedRoles={['receptionist', 'admin']}>
                  <ManageAppointments />
                </ProtectedAdminRoute>
              }
            />

            {/* Alternative receptionist routes under /admin prefix */}
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

            {/* ========================= DOCTOR ROUTES ========================= */}
            
            <Route 
              path="/admin/doctor-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
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

            {/* Doctor - Appointments & Consultations */}
            <Route 
              path="/admin/doctor/appointments" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorAppointments />
                </ProtectedAdminRoute>
              }
            />

            <Route 
              path="/admin/doctor/schedule-consultation" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <ScheduleConsultation />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/doctor/view-consultations" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <ViewConsultations />
                </ProtectedAdminRoute>
              } 
            />

            {/* Doctor - Prescriptions */}
            <Route 
              path="/admin/doctor/prescriptions" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <PrescriptionPage />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/doctor/prescription-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <PrescriptionPage />
                </ProtectedAdminRoute>
              } 
            />

            {/* Doctor - Emergency & Records */}
            <Route 
              path="/admin/doctor/emergency-alerts" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <EmergencyAlertsPage />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/doctor/patient-records" 
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <PatientRecordsPage />
                </ProtectedAdminRoute>
              } 
            />

            {/* Doctor - Inventory */}
            <Route
              path="/admin/doctor/inventory"
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorInventoryPage
                    isOpen={true}
                    onClose={() => window.history.back()}
                    apiBaseUrl={import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000'}
                  />
                </ProtectedAdminRoute>
              }
            />

            {/* ========================= FINANCIAL MANAGER ROUTES ========================= */}
            
            <Route 
              path="/admin/financial-dashboard" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <FinancialDashboard />
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

            {/* Financial - Payments */}
            <Route 
              path="/admin/financial/payments" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <FinancialManagePayments />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/payments/inventory-view" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <InventoryTotalView />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/payments/total-view" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <PaymentTotalView />
                </ProtectedAdminRoute>
              } 
            />

            {/* Financial - Payroll */}
            <Route 
              path="/admin/financial/payrolls" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <FinancialPayroll />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/payrolls/total-view" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <TotalPayrollView />
                </ProtectedAdminRoute>
              }
            />

            {/* Financial - Expenses & Analytics */}
            <Route 
              path="/admin/financial/expenses" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <ExpenseTracking />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/trends" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <ExploreTrends />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/profit-loss" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <ProfitOrLoss />
                </ProtectedAdminRoute>
              } 
            />

            {/* Financial - Utilities & Budget */}
            <Route 
              path="/admin/financial/send-email" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <SendEmail />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/utities" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <FinancialUtilities />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/financial/budget-planning" 
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <FinancialBudgetPlanning />
                </ProtectedAdminRoute>
              } 
            />

            <Route
              path="/admin/financial/utilities/analytics"
              element={
                <ProtectedAdminRoute allowedRoles={['financial_manager', 'admin']}>
                  <TotalUtilityView />
                </ProtectedAdminRoute>
              }
            />

            {/* ========================= FALLBACK ROUTE ========================= */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
