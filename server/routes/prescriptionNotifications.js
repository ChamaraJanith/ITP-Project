import express from 'express';
import EmailService from '../services/emailService.js';

const prescriptionNotificationRouter = express.Router();

// POST /send-prescription - Send prescription email with PDF attachment
prescriptionNotificationRouter.post('/send-prescription', async (req, res) => {
  try {
    console.log('📧 Prescription email request received...');
    console.log('📋 Request body keys:', Object.keys(req.body));
    
    const { prescriptionData, pdfBuffer, isUpdate = false } = req.body;
    
    // Validate required fields
    if (!prescriptionData) {
      console.log('❌ Missing prescriptionData');
      return res.status(400).json({
        success: false,
        message: 'Prescription data is required'
      });
    }

    if (!prescriptionData.patientEmail) {
      console.log('❌ Missing patientEmail');
      return res.status(400).json({
        success: false,
        message: 'Patient email is required'
      });
    }

    if (!pdfBuffer || !Array.isArray(pdfBuffer)) {
      console.log('❌ Invalid PDF buffer');
      return res.status(400).json({
        success: false,
        message: 'PDF buffer is required and must be an array'
      });
    }

    console.log('📧 Processing prescription email for:', prescriptionData.patientEmail);
    console.log('📋 Prescription ID:', prescriptionData._id);
    console.log('📄 PDF buffer size:', pdfBuffer.length, 'bytes');
    console.log('🔄 Is update:', isUpdate);

    // Convert array back to Buffer
    const pdfBufferConverted = Buffer.from(pdfBuffer);
    
    // Send prescription email using EmailService
    const result = await EmailService.sendPrescriptionToPatient(
      prescriptionData, 
      pdfBufferConverted, 
      isUpdate
    );
    
    console.log('✅ Prescription email sent successfully!');
    
    res.status(200).json({
      success: true,
      message: `Prescription email ${isUpdate ? 'updated and ' : ''}sent successfully!`,
      data: {
        messageId: result.messageId,
        recipient: result.recipient,
        filename: result.filename,
        isUpdate: result.isUpdate,
        prescriptionId: prescriptionData._id,
        patientName: prescriptionData.patientName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Prescription email endpoint error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send prescription email',
      error: error.message,
      serviceStatus: EmailService.getStatus()
    });
  }
});

export default prescriptionNotificationRouter;