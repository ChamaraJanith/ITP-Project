import UnifiedUserModel from '../model/UnifiedUserModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Admin Login Function
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Admin login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with admin roles
    const normalizedEmail = email.toLowerCase().trim();
    const adminRoles = ['admin', 'receptionist', 'doctor', 'financial_manager'];
    
    const user = await UnifiedUserModel.findOne({
      email: normalizedEmail,
      role: { $in: adminRoles }
    });

    if (!user) {
      console.log('❌ Admin user not found:', normalizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HTTP-only cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
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
    console.error('💥 Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

/**
 * Admin Logout Function
 */
export const adminLogout = async (req, res) => {
  try {
    // Clear the admin token cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    console.log('✅ Admin logout successful');
    
    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    console.error('❌ Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin logout failed'
    });
  }
};

/**
 * Verify Admin Session Function
 */
export const verifyAdmin = async (req, res) => {
  try {
    // req.admin is set by authentication middleware
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
    console.error('❌ Verify admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin session'
    });
  }
};

/**
 * Get Admin Profile Function
 */
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await UnifiedUserModel.findById(req.admin.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('❌ Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin profile'
    });
  }
};

/**
 * Update Admin Profile Function
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const admin = await UnifiedUserModel.findById(req.admin.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update allowed fields
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    
    await admin.save();

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('❌ Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin profile'
    });
  }
};
