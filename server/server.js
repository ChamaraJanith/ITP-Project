import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Import routes
import authRouter from './routes/authRoutes.js';
import financialPayRoutes from './routes/financialPayRoutes.js';
import patrouter from './routes/pat.js';
import RestockRouter from './routes/autoRestockRoutes.js';
import RestockScheduler from './services/restockScheduler.js';
import notificationRouter from './routes/notifications.js';
import surgicalrouter from './routes/surgicalItems.js';
import consultationRouter from './routes/consultationRoutes.js';
import prescriptionRouter from './routes/prescriptionRoutes.js';
import payrollrouter from './routes/FinancialPayrollRoutes.js';  
import prescriptionNotificationRouter from './routes/prescriptionNotifications.js'
import emergencyAlertRouter from './routes/emergencyAlertRoutes.js';
import financemailrouter from './routes/emails.js';
import utilitiesrouter from './routes/FinancialUtilitiesRoutes.js';
import disposalPdfRoute from './routes/disposalPdfRoute.js';
import router from './routes/appointment.js';

// Import procurement routes
import supplierRoutes from './routes/suppliers.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import AppointmentRoutes from './routes/appointment.js';
import disrouter from './routes/disposalRoutes.js';

// ⭐ NEW: Import Google Cloud Storage Service
import GoogleCloudStorageService from './services/googleCloudStorage.js';

// Database imports
const { default: connectDB } = await import("./config/mongodb.js");
const { default: chatbotRouter } = await import("./routes/chatbot.js");
const { default: adminRouter } = await import("./routes/adminRoutes.js");
const { default: inventoryRouter } = await import("./routes/inventoryRoutes.js");

// Connect to database
connectDB();

const PORT = 7000;

// Middleware - ⭐ UPDATED: Increased limit for PDF uploads
app.use(express.json({ limit: '50mb' })); // Increased from 10mb to 50mb
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased from 10mb to 50mb
app.use(cookieParser());

// CORS configuration
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
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HealX Healthcare Server is running on port 7000',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: {
      auth: '/api/auth',
      suppliers: '/api/suppliers',
      purchase_orders: '/api/purchase-orders',
      admin_auth: '/api/admin',
      chatbot: '/api/chatbot',
      inventory: '/api/inventory',
      patients: '/api/patients',
      emergency_alerts: '/api/doctor/emergency-alerts',
      prescriptions: '/api/doctor/prescriptions' // Added
    }
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🏥 HealX Healthcare Server is running on port 7000!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    port: PORT,
    procurement: {
      suppliers: '/api/suppliers',
      orders: '/api/purchase-orders'
    }
  });
});

// Mount routes in correct order
console.log('🔐 Mounting auth router at /api/auth');
app.use('/api/auth', authRouter);

console.log('📦 Mounting surgical items router at /api/inventory/surgical');
app.use('/api/inventory/surgical', surgicalrouter);

console.log('🔄 Mounting restock router at /api/inventory/auto-restock');
app.use('/api/inventory/auto-restock', RestockRouter);

console.log('📋 Mounting inventory router at /api/inventory');
app.use('/api/inventory', inventoryRouter);

console.log('📄 Mounting disposal PDF router at /api/inventory/disposal');
app.use('/api/inventory/disposal', disposalPdfRoute);

console.log('🏢 Mounting supplier routes at /api/suppliers');
app.use('/api/suppliers', supplierRoutes);

console.log('📋 Mounting purchase order routes at /api/purchase-orders');
app.use('/api/purchase-orders', purchaseOrderRoutes);

console.log('👥 Mounting patient router at /api/patients');
app.use('/api/patients', patrouter);

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter);
app.use('/api/chatbot', chatbotRouter);
app.use("/api/payments", financialPayRoutes);
app.use("/api/prescription", consultationRouter);
app.use("/api/doctor/prescriptions", prescriptionRouter);
app.use("/api/payrolls", payrollrouter);
app.use("/api/emails", financemailrouter);
app.use('/api/financial-utilities', utilitiesrouter);
app.use('/api/appointments', router);
app.use('/api/appointments', AppointmentRoutes);
app.use('/api/disposalrecords', disrouter)

console.log('🚨 Mounting emergency alerts router at /api/doctor/emergency-alerts');
app.use('/api/doctor/emergency-alerts', emergencyAlertRouter);

console.log('📧 Mounting notification router at /api/inventory/notifications');
app.use('/api/inventory/notifications', notificationRouter);

console.log('💊 Mounting prescription notification router at /api/prescription-notifications');
app.use('/api/prescription-notifications', prescriptionNotificationRouter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// 404 handler
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/suppliers',
      'POST /api/suppliers',
      'GET /api/purchase-orders',
      'POST /api/purchase-orders',
      'GET /api/doctor/emergency-alerts',
      'POST /api/doctor/emergency-alerts',
      'GET /api/doctor/prescriptions',
      'POST /api/doctor/prescriptions'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
 
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

// Start restock scheduler
RestockScheduler.start();

// ⭐ NEW: Test Google Cloud Storage connection on startup
(async () => {
  try {
    console.log('☁️ Testing Google Cloud Storage connection...');
    const isConnected = await GoogleCloudStorageService.testConnection();
    if (isConnected) {
      console.log('✅ Google Cloud Storage is ready!');
      console.log(`📦 Bucket: ${process.env.GOOGLE_CLOUD_BUCKET_NAME}`);
    } else {
      console.warn('⚠️ Google Cloud Storage connection failed. Check your configuration.');
      console.warn('   Prescriptions will be saved but PDFs may not upload to cloud.');
    }
  } catch (error) {
    console.error('❌ Google Cloud Storage initialization error:', error.message);
    console.warn('⚠️ Server will continue but PDF uploads to cloud may fail.');
    console.warn('   Check: backend/config/google-cloud-key.json exists');
    console.warn('   Check: GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_BUCKET_NAME in .env');
  }
})();

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
  console.log('📋 Authentication Endpoints:');
  console.log(`   🔐 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   🚪 Logout: POST http://localhost:${PORT}/api/auth/logout`);
  console.log('=====================================');
  console.log('📋 Procurement & Suppliers Endpoints:');
  console.log(`   🏢 Get Suppliers: GET http://localhost:${PORT}/api/suppliers`);
  console.log(`   🏢 Create Supplier: POST http://localhost:${PORT}/api/suppliers`);
  console.log(`   📋 Get Purchase Orders: GET http://localhost:${PORT}/api/purchase-orders`);
  console.log(`   📋 Create Purchase Order: POST http://localhost:${PORT}/api/purchase-orders`);
  console.log('=====================================');
  console.log('📋 Prescription Endpoints:');
  console.log(`   💊 Get Prescriptions: GET http://localhost:${PORT}/api/doctor/prescriptions`);
  console.log(`   💊 Create Prescription: POST http://localhost:${PORT}/api/doctor/prescriptions`);
  console.log(`   💊 Download PDF: GET http://localhost:${PORT}/api/doctor/prescriptions/:id/download`);
  console.log('=====================================');
  console.log(`   💊 Health Check: GET http://localhost:${PORT}/health`);
  console.log('=====================================');
  console.log('✅ Server ready to accept connections!');
});

export default app;