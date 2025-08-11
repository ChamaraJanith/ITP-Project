import express from 'express';
import {
  register,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
  resendResetOtp
} from '../controller/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Public routes
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

// Password reset routes (public)
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/resend-reset-otp', resendResetOtp);

// Protected routes (require authentication)
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.get('/verify-session', userAuth, isAuthenticated);
authRouter.get('/profile', userAuth, isAuthenticated);

// Route info endpoint
authRouter.get('/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Available authentication routes',
    routes: {
      'POST /register': 'Register new user',
      'POST /login': 'User login', 
      'POST /logout': 'User logout',
      'POST /send-reset-otp': 'Send password reset OTP',
      'POST /reset-password': 'Reset password with OTP',
      'POST /resend-reset-otp': 'Resend reset OTP',
      'POST /send-verify-otp': 'Send email verification OTP (protected)',
      'POST /verify-account': 'Verify email with OTP (protected)',
      'GET /verify-session': 'Check if user is authenticated (protected)',
      'GET /profile': 'Get user profile (protected)'
    }
  });
});

// FIXED: Express v5 compatible catch-all route
authRouter.use('/{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Authentication route ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'POST /api/auth/send-reset-otp',
      'POST /api/auth/reset-password',
      'GET /api/auth/verify-session'
    ]
  });
});

export default authRouter;
