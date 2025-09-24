import nodemailer from "nodemailer";
import 'dotenv/config';

// Debug: Log SMTP environment variables (without exposing sensitive data)
console.log('🔍 SMTP Environment Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? '***SET***' : 'MISSING');
console.log('SMTP_PORT:', process.env.SMTP_PORT ? '***SET***' : 'MISSING');
console.log('SMTP_USER:', process.env.SMTP_USER ? '***SET***' : 'MISSING');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'MISSING');

// Create transporter function with fallback for development
const createTransporter = async () => {
  // Check if required environment variables are set
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP configuration incomplete, using test email service for development');
    
    // Create Ethereal test account for development
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('✅ Created Ethereal test account:');
      console.log('   - User:', testAccount.user);
      console.log('   - URL: https://ethereal.email/login');
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.error('❌ Failed to create Ethereal account:', error);
      throw new Error('Failed to create test email account');
    }
  }

  // Create real transporter with environment variables
  const transporterConfig = {
    service: 'gmail', // Using Gmail service
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  };

  // Add port if specified
  if (process.env.SMTP_PORT) {
    transporterConfig.port = parseInt(process.env.SMTP_PORT);
  }

  // Add host if specified (overrides service)
  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.gmail.com') {
    transporterConfig.host = process.env.SMTP_HOST;
    delete transporterConfig.service;
  }

  return nodemailer.createTransport(transporterConfig);
};

// Create and verify transporter
let transporter;

// Initialize transporter
const initializeTransporter = async () => {
  try {
    transporter = await createTransporter();
    
    // Test the connection
    await transporter.verify();
    console.log('✅ Email transporter is ready to send messages');
    
    // If using Ethereal, show the URL to view emails
    if (transporter.options.host === 'smtp.ethereal.email') {
      console.log('📧 Ethereal URL: https://ethereal.email/messages');
    }
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error.message);
    
    // In production, we want to fail hard
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Email service initialization failed: ${error.message}`);
    }
    
    // In development, create a dummy transporter that just logs to console
    console.warn('⚠️ Using dummy email transporter for development');
    transporter = {
      sendMail: async (options) => {
        console.log('📧 DUMMY EMAIL (not sent):');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Text:', options.text?.substring(0, 100) + '...');
        return { messageId: 'dummy-message-id' };
      }
    };
  }
};

// Initialize immediately
initializeTransporter();

export default transporter;