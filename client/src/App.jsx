// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './components/Homepage';
import MedicalNavbar from './components/NavBar';
import EmergencyPage from './components/EmergencyPage';
import HospitalsPage from './components/HospitalPage';
import Footer from './components/Footer';
import AllUserManagement from './components/admin/Admin/AllUserManagement';
import ForgotPassword from './components/ForgotPassword';
// ✅ User Authentication Components (ADD THESE IMPORTS)
import Login from '../src/pages/Login';
import RegisterUser from './components/RegisterUser';
import '../src/pages/PatientProfile'
import DoctorAppointments from './components/admin/Doctor/DoctorAppointment';


// ✅ Existing User Components

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
import PatientDetailsWithCharts from './components/admin/Admin/PatientDetailsWithCharts';
import EmergencyAlertsPage from './components/admin/Doctor/EmergencyAlertsPage';

import DoctorItemRequestModal from "./components/admin/Doctor/DoctorInventoryPage"; // keep modal import [21]

import FinancialPayroll from './components/admin/Financial_Manager/FinancialPayroll';
import TotalPayrollView from './components/admin/Financial_Manager/TotalPayrollView';
import ExpenseTracking from './components/admin/Financial_Manager/ExpenseTracking';
import InventoryReports from './components/admin/Admin/InventoryReports';
import PatientRecordsPage from './components/admin/Doctor/PatientRecordsPage';
import ExploreTrends from './components/admin/Financial_Manager/ExploreTrends'; //new  
import ProfitOrLoss from './components/admin/Financial_Manager/ProfitOrLoss'; 
import SendEmail from './components/admin/Financial_Manager/SendEmail';
import FinancialUtilities from './components/admin/Financial_Manager/FinancialUtilities';
import FinancialBudgetPlanning from './components/admin/Financial_Manager/FinancialBudgetPlanning';
import PaymentForm from './components/appointments/PaymentForm';





// ✅ NEW: Patient Registration Components for Receptionist
import PatientRegistration from './components/admin/Reciptionist/PatientRegistration';
import PatientList from './components/admin/Reciptionist/PatientList';
import PatientDetails from './components/admin/Reciptionist/PatientDetails';
import ResetPassword from './components/ResetPassword';

// ✅ NEW: Procurement & Suppliers Component
import SupplierManagement from './components/admin/Admin/SupplierManagement';
import BookAppointment from './components/appointments/BookAppointment';
import DoctorInventoryPage from './components/admin/Doctor/DoctorInventoryPage';
import ConfirmationPage from './components/appointments/ConfirmationPage';
import PatientProfile from '../src/pages/PatientProfile';
import ManageAppointments from './components/appointments/ManageAppointments';

// ---- NEW: Force scroll top on route change ----
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Instant jump to top on every route change
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
// -----------------------------------------------

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
      </div>
    </div>
  </div>
);

