import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FinancialUtilities.css';

const FinancialUtilities = () => {
  // State management
  const [utilities, setUtilities] = useState([]);
  const [filteredUtilities, setFilteredUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Modal and form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    payment_status: '',
    vendor_name: '',
    start_date: '',
    end_date: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState({
    utilityId: '',
    category: 'Electricity',
    description: '',
    amount: '',
    billing_period_start: '',
    billing_period_end: '',
    payment_status: 'Pending',
    vendor_name: '',
    invoice_number: ''
  });

  const API_BASE = 'http://localhost:7000/api/financial-utilities';

  // Utility categories
  const categories = [
    'Electricity',
    'Water & Sewage',
    'Waste Management',
    'Internet & Communication',
    'Generator Fuel',
    'Other'
  ];

  const paymentStatuses = ['Pending', 'Paid', 'Overdue'];

  // Fetch utilities
  const fetchUtilities = async (page = 1, filterParams = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filterParams
      });

      const response = await axios.get(`${API_BASE}?${params}`);
      
      if (response.data.success) {
        setUtilities(response.data.data.utilities);
        setFilteredUtilities(response.data.data.utilities);
        setCurrentPage(response.data.data.pagination.current_page);
        setTotalPages(response.data.data.pagination.total_pages);
        setTotalRecords(response.data.data.pagination.total_records);
      }
    } catch (err) {
      setError('Failed to fetch utilities');
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // Generate unique ID
  const generateUniqueId = async () => {
    try {
      const response = await axios.get(`${API_BASE}/generate-id`);
      if (response.data.success) {
        setFormData(prev => ({ ...prev, utilityId: response.data.data.id }));
      }
    } catch (err) {
      console.error('ID generation error:', err);
    }
  };

  // Create utility
  const createUtility = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(API_BASE, formData);
      
      if (response.data.success) {
        setShowCreateModal(false);
        resetForm();
        fetchUtilities(currentPage, filters);
        fetchStats();
        alert('Utility record created successfully!');
      }
    } catch (err) {
      alert('Failed to create utility record: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  // Update utility
  const updateUtility = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = { ...formData };
      delete updateData.utilityId; // Remove utilityId from update data
      
      const response = await axios.put(`${API_BASE}/${selectedUtility.utilityId}`, updateData);
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchUtilities(currentPage, filters);
        fetchStats();
        alert('Utility record updated successfully!');
      }
    } catch (err) {
      alert('Failed to update utility record: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  // Delete utility
  const deleteUtility = async (utilityId) => {
    if (!window.confirm('Are you sure you want to delete this utility record?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE}/${utilityId}`);
      
      if (response.data.success) {
        fetchUtilities(currentPage, filters);
        fetchStats();
        alert('Utility record deleted successfully!');
      }
    } catch (err) {
      alert('Failed to delete utility record: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchUtilities(1, newFilters);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      utilityId: '',
      category: 'Electricity',
      description: '',
      amount: '',
      billing_period_start: '',
      billing_period_end: '',
      payment_status: 'Pending',
      vendor_name: '',
      invoice_number: ''
    });
    setSelectedUtility(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    generateUniqueId();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (utility) => {
    setSelectedUtility(utility);
    setFormData({
      utilityId: utility.utilityId,
      category: utility.category,
      description: utility.description,
      amount: utility.amount.toString(),
      billing_period_start: utility.billing_period_start.split('T')[0],
      billing_period_end: utility.billing_period_end.split('T')[0],
      payment_status: utility.payment_status,
      vendor_name: utility.vendor_name,
      invoice_number: utility.invoice_number || ''
    });
    setShowEditModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Get payment status badge class
  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Overdue': return 'badge-danger';
      case 'Pending': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUtilities(page, filters);
  };

  // Clear filters
  const clearFilters = () => {
    const emptyFilters = {
      category: '',
      payment_status: '',
      vendor_name: '',
      start_date: '',
      end_date: ''
    };
    setFilters(emptyFilters);
    setCurrentPage(1);
    fetchUtilities(1, {});
  };

  // Initial data fetch
  useEffect(() => {
    fetchUtilities();
    fetchStats();
  }, []);

  return (
    <div className="financial-utilities-container">
      {/* Header */}
      <div className="utilities-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="fas fa-bolt"></i>
            Financial Utilities Management
          </h1>
          <p className="page-subtitle">
            Manage electricity, water, waste management, and other utility expenses
          </p>
        </div>
        <button 
          className="btn btn-primary create-btn"
          onClick={openCreateModal}
        >
          <i className="fas fa-plus"></i>
          Add New Utility
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card total-expenses">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <h3>Total Expenses</h3>
              <p className="stat-number">{formatCurrency(stats.total_expenses)}</p>
              <small>{stats.total_records} records</small>
            </div>
          </div>

          <div className="stat-card pending-payments">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Pending Payments</h3>
              <p className="stat-number">
                {stats.payment_status_breakdown.find(s => s._id === 'Pending')?.count || 0}
              </p>
              <small>Awaiting payment</small>
            </div>
          </div>

          <div className="stat-card overdue-payments">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>Overdue Payments</h3>
              <p className="stat-number">
                {stats.payment_status_breakdown.find(s => s._id === 'Overdue')?.count || 0}
              </p>
              <small>Requires attention</small>
            </div>
          </div>

          <div className="stat-card paid-utilities">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Paid Utilities</h3>
              <p className="stat-number">
                {stats.payment_status_breakdown.find(s => s._id === 'Paid')?.count || 0}
              </p>
              <small>Completed payments</small>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              name="category" 
              value={filters.category} 
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Status:</label>
            <select 
              name="payment_status" 
              value={filters.payment_status} 
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              {paymentStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Vendor:</label>
            <input 
              type="text" 
              name="vendor_name" 
              value={filters.vendor_name} 
              onChange={handleFilterChange}
              placeholder="Search vendor..."
            />
          </div>

          <div className="filter-group">
            <label>Start Date:</label>
            <input 
              type="date" 
              name="start_date" 
              value={filters.start_date} 
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>End Date:</label>
            <input 
              type="date" 
              name="end_date" 
              value={filters.end_date} 
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <button className="btn btn-secondary" onClick={clearFilters}>
              <i className="fas fa-times"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          Loading...
        </div>
      )}

      {/* Utilities Table */}
      <div className="utilities-table-container">
        <div className="table-header">
          <h3>Utilities Records ({totalRecords})</h3>
        </div>
        
        <div className="table-responsive">
          <table className="utilities-table">
            <thead>
              <tr>
                <th>Utility ID</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Billing Period</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Invoice</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUtilities.length > 0 ? (
                filteredUtilities.map(utility => (
                  <tr key={utility.utilityId}>
                    <td className="utility-id">{utility.utilityId}</td>
                    <td>
                      <span className={`category-badge ${utility.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        {utility.category}
                      </span>
                    </td>
                    <td className="description">{utility.description}</td>
                    <td className="amount">{formatCurrency(utility.amount)}</td>
                    <td className="billing-period">
                      {formatDate(utility.billing_period_start)} - {formatDate(utility.billing_period_end)}
                    </td>
                    <td className="vendor">{utility.vendor_name}</td>
                    <td>
                      <span className={`badge ${getPaymentStatusBadge(utility.payment_status)}`}>
                        {utility.payment_status}
                      </span>
                    </td>
                    <td className="invoice">{utility.invoice_number || 'N/A'}</td>
                    <td className="actions">
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => openEditModal(utility)}
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteUtility(utility.utilityId)}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    <i className="fas fa-inbox"></i>
                    <p>No utility records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination">
              <button 
                className="btn btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button 
                    key={page}
                    className={`btn btn-sm ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button 
                className="btn btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <i className="fas fa-plus"></i>
                Add New Utility
              </h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={createUtility}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Utility ID:</label>
                    <input 
                      type="text" 
                      name="utilityId"
                      value={formData.utilityId}
                      onChange={handleFormChange}
                      required
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Category:</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Description:</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      required
                      rows="3"
                      placeholder="Enter utility description..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Amount (LKR):</label>
                    <input 
                      type="number" 
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Billing Period Start:</label>
                    <input 
                      type="date" 
                      name="billing_period_start"
                      value={formData.billing_period_start}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Billing Period End:</label>
                    <input 
                      type="date" 
                      name="billing_period_end"
                      value={formData.billing_period_end}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Status:</label>
                    <select 
                      name="payment_status"
                      value={formData.payment_status}
                      onChange={handleFormChange}
                      required
                    >
                      {paymentStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vendor Name:</label>
                    <input 
                      type="text" 
                      name="vendor_name"
                      value={formData.vendor_name}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter vendor name..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Invoice Number:</label>
                    <input 
                      type="text" 
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleFormChange}
                      placeholder="Enter invoice number (optional)..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Create Utility
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <i className="fas fa-edit"></i>
                Edit Utility - {selectedUtility?.utilityId}
              </h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={updateUtility}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Utility ID:</label>
                    <input 
                      type="text" 
                      value={formData.utilityId}
                      readOnly
                      className="readonly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category:</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Description:</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      required
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Amount (LKR):</label>
                    <input 
                      type="number" 
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Billing Period Start:</label>
                    <input 
                      type="date" 
                      name="billing_period_start"
                      value={formData.billing_period_start}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Billing Period End:</label>
                    <input 
                      type="date" 
                      name="billing_period_end"
                      value={formData.billing_period_end}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Status:</label>
                    <select 
                      name="payment_status"
                      value={formData.payment_status}
                      onChange={handleFormChange}
                      required
                    >
                      {paymentStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Vendor Name:</label>
                    <input 
                      type="text" 
                      name="vendor_name"
                      value={formData.vendor_name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Invoice Number:</label>
                    <input 
                      type="text" 
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleFormChange}
                      placeholder="Enter invoice number (optional)..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Update Utility
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialUtilities;
