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

  // Get real-time profiles
  getRealTimeProfiles: async (type = 'all', page = 1, limit = 20) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/profiles/realtime?type=${type}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Real-time profiles error:', error);
      throw error;
    }
  },

  // NEW: Get individual profile details
  getProfileDetails: async (profileType, profileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/${profileType}/${profileId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Profile details error:', error);
      throw error;
    }
  },

  // NEW: Update profile status
  updateProfileStatus: async (profileType, profileId, action, data = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profile/${profileType}/${profileId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, data })
      });
      return await response.json();
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  // NEW: Get detailed profiles with filters
  getDetailedProfiles: async (search = '', type = 'all', status = 'all', page = 1, limit = 20) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profiles/detailed?search=${search}&type=${type}&status=${status}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Detailed profiles error:', error);
      throw error;
    }
  },

  // Get dashboard role access
  getDashboardRoleAccess: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/role-access`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Dashboard role access error:', error);
      throw error;
    }
  },

  // Get all patients
  getAllPatients: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/patients?page=${page}&limit=${limit}&search=${search}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Patients data error:', error);
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
  },

  // Access specific dashboards
  accessReceptionistDashboard: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/receptionist-dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Receptionist dashboard access error:', error);
      throw error;
    }
  },

  accessDoctorDashboard: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/doctor-dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Doctor dashboard access error:', error);
      throw error;
    }
  },

  accessFinancialDashboard: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/financial-dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Financial dashboard access error:', error);
      throw error;
    }
  }
};

export default adminDashboardApi;
