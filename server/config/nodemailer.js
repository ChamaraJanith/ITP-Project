// config/nodemailer.js
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';  
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });
// Ensure environment variables are loaded
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('SMTP configuration is missing in environment variables');
} 


// Environment variables are already loaded in server.js, no need to load again

// Debug: Log SMTP environment variables
console.log('🔍 SMTP Environment Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'MISSING');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'MISSING');
console.log('SMTP_USER:', process.env.SMTP_USER || 'MISSING');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***FOUND***' : 'MISSING');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service for simplicity
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test SMTP connection
const testSMTPConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to send emails');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
  }
};

// Test connection when module loads
testSMTPConnection();

export default transporter;
