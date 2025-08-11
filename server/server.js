// server.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import UserModel from './model/userModel.js';

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
console.log('🔍 APP_SCHEME loaded:', !!process.env.APP_SCHEME);
console.log('🔍 APP_LINK_DOMAIN loaded:', !!process.env.APP_LINK_DOMAIN);

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

// Enhanced CORS Configuration for mobile support
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL,
    // Add mobile app origins
    `${process.env.APP_SCHEME || 'healx'}://`,
    'capacitor://localhost',
    'ionic://localhost'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'User-Agent']
}));

// Request logging middleware with mobile detection
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} ${isMobile ? '📱' : '💻'}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HealX Healthcare Server! 🏥",
    version: "2.0.0",
    features: ["Mobile Support", "Deep Linking", "Enhanced Subscriptions"],
    endpoints: {
      auth: "/api/auth",
      user: "/api/user", 
      chatbot: "/api/chatbot",
      subscription: "/api/subscription",
      confirmation: "/confirm-subscription"
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
    environment: process.env.NODE_ENV || 'development',
    mobile_support: true,
    deep_linking: !!process.env.APP_SCHEME
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/subscription', subscriptionRouter);

// ✅ Enhanced mobile-friendly confirmation route
app.get('/confirm-subscription', async (req, res) => {
  try {
    const { token } = req.query;
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    console.log(`📧 Subscription confirmation attempt - Mobile: ${isMobile}`);

    if (!token) {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Subscription Error</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                .error-box { background: rgba(255,255,255,0.1); backdrop-filter: blur(15px); padding: 3rem; border-radius: 20px; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>❌ Invalid Link</h1>
                <p>Missing confirmation token</p>
                <a href="${process.env.FRONTEND_URL}/profile" class="btn">Go to Profile</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=missing_token';
                }, 3000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=missing_token`;
      return res.redirect(errorUrl);
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Subscription Error</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                .error-box { background: rgba(255,255,255,0.1); backdrop-filter: blur(15px); padding: 3rem; border-radius: 20px; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>⏰ Link Expired</h1>
                <p>This confirmation link has expired or is invalid</p>
                <a href="${process.env.FRONTEND_URL}/subscription" class="btn">Subscribe Again</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_token';
                }, 4000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_token`;
      return res.redirect(errorUrl);
    }

    if (decoded.action !== 'subscribe') {
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_action`;
      return res.redirect(errorUrl);
    }

    // Find user and confirm subscription
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=user_not_found`;
      return res.redirect(errorUrl);
    }

    // Check if token matches and hasn't expired
    if (user.subscriptionToken !== token || user.subscriptionTokenExpiry < Date.now()) {
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=token_expired`;
      return res.redirect(errorUrl);
    }

    // Check if already subscribed
    if (user.isSubscribed) {
      const alreadySubscribedUrl = `${process.env.FRONTEND_URL}/profile?already_subscribed=true`;
      return res.redirect(alreadySubscribedUrl);
    }

    // Activate subscription
    user.isSubscribed = true;
    user.subscribedAt = new Date();
    user.subscriptionToken = '';
    user.subscriptionTokenExpiry = 0;
    await user.save();

    console.log('✅ User subscription confirmed via /confirm-subscription:', user.email);

    // Success redirect with mobile-specific handling
    if (isMobile) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Subscription Confirmed! 🎉</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 2rem; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); 
                color: white; 
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .success-box { 
                background: rgba(255,255,255,0.1); 
                backdrop-filter: blur(15px);
                padding: 3rem; 
                border-radius: 20px; 
                max-width: 400px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              }
              .btn { 
                background: #10b981; 
                color: white; 
                padding: 15px 30px; 
                border: none; 
                border-radius: 12px; 
                text-decoration: none; 
                display: inline-block; 
                margin: 15px 10px; 
                font-weight: bold;
                font-size: 16px;
              }
              .crown { font-size: 4rem; margin-bottom: 1rem; animation: bounce 2s infinite; }
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
              }
            </style>
          </head>
          <body>
            <div class="success-box">
              <div class="crown">👑</div>
              <h1>🎉 Subscription Confirmed!</h1>
              <p>Welcome to HealX Healthcare premium newsletter!</p>
              <p style="font-size: 14px; opacity: 0.9;">You now have subscriber benefits!</p>
              <a href="${process.env.FRONTEND_URL}/profile?subscribed=true&timestamp=${Date.now()}" class="btn">View Premium Profile</a>
            </div>
            <script>
              setTimeout(() => {
                window.location.href = '${process.env.FRONTEND_URL}/profile?subscribed=true&timestamp=${Date.now()}';
              }, 4000);
            </script>
          </body>
        </html>
      `);
    }

    // Desktop redirect
    const successUrl = `${process.env.FRONTEND_URL}/profile?subscribed=true&timestamp=${Date.now()}`;
    return res.redirect(successUrl);

  } catch (error) {
    console.error('❌ Confirm subscription error:', error);
    const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=server_error`;
    return res.redirect(errorUrl);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ Fixed 404 handler for Express v5 with mobile support
app.use('/*path', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    device: isMobile ? 'mobile' : 'desktop',
    availableRoutes: [
      '/ - Homepage',
      '/health - Health check',
      '/api/auth - Authentication routes', 
      '/api/user - User management',
      '/api/chatbot - Chatbot functionality',
      '/api/subscription - Newsletter subscription',
      '/confirm-subscription - Email confirmation (mobile-friendly)'
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
🚀 HealX Healthcare Server v2.0 Started Successfully!
📡 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Server URL: http://localhost:${PORT}
🏥 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
📱 Mobile Support: ENABLED
🔗 Deep Linking: ${process.env.APP_SCHEME || 'healx'}://

📋 Available Endpoints:
├── 🏠 Homepage: http://localhost:${PORT}/
├── 💊 Health Check: http://localhost:${PORT}/health
├── 🔐 Authentication: http://localhost:${PORT}/api/auth
├── 👤 User Management: http://localhost:${PORT}/api/user
├── 🤖 Chatbot: http://localhost:${PORT}/api/chatbot
├── 📧 Subscription API: http://localhost:${PORT}/api/subscription
└── ✉️  Email Confirmation: http://localhost:${PORT}/confirm-subscription

🔧 Subscription Features:
├── POST /api/subscription/subscribe - Subscribe with mobile detection
├── GET  /api/subscription/confirm - API confirmation endpoint
├── GET  /confirm-subscription - Mobile-friendly email confirmation
├── POST /api/subscription/unsubscribe - Unsubscribe from newsletter
└── GET  /api/subscription/status - Get subscription status

📱 Mobile Features:
├── 🔍 User-Agent Detection
├── 📱 Mobile-Optimized Confirmation Pages
├── 🔗 Deep Link Support: ${process.env.APP_SCHEME || 'healx'}://
├── 🌐 Smart Link Fallbacks
└── 📧 Enhanced Mobile Email Templates

✅ Server ready to accept connections!
  `);
});
