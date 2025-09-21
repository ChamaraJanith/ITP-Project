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
  this.transporter = nodemailer.createTransport({  // ← Fixed: removed 'r'
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
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

  // ✅ EXISTING: Send prescription PDF to patient
  async sendPrescriptionToPatient(prescriptionData, pdfBuffer, isUpdate = false) {
    console.log('📧 sendPrescriptionToPatient called for:', prescriptionData.patientEmail);
    
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error.message);
      throw new Error(`Email system not ready: ${error.message}`);
    }

    if (!prescriptionData.patientEmail) {
      throw new Error('Patient email is required to send prescription');
    }

    try {
      const prescriptionId = prescriptionData._id || `RX-${Date.now().toString(36).toUpperCase()}`;
      const patientName = prescriptionData.patientName || 
        `${prescriptionData.patient?.firstName || ''} ${prescriptionData.patient?.lastName || ''}`.trim() || 'Patient';
      
      const doctorName = prescriptionData.doctorName || prescriptionData.doctor?.name || 'Doctor';
      const doctorSpec = prescriptionData.doctorSpecialization || prescriptionData.doctor?.specialization || '';
      
      const prescriptionDate = new Date(prescriptionData.date || Date.now()).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const subject = isUpdate ? 
        `📋 Updated Prescription - ${patientName} | HealX Healthcare` :
        `📋 Your Prescription from HealX Healthcare - ${prescriptionDate}`;

      const medicinesList = (prescriptionData.medicines || []).map((med, index) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px; font-weight: 500; color: #2c3e50;">${index + 1}</td>
          <td style="padding: 12px; font-weight: 600; color: #34495e;">${med.name || 'N/A'}</td>
          <td style="padding: 12px; color: #7f8c8d;">${med.dosage || 'N/A'}</td>
          <td style="padding: 12px; color: #7f8c8d;">${med.frequency || 'N/A'}</td>
          <td style="padding: 12px; color: #7f8c8d;">${med.duration || 'N/A'}</td>
          <td style="padding: 12px; color: #95a5a6; font-size: 12px;">${med.notes || '-'}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Prescription - HealX Healthcare</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
          <div style="max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">HealX Healthcare Center</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">${isUpdate ? 'Updated Prescription' : 'Your Prescription'}</p>
              <div style="margin-top: 20px; padding: 10px 20px; background: rgba(255,255,255,0.2); border-radius: 25px; display: inline-block;">
                <span style="font-size: 14px; font-weight: 500;">ID: ${prescriptionId}</span>
              </div>
            </div>

            <!-- Patient Info Section -->
            <div style="padding: 30px;">
              ${isUpdate ? `
                <div style="background: linear-gradient(135deg, #ffeaa7, #fab1a0); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                  <h2 style="margin: 0 0 10px 0; color: #e17055; font-size: 24px;">📋 Prescription Updated</h2>
                  <p style="margin: 0; color: #636e72; font-size: 16px;">Your prescription has been updated with new information. Please review the changes below.</p>
                </div>
              ` : `
                <div style="background: linear-gradient(135deg, #a8edea, #fed6e3); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                  <h2 style="margin: 0 0 10px 0; color: #2d3436; font-size: 24px;">📋 New Prescription</h2>
                  <p style="margin: 0; color: #636e72; font-size: 16px;">Your doctor has prescribed new medication for you. Please review the details below.</p>
                </div>
              `}

              <!-- Patient Details -->
              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; border-left: 5px solid #667eea; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">👤 Patient Information</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                  <div>
                    <p style="margin: 0 0 5px 0; font-weight: 600; color: #34495e;">Full Name:</p>
                    <p style="margin: 0; color: #7f8c8d;">${patientName}</p>
                  </div>
                  <div>
                    <p style="margin: 0 0 5px 0; font-weight: 600; color: #34495e;">Email:</p>
                    <p style="margin: 0; color: #7f8c8d;">${prescriptionData.patientEmail}</p>
                  </div>
                  <div>
                    <p style="margin: 0 0 5px 0; font-weight: 600; color: #34495e;">Date:</p>
                    <p style="margin: 0; color: #7f8c8d;">${prescriptionDate}</p>
                  </div>
                  <div>
                    <p style="margin: 0 0 5px 0; font-weight: 600; color: #34495e;">Doctor:</p>
                    <p style="margin: 0; color: #7f8c8d;">${doctorName}${doctorSpec ? ` (${doctorSpec})` : ''}</p>
                  </div>
                </div>
              </div>

              <!-- Diagnosis -->
              <div style="background: #e8f4f8; padding: 25px; border-radius: 12px; border-left: 5px solid #3498db; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 20px;">🔬 Diagnosis</h3>
                <p style="margin: 0; color: #34495e; font-size: 16px; line-height: 1.6;">${prescriptionData.diagnosis || 'No diagnosis provided'}</p>
              </div>

              <!-- Medications Table -->
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #00b894, #55a3ff); padding: 20px;">
                  <h3 style="margin: 0; color: white; font-size: 22px;">💊 Prescribed Medications</h3>
                </div>
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background: #f1f2f6; border-bottom: 2px solid #ddd;">
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50;">#</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50;">Medicine Name</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50;">Dosage</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50;">Frequency</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50;">Duration</th>
                        <th style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50;">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${medicinesList || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #95a5a6;">No medications prescribed</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Additional Instructions -->
              ${prescriptionData.notes ? `
                <div style="background: #fff2e6; padding: 25px; border-radius: 12px; border-left: 5px solid #f39c12; margin-bottom: 30px;">
                  <h3 style="margin: 0 0 15px 0; color: #e67e22; font-size: 20px;">📝 Additional Instructions</h3>
                  <p style="margin: 0; color: #d35400; font-size: 16px; line-height: 1.6;">${prescriptionData.notes}</p>
                </div>
              ` : ''}

              <!-- Important Information -->
              <div style="background: #ffe6e6; padding: 25px; border-radius: 12px; border-left: 5px solid #e74c3c; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #c0392b; font-size: 20px;">⚠️ Important Information</h3>
                <ul style="margin: 0; color: #c0392b; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Take medications exactly as prescribed</strong> by your doctor</li>
                  <li><strong>Do not skip doses</strong> or stop medication without consulting your doctor</li>
                  <li><strong>Contact your doctor</strong> if you experience any side effects</li>
                  <li><strong>Keep all follow-up appointments</strong> as scheduled</li>
                  <li><strong>Store medications</strong> in a cool, dry place away from children</li>
                  <li><strong>Bring this prescription</strong> to your pharmacy for filling</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="background: #e8f8f5; padding: 25px; border-radius: 12px; border-left: 5px solid #27ae60; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #229954; font-size: 20px;">📞 Contact Information</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                  <div>
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #27ae60;">HealX Healthcare Center</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">📍 123 Medical Avenue, Health City</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">📞 Phone: (123) 456-7890</p>
                    <p style="margin: 0; color: #2e7d5b;">📧 Email: contact@healx.com</p>
                  </div>
                  <div>
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #27ae60;">Emergency Contact</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">🚨 Emergency: (123) 456-7911</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">⏰ 24/7 Helpline: (123) 456-7900</p>
                    <p style="margin: 0; color: #2e7d5b;">💬 Text Support: (123) 456-7899</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 30px; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Thank you for choosing HealX Healthcare</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.9;">
                Your health is our priority. We're here to support your journey to wellness.
              </p>
              <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                  This is an automated email from HealX Healthcare Management System.<br>
                  Generated on ${new Date().toLocaleString()} | Prescription ID: ${prescriptionId}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create filename
      const safePatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date(prescriptionData.date || Date.now()).toISOString().slice(0, 10);
      const filename = `Prescription_${safePatientName}_${dateStr}_${prescriptionId}.pdf`;

      const mailOptions = {
        from: `"HealX Healthcare Center" <${process.env.EMAIL_USER}>`,
        to: prescriptionData.patientEmail,
        subject: subject,
        html: htmlContent,
        attachments: [
          {
            filename: filename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ],
        textEncoding: 'base64',
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      };

      console.log('📧 Sending prescription email to:', prescriptionData.patientEmail);
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Prescription email sent successfully! MessageId:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: prescriptionData.patientEmail,
        filename: filename,
        isUpdate: isUpdate
      };

    } catch (error) {
      console.error('❌ Failed to send prescription email:', error);
      throw new Error(`Failed to send prescription email: ${error.message}`);
    }
  }

  // ✅ EXISTING: All other existing methods remain unchanged...
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
        `,
        textEncoding: 'base64',
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
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

  // ✅ EXISTING: Low stock alert method (unchanged)
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
        `,
        textEncoding: 'base64',
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
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

  // ✅ EXISTING: All other methods remain unchanged (sendNoLowStockEmail, sendSupplierRestockOrder, etc.)
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
      `,
      textEncoding: 'base64',
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log('✅ No low stock alert sent! MessageId:', result.messageId);
    return result;
  }

  // ✅ EXISTING: Supplier restock methods (unchanged)
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
      const emailToSend = supplierEmail || 'chamarasweed44@gmail.com';
      
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
                        <span style="color: #666;">Unit Price: ${(parseFloat(item.price) || 0).toFixed(2)}</span><br>
                        <strong style="font-size: 20px; color: #dc3545;">Total: ${estimatedCost.toFixed(2)}</strong><br>
                        <span style="color: #28a745; font-size: 12px;">✓ Pre-approved amount</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="background: #d4edda; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #28a745;">
                <h3 style="margin: 0 0 20px 0; color: #155724;">🏥 DELIVERY INFORMATION</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 50%; padding: 0 10px 0 0; vertical-align: top;">
                      <p style="margin: 5px 0;"><strong>Hospital:</strong> HealX Healthcare Center</p>
                      <p style="margin: 5px 0;"><strong>Department:</strong> Medical Supplies & Equipment</p>
                      <p style="margin: 5px 0;"><strong>Loading Dock:</strong> Emergency Supplies Bay</p>
                      <p style="margin: 5px 0;"><strong>Hours:</strong> 24/7 Emergency Receiving</p>
                    </td>
                    <td style="width: 50%; padding: 0 0 0 10px; vertical-align: top;">
                      <p style="margin: 5px 0;"><strong>Contact:</strong> Medical Supplies Manager</p>
                      <p style="margin: 5px 0;"><strong>Phone:</strong> +1-555-MEDICAL (24hr)</p>
                      <p style="margin: 5px 0;"><strong>Email:</strong> supplies@healx-healthcare.com</p>
                      <p style="margin: 5px 0;"><strong>Required Delivery:</strong> <span style="color: #dc3545; font-weight: bold;">Within ${item.autoRestock?.supplier?.leadTimeDays || 1} Day(s)</span></p>
                    </td>
                  </tr>
                </table>
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
        cc: 'supplies@healx-healthcare.com',
        subject: subject,
        html: htmlMessage,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'Content-Type': 'text/html; charset=utf-8'
        },
        textEncoding: 'base64'
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

  // ✅ EXISTING: Admin confirmation method (unchanged)
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
                <p style="margin: 5px 0;"><strong>Estimated Cost:</strong> ${supplierEmailResult.estimatedCost.toFixed(2)}</p>
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
        html: htmlMessage,
        textEncoding: 'base64',
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });

      console.log(`✅ Admin confirmation email sent for ${item.name} restock`);

    } catch (error) {
      console.error('❌ Failed to send admin confirmation:', error);
    }
  }

  // ✅ NEW: Send financial reports with PDF attachments
  async sendFinancialReports(recipients, subject, message, attachments, priority = 'normal') {
    console.log('📧 sendFinancialReports called for:', recipients.length, 'recipients with', attachments.length, 'attachments');
    
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.error('❌ Failed to initialize EmailService:', error.message);
      throw new Error(`Email system not ready: ${error.message}`);
    }

    // Validate inputs
    if (!recipients || recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    if (!subject || !message) {
      throw new Error('Subject and message are required');
    }

    if (!attachments || attachments.length === 0) {
      throw new Error('At least one PDF attachment is required');
    }

    try {
      // Determine priority settings
      const prioritySettings = {
        normal: {
          icon: '📊',
          urgencyText: 'Regular',
          headerColor: '#667eea',
          priority: 'normal'
        },
        high: {
          icon: '⚠️',
          urgencyText: 'High Priority',
          headerColor: '#ffc107',
          priority: 'high'
        },
        urgent: {
          icon: '🚨',
          urgencyText: 'URGENT',
          headerColor: '#dc3545',
          priority: 'high'
        }
      };

      const currentPriority = prioritySettings[priority] || prioritySettings.normal;
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create HTML email content
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Financial Reports - HealX Healthcare</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
          <div style="max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${currentPriority.headerColor}, ${currentPriority.headerColor}); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">HealX Healthcare Center</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">${currentPriority.icon} Financial Reports</p>
              <div style="margin-top: 20px; padding: 10px 20px; background: rgba(255,255,255,0.2); border-radius: 25px; display: inline-block;">
                <span style="font-size: 14px; font-weight: 500;">${currentPriority.urgencyText} • ${currentDate}</span>
              </div>
            </div>

            <!-- Content Section -->
            <div style="padding: 40px 30px;">
              
              <!-- Priority Alert (for high/urgent) -->
              ${priority !== 'normal' ? `
                <div style="background: linear-gradient(135deg, ${priority === 'urgent' ? '#ff6b6b, #ffeaa7' : '#ffeaa7, #fab1a0'}); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                  <h2 style="margin: 0 0 10px 0; color: ${priority === 'urgent' ? '#d63031' : '#e17055'}; font-size: 24px;">${currentPriority.icon} ${currentPriority.urgencyText}</h2>
                  <p style="margin: 0; color: #636e72; font-size: 16px;">This financial report requires ${priority === 'urgent' ? 'immediate attention' : 'priority review'}.</p>
                </div>
              ` : ''}

              <!-- Main Message -->
              <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; border-left: 5px solid ${currentPriority.headerColor}; margin-bottom: 30px;">
                <div style="white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #2c3e50;">${message}</div>
              </div>

              <!-- Attachments Info -->
              <div style="background: #e8f4f8; padding: 25px; border-radius: 12px; border-left: 5px solid #3498db; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 20px;">📎 Attached Reports (${attachments.length})</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  ${attachments.map(att => `<li style="color: #34495e; margin-bottom: 8px;"><strong>📄 ${att.filename}</strong></li>`).join('')}
                </ul>
                <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 14px;">
                  <strong>Note:</strong> These reports contain sensitive financial information. Please handle with confidentiality.
                </p>
              </div>

              <!-- Instructions -->
              <div style="background: #fff2e6; padding: 25px; border-radius: 12px; border-left: 5px solid #f39c12; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #e67e22; font-size: 20px;">📋 Next Steps</h3>
                <ul style="margin: 0; color: #d35400; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Download and review</strong> all attached financial reports</li>
                  <li><strong>Verify data accuracy</strong> and cross-reference with your records</li>
                  <li><strong>Contact financial team</strong> if you have any questions or concerns</li>
                  <li><strong>Respond within 24-48 hours</strong> with any feedback or approval</li>
                  <li><strong>Store documents securely</strong> following data protection protocols</li>
                </ul>
              </div>

              <!-- Contact Information -->
              <div style="background: #e8f8f5; padding: 25px; border-radius: 12px; border-left: 5px solid #27ae60; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #229954; font-size: 20px;">📞 Contact Financial Team</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                  <div>
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #27ae60;">Financial Department</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">📍 HealX Healthcare Center</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">📞 Phone: (555) 123-4567</p>
                    <p style="margin: 0; color: #2e7d5b;">📧 Email: finance@healx.com</p>
                  </div>
                  <div>
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #27ae60;">Report Support</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">🆘 Support: (555) 123-4568</p>
                    <p style="margin: 0 0 5px 0; color: #2e7d5b;">⏰ Hours: 9 AM - 6 PM</p>
                    <p style="margin: 0; color: #2e7d5b;">💬 Chat: support.healx.com</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 30px; text-align: center;">
              <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Thank you for your attention to these financial reports</p>
              <p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.9;">
                Your review and feedback help ensure accurate financial management and reporting.
              </p>
              <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                  This email was sent from HealX Healthcare Management System.<br>
                  Generated on ${new Date().toLocaleString()} | Priority: ${currentPriority.urgencyText}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send emails to all recipients
      const mailPromises = recipients.map(async (recipient) => {
        const mailOptions = {
          from: `"HealX Healthcare Financial Team" <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject: subject,
          html: htmlContent,
          attachments: attachments,
          priority: currentPriority.priority,
          headers: {
            'X-Priority': priority === 'urgent' ? '1' : priority === 'high' ? '2' : '3',
            'X-MSMail-Priority': priority === 'urgent' ? 'High' : 'Normal',
            'Importance': priority === 'urgent' ? 'high' : 'normal'
          }
          // Removed textEncoding and Content-Type headers that were causing issues
        };

        return this.transporter.sendMail(mailOptions);
      });

      console.log(`📧 Sending financial reports to ${recipients.length} recipients...`);
      const results = await Promise.all(mailPromises);

      console.log('✅ All financial report emails sent successfully!');

      return {
        success: true,
        messageIds: results.map(result => result.messageId),
        recipients: recipients,
        attachmentCount: attachments.length,
        priority: currentPriority.urgencyText,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to send financial reports:', error);
      throw new Error(`Failed to send financial reports: ${error.message}`);
    }
  }

  // ✅ EXISTING: Utility methods remain unchanged
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

// ✅ EXISTING: Utility functions remain unchanged
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
      html: html,
      textEncoding: 'base64',
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
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
      html: html,
      textEncoding: 'base64',
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    };

    const result = await emailService.transporter.sendMail(mailOptions);
    console.log('📧 Restock summary sent successfully!');
    return result;
  } catch (error) {
    console.error('❌ Error sending restock summary:', error);
    throw error;
  }
}

export default emailService;
