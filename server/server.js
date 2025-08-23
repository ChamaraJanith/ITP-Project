import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/auth.js";
import authRouter from './routes/auth.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CRITICAL: Load environment variables FIRST - before any other imports
dotenv.config({ path: path.join(__dirname, '.env') });

// ✅ Debug environment variables IMMEDIATELY after loading
console.log('🔍 Environment Variables Debug:');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('📧 EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);
console.log('📧 SMTP_PORT:', process.env.SMTP_PORT);

// ✅ NOW import modules that depend on environment variables
import notificationRouter from './routes/notifications.js';
import surgicalrouter from './routes/surgicalItems.js';

// Database connection
const { default: connectDB } = await import("./config/mongodb.js");

// Route imports
const { default: chatbotRouter } = await import("./routes/chatbot.js");
const { default: adminRouter } = await import("./routes/adminRoutes.js");
const { default: inventoryRouter } = await import("./routes/inventoryRoutes.js");

const app = express();
const PORT = process.env.PORT || 7000;

// Connect to database
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration checked
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} 💻`);
  
  // Log request body for debugging (remove in production)
  if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    console.log('📝 Request Body:', sanitizedBody);
  }
  
  next();
});

// Health check route (before other routes)
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'HealX Healthcare Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: {
      user_auth: '/api/auth',
      admin_auth: '/api/admin',
      user_management: '/api/user',
      chatbot: '/api/chatbot',
      subscription: '/api/subscription',
      inventory: '/api/inventory'
    }
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "🏥 HealX Healthcare Server is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - Health check',
      'POST /api/admin/login - Admin login',
      'POST /api/chatbot/message - Chatbot interaction',
      'GET /api/inventory/surgical-items - Get surgical items',
      'POST /api/inventory/surgical-items - Create surgical item',
      'GET /api/inventory/dashboard-stats - Inventory stats',
      'POST /api/inventory/notifications/test-email - Test email',
      'POST /api/inventory/notifications/check-low-stock - Low stock alert'
    ]
  });
});

// ✅ CRITICAL: Mount notification routes FIRST (most specific)
console.log('📧 Mounting notification router at /api/inventory/notifications');
app.use('/api/inventory/notifications', notificationRouter);

console.log('📦 Mounting surgical items router at /api/inventory');
app.use('/api/inventory', surgicalrouter);

// Mount other inventory routes
app.use('/api/inventory', inventoryRouter);

// Mount other API routes
app.use('/api/admin', adminRouter);
app.use('/api/chatbot', chatbotRouter);
app.use("/api/auth", router);
app.use("/api/auth", authRouter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ CORRECT - Express 5 compatible


// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('💤 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('💤 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 HealX Healthcare Server Started Successfully!');
  console.log('=====================================');
  console.log(`📍 Server running on port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('=====================================');
  console.log('📋 Available Endpoints:');
  console.log(`   👤 User Login: POST http://localhost:${PORT}/api/auth/Login`);
  console.log(`   👤 User Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   👨‍💼 Admin Login: POST http://localhost:${PORT}/api/admin/login`);
  console.log(`   💊 Health Check: GET http://localhost:${PORT}/health`);
  console.log(`   🤖 Chatbot: POST http://localhost:${PORT}/api/chatbot/message`);
  console.log(`   📧 Test Email: POST http://localhost:${PORT}/api/inventory/notifications/test-email`);
  console.log(`   🚨 Low Stock Alert: POST http://localhost:${PORT}/api/inventory/notifications/check-low-stock`);
  console.log(`   📦 Surgical Items: GET http://localhost:${PORT}/api/inventory/surgical-items`);
  console.log('=====================================');
  console.log('✅ Server ready to accept connections!');
});

export default app;
