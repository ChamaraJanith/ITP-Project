import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

console.log('Testing Email Configuration:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);

// ✅ FIXED: Use createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test connection
transporter.verify().then(() => {
  console.log('✅ SMTP connection verified');
  
  // Send test email
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'chamarasweed44@gmail.com',
    subject: 'Direct Test Email from HealX',
    text: 'This is a direct test email from HealX Healthcare System'
  });
}).then((info) => {
  console.log('✅ Email sent successfully:', info.messageId);
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
