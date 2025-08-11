import express from 'express';
import userAuth from '../middleware/userAuth.js';

const userRouter = express.Router();

// Protected user routes
userRouter.get('/profile', userAuth, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAccountVerified: req.user.isAccountVerified,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile'
    });
  }
});

userRouter.put('/profile', userAuth, (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // In a real app, update the user in database
    res.json({
      success: true,
      message: 'User profile updated successfully',
      user: {
        id: req.user._id,
        name: name || req.user.name,
        email: req.user.email,
        phone: phone || req.user.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
});

userRouter.get('/dashboard', userAuth, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User dashboard data loaded',
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
          isVerified: req.user.isAccountVerified
        },
        appointments: [],
        medicalRecords: [],
        notifications: [],
        quickActions: [
          'Book Appointment',
          'View Medical Records', 
          'Download Reports',
          'Contact Support'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard'
    });
  }
});

// Medical records routes
userRouter.get('/medical-records', userAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Medical records retrieved',
    data: {
      records: [], // Implement actual medical records
      totalRecords: 0,
      lastVisit: null
    }
  });
});

// Appointments routes
userRouter.get('/appointments', userAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Appointments retrieved',
    data: {
      upcoming: [],
      past: [],
      cancelled: []
    }
  });
});

userRouter.post('/appointments', userAuth, (req, res) => {
  const { doctorId, date, time, reason } = req.body;
  
  // Implement appointment booking logic
  res.json({
    success: true,
    message: 'Appointment booked successfully',
    appointment: {
      id: 'APT' + Date.now(),
      doctorId,
      date,
      time,
      reason,
      status: 'scheduled'
    }
  });
});

// Route information
userRouter.get('/routes', userAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Available user routes',
    routes: {
      'GET /profile': 'Get user profile',
      'PUT /profile': 'Update user profile',
      'GET /dashboard': 'User dashboard',
      'GET /medical-records': 'Get medical records',
      'GET /appointments': 'Get appointments',
      'POST /appointments': 'Book new appointment'
    }
  });
});

// FIXED: Express v5 compatible catch-all route
userRouter.use('/{*path}', userAuth, (req, res) => {
  res.status(404).json({
    success: false,
    message: `User route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/user/profile',
      'PUT /api/user/profile',
      'GET /api/user/dashboard',
      'GET /api/user/medical-records',
      'GET /api/user/appointments',
      'POST /api/user/appointments'
    ]
  });
});

export default userRouter;
