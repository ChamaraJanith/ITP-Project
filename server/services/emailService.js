import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    console.log('📧 Initializing EmailService...');
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📧 EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);
    console.log('📧 SMTP_PORT:', process.env.SMTP_PORT);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Missing EMAIL_USER or EMAIL_PASS in .env file');
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        debug: true,
        logger: true
      });

      console.log('✅ Email transporter created successfully');

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error.message);
        } else {
          console.log('✅ SMTP connection verified - HealX email system ready!');
        }
      });

    } catch (error) {
      console.error('❌ Failed to create transporter:', error);
      this.transporter = null;
    }
  }

  async sendTestEmail() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      const mailOptions = {
        from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
        to: 'chamarasweed44@gmail.com',
        subject: '✅ Test Email - HealX Healthcare System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">🏥 HealX Healthcare System</h2>
            <p>✅ <strong>Email test successful!</strong></p>
            <p>Your notification system is working correctly.</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p><em>This is an automated test email from HealX Smart Healthcare Management System</em></p>
          </div>
        `
      };

      console.log('📧 Sending test email to chamarasweed44@gmail.com...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw error;
    }
  }

  async sendLowStockAlert(items = []) {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      const mailOptions = {
        from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
        to: 'chamarasweed44@gmail.com',
        subject: '🚨 Low Stock Alert - HealX Healthcare System',
        html: this.generateLowStockHTML(items)
      };

      console.log('📧 Sending low stock alert to chamarasweed44@gmail.com...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Low stock alert sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send low stock alert:', error);
      throw error;
    }
  }
  // Add this method to your existing EmailService class

async sendCustomNotification(recipients, subject, htmlContent) {
  if (!this.transporter) {
    throw new Error('Email transporter not initialized');
  }

  try {
    const mailOptions = {
      from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
      to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
      subject: subject,
      html: htmlContent
    };

    console.log(`📧 Sending custom notification: ${subject}`);
    const result = await this.transporter.sendMail(mailOptions);
    console.log('✅ Custom notification sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('❌ Failed to send custom notification:', error);
    throw error;
  }
}


  generateLowStockHTML(items) {
    const itemsList = items.length > 0 ? items.map(item => `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #d32f2f; font-weight: bold;">${item.quantity}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${item.minStockLevel}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="padding: 20px; text-align: center;">No low stock items found</td></tr>';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #d32f2f; color: white; padding: 25px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">🚨 Low Stock Alert</h1>
          <p style="margin: 8px 0 0 0;">HealX Healthcare Management System</p>
        </div>
        
        <div style="background: white; padding: 25px; border: 1px solid #ddd; border-top: none;">
          <p style="margin-top: 0;">⚠️ The following items need <strong>immediate restocking</strong>:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 15px; border: 1px solid #ddd;">Item Name</th>
                <th style="padding: 15px; border: 1px solid #ddd;">Current Stock</th>
                <th style="padding: 15px; border: 1px solid #ddd;">Min Required</th>
              </tr>
            </thead>
            <tbody>${itemsList}</tbody>
          </table>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 25px;">
            <strong>🚨 Action Required:</strong> Please restock these items immediately.
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 14px;">
          Generated: ${new Date().toLocaleString()} | HealX Healthcare System
        </div>
      </div>
    `;
  }
}

export default new EmailService();
