import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import AdminErrorBoundary from '../AdminErrorBoundary';
import ProfileDetailModal from '../../admin/ProfileDetailModal.jsx';
import { adminDashboardApi } from '../../../services/adminApi.js';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  
  // ✅ ENHANCED: systemStats with all necessary fields for real data
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalPatients: 0,
    systemHealth: 'loading',
    verifiedUsers: 0,
    unverifiedUsers: 0,
    recentRegistrations: 0,
    monthlyGrowth: 0,
    staffBreakdown: {},
    lastUpdated: null,
    // ✅ FIXED: Add all financial and operational fields for REAL data
    totalRevenue: null,
    totalExpenses: null,
    netProfit: null,
    appointmentRevenue: null,
    activePatients: null,
    newPatients: null,
    totalAppointments: null,
    completedAppointments: null,
    cancelledAppointments: null,
    pendingAppointments: null,
    totalBilled: null,
    totalCollected: null,
    outstandingAmount: null,
    averagePayment: null,
    patientGrowth: null,
    revenueGrowth: null,
    appointmentGrowth: null,
    satisfactionScore: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [growthAnalytics, setGrowthAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [realTimeProfiles, setRealTimeProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [dashboardRoleAccess, setDashboardRoleAccess] = useState({});
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryFormData, setSummaryFormData] = useState({
    reportType: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    includeFinancials: true,
    includePatients: true,
    includeStaff: true,
    includeAppointments: true,
    includeBilling: true,
    includeAnalytics: true,
    reportFormat: 'html'
  });
  const [generateLoading, setGenerateLoading] = useState(false);
  
  // Profile modal state
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // All Users Management State
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    type: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [userPagination, setUserPagination] = useState({});

  useEffect(() => {
    initializeDashboard();
  }, [navigate]);

  // Auto-refresh real-time profiles every 30 seconds when visible
  useEffect(() => {
    let interval;
    if (showProfiles) {
      interval = setInterval(() => {
        loadRealTimeProfiles();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [showProfiles]);

  // Auto-reload users when filters change
  useEffect(() => {
    if (showAllUsers) {
      loadAllUsers();
    }
  }, [userFilters]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      // Check admin authentication with better error handling
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        try {
          const parsedAdmin = JSON.parse(adminData);
          
          // Validate admin data structure
          if (parsedAdmin && parsedAdmin.role && parsedAdmin.email) {
            if (parsedAdmin.role !== 'admin') {
              console.log('⚠️ Non-admin user trying to access admin dashboard');
              navigate('/admin/login');
              return;
            }
            setAdmin(parsedAdmin);
          } else {
            throw new Error('Invalid admin data structure');
          }
        } catch (parseError) {
          console.error('❌ Error parsing admin data:', parseError);
          localStorage.removeItem('admin');
          navigate('/admin/login');
          return;
        }
      } else {
        // Try to verify admin session from server
        try {
          const sessionCheck = await adminDashboardApi.verifyAdminSession();
          if (sessionCheck.success && sessionCheck.data && sessionCheck.data.role === 'admin') {
            setAdmin(sessionCheck.data);
            localStorage.setItem('admin', JSON.stringify(sessionCheck.data));
          } else {
            console.log('❌ Session verification failed');
            navigate('/admin/login');
            return;
          }
        } catch (sessionError) {
          console.error('❌ Session verification error:', sessionError);
          navigate('/admin/login');
          return;
        }
      }

      // Load dashboard data only after admin is confirmed
      await loadDashboardData();

    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      setError('Failed to initialize dashboard');
      
      // Clear invalid data and redirect
      localStorage.removeItem('admin');
      setTimeout(() => navigate('/admin/login'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // ✅ ENHANCED: Fetch comprehensive dashboard statistics with all data fields
      const statsResponse = await adminDashboardApi.getDashboardStats();
      
      if (statsResponse.success) {
        const data = statsResponse.data;
        
        // ✅ FIXED: Set ALL required fields with real data or null (no random numbers)
        setSystemStats({
          totalUsers: data.totalUsers || 0,
          totalStaff: data.totalStaff || 0,
          totalPatients: data.totalPatients || 0,
          verifiedUsers: data.verifiedUsers || 0,
          unverifiedUsers: data.unverifiedUsers || 0,
          recentRegistrations: data.recentRegistrations || 0,
          monthlyGrowth: data.monthlyGrowth || 0,
          staffBreakdown: data.staffBreakdown || {},
          systemHealth: data.systemHealth?.status || 'loading',
          lastUpdated: data.lastUpdated || null,
          
          // ✅ ENHANCED: Real financial and operational data (no random generation)
          totalRevenue: data.totalRevenue || null,
          totalExpenses: data.totalExpenses || null,
          netProfit: data.netProfit || null,
          appointmentRevenue: data.appointmentRevenue || null,
          activePatients: data.activePatients || data.totalPatients || null,
          newPatients: data.newPatients || data.recentRegistrations || null,
          totalAppointments: data.totalAppointments || null,
          completedAppointments: data.completedAppointments || null,
          cancelledAppointments: data.cancelledAppointments || null,
          pendingAppointments: data.pendingAppointments || null,
          totalBilled: data.totalBilled || null,
          totalCollected: data.totalCollected || null,
          outstandingAmount: data.outstandingAmount || null,
          averagePayment: data.averagePayment || null,
          patientGrowth: data.patientGrowth || data.monthlyGrowth || null,
          revenueGrowth: data.revenueGrowth || null,
          appointmentGrowth: data.appointmentGrowth || null,
          satisfactionScore: data.satisfactionScore || null
        });

        // Set recent patients for the buttons
        setRecentPatients(data.recentPatients || []);

        console.log('✅ Dashboard stats loaded with REAL data:', data);
        console.log('📊 Patient numbers - Total:', data.totalPatients, 'Active:', data.activePatients, 'New:', data.newPatients);
      } else {
        throw new Error(statsResponse.message || 'Failed to fetch dashboard stats');
      }

      // Fetch growth analytics
      const analyticsResponse = await adminDashboardApi.getUserGrowthAnalytics(7);
      if (analyticsResponse.success) {
        setGrowthAnalytics(analyticsResponse.data);
        
        // ✅ ENHANCED: Update systemStats with analytics data if available
        setSystemStats(prev => ({
          ...prev,
          patientGrowth: analyticsResponse.data.patientGrowth || prev.patientGrowth,
          revenueGrowth: analyticsResponse.data.revenueGrowth || prev.revenueGrowth,
          appointmentGrowth: analyticsResponse.data.appointmentGrowth || prev.appointmentGrowth,
          satisfactionScore: analyticsResponse.data.satisfactionScore || prev.satisfactionScore,
          newPatients: analyticsResponse.data.newPatients || prev.newPatients
        }));
      }

      // Fetch activity logs
      const logsResponse = await adminDashboardApi.getSystemActivityLogs(10);
      if (logsResponse.success) {
        setActivityLogs(logsResponse.data.activityLogs || []);
      }

      // Fetch dashboard role access
      const roleAccessResponse = await adminDashboardApi.getDashboardRoleAccess();
      if (roleAccessResponse.success) {
        setDashboardRoleAccess(roleAccessResponse.data);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeProfiles = async () => {
    try {
      setProfilesLoading(true);
      const response = await adminDashboardApi.getRealTimeProfiles('all', 1, 20);
      
      if (response.success) {
        setRealTimeProfiles(response.data.profiles);
        console.log('✅ Real-time profiles updated:', response.data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading real-time profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Load all users function
  const loadAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminDashboardApi.getAllProfilesDetailed(userFilters);
      
      if (response.success) {
        setAllUsers(response.data.profiles);
        setUserPagination(response.data.pagination);
        console.log('✅ All users loaded:', response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ Error loading all users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Toggle all users section
  const toggleAllUsers = async () => {
    if (!showAllUsers) {
      await loadAllUsers();
    }
    setShowAllUsers(!showAllUsers);
  };

  // Handle user filter changes
  const handleUserFilterChange = (key, value) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const toggleRealTimeProfiles = async () => {
    if (!showProfiles) {
      await loadRealTimeProfiles();
    }
    setShowProfiles(!showProfiles);
  };

  const refreshData = async () => {
    await loadDashboardData();
    if (showProfiles) {
      await loadRealTimeProfiles();
    }
    if (showAllUsers) {
      await loadAllUsers();
    }
  };

  // Handle profile click
  const handleProfileClick = (profile) => {
    console.log('👤 Opening profile:', profile);
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  // Close profile modal
  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    // Refresh profiles after modal closes
    if (showProfiles) {
      loadRealTimeProfiles();
    }
    // Refresh all users after modal closes
    if (showAllUsers) {
      loadAllUsers();
    }
  };

  const handleDashboardAccess = async (dashboardType) => {
    try {
      let response;
      switch (dashboardType) {
        case 'receptionist':
          response = await adminDashboardApi.accessReceptionistDashboard();
          if (response.success) {
            console.log('✅ Accessing Receptionist Dashboard:', response.data);
            navigate('/admin/receptionist-dashboard');
          }
          break;
        case 'doctor':
          response = await adminDashboardApi.accessDoctorDashboard();
          if (response.success) {
            console.log('✅ Accessing Doctor Dashboard:', response.data);
            navigate('/admin/doctor-dashboard');
          }
          break;
        case 'financial':
          response = await adminDashboardApi.accessFinancialDashboard();
          if (response.success) {
            console.log('✅ Accessing Financial Dashboard:', response.data);
            navigate('/admin/financial-dashboard');
          }
          break;
        default:
          console.error('Unknown dashboard type:', dashboardType);
      }
    } catch (error) {
      console.error(`❌ Error accessing ${dashboardType} dashboard:`, error);
      setError(`Failed to access ${dashboardType} dashboard`);
    }
  };

  // Print functionality
  const handlePrint = () => {
    // Hide floating buttons before printing
    const fabButtons = document.querySelector('.floating-action-buttons');
    if (fabButtons) {
      fabButtons.style.display = 'none';
    }
    
    // Print the page
    window.print();
    
    // Show floating buttons after printing
    setTimeout(() => {
      if (fabButtons) {
        fabButtons.style.display = 'flex';
      }
    }, 1000);
  };

  // Contact support functionality
  const handleContactSupport = () => {
    // Option 1: Open email client with pre-filled details
    const subject = encodeURIComponent('Admin Dashboard Support Request');
    const body = encodeURIComponent(`Hello Support Team,

I need assistance with the Admin Dashboard.

Admin Details:
- Name: ${admin?.name || 'N/A'}
- Email: ${admin?.email || 'N/A'}
- Role: ${admin?.role || 'N/A'}
- Dashboard: System Administrator
- Timestamp: ${new Date().toLocaleString()}

Issue Description:
[Please describe your issue here]

Best regards,
${admin?.name || 'Admin User'}`);
    
    window.open(`mailto:support@yourhospital.com?subject=${subject}&body=${body}`);
  };

  // Summary report functionality
  const handleSummaryReport = () => {
    setShowSummaryModal(true);
  };

  const handleSummaryFormChange = (field, value) => {
    setSummaryFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ FIXED: Helper function to format values or show "No data entered"
  const getValueOrNoData = (value) => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return 'No data entered';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  // ✅ FIXED: Helper function to format currency values
  const getCurrencyOrNoData = (value) => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return 'No data entered';
    }
    if (typeof value === 'number') {
      return `$${value.toLocaleString()}`;
    }
    return value;
  };

  // ✅ COMPLETELY FIXED: Generate report with 100% REAL DATA (no mockData, no Math.random())
  const generateFrontendHTMLReport = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    console.log('📊 Generating HTML report with REAL DATA:', {
      totalPatients: systemStats.totalPatients,
      activePatients: systemStats.activePatients,
      newPatients: systemStats.newPatients,
      totalRevenue: systemStats.totalRevenue,
      completedAppointments: systemStats.completedAppointments
    });

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Hospital Report - ${monthNames[summaryFormData.month - 1]} ${summaryFormData.year}</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Arial, sans-serif; 
                  margin: 40px; 
                  background: #f8f9fa;
                  line-height: 1.6;
              }
              .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 12px; 
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  max-width: 1000px;
                  margin: 0 auto;
              }
              .header { 
                  text-align: center; 
                  border-bottom: 3px solid #007bff; 
                  padding-bottom: 25px; 
                  margin-bottom: 40px; 
              }
              .section { 
                  margin-bottom: 40px; 
                  padding: 25px; 
                  border: 1px solid #e9ecef; 
                  border-radius: 10px; 
                  background: #f8f9fa;
              }
              .metrics-grid { 
                  display: grid; 
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                  gap: 20px; 
                  margin: 20px 0;
              }
              .metric { 
                  padding: 20px; 
                  background: white; 
                  border-radius: 8px; 
                  text-align: center; 
                  border: 1px solid #dee2e6;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              }
              .metric-value { 
                  font-size: 2.2em; 
                  font-weight: bold; 
                  color: #007bff; 
                  margin-bottom: 8px;
              }
              .metric-value.no-data {
                  color: #dc3545;
                  font-size: 1.2em;
                  font-style: italic;
              }
              .metric-label { 
                  color: #6c757d; 
                  font-size: 0.9em;
                  font-weight: 500;
              }
              .summary-info {
                  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                  padding: 20px;
                  border-radius: 10px;
                  margin-bottom: 25px;
              }
              h1 { 
                  color: #212529; 
                  margin: 0; 
                  font-size: 2.5em;
                  font-weight: 300;
              }
              h2 { 
                  color: #495057; 
                  border-bottom: 2px solid #dee2e6; 
                  padding-bottom: 12px; 
                  margin-bottom: 25px;
                  font-size: 1.5em;
              }
              .highlight { 
                  background: linear-gradient(135deg, #28a745, #20c997); 
                  color: white; 
                  padding: 3px 8px; 
                  border-radius: 4px;
              }
              .footer {
                  margin-top: 50px;
                  text-align: center;
                  color: #6c757d;
                  font-size: 0.9em;
                  padding-top: 25px;
                  border-top: 1px solid #dee2e6;
              }
              @media print {
                  body { margin: 0; background: white; }
                  .container { box-shadow: none; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🏥 Hospital Summary Report</h1>
                  <div class="summary-info">
                      <p><strong>📅 Period:</strong> <span class="highlight">${monthNames[summaryFormData.month - 1]} ${summaryFormData.year}</span></p>
                      <p><strong>📊 Generated:</strong> ${new Date().toLocaleDateString()}</p>
                      <p><strong>⏰ Time:</strong> ${new Date().toLocaleTimeString()}</p>
                      <p><strong>👤 Generated by:</strong> ${admin?.name || 'System Administrator'}</p>
                  </div>
              </div>
    `;

    // ✅ FIXED: Financial Summary with REAL DATA ONLY
    if (summaryFormData.includeFinancials) {
      html += `
          <div class="section">
              <h2>💰 Financial Summary</h2>
              <div class="metrics-grid">
                  <div class="metric">
                      <div class="metric-value ${systemStats.totalRevenue === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.totalRevenue)}</div>
                      <div class="metric-label">Total Revenue</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value ${systemStats.totalExpenses === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.totalExpenses)}</div>
                      <div class="metric-label">Total Expenses</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value ${systemStats.netProfit === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.netProfit)}</div>
                      <div class="metric-label">Net Profit</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value ${systemStats.appointmentRevenue === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.appointmentRevenue)}</div>
                      <div class="metric-label">Appointment Revenue</div>
                  </div>
              </div>
          </div>
      `;
    }

    // ✅ FIXED: Patient Statistics with REAL NUMBERS ONLY
    if (summaryFormData.includePatients) {
      html += `
          <div class="section">
              <h2>👥 Patient Statistics</h2>
              <div class="metrics-grid">
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.totalPatients)}</div>
                      <div class="metric-label">Total Patients</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.newPatients)}</div>
                      <div class="metric-label">New Patients</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.activePatients)}</div>
                      <div class="metric-label">Active Patients</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.completedAppointments)}</div>
                      <div class="metric-label">Appointments Completed</div>
                  </div>
              </div>
          </div>
      `;
    }

    // ✅ FIXED: Staff Overview with REAL DATA ONLY
    if (summaryFormData.includeStaff) {
      html += `
          <div class="section">
              <h2>👨‍⚕️ Staff Overview</h2>
              <div class="metrics-grid">
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.totalStaff)}</div>
                      <div class="metric-label">Total Staff</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.staffBreakdown?.doctor)}</div>
                      <div class="metric-label">Doctors</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.staffBreakdown?.nurse)}</div>
                      <div class="metric-label">Nurses</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.staffBreakdown?.receptionist)}</div>
                      <div class="metric-label">Receptionists</div>
                  </div>
              </div>
          </div>
      `;
    }

    // ✅ FIXED: Appointment Analytics with REAL DATA ONLY
    if (summaryFormData.includeAppointments) {
      html += `
          <div class="section">
              <h2>📅 Appointment Analytics</h2>
              <div class="metrics-grid">
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.totalAppointments)}</div>
                      <div class="metric-label">Total Appointments</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.completedAppointments)}</div>
                      <div class="metric-label">Completed</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.cancelledAppointments)}</div>
                      <div class="metric-label">Cancelled</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${getValueOrNoData(systemStats.pendingAppointments)}</div>
                      <div class="metric-label">Pending</div>
                  </div>
              </div>
          </div>
      `;
    }

    // ✅ FIXED: Billing & Revenue with REAL DATA ONLY
    if (summaryFormData.includeBilling) {
      html += `
          <div class="section">
              <h2>💳 Billing & Revenue</h2>
              <div class="metrics-grid">
                  <div class="metric">
                      <div class="metric-value ${systemStats.totalBilled === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.totalBilled)}</div>
                      <div class="metric-label">Total Billed</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value ${systemStats.totalCollected === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.totalCollected)}</div>
                      <div class="metric-label">Total Collected</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value ${systemStats.outstandingAmount === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.outstandingAmount)}</div>
                      <div class="metric-label">Outstanding</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value ${systemStats.averagePayment === null ? 'no-data' : ''}">${getCurrencyOrNoData(systemStats.averagePayment)}</div>
                      <div class="metric-label">Average Payment</div>
                  </div>
              </div>
          </div>
      `;
    }

    // ✅ FIXED: Growth Analytics with REAL DATA ONLY
    if (summaryFormData.includeAnalytics) {
      html += `
          <div class="section">
              <h2>📊 Growth Analytics</h2>
              <div class="metrics-grid">
                  <div class="metric">
                      <div class="metric-value">${systemStats.patientGrowth !== null ? systemStats.patientGrowth + '%' : 'No data entered'}</div>
                      <div class="metric-label">Patient Growth</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${systemStats.revenueGrowth !== null ? systemStats.revenueGrowth + '%' : 'No data entered'}</div>
                      <div class="metric-label">Revenue Growth</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${systemStats.appointmentGrowth !== null ? systemStats.appointmentGrowth + '%' : 'No data entered'}</div>
                      <div class="metric-label">Appointment Growth</div>
                  </div>
                  <div class="metric">
                      <div class="metric-value">${systemStats.satisfactionScore !== null ? systemStats.satisfactionScore + '%' : 'No data entered'}</div>
                      <div class="metric-label">Satisfaction Score</div>
                  </div>
              </div>
          </div>
      `;
    }

    html += `
              <div class="footer">
                  <p>📋 This report was generated automatically by the Hospital Management System</p>
                  <p>© ${new Date().getFullYear()} Your Hospital Name - All rights reserved</p>
                  <p>For questions about this report, contact: ${admin?.email || 'admin@hospital.com'}</p>
                  <p><strong>📊 Patient Numbers:</strong> Total: ${systemStats.totalPatients}, Active: ${systemStats.activePatients}, New: ${systemStats.newPatients}</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const newWindow = window.open();
    newWindow.document.write(html);
    newWindow.document.close();
  };

  // ✅ FIXED: CSV Report with REAL DATA ONLY (no random numbers)
  const generateFrontendCSVReport = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let csvContent = `Hospital Summary Report\n`;
    csvContent += `Period,${monthNames[summaryFormData.month - 1]} ${summaryFormData.year}\n`;
    csvContent += `Generated,${new Date().toLocaleString()}\n`;
    csvContent += `Generated By,${admin?.name || 'System Administrator'}\n\n`;

    if (summaryFormData.includeFinancials) {
      csvContent += `Financial Summary\n`;
      csvContent += `Total Revenue,${getCurrencyOrNoData(systemStats.totalRevenue)}\n`;
      csvContent += `Total Expenses,${getCurrencyOrNoData(systemStats.totalExpenses)}\n`;
      csvContent += `Net Profit,${getCurrencyOrNoData(systemStats.netProfit)}\n`;
      csvContent += `Appointment Revenue,${getCurrencyOrNoData(systemStats.appointmentRevenue)}\n\n`;
    }

    if (summaryFormData.includePatients) {
      csvContent += `Patient Statistics\n`;
      csvContent += `Total Patients,${getValueOrNoData(systemStats.totalPatients)}\n`;
      csvContent += `New Patients,${getValueOrNoData(systemStats.newPatients)}\n`;
      csvContent += `Active Patients,${getValueOrNoData(systemStats.activePatients)}\n`;
      csvContent += `Appointments Completed,${getValueOrNoData(systemStats.completedAppointments)}\n\n`;
    }

    if (summaryFormData.includeStaff) {
      csvContent += `Staff Overview\n`;
      csvContent += `Total Staff,${getValueOrNoData(systemStats.totalStaff)}\n`;
      csvContent += `Doctors,${getValueOrNoData(systemStats.staffBreakdown?.doctor)}\n`;
      csvContent += `Nurses,${getValueOrNoData(systemStats.staffBreakdown?.nurse)}\n`;
      csvContent += `Receptionists,${getValueOrNoData(systemStats.staffBreakdown?.receptionist)}\n\n`;
    }

    if (summaryFormData.includeAppointments) {
      csvContent += `Appointment Analytics\n`;
      csvContent += `Total Appointments,${getValueOrNoData(systemStats.totalAppointments)}\n`;
      csvContent += `Completed Appointments,${getValueOrNoData(systemStats.completedAppointments)}\n`;
      csvContent += `Cancelled Appointments,${getValueOrNoData(systemStats.cancelledAppointments)}\n`;
      csvContent += `Pending Appointments,${getValueOrNoData(systemStats.pendingAppointments)}\n\n`;
    }

    if (summaryFormData.includeBilling) {
      csvContent += `Billing & Revenue\n`;
      csvContent += `Total Billed,${getCurrencyOrNoData(systemStats.totalBilled)}\n`;
      csvContent += `Total Collected,${getCurrencyOrNoData(systemStats.totalCollected)}\n`;
      csvContent += `Outstanding Amount,${getCurrencyOrNoData(systemStats.outstandingAmount)}\n`;
      csvContent += `Average Payment,${getCurrencyOrNoData(systemStats.averagePayment)}\n\n`;
    }

    if (summaryFormData.includeAnalytics) {
      csvContent += `Growth Analytics\n`;
      csvContent += `Patient Growth,${systemStats.patientGrowth !== null ? systemStats.patientGrowth + '%' : 'No data entered'}\n`;
      csvContent += `Revenue Growth,${systemStats.revenueGrowth !== null ? systemStats.revenueGrowth + '%' : 'No data entered'}\n`;
      csvContent += `Appointment Growth,${systemStats.appointmentGrowth !== null ? systemStats.appointmentGrowth + '%' : 'No data entered'}\n`;
      csvContent += `Satisfaction Score,${systemStats.satisfactionScore !== null ? systemStats.satisfactionScore + '%' : 'No data entered'}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hospital_Report_${summaryFormData.month}_${summaryFormData.year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateFrontendPDFReport = () => {
    // For PDF, we'll generate HTML and let the user print it as PDF
    generateFrontendHTMLReport();
    
    // Add a message about PDF generation
    setTimeout(() => {
      alert('📄 To save as PDF: Use your browser\'s Print function (Ctrl+P) and select "Save as PDF" as the destination.');
    }, 1000);
  };

  const generateSummaryReport = async () => {
    try {
      setGenerateLoading(true);
      
      console.log('📊 Generating summary report with REAL data:', summaryFormData);
      console.log('🏥 Current patient numbers:', {
        total: systemStats.totalPatients,
        active: systemStats.activePatients,
        new: systemStats.newPatients
      });
      
      // Validate form data
      const sectionsSelected = Object.values({
        includeFinancials: summaryFormData.includeFinancials,
        includePatients: summaryFormData.includePatients,
        includeStaff: summaryFormData.includeStaff,
        includeAppointments: summaryFormData.includeAppointments,
        includeBilling: summaryFormData.includeBilling,
        includeAnalytics: summaryFormData.includeAnalytics
      }).some(Boolean);

      if (!sectionsSelected) {
        alert('Please select at least one section to include in the report.');
        return;
      }
      
      // Try API first, fallback to frontend generation
      try {
        // First try the API call
        const response = await adminDashboardApi.generateSummaryReport(summaryFormData);
        
        if (response.success) {
          handleSuccessfulReport(response);
        } else {
          throw new Error(response.message);
        }
        
      } catch (apiError) {
        console.warn('⚠️ API route not available, generating frontend report with REAL data:', apiError.message);
        
        // Fallback to frontend generation WITH REAL DATA
        if (summaryFormData.reportFormat === 'html') {
          generateFrontendHTMLReport();
        } else if (summaryFormData.reportFormat === 'pdf') {
          generateFrontendPDFReport();
        } else if (summaryFormData.reportFormat === 'excel') {
          generateFrontendCSVReport();
        }
      }
      
      console.log('✅ Report generated successfully with patient numbers:', {
        totalPatients: systemStats.totalPatients,
        activePatients: systemStats.activePatients,
        newPatients: systemStats.newPatients
      });
      setShowSummaryModal(false);
      alert('✅ Report generated successfully with real patient data!');
      
    } catch (error) {
      console.error('❌ Error generating summary report:', error);
      alert('❌ Error generating report: ' + error.message);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleSuccessfulReport = (response) => {
    const filename = `Hospital_Report_${summaryFormData.month}_${summaryFormData.year}`;
    
    if (summaryFormData.reportFormat === 'pdf') {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (summaryFormData.reportFormat === 'excel') {
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename + '.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (summaryFormData.reportFormat === 'html') {
      const newWindow = window.open();
      newWindow.document.write(response.data);
      newWindow.document.close();
    }
  };

  // Get month name
  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  // Better loading state handling
  if (loading) {
    return (
      <AdminErrorBoundary>
        <div className="admin-loading-container">
          <div className="admin-loading-content">
            <div className="loading-spinner"></div>
            <h2>Loading Admin Dashboard...</h2>
            <p>Verifying your admin session</p>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  // Better error state handling
  if (error && !admin) {
    return (
      <AdminErrorBoundary>
        <div className="admin-error-container">
          <div className="admin-error-content">
            <h2>⚠️ Dashboard Error</h2>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry
              </button>
              <button 
                onClick={() => navigate('/admin/login')}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔑 Re-login
              </button>
            </div>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  // Final safety check
  if (!admin || !admin.role) {
    return (
      <AdminErrorBoundary>
        <div className="admin-auth-error">
          <div className="admin-error-content">
            <h2>Authentication Required</h2>
            <p>Redirecting to login...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminLayout admin={admin} title="System Administrator Dashboard">
        <div className="admin-dashboard">
          {/* Header with actions */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>📊 System Administrator Dashboard</h1>
              <div className="header-actions">
                <button onClick={() => window.open('/', '_blank')} className="homepage-btn">
                  🏠 Homepage
                </button>
                <button onClick={toggleRealTimeProfiles} className="profiles-btn">
                  {showProfiles ? '📋 Hide Profiles' : '📋 Real-Time Profiles'}
                </button>
                <button onClick={toggleAllUsers} className="all-users-btn">
                  {showAllUsers ? '👥 Hide All Users' : '👥 Show All Users'}
                </button>
                <button onClick={refreshData} className="refresh-btn">
                  🔄 Refresh
                </button>
                {systemStats.lastUpdated && (
                  <span className="last-updated" style={{ color: '#fff' }}>
                    Last updated: {new Date(systemStats.lastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* All Users Management Section */}
          {showAllUsers && (
            <div className="all-users-management-section">
              <div className="section-header">
                <h2>👥 Complete Users Database (Click to View Details)</h2>
                <div className="section-actions">
                  <button onClick={loadAllUsers} className="refresh-users-btn" disabled={usersLoading}>
                    {usersLoading ? '⏳ Loading...' : '🔄 Refresh Users'}
                  </button>
                  <span className="users-count">
                    Total: {userPagination.totalCount || allUsers.length} users
                  </span>
                </div>
              </div>

              {/* User Filters */}
              <div className="user-filters">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>🔍 Search:</label>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userFilters.search}
                      onChange={(e) => handleUserFilterChange('search', e.target.value)}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="filter-group">
                    <label>👤 Type:</label>
                    <select
                      value={userFilters.type}
                      onChange={(e) => handleUserFilterChange('type', e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Users</option>
                      <option value="patients">Patients Only</option>
                      <option value="staff">Staff Only</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>✅ Status:</label>
                    <select
                      value={userFilters.status}
                      onChange={(e) => handleUserFilterChange('status', e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="verified">Verified/Active</option>
                      <option value="pending">Pending/Inactive</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>📊 Sort:</label>
                    <select
                      value={userFilters.sortBy}
                      onChange={(e) => handleUserFilterChange('sortBy', e.target.value)}
                      className="filter-select"
                    >
                      <option value="createdAt">Registration Date</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="lastActivity">Last Activity</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>🔄 Order:</label>
                    <select
                      value={userFilters.sortOrder}
                      onChange={(e) => handleUserFilterChange('sortOrder', e.target.value)}
                      className="filter-select"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="users-table-container">
                {usersLoading ? (
                  <div className="table-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading users...</p>
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="no-users-message">
                    <h3>No users found</h3>
                    <p>Try adjusting your search filters</p>
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>👤 User</th>
                        <th>📧 Email</th>
                        <th>🏷️ Type</th>
                        <th>✅ Status</th>
                        <th>🏢 Department</th>
                        <th>📅 Registered</th>
                        <th>🕒 Last Activity</th>
                        <th>🔧 Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user, index) => (
                        <tr key={user._id || index} className="user-row clickable-row">
                          <td className="user-info">
                            <div className="user-avatar">
                              {user.type === 'patient' ? '👤' : 
                               user.role === 'doctor' ? '👩‍⚕️' :
                               user.role === 'receptionist' ? '👩‍💼' :
                               user.role === 'admin' ? '👨‍💼' : '💰'}
                            </div>
                            <div className="user-details">
                              <strong>{user.name}</strong>
                              <small>ID: {user._id?.slice(-6)}</small>
                              {user.employeeId && <small>EMP: {user.employeeId}</small>}
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`type-badge ${user.type}`}>
                              {user.type === 'patient' ? 'Patient' : 'Staff'}
                            </span>
                            {user.role && user.role !== 'patient' && (
                              <small className="role-subtitle">{user.role}</small>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${user.status}`}>
                              {user.status === 'verified' || user.status === 'active' ? '✅ Active' : '⏳ Pending'}
                            </span>
                          </td>
                          <td>
                            <span className="department-badge">
                              {user.department || (user.type === 'patient' ? 'Patient Care' : 'General')}
                            </span>
                          </td>
                          <td>
                            {user.registrationDate 
                              ? new Date(user.registrationDate).toLocaleDateString() 
                              : 'N/A'}
                          </td>
                          <td>
                            {user.lastActivity 
                              ? new Date(user.lastActivity).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="actions">
                            <div className="action-buttons">
                              <button
                                onClick={() => handleProfileClick(user)}
                                className="action-btn view-btn"
                                title="View Details"
                              >
                                👁️
                              </button>
                              <button
                                onClick={() => {
                                  console.log('Edit user:', user);
                                  // Add edit functionality here
                                }}
                                className="action-btn edit-btn"
                                title="Edit User"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  if (user.type === 'patient') {
                                    navigate(`/admin/patient/${user._id}`);
                                  } else {
                                    navigate(`/admin/staff/${user._id}`);
                                  }
                                }}
                                className="action-btn manage-btn"
                                title="Manage User"
                              >
                                🔧
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {userPagination.totalPages > 1 && (
                <div className="pagination">
                  <div className="pagination-info">
                    Showing {allUsers.length} of {userPagination.totalCount} users
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() => handleUserFilterChange('page', userPagination.currentPage - 1)}
                      disabled={!userPagination.hasPrevPage}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>
                    
                    <span className="page-info">
                      Page {userPagination.currentPage} of {userPagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handleUserFilterChange('page', userPagination.currentPage + 1)}
                      disabled={!userPagination.hasNextPage}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Profiles Section - Clickable */}
          {showProfiles && (
            <div className="realtime-profiles-section">
              <div className="profiles-header">
                <h2>👥 Real-Time Profile List (Click to View Details)</h2>
                {profilesLoading && <div className="mini-spinner">⏳</div>}
              </div>
              <div className="profiles-grid">
                {realTimeProfiles.map((profile, index) => (
                  <div 
                    key={profile._id || index} 
                    className={`profile-card ${profile.type} clickable-profile`}
                    onClick={() => handleProfileClick(profile)}
                    title="Click to view profile details"
                  >
                    <div className="profile-avatar">
                      {profile.type === 'patient' ? '👤' : 
                       profile.role === 'doctor' ? '👩‍⚕️' :
                       profile.role === 'receptionist' ? '👩‍💼' :
                       profile.role === 'financial_manager' ? '💰' : '👨‍💼'}
                    </div>
                    <div className="profile-info">
                      <h4>{profile.name}</h4>
                      <p>{profile.email}</p>
                      <div className="profile-meta">
                        <span className={`role-badge ${profile.role || profile.type}`}>
                          {profile.role || profile.type}
                        </span>
                        <span className={`status-badge ${profile.status}`}>
                          {profile.status}
                        </span>
                      </div>
                      <small>
                        Last activity: {new Date(profile.lastActivity).toLocaleString()}
                      </small>
                    </div>
                    <div className="profile-click-indicator">
                      👆 Click to view
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ✅ ENHANCED: Statistics Grid with REAL PATIENT NUMBERS and SAME ICONS */}
          <div className="stats-grid">
            <div className="stat-card users">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{systemStats.totalUsers.toLocaleString()}</h3>
                <p>Total Users</p>
                <small>
                  ✅ {systemStats.verifiedUsers} verified | 
                  ⏳ {systemStats.unverifiedUsers} pending
                </small>
              </div>
            </div>
            
            <div className="stat-card staff">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-info">
                <h3>{systemStats.totalStaff.toLocaleString()}</h3>
                <p>Staff Members</p>
                <small>
                  Admin: {systemStats.staffBreakdown?.admin || 0} | 
                  Doctors: {systemStats.staffBreakdown?.doctor || 0}
                </small>
              </div>
            </div>
            
            {/* ✅ ENHANCED: Patients card with REAL numbers */}
            <div className="stat-card patients">
              <div className="stat-icon">🏥</div>
              <div className="stat-info">
                <h3>{systemStats.totalPatients.toLocaleString()}</h3>
                <p>Total Patients</p>
                <small>
                  Active: {systemStats.activePatients || systemStats.totalPatients} | 
                  New: {systemStats.newPatients || systemStats.recentRegistrations}
                </small>
              </div>
            </div>
            
            <div className="stat-card health">
              <div className="stat-icon">
                {systemStats.systemHealth === 'healthy' ? '✅' : 
                 systemStats.systemHealth === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="stat-info">
                <h3 className={`status-${systemStats.systemHealth}`}>
                  {systemStats.systemHealth.charAt(0).toUpperCase() + systemStats.systemHealth.slice(1)}
                </h3>
                <p>System Status</p>
              </div>
            </div>
          </div>

          {/* Dashboard Access Section - 3 Role-based Buttons */}
          <div className="dashboard-access-section">
            <h2>🎛️ Role-Based Dashboard Access</h2>
            <div className="role-dashboard-grid">
              <button 
                className="role-dashboard-btn receptionist-btn"
                onClick={() => handleDashboardAccess('receptionist')}
              >
                <div className="dashboard-icon">👩‍💼</div>
                <div className="dashboard-info">
                  <h4>Receptionist Dashboard</h4>
                  <p>Appointment scheduling & patient management</p>
                  <div className="dashboard-stats">
                    <small>
                      Staff: {dashboardRoleAccess.roleAccess?.receptionist?.count || 0} | 
                      Features: Appointments, Check-ins
                    </small>
                  </div>
                </div>
                <div className="access-indicator">
                  {dashboardRoleAccess.roleAccess?.receptionist?.accessible ? '✅' : '🔒'}
                </div>
              </button>

              <button 
                className="role-dashboard-btn doctor-btn"
                onClick={() => handleDashboardAccess('doctor')}
              >
                <div className="dashboard-icon">👩‍⚕️</div>
                <div className="dashboard-info">
                  <h4>Doctor Dashboard</h4>
                  <p>Medical records & patient consultations</p>
                  <div className="dashboard-stats">
                    <small>
                      Staff: {dashboardRoleAccess.roleAccess?.doctor?.count || 0} | 
                      Features: Records, Prescriptions
                    </small>
                  </div>
                </div>
                <div className="access-indicator">
                  {dashboardRoleAccess.roleAccess?.doctor?.accessible ? '✅' : '🔒'}
                </div>
              </button>

              <button 
                className="role-dashboard-btn financial-btn"
                onClick={() => handleDashboardAccess('financial')}
              >
                <div className="dashboard-icon">💰</div>
                <div className="dashboard-info">
                  <h4>Financial Manager Dashboard</h4>
                  <p>Billing, payments & financial reports</p>
                  <div className="dashboard-stats">
                    <small>
                      Staff: {dashboardRoleAccess.roleAccess?.financial_manager?.count || 0} | 
                      Features: Billing, Reports
                    </small>
                  </div>
                </div>
                <div className="access-indicator">
                  {dashboardRoleAccess.roleAccess?.financial_manager?.accessible ? '✅' : '🔒'}
                </div>
              </button>
            </div>
          </div>

          {/* User Management Section */}
          <div className="user-management-section">
            <h2>👥 User Management System</h2>
            <div className="user-management-grid">
              <button 
                className="user-management-btn all-users-btn"
                onClick={() => navigate('/admin/users')}
              >
                <div className="dashboard-icon">👥</div>
                <div className="dashboard-info">
                  <h4>All Users Management</h4>
                  <p>View, search & manage all system users - patients and staff members</p>
                  <div className="dashboard-stats">
                    <small>
                      Total Users: {systemStats.totalUsers} | 
                      Patients: {systemStats.totalPatients} | 
                      Staff: {systemStats.totalStaff} | 
                      Verified: {systemStats.verifiedUsers}
                    </small>
                  </div>
                </div>
                <div className="access-indicator">✅</div>
              </button>
              
              <button 
                className="user-management-btn patients-only-btn"
                onClick={() => navigate('/admin/patients')}
              >
                <div className="dashboard-icon">🏥</div>
                <div className="dashboard-info">
                  <h4>Patients Only</h4>
                  <p>Dedicated patient management interface with medical records & appointments</p>
                  <div className="dashboard-stats">
                    <small>
                      Active Patients: {systemStats.totalPatients} | 
                      Recent: {systemStats.recentRegistrations} | 
                      Growth: {systemStats.monthlyGrowth}%
                    </small>
                  </div>
                </div>
                <div className="access-indicator">✅</div>
              </button>

              <button 
                className="user-management-btn staff-only-btn"
                onClick={() => navigate('/admin/staff')}
              >
                <div className="dashboard-icon">👨‍⚕️</div>
                <div className="dashboard-info">
                  <h4>Staff Management</h4>
                  <p>Manage hospital staff, roles, permissions & department assignments</p>
                  <div className="dashboard-stats">
                    <small>
                      Total Staff: {systemStats.totalStaff} | 
                      Admins: {systemStats.staffBreakdown?.admin || 0} | 
                      Doctors: {systemStats.staffBreakdown?.doctor || 0}
                    </small>
                  </div>
                </div>
                <div className="access-indicator">🔧</div>
              </button>
            </div>
          </div>

          {/* Inventory Management Section */}
          <div className="inventory-management-section">
            <h2>🏥 Inventory Management System</h2>
            <div className="inventory-dashboard-grid">
              <button 
                className="inventory-dashboard-btn surgical-items-btn"
                onClick={() => navigate('/admin/surgical-items')}
              >
                <div className="dashboard-icon">🔧</div>
                <div className="dashboard-info">
                  <h4>Surgical Items Management</h4>
                  <p>Manage surgical instruments, supplies & medical equipment inventory</p>
                  <div className="dashboard-stats">
                    <small>
                      Track stock levels, usage patterns, supplier information & automated alerts
                    </small>
                  </div>
                </div>
                <div className="access-indicator">✅</div>
              </button>
              
              <button 
                className="inventory-dashboard-btn reports-btn"
                onClick={() => navigate('/admin/documentations')}
              >
                <div className="dashboard-icon">📊</div>
                <div className="dashboard-info">
                  <h4>Inventory Reports & Analytics</h4>
                  <p>Generate detailed inventory analytics, usage reports & financial summaries</p>
                  <div className="dashboard-stats">
                    <small>
                      Low stock alerts, cost analysis, vendor performance & trend insights
                    </small>
                  </div>
                </div>
                <div className="access-indicator">✅</div>
              </button>

              <button 
                className="inventory-dashboard-btn procurement-btn"
                onClick={() => navigate('/admin/procurement')}
              >
                <div className="dashboard-icon">📦</div>
                <div className="dashboard-info">
                  <h4>Procurement & Suppliers</h4>
                  <p>Manage purchase orders, supplier relationships & automated restocking</p>
                  <div className="dashboard-stats">
                    <small>
                      Order tracking, supplier ratings, contract management & cost optimization
                    </small>
                  </div>
                </div>
                <div className="access-indicator">🔧</div>
              </button>
            </div>
          </div>

          {/* Recent Patient Profiles - Also Clickable */}
          <div className="patient-profiles-section">
            <h2>👨‍⚕️ Recent Patient Profiles (Click to View Details)</h2>
            <div className="patient-buttons-grid">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient, index) => (
                  <button 
                    key={patient._id || index} 
                    className="patient-profile-btn clickable-profile"
                    onClick={() => handleProfileClick({
                      _id: patient._id,
                      name: patient.name,
                      email: patient.email,
                      type: 'patient',
                      role: 'patient',
                      status: patient.isAccountVerified ? 'verified' : 'pending',
                      lastActivity: patient.createdAt
                    })}
                  >
                    <div className="patient-icon">👤</div>
                    <div className="patient-info">
                      <h4>{patient.name}</h4>
                      <p>{patient.email}</p>
                      <small>
                        {patient.isAccountVerified ? '✅ Verified' : '⏳ Pending'} | 
                        Registered: {new Date(patient.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="no-patients-message">
                  <p>No recent patients. System is ready for patient registration.</p>
                  <button className="patient-profile-btn" onClick={() => navigate('/admin/patients')}>
                    <div className="patient-icon">👥</div>
                    <div className="patient-info">
                      <h4>View All Patients</h4>
                      <p>Access complete patient database</p>
                      <small>Manage all registered patients</small>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ✅ ENHANCED: Growth Analytics with REAL patient numbers */}
          {(growthAnalytics || systemStats.recentRegistrations > 0) && (
            <div className="analytics-section">
              <h2>📈 Growth Analytics (Real Patient Data)</h2>
              <div className="analytics-cards">
                <div className="analytics-card">
                  <h4>📅 New Patient Registrations</h4>
                  <p className="big-number">{systemStats.recentRegistrations}</p>
                  <small>Last 7 days</small>
                </div>
                <div className="analytics-card">
                  <h4>📊 Patient Growth</h4>
                  <p className="big-number">{systemStats.patientGrowth || systemStats.monthlyGrowth}%</p>
                  <small>Last 30 days</small>
                </div>
                <div className="analytics-card">
                  <h4>🏥 Total Patients</h4>
                  <p className="big-number">{systemStats.totalPatients}</p>
                  <small>All registered patients</small>
                </div>
                <div className="analytics-card">
                  <h4>✅ Active Patients</h4>
                  <p className="big-number">{systemStats.activePatients || systemStats.totalPatients}</p>
                  <small>Currently active</small>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {activityLogs.length > 0 && (
            <div className="activity-section">
              <h2>🔄 Recent System Activity</h2>
              <div className="activity-list">
                {activityLogs.slice(0, 5).map((log, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {log.type === 'user_registration' ? '👤' : '🔐'}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>{log.user}</strong> 
                        {log.type === 'user_registration' 
                          ? ' registered as a new user' 
                          : ` logged in as ${log.role}`}
                      </p>
                      <small>{new Date(log.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Detail Modal */}
          <ProfileDetailModal
            isOpen={showProfileModal}
            onClose={closeProfileModal}
            profileId={selectedProfile?._id}
            profileType={selectedProfile?.type}
          />

          {/* Support Modal */}
          {showSupportModal && (
            <div className="support-modal-overlay" onClick={() => setShowSupportModal(false)}>
              <div className="support-modal" onClick={e => e.stopPropagation()}>
                <div className="support-modal-header">
                  <h3>💬 Contact Support</h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowSupportModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="support-modal-body">
                  <div className="support-options">
                    <button 
                      className="support-option"
                      onClick={() => {
                        handleContactSupport();
                        setShowSupportModal(false);
                      }}
                    >
                      📧 Send Email
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('tel:+1234567890');
                        setShowSupportModal(false);
                      }}
                    >
                      📞 Call Support
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('https://your-chat-support.com', '_blank');
                        setShowSupportModal(false);
                      }}
                    >
                      💬 Live Chat
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('https://your-knowledge-base.com', '_blank');
                        setShowSupportModal(false);
                      }}
                    >
                      📚 Knowledge Base
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Report Modal */}
          {showSummaryModal && (
            <div className="summary-modal-overlay" onClick={() => setShowSummaryModal(false)}>
              <div className="summary-modal" onClick={e => e.stopPropagation()}>
                <div className="summary-modal-header">
                  <h3>📊 Generate Summary Report</h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowSummaryModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="summary-modal-body">
                  <form className="summary-form">
                    {/* ✅ ENHANCED: Show current patient numbers in form */}
                    <div className="form-group">
                      <label>🏥 Current Patient Numbers</label>
                      <div className="patient-numbers-preview">
                        <div className="number-item">
                          <span className="label">Total Patients:</span>
                          <span className="value">{systemStats.totalPatients}</span>
                        </div>
                        <div className="number-item">
                          <span className="label">Active Patients:</span>
                          <span className="value">{systemStats.activePatients || systemStats.totalPatients}</span>
                        </div>
                        <div className="number-item">
                          <span className="label">New Patients:</span>
                          <span className="value">{systemStats.newPatients || systemStats.recentRegistrations}</span>
                        </div>
                      </div>
                    </div>

                    {/* Report Type */}
                    <div className="form-group">
                      <label>📋 Report Type</label>
                      <select
                        value={summaryFormData.reportType}
                        onChange={(e) => handleSummaryFormChange('reportType', e.target.value)}
                        className="form-control"
                      >
                        <option value="monthly">Monthly Summary</option>
                        <option value="quarterly">Quarterly Summary</option>
                        <option value="annual">Annual Summary</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    {/* Month and Year Selection */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>📅 Month</label>
                        <select
                          value={summaryFormData.month}
                          onChange={(e) => handleSummaryFormChange('month', parseInt(e.target.value))}
                          className="form-control"
                        >
                          {Array.from({length: 12}, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {getMonthName(i + 1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>🗓️ Year</label>
                        <select
                          value={summaryFormData.year}
                          onChange={(e) => handleSummaryFormChange('year', parseInt(e.target.value))}
                          className="form-control"
                        >
                          {Array.from({length: 5}, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={year} value={year}>{year}</option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Report Sections */}
                    <div className="form-group">
                      <label>📑 Include Sections</label>
                      <div className="checkbox-grid">
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={summaryFormData.includeFinancials}
                            onChange={(e) => handleSummaryFormChange('includeFinancials', e.target.checked)}
                          />
                          <span>💰 Financial Summary</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={summaryFormData.includePatients}
                            onChange={(e) => handleSummaryFormChange('includePatients', e.target.checked)}
                          />
                          <span>👥 Patient Statistics (Real Numbers)</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={summaryFormData.includeStaff}
                            onChange={(e) => handleSummaryFormChange('includeStaff', e.target.checked)}
                          />
                          <span>👨‍⚕️ Staff Performance</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={summaryFormData.includeAppointments}
                            onChange={(e) => handleSummaryFormChange('includeAppointments', e.target.checked)}
                          />
                          <span>📅 Appointments</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={summaryFormData.includeBilling}
                            onChange={(e) => handleSummaryFormChange('includeBilling', e.target.checked)}
                          />
                          <span>💳 Billing & Revenue</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={summaryFormData.includeAnalytics}
                            onChange={(e) => handleSummaryFormChange('includeAnalytics', e.target.checked)}
                          />
                          <span>📊 Growth Analytics</span>
                        </label>
                      </div>
                    </div>

                    {/* Format Selection */}
                    <div className="form-group">
                      <label>📄 Report Format</label>
                      <div className="format-selection">
                        <label className="format-option">
                          <input
                            type="radio"
                            name="reportFormat"
                            value="html"
                            checked={summaryFormData.reportFormat === 'html'}
                            onChange={(e) => handleSummaryFormChange('reportFormat', e.target.value)}
                          />
                          <span>🌐 Web Preview</span>
                        </label>
                        <label className="format-option">
                          <input
                            type="radio"
                            name="reportFormat"
                            value="pdf"
                            checked={summaryFormData.reportFormat === 'pdf'}
                            onChange={(e) => handleSummaryFormChange('reportFormat', e.target.value)}
                          />
                          <span>📄 PDF Document</span>
                        </label>
                        <label className="format-option">
                          <input
                            type="radio"
                            name="reportFormat"
                            value="excel"
                            checked={summaryFormData.reportFormat === 'excel'}
                            onChange={(e) => handleSummaryFormChange('reportFormat', e.target.value)}
                          />
                          <span>📊 Excel/CSV</span>
                        </label>
                      </div>
                    </div>

                    {/* Report Preview */}
                    <div className="report-preview">
                      <h4>📋 Report Summary</h4>
                      <p>
                        <strong>Period:</strong> {getMonthName(summaryFormData.month)} {summaryFormData.year}
                      </p>
                      <p>
                        <strong>Patient Data:</strong> {systemStats.totalPatients} total, {systemStats.activePatients || systemStats.totalPatients} active
                      </p>
                      <p>
                        <strong>Sections:</strong> {
                          [
                            summaryFormData.includeFinancials && 'Financial',
                            summaryFormData.includePatients && 'Patients',
                            summaryFormData.includeStaff && 'Staff',
                            summaryFormData.includeAppointments && 'Appointments',
                            summaryFormData.includeBilling && 'Billing',
                            summaryFormData.includeAnalytics && 'Analytics'
                          ].filter(Boolean).join(', ') || 'None selected'
                        }
                      </p>
                      <p>
                        <strong>Format:</strong> {summaryFormData.reportFormat.toUpperCase()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => setShowSummaryModal(false)}
                        className="btn-cancel"
                      >
                        ❌ Cancel
                      </button>
                      <button
                        type="button"
                        onClick={generateSummaryReport}
                        disabled={generateLoading}
                        className="btn-generate"
                      >
                        {generateLoading ? (
                          <>⏳ Generating Report...</>
                        ) : (
                          <>📊 Generate Report with Real Data</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Buttons */}
          <div className="floating-action-buttons">
            <button 
              className="fab-button print-button"
              onClick={handlePrint}
              title="Print Dashboard"
            >
              🖨️
            </button>
            <button 
              className="fab-button support-button"
              onClick={() => setShowSupportModal(true)}
              title="Contact Support"
            >
              💬
            </button>
            <button 
              className="fab-button summary-button"
              onClick={handleSummaryReport}
              title="Generate Summary Report"
            >
              📊
            </button>
          </div>
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default AdminDashboard;
