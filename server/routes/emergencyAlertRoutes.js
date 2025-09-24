// routes/emergencyAlertRoutes.js
import express from 'express';
import EmergencyAlertController from '../controller/EmergencyAlertController.js';
import EmergencyAlert from '../model/EmergencyAlert.js';

const emergencyAlertRouter = express.Router();

// Add request logging middleware
emergencyAlertRouter.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🚨 [${timestamp}] Emergency Alert Route: ${req.method} ${req.originalUrl}`);
  console.log(`📊 Request Body:`, req.body);
  console.log(`🔍 Query Params:`, req.query);
  next();
});

// Health check route (MUST be first)
emergencyAlertRouter.get('/test/health', (req, res) => {
  res.json({
    success: true,
    message: 'Emergency Alert Router is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      create: 'POST /',
      getAll: 'GET /',
      getById: 'GET /:id',
      update: 'PUT /:id',
      delete: 'DELETE /:id',
      stats: 'GET /stats',
      bulkUpdate: 'PUT /bulk',
      byDoctor: 'GET /doctor/:doctorId',
      byPatient: 'GET /patient/:patientId',
      dashboard: 'GET /dashboard'
    }
  });
});

// GET - Emergency alert statistics (MUST be before /:id route)
emergencyAlertRouter.get('/stats', EmergencyAlertController.getEmergencyAlertStats);

// GET - Dashboard overview data
emergencyAlertRouter.get('/dashboard', async (req, res) => {
  try {
    const { doctorId } = req.query;
    
    // Get basic stats
    const statsResponse = await EmergencyAlertController.getEmergencyAlertStats({ 
      query: { assignedDoctorId: doctorId } 
    }, {
      status: (code) => ({
        json: (data) => data
      })
    });

    // Get recent alerts
    const recentAlertsResponse = await EmergencyAlertController.getAllEmergencyAlerts({
      query: { 
        assignedDoctorId: doctorId, 
        limit: 5, 
        sortBy: 'createdAt', 
        sortOrder: 'desc' 
      }
    }, {
      status: (code) => ({
        json: (data) => data
      })
    });

    res.json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data: {
        stats: statsResponse.data,
        recentAlerts: recentAlertsResponse.data || []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// GET - Alerts by doctor
emergencyAlertRouter.get('/doctor/:doctorId', async (req, res) => {
  req.query.assignedDoctorId = req.params.doctorId;
  return EmergencyAlertController.getAllEmergencyAlerts(req, res);
});

// GET - Alerts by patient
emergencyAlertRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find({ 
      patientId: req.params.patientId 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Patient alerts fetched successfully',
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient alerts',
      error: error.message
    });
  }
});

// POST - Create new emergency alert
emergencyAlertRouter.post('/', EmergencyAlertController.createEmergencyAlert);

// GET - Fetch all emergency alerts with filtering
emergencyAlertRouter.get('/', EmergencyAlertController.getAllEmergencyAlerts);

// PUT - Bulk update multiple alerts
emergencyAlertRouter.put('/bulk', EmergencyAlertController.bulkUpdateAlerts);

// GET - Fetch emergency alert by ID (MUST be after specific routes)
emergencyAlertRouter.get('/:id', EmergencyAlertController.getEmergencyAlertById);

// PUT - Update emergency alert
emergencyAlertRouter.put('/:id', EmergencyAlertController.updateEmergencyAlert);

// DELETE - Delete emergency alert
emergencyAlertRouter.delete('/:id', EmergencyAlertController.deleteEmergencyAlert);

// POST - Add action to alert
emergencyAlertRouter.post('/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, takenBy } = req.body;

    const alert = await EmergencyAlert.findByIdAndUpdate(
      id,
      {
        $push: {
          actionsTaken: {
            action,
            takenBy,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Action added successfully',
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding action',
      error: error.message
    });
  }
});

// POST - Add attachment to alert
emergencyAlertRouter.post('/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, url, type } = req.body;

    const alert = await EmergencyAlert.findByIdAndUpdate(
      id,
      {
        $push: {
          attachments: {
            filename,
            url,
            type,
            uploadedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Emergency alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Attachment added successfully',
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding attachment',
      error: error.message
    });
  }
});

// Error handling middleware
emergencyAlertRouter.use((error, req, res, next) => {
  console.error('Emergency Alert Router Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: Object.values(error.errors).map(e => e.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

export default emergencyAlertRouter;