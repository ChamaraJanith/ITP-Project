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
      // ✅ FIXED: Use createTransport (not createTransporter)
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

  // ✅ NEW: Enhanced Auto-Restock Supplier Email Function
  async sendSupplierRestockOrder(item, restockQuantity, orderDetails = {}) {
    console.log(`📧 sendSupplierRestockOrder called for ${item.name}`);
    
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error.message);
      throw new Error(`Email system not ready: ${error.message}`);
    }

    try {
      const supplierEmail = item.autoRestock?.supplier?.contactEmail || item.supplier?.email;
      
      // ✅ For testing, use fallback email if supplier email is missing
      const emailToSend = supplierEmail || 'chamarasweed44@gmail.com'; // Fallback for testing
      
      console.log(`📧 Preparing supplier email for ${item.name} to ${emailToSend}`);

      const orderNumber = `ORD-${Date.now()}-${item._id.toString().slice(-6)}`;
      const estimatedCost = (parseFloat(item.price) || 0) * restockQuantity;
      const urgencyLevel = orderDetails.urgency === 'immediate' ? 'IMMEDIATE' : 'HIGH PRIORITY';
      
      const subject = `🚨 ${urgencyLevel} AUTO-RESTOCK ORDER: ${item.name} - Order #${orderNumber}`;
      
      const htmlMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #dc3545, #ff6b7a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .urgent { background: #fff3cd; border: 3px solid #ffc107; padding: 25px; margin: 20px 0; border-radius: 10px; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
            .highlight { background: #28a745; color: white; padding: 8px 15px; border-radius: 6px; font-weight: bold; display: inline-block; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .order-table th, .order-table td { padding: 15px; text-align: left; border-bottom: 1px solid #ddd; }
            .order-table th { background: #f8f9fa; font-weight: bold; }
            .action-required { background: #d1ecf1; border: 2px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🚨 ${urgencyLevel} RESTOCK ORDER</h1>
              <p style="margin: 10px 0; font-size: 18px;">HealX Healthcare Center</p>
              <p class="highlight">Order #${orderNumber}</p>
              <p style="margin: 15px 0 0 0; font-size: 16px;">Generated Every Minute by Auto-Restock System</p>
            </div>
            
            <div class="urgent">
              <h2 style="margin: 0; color: #856404; font-size: 24px;">⚠️ AUTO-GENERATED URGENT ORDER</h2>
              <p style="margin: 15px 0 0 0; font-size: 18px; font-weight: bold; color: #856404;">
                This order was automatically triggered by critically low inventory levels detected at ${new Date().toLocaleTimeString()}
              </p>
            </div>
            
            <div class="content">
              <h2 style="color: #dc3545; margin: 0 0 25px 0;">📦 CRITICAL ITEM SHORTAGE</h2>
              
              <div style="background: #f8d7da; padding: 25px; border-radius: 10px; border-left: 5px solid #dc3545; margin: 20px 0;">
                <table class="order-table">
                  <thead>
                    <tr style="background: #dc3545; color: white;">
                      <th>Item Details</th>
                      <th>Quantity Information</th>
                      <th>Cost Information</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong style="font-size: 18px; color: #dc3545;">${item.name}</strong><br>
                        <span style="color: #666;">Category: ${item.category || 'Medical Supply'}</span><br>
                        <span style="color: #666;">Item ID: ${item._id.toString().slice(-8)}</span>
                      </td>
                      <td>
                        <span style="color: #dc3545; font-weight: bold; font-size: 16px;">Current: ${item.quantity} units</span><br>
                        <span style="color: #ffc107; font-weight: bold;">Min Required: ${item.minStockLevel} units</span><br>
                        <span style="color: #28a745; font-weight: bold; font-size: 18px;">ORDER: ${restockQuantity} units</span>
                      </td>
                      <td>
                        <span style="color: #666;">Unit Price: $${(parseFloat(item.price) || 0).toFixed(2)}</span><br>
                        <strong style="font-size: 20px; color: #dc3545;">Total: $${estimatedCost.toFixed(2)}</strong><br>
                        <span style="color: #28a745; font-size: 12px;">✓ Pre-approved amount</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="background: #d4edda; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #28a745;">
                <h3 style="margin: 0 0 20px 0; color: #155724;">🏥 DELIVERY INFORMATION</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div>
                    <p style="margin: 5px 0;"><strong>Hospital:</strong> HealX Healthcare Center</p>
                    <p style="margin: 5px 0;"><strong>Department:</strong> Medical Supplies & Equipment</p>
                    <p style="margin: 5px 0;"><strong>Loading Dock:</strong> Emergency Supplies Bay</p>
                    <p style="margin: 5px 0;"><strong>Hours:</strong> 24/7 Emergency Receiving</p>
                  </div>
                  <div>
                    <p style="margin: 5px 0;"><strong>Contact:</strong> Medical Supplies Manager</p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> +1-555-MEDICAL (24hr)</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> supplies@healx-healthcare.com</p>
                    <p style="margin: 5px 0;"><strong>Required Delivery:</strong> <span style="color: #dc3545; font-weight: bold;">Within ${item.autoRestock?.supplier?.leadTimeDays || 1} Day(s)</span></p>
                  </div>
                </div>
              </div>

              <div class="action-required">
                <h3 style="margin: 0 0 20px 0; color: #0c5460; font-size: 20px;">🚨 IMMEDIATE ACTION REQUIRED</h3>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #bee5eb;">
                  <ol style="margin: 0; padding-left: 25px; line-height: 2;">
                    <li><strong style="color: #dc3545;">RESPOND WITHIN 30 MINUTES</strong> - Confirm order receipt and processing status</li>
                    <li><strong style="color: #dc3545;">PRIORITY SHIPPING REQUIRED</strong> - This is critical medical equipment for patient care</li>
                    <li><strong>Emergency Phone:</strong> +1-555-MEDICAL for immediate order processing</li>
                    <li><strong>Email Confirmation:</strong> supplies@healx-healthcare.com with tracking details</li>
                    <li><strong>Invoice Processing:</strong> Send to accounts@healx-healthcare.com for expedited payment</li>
                  </ol>
                </div>
                
                <div style="background: #721c24; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 16px; font-weight: bold;">
                    🚨 THIS IS A CRITICAL MEDICAL SUPPLY - PATIENT CARE MAY BE IMPACTED 🚨
                  </p>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                🤖 AUTOMATED SYSTEM ALERT - RESTOCK MONITORING EVERY 1 MINUTE
              </p>
              <p style="margin: 0; font-size: 14px;">
                Generated: ${new Date().toLocaleString()} | Order: ${orderNumber} | System: HealX Auto-Restock
              </p>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #ff6b7a; font-weight: bold;">
                CRITICAL MEDICAL SUPPLY ORDER - IMMEDIATE PROCESSING REQUIRED
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log('📧 Sending urgent supplier order email...');
      const result = await this.transporter.sendMail({
        from: `"HealX Healthcare Emergency System" <${process.env.EMAIL_USER}>`,
        to: emailToSend,
        cc: 'supplies@healx-healthcare.com', // Copy hospital supplies department
        subject: subject,
        html: htmlMessage,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      });

      console.log(`✅ Supplier order email sent successfully! MessageId: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        supplierEmail: emailToSend,
        orderNumber: orderNumber,
        estimatedCost: estimatedCost
      };

    } catch (error) {
      console.error('❌ Failed to send supplier email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ NEW: Send confirmation email to hospital admin
  async sendRestockConfirmationToAdmin(item, restockQuantity, supplierEmailResult) {
    console.log('📧 Sending admin confirmation for auto-restock');
    
    try {
      await this.ensureInitialized();
      
      const adminEmail = 'chamarasweed44@gmail.com';
      const subject = `✅ Auto-Restock Completed: ${item.name}`;
      
      const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 2px solid #28a745; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">✅ Auto-Restock Completed</h1>
            <p style="margin: 15px 0 0 0; font-size: 16px;">HealX Healthcare Management System</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #28a745; margin: 0 0 25px 0;">📦 Restock Operation Summary</h2>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 10px; border-left: 5px solid #28a745; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #155724;">Item Details:</h3>
              <p style="margin: 5px 0;"><strong>Item:</strong> ${item.name}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${item.category || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Previous Stock:</strong> ${item.quantity} units</p>
              <p style="margin: 5px 0;"><strong>Restocked Amount:</strong> <span style="color: #28a745; font-weight: bold;">+${restockQuantity} units</span></p>
              <p style="margin: 5px 0;"><strong>New Stock Level:</strong> <span style="color: #28a745; font-weight: bold;">${item.quantity + restockQuantity} units</span></p>
              <p style="margin: 5px 0;"><strong>Restock Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            ${supplierEmailResult.success ? `
              <div style="background: #d1ecf1; padding: 20px; border-radius: 10px; border-left: 5px solid #17a2b8; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0c5460;">📧 Supplier Notification Status</h3>
                <p style="margin: 5px 0;"><strong>✅ Order sent to supplier:</strong> ${supplierEmailResult.supplierEmail}</p>
                <p style="margin: 5px 0;"><strong>Order Number:</strong> ${supplierEmailResult.orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Estimated Cost:</strong> $${supplierEmailResult.estimatedCost.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Message ID:</strong> ${supplierEmailResult.messageId}</p>
                <p style="margin: 5px 0; color: #28a745; font-weight: bold;">✅ Supplier has been notified and should respond within 30 minutes</p>
              </div>
            ` : `
              <div style="background: #f8d7da; padding: 20px; border-radius: 10px; border-left: 5px solid #dc3545; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #721c24;">⚠️ Supplier Notification Issue</h3>
                <p style="margin: 5px 0;"><strong>❌ Could not send order to supplier:</strong> ${supplierEmailResult.error}</p>
                <p style="margin: 5px 0;"><strong>Action Required:</strong> Manual supplier contact needed</p>
                <p style="margin: 5px 0; color: #dc3545; font-weight: bold;">🚨 Please contact supplier manually for this urgent order</p>
              </div>
            `}

            <div style="background: #e2e3e5; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #383d41;">🔄 Auto-Restock Settings</h3>
              <p style="margin: 5px 0;"><strong>Method:</strong> ${item.autoRestock?.restockMethod || 'to_max'}</p>
              <p style="margin: 5px 0;"><strong>Max Stock Level:</strong> ${item.autoRestock?.maxStockLevel || 'Not set'}</p>
              <p style="margin: 5px 0;"><strong>Monitoring:</strong> Every 1 minute (automated)</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Active</span></p>
            </div>
          </div>
          
          <div style="background: #343a40; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 14px;">
              Auto-Restock System | ${new Date().toLocaleString()} | HealX Healthcare Management
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
              This system monitors inventory every minute and automatically restocks items when needed
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `HealX Healthcare System <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: subject,
        html: htmlMessage
      });

      console.log(`✅ Admin confirmation email sent for ${item.name} restock`);

    } catch (error) {
      console.error('❌ Failed to send admin confirmation:', error);
    }
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

// Create singleton instance
const emailService = new EmailService();

// ✅ UTILITY FUNCTIONS - These work with the singleton instance
export async function sendCriticalStockAlert(criticalItems) {
  try {
    await emailService.ensureInitialized();
    
    const subject = `🚨 CRITICAL STOCK ALERT - Immediate Action Required`;
    
    const itemsList = criticalItems.map(item => 
      `• ${item.item} - Current: ${item.currentStock}, Min: ${item.minLevel}, Supplier: ${item.supplier}`
    ).join('\n');

    const html = `
      <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px;">
        <h2 style="color: #856404;">🚨 CRITICAL STOCK ALERT</h2>
        <p><strong>The following items have reached critically low stock levels:</strong></p>
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 4px;">
          <pre style="font-family: Arial, sans-serif; margin: 0;">${itemsList}</pre>
        </div>
        <p style="color: #721c24; font-weight: bold;">
          ⚠️ Immediate action required to prevent stockouts!
        </p>
        <p>Please review and approve restock orders immediately.</p>
      </div>
    `;

    const mailOptions = {
      from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
      to: ['admin@hospital.com', 'inventory@hospital.com', 'chamarasweed44@gmail.com'],
      subject: subject,
      html: html
    };

    const result = await emailService.transporter.sendMail(mailOptions);
    console.log('📧 Critical stock alert sent successfully!');
    return result;
  } catch (error) {
    console.error('❌ Error sending critical stock alert:', error);
    throw error;
  }
}

export async function sendRestockSummary(items) {
  try {
    await emailService.ensureInitialized();
    
    const subject = `📦 Daily Inventory Restock Summary - ${new Date().toLocaleDateString()}`;
    
    const itemsList = items.map(item => 
      `• ${item.item} (${item.urgency}) - Current: ${item.currentStock}, Reorder: ${item.reorderQuantity}`
    ).join('\n');

    const html = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #495057;">📦 Restock Summary</h2>
        <p>The following items need restocking:</p>
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 4px;">
          <pre style="font-family: Arial, sans-serif; margin: 0;">${itemsList}</pre>
        </div>
        <p>Total items requiring restock: <strong>${items.length}</strong></p>
        <p>Please review the restock orders in the admin dashboard.</p>
      </div>
    `;

    const mailOptions = {
      from: `HealX Healthcare <${process.env.EMAIL_USER}>`,
      to: ['procurement@hospital.com', 'chamarasweed44@gmail.com'],
      subject: subject,
      html: html
    };

    const result = await emailService.transporter.sendMail(mailOptions);
    console.log('📧 Restock summary sent successfully!');
    return result;
  } catch (error) {
    console.error('❌ Error sending restock summary:', error);
    throw error;
  }
}

// ✅ DEFAULT EXPORT - The singleton instance
export default emailService;
