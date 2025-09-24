import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AlertTriangle, Phone, User, Clock, Filter, Plus, Search, Bell, Activity, 
  Heart, Thermometer, MoreVertical, RefreshCw, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import CreateAlertModal from './CreateAlertModal';
import './EmergencyAlertsPage.css';

const EmergencyAlertsPage = ({ doctor }) => {
  // State Management
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [stats, setStats] = useState({
    overview: {
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      todayAlerts: 0
    },
    byType: {
      criticalAlerts: 0,
      urgentAlerts: 0,
      nonUrgentAlerts: 0
    },
    performance: {
      avgResolutionTime: 0,
      resolutionRate: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'All',
    type: 'All',
    priority: 'All',
    searchTerm: '',
    dateRange: 'all'
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const limit = 10;

  // Doctor data
  const [doctorInfo] = useState(doctor || {
    id: 'DOC001',
    name: 'Gayath Dahanayaka',
    specialization: 'Emergency Medicine'
  });

  // API Base URL
  const API_BASE = 'http://localhost:7000/api/doctor/emergency-alerts';

  // Use refs to prevent infinite loops
  const isMounted = useRef(true);
  const fetchStatsRef = useRef();
  const fetchAlertsRef = useRef();

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch(`${API_BASE}/stats?assignedDoctorId=${doctorInfo.id}`);
      const data = await response.json();
      
      if (data.success && isMounted.current) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  }, [doctorInfo.id]);

  // Fetch alerts function
  const fetchAlerts = useCallback(async (page = 1) => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.status !== 'All' && { status: filters.status }),
        ...(filters.type !== 'All' && { type: filters.type }),
        ...(filters.priority !== 'All' && { priority: filters.priority }),
        ...(filters.searchTerm && { patientName: filters.searchTerm }),
        assignedDoctorId: doctorInfo.id
      });

      const response = await fetch(`${API_BASE}?${queryParams}`);
      const data = await response.json();

      if (data.success && isMounted.current) {
        setAlerts(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalAlerts(data.pagination?.totalAlerts || 0);
        setCurrentPage(page);
        setError('');
      } else if (isMounted.current) {
        setError(data.message || 'Failed to fetch alerts');
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Error fetching alerts:', err);
        setError('Network error occurred');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [filters, doctorInfo.id, limit]);

  // Store functions in refs to prevent dependency issues
  useEffect(() => {
    fetchStatsRef.current = fetchStats;
    fetchAlertsRef.current = fetchAlerts;
  }, [fetchStats, fetchAlerts]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isMounted.current) return;
    
    setRefreshing(true);
    try {
      if (fetchAlertsRef.current && fetchStatsRef.current) {
        await Promise.all([
          fetchAlertsRef.current(currentPage),
          fetchStatsRef.current()
        ]);
      }
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  }, [currentPage]);

  // Initial load
  useEffect(() => {
    isMounted.current = true;
    fetchAlerts(1);
    fetchStats();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Apply filters
  useEffect(() => {
    if (!isMounted.current) return;
    
    let filtered = [...alerts];
    
    if (filters.searchTerm) {
      filtered = filtered.filter(alert => 
        alert.patientName.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    setFilteredAlerts(filtered);
  }, [alerts, filters]);

  // Create new alert
  const handleCreateAlert = async (alertData) => {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alertData,
          assignedDoctorId: doctorInfo.id,
          assignedDoctorName: doctorInfo.name,
          assignedDoctorSpecialization: doctorInfo.specialization
        })
      });

      const data = await response.json();
      
      if (data.success && isMounted.current) {
        fetchAlerts(1);
        fetchStats();
        setShowCreateModal(false);
        setError('');
      } else if (isMounted.current) {
        setError(data.message || 'Failed to create alert');
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to create alert');
      }
    }
  };

  // Update alert status
  const handleUpdateAlert = async (alertId, updateData) => {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch(`${API_BASE}/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updateData,
          resolvedBy: doctorInfo.name
        })
      });

      const data = await response.json();
      
      if (data.success && isMounted.current) {
        fetchAlerts(currentPage);
        fetchStats();
        setShowDetailModal(false);
        setSelectedAlert(null);
        setError('');
      } else if (isMounted.current) {
        setError(data.message || 'Failed to update alert');
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to update alert');
      }
    }
  };

  // Get alert type styling
  const getAlertTypeClass = (type) => {
    const classes = {
      'Critical': 'ea-alert-critical',
      'Urgent': 'ea-alert-urgent',
      'Non-urgent': 'ea-alert-non-urgent'
    };
    return classes[type] || classes['Non-urgent'];
  };

  // Get status styling
  const getStatusClass = (status) => {
    const classes = {
      'Active': 'ea-status-active',
      'In Progress': 'ea-status-progress',
      'Resolved': 'ea-status-resolved',
      'Dismissed': 'ea-status-dismissed'
    };
    return classes[status] || classes['Active'];
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      'Active': <AlertTriangle className="ea-status-icon-active" size={16} />,
      'In Progress': <Clock className="ea-status-icon-progress" size={16} />,
      'Resolved': <CheckCircle className="ea-status-icon-resolved" size={16} />,
      'Dismissed': <XCircle className="ea-status-icon-dismissed" size={16} />
    };
    return icons[status] || icons['Active'];
  };

  // Create Sample Alert (for development)
  const createSampleAlert = () => {
    const sampleData = {
      patientId: `P${Date.now()}`,
      type: 'Urgent',
      priority: 'High',
      description: 'Patient experiencing chest pain and shortness of breath. Requires immediate attention.',
      location: 'Emergency Department - Room 3',
      symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
      vitalSigns: {
        bloodPressure: { systolic: 180, diastolic: 110 },
        heartRate: 120,
        temperature: 98.6,
        oxygenSaturation: 92
      }
    };
    handleCreateAlert(sampleData);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAlerts(newPage);
    }
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'All',
      type: 'All',
      priority: 'All',
      searchTerm: '',
      dateRange: 'all'
    });
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="ea-loading-container">
        <div className="ea-loading-content">
          <div className="ea-spinner"></div>
          <p className="ea-loading-text">Loading emergency alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <> 
      <div className="ea-container">
        {/* Header */}
        <div className="ea-header">
          <div className="ea-header-content">
            <div className="ea-header-title">
              <h1 className="ea-page-title">
                <AlertTriangle className="ea-header-icon" size={28} />
                Emergency Alerts
              </h1>
              <p className="ea-page-subtitle">Monitor and respond to patient emergencies</p>
            </div>
            <div className="ea-header-actions">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="ea-btn-secondary ea-btn-refresh"
              >
                <RefreshCw className={`ea-btn-icon ${refreshing ? 'ea-spinning' : ''}`} size={20} />
                Refresh
              </button>
              <button
                onClick={createSampleAlert}
                className="ea-btn-secondary"
              >
                Create Sample Alert
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="ea-btn-primary"
              >
                <Plus size={20} className="ea-btn-icon" />
                New Alert
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="ea-error-banner">
            <div className="ea-error-content">
              <AlertTriangle className="ea-error-icon" size={20} />
              <p className="ea-error-message">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ea-error-close"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="ea-dashboard">
          <div className="ea-stats-grid">
            <div className="ea-stat-card ea-stat-blue">
              <div className="ea-stat-content">
                <div className="ea-stat-icon">
                  <Bell size={24} />
                </div>
                <div className="ea-stat-info">
                  <p className="ea-stat-label">Total Alerts</p>
                  <p className="ea-stat-value">
                    {stats.overview?.totalAlerts || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ea-stat-card ea-stat-red">
              <div className="ea-stat-content">
                <div className="ea-stat-icon">
                  <Activity size={24} />
                </div>
                <div className="ea-stat-info">
                  <p className="ea-stat-label">Active Alerts</p>
                  <p className="ea-stat-value ea-text-red">
                    {stats.overview?.activeAlerts || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ea-stat-card ea-stat-orange">
              <div className="ea-stat-content">
                <div className="ea-stat-icon">
                  <Heart size={24} />
                </div>
                <div className="ea-stat-info">
                  <p className="ea-stat-label">Critical Today</p>
                  <p className="ea-stat-value ea-text-orange">
                    {stats.byType?.criticalAlerts || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="ea-stat-card ea-stat-green">
              <div className="ea-stat-content">
                <div className="ea-stat-icon">
                  <Thermometer size={24} />
                </div>
                <div className="ea-stat-info">
                  <p className="ea-stat-label">Resolved</p>
                  <p className="ea-stat-value ea-text-green">
                    {stats.overview?.resolvedAlerts || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="ea-metrics-grid">
            <div className="ea-metric-card">
              <h3 className="ea-metric-title">Performance Metrics</h3>
              <div className="ea-metric-list">
                <div className="ea-metric-item">
                  <div className="ea-metric-label">
                    <span>Average Resolution Time</span>
                    <span>{stats.performance?.avgResolutionTime || 0} minutes</span>
                  </div>
                  <div className="ea-metric-bar">
                    <div 
                      className="ea-metric-fill ea-metric-blue" 
                      style={{ width: `${Math.min(stats.performance?.avgResolutionTime || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ea-metric-item">
                  <div className="ea-metric-label">
                    <span>Resolution Rate</span>
                    <span>{stats.performance?.resolutionRate || 0}%</span>
                  </div>
                  <div className="ea-metric-bar">
                    <div 
                      className="ea-metric-fill ea-metric-green" 
                      style={{ width: `${stats.performance?.resolutionRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ea-metric-card">
              <h3 className="ea-metric-title">Alerts by Type</h3>
              <div className="ea-alert-types">
                <div className="ea-alert-type">
                  <div className="ea-type-indicator ea-type-critical"></div>
                  <span className="ea-type-label">Critical</span>
                  <span className="ea-type-count">{stats.byType?.criticalAlerts || 0}</span>
                </div>
                <div className="ea-alert-type">
                  <div className="ea-type-indicator ea-type-urgent"></div>
                  <span className="ea-type-label">Urgent</span>
                  <span className="ea-type-count">{stats.byType?.urgentAlerts || 0}</span>
                </div>
                <div className="ea-alert-type">
                  <div className="ea-type-indicator ea-type-non-urgent"></div>
                  <span className="ea-type-label">Non-urgent</span>
                  <span className="ea-type-count">{stats.byType?.nonUrgentAlerts || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="ea-filters">
            <div className="ea-filters-header">
              <div className="ea-filters-title">
                <h3 className="ea-section-title">
                  <Filter size={20} className="ea-section-icon" />
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="ea-clear-filters"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="ea-filters-body">
              <div className="ea-filters-grid">
                <div className="ea-filter-group">
                  <label className="ea-filter-label">Search Patient</label>
                  <div className="ea-search-input">
                    <Search className="ea-search-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Patient name..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="ea-input"
                    />
                  </div>
                </div>
                
                <div className="ea-filter-group">
                  <label className="ea-filter-label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="ea-select"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                </div>
                
                <div className="ea-filter-group">
                  <label className="ea-filter-label">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="ea-select"
                  >
                    <option value="All">All Types</option>
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Non-urgent">Non-urgent</option>
                  </select>
                </div>
                
                <div className="ea-filter-group">
                  <label className="ea-filter-label">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="ea-select"
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div className="ea-filter-actions">
                  <button
                    onClick={() => fetchAlerts(1)}
                    className="ea-btn-primary"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="ea-alerts-list">
            <div className="ea-list-header">
              <div className="ea-list-title">
                <h3 className="ea-section-title">
                  Emergency Alerts ({totalAlerts || 0})
                </h3>
                <div className="ea-page-info">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>
            
            {filteredAlerts.length === 0 ? (
              <div className="ea-empty-state">
                <AlertTriangle className="ea-empty-icon" size={48} />
                <h3 className="ea-empty-title">No Emergency Alerts</h3>
                <p className="ea-empty-text">
                  {alerts.length === 0 
                    ? "No emergency alerts have been created yet." 
                    : "No alerts match your current filters."
                  }
                </p>
              </div>
            ) : (
              <div className="ea-alerts-items">
                {filteredAlerts.map(alert => (
                  <div
                    key={alert._id}
                    className={`ea-alert-item ${getAlertTypeClass(alert.type)}`}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="ea-alert-content">
                      <div className="ea-alert-main">
                        <div className="ea-alert-meta">
                          <span className={`ea-alert-type-badge ${getAlertTypeClass(alert.type)}`}>
                            {alert.type}
                          </span>
                          <span className={`ea-alert-status ${getStatusClass(alert.status)}`}>
                            {getStatusIcon(alert.status)}
                            <span>{alert.status}</span>
                          </span>
                          {alert.priority && (
                            <span className="ea-priority-badge">
                              {alert.priority} Priority
                            </span>
                          )}
                        </div>
                        
                        <div className="ea-patient-info">
                          <User className="ea-patient-icon" size={16} />
                          <span className="ea-patient-name">{alert.patientName}</span>
                          {alert.patientPhone && (
                            <>
                              <Phone className="ea-phone-icon" size={16} />
                              <span className="ea-phone-number">{alert.patientPhone}</span>
                            </>
                          )}
                        </div>
                        
                        <p className="ea-alert-description">{alert.description}</p>
                        
                        {alert.location && (
                          <p className="ea-alert-location">
                            <strong>Location:</strong> {alert.location}
                          </p>
                        )}
                        
                        {alert.symptoms && alert.symptoms.length > 0 && (
                          <div className="ea-symptoms">
                            <p className="ea-symptoms-label">Symptoms:</p>
                            <div className="ea-symptoms-list">
                              {alert.symptoms.map((symptom, index) => (
                                <span key={index} className="ea-symptom-tag">
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {alert.vitalSigns && Object.keys(alert.vitalSigns).length > 0 && (
                          <div className="ea-vitals">
                            {alert.vitalSigns.heartRate && (
                              <span>HR: {alert.vitalSigns.heartRate} bpm</span>
                            )}
                            {alert.vitalSigns.bloodPressure && (
                              <span>
                                BP: {alert.vitalSigns.bloodPressure.systolic}/{alert.vitalSigns.bloodPressure.diastolic}
                              </span>
                            )}
                            {alert.vitalSigns.oxygenSaturation && (
                              <span>O2: {alert.vitalSigns.oxygenSaturation}%</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="ea-alert-side">
                        <div className="ea-alert-time">
                          <Clock size={14} />
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                        <p className="ea-alert-doctor">Dr. {alert.assignedDoctorName}</p>
                        {alert.responseTimeMinutes && (
                          <p className="ea-alert-response">
                            Resolved in {alert.responseTimeMinutes} min
                          </p>
                        )}
                        <button className="ea-alert-menu">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ea-pagination">
              <p className="ea-pagination-info">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalAlerts)} of {totalAlerts} results
              </p>
              <div className="ea-pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="ea-pagination-btn"
                >
                  Previous
                </button>
                <span className="ea-pagination-current">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="ea-pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <CreateAlertModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAlert}
          doctorInfo={doctorInfo}
        />
      )}

      {/* Alert Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div className="ea-modal-overlay">
          <div className="ea-modal">
            <div className="ea-modal-header">
              <div className="ea-modal-title-wrap">
                <h2 className="ea-modal-title">Emergency Alert Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="ea-modal-close"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="ea-modal-body">
              {/* Patient Information */}
              <div className="ea-modal-section">
                <h3 className="ea-modal-section-title">Patient Information</h3>
                <div className="ea-patient-details">
                  <div className="ea-detail-row">
                    <span className="ea-detail-label">Name:</span>
                    <span className="ea-detail-value">{selectedAlert.patientName}</span>
                  </div>
                  <div className="ea-detail-row">
                    <span className="ea-detail-label">Phone:</span>
                    <span className="ea-detail-value">{selectedAlert.patientPhone || 'N/A'}</span>
                  </div>
                  <div className="ea-detail-row">
                    <span className="ea-detail-label">Gender:</span>
                    <span className="ea-detail-value">{selectedAlert.patientGender || 'N/A'}</span>
                  </div>
                  <div className="ea-detail-row">
                    <span className="ea-detail-label">Blood Group:</span>
                    <span className="ea-detail-value">{selectedAlert.patientBloodGroup || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Alert Details */}
              <div className="ea-modal-section">
                <h3 className="ea-modal-section-title">Alert Details</h3>
                <div className="ea-alert-details">
                  <div className="ea-alert-meta">
                    <span className={`ea-alert-type-badge ${getAlertTypeClass(selectedAlert.type)}`}>
                      {selectedAlert.type}
                    </span>
                    <span className={`ea-alert-status ${getStatusClass(selectedAlert.status)}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                  <p className="ea-alert-description">{selectedAlert.description}</p>
                  {selectedAlert.location && (
                    <p className="ea-alert-location">
                      <strong>Location:</strong> {selectedAlert.location}
                    </p>
                  )}
                  {selectedAlert.symptoms && selectedAlert.symptoms.length > 0 && (
                    <div className="ea-symptoms">
                      <p className="ea-symptoms-label">Symptoms:</p>
                      <div className="ea-symptoms-list">
                        {selectedAlert.symptoms.map((symptom, index) => (
                          <span key={index} className="ea-symptom-tag">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vital Signs */}
              {selectedAlert.vitalSigns && Object.keys(selectedAlert.vitalSigns).length > 0 && (
                <div className="ea-modal-section">
                  <h3 className="ea-modal-section-title">Vital Signs</h3>
                  <div className="ea-vitals-grid">
                    {selectedAlert.vitalSigns.heartRate && (
                      <div className="ea-vital-item">
                        <span className="ea-vital-label">Heart Rate:</span>
                        <span className="ea-vital-value">{selectedAlert.vitalSigns.heartRate} bpm</span>
                      </div>
                    )}
                    {selectedAlert.vitalSigns.bloodPressure && (
                      <div className="ea-vital-item">
                        <span className="ea-vital-label">Blood Pressure:</span>
                        <span className="ea-vital-value">
                          {selectedAlert.vitalSigns.bloodPressure.systolic}/{selectedAlert.vitalSigns.bloodPressure.diastolic}
                        </span>
                      </div>
                    )}
                    {selectedAlert.vitalSigns.oxygenSaturation && (
                      <div className="ea-vital-item">
                        <span className="ea-vital-label">Oxygen Saturation:</span>
                        <span className="ea-vital-value">{selectedAlert.vitalSigns.oxygenSaturation}%</span>
                      </div>
                    )}
                    {selectedAlert.vitalSigns.temperature && (
                      <div className="ea-vital-item">
                        <span className="ea-vital-label">Temperature:</span>
                        <span className="ea-vital-value">{selectedAlert.vitalSigns.temperature}°F</span>
                      </div>
                    )}
                    {selectedAlert.vitalSigns.respiratoryRate && (
                      <div className="ea-vital-item">
                        <span className="ea-vital-label">Respiratory Rate:</span>
                        <span className="ea-vital-value">{selectedAlert.vitalSigns.respiratoryRate}</span>
                      </div>
                    )}
                    {selectedAlert.vitalSigns.bloodSugar && (
                      <div className="ea-vital-item">
                        <span className="ea-vital-label">Blood Sugar:</span>
                        <span className="ea-vital-value">{selectedAlert.vitalSigns.bloodSugar} mg/dL</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resolution Information */}
              {selectedAlert.status === 'Resolved' && (
                <div className="ea-modal-section">
                  <h3 className="ea-modal-section-title">Resolution Information</h3>
                  <div className="ea-resolution-details">
                    <div className="ea-detail-row">
                      <span className="ea-detail-label">Resolved By:</span>
                      <span className="ea-detail-value">{selectedAlert.resolvedBy || 'Unknown'}</span>
                    </div>
                    <div className="ea-detail-row">
                      <span className="ea-detail-label">Resolved At:</span>
                      <span className="ea-detail-value">
                        {selectedAlert.resolvedAt ? new Date(selectedAlert.resolvedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {selectedAlert.resolutionTime && (
                      <div className="ea-detail-row">
                        <span className="ea-detail-label">Resolution Time:</span>
                        <span className="ea-detail-value">{selectedAlert.resolutionTime} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="ea-modal-footer">
              <div className="ea-modal-actions">
                {selectedAlert.status === 'Active' && (
                  <>
                    <button
                      onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'In Progress' })}
                      className="ea-btn-secondary"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'Resolved' })}
                      className="ea-btn-primary"
                    >
                      Mark Resolved
                    </button>
                  </>
                )}
                {selectedAlert.status === 'In Progress' && (
                  <button
                    onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'Resolved' })}
                    className="ea-btn-primary"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedAlert.status === 'Resolved' && (
                  <button
                    onClick={() => handleUpdateAlert(selectedAlert._id, { status: 'Active' })}
                    className="ea-btn-primary"
                  >
                    Reopen Alert
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="ea-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyAlertsPage;