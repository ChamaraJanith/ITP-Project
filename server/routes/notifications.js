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
      message: '✅ Test email sent successfully to cjtmadmhealx@gmail.com',
      data: {
        messageId: result.messageId,
        recipient: 'cjtmadmhealx@gmail.com',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Test email endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      serviceStatus: EmailService.getStatus() // ✅ Instance method call
    });
  }
});

// POST /check-low-stock - Send bulk low stock alert
notificationRouter.post('/check-low-stock', async (req, res) => {
  try {
    console.log('🔧 Low stock check request received...');

    let lowStockItems = req.body.lowStockItems || [];

    // If no items provided from frontend, fetch from database
    if (lowStockItems.length === 0) {
      try {
        const { default: SurgicalItem } = await import('../model/SurgicalItem.js');
        
        const dbLowStockItems = await SurgicalItem.find({
          isActive: true,
          $expr: { $lte: ['$quantity', '$minStockLevel'] }
        }).select('name quantity minStockLevel category supplier');

        lowStockItems = dbLowStockItems.map(item => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          minStockLevel: item.minStockLevel || 0,
          category: item.category,
          supplier: item.supplier?.name || 'N/A'
        }));
        
        console.log(`📋 Found ${lowStockItems.length} low stock items from database`);
      } catch (dbError) {
        console.error('❌ Database query error:', dbError.message);
        lowStockItems = [];
      }
    }

    console.log('📦 Processing low stock items:', lowStockItems);

    const result = await EmailService.sendLowStockAlert(lowStockItems);

    res.status(200).json({
      success: true,
      message: 'Low stock alert sent successfully!',
      data: {
        count: lowStockItems.length,
        messageId: result.messageId,
        recipient: 'cjtmadmhealx@gmail.com',
        items: lowStockItems.map(item => ({ 
          name: item.name, 
          quantity: item.quantity,
          minStockLevel: item.minStockLevel 
        })),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Low stock endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send low stock alert',
      error: error.message,
      serviceStatus: EmailService.getStatus() // ✅ Instance method call
    });
  }
});

// ✅ FIXED: POST /send-item-alert - Individual item notification
notificationRouter.post('/send-item-alert', async (req, res) => {
  try {
    console.log('🔧 Individual item alert request received...');
    const { itemId, itemName, currentQuantity, minStockLevel, isOutOfStock, category, supplier } = req.body;
    
    // Validate required fields
    if (!itemId || !itemName || currentQuantity === undefined || minStockLevel === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: itemId, itemName, currentQuantity, minStockLevel are required'
      });
    }

    // Create alert item for email service
    const alertItem = [{
      id: itemId,
      name: itemName,
      quantity: currentQuantity,
      minStockLevel: minStockLevel || 0,
      category: category || 'N/A',
      supplier: supplier || 'N/A',
      status: isOutOfStock ? 'Out of Stock' : 'Low Stock'
    }];

    console.log('📧 Sending individual item alert:', alertItem[0]);

    const result = await EmailService.sendLowStockAlert(alertItem);
    
    res.status(200).json({
      success: true,
      message: `Alert sent successfully for ${itemName}!`,
      data: {
        messageId: result.messageId,
        recipient: 'cjtmadmhealx@gmail.com',
        itemName: itemName,
        alertType: isOutOfStock ? 'out_of_stock' : 'low_stock',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Individual item alert error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send item alert',
      error: error.message,
      serviceStatus: EmailService.getStatus() // ✅ Instance method call
    });
  }
});

// GET /status - Get email service status
notificationRouter.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: EmailService.getStatus(), // ✅ Instance method call
      ready: EmailService.isReady(),    // ✅ Instance method call
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
