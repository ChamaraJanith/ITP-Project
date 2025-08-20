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
  
  useEffect(() => {
    if (item) {
      // Edit mode - populate form with existing data
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
    } else {
      // Add mode - reset form
      setFormData({
        name: '',
        category: categories || '', // Fixed: Use first category instead of array
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
    }
    setErrors({});
  }, [item, categories]);

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

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (formData.price < 0) newErrors.price = 'Price cannot be negative';
    if (!formData.supplier.name.trim()) newErrors['supplier.name'] = 'Supplier name is required';
    
    if (formData.supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier.email)) {
      newErrors['supplier.email'] = 'Invalid email format';
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? '✏️ Edit Surgical Item' : '➕ Add New Surgical Item'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
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
                />
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
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter item description"
                  rows="3"
                />
              </div>
            </div>

            {/* Inventory Information */}
            <div className="form-section">
              <h3>📦 Inventory Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    className={errors.quantity ? 'error' : ''}
                    min="0"
                  />
                  {errors.quantity && <span className="error-text">{errors.quantity}</span>}
                </div>
                <div className="form-group">
                  <label>Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Price per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={errors.price ? 'error' : ''}
                  min="0"
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>
            </div>

            {/* Supplier Information */}
            <div className="form-section">
              <h3>🏢 Supplier Information</h3>
              
              <div className="form-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  value={formData.supplier.name}
                  onChange={(e) => handleInputChange('supplier.name', e.target.value)}
                  className={errors['supplier.name'] ? 'error' : ''}
                  placeholder="Enter supplier name"
                />
                {errors['supplier.name'] && <span className="error-text">{errors['supplier.name']}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    value={formData.supplier.contact}
                    onChange={(e) => handleInputChange('supplier.contact', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.supplier.email}
                    onChange={(e) => handleInputChange('supplier.email', e.target.value)}
                    className={errors['supplier.email'] ? 'error' : ''}
                    placeholder="supplier@email.com"
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
                  <label>Room</label>
                  <input
                    type="text"
                    value={formData.location.room}
                    onChange={(e) => handleInputChange('location.room', e.target.value)}
                    placeholder="Room number"
                  />
                </div>
                <div className="form-group">
                  <label>Shelf</label>
                  <input
                    type="text"
                    value={formData.location.shelf}
                    onChange={(e) => handleInputChange('location.shelf', e.target.value)}
                    placeholder="Shelf number"
                  />
                </div>
                <div className="form-group">
                  <label>Bin</label>
                  <input
                    type="text"
                    value={formData.location.bin}
                    onChange={(e) => handleInputChange('location.bin', e.target.value)}
                    placeholder="Bin number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    placeholder="Batch number"
                  />
                </div>
                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="Serial number"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              ❌ Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '⏳ Saving...' : (item ? '✅ Update Item' : '✅ Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurgicalItemModal;
