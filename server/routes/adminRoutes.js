import express from 'express';
import { 
  adminLogin, 
  adminLogout, 
  verifyAdmin, 
  getAdminProfile, 
  updateAdminProfile
} from '../controller/adminAuthController.js';
import {
  getDashboardStats,
  getUserGrowthAnalytics,
  getSystemActivityLogs,
  getAllPatients,
  getRealTimeProfiles,
  getDashboardRoleAccess,
  getProfileDetails,
  updateProfileStatus,
  getAllProfilesDetailed
} from '../controller/adminDashboardController.js';
import { authenticateAdmin, authorizeRoles} from '../middleware/adminAuthMiddleware.js';


const router = express.Router();

// Public admin authentication routes
router.post('/login', adminLogin);
router.post('/logout', adminLogout);


// Protected admin routes
router.get('/verify', authenticateAdmin, verifyAdmin);
router.get('/profile', authenticateAdmin, getAdminProfile);
router.put('/profile', authenticateAdmin, updateAdminProfile);

// Dashboard data routes
router.get('/dashboard/stats', authenticateAdmin, authorizeRoles(['admin']), getDashboardStats);
router.get('/dashboard/analytics', authenticateAdmin, authorizeRoles(['admin']), getUserGrowthAnalytics);
router.get('/dashboard/activity', authenticateAdmin, authorizeRoles(['admin']), getSystemActivityLogs);
router.get('/dashboard/patients', authenticateAdmin, authorizeRoles(['admin', 'doctor', 'receptionist']), getAllPatients);

// Real-time profiles and role access
router.get('/dashboard/profiles/realtime', authenticateAdmin, authorizeRoles(['admin']), getRealTimeProfiles);
router.get('/dashboard/role-access', authenticateAdmin, getDashboardRoleAccess);

// NEW ROUTES: Individual profile access
router.get('/profiles/detailed', authenticateAdmin, authorizeRoles(['admin']), getAllProfilesDetailed);
router.get('/profile/:profileType/:profileId', authenticateAdmin, authorizeRoles(['admin']), getProfileDetails);
router.put('/profile/:profileType/:profileId/update', authenticateAdmin, authorizeRoles(['admin']), updateProfileStatus);

// Role-specific dashboards - Admin can access all
router.get('/dashboard', authenticateAdmin, authorizeRoles(['admin']), (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin dashboard loaded successfully',
    redirect: '/admin/dashboard/stats'
  });
});

router.get('/receptionist-dashboard', 
  authenticateAdmin, 
  authorizeRoles(['receptionist', 'admin','financial_manager']), 
  (req, res) => {
    res.json({ 
      success: true,
      message: 'Receptionist dashboard loaded successfully',
      data: {
        admin: req.admin,
        dashboardType: 'receptionist',
        features: [
          'manage_appointments',
          'view_patients', 
          'check_in_patients',
          'schedule_appointments',
          'patient_registration'
        ],
        stats: {
          todayAppointments: 12,
          waitingPatients: 5,
          completedToday: 8,
          upcomingToday: 4
        },
        recentActivities: [
          'Patient John Doe checked in',
          'Appointment scheduled for Jane Smith',
          'Dr. Johnson available in Room 101'
        ]
      }
    });
  }
);

router.get('/doctor-dashboard', 
  authenticateAdmin, 
  authorizeRoles(['doctor', 'admin']), 
  (req, res) => {
    res.json({ 
      success: true,
      message: 'Doctor dashboard loaded successfully',
      data: {
        admin: req.admin,
        dashboardType: 'doctor',
        features: [
          'view_medical_records',
          'create_prescriptions', 
          'update_patient_records',
          'schedule_consultations',
          'medical_reports'
        ],
        stats: {
          todayPatients: 15,
          pendingReports: 3,
          consultationsCompleted: 12,
          emergencyAlerts: 1
        },
        recentActivities: [
          'Prescription created for Patient A',
          'Medical report updated for Patient B',
          'Emergency consultation scheduled'
        ]
      }
    });
  }
);

router.get('/financial-dashboard', 
  authenticateAdmin, 
  authorizeRoles(['financial_manager', 'admin']), 
  (req, res) => {
    res.json({ 
      success: true,
      message: 'Financial dashboard loaded successfully',
      data: {
        admin: req.admin,
        dashboardType: 'financial',
        features: [
          'view_billing',
          'manage_payments', 
          'generate_reports',
          'track_revenue',
          'payment_processing'
        ],
        stats: {
          todayRevenue: 25000,
          pendingPayments: 8500,
          monthlyTarget: 500000,
          collectionRate: 92
        },
        recentActivities: [
          'Payment received from Patient X',
          'Invoice generated for Treatment Y',
          'Monthly report completed'
        ]
      }
    });
  }
);

// Route information endpoint
router.get('/routes', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Available admin routes',
    userRole: req.admin.role,
    routes: {
      'POST /login': 'Admin login (public)',
      'POST /logout': 'Admin logout (public)',
      'GET /verify': 'Verify admin session',
      'GET /profile': 'Get admin profile',
      'PUT /profile': 'Update admin profile',
      'GET /dashboard/stats': 'Get dashboard statistics',
      'GET /dashboard/analytics': 'Get user growth analytics',
      'GET /dashboard/activity': 'Get system activity logs',
      'GET /dashboard/patients': 'Get all patients',
      'GET /dashboard/profiles/realtime': 'Get real-time profiles',
      'GET /dashboard/role-access': 'Get dashboard role access',
      'GET /profiles/detailed': 'Get detailed profiles with filters',
      'GET /profile/:profileType/:profileId': 'Get individual profile details',
      'PUT /profile/:profileType/:profileId/update': 'Update profile status'
    }
  });
});

// FIXED: Express v5 compatible catch-all route
router.use('/{*path}', authenticateAdmin, (req, res) => {
  res.status(404).json({
    success: false,
    message: `Admin route ${req.originalUrl} not found`,
    userRole: req.admin?.role,
    availableRoutes: [
      'GET /api/admin/dashboard/stats',
      'GET /api/admin/dashboard/profiles/realtime',
      'GET /api/admin/profile/patient/:id',
      'GET /api/admin/profile/staff/:id',
      'GET /api/admin/receptionist-dashboard',
      'GET /api/admin/doctor-dashboard',
      'GET /api/admin/financial-dashboard',
      'GET /api/admin/profile',
      'PUT /api/admin/profile',
      'GET /api/admin/verify',
      'POST /api/admin/logout'
    ]
  });
});

export default router;
//gayath