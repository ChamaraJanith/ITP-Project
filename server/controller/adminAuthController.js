// controller/adminAuthController.js
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * ✅ Admin-Specific Login (Only allows admin roles)
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UnifiedUserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // ✅ Check if user has admin role
    const adminRoles = ['receptionist', 'doctor', 'financial_manager', 'admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if admin is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate admin JWT token with enhanced claims
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Shorter expiry for admin sessions
    );

    // Set secure HTTP-only cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    console.log(`✅ Admin login successful: ${user.email} (${user.role})`);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        employeeId: user.employeeId,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

/**
 * ✅ Admin Logout
 */
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie('adminToken');
    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin logout failed'
    });
  }
};

/**
 * ✅ Verify Admin Session
 */
export const verifyAdmin = async (req, res) => {
  try {
    const admin = await UnifiedUserModel.findById(req.admin.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin session invalid'
      });
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        permissions: admin.permissions,
        employeeId: admin.employeeId
      }
    });
  } catch (error) {
    console.error('Verify admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin session'
    });
  }
};
