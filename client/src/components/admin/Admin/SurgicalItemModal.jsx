import React, { useState, useEffect } from 'react';
import '../Admin/styles/SurgicalItemModal.css';

// ✅ FINAL: CompanyNameDropdown perfectly matched to your API response
const CompanyNameDropdown = ({ 
  selectedCompany, 
  onCompanyChange, 
  className = '',
  placeholder = "Select Company Name",
  required = false 
}) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:7000/api/suppliers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Suppliers API Response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'API returned success: false');
      }
      
      // ✅ Process your exact API response structure
      const activeCompanies = data.suppliers
        .filter(supplier => supplier.status === 'active')
        .map(supplier => ({
          id: supplier._id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          category: supplier.category,
          address: supplier.address
        }));
      
      console.log('✅ Active companies processed:', activeCompanies);
      setCompanies(activeCompanies);
      setError('');
      
    } catch (fetchError) {
      console.error('❌ Error fetching companies:', fetchError);
      setError(fetchError.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="company-dropdown-loading">
        <select disabled className={className} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}>
          <option>🔄 Loading companies...</option>
        </select>
        <small style={{ color: '#007bff', fontSize: '12px', display: 'block', marginTop: '4px' }}>
          Fetching suppliers from API...
        </small>
      </div>
    );
  }

  // Error state
  if (error || companies.length === 0) {
    return (
      <div className="company-dropdown-error">
        <select disabled className={className} style={{ width: '100%', padding: '10px 12px', border: '2px solid #dc3545', borderRadius: '4px' }}>
          <option>❌ {error || 'No companies available'}</option>
        </select>
        <div style={{ 
          color: '#721c24', 
          fontSize: '12px', 
          marginTop: '8px', 
          padding: '12px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px'
        }}>
          <strong>⚠️ Company Loading Failed</strong><br/>
          Error: {error}<br/>
          API: http://localhost:7000/api/suppliers<br/>
          <br/>
          <button 
            onClick={fetchCompanies}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state - Your 3 companies will show here!
  return (
    <div className="company-dropdown-container">
      <select
        value={selectedCompany}
        onChange={(e) => {
          const companyId = e.target.value;
          const companyData = companies.find(c => c.id === companyId);
          console.log('Company selected:', companyId, companyData);
          onCompanyChange(companyId, companyData);
        }}
        className={className}
        required={required}
        style={{ 
          width: '100%', 
          padding: '10px 12px', 
          border: '1px solid #ced4da', 
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        <option value="">{placeholder}</option>
        {companies.map(company => (
          <option key={company.id} value={company.id}>
            {company.name} ({company.category.replace('_', ' ')})
          </option>
        ))}
      </select>
      
      <small style={{ 
        color: '#28a745', 
        fontSize: '12px', 
        marginTop: '6px', 
        display: 'block',
        fontWeight: '600'
      }}>
        ✅ {companies.length} companies loaded successfully!
      </small>
      
      {/* Display your companies */}
      <div style={{ 
        marginTop: '10px',
        padding: '12px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#155724'
      }}>
        <strong>🏢 Available Companies:</strong><br/>
        {companies.map((company, index) => (
          <div key={company.id} style={{ marginTop: index > 0 ? '8px' : '4px' }}>
            <strong>{index + 1}. {company.name}</strong><br/>
            <span style={{ fontSize: '11px', color: '#0c5b31' }}>
              📧 {company.email} | 📞 {company.phone}<br/>
              🏷️ {company.category.replace('_', ' ')} | 📍 {company.address.city}, {company.address.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ COMPLETE: Full SurgicalItemModal with working company dropdown
const SurgicalItemModal = ({ isOpen, onClose, item, categories, onSuccess, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 0,
    price: 0,
    autoRestock: {
      minStockLevel: 10,
      maxStockLevel: 50,
      reorderQuantity: 25,
      isEnabled: true
    },
    companyId: '',
    supplier: {
      name: '',
      contact: '',
      email: ''
    },
    location: {
      room: '',
      shelf: '',
      bin: ''
    },
    expiryDate: '',
    batchNumber: '',
    serialNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle company selection from dropdown
  const handleCompanyChange = (companyId, companyData) => {
    console.log('🏢 Company selected:', companyData);
    
    setFormData(prev => ({
      ...prev,
      companyId: companyId,
      supplier: {
        name: companyData ? companyData.name : '',
        contact: companyData ? companyData.phone : '',
        email: companyData ? companyData.email : ''
      }
    }));
    
    // Clear company error
    if (errors.companyId) {
      setErrors(prev => ({ ...prev, companyId: '' }));
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.companyId && !formData.supplier.name.trim()) {
      newErrors.companyId = 'Please select a company or enter supplier name';
    }
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
// ✅ FIXED: Enhanced form submission with onSuccess safety check
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  
  try {
    // ✅ CORRECT: Using the right API endpoint for surgical items
    const url = item 
      ? `http://localhost:7000/api/inventory/surgical-items/${item._id}` 
      : `http://localhost:7000/api/inventory/surgical-items`;
    const method = item ? 'PUT' : 'POST';

    console.log('🚀 Submitting to CORRECT endpoint:', url);
    console.log('📋 Form data:', formData);

    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData),
    });

    console.log('📡 Response status:', response.status);
    
    // ✅ ENHANCED: Better response handling
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log('📋 Response data:', data);
      } catch (jsonError) {
        console.error('❌ JSON parsing error:', jsonError);
        throw new Error('Server returned invalid JSON response');
      }
    } else {
      // If not JSON, get text content for debugging
      const textResponse = await response.text();
      console.log('📄 Non-JSON response:', textResponse);
      
      if (response.ok) {
        // Sometimes servers return success with empty body or plain text
        alert(`✅ Item ${item ? 'updated' : 'created'} successfully!`);
        
        // ✅ FIXED: Safe onSuccess call with fallback
        if (typeof onSuccess === 'function') {
          onSuccess();
        } else {
          console.warn('⚠️ onSuccess prop is not a function, skipping callback');
          // Optionally refresh the page or perform other actions
          window.location.reload();
        }
        onClose();
        return;
      } else {
        throw new Error(`Server error: ${response.status} - ${textResponse || 'No response body'}`);
      }
    }

    // Handle JSON response
    if (response.ok || (data && (data.success || data.message?.includes('success')))) {
      alert(`✅ Item ${item ? 'updated' : 'created'} successfully!`);
      
      // ✅ FIXED: Safe onSuccess call with fallback
      if (typeof onSuccess === 'function') {
        onSuccess();
        console.log('✅ onSuccess callback executed');
      } else {
        console.warn('⚠️ onSuccess prop is not a function or not provided');
        console.log('Available props:', { onSuccess, onClose, item, categories, apiBaseUrl });
        // Fallback: refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      onClose();
    } else {
      throw new Error(data?.message || `Server error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error saving item:', error);
    
    // ✅ BETTER: More specific error messages
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Check if backend is running on port 7000.';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Server returned invalid response. Check server logs for errors.';
    } else if (error.message.includes('Route') && error.message.includes('not found')) {
      errorMessage = 'API endpoint not found. Using: http://localhost:7000/api/inventory/surgical-items';
    } else if (error.message.includes('onSuccess is not a function')) {
      errorMessage = 'Item created successfully, but callback function is missing. Page will refresh automatically.';
      // Auto-refresh after showing message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
    alert(`❌ Failed to ${item ? 'update' : 'create'} item: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

  // Initialize form data
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        autoRestock: {
          minStockLevel: item.autoRestock?.minStockLevel || 10,
          maxStockLevel: item.autoRestock?.maxStockLevel || 50,
          reorderQuantity: item.autoRestock?.reorderQuantity || 25,
          isEnabled: item.autoRestock?.isEnabled !== undefined ? item.autoRestock.isEnabled : true
        },
        companyId: item.companyId || '',
        supplier: {
          name: item.supplier?.name || '',
          contact: item.supplier?.contact || '',
          email: item.supplier?.email || ''
        },
        location: {
          room: item.location?.room || '',
          shelf: item.location?.shelf || '',
          bin: item.location?.bin || ''
        },
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
        batchNumber: item.batchNumber || '',
        serialNumber: item.serialNumber || ''
      });
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        quantity: 0,
        price: 0,
        autoRestock: {
          minStockLevel: 10,
          maxStockLevel: 50,
          reorderQuantity: 25,
          isEnabled: true
        },
        companyId: '',
        supplier: {
          name: '',
          contact: '',
          email: ''
        },
        location: {
          room: '',
          shelf: '',
          bin: ''
        },
        expiryDate: '',
        batchNumber: '',
        serialNumber: ''
      });
    }
    setErrors({});
  }, [item, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? '✏️ Edit Surgical Item' : '➕ Add New Surgical Item'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            padding: '12px',
            margin: '16px 0',
            color: '#721c24'
          }}>
            <strong>⚠️ Please fix the following errors:</strong>
            <ul style={{ margin: '8px 0 0 20px', paddingLeft: '0' }}>
              {Object.entries(errors).map(([field, error], index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-grid">
            
            {/* Basic Information */}
            <div className="form-section">
              <h3>📋 Basic Information</h3>
              
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter item name"
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
                {errors.name && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={errors.category ? 'error' : ''}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                >
                  <option value="">Select category</option>
                  {categories && categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter item description"
                  rows="3"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Inventory Information */}
            <div className="form-section">
              <h3>📦 Inventory Information</h3>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    className={errors.quantity ? 'error' : ''}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.quantity && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errors.quantity}</span>}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price per Unit ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className={errors.price ? 'error' : ''}
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.price && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errors.price}</span>}
                </div>
              </div>
            </div>

            {/* Auto-Restock Configuration */}
            <div className="form-section" style={{ 
              border: '2px solid #007bff', 
              borderRadius: '8px', 
              padding: '20px', 
              background: '#f8f9ff',
              margin: '20px 0'
            }}>
              <h3 style={{ color: '#007bff' }}>🔄 Auto-Restock Configuration</h3>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.autoRestock.minStockLevel}
                    onChange={(e) => handleInputChange('autoRestock.minStockLevel', parseInt(e.target.value) || 0)}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Max Stock Level</label>
                  <input
                    type="number"
                    value={formData.autoRestock.maxStockLevel}
                    onChange={(e) => handleInputChange('autoRestock.maxStockLevel', parseInt(e.target.value) || 0)}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Reorder Quantity</label>
                  <input
                    type="number"
                    value={formData.autoRestock.reorderQuantity}
                    onChange={(e) => handleInputChange('autoRestock.reorderQuantity', parseInt(e.target.value) || 0)}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Auto-Restock Enabled</label>
                <select
                  value={formData.autoRestock.isEnabled}
                  onChange={(e) => handleInputChange('autoRestock.isEnabled', e.target.value === 'true')}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                >
                  <option value={true}>✅ Yes - Enable Auto-Restock</option>
                  <option value={false}>❌ No - Manual Restock Only</option>
                </select>
              </div>
            </div>

            {/* 🏢 Company Information Section */}
            <div className="form-section">
              <h3>🏢 Company Information</h3>
              
              <div className="form-group">
                <label>Company Name *</label>
                <CompanyNameDropdown
                  selectedCompany={formData.companyId}
                  onCompanyChange={handleCompanyChange}
                  className={errors.companyId ? 'error' : ''}
                  placeholder="Select company name"
                  required={true}
                />
                {errors.companyId && <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>{errors.companyId}</span>}
              </div>

              {/* Auto-filled supplier details */}
              {(formData.companyId || formData.supplier.name) && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '16px', 
                  backgroundColor: formData.companyId ? '#d4edda' : '#f8f9fa', 
                  borderRadius: '8px',
                  border: `2px solid ${formData.companyId ? '#28a745' : '#e9ecef'}`
                }}>
                  <h4 style={{ 
                    marginBottom: '16px', 
                    fontSize: '14px', 
                    color: formData.companyId ? '#155724' : '#495057'
                  }}>
                    📋 Supplier Details {formData.companyId ? '(Auto-filled from company)' : '(Manual entry)'}
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Supplier Name</label>
                      <input
                        type="text"
                        value={formData.supplier.name}
                        onChange={(e) => handleInputChange('supplier.name', e.target.value)}
                        readOnly={!!formData.companyId}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          backgroundColor: formData.companyId ? '#e9ecef' : 'white',
                          cursor: formData.companyId ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Contact</label>
                      <input
                        type="text"
                        value={formData.supplier.contact}
                        onChange={(e) => handleInputChange('supplier.contact', e.target.value)}
                        readOnly={!!formData.companyId}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          backgroundColor: formData.companyId ? '#e9ecef' : 'white',
                          cursor: formData.companyId ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={formData.supplier.email}
                        onChange={(e) => handleInputChange('supplier.email', e.target.value)}
                        readOnly={!!formData.companyId}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          backgroundColor: formData.companyId ? '#e9ecef' : 'white',
                          cursor: formData.companyId ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location & Additional Info */}
            <div className="form-section">
              <h3>📍 Location & Additional Info</h3>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Room</label>
                  <input
                    type="text"
                    value={formData.location.room}
                    onChange={(e) => handleInputChange('location.room', e.target.value)}
                    placeholder="Room-101"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Shelf</label>
                  <input
                    type="text"
                    value={formData.location.shelf}
                    onChange={(e) => handleInputChange('location.shelf', e.target.value)}
                    placeholder="Shelf-A1"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Bin</label>
                  <input
                    type="text"
                    value={formData.location.bin}
                    onChange={(e) => handleInputChange('location.bin', e.target.value)}
                    placeholder="Bin-B12"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    placeholder="BATCH-2025-001"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="SN-123456789"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '30px', 
            padding: '20px 0',
            borderTop: '2px solid #e9ecef'
          }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ❌ Cancel
            </button>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '12px 32px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Saving...' : item ? '✅ Update Item' : '✅ Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurgicalItemModal;