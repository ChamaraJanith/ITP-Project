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
  getSystemActivityLogs
} from '../controller/adminDashboardController.js';
import { authenticateAdmin, authorizeRoles } from '../middleware/adminAuthMiddleware.js';

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

// Role-specific dashboards
router.get('/dashboard', authenticateAdmin, authorizeRoles(['admin']), (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin dashboard loaded successfully',
    redirect: '/admin/dashboard/stats'
  });
});

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
      message: 'Doctor dashboard loaded',
      data: {
        admin: req.admin,
        features: [
          'view_medical_records',
          'create_prescriptions', 
          'update_patient_records',
          'schedule_consultations'
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
      message: 'Financial dashboard loaded',
      data: {
        admin: req.admin,
        features: [
          'view_billing',
          'manage_payments', 
          'generate_reports',
          'track_revenue'
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
      'GET /dashboard/activity': 'Get system activity logs'
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
      'GET /api/admin/profile',
      'PUT /api/admin/profile',
      'GET /api/admin/verify',
      'POST /api/admin/logout'
    ]
  });
});

export default router;
