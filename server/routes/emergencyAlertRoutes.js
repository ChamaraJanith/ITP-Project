// ===== 3. emergencyAlertRoutes.js (Fixed) =====
import express from 'express';
import EmergencyAlertController from '../controller/EmergencyAlertController.js';

const emergencyAlertRouter = express.Router();

// Add request logging middleware
emergencyAlertRouter.use((req, res, next) => {
  console.log(`🚨 Emergency Alert Route: ${req.method} ${req.originalUrl}`);
  next();
});

// POST - create new emergency alert
emergencyAlertRouter.post('/', EmergencyAlertController.createEmergencyAlert);

// GET - fetch all emergency alerts
emergencyAlertRouter.get('/', EmergencyAlertController.getAllEmergencyAlerts);

// GET - fetch emergency alert statistics (MUST be before /:id route)
emergencyAlertRouter.get('/stats', EmergencyAlertController.getEmergencyAlertStats);

// GET - fetch emergency alert by ID
emergencyAlertRouter.get('/:id', EmergencyAlertController.getEmergencyAlertById);

// PUT - update emergency alert status
emergencyAlertRouter.put('/:id', EmergencyAlertController.updateEmergencyAlertStatus);

// DELETE - delete emergency alert
emergencyAlertRouter.delete('/:id', EmergencyAlertController.deleteEmergencyAlert);

// Test route to verify router is working
emergencyAlertRouter.get('/test/health', (req, res) => {
  res.json({
    success: true,
    message: 'Emergency Alert Router is working!',
    timestamp: new Date().toISOString()
  });
});

export default emergencyAlertRouter;