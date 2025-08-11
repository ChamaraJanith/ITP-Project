const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

// Admin Dashboard API calls
export const adminDashboardApi = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  // Get user growth analytics
  getUserGrowthAnalytics: async (period = '7') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/analytics?period=${period}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Growth analytics error:', error);
      throw error;
    }
  },

  // Get system activity logs
  getSystemActivityLogs: async (limit = 50) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/activity?limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Activity logs error:', error);
      throw error;
    }
  },

  // Verify admin session
  verifyAdminSession: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Admin verification error:', error);
      throw error;
    }
  }
};

export default adminDashboardApi;
