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

  // Get individual profile details
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

  // Update profile status
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

  // Get detailed profiles with filters
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
  },

  // ===============================
  // REPORT GENERATION FUNCTIONS
  // ===============================

  // Generate Summary Report (for floating action button)
  generateSummaryReport: async (reportData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle different response types based on format
      if (reportData.reportFormat === 'html') {
        const htmlContent = await response.text();
        return {
          success: true,
          data: htmlContent,
          message: 'HTML report generated successfully'
        };
      } else {
        // For PDF and Excel, return blob
        const blob = await response.blob();
        return {
          success: true,
          data: blob,
          message: 'Report generated successfully'
        };
      }
    } catch (error) {
      console.error('Error generating summary report:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate summary report'
      };
    }
  },

  // Get Report Templates
  getReportTemplates: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching report templates:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch report templates'
      };
    }
  },

  // Get Financial Data for Reports
  getFinancialReportData: async (month, year) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/financial-data?month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching financial data:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch financial data'
      };
    }
  },

  // Get Report History
  getReportHistory: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching report history:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch report history'
      };
    }
  },

  // Delete Report
  deleteReport: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting report:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete report'
      };
    }
  },

  // Download Existing Report
  downloadReport: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/download/${reportId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
        message: 'Report downloaded successfully'
      };
    } catch (error) {
      console.error('Error downloading report:', error);
      return {
        success: false,
        message: error.message || 'Failed to download report'
      };
    }
  },

  // ===============================
  // SUPPORT FUNCTIONS
  // ===============================

  // Send Support Request
  sendSupportRequest: async (supportData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/support/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(supportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending support request:', error);
      return {
        success: false,
        message: error.message || 'Failed to send support request'
      };
    }
  },

  // Get Support Tickets
  getSupportTickets: async (page = 1, limit = 10, status = 'all') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/support/tickets?page=${page}&limit=${limit}&status=${status}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch support tickets'
      };
    }
  },
  getAllProfilesDetailed: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        search: filters.search || '',
        type: filters.type || 'all',
        status: filters.status || 'all',
        page: filters.page || 1,
        limit: filters.limit || 10,
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/profiles/detailed?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('getAllProfilesDetailed failed:', error);
      return { success: false, message: error.message };
    }
  }
};

export default adminDashboardApi;
