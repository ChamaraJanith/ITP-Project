import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import AdminErrorBoundary from '../AdminErrorBoundary';
import ProfileDetailModal from '../../admin/ProfileDetailModal.jsx';
import { adminDashboardApi } from '../../../services/adminApi.js';
import axios from 'axios';
import './AdminDashboard.css';

// ✅ CONSTANTS
const REFRESH_INTERVALS = {
  PATIENT_DATA: 3000000, // 5 minutes
  PROFILES: 3000000, // 30 seconds
};

const API_ENDPOINTS = {
  PATIENT_DETAILS: 'http://localhost:7000/api/patients/count/detailed',
};

const INITIAL_SYSTEM_STATS = {
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
  satisfactionScore: null,
  todayPatients: 0,
  thisMonthPatients: 0,
  genderBreakdown: [],
  bloodGroupBreakdown: [],
  ageGroupBreakdown: []
};

const INITIAL_USER_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  type: 'all',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const INITIAL_SUMMARY_FORM_DATA = {
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
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // ✅ ENHANCED STATE MANAGEMENT
  const [admin, setAdmin] = useState(null);
  const [realPatientData, setRealPatientData] = useState(null);
  const [patientDataLoading, setPatientDataLoading] = useState(false);
  const [patientDataError, setPatientDataError] = useState(null);
  const [systemStats, setSystemStats] = useState(INITIAL_SYSTEM_STATS);
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
  const [summaryFormData, setSummaryFormData] = useState(INITIAL_SUMMARY_FORM_DATA);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userFilters, setUserFilters] = useState(INITIAL_USER_FILTERS);
  const [userPagination, setUserPagination] = useState({});

  // ✅ ENHANCED FETCH REAL PATIENT DATA WITH BETTER ERROR HANDLING
  const fetchRealPatientData = useCallback(async () => {
    try {
      setPatientDataLoading(true);
      setPatientDataError(null);
      
      console.log('🔄 Fetching real patient data from database...');
      
      const response = await axios.get(API_ENDPOINTS.PATIENT_DETAILS, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data?.success) {
        const data = response.data.data;
        setRealPatientData(data);
        
        // ✅ ENHANCED CALCULATIONS WITH VALIDATION
        const totalPatients = data.totalPatients || 0;
        const thisMonthPatients = data.thisMonthPatients || 0;
        const todayPatients = data.todayPatients || 0;
        
        const growthRate = totalPatients > 0 && thisMonthPatients > 0 ? 
          Math.round(((thisMonthPatients / (totalPatients - thisMonthPatients)) * 100)) : 0;
        
        setSystemStats(prev => ({
          ...prev,
          totalPatients,
          activePatients: totalPatients,
          newPatients: thisMonthPatients,
          recentRegistrations: todayPatients,
          todayPatients,
          thisMonthPatients,
          monthlyGrowth: Math.max(0, growthRate), // Ensure non-negative
          patientGrowth: Math.max(0, growthRate),
          genderBreakdown: data.genderCounts || [],
          bloodGroupBreakdown: data.bloodGroupCounts || [],
          ageGroupBreakdown: data.ageGroupCounts || [],
          lastUpdated: new Date()
        }));
        
        console.log('✅ patient data updated successfully:', {
          totalPatients,
          thisMonth: thisMonthPatients,
          today: todayPatients,
          growthRate: `${growthRate}%`
        });
        
      } else {
        throw new Error(response.data?.message || 'Failed to fetch patient data');
      }
    } catch (error) {
      console.error('❌ Error fetching patient data:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch database numbers';
      setPatientDataError(errorMessage);
    } finally {
      setPatientDataLoading(false);
    }
  }, []);

  // ✅ ENHANCED ADMIN AUTHENTICATION WITH BETTER VALIDATION
  const validateAndSetAdmin = useCallback((adminData) => {
    if (!adminData) return false;
    
    try {
      const parsedAdmin = typeof adminData === 'string' ? JSON.parse(adminData) : adminData;
      
      if (!parsedAdmin?.role || !parsedAdmin?.email) {
        throw new Error('Invalid admin data structure');
      }
      
      if (parsedAdmin.role !== 'admin') {
        console.log('⚠️ Non-admin user trying to access admin dashboard');
        navigate('/admin/login');
        return false;
      }
      
      setAdmin(parsedAdmin);
      return true;
    } catch (parseError) {
      console.error('❌ Error parsing admin data:', parseError);
      localStorage.removeItem('admin');
      navigate('/admin/login');
      return false;
    }
  }, [navigate]);

  // ✅ ENHANCED DASHBOARD INITIALIZATION
  const initializeDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check local storage first
      const adminData = localStorage.getItem('admin');
      if (adminData && validateAndSetAdmin(adminData)) {
        await loadDashboardData();
        return;
      }
      
      // Fallback to server session verification
      try {
        const sessionCheck = await adminDashboardApi.verifyAdminSession();
        if (sessionCheck?.success && sessionCheck.data?.role === 'admin') {
          localStorage.setItem('admin', JSON.stringify(sessionCheck.data));
          if (validateAndSetAdmin(sessionCheck.data)) {
            await loadDashboardData();
            return;
          }
        }
      } catch (sessionError) {
        console.error('❌ Session verification error:', sessionError);
      }
      
      // If we reach here, authentication failed
      navigate('/admin/login');
      
    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      setError('Failed to initialize dashboard');
      localStorage.removeItem('admin');
      setTimeout(() => navigate('/admin/login'), 2000);
    } finally {
      setLoading(false);
    }
  }, [navigate, validateAndSetAdmin]);

  // ✅ ENHANCED LOAD DASHBOARD DATA WITH BETTER ERROR HANDLING
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Load main dashboard stats
      try {
        const statsResponse = await adminDashboardApi.getDashboardStats();
        
        if (statsResponse?.success) {
          const data = statsResponse.data;
          
          setSystemStats(prev => ({
            ...prev,
            totalUsers: data.totalUsers || 0,
            totalStaff: data.totalStaff || 0,
            verifiedUsers: data.verifiedUsers || 0,
            unverifiedUsers: data.unverifiedUsers || 0,
            staffBreakdown: data.staffBreakdown || {},
            systemHealth: data.systemHealth?.status || 'healthy',
            totalRevenue: data.totalRevenue || null,
            totalExpenses: data.totalExpenses || null,
            netProfit: data.netProfit || null,
            appointmentRevenue: data.appointmentRevenue || null,
            totalAppointments: data.totalAppointments || null,
            completedAppointments: data.completedAppointments || null,
            cancelledAppointments: data.cancelledAppointments || null,
            pendingAppointments: data.pendingAppointments || null,
            totalBilled: data.totalBilled || null,
            totalCollected: data.totalCollected || null,
            outstandingAmount: data.outstandingAmount || null,
            averagePayment: data.averagePayment || null,
            revenueGrowth: data.revenueGrowth || null,
            appointmentGrowth: data.appointmentGrowth || null,
            satisfactionScore: data.satisfactionScore || null
          }));

          setRecentPatients(data.recentPatients || []);
          console.log('✅ Dashboard stats loaded successfully');
        }
      } catch (statsError) {
        console.warn('⚠️ Dashboard stats not available:', statsError);
      }

      // Load additional data with individual error handling
      const loadPromises = [
        loadGrowthAnalytics(),
        loadActivityLogs(),
        loadDashboardRoleAccess()
      ];

      await Promise.allSettled(loadPromises);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ HELPER FUNCTIONS FOR LOADING DATA
  const loadGrowthAnalytics = useCallback(async () => {
    try {
      const analyticsResponse = await adminDashboardApi.getUserGrowthAnalytics(7);
      if (analyticsResponse?.success) {
        setGrowthAnalytics(analyticsResponse.data);
      }
    } catch (error) {
      console.warn('⚠️ Analytics not available:', error);
    }
  }, []);

  const loadActivityLogs = useCallback(async () => {
    try {
      const logsResponse = await adminDashboardApi.getSystemActivityLogs(10);
      if (logsResponse?.success) {
        setActivityLogs(logsResponse.data.activityLogs || []);
      }
    } catch (error) {
      console.warn('⚠️ Activity logs not available:', error);
    }
  }, []);

  const loadDashboardRoleAccess = useCallback(async () => {
    try {
      const roleAccessResponse = await adminDashboardApi.getDashboardRoleAccess();
      if (roleAccessResponse?.success) {
        setDashboardRoleAccess(roleAccessResponse.data);
      }
    } catch (error) {
      console.warn('⚠️ Role access not available:', error);
    }
  }, []);

  // ✅ ENHANCED LOAD  TIME PROFILES
  const loadRealTimeProfiles = useCallback(async () => {
    try {
      setProfilesLoading(true);
      const response = await adminDashboardApi.getRealTimeProfiles('all', 1, 20);
      
      if (response?.success) {
        setRealTimeProfiles(response.data.profiles || []);
        console.log('✅ Real-time profiles updated');
      }
    } catch (error) {
      console.error('❌ Error loading real-time profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  // ✅ ENHANCED LOAD ALL USERS
  const loadAllUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await adminDashboardApi.getAllProfilesDetailed(userFilters);
      
      if (response?.success) {
        setAllUsers(response.data.profiles || []);
        setUserPagination(response.data.pagination || {});
        console.log('✅ All users loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ Error loading all users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [userFilters]);

  // ✅ ENHANCED EFFECTS WITH PROPER CLEANUP
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  useEffect(() => {
    // Initial fetch
    fetchRealPatientData();
    
    // Set up auto-refresh interval
    const interval = setInterval(fetchRealPatientData, REFRESH_INTERVALS.PATIENT_DATA);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchRealPatientData]);

  useEffect(() => {
    let interval;
    if (showProfiles) {
      interval = setInterval(loadRealTimeProfiles, REFRESH_INTERVALS.PROFILES);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showProfiles, loadRealTimeProfiles]);

  useEffect(() => {
    if (showAllUsers) {
      loadAllUsers();
    }
  }, [showAllUsers, loadAllUsers]);

  // ✅ ENHANCED EVENT HANDLERS
  const handleUserFilterChange = useCallback((key, value) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to first page when filters change
    }));
  }, []);

  const toggleAllUsers = useCallback(async () => {
    setShowAllUsers(prev => !prev);
  }, []);

  const toggleRealTimeProfiles = useCallback(async () => {
    setShowProfiles(prev => !prev);
  }, []);

  const refreshData = useCallback(async () => {
    const refreshPromises = [
      loadDashboardData(),
      fetchRealPatientData()
    ];

    if (showProfiles) {
      refreshPromises.push(loadRealTimeProfiles());
    }
    if (showAllUsers) {
      refreshPromises.push(loadAllUsers());
    }

    try {
      await Promise.allSettled(refreshPromises);
      console.log('✅ All data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  }, [loadDashboardData, fetchRealPatientData, showProfiles, showAllUsers, loadRealTimeProfiles, loadAllUsers]);

  const handleProfileClick = useCallback((profile) => {
    console.log('👤 Opening profile:', profile);
    setSelectedProfile(profile);
    setShowProfileModal(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    
    // Refresh data if needed
    if (showProfiles) {
      loadRealTimeProfiles();
    }
    if (showAllUsers) {
      loadAllUsers();
    }
  }, [showProfiles, showAllUsers, loadRealTimeProfiles, loadAllUsers]);

  const handleDashboardAccess = useCallback(async (dashboardType) => {
    try {
      let response;
      const dashboardRoutes = {
        receptionist: '/admin/receptionist-dashboard',
        doctor: '/admin/doctor-dashboard',
        financial: '/admin/financial-dashboard'
      };

      switch (dashboardType) {
        case 'receptionist':
          response = await adminDashboardApi.accessReceptionistDashboard();
          break;
        case 'doctor':
          response = await adminDashboardApi.accessDoctorDashboard();
          break;
        case 'financial':
          response = await adminDashboardApi.accessFinancialDashboard();
          break;
        default:
          console.error('Unknown dashboard type:', dashboardType);
          return;
      }

      if (response?.success) {
        console.log(`✅ Accessing ${dashboardType} Dashboard:`, response.data);
        navigate(dashboardRoutes[dashboardType]);
      }
    } catch (error) {
      console.error(`❌ Error accessing ${dashboardType} dashboard:`, error);
      setError(`Failed to access ${dashboardType} dashboard`);
    }
  }, [navigate]);

  const handlePrint = useCallback(() => {
    const fabButtons = document.querySelector('.floating-action-buttons');
    if (fabButtons) {
      fabButtons.style.display = 'none';
    }
    
    window.print();
    
    setTimeout(() => {
      if (fabButtons) {
        fabButtons.style.display = 'flex';
      }
    }, 1000);
  }, []);

  const handleContactSupport = useCallback(() => {
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
  }, [admin]);

  const handleSummaryReport = useCallback(() => {
    setShowSummaryModal(true);
  }, []);

  const handleSummaryFormChange = useCallback((field, value) => {
    setSummaryFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // ✅ ENHANCED HELPER FUNCTIONS WITH MEMOIZATION
  const getValueOrNoData = useCallback((value) => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return 'No data entered';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  }, []);

  const getCurrencyOrNoData = useCallback((value) => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return 'No data entered';
    }
    if (typeof value === 'number') {
      return `$${value.toLocaleString()}`;
    }
    return String(value);
  }, []);

  const getMonthName = useCallback((monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  }, []);

  // ✅ ENHANCED REPORT GENERATION WITH BETTER ERROR HANDLING
  const generateFrontendHTMLReport = useCallback(() => {
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      console.log('📊 Generating HTML report:', {
        totalPatients: systemStats.totalPatients,
        thisMonthPatients: systemStats.thisMonthPatients,
        todayPatients: systemStats.todayPatients,
        monthlyGrowth: systemStats.monthlyGrowth
      });

      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hospital Report - ${monthNames[summaryFormData.month - 1]} ${summaryFormData.year}</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    margin: 40px; 
                    background: #f8f9fa;
                    line-height: 1.6;
                    color: #333;
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
                .metric-value.real-data {
                    color: #28a745;
                    position: relative;
                }
                .metric-value.real-data::after {
                    content: '✓ Real Data';
                    position: absolute;
                    top: -20px;
                    right: -10px;
                    font-size: 0.3em;
                    color: #28a745;
                    background: #d4edda;
                    padding: 2px 6px;
                    border-radius: 4px;
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

      // Patient Statistics with Real Database Numbers
      if (summaryFormData.includePatients) {
        html += `
            <div class="section">
                <h2>👥 Patient Statistics</h2>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-value real-data">${getValueOrNoData(systemStats.totalPatients)}</div>
                        <div class="metric-label">Total Patients</div>
                    </div>
                  
                    <div class="metric">
                        <div class="metric-value real-data">${getValueOrNoData(systemStats.todayPatients)}</div>
                        <div class="metric-label">Today</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value real-data">${systemStats.monthlyGrowth}%</div>
                        <div class="metric-label">Monthly Growth</div>
                    </div>
                </div>
            </div>
        `;
      }

      // Financial Summary
      if (summaryFormData.includeFinancials) {
        html += `
            <div class="section">
                <h2>💰 Financial Summary</h2>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-value">${getCurrencyOrNoData(systemStats.totalRevenue)}</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${getCurrencyOrNoData(systemStats.totalExpenses)}</div>
                        <div class="metric-label">Total Expenses</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${getCurrencyOrNoData(systemStats.netProfit)}</div>
                        <div class="metric-label">Net Profit</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${getCurrencyOrNoData(systemStats.appointmentRevenue)}</div>
                        <div class="metric-label">Appointment Revenue</div>
                    </div>
                </div>
            </div>
        `;
      }

      html += `
                <div class="footer">
                    <p>📋 This report was generated correctly</p>
                    <p>© ${new Date().getFullYear()} Your Hospital Name - All rights reserved</p>
                    <p>For questions about this report, contact: ${admin?.email || 'admin@hospital.com'}</p>
                
            </div>
        </body>
        </html>
      `;

      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      } else {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      }
    } catch (error) {
      console.error('❌ Error generating HTML report:', error);
      alert(`Failed to generate HTML report: ${error.message}`);
    }
  }, [summaryFormData, systemStats, admin, getValueOrNoData, getCurrencyOrNoData]);

  const generateFrontendCSVReport = useCallback(() => {
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      let csvContent = `Hospital Summary Report\n`;
      csvContent += `Period,${monthNames[summaryFormData.month - 1]} ${summaryFormData.year}\n`;
      csvContent += `Generated,${new Date().toLocaleString()}\n`;
      csvContent += `Generated By,${admin?.name || 'System Administrator'}\n\n`;

      if (summaryFormData.includePatients) {
        csvContent += `Patient Statistics\n`;
        csvContent += `Total Patients,${systemStats.totalPatients}\n`;
        csvContent += `This Month Patients,${systemStats.thisMonthPatients}\n`;
        csvContent += `Today Patients,${systemStats.todayPatients}\n`;
        csvContent += `Monthly Growth,${systemStats.monthlyGrowth}%\n\n`;
      }

      if (summaryFormData.includeFinancials) {
        csvContent += `Financial Summary\n`;
        csvContent += `Total Revenue,${getCurrencyOrNoData(systemStats.totalRevenue)}\n`;
        csvContent += `Total Expenses,${getCurrencyOrNoData(systemStats.totalExpenses)}\n`;
        csvContent += `Net Profit,${getCurrencyOrNoData(systemStats.netProfit)}\n`;
        csvContent += `Appointment Revenue,${getCurrencyOrNoData(systemStats.appointmentRevenue)}\n\n`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Hospital_Report_${summaryFormData.month}_${summaryFormData.year}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error generating CSV report:', error);
      alert(`Failed to generate CSV report: ${error.message}`);
    }
  }, [summaryFormData, systemStats, admin, getCurrencyOrNoData]);

  const generateFrontendPDFReport = useCallback(() => {
    generateFrontendHTMLReport();
    setTimeout(() => {
      alert('📄 To save as PDF: Use your browser\'s Print function (Ctrl+P) and select "Save as PDF" as the destination.');
    }, 1000);
  }, [generateFrontendHTMLReport]);

  const generateSummaryReport = useCallback(async () => {
    try {
      setGenerateLoading(true);
      
      console.log('📊 Generating summary report:', summaryFormData);
      console.log('🏥 Current patient numbers:', {
        total: systemStats.totalPatients,
        thisMonth: systemStats.thisMonthPatients,
        today: systemStats.todayPatients,
        growth: `${systemStats.monthlyGrowth}%`
      });
      
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
        const response = await adminDashboardApi.generateSummaryReport(summaryFormData);
        
        if (response?.success) {
          handleSuccessfulReport(response);
        } else {
          throw new Error(response.message);
        }
        
      } catch (apiError) {
        console.warn('⚠️ API route not available, generating frontend report with REAL DATABASE DATA:', apiError.message);
        
        const formatHandlers = {
          html: generateFrontendHTMLReport,
          pdf: generateFrontendPDFReport,
          excel: generateFrontendCSVReport
        };

        const handler = formatHandlers[summaryFormData.reportFormat];
        if (handler) {
          handler();
        } else {
          throw new Error('Unsupported report format');
        }
      }
      
      console.log('✅ Report generated successfully');
      setShowSummaryModal(false);
      alert('✅ Report generated successfully!');
      
    } catch (error) {
      console.error('❌ Error generating summary report:', error);
      alert(`❌ Error generating report: ${error.message}`);
    } finally {
      setGenerateLoading(false);
    }
  }, [summaryFormData, systemStats, generateFrontendHTMLReport, generateFrontendPDFReport, generateFrontendCSVReport]);

  const handleSuccessfulReport = useCallback((response) => {
    try {
      const filename = `Hospital_Report_${summaryFormData.month}_${summaryFormData.year}`;
      
      const downloadHandlers = {
        pdf: () => {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        excel: () => {
          const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        },
        html: () => {
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(response.data);
            newWindow.document.close();
          }
        }
      };

      const handler = downloadHandlers[summaryFormData.reportFormat];
      if (handler) {
        handler();
      }
    } catch (error) {
      console.error('❌ Error handling successful report:', error);
      alert(`Failed to download report: ${error.message}`);
    }
  }, [summaryFormData]);

  // ✅ MEMOIZED VALUES FOR PERFORMANCE
  const realDataIndicators = useMemo(() => ({
    hasRealData: Boolean(realPatientData),
    isLoading: patientDataLoading,
    lastUpdate: systemStats.lastUpdated,
    connectionStatus: realPatientData ? 'Connected ✅' : 'Checking...'
  }), [realPatientData, patientDataLoading, systemStats.lastUpdated]);

  const demographicsData = useMemo(() => {
    if (!realPatientData?.genderCounts) return null;
    
    return {
      genderCounts: realPatientData.genderCounts,
      bloodGroupCounts: realPatientData.bloodGroupCounts?.sort((a, b) => b.count - a.count).slice(0, 5),
      totalPatients: realPatientData.totalPatients
    };
  }, [realPatientData]);

  // ✅ ENHANCED LOADING STATE
  if (loading) {
    return (
      <AdminErrorBoundary>
        <div className="admin-loading-container">
          <div className="admin-loading-content">
            <div className="loading-spinner" role="status" aria-label="Loading"></div>
            <h2>Loading Admin Dashboard...</h2>
            <p>Verifying your admin session & fetching real database numbers</p>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  // ✅ ENHANCED ERROR STATE
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
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                aria-label="Retry loading dashboard"
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
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
                aria-label="Go to login page"
              >
                🔑 Re-login
              </button>
            </div>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  // ✅ FINAL SAFETY CHECK
  if (!admin?.role) {
    return (
      <AdminErrorBoundary>
        <div className="admin-auth-error">
          <div className="admin-error-content">
            <h2>Authentication Required</h2>
            <p>Redirecting to login...</p>
            <div className="loading-spinner" role="status" aria-label="Redirecting"></div>
          </div>
        </div>
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminLayout admin={admin} title="System Administrator Dashboard">
        <div className="admin-dashboard">
          {/* ✅ ENHANCED HEADER WITH BETTER ACCESSIBILITY */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>📊 System Administrator Dashboard</h1>
              <div className="header-actions">
                <button 
                  onClick={() => window.open('/', '_blank')} 
                  className="homepage-btn"
                  aria-label="Open homepage in new tab"
                >
                  🏠 Homepage
                </button>
                
                <button 
                  onClick={fetchRealPatientData} 
                  className="real-data-btn" 
                  disabled={patientDataLoading}
                  style={{
                    background: patientDataLoading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: patientDataLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  aria-label={patientDataLoading ? 'Loading patient data' : 'Refresh real patient data'}
                >
                  {patientDataLoading ? '⏳ Loading...' : '🏥 Refresh Real Data'}
                </button>
                
                <button 
                  onClick={toggleRealTimeProfiles} 
                  className="profiles-btn"
                  aria-label={showProfiles ? 'Hide real-time profiles' : 'Show real-time profiles'}
                >
                  {showProfiles ? '📋 Hide Profiles' : '📋 Real-Time Profiles'}
                </button>
                
                <button 
                  onClick={toggleAllUsers} 
                  className="all-users-btn"
                  aria-label={showAllUsers ? 'Hide all users' : 'Show all users'}
                >
                  {showAllUsers ? '👥 Hide All Users' : '👥 Show All Users'}
                </button>
                
                <button 
                  onClick={refreshData} 
                  className="refresh-btn"
                  aria-label="Refresh all dashboard data"
                >
                  🔄 Refresh All
                </button>
                
                {realDataIndicators.lastUpdate && (
                  <span className="last-updated" style={{ color: '#fff' }}>
                    Last updated: {new Date(realDataIndicators.lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* ✅ ENHANCED STATUS BANNERS */}
            {error && (
              <div className="error-banner" role="alert">
                ⚠️ {error}
              </div>
            )}
            
            {patientDataError && (
              <div className="error-banner" style={{ background: '#dc3545' }} role="alert">
                ❌ Database Error: {patientDataError}
              </div>
            )}
            
            {realDataIndicators.hasRealData && (
              <div className="success-banner" style={{ background: '#28a745', color: 'white', padding: '0.5rem', textAlign: 'center' }} role="status">
                ✅ Real database numbers loaded successfully! Last sync: {new Date(realDataIndicators.lastUpdate).toLocaleString()}
              </div>
            )}
          </div>

          {/* ✅ ENHANCED REAL DATABASE NUMBERS SUMMARY */}
          {realPatientData && (
            <section className="real-database-summary" aria-labelledby="real-data-heading">
              <h2 id="real-data-heading">📊 Real Database Numbers Summary</h2>
              <div className="database-cards">
                <div className="database-card total">
                  <div className="card-icon" aria-hidden="true">👥</div>
                  <div className="card-content">
                    <h3>{realPatientData.totalPatients?.toLocaleString() || 0}</h3>
                    <p>Total Patients</p>
                    <small>Complete database count</small>
                  </div>
                </div>
                
                <div className="database-card monthly">
                  <div className="card-icon" aria-hidden="true">📅</div>
                  <div className="card-content">
                    <h3>{realPatientData.thisMonthPatients?.toLocaleString() || 0}</h3>
                    <p>This Month</p>
                    <small>{systemStats.monthlyGrowth}% growth</small>
                  </div>
                </div>
                
                <div className="database-card daily">
                  <div className="card-icon" aria-hidden="true">🆕</div>
                  <div className="card-content">
                    <h3>{realPatientData.todayPatients?.toLocaleString() || 0}</h3>
                    <p>Today</p>
                    <small>New registrations</small>
                  </div>
                </div>
                
                <div className="database-card demographics">
                  <div className="card-icon" aria-hidden="true">📊</div>
                  <div className="card-content">
                    <h3>{realPatientData.genderCounts?.length || 0}</h3>
                    <p>Demographics</p>
                    <small>Gender categories tracked</small>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ✅ ENHANCED STATISTICS GRID */}
          <section className="stats-grid" aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
            
            <div className="stat-card users">
              <div className="stat-icon" aria-hidden="true">👥</div>
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
              <div className="stat-icon" aria-hidden="true">👨‍⚕️</div>
              <div className="stat-info">
                <h3>{systemStats.totalStaff.toLocaleString()}</h3>
                <p>Staff Members</p>
                <small>
                  Admin: {systemStats.staffBreakdown?.admin || 0} | 
                  Doctors: {systemStats.staffBreakdown?.doctor || 0}
                </small>
              </div>
            </div>
            
            <div className={`stat-card patients ${realDataIndicators.hasRealData ? 'real-data' : ''}`}>
              <div className="stat-icon" aria-hidden="true">🏥</div>
              <div className="stat-info">
                <h3 style={{ color: realDataIndicators.hasRealData ? '#10b981' : '#6b7280' }}>
                  {systemStats.totalPatients.toLocaleString()}
                </h3>
                <p>
                  Total Patients 
                  {realDataIndicators.hasRealData && <span className="real-indicator">📡 LIVE</span>}
                </p>
                <small>
                  🆕 This Month: {systemStats.thisMonthPatients} | 
                  📅 Today: {systemStats.todayPatients} |
                  📈 Growth: {systemStats.monthlyGrowth}%
                  {realDataIndicators.hasRealData && (
                    <span style={{ color: '#10b981', display: 'block' }}>
                      ✅ Real Database Numbers
                    </span>
                  )}
                </small>
              </div>
              {realDataIndicators.isLoading && (
                <div className="stat-loading" aria-label="Loading patient data">⏳</div>
              )}
            </div>
            
            <div className="stat-card health">
              <div className="stat-icon" aria-hidden="true">
                {systemStats.systemHealth === 'healthy' ? '✅' : 
                 systemStats.systemHealth === 'warning' ? '⚠️' : '❌'}
              </div>
              <div className="stat-info">
                <h3 className={`status-${systemStats.systemHealth}`}>
                  {systemStats.systemHealth.charAt(0).toUpperCase() + systemStats.systemHealth.slice(1)}
                </h3>
                <p>System Status</p>
                <small>Database: {realDataIndicators.connectionStatus}</small>
              </div>
            </div>
          </section>

          {/* ✅ ENHANCED DEMOGRAPHICS SECTION */}
          {demographicsData && (
            <section className="demographics-section" aria-labelledby="demographics-heading">
              <h2 id="demographics-heading">📊Database Demographics</h2>
              <div className="demographics-grid">
                
                <div className="demo-card">
                  <h3>👫 Gender Distribution</h3>
                  <div className="demo-list">
                    {demographicsData.genderCounts.map((item, index) => (
                      <div key={`gender-${index}`} className="demo-item">
                        <span className="demo-label">{item._id || 'Not Specified'}</span>
                        <div className="demo-bar">
                          <div 
                            className="demo-fill" 
                            style={{ 
                              width: `${(item.count / demographicsData.totalPatients) * 100}%`,
                              background: ['#3b82f6', '#ec4899', '#a855f7'][index] || '#6b7280'
                            }}
                            aria-label={`${item._id}: ${item.count} patients`}
                          />
                        </div>
                        <span className="demo-value">
                          {item.count} ({((item.count / demographicsData.totalPatients) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {demographicsData.bloodGroupCounts && (
                  <div className="demo-card">
                    <h3>🩸 Blood Group Distribution</h3>
                    <div className="demo-list">
                      {demographicsData.bloodGroupCounts.map((item, index) => (
                        <div key={`blood-${index}`} className="demo-item">
                          <span className="demo-label">{item._id}</span>
                          <div className="demo-bar">
                            <div 
                              className="demo-fill" 
                              style={{ 
                                width: `${(item.count / Math.max(...demographicsData.bloodGroupCounts.map(g => g.count))) * 100}%`,
                                background: '#ef4444'
                              }}
                              aria-label={`${item._id}: ${item.count} patients`}
                            />
                          </div>
                          <span className="demo-value">
                            {item.count} ({((item.count / demographicsData.totalPatients) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Keep all existing sections with similar enhancements... */}
          {/* The rest of the component remains the same but with better error handling, accessibility, and performance optimizations */}
          
          {/* All Users Management Section */}
          {showAllUsers && (
            <section className="all-users-management-section" aria-labelledby="users-heading">
              <div className="section-header">
                <h2 id="users-heading">👥 Complete Users Database (Click to View Details)</h2>
                <div className="section-actions">
                  <button 
                    onClick={loadAllUsers} 
                    className="refresh-users-btn" 
                    disabled={usersLoading}
                    aria-label={usersLoading ? 'Loading users' : 'Refresh users list'}
                  >
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
                    <label htmlFor="user-search">🔍 Search:</label>
                    <input
                      id="user-search"
                      type="text"
                      placeholder="Search by name or email..."
                      value={userFilters.search}
                      onChange={(e) => handleUserFilterChange('search', e.target.value)}
                      className="search-input"
                      aria-describedby="search-help"
                    />
                    <small id="search-help" className="sr-only">
                      Search users by name or email address
                    </small>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="user-type">👤 Type:</label>
                    <select
                      id="user-type"
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
                    <label htmlFor="user-status">✅ Status:</label>
                    <select
                      id="user-status"
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
                    <label htmlFor="user-sort">📊 Sort:</label>
                    <select
                      id="user-sort"
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
                    <label htmlFor="user-order">🔄 Order:</label>
                    <select
                      id="user-order"
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
                    <div className="loading-spinner" role="status" aria-label="Loading users"></div>
                    <p>Loading users...</p>
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="no-users-message">
                    <h3>No users found</h3>
                    <p>Try adjusting your search filters</p>
                  </div>
                ) : (
                  <table className="users-table" role="table" aria-label="Users list">
                    <thead>
                      <tr>
                        <th scope="col">👤 User</th>
                        <th scope="col">📧 Email</th>
                        <th scope="col">🏷️ Type</th>
                        <th scope="col">✅ Status</th>
                        <th scope="col">🏢 Department</th>
                        <th scope="col">📅 Registered</th>
                        <th scope="col">🕒 Last Activity</th>
                        <th scope="col">🔧 Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user, index) => (
                        <tr key={user._id || `user-${index}`} className="user-row clickable-row">
                          <td className="user-info">
                            <div className="user-avatar" aria-hidden="true">
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
                                aria-label={`View details for ${user.name}`}
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
                                aria-label={`Edit ${user.name}`}
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
                                aria-label={`Manage ${user.name}`}
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
                <nav className="pagination" aria-label="Users pagination">
                  <div className="pagination-info">
                    Showing {allUsers.length} of {userPagination.totalCount} users
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() => handleUserFilterChange('page', userPagination.currentPage - 1)}
                      disabled={!userPagination.hasPrevPage}
                      className="pagination-btn"
                      aria-label="Go to previous page"
                    >
                      ← Previous
                    </button>
                    
                    <span className="page-info" aria-current="page">
                      Page {userPagination.currentPage} of {userPagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handleUserFilterChange('page', userPagination.currentPage + 1)}
                      disabled={!userPagination.hasNextPage}
                      className="pagination-btn"
                      aria-label="Go to next page"
                    >
                      Next →
                    </button>
                  </div>
                </nav>
              )}
            </section>
          )}

          {/* Real-time Profiles Section */}
          {showProfiles && (
            <section className="realtime-profiles-section" aria-labelledby="profiles-heading">
              <div className="profiles-header">
                <h2 id="profiles-heading">👥 Real-Time Profile List (Click to View Details)</h2>
                {profilesLoading && <div className="mini-spinner" aria-label="Loading profiles">⏳</div>}
              </div>
              <div className="profiles-grid">
                {realTimeProfiles.map((profile, index) => (
                  <div 
                    key={profile._id || `profile-${index}`} 
                    className={`profile-card ${profile.type} clickable-profile`}
                    onClick={() => handleProfileClick(profile)}
                    title="Click to view profile details"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleProfileClick(profile);
                      }
                    }}
                    aria-label={`View profile for ${profile.name}`}
                  >
                    <div className="profile-avatar" aria-hidden="true">
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
            </section>
          )}

          {/* Dashboard Access Section */}
          <section className="dashboard-access-section" aria-labelledby="dashboard-access-heading">
            <h2 id="dashboard-access-heading">🎛️ Role-Based Dashboard Access</h2>
            <div className="role-dashboard-grid">
              <button 
                className="role-dashboard-btn receptionist-btn"
                onClick={() => handleDashboardAccess('receptionist')}
                aria-label="Access Receptionist Dashboard"
              >
                <div className="dashboard-icon" aria-hidden="true">👩‍💼</div>
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
                <div className="access-indicator" aria-hidden="true">
                  {dashboardRoleAccess.roleAccess?.receptionist?.accessible ? '✅' : '🔒'}
                </div>
              </button>

              <button 
                className="role-dashboard-btn doctor-btn"
                onClick={() => handleDashboardAccess('doctor')}
                aria-label="Access Doctor Dashboard"
              >
                <div className="dashboard-icon" aria-hidden="true">👩‍⚕️</div>
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
                <div className="access-indicator" aria-hidden="true">
                  {dashboardRoleAccess.roleAccess?.doctor?.accessible ? '✅' : '🔒'}
                </div>
              </button>

              <button 
                className="role-dashboard-btn financial-btn"
                onClick={() => handleDashboardAccess('financial')}
                aria-label="Access Financial Manager Dashboard"
              >
                <div className="dashboard-icon" aria-hidden="true">💰</div>
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
                <div className="access-indicator" aria-hidden="true">
                  {dashboardRoleAccess.roleAccess?.financial_manager?.accessible ? '✅' : '🔒'}
                </div>
              </button>
            </div>
          </section>

          {/* User Management Section */}
          <section className="user-management-section" aria-labelledby="user-management-heading">
            <h2 id="user-management-heading">👥 User Management System</h2>
            <div className="user-management-grid">
              <button 
                className="user-management-btn all-users-btn"
                onClick={() => navigate('/admin/users')}
                aria-label="Access All Users Management"
              >
                <div className="dashboard-icon" aria-hidden="true">👥</div>
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
                <div className="access-indicator" aria-hidden="true">✅</div>
              </button>
              
              <button 
                className="user-management-btn patients-only-btn"
                onClick={() => navigate('/admin/patients')}
                aria-label="Access Patients Management"
              >
                <div className="dashboard-icon" aria-hidden="true">🏥</div>
                <div className="dashboard-info">
                  <h4>Patients Only (Real Database)</h4>
                  <p>Dedicated patient management & demographics</p>
                  <div className="dashboard-stats">
                    <small>
                      Patients: {systemStats.totalPatients} | 
                      This Month: {systemStats.thisMonthPatients} | 
                      Growth: {systemStats.monthlyGrowth}%
                    </small>
                  </div>
                </div>
                <div className="access-indicator" aria-hidden="true">📡</div>
              </button>

              <button 
                className="user-management-btn staff-only-btn"
                onClick={() => navigate('/admin/staff')}
                aria-label="Access Staff Management"
              >
                <div className="dashboard-icon" aria-hidden="true">👨‍⚕️</div>
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
                <div className="access-indicator" aria-hidden="true">🔧</div>
              </button>
            </div>
          </section>

          {/* Inventory Management Section */}
          <section className="inventory-management-section" aria-labelledby="inventory-heading">
            <h2 id="inventory-heading">🏥 Inventory Management System</h2>
            <div className="inventory-dashboard-grid">
              <button 
                className="inventory-dashboard-btn surgical-items-btn"
                onClick={() => navigate('/admin/surgical-items')}
                aria-label="Access Surgical Items Management"
              >
                <div className="dashboard-icon" aria-hidden="true">🔧</div>
                <div className="dashboard-info">
                  <h4>Surgical Items Management</h4>
                  <p>Manage surgical instruments, supplies & medical equipment inventory</p>
                  <div className="dashboard-stats">
                    <small>
                      Track stock levels, usage patterns, supplier information & automated alerts
                    </small>
                  </div>
                </div>
                <div className="access-indicator" aria-hidden="true">✅</div>
              </button>
              
              <button 
                className="inventory-dashboard-btn reports-btn"
                onClick={() => navigate('/admin/documentations')}
                aria-label="Access Inventory Reports & Analytics"
              >
                <div className="dashboard-icon" aria-hidden="true">📊</div>
                <div className="dashboard-info">
                  <h4>Inventory Reports & Analytics</h4>
                  <p>Generate detailed inventory analytics, usage reports & financial summaries</p>
                  <div className="dashboard-stats">
                    <small>
                      Low stock alerts, cost analysis, vendor performance & trend insights
                    </small>
                  </div>
                </div>
                <div className="access-indicator" aria-hidden="true">✅</div>
              </button>

              <button 
                className="inventory-dashboard-btn procurement-btn"
                onClick={() => navigate('/admin/procurement')}
                aria-label="Access Procurement & Suppliers"
              >
                <div className="dashboard-icon" aria-hidden="true">📦</div>
                <div className="dashboard-info">
                  <h4>Procurement & Suppliers</h4>
                  <p>Manage purchase orders, supplier relationships & automated restocking</p>
                  <div className="dashboard-stats">
                    <small>
                      Order tracking, supplier ratings, contract management & cost optimization
                    </small>
                  </div>
                </div>
                <div className="access-indicator" aria-hidden="true">🔧</div>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          {activityLogs.length > 0 && (
            <section className="activity-section" aria-labelledby="activity-heading">
              <h2 id="activity-heading">🔄 Recent System Activity</h2>
              <div className="activity-list">
                {activityLogs.slice(0, 5).map((log, index) => (
                  <div key={`activity-${index}`} className="activity-item">
                    <div className="activity-icon" aria-hidden="true">
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
            </section>
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
            <div 
              className="support-modal-overlay" 
              onClick={() => setShowSupportModal(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="support-modal-title"
            >
              <div className="support-modal" onClick={e => e.stopPropagation()}>
                <div className="support-modal-header">
                  <h3 id="support-modal-title">💬 Contact Support</h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowSupportModal(false)}
                    aria-label="Close support modal"
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
                      aria-label="Send email to support"
                    >
                      📧 Send Email
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('tel:+1234567890');
                        setShowSupportModal(false);
                      }}
                      aria-label="Call support"
                    >
                      📞 Call Support
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('https://your-chat-support.com', '_blank');
                        setShowSupportModal(false);
                      }}
                      aria-label="Start live chat"
                    >
                      💬 Live Chat
                    </button>
                    <button 
                      className="support-option"
                      onClick={() => {
                        window.open('https://your-knowledge-base.com', '_blank');
                        setShowSupportModal(false);
                      }}
                      aria-label="Access knowledge base"
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
            <div 
              className="summary-modal-overlay" 
              onClick={() => setShowSummaryModal(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="summary-modal-title"
            >
              <div className="summary-modal" onClick={e => e.stopPropagation()}>
                <div className="summary-modal-header">
                  <h3 id="summary-modal-title">📊 Generate Summary Report</h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowSummaryModal(false)}
                    aria-label="Close summary report modal"
                  >
                    ✕
                  </button>
                </div>
                <div className="summary-modal-body">
                  <form className="summary-form" onSubmit={(e) => e.preventDefault()}>
                    
                    <div className="form-group">
                      <label>🏥 Current Database Numbers</label>
                      <div className="patient-numbers-preview">
                        <div className="number-item">
                          <span className="label">Total Patients:</span>
                          <span className="value real-data">{systemStats.totalPatients} 📡</span>
                        </div>
                        <div className="number-item">
                          <span className="label">This Month:</span>
                          <span className="value real-data">{systemStats.thisMonthPatients} 📡</span>
                        </div>
                        <div className="number-item">
                          <span className="label">Today:</span>
                          <span className="value real-data">{systemStats.todayPatients} 📡</span>
                        </div>
                        <div className="number-item">
                          <span className="label">Growth Rate:</span>
                          <span className="value real-data">{systemStats.monthlyGrowth}% 📈</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="report-type">📋 Report Type</label>
                      <select
                        id="report-type"
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

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="report-month">📅 Month</label>
                        <select
                          id="report-month"
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
                        <label htmlFor="report-year">🗓️ Year</label>
                        <select
                          id="report-year"
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

                    <fieldset className="form-group">
                      <legend>📑 Include Sections</legend>
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
                          <span>👥 Patient Statistics</span>
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
                    </fieldset>

                    <fieldset className="form-group">
                      <legend>📄 Report Format</legend>
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
                    </fieldset>

                    <div className="report-preview">
                      <h4>📋 Report Summary</h4>
                      <p>
                        <strong>Period:</strong> {getMonthName(summaryFormData.month)} {summaryFormData.year}
                      </p>
                      <p>
                        <strong>Patient Data:</strong> {systemStats.totalPatients} total, {systemStats.thisMonthPatients} this month, {systemStats.todayPatients} today
                      </p>
                      <p>
                        <strong>Growth:</strong> {systemStats.monthlyGrowth}% monthly growth
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
                        aria-label={generateLoading ? 'Generating report, please wait' : 'Generate report'}
                      >
                        {generateLoading ? (
                          <>⏳ Generating Report...</>
                        ) : (
                          <>📊 Generate Report Successfully</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ENHANCED FLOATING ACTION BUTTONS */}
          <div className="floating-action-buttons" role="toolbar" aria-label="Dashboard actions">
            <button 
              className="fab-button print-button"
              onClick={handlePrint}
              title="Print Dashboard"
              aria-label="Print current dashboard"
            >
              🖨️
            </button>
            <button 
              className="fab-button support-button"
              onClick={() => setShowSupportModal(true)}
              title="Contact Support"
              aria-label="Contact technical support"
            >
              💬
            </button>
            <button 
              className="fab-button summary-button"
              onClick={handleSummaryReport}
              title="Generate Summary Report with Real Data"
              aria-label="Generate comprehensive summary report with real database data"
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
