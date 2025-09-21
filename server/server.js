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

// Import your existing routes
import router from './routes/inventoryRoutes.js';
import authRouter from './routes/auth.js';
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




// ✅ NEW: Import procurement routes
import supplierRoutes from './routes/suppliers.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';

// Database imports
const { default: connectDB } = await import("./config/mongodb.js");
const { default: chatbotRouter } = await import("./routes/chatbot.js");
const { default: adminRouter } = await import("./routes/adminRoutes.js");
const { default: inventoryRouter } = await import("./routes/inventoryRoutes.js");

// Connect to database
connectDB();

const PORT = 7000; // ✅ Set to port 7000

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration for port 7000
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
      suppliers: '/api/suppliers',
      purchase_orders: '/api/purchase-orders',
      admin_auth: '/api/admin',
      chatbot: '/api/chatbot',
      inventory: '/api/inventory',
      patients: '/api/patients'
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

// Mount the prescription notification router at a unique path
console.log('📧 Mounting prescription notification router at /api/prescription-notifications');
app.use('/api/prescription-notifications', prescriptionNotificationRouter);


// Mount notification routes FIRST
console.log('📧 Mounting notification router at /api/inventory/notifications');
app.use('/api/inventory/notifications', notificationRouter);

console.log('📦 Mounting surgical items router at /api/inventory');
app.use('/api/inventory', surgicalrouter);
app.use('/api/restock-orders', RestockRouter);
app.use('/api/inventory/auto-restock', RestockRouter);
app.use('/api/inventory', inventoryRouter);

// ✅ NEW: Mount supplier and purchase order routes
console.log('🏢 Mounting supplier routes at /api/suppliers');
app.use('/api/suppliers', supplierRoutes);
console.log('📋 Mounting purchase order routes at /api/purchase-orders');
app.use('/api/purchase-orders', purchaseOrderRoutes);

// Mount patient routes
console.log('👥 Mounting patient router at /api/patients');
app.use('/api/patients', patrouter);

// Mount other API routes
app.use('/api/admin', adminRouter);
app.use('/api/chatbot', chatbotRouter);
app.use("/api/auth", router);
app.use("/api/auth", authRouter);
app.use("/api/payments", financialPayRoutes);
app.use("/api/prescription", consultationRouter);
app.use("/api/doctor/prescriptions", prescriptionRouter);
app.use("/api/payrolls", payrollrouter);
app.use("/api/emails", financemailrouter);

console.log('🚨 Mounting emergency alerts router at /api/doctor/emergency-alerts');
app.use('/api/doctor/emergency-alerts', emergencyAlertRouter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// 404 handler - MUST be after all routes
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/suppliers',
      'POST /api/suppliers',
      'PUT /api/suppliers/:id',
      'DELETE /api/suppliers/:id',
      'GET /api/purchase-orders',
      'POST /api/purchase-orders'
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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('💤 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('💤 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server on port 7000
app.listen(PORT, () => {
  console.log('🚀 HealX Healthcare Server Started Successfully!');
  console.log('=====================================');
  console.log(`📍 Server running on port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log('=====================================');
  console.log('📋 Procurement & Suppliers Endpoints:');
  console.log(`   🏢 Get Suppliers: GET http://localhost:${PORT}/api/suppliers`);
  console.log(`   🏢 Create Supplier: POST http://localhost:${PORT}/api/suppliers`);
  console.log(`   🏢 Update Supplier: PUT http://localhost:${PORT}/api/suppliers/:id`);
  console.log(`   🏢 Delete Supplier: DELETE http://localhost:${PORT}/api/suppliers/:id`);
  console.log(`   📋 Get Purchase Orders: GET http://localhost:${PORT}/api/purchase-orders`);
  console.log(`   📋 Create Purchase Order: POST http://localhost:${PORT}/api/purchase-orders`);
  console.log(`   💊 Health Check: GET http://localhost:${PORT}/health`);
  console.log('=====================================');
  console.log('✅ Server ready to accept connections!');
});

export default app;
