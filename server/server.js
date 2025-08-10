// server.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug environment loading
console.log('🔍 Environment file path:', path.join(__dirname, '.env'));
console.log('🔍 MONGODB_URL loaded:', !!process.env.MONGODB_URL);
console.log('🔍 SMTP_HOST loaded:', !!process.env.SMTP_HOST);
console.log('🔍 JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('🔍 SENDER_EMAIL loaded:', !!process.env.SENDER_EMAIL);
console.log('🔍 FRONTEND_URL loaded:', !!process.env.FRONTEND_URL);

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Database connection
let connectDB;
try {
  const dbModule = await import("./config/mongodb.js");
  connectDB = dbModule.default;
  console.log('✅ Database module loaded successfully');
} catch (error) {
  console.error('❌ Error loading database module:', error.message);
  process.exit(1);
}

// Route imports with error handling
let authRouter, userRouter, chatbotRouter, subscriptionRouter;

try {
  console.log('📁 Loading route modules...');
  
  const authModule = await import("./routes/authRoutes.js");
  authRouter = authModule.default;
  console.log('✅ Auth routes loaded');
  
  const userModule = await import("./routes/userRoutes.js");
  userRouter = userModule.default;
  console.log('✅ User routes loaded');
  
  const chatbotModule = await import("./routes/chatbot.js");
  chatbotRouter = chatbotModule.default;
  console.log('✅ Chatbot routes loaded');
  
  const subscriptionModule = await import("./routes/subscriptionRoutes.js");
  subscriptionRouter = subscriptionModule.default;
  console.log('✅ Subscription routes loaded');
  
} catch (error) {
  console.error('❌ Error loading route modules:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 7000;

// Connect to database
try {
  connectDB();
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration - FIXED: Only one CORS config needed
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HealX Healthcare Server! 🏥",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      user: "/api/user", 
      chatbot: "/api/chatbot",
      subscription: "/api/subscription"
    },
    status: "Server is running successfully ✅"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes with error handling
try {
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/chatbot', chatbotRouter);
  app.use('/api/subscription', subscriptionRouter);
  console.log('✅ All routes mounted successfully');
} catch (error) {
  console.error('❌ Error mounting routes:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Fixed 404 handler - Express v5 compatible syntax
app.use('/*path', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/ - Homepage',
      '/health - Health check',
      '/api/auth - Authentication routes',
      '/api/user - User management',
      '/api/chatbot - Chatbot functionality', 
      '/api/subscription - Newsletter subscription'
    ],
    suggestion: 'Please check the URL and try again'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 HealX Healthcare Server Started Successfully!
📡 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Server URL: http://localhost:${PORT}
🏥 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

📋 Available Endpoints:
├── 🏠 Homepage: http://localhost:${PORT}/
├── 💊 Health Check: http://localhost:${PORT}/health
├── 🔐 Authentication: http://localhost:${PORT}/api/auth
├── 👤 User Management: http://localhost:${PORT}/api/user
├── 🤖 Chatbot: http://localhost:${PORT}/api/chatbot
└── 📧 Subscription: http://localhost:${PORT}/api/subscription

🔧 Subscription Endpoints:
├── POST /api/subscription/subscribe - Subscribe to newsletter
├── GET  /api/subscription/confirm - Confirm subscription via email
├── POST /api/subscription/unsubscribe - Unsubscribe from newsletter
└── GET  /api/subscription/status - Get subscription status

✅ Server ready to accept connections!
  `);
});

export default app;