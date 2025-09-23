import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDetailModal from '../ProfileDetailModal.jsx';
import { adminDashboardApi } from '../../../services/adminApi.js';
import '../Admin/styles/AllUserManagement.css';
// Import jsPDF for professional PDF generation
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AllUserManagement = ({ 
  admin, 
  onClose, 
  onNotification,
  refreshDashboardData 
}) => {
  // All Users Management State
  const [allUsers, setAllUsers] = useState([]);
  const [terminatedUsers, setTerminatedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showTerminated, setShowTerminated] = useState(false);
  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    type: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
    department: ''
  });
  const [userPagination, setUserPagination] = useState({});
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    userId: null,
    userName: '',
    userType: ''
  });
  const [terminateConfirmation, setTerminateConfirmation] = useState({
    show: false,
    userId: null,
    userName: '',
    userType: ''
  });

  // Auto-reload users when filters change
  useEffect(() => {
    if (showTerminated) {
      loadTerminatedUsers();
    } else {
      loadAllUsers();
    }
  }, [userFilters, showTerminated]);

  // Load all users function
  const loadAllUsers = useCallback(async () => {
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
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: 'error',
          title: 'Load Error',
          message: error.message || 'Failed to load users',
          timestamp: new Date()
        });
      }
    } finally {
      setUsersLoading(false);
    }
  }, [userFilters, onNotification]);

  // Load terminated users function
  const loadTerminatedUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const terminatedFilters = {
        ...userFilters,
        status: 'terminated'
      };
      const response = await adminDashboardApi.getAllProfilesDetailed(terminatedFilters);
      
      if (response.success) {
        setTerminatedUsers(response.data.profiles);
        setUserPagination(response.data.pagination);
        console.log('✅ Terminated users loaded:', response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch terminated users');
      }
    } catch (error) {
      console.error('❌ Error loading terminated users:', error);
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: 'error',
          title: 'Load Error',
          message: error.message || 'Failed to load terminated users',
          timestamp: new Date()
        });
      }
    } finally {
      setUsersLoading(false);
    }
  }, [userFilters, onNotification]);

  // Handle user filter changes
  const handleUserFilterChange = (key, value) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > userPagination.totalPages) return;
    handleUserFilterChange('page', newPage);
  };

  // Profile handling functions
  const handleProfileClick = (profile) => {
    console.log('👤 Opening profile:', profile);
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
    if (showTerminated) {
      loadTerminatedUsers();
    } else {
      loadAllUsers();
    }
  };

  // Delete user functionality
  const handleDeleteUser = async (userId, userName, userType) => {
    setDeleteConfirmation({
      show: true,
      userId,
      userName,
      userType
    });
  };

  const confirmDeleteUser = async () => {
    const { userId, userName, userType } = deleteConfirmation;
    
    try {
      const response = await fetch(`http://localhost:7000/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (onNotification) {
          onNotification({
            id: Date.now(),
            type: 'success',
            title: 'User Deleted',
            message: `${userType} "${userName}" has been successfully deleted from the system.`,
            timestamp: new Date()
          });
        }
        
        // Refresh the user list
        if (showTerminated) {
          loadTerminatedUsers();
        } else {
          loadAllUsers();
        }
        
        // Refresh dashboard stats if available
        if (refreshDashboardData) refreshDashboardData();
      } else {
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete user: ${error.message}`,
          timestamp: new Date()
        });
      }
    } finally {
      setDeleteConfirmation({
        show: false,
        userId: null,
        userName: '',
        userType: ''
      });
    }
  };

  const cancelDeleteUser = () => {
    setDeleteConfirmation({
      show: false,
      userId: null,
      userName: '',
      userType: ''
    });
  };

  // Terminate user functionality
  const handleTerminateUser = async (userId, userName, userType) => {
    setTerminateConfirmation({
      show: true,
      userId,
      userName,
      userType
    });
  };

  const confirmTerminateUser = async () => {
    const { userId, userName, userType } = terminateConfirmation;
    
    try {
      const response = await fetch(`http://localhost:7000/api/auth/users/${userId}/terminate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({
          reason: 'Admin terminated account',
          terminatedBy: admin?.id,
          terminatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (onNotification) {
          onNotification({
            id: Date.now(),
            type: 'success',
            title: 'User Terminated',
            message: `${userType} "${userName}" has been successfully terminated. Account is now inactive but data is preserved.`,
            timestamp: new Date()
          });
        }
        
        // Refresh the user list
        if (showTerminated) {
          loadTerminatedUsers();
        } else {
          loadAllUsers();
        }
        
        // Refresh dashboard stats if available
        if (refreshDashboardData) refreshDashboardData();
      } else {
        throw new Error(data.message || 'Failed to terminate user');
      }
    } catch (error) {
      console.error('❌ Error terminating user:', error);
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: 'error',
          title: 'Termination Failed',
          message: `Failed to terminate user: ${error.message}`,
          timestamp: new Date()
        });
      }
    } finally {
      setTerminateConfirmation({
        show: false,
        userId: null,
        userName: '',
        userType: ''
      });
    }
  };

  const cancelTerminateUser = () => {
    setTerminateConfirmation({
      show: false,
      userId: null,
      userName: '',
      userType: ''
    });
  };

  // Professional PDF export functionality
  const exportUserData = async () => {
    try {
      setExportLoading(true);
      
      const exportFilters = {
        ...userFilters,
        page: 1,
        limit: userPagination.totalCount || 1000
      };
      
      const response = await adminDashboardApi.getAllProfilesDetailed(exportFilters);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users for export');
      }
      
      const users = response.data.profiles;
      
      if (exportFormat === 'pdf') {
        await generateProfessionalPDF(users);
      } else if (exportFormat === 'csv') {
        // CSV export logic
        const headers = ['Name', 'Email', 'Type', 'Status', 'Phone', 'Department', 'Created Date', 'Last Login'];
        const csvContent = [
          headers.join(','),
          ...users.map(user => [
            `"${user.name || ''}"`,
            `"${user.email || ''}"`,
            `"${user.type || ''}"`,
            `"${user.status || ''}"`,
            `"${user.phone || ''}"`,
            `"${user.department || (user.type === 'patient' ? 'Patient Care' : 'General')}"`,
            `"${new Date(user.createdAt).toLocaleDateString()}"`,
            `"${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}"`
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // JSON export
        const jsonContent = JSON.stringify(users, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: 'success',
          title: 'Export Complete',
          message: `Successfully exported ${users.length} users as ${exportFormat.toUpperCase()}`,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      if (onNotification) {
        onNotification({
          id: Date.now(),
          type: 'error',
          title: 'Export Failed',
          message: error.message || 'Failed to export user data',
          timestamp: new Date()
        });
      }
    } finally {
      setExportLoading(false);
    }
  };

  // Generate Professional PDF in the style of HealX Healthcare Center report
  const generateProfessionalPDF = async (users) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Set document properties
    doc.setProperties({
      title: 'HealX Healthcare Center - User Management Report',
      subject: 'Complete Users Database Export',
      author: admin?.name || 'Healthcare Admin',
      keywords: 'healthcare, users, report, export',
      creator: 'HealX Healthcare Management System'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header background - HealX style
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Logo/Title section - HealX style
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('HealX Healthcare Center', 15, 12);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('User Management Report', 15, 22);
    
    // Report details - HealX style
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Report Date: ${reportDate}`, pageWidth - 80, 12);
    doc.text(`Total Users: ${users.length}`, pageWidth - 80, 18);
    doc.text(`Generated By: ${admin?.name || 'Admin'}`, pageWidth - 80, 24);

    // Summary statistics - HealX style
    const stats = {
      patients: users.filter(u => u.type === 'patient').length,
      doctors: users.filter(u => u.type === 'doctor').length,
      receptionists: users.filter(u => u.type === 'receptionist').length,
      financialManagers: users.filter(u => u.type === 'financial_manager').length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      terminated: users.filter(u => u.status === 'terminated').length
    };

    // Summary section - HealX style
    let yPosition = 45;
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('User Statistics Overview', 15, yPosition);
    
    yPosition += 10;
    
    // Statistics table - HealX style
    const statsData = [
      ['User Type', 'Count', 'Percentage'],
      ['Patients', stats.patients.toString(), `${((stats.patients/users.length)*100).toFixed(1)}%`],
      ['Doctors', stats.doctors.toString(), `${((stats.doctors/users.length)*100).toFixed(1)}%`],
      ['Receptionists', stats.receptionists.toString(), `${((stats.receptionists/users.length)*100).toFixed(1)}%`],
      ['Financial Managers', stats.financialManagers.toString(), `${((stats.financialManagers/users.length)*100).toFixed(1)}%`],
      ['', '', ''],
      ['Status', 'Count', 'Percentage'],
      ['Active', stats.active.toString(), `${((stats.active/users.length)*100).toFixed(1)}%`],
      ['Inactive', stats.inactive.toString(), `${((stats.inactive/users.length)*100).toFixed(1)}%`],
      ['Suspended', stats.suspended.toString(), `${((stats.suspended/users.length)*100).toFixed(1)}%`],
      ['Terminated', stats.terminated.toString(), `${((stats.terminated/users.length)*100).toFixed(1)}%`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 40 }
      },
      margin: { left: 15, right: 15 }
    });

    // Add new page for detailed user table
    doc.addPage();
    
    // Detailed user table header - HealX style
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed User Directory', 15, 20);
    
    // Prepare user data for table - HealX style
    const tableData = users.map(user => [
      user.name || 'N/A',
      user.email || 'N/A',
      user.phone || 'N/A',
      (user.type || 'N/A').replace('_', ' ').toUpperCase(),
      (user.status || 'Unknown').toUpperCase(),
      user.department || (user.type === 'patient' ? 'Patient Care' : 'General'),
      new Date(user.createdAt).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    ]);

    // Create detailed user table - HealX style
    doc.autoTable({
      startY: 30,
      head: [['Name', 'Email', 'Phone', 'User Type', 'Status', 'Department', 'Registered', 'Last Login']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 4,
        lineWidth: 0.2,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 }
      },
      margin: { left: 10, right: 10 },
      didDrawPage: function (data) {
        const pageNumber = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(128);
        doc.text(
          `Page ${data.pageNumber} of ${pageNumber}`,
          pageWidth - 30,
          pageHeight - 10
        );
      }
    });

    // Add signature area - HealX style with fixed border alignment
    const finalY = doc.lastAutoTable.finalY || 200;
    
    if (finalY < pageHeight - 70) {
      // Draw a border around the signature area with proper alignment
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      const signatureAreaY = finalY + 15;
      const signatureAreaHeight = 40;
      doc.rect(15, signatureAreaY, pageWidth - 30, signatureAreaHeight);
      
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signature', 20, signatureAreaY + 10);
      
      // Signature lines with proper alignment
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      const signatureLineY = signatureAreaY + 25;
      doc.line(20, signatureLineY, 70, signatureLineY);
      doc.line(90, signatureLineY, 140, signatureLineY);
      doc.line(160, signatureLineY, 190, signatureLineY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Signature', 20, signatureLineY + 7);
      doc.text('Printed Name', 90, signatureLineY + 7);
      doc.text('Date', 160, signatureLineY + 7);
      
      // Report notes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('This report contains confidential patient and staff information. Handle with care.', 15, signatureAreaY + signatureAreaHeight + 10);
    }

    const fileName = `HealX_Users_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Helper functions for icons
  const getUserTypeIcon = (type) => {
    switch(type) {
      case 'patient': return '🏥';
      case 'doctor': return '👨‍⚕️';
      case 'receptionist': return '🏢';
      case 'financial_manager': return '💰';
      default: return '👤';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return '✅';
      case 'inactive': return '⏸️';
      case 'suspended': return '🚫';
      case 'terminated': return '🔒';
      default: return '❓';
    }
  };

  // Toggle between active and terminated users
  const toggleUserView = () => {
    setShowTerminated(!showTerminated);
    // Reset to first page when switching views
    handleUserFilterChange('page', 1);
  };

  return (
    <div className="all-users-management-section">
      <div className="section-header">
        <h2>👥 {showTerminated ? 'Terminated Accounts' : 'Complete Users Database'} (Click to View Details)</h2>
        <div className="section-actions">
          <button 
            onClick={toggleUserView} 
            className="toggle-users-btn"
          >
            {showTerminated ? '👥 Show Active Users' : '🔒 Show Terminated Users'}
          </button>
          <button 
            onClick={showTerminated ? loadTerminatedUsers : loadAllUsers} 
            className="refresh-users-btn" 
            disabled={usersLoading}
          >
            {usersLoading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button 
            onClick={exportUserData} 
            className="export-users-btn" 
            disabled={exportLoading}
          >
            {exportLoading ? '⏳ Exporting...' : '📥 Export Data'}
          </button>
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
            className="export-format-select"
          >
            <option value="csv">CSV</option>
            <option value="pdf">Professional PDF</option>
            <option value="json">JSON</option>
          </select>
          <button onClick={onClose} className="close-section-btn">
            ✕ Close
          </button>
          <span className="users-count">
            Total: {userPagination.totalCount || (showTerminated ? terminatedUsers.length : allUsers.length)} users
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
              className="filter-input"
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
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="receptionist">Receptionists</option>
              <option value="financial_manager">Financial Managers</option>
            </select>
          </div>

          {!showTerminated && (
            <div className="filter-group">
              <label>📊 Status:</label>
              <select
                value={userFilters.status}
                onChange={(e) => handleUserFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>📅 Start Date:</label>
            <input
              type="date"
              value={userFilters.startDate}
              onChange={(e) => handleUserFilterChange('startDate', e.target.value)}
              className="filter-input date-input"
            />
          </div>

          <div className="filter-group">
            <label>📅 End Date:</label>
            <input
              type="date"
              value={userFilters.endDate}
              onChange={(e) => handleUserFilterChange('endDate', e.target.value)}
              className="filter-input date-input"
            />
          </div>

          <div className="filter-group">
            <label>🏢 Department:</label>
            <select
              value={userFilters.department}
              onChange={(e) => handleUserFilterChange('department', e.target.value)}
              className="filter-select"
            >
              <option value="">All Departments</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Emergency">Emergency</option>
              <option value="Administration">Administration</option>
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
        ) : (showTerminated ? terminatedUsers.length === 0 : allUsers.length === 0) ? (
          <div className="no-users-message">
            <h3>No {showTerminated ? 'terminated' : ''} users found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>👤 User Info</th>
                <th>📧 Contact</th>
                <th>🏷️ Role & Status</th>
                <th>🏢 Department</th>
                <th>📅 Registration</th>
                <th>🔧 Actions</th>
              </tr>
            </thead>
            <tbody>
              {(showTerminated ? terminatedUsers : allUsers).map(user => (
                <tr key={user._id} className={`user-row ${user.status === 'terminated' ? 'terminated-user' : ''}`}>
                  <td>
                    <div className="user-info">
                      <strong>{user.name || 'N/A'}</strong>
                      <small>ID: {user._id?.slice(-6)}</small>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div>📧 {user.email || 'N/A'}</div>
                      <div>📞 {user.phone || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="role-status">
                      <span className={`user-type ${user.type}`}>
                        {getUserTypeIcon(user.type)} {user.type === 'patient' ? 'Patient' : 
                         user.type === 'doctor' ? 'Doctor' : 
                         user.type === 'receptionist' ? 'Receptionist' : 
                         user.type === 'financial_manager' ? 'Financial Manager' : 
                         'User'}
                      </span>
                      <span className={`user-status ${user.status}`}>
                        {getStatusIcon(user.status)} {user.status === 'active' ? 'Active' : 
                         user.status === 'inactive' ? 'Inactive' : 
                         user.status === 'suspended' ? 'Suspended' : 
                         user.status === 'terminated' ? 'Terminated' :
                         'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {user.department || (user.type === 'patient' ? 'Patient Care' : 'General')}
                  </td>
                  <td>
                    <div className="registration-info">
                      <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                      <small>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        onClick={() => handleProfileClick(user)}
                        className="view-profile-btn"
                        title="View Profile"
                      >
                        👁️ View
                      </button>
                      {!showTerminated && user.status !== 'terminated' && (
                        <>
                          <button
                            onClick={() => handleTerminateUser(user._id, user.name, user.type)}
                            className="terminate-user-btn"
                            title="Terminate User Account"
                          >
                            🚫 Terminate
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name, user.type)}
                            className="delete-user-btn"
                            title="Delete User"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
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
            <span>
              Showing {((userPagination.currentPage - 1) * userPagination.limit) + 1} to{' '}
              {Math.min(userPagination.currentPage * userPagination.limit, userPagination.totalCount)} of{' '}
              {userPagination.totalCount} users
            </span>
          </div>
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(userPagination.currentPage - 1)}
              disabled={!userPagination.hasPrevPage}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {userPagination.currentPage} of {userPagination.totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(userPagination.currentPage + 1)}
              disabled={!userPagination.hasNextPage}
              className="pagination-btn"
            >
              Next →
            </button>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="delete-confirmation-modal-overlay" onClick={cancelDeleteUser}>
          <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Confirm User Deletion</h3>
            </div>
            <div className="modal-body">
              <div className="warning-message">
                <p><strong>⚠️ IMPORTANT:</strong> This action will permanently delete the user account!</p>
                <p>You are about to delete:</p>
                <div className="user-details">
                  <p><strong>Name:</strong> {deleteConfirmation.userName}</p>
                  <p><strong>Type:</strong> {deleteConfirmation.userType}</p>
                  <p><strong>ID:</strong> {deleteConfirmation.userId}</p>
                </div>
                <div className="deletion-effects">
                  <h4>⚡ Effects of Deletion:</h4>
                  <ul>
                    <li>🗑️ All user data will be permanently removed</li>
                    <li>🚫 Account access will be immediately disabled</li>
                    <li>📱 User cannot login to the system</li>
                    <li>📧 All notifications will be deleted</li>
                    <li>📋 Medical records will be archived</li>
                    <li>🔄 This action cannot be undone</li>
                  </ul>
                </div>
                <p><strong>Note:</strong> This is a permanent deletion and cannot be reversed.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={cancelDeleteUser} className="cancel-delete-btn">
                ❌ Cancel
              </button>
              <button onClick={confirmDeleteUser} className="confirm-delete-btn">
                🗑️ Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Confirmation Modal */}
      {terminateConfirmation.show && (
        <div className="terminate-confirmation-modal-overlay" onClick={cancelTerminateUser}>
          <div className="terminate-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚫 Confirm User Account Termination</h3>
            </div>
            <div className="modal-body">
              <div className="warning-message">
                <p><strong>⚠️ IMPORTANT:</strong> This action will terminate the user account!</p>
                <p>You are about to terminate:</p>
                <div className="user-details">
                  <p><strong>Name:</strong> {terminateConfirmation.userName}</p>
                  <p><strong>Type:</strong> {terminateConfirmation.userType}</p>
                  <p><strong>ID:</strong> {terminateConfirmation.userId}</p>
                </div>
                <div className="termination-effects">
                  <h4>⚡ Effects of Termination:</h4>
                  <ul>
                    <li>✅ User data will be preserved for records</li>
                    <li>🚫 Account access will be immediately disabled</li>
                    <li>📱 User cannot login to the system</li>
                    <li>📧 Automated notifications will be disabled</li>
                    <li>📋 Medical records remain accessible to authorized staff</li>
                    <li>🔄 Account can be reactivated by admin if needed</li>
                  </ul>
                </div>
                <p><strong>Note:</strong> This is safer than deletion as data is preserved.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={cancelTerminateUser} className="cancel-terminate-btn">
                ❌ Cancel
              </button>
              <button onClick={confirmTerminateUser} className="confirm-terminate-btn">
                🚫 Yes, Terminate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUserManagement;