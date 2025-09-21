import express from 'express';
import multer from 'multer';
import emailService from '../services/emailService.js'; 


const financemailrouter = express.Router();


// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});


// 🎯 THIS IS THE MISSING ROUTE
financemailrouter.post('/send-financial-reports', upload.any(), async (req, res) => {
  console.log('📧 POST /api/emails/send-financial-reports called');
  
  try {
    const {
      recipients,
      subject,
      message,
      priority = 'normal',
    } = req.body;


    // Validate required fields
    if (!recipients || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipients, subject, and message are required'
      });
    }


    // Parse recipients (JSON string from FormData)
    let recipientsList;
    try {
      recipientsList = JSON.parse(recipients);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipients format'
      });
    }


    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipientsList.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid email addresses: ${invalidEmails.join(', ')}`
      });
    }


    // Check for attachments
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one PDF attachment is required'
      });
    }


    // Prepare attachments for email service
    const attachments = req.files.map(file => {
      const timestamp = new Date().toISOString().slice(0, 10);
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalFileName = `Financial_Report_${timestamp}_${safeFileName}`;


      return {
        filename: finalFileName,
        content: file.buffer,
        contentType: file.mimetype
      };
    });


    console.log(`📧 Processing ${attachments.length} files for ${recipientsList.length} recipients`);


    // 🎯 USE YOUR UPDATED EMAIL SERVICE METHOD
    const result = await emailService.sendFinancialReports(
      recipientsList,
      subject,
      message,
      attachments,
      priority
    );


    console.log('✅ Financial reports sent successfully!');


    // Return success response
    res.json({
      success: true,
      message: `Financial reports sent successfully to ${recipientsList.length} recipient(s)`,
      data: {
        recipients: recipientsList,
        attachmentCount: attachments.length,
        priority: priority,
        sentAt: new Date().toISOString(),
        messageIds: result.messageIds
      }
    });


  } catch (error) {
    console.error('❌ Error sending financial reports:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }


    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send financial reports'
    });
  }
});


// Test route to verify the API works
financemailrouter.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Email routes are working!',
    timestamp: new Date().toISOString()
  });
});


export default financemailrouter;
