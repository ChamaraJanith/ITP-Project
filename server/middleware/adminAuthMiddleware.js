import jwt from 'jsonwebtoken';
import UnifiedUserModel from '../model/UnifiedUserModel.js';

/**
 * Authenticate Admin Middleware
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.adminToken || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No admin token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid admin token.'
      });
    }

    // Get admin from database
    const admin = await UnifiedUserModel.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin account not found or inactive.'
      });
    }

    // Add admin to request object
    req.admin = admin;
    next();

  } catch (error) {
    console.error('❌ Admin authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid admin token.'
    });
  }
};

/**
 * Authorize Roles Middleware
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
