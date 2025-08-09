// server.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST - before any other imports
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Verify environment loading
console.log('🔍 Environment file path:', path.join(__dirname, '.env'));
console.log('🔍 MONGODB_URL loaded:', !!process.env.MONGODB_URL);
console.log('🔍 SMTP_HOST loaded:', !!process.env.SMTP_HOST);

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import chatbotRouter from "./routes/chatbot.js";

const app = express();
const PORT = process.env.PORT || 7000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the server Hi hello!");
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chatbot', chatbotRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Chatbot endpoint: http://localhost:${PORT}/api/chatbot`);
});
