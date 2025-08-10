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

  // Enhanced password validation
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      success: false, 
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
    });
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

    // Hash password with stronger salt rounds
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

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
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">HealX Healthcare</h1>
            </div>
            
            <h2 style="color: #333; text-align: center;">Welcome to HealX Healthcare System!</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for registering with our healthcare platform. Your account has been created successfully!</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white;">
              <h3 style="margin-top: 0; color: white;">What you can do now:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Book appointments with top doctors</li>
                <li>Access medical records securely</li>
                <li>Get lab test results instantly</li>
                <li>24/7 emergency support</li>
                <li>Telemedicine consultations</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666;">Ready to get started? Verify your email to unlock all features!</p>
            </div>
            
            <div style="border-top: 2px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 14px;">This email was sent to ${email}</p>
              <p style="color: #667eea; font-weight: bold;">Best regards,<br>HealX Healthcare Team</p>
            </div>
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
    // Find user in database with password field
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    
    console.log('✅ User logged out successfully');
    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("❌ Error in logout:", error);
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0;">HealX Healthcare</h1>
          </div>
          
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Please use the following One-Time Password (OTP) to verify your email address:</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; margin: 30px 0; text-align: center;">
            <h1 style="color: white; font-size: 2.5em; letter-spacing: 8px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${otp}</h1>
            <p style="color: #e0e8ff; margin: 15px 0 0 0; font-size: 16px;">This OTP will expire in 24 hours</p>
          </div>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #555;"><strong>Security Note:</strong> If you didn't request this verification, please ignore this email and contact our support team.</p>
          </div>
          
          <div style="border-top: 2px solid #eee; padding-top: 20px; text-align: center; margin-top: 30px;">
            <p style="color: #667eea; font-weight: bold;">Best regards,<br>HealX Healthcare Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Verification OTP sent to:', user.email);

    return res.json({ success: true, message: `Verification OTP sent to your email` });
  } catch (error) {
    console.error("❌ Error in sendVerifyOtp:", error);
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

    console.log('✅ Email verified for user:', user.email);

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("❌ Error in verifyEmail:", error);
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
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          isAccountVerified: req.user.isAccountVerified
        }
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: "User is not authenticated" 
      });
    }
  } catch (error) {
    console.error("❌ Error in isAuthenticated:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Send password reset OTP
 */
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  
  console.log('📧 Password reset OTP requested for:', email);
  
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found for password reset:', email);
      return res.status(404).json({ success: false, message: "No account found with this email address" });
    }

    // Check if there's a recent reset attempt (rate limiting)
    const currentTime = Date.now();
    const lastResetTime = user.resetOtpExpireAt - (15 * 60 * 1000); // 15 minutes ago
    
    if (lastResetTime > 0 && (currentTime - lastResetTime) < 60 * 1000) { // 1 minute cooldown
      return res.status(429).json({ 
        success: false, 
        message: "Please wait before requesting another OTP" 
      });
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0;">HealX Healthcare</h1>
          </div>
          
          <h2 style="color: #d63384; text-align: center;">🔐 Password Reset Request</h2>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>You requested to reset your password for your HealX Healthcare account. Please use the following One-Time Password (OTP) to proceed:</p>
          
          <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 30px; border-radius: 15px; margin: 30px 0; text-align: center;">
            <h1 style="color: white; font-size: 2.5em; letter-spacing: 8px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${otp}</h1>
            <p style="color: #ffe6e6; margin: 15px 0 0 0; font-size: 16px;">⏰ This OTP will expire in 15 minutes</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">🛡️ Security Notice:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Your password will remain unchanged unless you complete the reset process</li>
              <li>Never share this OTP with anyone</li>
              <li>Our team will never ask for your OTP over phone or email</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Need help? Contact our support team at support@healx.com</p>
          </div>
          
          <div style="border-top: 2px solid #eee; padding-top: 20px; text-align: center;">
            <p style="color: #999; font-size: 14px;">This email was sent to ${user.email}</p>
            <p style="color: #667eea; font-weight: bold;">Best regards,<br>HealX Healthcare Security Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP sent to:', user.email);

    return res.json({ success: true, message: `Password reset OTP sent to your email` });
  } catch (error) {
    console.error("❌ Error in sendResetOtp:", error);
    return res.status(500).json({ success: false, message: "Failed to send reset OTP. Please try again." });
  }
};

/**
 * Reset user password using OTP
 */
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  console.log('🔐 Password reset attempt for:', email);
  
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  }

  // Enhanced password validation
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
    });
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found for password reset:', email);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      console.log('❌ Invalid OTP for password reset:', email);
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      console.log('❌ Expired OTP for password reset:', email);
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be different from your current password" 
      });
    }

    // Hash new password with stronger salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password in MongoDB and clear reset OTP
    const updatedUser = await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        password: hashedPassword,
        resetOtp: '',
        resetOtpExpireAt: 0,
        updatedAt: new Date()
      },
      { 
        new: true,
        select: '-password' // Don't return password in response
      }
    );

    if (!updatedUser) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update password. Please try again." 
      });
    }

    console.log('✅ Password reset successful for:', email);

    // Send confirmation email
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Password Reset Successful - HealX Healthcare',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">HealX Healthcare</h1>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: #28a745; color: white; padding: 15px; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
              </div>
            </div>
            
            <h2 style="color: #28a745; text-align: center;">Password Reset Successful!</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Your password has been successfully reset for your HealX Healthcare account.</p>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin-top: 0;">📋 What happens next:</h3>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                <li>You can now log in to your account using your new password</li>
                <li>Your previous password is no longer valid</li>
                <li>All active sessions have been logged out for security</li>
              </ul>
            </div>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0;">🚨 Important Security Notice:</h3>
              <p style="color: #721c24; margin: 0;">If you didn't make this change, please contact our support team immediately at <strong>support@healx.com</strong> or call us at <strong>+1-800-HEALX-24</strong></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Login to Your Account</a>
            </div>
            
            <div style="border-top: 2px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 14px;">This email was sent to ${user.email}</p>
              <p style="color: #667eea; font-weight: bold;">Best regards,<br>HealX Healthcare Security Team</p>
            </div>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
      console.log('✅ Password reset confirmation email sent');
    } catch (emailError) {
      console.log('⚠️ Password reset confirmation email failed:', emailError.message);
    }

    return res.json({ 
      success: true, 
      message: "Password updated successfully. You can now login with your new password." 
    });
    
  } catch (error) {
    console.error("❌ Error in resetPassword:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to reset password. Please try again." 
    });
  }
};

/**
 * Resend password reset OTP (optional - for better UX)
 */
export const resendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if there's a pending OTP request
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Prevent spam requests (wait at least 1 minute between requests)
    if (user.resetOtpExpireAt && (Date.now() - (user.resetOtpExpireAt - 15 * 60 * 1000)) < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new OTP"
      });
    }

    // Call the same function as sendResetOtp
    return await sendResetOtp(req, res);

  } catch (error) {
    console.error('❌ Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.'
    });
  }
};
