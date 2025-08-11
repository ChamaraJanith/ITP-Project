// routes/adminRoutes.js
import express from 'express';
import { adminLogin, adminLogout, verifyAdmin } from '../controller/adminAuthController.js';
import { authenticateUser, authorizeRoles } from '../middleware/unifiedAuthMiddleware.js';

const router = express.Router();

// ✅ Admin authentication routes
router.post('/admin-login', adminLogin);
router.post('/admin-logout', adminLogout);
router.get('/verify-admin', 
  authenticateUser, 
  authorizeRoles(['receptionist', 'doctor', 'financial_manager', 'admin']), 
  verifyAdmin
);

export default router;