function App() {
  // ---- NEW: Disable browser scroll restoration on refresh ----
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);
  // ------------------------------------------------------------

  return (
    
    <Router>
      {/* NEW: Ensure top-of-page on every route change */}
      <ScrollToTop />
      <MedicalNavbar />

      <div className="App">
        
        <main className="main-content">
          <Routes>
            {/* ✅ Public User Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login/>}/>
            <Route path="/forgot-password" element={<ForgotPassword />}/>

            {/* ✅ Healthcare Service Routes */}
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/book-appointment" element={<AppointmentsPage />} />
            <Route path="/medical-records" element={<MedicalRecordsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/specialty/:id" element={<SpecialtyPage />} />
            <Route path="/search" element={<SearchPage />} />
            //<Route path="/book-appointment" element={<BookAppointment />} />


            {/* ✅ Admin Portal Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLandingPage />} />
            <Route path="/reset-password" element={<ResetPassword/>}/>
            
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
  path="/admin/patients" 
  element={
    <ProtectedAdminRoute allowedRoles={['admin', 'receptionist']}>
      <PatientDetailsWithCharts />
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

            {/* ✅ NEW: emergency-alerts Route */}
            <Route 
            path="/admin/doctor/emergency-alerts" 
            element={
              <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                <EmergencyAlertsPage />
              </ProtectedAdminRoute>
            } 
          />

            {/* ✅ NEW: Procurement & Suppliers Route */}
            <Route 
              path="/admin/procurement" 
              element={
                <ProtectedAdminRoute allowedRoles={['admin']}>
                  <SupplierManagement />
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

            {/* Inventory management */}
            
            <Route path="/admin/surgical-items" element={<SurgicalItemsManagement />} />
              <Route path="/register" element={<RegisterUser />} />
              <Route path="/PatientProfile" element={<PatientProfile />} />
            {/* Financial routes */}
            <Route path="/admin/financial/payments" element={<FinancialManagePayments />} />
            <Route path="/admin/financial/payments/inventory-view" element={<InventoryTotalView />} />
            <Route path="/admin/financial/payments/total-view" element={<PaymentTotalView />} />
            <Route path="/receptionist/manage_appointments" element = {<ManageAppointments/>}/>


            {/* ✅ Admin Consultation Scheduling */}
            <Route path="/admin/doctor/schedule-consultation" element={<ScheduleConsultation />} />
            <Route path="/admin/doctor/view-consultations" element={<ViewConsultations />} />
            <Route path="/admin/doctor/prescriptions" element={<PrescriptionPage />} />
            <Route path="/admin/inventory-reports" element={<InventoryReports />} />
            <Route path="/payment/:appointmentId" element={<PaymentForm />} />
             <Route path="/confirmation/:appointmentId" element={<ConfirmationPage />} />
             <Route
    path="/admin/doctor/appointments"
    element={<DoctorAppointments />}/>
            

            <Route path="/admin/doctor/patient-records" element={<PatientRecordsPage />} />

            {/* Alias route so EMERGENCY ALERTS button works without removing it */}
            <Route path="/admin/doctor/prescription-dashboard" element={<PrescriptionPage />} />

            {/* ✅ Doctor Item Request (kept as modal, now forced open via props) */}
            <Route

              path="/admin/doctor/inventory"
              element={
                <ProtectedAdminRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorInventoryPage
                    isOpen={true}
                    onClose={() => window.history.back()}
                    apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
                  />
                </ProtectedAdminRoute>
              }
            />
          <Route
              path="/admin/doctor/prescriptions"
              element={<PrescriptionPage />} />

          

            <Route
             path="/admin/financial/payments/inventory-view"
              element={<InventoryTotalView />} />

            <Route
              path="/admin/financial/payments/total-view"
              element={<PaymentTotalView />} />

            
           <Route
              path="/admin/financial/payrolls"
              element={<FinancialPayroll />} 
        />

        <Route 
              path="/admin/financial/payrolls/total-view" 
              element={<TotalPayrollView />}
         />

         <Route 
              path="/admin/financial/expenses" 
              element={<ExpenseTracking />} 
         />

         <Route 
              path="/admin/financial/trends" 
              element={<ExploreTrends />} 
        />

        <Route 
              path="/admin/financial/profit-loss" 
              element={<ProfitOrLoss />} 
          />

        <Route 
              path="/admin/financial/send-email" 
              element={<SendEmail />} 
          />

        <Route 
              path="/admin/financial/utities" 
              element={<FinancialUtilities />} 
          />

        <Route 
              path="admin/financial/budget-planning" 
              element={<FinancialBudgetPlanning />} 
          />

        <Route
          path="/admin/users"
          element={<AllUserManagement />}
        ></Route>

              <Route 
  path="/admin/procurement" 
  element={
    <ProtectedAdminRoute allowedRoles={['admin']}>
      <SupplierManagement />
    </ProtectedAdminRoute>
  } 
/>


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
