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

// Authentication routes
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

// Email verification routes (protected)
authRouter.post('/sendverifyotp', userAuth, sendVerifyOtp);
authRouter.post('/verifyaccount', userAuth, verifyEmail);
authRouter.post('/isAuth', userAuth, isAuthenticated);

// Password reset routes (public)
authRouter.post('/sendResetOtp', sendResetOtp);
authRouter.post('/resetPassword', resetPassword);
authRouter.post('/resendResetOtp', resendResetOtp); // Optional

export default authRouter;
