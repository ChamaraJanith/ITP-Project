import express from 'express';
import {
  register,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword
} from '../controller/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
// Important: verify routes should use the authenticated user's ID from the middleware, not from body!
authRouter.post('/sendverifyotp', userAuth, sendVerifyOtp);
authRouter.post('/verifyaccount', userAuth, verifyEmail);
authRouter.post('/isAuth', userAuth, isAuthenticated);
authRouter.post('/sendResetOtp', sendResetOtp); // Fixed extra space typo
authRouter.post('/resetPassword', resetPassword);

export default authRouter;
