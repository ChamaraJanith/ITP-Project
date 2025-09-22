import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminErrorBoundary from './AdminErrorBoundary';
import SurgicalItemModal from './SurgicalItemModal';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './SurgicalItemsManagement.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
    'Oxigen Delivery Equipment',
    'Other'
  ];

  useEffect(() => {
    initializeComponent();
  }, []);

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
      await loadStats();
    } catch (error) {
      console.error('❌ Initialization error:', error);
      setError('Failed to initialize component');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/surgical-items?page=${currentPage}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data.items);
      } else {
        throw new Error(data.message || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('❌ Error loading items:', error);
      setError('Failed to load surgical items');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowAddModal(true);
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
          alert('✅ Item deleted successfully!');
          loadItems();
          loadStats();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('❌ Error deleting item:', error);
        alert('❌ Failed to delete item: ' + error.message);
      }
    }
  };

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
        alert(`✅ Stock ${type} updated successfully!`);
        loadItems();
        loadStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      alert('❌ Failed to update stock: ' + error.message);
    }
  };

  // Filter and search items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#28a745';
      case 'Low Stock': return '#ffc107';
      case 'Out of Stock': return '#dc3545';
      case 'Discontinued': return '#6c757d';
      default: return '#007bff';
    }
  };

  // Graphs component
  const Graphs = ({ stats }) => {
    const barData = {
      labels: ['Total Items', 'Total Quantity', 'Low Stock Items'],
      datasets: [
        {
          label: 'Inventory Overview',
          data: [stats.totalItems || 0, stats.totalQuantity || 0, stats.lowStockItems || 0],
          backgroundColor: ['#007bff', '#28a745', '#ffc107'],
          borderColor: ['#0056b3', '#1e7e34', '#e0a800'],
          borderWidth: 1
        }
      ]
    };

    const barOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Inventory Statistics Overview'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    // Prepare pie chart data for item statuses from items array
    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const pieData = {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: Object.keys(statusCounts).map(status => getStatusColor(status)),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };

    const pieOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Items by Status'
        }
      }
    };

    // Category distribution chart
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const categoryData = {
      labels: Object.keys(categoryCounts),
      datasets: [
        {
          label: 'Items by Category',
          data: Object.values(categoryCounts),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB'
          ],
          borderWidth: 1
        }
      ]
    };

    const categoryOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Items Distribution by Category'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return (
      <div className="graphs-container" style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>📊 Inventory Analytics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div className="chart-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Bar data={barData} options={barOptions} />
          </div>
          
          <div className="chart-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Bar data={categoryData} options={categoryOptions} />
        </div>
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
              </div>
            </div>
            {error && (
              <div className="error-banner">
                ⚠️ {error}
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
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>{stats.lowStockItems || 0}</h3>
                <p>Low Stock Items</p>
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

          {/* Render Graphs below stats cards */}
          <Graphs stats={stats} />

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
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Min Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div className="item-info">
                        <strong>{item.name}</strong>
                        {item.description && (
                          <small>{item.description.substring(0, 50)}...</small>
                        )}
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <span className={item.quantity <= item.minStockLevel ? 'low-stock' : ''}>
                        {item.quantity}
                      </span>
                    </td>
                    <td>{item.minStockLevel}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.supplier?.name || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="action-btn edit-btn"
                          title="Edit Item"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt('Enter quantity to add:');
                            if (quantity && !isNaN(quantity)) {
                              handleUpdateStock(item._id, parseInt(quantity), 'restock');
                            }
                          }}
                          className="action-btn restock-btn"
                          title="Restock"
                        >
                          📦
                        </button>
                        <button
                          onClick={() => {
                            const quantity = prompt('Enter quantity used:');
                            if (quantity && !isNaN(quantity)) {
                              handleUpdateStock(item._id, parseInt(quantity), 'usage');
                            }
                          }}
                          className="action-btn usage-btn"
                          title="Record Usage"
                        >
                          📉
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="action-btn delete-btn"
                          title="Delete Item"
                        >
                          🗑️
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
                loadStats();
                setShowAddModal(false);
                setShowEditModal(false);
                setSelectedItem(null);
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default SurgicalItemsManagement;
