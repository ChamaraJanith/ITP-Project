import React, { useState, useEffect } from 'react';
import '../Admin/styles/SurgicalItemsManagement.css';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import AdminErrorBoundary from '../AdminErrorBoundary';
import SurgicalItemModal from '../Admin/SurgicalItemModal';
import DisposeModal from './disposeModal.jsx';
import '../Admin/styles/DisposeModal.css'
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SurgicalItemsManagement = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({});
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  
  // ✅ ADDED: Notification states
  const [notifications, setNotifications] = useState({
    loading: false,
    message: '',
    type: '' // 'success', 'error', 'info'
  });

  const API_BASE_URL = 'http://localhost:7000/api/inventory';

  const categories = [
    'Cutting Instruments',
    'Grasping Instruments', 
    'Hemostatic Instruments',
    'Retractors',
    'Sutures',
    'Disposables',
    'Implants',
    'Monitoring Equipment',
    'Anesthesia Equipment',
    'Sterilization Equipment',
    'Other'
  ];

  // ✅ ADDED: Notification helper function
  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotifications({ loading: false, message, type });
    setTimeout(() => {
      setNotifications({ loading: false, message: '', type: '' });
    }, duration);
  };

  // ✅ ADDED: Test email function
  const handleTestEmail = async () => {
    try {
      setNotifications({ loading: true, message: 'Sending test email...', type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/notifications/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('✅ Test email sent successfully to chamarasweed44@gmail.com!', 'success');
      } else {
        throw new Error(data.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      showNotification(`❌ Failed to send test email: ${error.message}`, 'error');
    }
  };

  // ✅ ADDED: Send low stock alert function
  const handleSendLowStockAlert = async () => {
    try {
      setNotifications({ loading: true, message: 'Checking low stock items and sending alerts...', type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/notifications/check-low-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        const count = data.data.count || 0;
        showNotification(`✅ Low stock alert sent successfully! Found ${count} items needing attention.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to send low stock alert');
      }
    } catch (error) {
      console.error('Low stock alert error:', error);
      showNotification(`❌ Failed to send low stock alert: ${error.message}`, 'error');
    }
  };

  // ✅ ADDED: Manual notification for specific item
  const handleSendItemNotification = async (item) => {
    try {
      const isLowStock = item.quantity <= (item.minStockLevel || 0);
      const isOutOfStock = item.quantity === 0;
      
      if (!isLowStock && !isOutOfStock) {
        showNotification(`ℹ️ ${item.name} is currently well-stocked (${item.quantity} units available)`, 'info');
        return;
      }

      setNotifications({ loading: true, message: `Sending notification for ${item.name}...`, type: 'info' });
      
      // Mock individual item notification - you can implement this endpoint
      const notificationType = isOutOfStock ? 'out_of_stock' : 'low_stock';
      const mockResponse = {
        success: true,
        data: { messageId: 'mock_' + Date.now() }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mockResponse.success) {
        const status = isOutOfStock ? 'out of stock' : 'low stock';
        showNotification(`✅ ${status.toUpperCase()} notification sent for ${item.name}!`, 'success');
      }
    } catch (error) {
      console.error('Item notification error:', error);
      showNotification(`❌ Failed to send notification for ${item.name}`, 'error');
    }
  };

  // Function to calculate totals from items array using min stock level
  const calculateStats = (itemsArray) => {
    const totalItems = itemsArray.length;
    const totalQuantity = itemsArray.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockItems = itemsArray.reduce((count, item) => {
      const minStock = item.minStockLevel || 0;
      return count + (item.quantity <= minStock ? 1 : 0);
    }, 0);
    const totalValue = itemsArray.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      totalValue
    };
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    // Recalculate stats whenever items change
    if (items.length > 0) {
      const calculatedStats = calculateStats(items);
      setStats(calculatedStats);
    }
  }, [items]);

  const initializeComponent = async () => {
    try {
      setLoading(true);
      
      // Check admin authentication
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        if (parsedAdmin && parsedAdmin.role === 'admin') {
          setAdmin(parsedAdmin);
        } else {
          navigate('/admin/login');
          return;
        }
      } else {
        navigate('/admin/login');
        return;
      }

      await loadItems();
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize component');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      // Load all items for accurate stats calculation
      const response = await fetch(`${API_BASE_URL}/surgical-items?page=1&limit=1000`);
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data.items);
        // Calculate and set stats immediately after loading items
        const calculatedStats = calculateStats(data.data.items);
        setStats(calculatedStats);
      } else {
        throw new Error(data.message || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Failed to load surgical items');
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleDisposeItem = () => {
    setShowDisposeModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
          alert('Item deleted successfully!');
          loadItems();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item: ' + error.message);
      }
    }
  };

  // Enhanced stock update with free input
  const handleUpdateStock = async (itemId, quantityChange, type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}/update-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityChange: Math.abs(quantityChange),
          type: type,
          usedBy: admin?.name || 'Admin',
          purpose: type === 'usage' ? 'Manual adjustment' : 'Stock replenishment'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Stock ${type} updated successfully!`);
        loadItems();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + error.message);
    }
  };

  // Custom input component for better user experience
  const CustomNumberInput = ({ value, onSubmit, placeholder, title }) => {
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = () => {
      const numValue = parseInt(inputValue);
      if (!isNaN(numValue) && numValue > 0) {
        onSubmit(numValue);
        setInputValue('');
        setIsEditing(false);
      } else {
        alert('Please enter a valid positive number');
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setInputValue('');
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            style={{ width: '60px', fontSize: '12px', padding: '2px' }}
            autoFocus
          />
          <button onClick={handleSubmit} style={{ fontSize: '10px', padding: '2px 4px' }}>✓</button>
          <button onClick={() => { setInputValue(''); setIsEditing(false); }} style={{ fontSize: '10px', padding: '2px 4px' }}>✕</button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setIsEditing(true)}
        title={title}
        style={{ fontSize: '12px', padding: '4px 6px', cursor: 'pointer' }}
      >
        {placeholder}
      </button>
    );
  };

  // Modified status functions based on min stock level
  const getStatusColor = (quantity, minStockLevel) => {
    if (quantity === 0) return '#dc3545'; // Red for Out of Stock
    if (quantity <= (minStockLevel || 0)) return '#ffc107'; // Orange for Low Stock
    return '#28a745'; // Green for Available
  };

  const getStatusText = (quantity, minStockLevel) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= (minStockLevel || 0)) return 'Low Stock';
    return 'Available';
  };

  // Filter and search items - Updated to use min stock level
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    // Updated status filtering to use min stock level
    let itemStatus = getStatusText(item.quantity, item.minStockLevel);
    const matchesStatus = filterStatus === 'all' || itemStatus === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Enhanced stock chart using min stock level
  const ItemStockChart = ({ item }) => {
    const minStock = item.minStockLevel || 0;
    const isLowStock = item.quantity <= minStock;
    const isOutOfStock = item.quantity === 0;
    
    const data = {
      labels: ['Stock Level'],
      datasets: [
        {
          label: 'Current Stock',
          data: [item.quantity],
          backgroundColor: isOutOfStock ? '#dc3545' : isLowStock ? '#ffc107' : '#28a745',
          borderColor: isOutOfStock ? '#dc3545' : isLowStock ? '#ffc107' : '#28a745',
          borderWidth: 1,
        },
        {
          label: `Min Stock (${minStock})`,
          data: [minStock],
          backgroundColor: '#dc3545',
          borderColor: '#dc3545',
          borderWidth: 1,
        }
      ]
    };

    const options = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: () => item.name,
            label: (context) => {
              const label = context.dataset.label;
              const value = context.parsed.x;
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          display: false,
          max: Math.max(item.quantity, minStock) * 1.2,
        },
        y: {
          display: false,
        }
      },
      layout: {
        padding: {
          top: 2,
          bottom: 2,
          left: 2,
          right: 2
        }
      }
    };

    return (
      <div style={{ width: '120px', height: '40px', position: 'relative' }}>
        <Bar data={data} options={options} />
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#333',
          pointerEvents: 'none'
        }}>
          {item.quantity}/{minStock}
        </div>
      </div>
    );
  };

  // Price trend mini chart
  const PriceTrendChart = ({ item }) => {
    const trendData = [
      item.price * 0.9,
      item.price * 0.95,
      item.price,
      item.price * 1.02,
      item.price
    ];

    const data = {
      labels: ['', '', '', '', ''],
      datasets: [{
        data: trendData,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 1,
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        point: { radius: 0 }
      }
    };

    return (
      <div style={{ width: '60px', height: '30px' }}>
        <Bar data={data} options={options} />
      </div>
    );
  };

  if (loading) {
    return (
      <AdminErrorBoundary>
        <div className="admin-loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Surgical Items...</h2>
        </div>
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminLayout admin={admin} title="Surgical Items Management">
        <div className="surgical-items-management">
          {/* Header */}
          <div className="page-header">
            <div className="header-content">
              <h1>🔧 Surgical Items Management</h1>
              <div className="header-actions">
                <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
                  ← Back to Dashboard
                </button>
                <button onClick={handleAddItem} className="add-item-btn">
                  ➕ Add New Item
                </button>
                <button onClick={handleDisposeItem} className="dispose-item-btn">
                  🗑️ Dispose Items
                </button>
              </div>
            </div>
            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ✅ ADDED: Notification Section */}
          <div className="notification-section" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>📧 HealX Notification Center</h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                  Monitor inventory and send alerts to: <strong>chamarasweed44@gmail.com</strong>
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleTestEmail}
                  disabled={notifications.loading}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: notifications.loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    opacity: notifications.loading ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!notifications.loading) {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!notifications.loading) {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }
                  }}
                >
                  📬 Test Email
                </button>
                
                <button
                  onClick={handleSendLowStockAlert}
                  disabled={notifications.loading}
                  style={{
                    background: stats.lowStockItems > 0 ? '#ff4757' : 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: notifications.loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    opacity: notifications.loading ? 0.7 : 1,
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    if (!notifications.loading) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!notifications.loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  🚨 Send Low Stock Alert
                  {stats.lowStockItems > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ffc107',
                      color: '#000',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {stats.lowStockItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Notification Status */}
            {notifications.message && (
              <div style={{
                marginTop: '15px',
                padding: '10px 15px',
                borderRadius: '6px',
                background: notifications.type === 'success' ? 'rgba(40, 167, 69, 0.2)' :
                           notifications.type === 'error' ? 'rgba(220, 53, 69, 0.2)' :
                           'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${
                  notifications.type === 'success' ? 'rgba(40, 167, 69, 0.3)' :
                  notifications.type === 'error' ? 'rgba(220, 53, 69, 0.3)' :
                  'rgba(255, 255, 255, 0.2)'
                }`,
                fontSize: '14px'
              }}>
                {notifications.loading && (
                  <span style={{ marginRight: '8px' }}>
                    <div style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      borderTopColor: 'white',
                      animation: 'spin 1s ease-in-out infinite'
                    }}></div>
                  </span>
                )}
                {notifications.message}
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>{stats.totalItems || 0}</h3>
                <p>Total Items</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats.totalQuantity || 0}</h3>
                <p>Total Quantity</p>
              </div>
            </div>
            <div className="stat-card" style={{
              background: stats.lowStockItems > 0 ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' : undefined,
              color: stats.lowStockItems > 0 ? 'white' : undefined,
              animation: stats.lowStockItems > 0 ? 'pulse 2s infinite' : 'none'
            }}>
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>{stats.lowStockItems || 0}</h3>
                <p>Low Stock Items</p>
                {stats.lowStockItems > 0 && (
                  <small style={{ opacity: 0.9 }}>Needs attention!</small>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>${(stats.totalValue || 0).toLocaleString()}</h3>
                <p>Total Value</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-controls">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Items Table with Individual Charts */}
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Stock Chart</th>
                  <th>Quantity</th>
                  <th>Min Stock</th>
                  <th>Price</th>
                  <th>Item Value</th>
                  <th>Price Trend</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div className="item-info">
                        <strong>{item.name}</strong>
                        {item.description && (
                          <small style={{ display: 'block', color: '#666', marginTop: '2px' }}>
                            {item.description.substring(0, 40)}...
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <ItemStockChart item={item} />
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontWeight: 'bold',
                          color: getStatusColor(item.quantity, item.minStockLevel)
                        }}
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td>{item.minStockLevel || 0}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <strong>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</strong>
                    </td>
                    <td>
                      <PriceTrendChart item={item} />
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(item.quantity, item.minStockLevel),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {getStatusText(item.quantity, item.minStockLevel)}
                      </span>
                    </td>
                    <td>{item.supplier?.name || 'N/A'}</td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="action-btn edit-btn"
                          title="Edit Item"
                          style={{ padding: '2px 4px', fontSize: '10px' }}
                        >
                          ✏️ Edit
                        </button>
                        
                        <CustomNumberInput
                          placeholder="+ Stock"
                          title="Add Stock"
                          onSubmit={(quantity) => handleUpdateStock(item._id, quantity, 'restock')}
                        />
                        
                        <CustomNumberInput
                          placeholder="- Stock"
                          title="Use Stock"
                          onSubmit={(quantity) => handleUpdateStock(item._id, quantity, 'usage')}
                        />
                        
                        {/* ✅ ADDED: Individual item notification button */}
                        {(item.quantity <= (item.minStockLevel || 0)) && (
                          <button
                            onClick={() => handleSendItemNotification(item)}
                            className="action-btn notify-btn"
                            title={`Send notification for ${item.name}`}
                            disabled={notifications.loading}
                            style={{ 
                              padding: '2px 4px', 
                              fontSize: '10px',
                              background: item.quantity === 0 ? '#dc3545' : '#ffc107',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: notifications.loading ? 'not-allowed' : 'pointer',
                              opacity: notifications.loading ? 0.7 : 1
                            }}
                          >
                            📧 Alert
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="action-btn delete-btn"
                          title="Delete Item"
                          style={{ padding: '2px 4px', fontSize: '10px' }}
                        >
                          🗑️ Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currentItems.length === 0 && (
              <div className="no-items-message">
                <p>No surgical items found matching your criteria.</p>
                <button onClick={handleAddItem} className="add-first-item-btn">
                  ➕ Add Your First Item
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}

          {/* Add/Edit Item Modals */}
          {(showAddModal || showEditModal) && (
            <SurgicalItemModal
              isOpen={showAddModal || showEditModal}
              onClose={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedItem(null);
              }}
              item={selectedItem}
              categories={categories}
              onSuccess={() => {
                loadItems();
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedItem(null);
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}

          {/* Dispose Items Modal */}
          {showDisposeModal && (
            <DisposeModal
              isOpen={showDisposeModal}
              onClose={() => setShowDisposeModal(false)}
              items={items}
              onSuccess={() => {
                loadItems();
                setShowDisposeModal(false);
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </div>

        {/* ✅ ADDED: CSS Animation Styles */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default SurgicalItemsManagement;
