import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    console.log('📧 EmailService constructor called');
    this.transporter = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    console.log('📧 Starting EmailService initialization...');
    
    // Check environment variables
    const requiredVars = {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT
    };

    console.log('📧 Environment variables check:');
    Object.entries(requiredVars).forEach(([key, value]) => {
      if (key === 'EMAIL_PASS') {
        console.log(`   ${key}:`, value ? '***PROVIDED***' : '❌ MISSING');
      } else {
        console.log(`   ${key}:`, value || '❌ MISSING');
      }
    });

    // Validate all required variables exist
    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const error = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error('❌', error);
      throw new Error(error);
    }

    try {
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // true for 465, false for other ports like 587
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        debug: process.env.NODE_ENV === 'development',
        logger: process.env.NODE_ENV === 'development'
      });

      console.log('✅ Transporter created, verifying connection...');

      // Verify connection
      await this.transporter.verify();
      
      console.log('✅ SMTP connection verified - EmailService ready!');
      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ EmailService initialization failed:', error.message);
      this.transporter = null;
      this.initialized = false;
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      console.log('📧 EmailService not initialized, initializing now...');
      await this.initialize();
    }
    
    if (!this.transporter) {
      throw new Error('EmailService failed to initialize. Check environment variables and SMTP configuration.');
    }
  }

  async sendTestEmail() {
    console.log('📧 sendTestEmail called');
    
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error.message);
      throw new Error(`Email system not ready: ${error.message}`);
    }

    try {
      const mailOptions = {
        from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
        to: 'chamarasweed44@gmail.com',
        subject: '✅ Test Email - HealX Healthcare System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #4CAF50; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px;">🏥 HealX Healthcare</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Smart Healthcare Management System</p>
            </div>
            
            <div style="padding: 20px;">
              <h2 style="color: #4CAF50; text-align: center;">✅ Email Test Successful!</h2>
              <p style="font-size: 16px; line-height: 1.6; text-align: center;">
                Your HealX notification system is working correctly and ready to send alerts.
              </p>
              
              <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <h3 style="margin: 0 0 10px 0; color: #333;">📧 Test Details:</h3>
                <p style="margin: 5px 0;"><strong>Recipient:</strong> chamarasweed44@gmail.com</p>
                <p style="margin: 5px 0;"><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> Delivered Successfully</p>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                This is an automated test email from your HealX Smart Healthcare Management System.
              </p>
            </div>
          </div>
        `
      };

      console.log('📧 Sending test email to chamarasweed44@gmail.com...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully! MessageId:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw new Error(`Failed to send test email: ${error.message}`);
    }
  }

  async sendLowStockAlert(items = []) {
    console.log('📧 sendLowStockAlert called');
    
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error.message);
      throw new Error(`Email system not ready: ${error.message}`);
    }

    try {
      const itemsHtml = items.length > 0 ? items.map(item => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; font-weight: 500;">${item.name}</td>
          <td style="padding: 12px; text-align: center; color: #d32f2f; font-weight: bold; background: #ffebee;">${item.quantity}</td>
          <td style="padding: 12px; text-align: center;">${item.minStockLevel}</td>
        </tr>
      `).join('') : `
        <tr>
          <td colspan="3" style="padding: 30px; text-align: center; color: #666;">
            No low stock items found at this time.
          </td>
        </tr>`;

      const mailOptions = {
        from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
        to: 'chamarasweed44@gmail.com',
        subject: '🚨 URGENT: Low Stock Alert - HealX Healthcare System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 2px solid #d32f2f; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #d32f2f, #c62828); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px;">🚨 URGENT ALERT</h1>
              <h2 style="margin: 15px 0 5px 0; font-size: 22px;">Low Stock Items Detected</h2>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">HealX Healthcare Management System</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background: #fff3cd; padding: 25px; border-radius: 8px; border-left: 5px solid #ffc107; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ IMMEDIATE ACTION REQUIRED</h3>
                <p style="margin: 0; color: #856404; font-size: 16px; font-weight: 500;">
                  The following surgical items are running critically low and need immediate restocking:
                </p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 25px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white;">
                    <th style="padding: 15px; text-align: left; font-size: 16px;">Item Name</th>
                    <th style="padding: 15px; text-align: center; font-size: 16px;">Current Stock</th>
                    <th style="padding: 15px; text-align: center; font-size: 16px;">Minimum Required</th>
                  </tr>
                </thead>
                <tbody style="background: white;">
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="background: #e3f2fd; padding: 25px; border-radius: 8px; border-left: 5px solid #2196f3; margin-top: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1976d2;">📋 Recommended Actions</h3>
                <ul style="margin: 0; color: #1976d2; line-height: 1.8; font-size: 15px;">
                  <li><strong>Contact suppliers immediately</strong> for emergency restocking</li>
                  <li><strong>Review upcoming surgical schedules</strong> that may be affected</li>
                  <li><strong>Check alternative suppliers</strong> if primary vendors are unavailable</li>
                  <li><strong>Update inventory thresholds</strong> to prevent future shortages</li>
                </ul>
              </div>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Alert Generated:</strong> ${new Date().toLocaleString()} | 
                <strong>HealX Healthcare System</strong>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                This is an automated critical alert from your inventory management system
              </p>
            </div>
          </div>
        `
      };

      console.log(`📧 Sending low stock alert for ${items.length} items to chamarasweed44@gmail.com...`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Low stock alert sent successfully! MessageId:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send low stock alert:', error);
      throw new Error(`Failed to send low stock alert: ${error.message}`);
    }
  }

  // Method to check if service is ready
  isReady() {
    return this.initialized && this.transporter !== null;
  }

  // Method to get service status
  getStatus() {
    return {
      initialized: this.initialized,
      transporterExists: !!this.transporter,
      environmentVariablesPresent: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    };
  }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;
