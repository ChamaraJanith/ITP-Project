import UserModel from '../model/userModel.js';
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import mongoose from 'mongoose';

/**
 * Get Admin Dashboard Statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin dashboard stats...');

    // Get total regular users
    const totalUsers = await UserModel.countDocuments({});
    
    // Get total staff (from UnifiedUserModel)
    const totalStaff = await UnifiedUserModel.countDocuments({
      role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] }
    });

    // Get total patients (users who are not staff)
    const totalPatients = await UserModel.countDocuments({
      isAccountVerified: true
    });

    // Get verified vs unverified users
    const verifiedUsers = await UserModel.countDocuments({
      isAccountVerified: true
    });
    
    const unverifiedUsers = await UserModel.countDocuments({
      isAccountVerified: false
    });

    // Get staff breakdown by role
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

    // Get recent user registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await UserModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get recent staff logins
    const recentStaffLogins = await UnifiedUserModel.find({
      role: { $in: ['admin', 'doctor', 'receptionist', 'financial_manager'] },
      lastLoginAt: { $exists: true, $ne: null }
    })
    .sort({ lastLoginAt: -1 })
    .limit(5)
    .select('name email role lastLoginAt');

    // System health check
    const systemHealth = await getSystemHealth();

    // Calculate growth metrics
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
      staffBreakdown: staffBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentStaffLogins,
      systemHealth,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Dashboard stats fetched successfully');
    
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
 * Get User Growth Analytics
 */
export const getUserGrowthAnalytics = async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const days = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily user registrations
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

/**
 * Get System Activity Logs
 */
export const getSystemActivityLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Get recent user activities
    const recentUsers = await UserModel.find({})
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .select('name email createdAt isAccountVerified');

    // Get recent staff activities  
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

/**
 * System Health Check
 */
async function getSystemHealth() {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Check collections
    const userCollectionExists = await UserModel.db.listCollections({ name: 'usermodels' }).hasNext();
    const staffCollectionExists = await UnifiedUserModel.db.listCollections({ name: 'unifiedusermodels' }).hasNext();
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    return {
      status: dbStatus === 'connected' && userCollectionExists ? 'healthy' : 'warning',
      database: dbStatus,
      collections: {
        users: userCollectionExists,
        staff: staffCollectionExists
      },
      uptime: Math.round(process.uptime()),
      memory: memUsageMB,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('System health check error:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
