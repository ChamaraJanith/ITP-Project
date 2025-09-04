import React, { useState, useEffect } from 'react';
import './styles/RestockDashboard.css';

const RestockDashboard = ({ apiBaseUrl }) => {
  const [restockOrders, setRestockOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchRestockOrders();
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRestockOrders();
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filter]);

  const fetchRestockOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(filter)) {
          params.append('urgency', filter);
        } else {
          params.append('status', filter);
        }
      }
      
      const response = await fetch(`${apiBaseUrl}/restock-orders?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRestockOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching restock orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/restock-orders/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApproveOrder = async (orderId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/restock-orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approvedBy: 'Admin User', // Replace with actual user
          notes: 'Auto-approved from dashboard'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('✅ Restock order approved successfully!');
        fetchRestockOrders();
      } else {
        alert(`❌ Failed to approve order: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving order:', error);
      alert('❌ Failed to approve order');
    }
  };

  const triggerManualCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/restock-orders/check-low-stock`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('✅ Manual stock check completed!');
        fetchRestockOrders();
      }
    } catch (error) {
      console.error('Error in manual check:', error);
      alert('❌ Manual check failed');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'CRITICAL': return '#dc3545';
      case 'HIGH': return '#fd7e14';
      case 'MEDIUM': return '#ffc107';
      case 'LOW': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'APPROVED': return '#17a2b8';
      case 'ORDERED': return '#007bff';
      case 'DELIVERED': return '#28a745';
      case 'CANCELLED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading restock orders...</p>
      </div>
    );
  }

  return (
    <div className="restock-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>🔄 Automatic Restock Dashboard</h2>
          <p>Monitor and manage inventory restocking operations</p>
        </div>
        <div className="header-actions">
          <button onClick={triggerManualCheck} className="manual-check-btn">
            🔍 Manual Check
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.statusStats?.find(s => s._id === 'PENDING')?.count || 0}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        <div className="stat-card critical">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <h3>{stats.urgencyStats?.find(s => s._id === 'CRITICAL')?.count || 0}</h3>
            <p>Critical Items</p>
          </div>
        </div>
        <div className="stat-card delivered">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.statusStats?.find(s => s._id === 'DELIVERED')?.count || 0}</h3>
            <p>Delivered Today</p>
          </div>
        </div>
        <div className="stat-card total-cost">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${stats.statusStats?.reduce((sum, s) => sum + (s.totalCost || 0), 0).toFixed(2)}</h3>
            <p>Total Estimated</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All Orders</option>
            <optgroup label="By Urgency">
              <option value="CRITICAL">🚨 Critical</option>
              <option value="HIGH">🔥 High Priority</option>
              <option value="MEDIUM">⚠️ Medium</option>
              <option value="LOW">✅ Low</option>
            </optgroup>
            <optgroup label="By Status">
              <option value="PENDING">⏳ Pending Approval</option>
              <option value="APPROVED">✅ Approved</option>
              <option value="ORDERED">📦 Ordered</option>
              <option value="DELIVERED">🚚 Delivered</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {restockOrders.map(order => (
          <div key={order._id} className={`order-card ${order.urgency.toLowerCase()}-urgency`}>
            <div className="order-header">
              <div className="item-info">
                <h3>{order.itemName}</h3>
                <span className="category">{order.itemId?.category}</span>
              </div>
              <div className="badges">
                <span 
                  className="urgency-badge"
                  style={{ backgroundColor: getUrgencyColor(order.urgency) }}
                >
                  {order.urgency}
                </span>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
            </div>
            
            <div className="order-details">
              <div className="stock-info">
                <div className="stock-row">
                  <span className="label">Current Stock:</span>
                  <span className={`value ${order.currentStock <= order.minStockLevel * 0.2 ? 'critical' : 'warning'}`}>
                    {order.currentStock}
                  </span>
                </div>
                <div className="stock-row">
                  <span className="label">Min Level:</span>
                  <span className="value">{order.minStockLevel}</span>
                </div>
                <div className="stock-row">
                  <span className="label">Reorder Qty:</span>
                  <span className="value highlight">{order.reorderQuantity}</span>
                </div>
              </div>
              
              <div className="supplier-info">
                <p><strong>Supplier:</strong> {order.supplier.name}</p>
                <p><strong>Est. Cost:</strong> ${order.estimatedCost?.toFixed(2) || '0.00'}</p>
                <p><strong>Expected:</strong> {new Date(order.expectedDelivery).toLocaleDateString()}</p>
                {order.createdAt && (
                  <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            
            {order.status === 'PENDING' && (
              <div className="order-actions">
                <button 
                  className="approve-btn"
                  onClick={() => handleApproveOrder(order._id)}
                >
                  ✅ Approve Order
                </button>
                <button className="details-btn">
                  📋 View Details
                </button>
              </div>
            )}

            {order.status === 'APPROVED' && (
              <div className="order-info">
                <p className="approved-info">
                  ✅ Approved by {order.approvedBy}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {restockOrders.length === 0 && (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h3>No restock orders found</h3>
          <p>No orders match the current filter criteria.</p>
          <button onClick={triggerManualCheck} className="check-now-btn">
            🔍 Check for Low Stock Now
          </button>
        </div>
      )}
    </div>
  );
};

export default RestockDashboard;
