import express from 'express';
import { 
  adminLogin, 
  adminLogout, 
  verifyAdmin, 
  getAdminProfile, 
  updateAdminProfile 
} from '../controller/adminAuthController.js';
import { authenticateAdmin, authorizeRoles } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Public admin authentication routes
router.post('/login', adminLogin);
router.post('/logout', adminLogout);

// Protected admin routes
router.get('/verify', authenticateAdmin, verifyAdmin);
router.get('/profile', authenticateAdmin, getAdminProfile);
router.put('/profile', authenticateAdmin, updateAdminProfile);

// Dashboard routes with role-based access
router.get('/dashboard', authenticateAdmin, authorizeRoles(['admin']), (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin dashboard data loaded successfully',
    data: {
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        role: req.admin.role,
        department: req.admin.department
      },
      stats: {
        totalUsers: 0, // Implement actual stats
        totalAppointments: 0,
        totalRevenue: 0,
        activeStaff: 0
      },
      recentActivity: [],
      notifications: []
    },
    timestamp: new Date().toISOString()
  });
});

// Role-specific dashboards
router.get('/receptionist-dashboard', 
  authenticateAdmin, 
  authorizeRoles(['receptionist', 'admin']), 
  (req, res) => {
    res.json({ 
      success: true,
      message: 'Receptionist dashboard loaded',
      data: {
        admin: req.admin,
        features: [
          'manage_appointments',
          'view_patients', 
          'check_in_patients',
          'schedule_appointments'
        ],
        todayAppointments: [],
        waitingPatients: [],
        notifications: []
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
      message: 'Doctor dashboard loaded',
      data: {
        admin: req.admin,
        features: [
          'view_medical_records',
          'create_prescriptions', 
          'update_patient_records',
          'schedule_consultations'
        ],
        todayPatients: [],
        pendingReports: [],
        emergencyAlerts: []
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
      message: 'Financial dashboard loaded',
      data: {
        admin: req.admin,
        features: [
          'view_billing',
          'manage_payments', 
          'generate_reports',
          'track_revenue'
        ],
        financialSummary: {
          todayRevenue: 0,
          pendingPayments: 0,
          monthlyTarget: 0
        },
        recentTransactions: []
      }
    });
  }
);

// Admin management routes (super admin only)
router.get('/manage-staff', 
  authenticateAdmin, 
  authorizeRoles(['admin']), 
  (req, res) => {
    res.json({ 
      success: true,
      message: 'Staff management data',
      data: {
        staff: [], // Implement actual staff list
        departments: ['Administration', 'Medical', 'Reception', 'Finance'],
        roles: ['admin', 'doctor', 'receptionist', 'financial_manager']
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
      'GET /dashboard': 'Admin dashboard (admin only)',
      'GET /receptionist-dashboard': 'Receptionist dashboard',
      'GET /doctor-dashboard': 'Doctor dashboard',
      'GET /financial-dashboard': 'Financial dashboard',
      'GET /manage-staff': 'Staff management (admin only)'
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
      'GET /api/admin/dashboard',
      'GET /api/admin/profile',
      'PUT /api/admin/profile',
      'GET /api/admin/verify',
      'POST /api/admin/logout'
    ]
  });
});

export default router;
