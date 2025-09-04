// components/admin/Admin/SupplierManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Admin/styles/SupplierManagement.css';

const SupplierManagement = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('supplier');
  const [editingItem, setEditingItem] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set axios base URL for port 7000
  axios.defaults.baseURL = 'http://localhost:7000';

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    status: 'active'
  });

  const [orderForm, setOrderForm] = useState({
    supplier: '',
    items: [{ product: '', quantity: 1, unitPrice: 0 }],
    expectedDelivery: '',
    notes: '',
    status: 'pending',  // ✅ NEW: Order status
    rating: 3           // ✅ NEW: Supplier rating
  });

  // Validation helper functions
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const isValidPhone = (phone) => {
    const re = /^[\+]?[0-9]{7,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const isPositiveNumber = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  };

  const isValidDate = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date instanceof Date && !isNaN(date) && date >= today;
  };

  const isValidText = (text, minLength = 1, maxLength = 100) => {
    return text.trim().length >= minLength && text.trim().length <= maxLength;
  };

  const isValidZipCode = (zip) => {
    if (!zip) return true;
    const re = /^[0-9A-Za-z\s\-]{3,10}$/;
    return re.test(zip);
  };

  // Real-time input validation functions
  const handleNameInput = (value, field) => {
    const sanitized = value.replace(/[^a-zA-Z\s\.\-]/g, '').slice(0, 100);
    
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setSupplierForm(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: sanitized
        }
      }));
    } else {
      setSupplierForm(prev => ({
        ...prev,
        [field]: sanitized
      }));
    }
    
    if (sanitized.trim().length >= 2) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmailInput = (value) => {
    const sanitized = value.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 100);
    setSupplierForm(prev => ({ ...prev, email: sanitized }));
    
    if (sanitized && isValidEmail(sanitized)) {
      setErrors(prev => ({ ...prev, email: '' }));
    } else if (sanitized.length > 0) {
      setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
    }
  };

  const handlePhoneInput = (value) => {
    const sanitized = value.replace(/[^0-9\+\s\-\(\)]/g, '').slice(0, 20);
    setSupplierForm(prev => ({ ...prev, phone: sanitized }));
    
    if (sanitized && isValidPhone(sanitized)) {
      setErrors(prev => ({ ...prev, phone: '' }));
    } else if (sanitized.length > 0) {
      setErrors(prev => ({ ...prev, phone: 'Invalid phone format' }));
    }
  };

  const handleNumberInput = (value, index, field) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    let cleanValue = parts[0];
    if (parts.length > 1) {
      cleanValue += '.' + parts[1].slice(0, 2);
    }
    
    const numValue = parseFloat(cleanValue) || 0;
    updateOrderItem(index, field, Math.max(0, numValue));
  };

  const handleZipCodeInput = (value) => {
    const sanitized = value.replace(/[^0-9A-Za-z\s\-]/g, '').slice(0, 10);
    setSupplierForm(prev => ({
      ...prev,
      address: { ...prev.address, zipCode: sanitized }
    }));
  };

  // ✅ NEW: Handle status input with validation
  const handleStatusInput = (value) => {
    const validStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (validStatuses.includes(value)) {
      setOrderForm(prev => ({ ...prev, status: value }));
      setErrors(prev => ({ ...prev, status: '' }));
    }
  };

  // ✅ NEW: Handle rating input with validation
  const handleRatingInput = (value) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) numValue = 1;
    if (numValue > 5) numValue = 5;
    
    setOrderForm(prev => ({ ...prev, rating: numValue }));
    setErrors(prev => ({ ...prev, rating: '' }));
  };

  // Form validation
  const validateSupplierForm = () => {
    const newErrors = {};

    if (!supplierForm.name.trim()) {
      newErrors.name = 'Supplier name is required';
    } else if (!isValidText(supplierForm.name, 2, 100)) {
      newErrors.name = 'Name must be 2-100 characters';
    }

    if (!supplierForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(supplierForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!supplierForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(supplierForm.phone)) {
      newErrors.phone = 'Please enter a valid phone number (7-15 digits)';
    }

    if (!supplierForm.category) {
      newErrors.category = 'Please select a category';
    }

    if (supplierForm.address.city && !isValidText(supplierForm.address.city, 2, 50)) {
      newErrors['address.city'] = 'City must be 2-50 characters';
    }

    if (supplierForm.address.state && !isValidText(supplierForm.address.state, 2, 50)) {
      newErrors['address.state'] = 'State must be 2-50 characters';
    }

    if (supplierForm.address.zipCode && !isValidZipCode(supplierForm.address.zipCode)) {
      newErrors['address.zipCode'] = 'Invalid zip code format';
    }

    if (supplierForm.address.country && !isValidText(supplierForm.address.country, 2, 50)) {
      newErrors['address.country'] = 'Country must be 2-50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOrderForm = () => {
    const newErrors = {};

    if (!orderForm.supplier) {
      newErrors.supplier = 'Please select a supplier';
    }

    // ✅ NEW: Validate order status
    const validStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (!validStatuses.includes(orderForm.status)) {
      newErrors.status = 'Please select a valid order status';
    }

    // ✅ NEW: Validate rating
    if (!orderForm.rating || orderForm.rating < 1 || orderForm.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }

    if (!orderForm.items.length) {
      newErrors.items = 'At least one item is required';
    } else {
      orderForm.items.forEach((item, index) => {
        if (!item.product.trim()) {
          newErrors[`item_${index}_product`] = 'Product name is required';
        } else if (!isValidText(item.product, 1, 100)) {
          newErrors[`item_${index}_product`] = 'Product name must be 1-100 characters';
        }

        if (!isPositiveNumber(item.quantity) || item.quantity < 1) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be at least 1';
        }

        if (!isPositiveNumber(item.unitPrice)) {
          newErrors[`item_${index}_unitPrice`] = 'Unit price must be greater than 0';
        }
      });
    }

    if (orderForm.expectedDelivery && !isValidDate(orderForm.expectedDelivery)) {
      newErrors.expectedDelivery = 'Expected delivery date cannot be in the past';
    }

    if (orderForm.notes && orderForm.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching data from http://localhost:7000...');
      const [suppliersRes, ordersRes] = await Promise.all([
        axios.get('/api/suppliers'),
        axios.get('/api/purchase-orders')
      ]);
      
      console.log('✅ Data fetched successfully');
      setSuppliers(suppliersRes.data.suppliers || []);
      setPurchaseOrders(ordersRes.data.orders || []);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('❌ Error response:', error.response?.data);
      setLoading(false);
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSupplierForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📤 Sending supplier data:', supplierForm);
      
      let response;
      if (editingItem) {
        response = await axios.put(`/api/suppliers/${editingItem._id}`, supplierForm);
      } else {
        response = await axios.post('/api/suppliers', supplierForm);
      }
      
      console.log('✅ Success response:', response.data);
      alert(response.data.message || 'Supplier saved successfully!');
      
      resetForms();
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('❌ Full error object:', error);
      
      let errorMessage = 'Failed to save supplier. Please try again.';
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.data?.errors) {
          const validationErrors = error.response.data.errors
            .map(err => `${err.field}: ${err.message}`)
            .join('\n');
          errorMessage = `Validation errors:\n${validationErrors}`;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check if the backend is running on port 7000.';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      setErrors({ submit: errorMessage });
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateOrderForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const totalAmount = orderForm.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );

      const orderData = {
        ...orderForm,
        totalAmount,
        items: orderForm.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice
        }))
      };

      console.log('📤 Creating purchase order:', orderData);
      await axios.post('/api/purchase-orders', orderData);
      resetForms();
      setShowModal(false);
      fetchData();
      alert('Purchase order created successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create order. Please try again.';
      setErrors({ submit: errorMessage });
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    setSupplierForm({
      name: '',
      email: '',
      phone: '',
      category: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      status: 'active'
    });

    setOrderForm({
      supplier: '',
      items: [{ product: '', quantity: 1, unitPrice: 0 }],
      expectedDelivery: '',
      notes: '',
      status: 'pending',  // ✅ NEW: Reset to default
      rating: 3           // ✅ NEW: Reset to default
    });

    setEditingItem(null);
    setErrors({});
  };

  const handleDelete = async (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const endpoint = type === 'supplier' ? '/api/suppliers' : '/api/purchase-orders';
        await axios.delete(`${endpoint}/${id}`);
        fetchData();
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`Failed to delete ${type}. Please try again.`);
      }
    }
  };

  const addOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { product: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    setOrderForm({ ...orderForm, items: newItems });

    if (field === 'product' && value.trim()) {
      setErrors(prev => ({ ...prev, [`item_${index}_product`]: '' }));
    } else if (field === 'quantity' && isPositiveNumber(value) && value >= 1) {
      setErrors(prev => ({ ...prev, [`item_${index}_quantity`]: '' }));
    } else if (field === 'unitPrice' && isPositiveNumber(value)) {
      setErrors(prev => ({ ...prev, [`item_${index}_unitPrice`]: '' }));
    }
  };

  const removeOrderItem = (index) => {
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: newItems });
    
    const newErrors = { ...errors };
    delete newErrors[`item_${index}_product`];
    delete newErrors[`item_${index}_quantity`];
    delete newErrors[`item_${index}_unitPrice`];
    setErrors(newErrors);
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <span className="error-message">{error}</span>;
  };

  return (
    <div className="procurement-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="page-icon">📦</div>
          <div>
            <h1>Procurement & Suppliers</h1>
            <p>Manage purchase orders, supplier relationships & automated restocking</p>
            <small>Order tracking, supplier ratings, contract management & cost optimization</small>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={() => {
              setModalType('supplier');
              setShowModal(true);
              resetForms();
            }}
          >
            + Add Supplier
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => {
              setModalType('order');
              setShowModal(true);
              resetForms();
            }}
          >
            + New Order
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers ({suppliers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading procurement data from port 7000...</p>
          </div>
        ) : (
          <>
            {activeTab === 'suppliers' && (
              <div className="suppliers-section">
                <div className="section-stats">
                  <div className="stat-card">
                    <h3>{suppliers.filter(s => s.status === 'active').length}</h3>
                    <p>Active Suppliers</p>
                  </div>
                  <div className="stat-card">
                    <h3>{suppliers.filter(s => s.rating >= 4).length}</h3>
                    <p>High Rated (4+ ⭐)</p>
                  </div>
                  <div className="stat-card">
                    <h3>{suppliers.filter(s => s.category === 'medical_equipment').length}</h3>
                    <p>Equipment Suppliers</p>
                  </div>
                </div>

                <div className="suppliers-grid">
                  {suppliers.length === 0 ? (
                    <div className="empty-state">
                      <p>No suppliers found. Add your first supplier to get started!</p>
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <div key={supplier._id} className="supplier-card">
                        <div className="card-header">
                          <h3>{supplier.name}</h3>
                          <span className={`status-badge ${supplier.status}`}>
                            {supplier.status}
                          </span>
                        </div>
                        
                        <div className="card-content">
                          <p><strong>Email:</strong> {supplier.email}</p>
                          <p><strong>Phone:</strong> {supplier.phone}</p>
                          <p><strong>Category:</strong> 
                            <span className="category-tag">{supplier.category?.replace('_', ' ')}</span>
                          </p>
                          <p><strong>Rating:</strong>
                            <span className="rating-stars">
                              {'⭐'.repeat(supplier.rating || 3)}
                              <span className="rating-text">({supplier.rating || 3}/5)</span>
                            </span>
                          </p>
                          {supplier.address?.city && (
                            <p><strong>Location:</strong> {supplier.address.city}, {supplier.address.state}</p>
                          )}
                        </div>
                        
                        <div className="card-actions">
                          <button 
                            className="btn-edit"
                            onClick={() => {
                              setEditingItem(supplier);
                              setSupplierForm(supplier);
                              setModalType('supplier');
                              setShowModal(true);
                              setErrors({});
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDelete('supplier', supplier._id)}
                          >
                            Delete
                          </button>
                          <button 
                            className="btn-order"
                            onClick={() => {
                              setOrderForm({ ...orderForm, supplier: supplier._id });
                              setModalType('order');
                              setShowModal(true);
                              setErrors({});
                            }}
                          >
                            Create Order
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="orders-section">
                <div className="section-stats">
                  <div className="stat-card">
                    <h3>{purchaseOrders.filter(o => o.status === 'pending').length}</h3>
                    <p>Pending Orders</p>
                  </div>
                  <div className="stat-card">
                    <h3>{purchaseOrders.filter(o => o.status === 'received').length}</h3>
                    <p>Completed Orders</p>
                  </div>
                  <div className="stat-card">
                    <h3>${purchaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}</h3>
                    <p>Total Value</p>
                  </div>
                </div>

                <div className="orders-table">
                  {purchaseOrders.length === 0 ? (
                    <div className="empty-state">
                      <p>No purchase orders found. Create your first order!</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Order Number</th>
                          <th>Supplier</th>
                          <th>Items</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th>Rating</th>
                          <th>Order Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.map((order) => (
                          <tr key={order._id}>
                            <td>
                              <strong>{order.orderNumber}</strong>
                            </td>
                            <td>
                              {order.supplier?.name || 'Unknown Supplier'}
                            </td>
                            <td>
                              <span className="items-count">
                                {order.items?.length || 0} items
                              </span>
                            </td>
                            <td>
                              <strong>${(order.totalAmount || 0).toLocaleString()}</strong>
                            </td>
                            <td>
                              <span className={`status-badge ${order.status}`}>
                                {order.status}
                              </span>
                            </td>
                            <td>
                              <span className="rating-display">
                                {'⭐'.repeat(order.rating || 3)} ({order.rating || 3}/5)
                              </span>
                            </td>
                            <td>
                              {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="table-actions">
                                <button 
                                  className="btn-view"
                                  onClick={() => {
                                    alert(`Order Details:\n\nOrder: ${order.orderNumber}\nSupplier: ${order.supplier?.name}\nRating: ${order.rating}/5 ⭐\nStatus: ${order.status}\nTotal: $${order.totalAmount}\nItems: ${order.items?.length}`);
                                  }}
                                >
                                  View
                                </button>
                                <button 
                                  className="btn-delete"
                                  onClick={() => handleDelete('purchase-order', order._id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="analytics-section">
                <div className="analytics-cards">
                  <div className="analytics-card">
                    <h3>Top Suppliers</h3>
                    <div className="supplier-ranking">
                      {suppliers
                        .filter(s => s.rating >= 4)
                        .slice(0, 5)
                        .map((supplier, index) => (
                          <div key={supplier._id} className="rank-item">
                            <span className="rank">#{index + 1}</span>
                            <span className="name">{supplier.name}</span>
                            <span className="rating">{'⭐'.repeat(supplier.rating || 3)}</span>
                          </div>
                        ))
                      }
                      {suppliers.filter(s => s.rating >= 4).length === 0 && (
                        <p>No high-rated suppliers yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3>Category Distribution</h3>
                    <div className="category-stats">
                      {['medical_equipment', 'pharmaceuticals', 'consumables', 'services'].map(category => {
                        const count = suppliers.filter(s => s.category === category).length;
                        const percentage = suppliers.length > 0 ? ((count / suppliers.length) * 100).toFixed(1) : 0;
                        return (
                          <div key={category} className="category-stat">
                            <span className="category-name">{category.replace('_', ' ')}</span>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="percentage">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3>Order Status Overview</h3>
                    <div className="status-overview">
                      {['pending', 'approved', 'ordered', 'received', 'cancelled'].map(status => {
                        const count = purchaseOrders.filter(o => o.status === status).length;
                        return (
                          <div key={status} className="status-item">
                            <span className={`status-indicator ${status}`}></span>
                            <span className="status-name">{status}</span>
                            <span className="status-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {modalType === 'supplier' 
                  ? (editingItem ? 'Edit Supplier' : 'Add New Supplier')
                  : 'Create Purchase Order'
                }
              </h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForms();
                }}
              >
                ×
              </button>
            </div>
            
            {errors.submit && (
              <div className="alert alert-error">
                {errors.submit}
              </div>
            )}
            
            {modalType === 'supplier' ? (
              <form onSubmit={handleSupplierSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Supplier Name *</label>
                    <input
                      type="text"
                      value={supplierForm.name}
                      onChange={(e) => handleNameInput(e.target.value, 'name')}
                      className={errors.name ? 'error' : ''}
                      maxLength="100"
                      required
                    />
                    <ErrorMessage error={errors.name} />
                  </div>
                  
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => handleEmailInput(e.target.value)}
                      className={errors.email ? 'error' : ''}
                      maxLength="100"
                      required
                    />
                    <ErrorMessage error={errors.email} />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={supplierForm.phone}
                      onChange={(e) => handlePhoneInput(e.target.value)}
                      className={errors.phone ? 'error' : ''}
                      placeholder="+1234567890"
                      maxLength="20"
                      required
                    />
                    <ErrorMessage error={errors.phone} />
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={supplierForm.category}
                      onChange={(e) => {
                        setSupplierForm({...supplierForm, category: e.target.value});
                        if (e.target.value) {
                          setErrors(prev => ({ ...prev, category: '' }));
                        }
                      }}
                      className={errors.category ? 'error' : ''}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="medical_equipment">Medical Equipment</option>
                      <option value="pharmaceuticals">Pharmaceuticals</option>
                      <option value="consumables">Consumables</option>
                      <option value="services">Services</option>
                    </select>
                    <ErrorMessage error={errors.category} />
                  </div>
                  
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={supplierForm.status}
                      onChange={(e) => setSupplierForm({...supplierForm, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blacklisted">Blacklisted</option>
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={supplierForm.address.street}
                      onChange={(e) => setSupplierForm({
                        ...supplierForm, 
                        address: {...supplierForm.address, street: e.target.value.slice(0, 200)}
                      })}
                      maxLength="200"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={supplierForm.address.city}
                      onChange={(e) => handleNameInput(e.target.value, 'address.city')}
                      className={errors['address.city'] ? 'error' : ''}
                      maxLength="50"
                    />
                    <ErrorMessage error={errors['address.city']} />
                  </div>
                  
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={supplierForm.address.state}
                      onChange={(e) => handleNameInput(e.target.value, 'address.state')}
                      className={errors['address.state'] ? 'error' : ''}
                      maxLength="50"
                    />
                    <ErrorMessage error={errors['address.state']} />
                  </div>
                  
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={supplierForm.address.zipCode}
                      onChange={(e) => handleZipCodeInput(e.target.value)}
                      className={errors['address.zipCode'] ? 'error' : ''}
                      placeholder="12345"
                      maxLength="10"
                    />
                    <ErrorMessage error={errors['address.zipCode']} />
                  </div>
                  
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={supplierForm.address.country}
                      onChange={(e) => handleNameInput(e.target.value, 'address.country')}
                      className={errors['address.country'] ? 'error' : ''}
                      maxLength="50"
                    />
                    <ErrorMessage error={errors['address.country']} />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingItem ? 'Update Supplier' : 'Add Supplier')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOrderSubmit} className="modal-form">
                <div className="form-grid-order">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      value={orderForm.supplier}
                      onChange={(e) => {
                        setOrderForm({...orderForm, supplier: e.target.value});
                        if (e.target.value) {
                          setErrors(prev => ({ ...prev, supplier: '' }));
                        }
                      }}
                      className={errors.supplier ? 'error' : ''}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers
                        .filter(s => s.status === 'active')
                        .map(supplier => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </option>
                        ))
                      }
                    </select>
                    <ErrorMessage error={errors.supplier} />
                  </div>

                  {/* ✅ NEW: Order Status Field */}
                  <div className="form-group">
                    <label>Order Status *</label>
                    <select
                      value={orderForm.status}
                      onChange={(e) => handleStatusInput(e.target.value)}
                      className={errors.status ? 'error' : ''}
                      required
                    >
                      <option value="pending">📋 Pending</option>
                      <option value="approved">✅ Approved</option>
                      <option value="ordered">🛒 Ordered</option>
                      <option value="received">📦 Received</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                    <ErrorMessage error={errors.status} />
                    <small className="field-help">Select the current status of this order</small>
                  </div>

                  {/* ✅ NEW: Rating Field */}
                  <div className="form-group">
                    <label>Supplier Rating *</label>
                    <div className="rating-input-container">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={orderForm.rating}
                        onChange={(e) => handleRatingInput(e.target.value)}
                        className={errors.rating ? 'error' : ''}
                        required
                      />
                      <div className="rating-stars-preview">
                        {'⭐'.repeat(orderForm.rating)} ({orderForm.rating}/5)
                      </div>
                    </div>
                    <ErrorMessage error={errors.rating} />
                    <small className="field-help">Rate this supplier from 1 to 5 stars</small>
                  </div>

                  <div className="form-group">
                    <label>Expected Delivery Date</label>
                    <input
                      type="date"
                      value={orderForm.expectedDelivery}
                      onChange={(e) => {
                        setOrderForm({...orderForm, expectedDelivery: e.target.value});
                        if (isValidDate(e.target.value)) {
                          setErrors(prev => ({ ...prev, expectedDelivery: '' }));
                        }
                      }}
                      className={errors.expectedDelivery ? 'error' : ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <ErrorMessage error={errors.expectedDelivery} />
                  </div>
                </div>
                
                <div className="form-section">
                  <div className="section-header">
                    <h3>Order Items *</h3>
                    <button type="button" onClick={addOrderItem} className="add-item-btn">
                      + Add Item
                    </button>
                  </div>
                  
                  <ErrorMessage error={errors.items} />
                  
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-fields">
                        <div className="field-container">
                          <input
                            type="text"
                            placeholder="Product name *"
                            value={item.product}
                            onChange={(e) => {
                              const value = e.target.value.slice(0, 100);
                              updateOrderItem(index, 'product', value);
                            }}
                            className={errors[`item_${index}_product`] ? 'error' : ''}
                            maxLength="100"
                            required
                          />
                          <ErrorMessage error={errors[`item_${index}_product`]} />
                        </div>
                        
                        <div className="field-container">
                          <input
                            type="number"
                            placeholder="Quantity *"
                            value={item.quantity}
                            onChange={(e) => handleNumberInput(e.target.value, index, 'quantity')}
                            className={errors[`item_${index}_quantity`] ? 'error' : ''}
                            min="1"
                            max="999999"
                            required
                          />
                          <ErrorMessage error={errors[`item_${index}_quantity`]} />
                        </div>
                        
                        <div className="field-container">
                          <input
                            type="number"
                            placeholder="Unit Price ($) *"
                            value={item.unitPrice}
                            onChange={(e) => handleNumberInput(e.target.value, index, 'unitPrice')}
                            className={errors[`item_${index}_unitPrice`] ? 'error' : ''}
                            min="0.01"
                            max="999999"
                            step="0.01"
                            required
                          />
                          <ErrorMessage error={errors[`item_${index}_unitPrice`]} />
                        </div>
                        
                        <span className="item-total">
                          ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </span>
                        
                        {orderForm.items.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            className="remove-item-btn"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="order-total">
                    <strong>
                      Total: ${orderForm.items.reduce((sum, item) => 
                        sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={orderForm.notes}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 500);
                      setOrderForm({...orderForm, notes: value});
                      if (value.length <= 500) {
                        setErrors(prev => ({ ...prev, notes: '' }));
                      }
                    }}
                    className={errors.notes ? 'error' : ''}
                    placeholder="Additional notes or special instructions"
                    rows="3"
                    maxLength="500"
                  />
                  <ErrorMessage error={errors.notes} />
                  <small className="char-counter">{orderForm.notes.length}/500 characters</small>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
