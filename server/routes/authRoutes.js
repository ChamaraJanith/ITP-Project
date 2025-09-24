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
} from '../controller/authController.js'; // Make sure this points to the exact file
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Add logging middleware to debug
authRouter.use((req, res, next) => {
  console.log(`🔗 Auth Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Authentication routes
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

// Email verification routes (protected)
authRouter.post('/sendverifyotp', userAuth, sendVerifyOtp);
authRouter.post('/verifyaccount', userAuth, verifyEmail);
authRouter.post('/isAuth', userAuth, isAuthenticated);

// Password reset routes (public) - These should work
authRouter.post('/sendResetOtp', (req, res, next) => {
  console.log('📧 sendResetOtp route hit');
  sendResetOtp(req, res, next);
});
authRouter.post('/resetPassword', resetPassword);
authRouter.post('/resendResetOtp', resendResetOtp);

// Log all registered routes
console.log('📋 Auth routes registered:');
console.log('POST /api/auth/register');
console.log('POST /api/auth/login');
console.log('POST /api/auth/logout');
console.log('POST /api/auth/sendverifyotp (protected)');
console.log('POST /api/auth/verifyaccount (protected)');
console.log('POST /api/auth/isAuth (protected)');
console.log('POST /api/auth/sendResetOtp');
console.log('POST /api/auth/resetPassword');
console.log('POST /api/auth/resendResetOtp');

export default authRouter;