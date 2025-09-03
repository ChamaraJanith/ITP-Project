import React, { useState, useEffect } from 'react';
import '../Admin/styles/SurgicalItemModal.css';

const SurgicalItemModal = ({ isOpen, onClose, item, categories, onSuccess, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 0,
    minStockLevel: 10,
    price: 0,
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
  const [selectedCountry, setSelectedCountry] = useState('LK');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Country-specific phone number configurations with exact lengths
  const phoneCountries = [
    { 
      code: 'LK', 
      name: 'Sri Lanka', 
      dialCode: '+94', 
      flag: '🇱🇰', 
      length: 9, // Exactly 9 digits
      format: 'XX XXX XXXX',
      example: '77 123 4567',
      validPrefixes: ['70', '71', '72', '75', '76', '77', '78']
    },
    { 
      code: 'US', 
      name: 'United States', 
      dialCode: '+1', 
      flag: '🇺🇸', 
      length: 10, // Exactly 10 digits
      format: '(XXX) XXX-XXXX',
      example: '(213) 373-4253',
      validPrefixes: []
    },
    { 
      code: 'GB', 
      name: 'United Kingdom', 
      dialCode: '+44', 
      flag: '🇬🇧', 
      length: 10, // Exactly 10 digits
      format: 'XX XXXX XXXX',
      example: '20 7946 0958',
      validPrefixes: []
    },
    { 
      code: 'IN', 
      name: 'India', 
      dialCode: '+91', 
      flag: '🇮🇳', 
      length: 10, // Exactly 10 digits
      format: 'XXXXX XXXXX',
      example: '98765 43210',
      validPrefixes: ['6', '7', '8', '9']
    },
    { 
      code: 'AU', 
      name: 'Australia', 
      dialCode: '+61', 
      flag: '🇦🇺', 
      length: 9, // Exactly 9 digits
      format: 'XXX XXX XXX',
      example: '412 345 678',
      validPrefixes: ['4']
    },
    { 
      code: 'CA', 
      name: 'Canada', 
      dialCode: '+1', 
      flag: '🇨🇦', 
      length: 10, // Exactly 10 digits
      format: '(XXX) XXX-XXXX',
      example: '(416) 555-0123',
      validPrefixes: []
    },
    { 
      code: 'SG', 
      name: 'Singapore', 
      dialCode: '+65', 
      flag: '🇸🇬', 
      length: 8, // Exactly 8 digits
      format: 'XXXX XXXX',
      example: '9123 4567',
      validPrefixes: ['8', '9']
    },
    { 
      code: 'MY', 
      name: 'Malaysia', 
      dialCode: '+60', 
      flag: '🇲🇾', 
      length: 9, // Exactly 9 digits for mobile (10-11 for landline)
      format: 'XX-XXX XXXX',
      example: '12-345 6789',
      validPrefixes: ['1']
    }
  ];

  const currentCountry = phoneCountries.find(c => c.code === selectedCountry) || phoneCountries[0];

  // Enhanced input filters
  const inputFilters = {
    name: (value) => value.replace(/[^A-Za-z\s]/g, '').slice(0, 100),
    supplierName: (value) => value.replace(/[^A-Za-z\s]/g, '').slice(0, 100),
    description: (value) => value.slice(0, 500),
    email: (value) => value.replace(/[^a-zA-Z0-9@\.\-_]/g, '').slice(0, 254),
    location: (value) => value.replace(/[^a-zA-Z0-9\-\s]/g, '').slice(0, 20),
    batchSerial: (value) => value.replace(/[^a-zA-Z0-9\-_\.]/g, '').slice(0, 25),
    number: (value) => value.replace(/[^0-9]/g, ''),
    price: (value) => {
      const cleaned = value.replace(/[^0-9\.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
      }
      return parts.join('.');
    }
  };

  // Format phone number based on country
  const formatPhoneNumber = (digits, country) => {
    if (!digits) return '';
    
    switch (country.code) {
      case 'LK': // Sri Lanka: XX XXX XXXX
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
        
      case 'US': // USA: (XXX) XXX-XXXX
      case 'CA': // Canada: (XXX) XXX-XXXX
        if (digits.length <= 3) return `(${digits}`;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        
      case 'GB': // UK: XX XXXX XXXX
        if (digits.length <= 2) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
        
      case 'IN': // India: XXXXX XXXXX
        if (digits.length <= 5) return digits;
        return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        
      case 'AU': // Australia: XXX XXX XXX
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        
      case 'SG': // Singapore: XXXX XXXX
        if (digits.length <= 4) return digits;
        return `${digits.slice(0, 4)} ${digits.slice(4)}`;
        
      case 'MY': // Malaysia: XX-XXX XXXX
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 5)} ${digits.slice(5)}`;
        
      default:
        return digits;
    }
  };

  // Validate phone number based on country-specific rules
  const validatePhoneNumber = (digits, country) => {
    // Check exact length
    if (digits.length !== country.length) {
      return {
        isValid: false,
        message: `Must be exactly ${country.length} digits`
      };
    }

    // Check country-specific prefixes
    if (country.validPrefixes.length > 0) {
      const hasValidPrefix = country.validPrefixes.some(prefix => 
        digits.startsWith(prefix)
      );
      if (!hasValidPrefix) {
        return {
          isValid: false,
          message: `Must start with: ${country.validPrefixes.join(', ')}`
        };
      }
    }

    return {
      isValid: true,
      message: 'Valid number'
    };
  };

  const handleInputChange = (field, value, filterType = null) => {
    let filteredValue = value;

    // Apply filters for non-phone fields
    if (field !== 'supplier.contact') {
      switch (filterType) {
        case 'name':
          filteredValue = inputFilters.name(value);
          break;
        case 'supplierName':
          filteredValue = inputFilters.supplierName(value);
          break;
        case 'description':
          filteredValue = inputFilters.description(value);
          break;
        case 'email':
          filteredValue = inputFilters.email(value);
          break;
        case 'location':
          filteredValue = inputFilters.location(value);
          break;
        case 'batchSerial':
          filteredValue = inputFilters.batchSerial(value);
          break;
        case 'number':
          filteredValue = inputFilters.number(value);
          const numValue = parseInt(filteredValue);
          if (field === 'quantity' && numValue > 999999) filteredValue = '999999';
          if (field === 'minStockLevel' && numValue > 100000) filteredValue = '100000';
          break;
        case 'price':
          filteredValue = inputFilters.price(value);
          const priceValue = parseFloat(filteredValue);
          if (priceValue > 1000000) filteredValue = '1000000';
          break;
        default:
          break;
      }
    }

    // Handle nested field updates
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: filteredValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'quantity' || field === 'minStockLevel' 
          ? parseInt(filteredValue) || 0 
          : field === 'price' 
          ? parseFloat(filteredValue) || 0 
          : filteredValue
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle country selection change
  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    
    // Clear phone number when country changes
    setPhoneNumber('');
    setFormData(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        contact: ''
      }
    }));
  };

  // Handle phone number input with country-specific restrictions
  const handlePhoneInput = (e) => {
    const input = e.target.value;
    
    // Extract only digits
    const digits = input.replace(/\D/g, '');
    
    // Restrict to country-specific length
    const limitedDigits = digits.slice(0, currentCountry.length);
    
    // Update local state
    setPhoneNumber(limitedDigits);
    
    // Update form data with full international format
    const fullNumber = limitedDigits ? `${currentCountry.dialCode}${limitedDigits}` : '';
    setFormData(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        contact: fullNumber
      }
    }));

    // Clear phone error when user types
    if (errors['supplier.contact']) {
      setErrors(prev => ({ ...prev, 'supplier.contact': '' }));
    }
  };

  // Prevent non-numeric input in phone field
  const handlePhoneKeyPress = (e) => {
    const char = e.key;
    
    // Allow control keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'].includes(char)) {
      return;
    }
    
    // Only allow digits
    if (!/[0-9]/.test(char)) {
      e.preventDefault();
    }
  };

  const handleKeyPress = (e, filterType) => {
    const char = e.key;
    
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape'].includes(char)) {
      return;
    }
    
    switch (filterType) {
      case 'name':
      case 'supplierName':
        if (!/[A-Za-z\s]/.test(char)) {
          e.preventDefault();
        }
        break;
      case 'email':
        if (!/[a-zA-Z0-9@\.\-_]/.test(char)) {
          e.preventDefault();
        }
        break;
      case 'location':
        if (!/[a-zA-Z0-9\-\s]/.test(char)) {
          e.preventDefault();
        }
        break;
      case 'batchSerial':
        if (!/[a-zA-Z0-9\-_\.]/.test(char)) {
          e.preventDefault();
        }
        break;
      case 'number':
        if (!/[0-9]/.test(char)) {
          e.preventDefault();
        }
        break;
      case 'price':
        if (!/[0-9\.]/.test(char)) {
          e.preventDefault();
        }
        break;
      default:
        break;
    }
  };

  // Enhanced validation
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters and spaces';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Supplier name validation
    if (!formData.supplier.name.trim()) {
      newErrors['supplier.name'] = 'Supplier name is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.supplier.name)) {
      newErrors['supplier.name'] = 'Supplier name can only contain letters and spaces';
    } else if (formData.supplier.name.length < 2) {
      newErrors['supplier.name'] = 'Supplier name must be at least 2 characters long';
    }

    // Enhanced phone validation
    if (phoneNumber) {
      const validation = validatePhoneNumber(phoneNumber, currentCountry);
      if (!validation.isValid) {
        newErrors['supplier.contact'] = validation.message;
      }
    }

    // Other validations
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    if (formData.minStockLevel < 0) newErrors.minStockLevel = 'Min Stock Level cannot be negative';
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description is too long (max 500 characters)';
    }

    if (formData.supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier.email)) {
      newErrors['supplier.email'] = 'Invalid email format';
    }

    if (formData.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(formData.expiryDate);
      
      if (expiry <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = item 
        ? `${apiBaseUrl}/surgical-items/${item._id}` 
        : `${apiBaseUrl}/surgical-items`;
      
      const method = item ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Item ${item ? 'updated' : 'created'} successfully!`);
        onSuccess();
      } else {
        throw new Error(data.message || `Failed to ${item ? 'update' : 'create'} item`);
      }
    } catch (error) {
      console.error('❌ Error saving item:', error);
      alert(`❌ Failed to ${item ? 'update' : 'create'} item: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 20);
    return maxDate.toISOString().split('T')[0];
  };

  const CharacterCounter = ({ current, max, warning = 0.9 }) => (
    <small style={{ 
      color: current > max * warning ? '#ff6b35' : '#666', 
      fontSize: '12px',
      fontWeight: current > max * warning ? 'bold' : 'normal'
    }}>
      {current}/{max} characters
    </small>
  );

  const ValidationIndicator = ({ isValid, message }) => (
    <span style={{
      fontSize: '12px',
      color: isValid ? '#28a745' : '#dc3545',
      marginLeft: '8px'
    }}>
      {isValid ? '✓' : '✗'} {message}
    </span>
  );

  // Phone validation indicator
  const PhoneValidationIndicator = () => {
    if (!phoneNumber) {
      return <ValidationIndicator isValid={true} message="Optional" />;
    }
    
    const validation = validatePhoneNumber(phoneNumber, currentCountry);
    return <ValidationIndicator isValid={validation.isValid} message={validation.message} />;
  };

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        minStockLevel: item.minStockLevel || 10,
        price: item.price || 0,
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

      // Parse existing phone number
      if (item.supplier?.contact) {
        const country = phoneCountries.find(c => item.supplier.contact.startsWith(c.dialCode));
        if (country) {
          setSelectedCountry(country.code);
          setPhoneNumber(item.supplier.contact.replace(country.dialCode, ''));
        }
      }
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        quantity: 0,
        minStockLevel: 10,
        price: 0,
        supplier: { name: '', contact: '', email: '' },
        location: { room: '', shelf: '', bin: '' },
        expiryDate: '',
        batchNumber: '',
        serialNumber: ''
      });
      setSelectedCountry('LK');
      setPhoneNumber('');
    }
    setErrors({});
  }, [item, categories]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? '✏️ Edit Surgical Item' : '➕ Add New Surgical Item'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        {Object.keys(errors).length > 0 && (
          <div className="error-summary" style={{
            background: 'linear-gradient(135deg, #ffe6e6, #ffcccc)',
            border: '2px solid #ff9999',
            borderRadius: '8px',
            padding: '15px',
            margin: '15px 0',
            color: '#cc0000',
            boxShadow: '0 4px 12px rgba(255, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px', marginRight: '10px' }}>⚠️</span>
              <strong>Please fix the following {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''}:</strong>
            </div>
            <ul style={{ margin: '5px 0 0 30px', lineHeight: '1.6' }}>
              {Object.entries(errors).map(([field, error], index) => (
                <li key={index} style={{ marginBottom: '5px' }}>
                  <strong>{field.replace(/([A-Z])/g, ' $1').replace(/\./g, ' → ')}:</strong> {error}
                </li>
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
                <label>
                  Item Name * 
                  <small style={{ color: '#dc3545', fontWeight: 'bold' }}>
                    (Letters and spaces ONLY)
                  </small>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value, 'name')}
                  onKeyPress={(e) => handleKeyPress(e, 'name')}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter item name (letters and spaces only)"
                  maxLength="100"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <CharacterCounter current={formData.name.length} max={100} />
                  <ValidationIndicator 
                    isValid={formData.name.length >= 2 && /^[A-Za-z\s]+$/.test(formData.name)} 
                    message={
                      formData.name.length === 0 ? 'Required' :
                      formData.name.length < 2 ? 'Too short (min 2)' :
                      !/^[A-Za-z\s]+$/.test(formData.name) ? 'Letters & spaces only' :
                      'Valid name'
                    } 
                  />
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ValidationIndicator 
                  isValid={formData.category !== ''} 
                  message={formData.category ? 'Selected' : 'Required'} 
                />
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Description <small>(max 500 chars)</small></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value, 'description')}
                  placeholder="Enter item description"
                  rows="3"
                  maxLength="500"
                />
                <CharacterCounter current={formData.description.length} max={500} />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>

            {/* Inventory Information */}
            <div className="form-section">
              <h3>📦 Inventory Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity * <small>(digits only, max 999,999)</small></label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value, 'number')}
                    onKeyPress={(e) => handleKeyPress(e, 'number')}
                    className={errors.quantity ? 'error' : ''}
                    placeholder="0"
                    maxLength="6"
                  />
                  <ValidationIndicator 
                    isValid={formData.quantity >= 0 && formData.quantity <= 999999} 
                    message={`${formData.quantity.toLocaleString()}`} 
                  />
                  {errors.quantity && <span className="error-text">{errors.quantity}</span>}
                </div>
                <div className="form-group">
                  <label>Min Stock Level <small>(digits only, max 100,000)</small></label>
                  <input
                    type="text"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange('minStockLevel', e.target.value, 'number')}
                    onKeyPress={(e) => handleKeyPress(e, 'number')}
                    className={errors.minStockLevel ? 'error' : ''}
                    placeholder="10"
                    maxLength="6"
                  />
                  <ValidationIndicator 
                    isValid={formData.minStockLevel >= 0 && formData.minStockLevel <= 100000} 
                    message={`${formData.minStockLevel.toLocaleString()}`} 
                  />
                  {errors.minStockLevel && <span className="error-text">{errors.minStockLevel}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Price per Unit * <small>(numbers and decimal only)</small></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value, 'price')}
                    onKeyPress={(e) => handleKeyPress(e, 'price')}
                    className={errors.price ? 'error' : ''}
                    placeholder="0.00"
                    style={{ paddingLeft: '25px' }}
                  />
                </div>
                <ValidationIndicator 
                  isValid={formData.price >= 0 && formData.price <= 1000000} 
                  message={`$${parseFloat(formData.price || 0).toLocaleString()}`} 
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>
            </div>

            {/* Supplier Information with Enhanced Phone Input */}
            <div className="form-section">
              <h3>🏢 Supplier Information</h3>
              
              <div className="form-group">
                <label>
                  Supplier Name * 
                  <small style={{ color: '#dc3545', fontWeight: 'bold' }}>
                    (Letters and spaces ONLY)
                  </small>
                </label>
                <input
                  type="text"
                  value={formData.supplier.name}
                  onChange={(e) => handleInputChange('supplier.name', e.target.value, 'supplierName')}
                  onKeyPress={(e) => handleKeyPress(e, 'supplierName')}
                  className={errors['supplier.name'] ? 'error' : ''}
                  placeholder="Enter supplier name (letters and spaces only)"
                  maxLength="100"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <CharacterCounter current={formData.supplier.name.length} max={100} />
                  <ValidationIndicator 
                    isValid={formData.supplier.name.length >= 2 && /^[A-Za-z\s]+$/.test(formData.supplier.name)} 
                    message={
                      formData.supplier.name.length === 0 ? 'Required' :
                      formData.supplier.name.length < 2 ? 'Too short (min 2)' :
                      !/^[A-Za-z\s]+$/.test(formData.supplier.name) ? 'Letters & spaces only' :
                      'Valid name'
                    } 
                  />
                </div>
                {errors['supplier.name'] && <span className="error-text">{errors['supplier.name']}</span>}
              </div>

              <div className="form-row">
                {/* ENHANCED PHONE INPUT WITH COUNTRY-SPECIFIC LENGTH RESTRICTIONS */}
                <div className="form-group" style={{ flex: '1' }}>
                  <label>
                    Contact Phone 
                    <small style={{ color: '#007bff', fontWeight: 'bold' }}>
                      (Select country & enter {currentCountry.length} digits)
                    </small>
                  </label>
                  
                  {/* Country Selector */}
                  <div style={{ display: 'flex', marginBottom: '8px' }}>
                    <select
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      style={{
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '200px',
                        cursor: 'pointer'
                      }}
                    >
                      {phoneCountries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Phone Number Input */}
                  <div style={{ display: 'flex', border: errors['supplier.contact'] ? '2px solid #dc3545' : '1px solid #ced4da', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '10px 12px',
                      borderRight: '1px solid #e9ecef',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057',
                      minWidth: '70px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {currentCountry.dialCode}
                    </div>
                    <input
                      type="tel"
                      value={formatPhoneNumber(phoneNumber, currentCountry)}
                      onChange={handlePhoneInput}
                      onKeyPress={handlePhoneKeyPress}
                      placeholder={currentCountry.example}
                      style={{
                        border: 'none',
                        padding: '10px 12px',
                        flex: 1,
                        outline: 'none',
                        fontSize: '14px'
                      }}
                      maxLength={currentCountry.length + 10} // Extra space for formatting
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      {phoneNumber.length}/{currentCountry.length} digits
                      {currentCountry.validPrefixes.length > 0 && (
                        <span> | Must start with: {currentCountry.validPrefixes.join(', ')}</span>
                      )}
                    </small>
                    <PhoneValidationIndicator />
                  </div>
                  
                  {errors['supplier.contact'] && <span className="error-text">{errors['supplier.contact']}</span>}
                  
                  {/* Country-specific info box */}
                  <div style={{
                    background: '#e7f3ff',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    padding: '8px',
                    marginTop: '6px',
                    fontSize: '12px',
                    color: '#0056b3'
                  }}>
                    <strong>📱 {currentCountry.name} Format:</strong><br/>
                    <strong>Length:</strong> Exactly {currentCountry.length} digits<br/>
                    <strong>Example:</strong> {currentCountry.dialCode} {currentCountry.example}<br/>
                    {currentCountry.validPrefixes.length > 0 && (
                      <>
                        <strong>Valid Prefixes:</strong> {currentCountry.validPrefixes.join(', ')}<br/>
                      </>
                    )}
                    <strong>Full Format:</strong> {phoneNumber ? `${currentCountry.dialCode}${phoneNumber}` : `${currentCountry.dialCode}xxxxxxxxx`}
                  </div>
                </div>

                <div className="form-group" style={{ flex: '1' }}>
                  <label>Email <small>(Valid email format)</small></label>
                  <input
                    type="text"
                    value={formData.supplier.email}
                    onChange={(e) => handleInputChange('supplier.email', e.target.value, 'email')}
                    onKeyPress={(e) => handleKeyPress(e, 'email')}
                    className={errors['supplier.email'] ? 'error' : ''}
                    placeholder="supplier@email.com"
                    maxLength="254"
                  />
                  <ValidationIndicator 
                    isValid={!formData.supplier.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier.email)} 
                    message={formData.supplier.email ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier.email) ? 'Valid' : 'Invalid') : 'Optional'} 
                  />
                  {errors['supplier.email'] && <span className="error-text">{errors['supplier.email']}</span>}
                </div>
              </div>
            </div>

            {/* Location & Additional Info */}
            <div className="form-section">
              <h3>📍 Location & Additional Info</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Room <small>(Letters, numbers, hyphens, spaces)</small></label>
                  <input
                    type="text"
                    value={formData.location.room}
                    onChange={(e) => handleInputChange('location.room', e.target.value, 'location')}
                    onKeyPress={(e) => handleKeyPress(e, 'location')}
                    className={errors['location.room'] ? 'error' : ''}
                    placeholder="Room-101"
                    maxLength="20"
                  />
                  <CharacterCounter current={formData.location.room.length} max={20} />
                  {errors['location.room'] && <span className="error-text">{errors['location.room']}</span>}
                </div>
                <div className="form-group">
                  <label>Shelf <small>(Letters, numbers, hyphens, spaces)</small></label>
                  <input
                    type="text"
                    value={formData.location.shelf}
                    onChange={(e) => handleInputChange('location.shelf', e.target.value, 'location')}
                    onKeyPress={(e) => handleKeyPress(e, 'location')}
                    className={errors['location.shelf'] ? 'error' : ''}
                    placeholder="Shelf-A1"
                    maxLength="20"
                  />
                  <CharacterCounter current={formData.location.shelf.length} max={20} />
                  {errors['location.shelf'] && <span className="error-text">{errors['location.shelf']}</span>}
                </div>
                <div className="form-group">
                  <label>Bin <small>(Letters, numbers, hyphens, spaces)</small></label>
                  <input
                    type="text"
                    value={formData.location.bin}
                    onChange={(e) => handleInputChange('location.bin', e.target.value, 'location')}
                    onKeyPress={(e) => handleKeyPress(e, 'location')}
                    className={errors['location.bin'] ? 'error' : ''}
                    placeholder="Bin-B12"
                    maxLength="20"
                  />
                  <CharacterCounter current={formData.location.bin.length} max={20} />
                  {errors['location.bin'] && <span className="error-text">{errors['location.bin']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date <small>(Future dates only)</small></label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={errors.expiryDate ? 'error' : ''}
                    min={getTodayDate()}
                    max={getMaxDate()}
                  />
                  <ValidationIndicator 
                    isValid={!formData.expiryDate || (new Date(formData.expiryDate) > new Date())} 
                    message={formData.expiryDate ? (new Date(formData.expiryDate) > new Date() ? 'Valid Future Date' : 'Must be future') : 'Optional'} 
                  />
                  {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                </div>
                <div className="form-group">
                  <label>Batch Number <small>(Alphanumeric, -_. only)</small></label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value, 'batchSerial')}
                    onKeyPress={(e) => handleKeyPress(e, 'batchSerial')}
                    className={errors.batchNumber ? 'error' : ''}
                    placeholder="BATCH-2025-001"
                    maxLength="25"
                  />
                  <CharacterCounter current={formData.batchNumber.length} max={25} />
                  {errors.batchNumber && <span className="error-text">{errors.batchNumber}</span>}
                </div>
                <div className="form-group">
                  <label>Serial Number <small>(Alphanumeric, -_. only)</small></label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value, 'batchSerial')}
                    onKeyPress={(e) => handleKeyPress(e, 'batchSerial')}
                    className={errors.serialNumber ? 'error' : ''}
                    placeholder="SN-123456789"
                    maxLength="25"
                  />
                  <CharacterCounter current={formData.serialNumber.length} max={25} />
                  {errors.serialNumber && <span className="error-text">{errors.serialNumber}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              ❌ Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || Object.keys(errors).length > 0} 
              className="submit-btn"
              style={{
                opacity: (loading || Object.keys(errors).length > 0) ? 0.6 : 1,
                cursor: (loading || Object.keys(errors).length > 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Saving...' : (item ? '✅ Update Item' : '✅ Create Item')}
            </button>
          </div>
        </form>

        <style jsx>{`
          .error-text {
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            font-weight: 500;
            display: block;
          }
          
          .form-group input.error,
          .form-group select.error,
          .form-group textarea.error {
            border-color: #dc3545;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
          }
          
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
          }
        `}</style>
      </div>
    </div>
  );
};

export default SurgicalItemModal;
