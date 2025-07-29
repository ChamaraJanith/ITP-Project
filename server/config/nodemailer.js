// config/nodemailer.js
import nodemailer from "nodemailer";
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,     // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: process.env.SMTP_SECURE === 'true', // true if using port 465
  auth: {
    user: process.env.SMTP_USER,   // heal.x.system@gmail.com
    pass: process.env.SMTP_PASS,   // your gmail app password (no spaces)
  }
});

export default transporter;
