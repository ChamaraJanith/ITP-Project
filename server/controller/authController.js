// backend/controller/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';
import { sendEmail, generateOTPEmailTemplate } from '../config/emailConfig.js';

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role }, 
    process.env.JWT_SECRET || 'your-secret-key-here', 
    { expiresIn: '7d' }
  );
};

// ==================== REGISTER ====================
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, role } = req.body;
    
    console.log('📝 Registration attempt:', { name, email, phone, gender, role });
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (phone && phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Check if user exists
    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate unique user ID
    const userId = await userModel.generateUniqueUserId(new Date());
    console.log('🆔 Generated User ID:', userId);

    // Create user
    const user = new userModel({
      _id: userId,
      userId: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      role: role || 'user'
    });

    await user.save();

    console.log('✅ User created:', user._id);

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // Response
    const userResponse = {
      _id: user._id,
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse,
      data: userResponse
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.email, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userResponse = {
      _id: user._id,
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== LOGOUT ====================
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== SEND VERIFICATION OTP ====================
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationOtp = otp;
    user.verificationOtpExpiry = otpExpiry;
    await user.save();

    const emailTemplate = generateOTPEmailTemplate(otp, 'verification');
    const emailResult = await sendEmail(
      user.email,
      'Email Verification OTP - HealX Healthcare',
      emailTemplate
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification OTP sent to your email'
    });

  } catch (error) {
    console.error('❌ sendVerifyOtp error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== VERIFY EMAIL ====================
export const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.userId;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const user = await userModel.findById(userId).select('+verificationOtp +verificationOtpExpiry');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isValidOTP(otp, 'verification')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.isEmailVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('❌ verifyEmail error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== CHECK AUTHENTICATION ====================
export const isAuthenticated = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ isAuthenticated error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== SEND RESET OTP ====================
export const sendResetOtp = async (req, res) => {
  try {
    console.log('📧 sendResetOtp called');
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    const emailTemplate = generateOTPEmailTemplate(otp, 'reset');
    const emailResult = await sendEmail(
      email,
      'Password Reset OTP - HealX Healthcare',
      emailTemplate,
      `Your password reset OTP is: ${otp}. This OTP will expire in 10 minutes.`
    );

    if (!emailResult.success) {
      console.error('❌ Failed to send email');
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    console.log('✅ Reset OTP sent to:', email);
    
    res.json({
      success: true,
      message: 'OTP sent to your email successfully!',
      email: email
    });

  } catch (error) {
    console.error('❌ sendResetOtp error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== RESET PASSWORD ====================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    console.log('🔄 Password reset for:', email);
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await userModel.findOne({ 
      email: email.toLowerCase()
    }).select('+resetPasswordOtp +resetPasswordOtpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.resetPasswordOtp !== otp || user.resetPasswordOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    console.log('✅ Password reset successful for:', email);

    res.json({
      success: true,
      message: 'Password reset successfully!'
    });

  } catch (error) {
    console.error('❌ resetPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ==================== RESEND RESET OTP ====================
export const resendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔄 Resending OTP to:', email);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;
    await user.save();

    const emailTemplate = generateOTPEmailTemplate(otp, 'reset');
    const emailResult = await sendEmail(
      email,
      'Password Reset OTP (Resent) - HealX Healthcare',
      emailTemplate
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }

    console.log('✅ OTP resent to:', email);

    res.json({
      success: true,
      message: 'OTP resent successfully!'
    });

  } catch (error) {
    console.error('❌ resendResetOtp error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
