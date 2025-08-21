import express from 'express';
import EmailService from '../services/emailService.js';

const notificationRouter = express.Router();

// POST /test-email - Send test email
notificationRouter.post('/test-email', async (req, res) => {
  try {
    console.log('🔧 Test email request received...');
    console.log('📧 EmailService status:', EmailService.getStatus());
    
    const result = await EmailService.sendTestEmail();
    
    res.status(200).json({
      success: true,
      message: '✅ Test email sent successfully to chamarasweed44@gmail.com!',
      data: {
        messageId: result.messageId,
        recipient: 'chamarasweed44@gmail.com',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Test email endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      serviceStatus: EmailService.getStatus()
    });
  }
});

// POST /check-low-stock - Send low stock alert
notificationRouter.post('/check-low-stock', async (req, res) => {
  try {
    console.log('🔧 Low stock check request received...');
    
    // Mock low stock items for testing
    const mockLowStockItems = [
      { name: 'Surgical Gloves', quantity: 5, minStockLevel: 50 },
      { name: 'Face Masks', quantity: 2, minStockLevel: 100 },
      { name: 'Syringes', quantity: 8, minStockLevel: 200 }
    ];

    const result = await EmailService.sendLowStockAlert(mockLowStockItems);
    
    res.status(200).json({
      success: true,
      message: 'Low stock alert sent successfully!',
      data: {
        count: mockLowStockItems.length,
        messageId: result.messageId,
        recipient: 'chamarasweed44@gmail.com',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Low stock endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send low stock alert',
      error: error.message,
      serviceStatus: EmailService.getStatus()
    });
  }
});

// GET /status - Get email service status
notificationRouter.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: EmailService.getStatus(),
      ready: EmailService.isReady(),
      environmentVariables: {
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS,
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_PORT: !!process.env.SMTP_PORT
      }
    }
  });
});

export default notificationRouter;
