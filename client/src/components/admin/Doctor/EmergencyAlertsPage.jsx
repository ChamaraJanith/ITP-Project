import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import LoadingSpinner from './LoadingSpinner';
import './EmergencyAlertsPage.css';

const EmergencyAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    criticalAlerts: 0,
    urgentAlerts: 0,
    alertsByDay: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  
  // Use ref to prevent multiple initialization calls
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  // Memoized fetch functions to prevent recreation on every render
  const fetchAlerts = useCallback(async () => {
    try {
      console.log('Fetching alerts from emergency alerts endpoint');
      
      const response = await fetch('http://localhost:7000/api/doctor/emergency-alerts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Alerts response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched alerts data:', data);
      
      if (data.success) {
        const alertsArray = Array.isArray(data.data) ? data.data : [];
        setAlerts(alertsArray);
        console.log(`Successfully loaded ${alertsArray.length} alerts`);
        return alertsArray;
      } else {
        throw new Error(data.message || 'Failed to fetch alerts');
      }
    } catch (err) {
      console.error("Error fetching emergency alerts:", err);
      setError(`Failed to fetch alerts: ${err.message}`);
      throw err;
    }
  }, []); // Empty dependencies - this function doesn't depend on any state

  const fetchStats = useCallback(async () => {
    try {
      console.log('Fetching stats from emergency alerts stats endpoint');
      
      const response = await fetch('http://localhost:7000/api/doctor/emergency-alerts/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Stats response status:', response.status);
      
      if (!response.ok) {
        console.warn('Stats fetch failed, using default stats');
        return;
      }
      
      const data = await response.json();
      console.log('Fetched stats data:', data);
      
      if (data.success && data.data) {
        setStats({
          totalAlerts: data.data.totalAlerts || 0,
          activeAlerts: data.data.activeAlerts || 0,
          resolvedAlerts: data.data.resolvedAlerts || 0,
          criticalAlerts: data.data.criticalAlerts || 0,
          urgentAlerts: data.data.urgentAlerts || 0,
          alertsByDay: data.data.alertsByDay || []
        });
        console.log('Stats updated successfully');
      }
    } catch (err) {
      console.warn("Stats fetch failed, using defaults:", err);
      // Don't throw error for stats - it's not critical
    }
  }, []); // Empty dependencies

  const testConnection = useCallback(async () => {
    try {
      console.log('Testing connection to emergency alerts health endpoint');
      
      const response = await fetch('http://localhost:7000/api/doctor/emergency-alerts/test/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Test connection response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Connection test successful:', data);
      return data;
    } catch (err) {
      console.error('Connection test failed:', err);
      throw new Error(`Server connection failed: ${err.message}`);
    }
  }, []); // Empty dependencies

  // Memoized initialization function
  const initializeData = useCallback(async () => {
    if (isInitialized.current) {
      console.log('Already initialized, skipping...');
      return;
    }
    
    console.log('Initializing data...');
    isInitialized.current = true;
    
    try {
      setLoading(true);
      setError('');
      setConnectionStatus('Connecting...');

      // Test connection first
      console.log('Testing connection...');
      await testConnection();
      setConnectionStatus('Connected');
      console.log('Connection successful');
      
      // Fetch data in parallel
      console.log('Fetching alerts and stats...');
      const results = await Promise.allSettled([
        fetchAlerts(),
        fetchStats()
      ]);
      
      // Check if alerts fetch failed (critical)
      if (results[0].status === 'rejected') {
        throw results[0].reason;
      }
      
      console.log('Data initialization completed');
    } catch (err) {
      console.error('Initialization error:', err);
      setError(`Connection failed: ${err.message}`);
      setConnectionStatus('Failed');
      isInitialized.current = false; // Allow retry
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  }, [testConnection, fetchAlerts, fetchStats]);

  // Initialize only once when component mounts
  useEffect(() => {
    console.log('Component mounted, initializing...');
    
    // Get doctor info from localStorage (only once)
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        console.log('Admin data found:', parsedAdmin);
        setDoctor(parsedAdmin);
      } catch (e) {
        console.error('Error parsing admin data:', e);
      }
    }
    
    // Initialize data
    initializeData();
  }, []); // Empty dependency array - only run once on mount

  // Apply filters when alerts or filter values change
  useEffect(() => {
    let result = [...alerts];
    
    if (statusFilter !== 'All') {
      result = result.filter(alert => alert.status === statusFilter);
    }
    
    if (typeFilter !== 'All') {
      result = result.filter(alert => alert.type === typeFilter);
    }
    
    setFilteredAlerts(result);
    console.log(`Filtered ${result.length} alerts from ${alerts.length} total`);
  }, [alerts, statusFilter, typeFilter]);

  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
    setResolutionNotes(alert.notes || '');
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedAlert) return;
    
    try {
      console.log('Updating alert status:', selectedAlert._id, newStatus);
      
      const response = await fetch(`http://localhost:7000/api/doctor/emergency-alerts/${selectedAlert._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: resolutionNotes,
          resolvedBy: doctor?.name || doctor?.username || 'Unknown Doctor'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        // Update the alert in the list
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert._id === selectedAlert._id ? data.data : alert
          )
        );
        
        // Refresh stats (don't await to avoid blocking UI)
        fetchStats().catch(console.warn);
        
        // Close modal
        setShowModal(false);
        setSelectedAlert(null);
        setError('');
      } else {
        setError(data.message || 'Failed to update alert status');
      }
    } catch (err) {
      console.error("Error updating emergency alert:", err);
      setError(`Failed to update alert status: ${err.message}`);
    }
  };

  const createSampleAlert = async () => {
    try {
      console.log('Creating sample alert...');
      const sampleAlert = {
        patientId: `P${Date.now()}`,
        patientName: 'Test Patient',
        patientEmail: 'test@example.com',
        patientPhone: '+1234567890',
        patientGender: 'Male',
        type: 'Urgent',
        description: 'Sample emergency alert for testing purposes',
        assignedDoctorId: doctor?.id || doctor?._id || 'DOC001',
        assignedDoctorName: doctor?.name || doctor?.username || 'Dr. Test',
        assignedDoctorSpecialization: doctor?.specialization || 'General Medicine'
      };

      const response = await fetch('http://localhost:7000/api/doctor/emergency-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleAlert)
      });

      if (response.ok) {
        console.log('Sample alert created successfully');
        // Refresh data
        await fetchAlerts();
        await fetchStats();
        setError('');
      } else {
        const errorText = await response.text();
        console.error('Failed to create sample alert:', errorText);
        setError('Failed to create sample alert');
      }
    } catch (err) {
      console.error('Error creating sample alert:', err);
      setError(`Error creating sample alert: ${err.message}`);
    }
  };

  // Manual retry function
  const retryInitialization = () => {
    console.log('Manual retry triggered');
    isInitialized.current = false; // Reset initialization flag
    setError('');
    setLoading(true);
    initializeData();
  };

  // Utility functions
  const getAlertTypeClass = (type) => {
    switch (type) {
      case 'Critical': return 'alert-critical';
      case 'Urgent': return 'alert-urgent';
      default: return 'alert-non-urgent';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Resolved': return 'status-resolved';
      default: return 'status-dismissed';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  console.log('Rendering component, loading:', loading, 'alerts:', alerts.length, 'doctor:', !!doctor);

  if (loading) {
    return (
      <AdminLayout admin={doctor} title="Emergency Alerts">
        <div className="loading-container">
          <LoadingSpinner size="large" />
          <h3>Loading Emergency Alerts...</h3>
          <p>Status: {connectionStatus}</p>
          <div className="loading-actions">
            <button 
              onClick={retryInitialization}
              className="retry-button"
            >
              Retry Connection
            </button>
            <button 
              onClick={async () => {
                try {
                  await testConnection();
                  setConnectionStatus('Connected');
                  setError('');
                } catch (err) {
                  setConnectionStatus('Failed');
                  setError(err.message);
                }
              }}
              className="test-button"
            >
              Test Connection
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={doctor} title="Emergency Alerts">
      <div className="emergency-alerts-page">
        <div className="page-header">
          <h1>🚨 Emergency Alerts</h1>
          <p>Manage and respond to patient emergency situations</p>
          <p>Status: <span className={`status ${connectionStatus === 'Connected' ? 'connected' : 'error'}`}>{connectionStatus}</span></p>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <div className="error-actions">
              <button onClick={retryInitialization} className="retry-button">
                Retry
              </button>
              <button onClick={() => setError('')} className="close-button">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Development Tools */}
        <div className="dev-tools">
          <button onClick={createSampleAlert} className="create-sample-btn">
            Create Sample Alert
          </button>
          <button onClick={async () => {
            try {
              await testConnection();
              setConnectionStatus('Connected');
              setError('');
            } catch (err) {
              setConnectionStatus('Failed');
              setError(err.message);
            }
          }} className="test-connection-btn">
            Test Connection
          </button>
        </div>

        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalAlerts}</h3>
            <p>Total Alerts</p>
          </div>
          <div className="stat-card alert-stat">
            <h3>{stats.activeAlerts}</h3>
            <p>Active Alerts</p>
          </div>
          <div className="stat-card resolved-stat">
            <h3>{stats.resolvedAlerts}</h3>
            <p>Resolved Alerts</p>
          </div>
          <div className="stat-card critical-stat">
            <h3>{stats.criticalAlerts}</h3>
            <p>Critical Alerts</p>
          </div>
          <div className="stat-card urgent-stat">
            <h3>{stats.urgentAlerts}</h3>
            <p>Urgent Alerts</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter"
              name="status-filter"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="type-filter">Type:</label>
            <select 
              id="type-filter"
              name="type-filter"
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Types</option>
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
              <option value="Non-urgent">Non-urgent</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              setStatusFilter('All');
              setTypeFilter('All');
            }}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>

        {/* Alerts List */}
        <div className="alerts-section">
          <h2>Emergency Alerts ({filteredAlerts.length})</h2>
          
          {filteredAlerts.length === 0 ? (
            <div className="no-alerts">
              <div className="no-alerts-icon">📋</div>
              <div className="no-alerts-text">
                {alerts.length === 0 
                  ? "No emergency alerts found. Create a sample alert to get started." 
                  : "No alerts match your current filters"}
              </div>
            </div>
          ) : (
            <div className="alerts-list">
              {filteredAlerts.map(alert => (
                <div 
                  key={alert._id} 
                  className={`alert-card ${getAlertTypeClass(alert.type)}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="alert-header">
                    <div className="alert-patient">
                      <span className="patient-name">{alert.patientName}</span>
                      <span className={`alert-type ${getAlertTypeClass(alert.type)}`}>
                        {alert.type}
                      </span>
                    </div>
                    <div className={`alert-status ${getStatusClass(alert.status)}`}>
                      {alert.status}
                    </div>
                  </div>
                  
                  <div className="alert-description">
                    {alert.description}
                  </div>
                  
                  <div className="alert-footer">
                    <div className="alert-doctor">
                      Assigned to: {alert.assignedDoctorName}
                    </div>
                    <div className="alert-date">
                      {formatDate(alert.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Detail Modal */}
        {showModal && selectedAlert && (
          <div className="alert-modal-overlay">
            <div className="alert-modal">
              <div className="modal-header">
                <h2>Emergency Alert Details</h2>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="alert-detail-section">
                  <h3>Patient Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span>{selectedAlert.patientName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">ID:</span>
                      <span>{selectedAlert.patientId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span>{selectedAlert.patientEmail || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span>{selectedAlert.patientPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="alert-detail-section">
                  <h3>Alert Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span className={`alert-type ${getAlertTypeClass(selectedAlert.type)}`}>
                        {selectedAlert.type}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`alert-status ${getStatusClass(selectedAlert.status)}`}>
                        {selectedAlert.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned Doctor:</span>
                      <span>{selectedAlert.assignedDoctorName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span>{formatDate(selectedAlert.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="alert-detail-section">
                  <h3>Description</h3>
                  <div className="alert-description-text">
                    {selectedAlert.description}
                  </div>
                </div>
                
                <div className="alert-detail-section">
                  <h3>Resolution Notes</h3>
                  <textarea
                    id="resolution-notes"
                    name="resolution-notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="resolution-notes"
                    rows={4}
                    placeholder="Add notes about how this alert was resolved..."
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                {selectedAlert.status === 'Active' && (
                  <>
                    <button 
                      className="action-btn resolve-btn"
                      onClick={() => handleStatusChange('Resolved')}
                    >
                      Mark as Resolved
                    </button>
                    <button 
                      className="action-btn dismiss-btn"
                      onClick={() => handleStatusChange('Dismissed')}
                    >
                      Dismiss
                    </button>
                  </>
                )}
                
                {selectedAlert.status !== 'Active' && (
                  <button 
                    className="action-btn reopen-btn"
                    onClick={() => handleStatusChange('Active')}
                  >
                    Reopen Alert
                  </button>
                )}
                
                <button 
                  className="action-btn close-btn"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EmergencyAlertsPage;