// controller/adminDashboardController.js
import UserModel from '../model/User.js'; // ✅ ADDED: Missing import
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import mongoose from 'mongoose';

/**
 * Get Individual Profile Details - ADMIN ONLY
 */
export const getProfileDetails = async (req, res) => {
  try {
    // ✅ FIXED: Only admin can view other profiles
    if (req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view user profiles.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { profileId, profileType } = req.params;
    
    console.log(`📋 Admin ${req.admin.email} fetching profile details for ${profileType}: ${profileId}`);

    let profile = null;
    let additionalData = {};

    if (profileType === 'patient') {
      profile = await UserModel.findById(profileId)
        .select('name email createdAt isAccountVerified verifyOtpExpireAt resetOtpExpireAt');
      
      if (profile) {
        additionalData = {
          type: 'patient',
          registrationDate: profile.createdAt,
          accountStatus: profile.isAccountVerified ? 'verified' : 'pending',
          lastActivity: profile.createdAt,
          emailVerification: {
            isVerified: profile.isAccountVerified,
            otpExpiry: profile.verifyOtpExpireAt
          },
          accountActions: [
            'View Medical Records',
            'Send Email Verification',
            'Reset Password',
            'Deactivate Account',
            'Send Notification'
          ]
        };
      }
    } else if (profileType === 'staff') {
      profile = await UnifiedUserModel.findById(profileId)
        .select('name email role department employeeId isActive lastLoginAt createdAt permissions phone');
      
      if (profile) {
        additionalData = {
          type: 'staff',
          registrationDate: profile.createdAt,
          accountStatus: profile.isActive ? 'active' : 'inactive',
          lastActivity: profile.lastLoginAt || profile.createdAt,
          employeeInfo: {
            employeeId: profile.employeeId,
            department: profile.department,
            permissions: profile.permissions,
            phone: profile.phone
          },
          accountActions: [
            'View Staff Dashboard',
            'Update Permissions',
            'Change Department',
            'Reset Password',
            'Toggle Active Status',
            'Send Notification'
          ]
        };
      }
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `${profileType} profile not found`
      });
    }

    const activityHistory = [
      {
        action: profileType === 'patient' ? 'Account Created' : 'Staff Account Created',
        timestamp: profile.createdAt,
        details: `${profile.name} registered in the system`
      }
    ];

    if (profileType === 'staff' && profile.lastLoginAt) {
      activityHistory.unshift({
        action: 'Last Login',
        timestamp: profile.lastLoginAt,
        details: `Logged in as ${profile.role}`
      });
    }

    const responseData = {
      profile: {
        _id: profile._id,
        name: profile.name,
        email: profile.email,
        role: profile.role || 'patient',
        ...additionalData
      },
      activityHistory,
      permissions: {
        canEdit: true,
        canDeactivate: true,
        canResetPassword: true,
        canSendNotification: true,
        canViewFullHistory: true
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Profile details retrieved successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error fetching profile details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile details',
      error: error.message
    });
  }
};

/**
 * Get Real-time Profile List - ADMIN ONLY
 */
export const getRealTimeProfiles = async (req, res) => {
  try {
    // ✅ FIXED: Only admin can view real-time profiles
    if (req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view user profiles.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { type = 'all', limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let profiles = [];
    let totalCount = 0;

    if (type === 'patients' || type === 'all') {
      const patients = await UserModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('name email createdAt isAccountVerified')
        .lean();

      const patientProfiles = patients.map(patient => ({
        ...patient,
        type: 'patient',
        status: patient.isAccountVerified ? 'verified' : 'pending',
        role: 'patient',
        lastActivity: patient.createdAt
      }));

      profiles = [...profiles, ...patientProfiles];
      totalCount += await UserModel.countDocuments({});
    }

    if (type === 'staff' || type === 'all') {
      const staff = await UnifiedUserModel.find({
        role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] }
      })
        .sort({ lastLoginAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('name email role department lastLoginAt createdAt isActive')
        .lean();

      const staffProfiles = staff.map(member => ({
        ...member,
        type: 'staff',
        status: member.isActive ? 'active' : 'inactive',
        lastActivity: member.lastLoginAt || member.createdAt
      }));

      profiles = [...profiles, ...staffProfiles];
      totalCount += await UnifiedUserModel.countDocuments({
        role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] }
      });
    }

    profiles.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    const stats = {
      totalProfiles: totalCount,
      activePatients: await UserModel.countDocuments({ isAccountVerified: true }),
      pendingPatients: await UserModel.countDocuments({ isAccountVerified: false }),
      activeStaff: await UnifiedUserModel.countDocuments({ 
        role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] },
        isActive: true 
      }),
      onlineStaff: await UnifiedUserModel.countDocuments({
        role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] },
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
      })
    };

    res.json({
      success: true,
      message: 'Real-time profiles retrieved successfully',
      data: {
        profiles: profiles.slice(0, parseInt(limit)),
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: skip + profiles.length < totalCount,
          hasPrevPage: page > 1
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching real-time profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time profiles',
      error: error.message
    });
  }
};

/**
 * Update Profile Status/Details - ADMIN ONLY
 */
