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

// ✅ ENHANCED: Full SurgicalItemModal with comprehensive validation and input filtering
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

  // ✅ UPDATED: Validation functions with your specific requirements
  const validators = {
    name: (value) => {
      if (!value || !value.trim()) return 'Item name is required';
      if (value.trim().length < 3) return 'Item name must be at least 3 characters';
      if (value.trim().length > 100) return 'Item name must be less than 100 characters';
      return '';
    },
    category: (value) => {
      if (!value) return 'Category is required';
      return '';
    },
    description: (value) => {
      if (value && value.length > 500) return 'Description must be less than 500 characters';
      return '';
    },
    quantity: (value) => {
      if (value < 0) return 'Quantity cannot be negative';
      if (value > 10000) return 'Quantity seems too high, please verify';
      return '';
    },
    price: (value) => {
      if (value < 0) return 'Price cannot be negative';
      if (value > 10000) return 'Price seems too high, please verify';
      return '';
    },
    'autoRestock.minStockLevel': (value) => {
      if (value < 0) return 'Minimum stock level cannot be negative';
      return '';
    },
    'autoRestock.maxStockLevel': (value, formData) => {
      if (value < 0) return 'Maximum stock level cannot be negative';
      if (value <= formData.autoRestock.minStockLevel) return 'Maximum must be greater than minimum';
      return '';
    },
    'autoRestock.reorderQuantity': (value, formData) => {
      if (value < 0) return 'Reorder quantity cannot be negative';
      if (value > formData.autoRestock.maxStockLevel) return 'Reorder quantity cannot exceed maximum stock level';
      return '';
    },
    companyId: (value, formData) => {
      if (!value && !formData.supplier.name.trim()) {
        return 'Please select a company or enter supplier name';
      }
      return '';
    },
    'supplier.name': (value, formData) => {
      if (!formData.companyId && (!value || !value.trim())) {
        return 'Supplier name is required when no company is selected';
      }
      return '';
    },
    'supplier.email': (value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return '';
    },
    'supplier.contact': (value) => {
      if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
        return 'Contact should contain only numbers, spaces, and + - ( )';
      }
      return '';
    },
    'location.room': (value) => {
      if (value && !/^Room-\d+$/.test(value)) {
        return 'Room must be in format "Room-101" (letters, hyphen, numbers only)';
      }
      return '';
    },
    'location.shelf': (value) => {
      if (value && !/^Shelf-[A-Za-z]\d*$/.test(value)) {
        return 'Shelf must be in format "Shelf-A1" (letters, hyphen, optional numbers)';
      }
      return '';
    },
    'location.bin': (value) => {
      if (value && !/^Bin-[A-Za-z]\d*$/.test(value)) {
        return 'Bin must be in format "Bin-B12" (letters, hyphen, optional numbers)';
      }
      return '';
    },
    expiryDate: (value) => {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          return 'Expiry date cannot be in the past';
        }
      }
      return '';
    },
    batchNumber: (value) => {
      if (value && !/^BATCH-\d{4}-\d{3}$/.test(value)) {
        return 'Batch number must be in format "BATCH-2025-001"';
      }
      return '';
    },
    serialNumber: (value) => {
      if (value && value.length > 10) {
        return 'Serial number must be 10 characters or less';
      }
      if (value && !/^[A-Z0-9\-]+$/i.test(value)) {
        return 'Serial number can only contain letters, numbers, and hyphens';
      }
      return '';
    }
  };

  // ✅ NEW: Input filtering functions to prevent invalid characters
  const inputFilters = {
    name: (value) => {
      // Only allow letters and spaces
      return value.replace(/[^A-Za-z\s]/g, '');
    },
    'location.room': (value) => {
      // Only allow "Room-" followed by digits
      // If user starts typing, we can help by adding "Room-" prefix
      if (!value.startsWith('Room-') && value.length > 0) {
        return 'Room-';
      }
      // After "Room-", only allow digits
      const roomPart = value.substring(5);
      return 'Room-' + roomPart.replace(/[^\d]/g, '');
    },
    'location.shelf': (value) => {
      // Only allow "Shelf-" followed by a letter and optional digits
      if (!value.startsWith('Shelf-') && value.length > 0) {
        return 'Shelf-';
      }
      const shelfPart = value.substring(6);
      if (shelfPart.length === 0) return value;
      // First character after hyphen must be a letter
      const firstChar = shelfPart.charAt(0);
      if (!/^[A-Za-z]$/.test(firstChar)) {
        return 'Shelf-';
      }
      // Remaining characters can be digits
      const remaining = shelfPart.substring(1);
      return 'Shelf-' + firstChar + remaining.replace(/[^\d]/g, '');
    },
    'location.bin': (value) => {
      // Only allow "Bin-" followed by a letter and optional digits
      if (!value.startsWith('Bin-') && value.length > 0) {
        return 'Bin-';
      }
      const binPart = value.substring(4);
      if (binPart.length === 0) return value;
      // First character after hyphen must be a letter
      const firstChar = binPart.charAt(0);
      if (!/^[A-Za-z]$/.test(firstChar)) {
        return 'Bin-';
      }
      // Remaining characters can be digits
      const remaining = binPart.substring(1);
      return 'Bin-' + firstChar + remaining.replace(/[^\d]/g, '');
    },
    batchNumber: (value) => {
      // Format: BATCH-YYYY-XXX
      if (!value.startsWith('BATCH-') && value.length > 0) {
        return 'BATCH-';
      }
      const batchPart = value.substring(6);
      if (batchPart.length === 0) return value;
      
      // Split by hyphen
      const parts = batchPart.split('-');
      if (parts.length === 1) {
        // Only year part so far
        const year = parts[0].replace(/[^\d]/g, '');
        return 'BATCH-' + year.substring(0, 4);
      } else if (parts.length === 2) {
        // Year and number parts
        const year = parts[0].replace(/[^\d]/g, '').substring(0, 4);
        const number = parts[1].replace(/[^\d]/g, '').substring(0, 3);
        return 'BATCH-' + year + '-' + number;
      }
      return value;
    },
    serialNumber: (value) => {
      // Only allow alphanumeric and hyphens, max 10 characters
      return value.replace(/[^A-Za-z0-9\-]/g, '').substring(0, 10);
    }
  };

  // ✅ FIXED: Validate a single field and update state
  const validateField = (fieldName, value) => {
    const validator = validators[fieldName];
    if (validator) {
      return validator(value, formData);
    }
    return '';
  };

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
    
    // Clear company and supplier related errors
    const companyFields = ['companyId', 'supplier.name', 'supplier.email', 'supplier.contact'];
    const newErrors = { ...errors };
    companyFields.forEach(field => {
      delete newErrors[field];
    });
    setErrors(newErrors);
  };

  // ✅ FIXED: Handle input changes with immediate validation and filtering
  const handleInputChange = (field, value) => {
    // Convert value to appropriate type
    let processedValue = value;
    if (field === 'quantity' || field === 'price' || 
        field === 'autoRestock.minStockLevel' || 
        field === 'autoRestock.maxStockLevel' || 
        field === 'autoRestock.reorderQuantity') {
      processedValue = Number(value) || 0;
    } else if (field === 'autoRestock.isEnabled') {
      processedValue = value === 'true';
    } else {
      // Apply input filtering if a filter exists for this field
      if (inputFilters[field]) {
        processedValue = inputFilters[field](value);
      }
    }

    // Update form data
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: processedValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: processedValue
      }));
    }

    // Always validate the field on change for immediate feedback
    const error = validateField(field, processedValue);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // ✅ FIXED: Comprehensive form validation
  const validateForm = () => {
    const newErrors = {};
    
    // Validate all fields
    Object.keys(validators).forEach(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj && obj[key], formData)
        : formData[field];
        
      const error = validators[field](value, formData);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
          <button className="simodel-close-btn" onClick={onClose}>×</button>
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
                  placeholder="Enter item name (letters only)"
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
                {errors.name && (
                  <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {errors.name}
                  </span>
                )}
                <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                  💡 Only letters and spaces are allowed
                </small>
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
                {errors.category && (
                  <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {errors.category}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter item description"
                  rows="3"
                  className={errors.description ? 'error' : ''}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px', resize: 'vertical' }}
                />
                {errors.description && (
                  <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {errors.description}
                  </span>
                )}
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
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className={errors.quantity ? 'error' : ''}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.quantity && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors.quantity}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price per Unit ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={errors.price ? 'error' : ''}
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.price && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors.price}
                    </span>
                  )}
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
                    onChange={(e) => handleInputChange('autoRestock.minStockLevel', e.target.value)}
                    className={errors['autoRestock.minStockLevel'] ? 'error' : ''}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors['autoRestock.minStockLevel'] && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors['autoRestock.minStockLevel']}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Max Stock Level</label>
                  <input
                    type="number"
                    value={formData.autoRestock.maxStockLevel}
                    onChange={(e) => handleInputChange('autoRestock.maxStockLevel', e.target.value)}
                    className={errors['autoRestock.maxStockLevel'] ? 'error' : ''}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors['autoRestock.maxStockLevel'] && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors['autoRestock.maxStockLevel']}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Reorder Quantity</label>
                  <input
                    type="number"
                    value={formData.autoRestock.reorderQuantity}
                    onChange={(e) => handleInputChange('autoRestock.reorderQuantity', e.target.value)}
                    className={errors['autoRestock.reorderQuantity'] ? 'error' : ''}
                    min="0"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors['autoRestock.reorderQuantity'] && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors['autoRestock.reorderQuantity']}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Auto-Restock Enabled</label>
                <select
                  value={formData.autoRestock.isEnabled}
                  onChange={(e) => handleInputChange('autoRestock.isEnabled', e.target.value)}
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
                {errors.companyId && (
                  <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {errors.companyId}
                  </span>
                )}
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
                        className={errors['supplier.name'] ? 'error' : ''}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          backgroundColor: formData.companyId ? '#e9ecef' : 'white',
                          cursor: formData.companyId ? 'not-allowed' : 'text'
                        }}
                      />
                      {errors['supplier.name'] && (
                        <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                          {errors['supplier.name']}
                        </span>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Contact</label>
                      <input
                        type="text"
                        value={formData.supplier.contact}
                        onChange={(e) => handleInputChange('supplier.contact', e.target.value)}
                        readOnly={!!formData.companyId}
                        className={errors['supplier.contact'] ? 'error' : ''}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          backgroundColor: formData.companyId ? '#e9ecef' : 'white',
                          cursor: formData.companyId ? 'not-allowed' : 'text'
                        }}
                      />
                      {errors['supplier.contact'] && (
                        <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                          {errors['supplier.contact']}
                        </span>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Email</label>
                      <input
                        type="email"
                        value={formData.supplier.email}
                        onChange={(e) => handleInputChange('supplier.email', e.target.value)}
                        readOnly={!!formData.companyId}
                        className={errors['supplier.email'] ? 'error' : ''}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          border: '1px solid #ced4da', 
                          borderRadius: '4px',
                          backgroundColor: formData.companyId ? '#e9ecef' : 'white',
                          cursor: formData.companyId ? 'not-allowed' : 'text'
                        }}
                      />
                      {errors['supplier.email'] && (
                        <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                          {errors['supplier.email']}
                        </span>
                      )}
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
                    className={errors['location.room'] ? 'error' : ''}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors['location.room'] && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors['location.room']}
                    </span>
                  )}
                  <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    💡 Format: Room-101 (auto-formatted)
                  </small>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Shelf</label>
                  <input
                    type="text"
                    value={formData.location.shelf}
                    onChange={(e) => handleInputChange('location.shelf', e.target.value)}
                    placeholder="Shelf-A1"
                    className={errors['location.shelf'] ? 'error' : ''}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors['location.shelf'] && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors['location.shelf']}
                    </span>
                  )}
                  <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    💡 Format: Shelf-A1 (auto-formatted)
                  </small>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Bin</label>
                  <input
                    type="text"
                    value={formData.location.bin}
                    onChange={(e) => handleInputChange('location.bin', e.target.value)}
                    placeholder="Bin-B12"
                    className={errors['location.bin'] ? 'error' : ''}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors['location.bin'] && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors['location.bin']}
                    </span>
                  )}
                  <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    💡 Format: Bin-B12 (auto-formatted)
                  </small>
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
                    className={errors.expiryDate ? 'error' : ''}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.expiryDate && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors.expiryDate}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    placeholder="BATCH-2025-001"
                    className={errors.batchNumber ? 'error' : ''}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.batchNumber && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors.batchNumber}
                    </span>
                  )}
                  <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    💡 Format: BATCH-2025-001 (auto-formatted)
                  </small>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="SN-123456789"
                    maxLength={10}
                    className={errors.serialNumber ? 'error' : ''}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  {errors.serialNumber && (
                    <span style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {errors.serialNumber}
                    </span>
                  )}
                  <small style={{ color: '#6c757d', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                    💡 Max 10 characters, alphanumeric and hyphens only
                  </small>
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