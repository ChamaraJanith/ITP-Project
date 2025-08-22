import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    console.log('📧 EmailService constructor called');
    this.transporter = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    console.log('📧 Starting EmailService initialization...');
    
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

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const error = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error('❌', error);
      throw new Error(error);
    }

    try {
      // ✅ FIXED: Changed from createTransporter to createTransport
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
    console.log('📧 sendLowStockAlert called with', items.length, 'items');
    
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error.message);
      throw new Error(`Email system not ready: ${error.message}`);
    }

    try {
      if (items.length === 0) {
        return await this.sendNoLowStockEmail();
      }

      const isSingleItemAlert = items.length === 1;
      const alertTitle = isSingleItemAlert ? 
        `🚨 URGENT: ${items[0].name} - Stock Alert` : 
        `🚨 URGENT: Low Stock Alert - ${items.length} Items`;

      const itemsHtml = items.map(item => {
        const statusColor = item.quantity === 0 ? '#d32f2f' : '#ff9800';
        const statusBg = item.quantity === 0 ? '#ffebee' : '#fff3e0';
        const statusText = item.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK';
        
        return `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 12px; font-weight: 500;">${item.name}</td>
            <td style="padding: 12px; text-align: center; color: ${statusColor}; font-weight: bold; background: ${statusBg};">${item.quantity}</td>
            <td style="padding: 12px; text-align: center;">${item.minStockLevel || 0}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                ${statusText}
              </span>
            </td>
            <td style="padding: 12px; text-align: center; font-size: 12px; color: #666;">${item.category || 'N/A'}</td>
          </tr>
        `;
      }).join('');

      const mailOptions = {
        from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
        to: 'chamarasweed44@gmail.com',
        subject: alertTitle,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; border: 2px solid #d32f2f; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #d32f2f, #c62828); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px;">🚨 ${isSingleItemAlert ? 'ITEM ALERT' : 'STOCK ALERT'}</h1>
              <h2 style="margin: 15px 0 5px 0; font-size: 22px;">${isSingleItemAlert ? items[0].name + ' Needs' : 'Multiple Items Need'} Attention</h2>
              <p style="margin: 0; opacity: 0.9; font-size: 16px;">HealX Healthcare Management System</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="background: #fff3cd; padding: 25px; border-radius: 8px; border-left: 5px solid #ffc107; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #856404;">⚠️ IMMEDIATE ACTION REQUIRED</h3>
                <p style="margin: 0; color: #856404; font-size: 16px; font-weight: 500;">
                  ${isSingleItemAlert ? 
                    'The following surgical item needs immediate attention:' :
                    'The following surgical items are running critically low and need immediate restocking:'
                  }
                </p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin: 25px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white;">
                    <th style="padding: 15px; text-align: left; font-size: 16px;">Item Name</th>
                    <th style="padding: 15px; text-align: center; font-size: 16px;">Current Stock</th>
                    <th style="padding: 15px; text-align: center; font-size: 16px;">Min Required</th>
                    <th style="padding: 15px; text-align: center; font-size: 16px;">Status</th>
                    <th style="padding: 15px; text-align: center; font-size: 16px;">Category</th>
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
                <strong>Alert Type:</strong> ${isSingleItemAlert ? 'Individual Item' : 'Bulk Alert'} |
                <strong>HealX Healthcare System</strong>
              </p>
            </div>
          </div>
        `
      };

      console.log(`📧 Sending ${isSingleItemAlert ? 'individual' : 'bulk'} alert for ${items.length} item(s)...`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Alert sent successfully! MessageId:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send stock alert:', error);
      throw new Error(`Failed to send stock alert: ${error.message}`);
    }
  }

  async sendNoLowStockEmail() {
    const mailOptions = {
      from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
      to: 'chamarasweed44@gmail.com',
      subject: '✅ Inventory Status: All Items Well Stocked',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #4CAF50; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ All Clear!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">No Low Stock Items Found</p>
          </div>
          <div style="padding: 25px; text-align: center;">
            <h2 style="color: #4CAF50;">🎉 Great News!</h2>
            <p style="font-size: 16px;">All surgical items are currently well-stocked.</p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Checked at: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log('✅ No low stock alert sent! MessageId:', result.messageId);
    return result;
  }

  isReady() {
    return this.initialized && this.transporter !== null;
  }

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