export const updateProfileStatus = async (req, res) => {
  try {
    // ✅ FIXED: Only admin can update profiles
    if (req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can modify user profiles.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { profileId, profileType } = req.params;
    const { action, data } = req.body;

    console.log(`🔧 Admin ${req.admin.email} updating ${profileType} profile ${profileId} with action: ${action}`);

    let message = '';

    if (profileType === 'patient') {
      const patient = await UserModel.findById(profileId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      switch (action) {
        case 'verify_email':
          await UserModel.findByIdAndUpdate(profileId, { isAccountVerified: true });
          message = 'Patient email verified successfully';
          break;
        case 'send_notification':
          message = 'Notification sent to patient';
          break;
        case 'reset_password':
          message = 'Password reset initiated for patient';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action for patient profile'
          });
      }
    } else if (profileType === 'staff') {
      const staff = await UnifiedUserModel.findById(profileId);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      switch (action) {
        case 'toggle_status':
          await UnifiedUserModel.findByIdAndUpdate(profileId, { 
            isActive: !staff.isActive 
          });
          message = `Staff member ${staff.isActive ? 'deactivated' : 'activated'}`;
          break;
        case 'update_department':
          await UnifiedUserModel.findByIdAndUpdate(profileId, { 
            department: data.department 
          });
          message = 'Department updated successfully';
          break;
        case 'update_permissions':
          await UnifiedUserModel.findByIdAndUpdate(profileId, { 
            permissions: data.permissions 
          });
          message = 'Permissions updated successfully';
          break;
        case 'send_notification':
          message = 'Notification sent to staff member';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action for staff profile'
          });
      }
    }

    res.json({
      success: true,
      message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Get Admin Dashboard Statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard stats...');

    const totalUsers = await UserModel.countDocuments({});
    const totalStaff = await UnifiedUserModel.countDocuments({
      role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] }
    });
    const totalPatients = await UserModel.countDocuments({
      isAccountVerified: true
    });
    const verifiedUsers = await UserModel.countDocuments({
      isAccountVerified: true
    });
    const unverifiedUsers = await UserModel.countDocuments({
      isAccountVerified: false
    });

    const recentPatients = await UserModel.find({
      isAccountVerified: true
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .select('name email createdAt isAccountVerified');

    const staffBreakdown = await UnifiedUserModel.aggregate([
      {
        $match: {
          role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await UserModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentStaffLogins = await UnifiedUserModel.find({
      role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] },
      lastLoginAt: { $exists: true, $ne: null }
    })
    .sort({ lastLoginAt: -1 })
    .limit(5)
    .select('name email role lastLoginAt');

    const systemHealth = await getSystemHealth();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyGrowth = await UserModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const dashboardData = {
      totalUsers,
      totalStaff,
      totalPatients,
      verifiedUsers,
      unverifiedUsers,
      recentRegistrations,
      monthlyGrowth,
      recentPatients,
      staffBreakdown: staffBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentStaffLogins,
      systemHealth,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get Dashboard Role Access Info
 */
export const getDashboardRoleAccess = async (req, res) => {
  try {
    const adminRole = req.admin.role;
    
    const roleCounts = await UnifiedUserModel.aggregate([
      {
        $match: {
          role: { $in: ['receptionist', 'doctor', 'financial_manager'] },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          names: { $push: '$name' }
        }
      }
    ]);

    const roleData = {
      receptionist: {
        title: 'Receptionist Dashboard',
        description: 'Appointment scheduling & patient management',
        icon: '👩‍💼',
        path: '/admin/receptionist-dashboard',
        accessible: ['admin', 'receptionist'].includes(adminRole),
        count: 0,
        staff: []
      },
      doctor: {
        title: 'Doctor Dashboard',
        description: 'Medical records & patient consultations',
        icon: '👩‍⚕️', 
        path: '/admin/doctor-dashboard',
        accessible: ['admin', 'doctor'].includes(adminRole),
        count: 0,
        staff: []
      },
      financial_manager: {
        title: 'Financial Manager Dashboard',
        description: 'Billing, payments & financial reports',
        icon: '💰',
        path: '/admin/financial-dashboard',
        accessible: ['admin', 'financial_manager'].includes(adminRole),
        count: 0,
        staff: []
      }
    };

    roleCounts.forEach(role => {
      if (roleData[role._id]) {
        roleData[role._id].count = role.count;
        roleData[role._id].staff = role.names;
      }
    });

    res.json({
      success: true,
      data: {
        currentRole: adminRole,
        canAccessAll: adminRole === 'admin',
        canViewProfiles: adminRole === 'admin', // ✅ FIXED: Only admin can view profiles
        roleAccess: roleData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard role access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard role access',
      error: error.message
    });
  }
};

export const getUserGrowthAnalytics = async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyRegistrations = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        dailyRegistrations,
        totalInPeriod: dailyRegistrations.reduce((sum, day) => sum + day.count, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching growth analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth analytics',
      error: error.message
    });
  }
};

export const getSystemActivityLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const recentUsers = await UserModel.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('name email createdAt isAccountVerified');

    const recentStaff = await UnifiedUserModel.find({})
      .sort({ lastLoginAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('name email role lastLoginAt createdAt');

    const activityLogs = [
      ...recentUsers.map(user => ({
        type: 'user_registration',
        user: user.name,
        email: user.email,
        timestamp: user.createdAt,
        verified: user.isAccountVerified
      })),
      ...recentStaff.map(staff => ({
        type: 'staff_login',
        user: staff.name,
        email: staff.email,
        role: staff.role,
        timestamp: staff.lastLoginAt || staff.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        activityLogs,
        totalLogs: activityLogs.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const patients = await UserModel.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('name email createdAt isAccountVerified');

    const totalPatients = await UserModel.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        patients,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPatients / limit),
        totalPatients,
        hasNextPage: skip + patients.length < totalPatients,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
};

/**
 * Get All Profiles with Detailed Information - ADMIN ONLY
 */
export const getAllProfilesDetailed = async (req, res) => {
  try {
    // ✅ FIXED: Only admin can view detailed profiles
    if (req.admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view detailed profiles.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { 
      search = '', 
      type = 'all', 
      status = 'all', 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let profiles = [];
    let totalCount = 0;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    if (type === 'patients' || type === 'all') {
      let patientQuery = { ...searchQuery };
      
      if (status === 'verified') {
        patientQuery.isAccountVerified = true;
      } else if (status === 'pending') {
        patientQuery.isAccountVerified = false;
      }

      const patients = await UserModel.find(patientQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? 100 : parseInt(limit))
        .select('name email createdAt isAccountVerified verifyOtpExpireAt resetOtpExpireAt');

      const patientProfiles = patients.map(patient => ({
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        type: 'patient',
        role: 'patient',
        status: patient.isAccountVerified ? 'verified' : 'pending',
        registrationDate: patient.createdAt,
        lastActivity: patient.createdAt,
        emailVerification: {
          isVerified: patient.isAccountVerified,
          otpExpiry: patient.verifyOtpExpireAt
        },
        clickable: true,
        detailedInfo: true
      }));

      profiles = [...profiles, ...patientProfiles];
      
      if (type === 'patients') {
        totalCount = await UserModel.countDocuments(patientQuery);
      }
    }

    if (type === 'staff' || type === 'all') {
      let staffQuery = {
        ...searchQuery,
        role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] }
      };
      
      if (status === 'active') {
        staffQuery.isActive = true;
      } else if (status === 'inactive') {
        staffQuery.isActive = false;
      }

      const staff = await UnifiedUserModel.find(staffQuery)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(type === 'all' ? 0 : skip)
        .limit(type === 'all' ? 100 : parseInt(limit))
        .select('name email role department employeeId isActive lastLoginAt createdAt permissions phone');

      const staffProfiles = staff.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        type: 'staff',
        role: member.role,
        department: member.department,
        employeeId: member.employeeId,
        status: member.isActive ? 'active' : 'inactive',
        registrationDate: member.createdAt,
        lastActivity: member.lastLoginAt || member.createdAt,
        employeeInfo: {
          employeeId: member.employeeId,
          department: member.department,
          permissions: member.permissions,
          phone: member.phone
        },
        clickable: true,
        detailedInfo: true
      }));

      profiles = [...profiles, ...staffProfiles];
      
      if (type === 'staff') {
        totalCount = await UnifiedUserModel.countDocuments(staffQuery);
      }
    }

    if (type === 'all') {
      totalCount = profiles.length;
    }

    // Sort by specified criteria
    profiles.sort((a, b) => {
      const aValue = a[sortBy] || a.registrationDate;
      const bValue = b[sortBy] || b.registrationDate;
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });

    res.json({
      success: true,
      message: 'Detailed profiles retrieved successfully',
      data: {
        profiles: profiles.slice(0, parseInt(limit)),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: skip + profiles.length < totalCount,
          hasPrevPage: page > 1
        },
        filters: {
          search,
          type,
          status,
          sortBy,
          sortOrder
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching detailed profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed profiles',
      error: error.message
    });
  }
};

async function getSystemHealth() {
  try {
    const dbState  = mongoose.connection.readyState;            // 0-3
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    // use the active connection’s native driver
    const db = mongoose.connection.db;

    const userCollectionExists =
      (await db.listCollections({ name: 'users' }).toArray()).length > 0;

    const staffCollectionExists =
      (await db.listCollections({ name: 'unifiedusers' }).toArray()).length > 0;

    const mem = process.memoryUsage();
    const memUsageMB = {
      rss:       Math.round(mem.rss       / 1024 / 1024),
      heapUsed:  Math.round(mem.heapUsed  / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external:  Math.round(mem.external  / 1024 / 1024)
    };

    return {
      status: dbStatus === 'connected' && userCollectionExists ? 'healthy' : 'warning',
      database: dbStatus,
      collections: { users: userCollectionExists, staff: staffCollectionExists },
      uptime:   Math.round(process.uptime()),
      memory:   memUsageMB,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('System health check error:', error);
    return {
      status: 'error',
      error:  error.message,
      timestamp: new Date().toISOString()
    };
  }
}
