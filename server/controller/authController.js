// controller/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../model/userModel.js";
import transporter from "../config/nodemailer.js";
import mongoose from 'mongoose';
import 'dotenv/config';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  console.log('🔍 Registration attempt:', { name, email, password: '***' });
  
  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please fill all the fields" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
  }

  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(500).json({ success: false, message: "Database connection error" });
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await UserModel.findOne({ 
      $or: [{ email: email.toLowerCase() }, { name }] 
    });
    
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    console.log('👤 Creating user object...');
    const user = new UserModel({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      isAccountVerified: false,
      verifyOtp: '',
      verifyOtpExpireAt: 0,
      resetOtp: '',
      resetOtpExpireAt: 0
    });

    // Save to database
    console.log('💾 Attempting to save user to database...');
    const savedUser = await user.save();
    console.log('✅ User saved successfully:', savedUser._id);

    // Generate JWT token
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Send welcome email
    try {
      console.log('📧 Sending welcome email...');
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: 'Welcome to HealX Healthcare System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Welcome to HealX Healthcare System!</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for registering with our healthcare platform. Your account has been created successfully!</p>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>What you can do now:</h3>
              <ul>
                <li>Book appointments with top doctors</li>
                <li>Access medical records</li>
                <li>Get lab test results</li>
                <li>24/7 emergency support</li>
              </ul>
            </div>
            
            <p>Best regards,<br><strong>HealX Healthcare Team</strong></p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.log('⚠️ Email sending failed, but user was created:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        isAccountVerified: savedUser.isAccountVerified
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: "Validation failed", details: messages });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * User login
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Login attempt for:', email);
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    // Find user in database
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    console.log('✅ User found:', user.name);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    console.log('✅ Password validated successfully');

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log('✅ Login successful for:', user.name);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * User logout
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Send email verification OTP (protected route)
 */
export const sendVerifyOtp = async (req, res) => {
  try {
    const userID = req.user ? req.user.id : req.body.userID;
    const user = await UserModel.findById(userID);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (user.isAccountVerified) {
      return res.status(400).json({ success: false, message: "Account already verified" });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Update user with OTP
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = otpExpireAt;
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Email Verification OTP - HealX Healthcare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Email Verification</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Please use the following OTP to verify your email address:</p>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="color: #667eea; font-size: 2em; letter-spacing: 3px;">${otp}</h1>
            <p style="color: #666;">This OTP will expire in 24 hours</p>
          </div>
          
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br><strong>HealX Healthcare Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: `Verification OTP sent to your email` });
  } catch (error) {
    console.error("Error in sendVerifyOtp:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify user's email (protected route)
 */
export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userID = req.user ? req.user.id : req.body.userID;
  
  if (!userID || !otp) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const user = await UserModel.findById(userID);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Mark email as verified
    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check if user is authenticated (protected route)
 */
export const isAuthenticated = async (req, res) => {
  try {
    if (req.user) {
      return res.json({ 
        success: true, 
        message: "User is authenticated",
        user: req.user 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: "User is not authenticated" 
      });
    }
  } catch (error) {
    console.error("Error in isAuthenticated:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send password reset OTP
 */
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Update user with reset OTP
    user.resetOtp = otp;
    user.resetOtpExpireAt = otpExpireAt;
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset OTP - HealX Healthcare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>You requested to reset your password. Please use the following OTP:</p>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="color: #856404; font-size: 2em; letter-spacing: 3px;">${otp}</h1>
            <p style="color: #856404;">This OTP will expire in 15 minutes</p>
          </div>
          
          <p><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br><strong>HealX Healthcare Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: `Password reset OTP sent to your email` });
  } catch (error) {
    console.error("Error in sendResetOtp:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset user password using OTP
 */
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset OTP
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    await user.save();

    // Send confirmation email
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Password Reset Successful - HealX Healthcare',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Password Reset Successful</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <p>You can now log in to your account using your new password.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br><strong>HealX Healthcare Team</strong></p>
          </div>
        `,
      };
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.log('⚠️ Password reset confirmation email failed:', emailError.message);
    }

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
