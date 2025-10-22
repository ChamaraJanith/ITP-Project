// routes/authRoutes.js
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

// Logging middleware
authRouter.use((req, res, next) => {
  console.log(`🔗 Auth Route: ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// ==================== PUBLIC ROUTES ====================
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

// ==================== PROTECTED ROUTES ====================
authRouter.post('/sendverifyotp', userAuth, sendVerifyOtp);
authRouter.post('/verifyaccount', userAuth, verifyEmail);
authRouter.post('/isAuth', userAuth, isAuthenticated);

// ==================== PASSWORD RESET ROUTES ====================
authRouter.post('/sendResetOtp', sendResetOtp);
authRouter.post('/resetPassword', resetPassword);
authRouter.post('/resendResetOtp', resendResetOtp);

console.log('✅ Auth routes configured');

export default authRouter;
