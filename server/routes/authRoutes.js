import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login, logout, sendVerifyOtp, verifyEmail} from '../controller/authController.js';
import userAuth from '../middleware/userAuth.js';


const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/sendverifyotp', userAuth,sendVerifyOtp);
authRouter.post('/verifyaccount', userAuth,verifyEmail);

 export default authRouter;