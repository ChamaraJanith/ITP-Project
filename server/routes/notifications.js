import express from 'express';
import EmailService from '../services/emailService.js';

const notificationRouter = express.Router();

// Test email endpoint
notificationRouter.post('/test-email', async (req, res) => {
  try {
    console.log('🔧 Test email request received...');
    
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
    console.error('❌ Test email endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Low stock check endpoint
notificationRouter.post('/check-low-stock', async (req, res) => {
  try {
    console.log('🔧 Low stock check request received...');
    
    // Mock low stock items for demonstration
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
    console.error('❌ Low stock endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send low stock alert',
      error: error.message
    });
  }
});

// Settings endpoint
notificationRouter.get('/settings', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      recipients: ['chamarasweed44@gmail.com'],
      monitoringEnabled: true,
      timezone: 'Asia/Kolkata',
      systemName: 'HealX Smart Healthcare System'
    }
  });
});

export default notificationRouter;
