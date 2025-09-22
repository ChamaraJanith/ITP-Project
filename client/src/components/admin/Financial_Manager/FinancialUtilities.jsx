import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FinancialUtilities.css';

// Custom hook for form validation
const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get current month date restrictions
  const getCurrentMonthDateRange = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return {
      min: startDate.toISOString().split('T')[0],
      max: endDate.toISOString().split('T')[0]
    };
  }, []);

  // Validation rules
  const validateField = useCallback((name, value, formData = {}) => {
    let error = '';

    switch (name) {
      case 'amount':
        if (!value || value === '') {
          error = 'Amount is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          error = 'Amount must be a positive number';
        } else if (parseFloat(value) > 999999999.99) {
          error = 'Amount cannot exceed 999,999,999.99';
        }
        break;

      case 'vendor_name':
        if (!value || value.trim() === '') {
          error = 'Vendor name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = 'Vendor name must contain only letters and spaces';
        } else if (value.trim().length < 2) {
          error = 'Vendor name must be at least 2 characters long';
        } else if (value.trim().length > 50) {
          error = 'Vendor name cannot exceed 50 characters';
        }
        break;

      case 'invoice_number':
        if (value && value.trim() !== '') {
          const cleanValue = value.trim();
          if (!/^[a-zA-Z0-9]{6}$/.test(cleanValue)) {
            error = 'Invoice number must be exactly 6 characters (letters and numbers only)';
          }
        }
        break;

      case 'billing_period_start':
        if (!value) {
          error = 'Billing period start date is required';
        } else {
          const dateRange = getCurrentMonthDateRange();
          if (value < dateRange.min || value > dateRange.max) {
            error = 'Start date must be within the current month';
          }
        }
        break;

      case 'billing_period_end':
        if (!value) {
          error = 'Billing period end date is required';
        } else {
          const dateRange = getCurrentMonthDateRange();
          if (value < dateRange.min || value > dateRange.max) {
            error = 'End date must be within the current month';
          } else if (formData.billing_period_start && value < formData.billing_period_start) {
            error = 'End date must be after or equal to start date';
          }
        }
        break;

      case 'description':
        if (!value || value.trim() === '') {
          error = 'Description is required';
        } else if (value.trim().length < 10) {
          error = 'Description must be at least 10 characters long';
        } else if (value.trim().length > 500) {
          error = 'Description cannot exceed 500 characters';
        }
        break;

      case 'category':
        if (!value) {
          error = 'Category is required';
        }
        break;

      case 'payment_status':
        if (!value) {
          error = 'Payment status is required';
        }
        break;

      default:
        break;
    }

    return error;
  }, [getCurrentMonthDateRange]);

  // Validate all fields
  const validateForm = useCallback((formData) => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      if (field !== 'utilityId') { // Skip readonly field
        const error = validateField(field, formData[field], formData);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField]);

  // Validate single field
  const validateSingleField = useCallback((name, value, formData = {}) => {
    const error = validateField(name, value, formData);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return !error;
  }, [validateField]);

  // Mark field as touched
  const touchField = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  // Get error for field
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : '';
  }, [errors, touched]);

  return {
    errors,
    touched,
    validateForm,
    validateSingleField,
    touchField,
    clearErrors,
    getFieldError,
    getCurrentMonthDateRange
  };
};

// Custom hook for API operations
const useFinancialUtilities = () => {
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const API_BASE = 'http://localhost:7000/api/financial-utilities';

  const fetchUtilities = useCallback(async (page = 1, filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filterParams
      });

      const response = await axios.get(`${API_BASE}?${params}`);
      
      if (response.data.success) {
        return {
          utilities: response.data.data.utilities,
          pagination: response.data.data.pagination
        };
      }
      throw new Error('Failed to fetch utilities');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch utilities');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  const generateUniqueId = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/generate-id`);
      if (response.data.success) {
        return response.data.data.id;
      }
    } catch (err) {
      console.error('ID generation error:', err);
    }
  }, []);

  const createUtility = useCallback(async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post(API_BASE, formData);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to create utility');
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUtility = useCallback(async (utilityId, formData) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE}/${utilityId}`, formData);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to update utility');
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUtility = useCallback(async (utilityId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE}/${utilityId}`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to delete utility');
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    utilities,
    setUtilities,
    loading,
    error,
    stats,
    fetchUtilities,
    fetchStats,
    generateUniqueId,
    createUtility,
    updateUtility,
    deleteUtility
  };
};

// Enhanced form management hook
const useUtilityForm = (initialData = {}, validation) => {
  const [formData, setFormData] = useState({
    utilityId: '',
    category: 'Electricity',
    description: '',
    amount: '',
    billing_period_start: '',
    billing_period_end: '',
    payment_status: 'Pending',
    vendor_name: '',
    invoice_number: '',
    ...initialData
  });

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Handle specific field formatting
    let formattedValue = value;
    
    if (name === 'vendor_name') {
      // Only allow letters and spaces, auto-capitalize words
      formattedValue = value.replace(/[^a-zA-Z\s]/g, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else if (name === 'invoice_number') {
      // Only allow alphanumeric, max 6 characters, uppercase
      formattedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Validate field on change if validation is provided
    if (validation && validation.touchField && validation.validateSingleField) {
      validation.touchField(name);
      validation.validateSingleField(name, formattedValue, { ...formData, [name]: formattedValue });
    }
  }, [formData, validation]);

  const resetForm = useCallback(() => {
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
    if (validation && validation.clearErrors) {
      validation.clearErrors();
    }
  }, [validation]);

  const setFormValue = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  return {
    formData,
    handleFormChange,
    resetForm,
    setFormData,
    setFormValue
  };
};

// Constants
const UTILITY_CATEGORIES = [
  'Electricity',
  'Water & Sewage', 
  'Waste Management',
  'Internet & Communication',
  'Generator Fuel',
  'Other'
];

const PAYMENT_STATUSES = ['Pending', 'Paid', 'Overdue'];

// Sub-components
const StatisticsCard = ({ icon, title, value, subtitle, className = '' }) => (
  <article className={`fu-statistics__card fu-statistics__card--${className}`}>
    <div className="fu-statistics__icon">
      <i className={`fas ${icon}`} aria-hidden="true"></i>
    </div>
    <div className="fu-statistics__content">
      <h3 className="fu-statistics__title">{title}</h3>
      <p className="fu-statistics__value">{value}</p>
      <small className="fu-statistics__subtitle">{subtitle}</small>
    </div>
  </article>
);

const FilterGroup = ({ label, children, className = '' }) => (
  <div className={`fu-filters__group ${className}`}>
    <label className="fu-filters__label">{label}:</label>
    {children}
  </div>
);

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="fu-loading" role="status" aria-live="polite">
    <i className="fas fa-spinner fa-spin fu-loading__icon" aria-hidden="true"></i>
    <span className="fu-loading__text">{message}</span>
  </div>
);

const ErrorAlert = ({ message, onDismiss }) => (
  <div className="fu-alert fu-alert--error" role="alert">
    <i className="fas fa-exclamation-triangle fu-alert__icon" aria-hidden="true"></i>
    <span className="fu-alert__message">{message}</span>
    {onDismiss && (
      <button 
        className="fu-alert__dismiss" 
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        <i className="fas fa-times"></i>
      </button>
    )}
  </div>
);

// New Validation Error Component
const ValidationError = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="fu-form__error" role="alert">
      <i className="fas fa-exclamation-circle fu-form__error-icon" aria-hidden="true"></i>
      <span className="fu-form__error-text">{error}</span>
    </div>
  );
};

const UtilityTableRow = ({ 
  utility, 
  onEdit, 
  onDelete, 
  formatCurrency, 
  formatDate, 
  getPaymentStatusBadge 
}) => (
  <tr className="fu-table__row">
    <td className="fu-table__cell fu-table__cell--utility-id">
      <code className="fu-utility__id">{utility.utilityId}</code>
    </td>
    <td className="fu-table__cell">
      <span className={`fu-category-badge fu-category-badge--${utility.category.toLowerCase().replace(/\s+/g, '-')}`}>
        {utility.category}
      </span>
    </td>
    <td className="fu-table__cell fu-table__cell--description" title={utility.description}>
      {utility.description}
    </td>
    <td className="fu-table__cell fu-table__cell--amount">
      <span className="fu-amount">{formatCurrency(utility.amount)}</span>
    </td>
    <td className="fu-table__cell fu-table__cell--billing-period">
      <div className="fu-date-range">
        <time className="fu-date-range__start" dateTime={utility.billing_period_start}>
          {formatDate(utility.billing_period_start)}
        </time>
        <span className="fu-date-range__separator" aria-label="to">→</span>
        <time className="fu-date-range__end" dateTime={utility.billing_period_end}>
          {formatDate(utility.billing_period_end)}
        </time>
      </div>
    </td>
    <td className="fu-table__cell fu-table__cell--vendor">
      <span className="fu-vendor">{utility.vendor_name}</span>
    </td>
    <td className="fu-table__cell fu-table__cell--status">
      <span className={`fu-status-badge fu-status-badge--${getPaymentStatusBadge(utility.payment_status)}`}>
        {utility.payment_status}
      </span>
    </td>
    <td className="fu-table__cell fu-table__cell--invoice">
      <span className="fu-invoice">{utility.invoice_number || 'N/A'}</span>
    </td>
    <td className="fu-table__cell fu-table__cell--actions">
      <div className="fu-actions">
        <button 
          className="fu-button fu-button--small fu-button--secondary"
          onClick={() => onEdit(utility)}
          aria-label={`Edit utility ${utility.utilityId}`}
        >
          Edit 
          <i className="fas fa-edit" aria-hidden="true"></i>
        </button>
        <button 
          className="fu-button fu-button--small fu-button--danger"
          onClick={() => onDelete(utility.utilityId)}
          aria-label={`Delete utility ${utility.utilityId}`}
        >
          Delete
          <i className="fas fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </td>
  </tr>
);

const Pagination = ({ currentPage, totalPages, totalRecords, onPageChange }) => {
  const pages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav className="fu-pagination" aria-label="Utility records pagination">
      <div className="fu-pagination__controls">
        <button 
          className="fu-pagination__button fu-pagination__button--prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <i className="fas fa-chevron-left" aria-hidden="true"></i>
          Previous
        </button>
        
        <div className="fu-pagination__pages">
          {pages.map(page => (
            <button 
              key={page}
              className={`fu-pagination__button fu-pagination__button--page ${
                currentPage === page ? 'fu-pagination__button--active' : ''
              }`}
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button 
          className="fu-pagination__button fu-pagination__button--next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          Next
          <i className="fas fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
      
      <div className="fu-pagination__info">
        <span className="fu-pagination__text">
          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} entries
        </span>
      </div>
    </nav>
  );
};

// Enhanced Utility Modal with Validation
const UtilityModal = ({ 
  isOpen, 
  onClose, 
  title, 
  mode = 'create',
  formData, 
  onFormChange, 
  onSubmit, 
  loading,
  validation
}) => {
  const dateRange = validation ? validation.getCurrentMonthDateRange() : { min: '', max: '' };
  
  if (!isOpen) return null;

  return (
    <div className="fu-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="fu-modal-title">
      <div className="fu-modal__container">
        <header className="fu-modal__header">
          <h2 id="fu-modal-title" className="fu-modal__title">
            <i className={`fas ${mode === 'create' ? 'fa-plus' : 'fa-edit'}`} aria-hidden="true"></i>
            {title}
          </h2>
          <button 
            className="fu-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </header>
        
        <form className="fu-form" onSubmit={onSubmit} noValidate>
          <div className="fu-modal__body">
            <div className="fu-form__grid">
              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-utility-id">Utility ID:</label>
                <input 
                  id="fu-utility-id"
                  type="text" 
                  name="utilityId"
                  value={formData.utilityId}
                  onChange={onFormChange}
                  className="fu-form__input fu-form__input--readonly"
                  required
                  readOnly
                />
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-category">Category:</label>
                <select 
                  id="fu-category"
                  name="category"
                  value={formData.category}
                  onChange={onFormChange}
                  className={`fu-form__select ${validation && validation.getFieldError('category') ? 'fu-form__input--error' : ''}`}
                  required
                >
                  {UTILITY_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {validation && <ValidationError error={validation.getFieldError('category')} />}
              </div>

              <div className="fu-form__field fu-form__field--full-width">
                <label className="fu-form__label" htmlFor="fu-description">
                  Description: <span className="fu-form__required">*</span>
                </label>
                <textarea 
                  id="fu-description"
                  name="description"
                  value={formData.description}
                  onChange={onFormChange}
                  className={`fu-form__textarea ${validation && validation.getFieldError('description') ? 'fu-form__input--error' : ''}`}
                  required
                  rows="3"
                  placeholder="Enter detailed utility description (minimum 10 characters)..."
                  maxLength="500"
                />
                <div className="fu-form__helper-text">
                  {formData.description.length}/500 characters
                </div>
                {validation && <ValidationError error={validation.getFieldError('description')} />}
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-amount">
                  Amount (LKR): <span className="fu-form__required">*</span>
                </label>
                <input 
                  id="fu-amount"
                  type="number" 
                  name="amount"
                  value={formData.amount}
                  onChange={onFormChange}
                  className={`fu-form__input ${validation && validation.getFieldError('amount') ? 'fu-form__input--error' : ''}`}
                  required
                  min="0.01"
                  max="999999999.99"
                  step="0.01"
                  placeholder="0.00"
                />
                {validation && <ValidationError error={validation.getFieldError('amount')} />}
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-start-date">
                  Billing Period Start: <span className="fu-form__required">*</span>
                </label>
                <input 
                  id="fu-start-date"
                  type="date" 
                  name="billing_period_start"
                  value={formData.billing_period_start}
                  onChange={onFormChange}
                  className={`fu-form__input ${validation && validation.getFieldError('billing_period_start') ? 'fu-form__input--error' : ''}`}
                  required
                  min={dateRange.min}
                  max={dateRange.max}
                />
                <div className="fu-form__helper-text">
                  Current month only: {dateRange.min} to {dateRange.max}
                </div>
                {validation && <ValidationError error={validation.getFieldError('billing_period_start')} />}
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-end-date">
                  Billing Period End: <span className="fu-form__required">*</span>
                </label>
                <input 
                  id="fu-end-date"
                  type="date" 
                  name="billing_period_end"
                  value={formData.billing_period_end}
                  onChange={onFormChange}
                  className={`fu-form__input ${validation && validation.getFieldError('billing_period_end') ? 'fu-form__input--error' : ''}`}
                  required
                  min={dateRange.min}
                  max={dateRange.max}
                />
                <div className="fu-form__helper-text">
                  Current month only: {dateRange.min} to {dateRange.max}
                </div>
                {validation && <ValidationError error={validation.getFieldError('billing_period_end')} />}
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-payment-status">Payment Status:</label>
                <select 
                  id="fu-payment-status"
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={onFormChange}
                  className={`fu-form__select ${validation && validation.getFieldError('payment_status') ? 'fu-form__input--error' : ''}`}
                  required
                >
                  {PAYMENT_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {validation && <ValidationError error={validation.getFieldError('payment_status')} />}
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-vendor">
                  Vendor Name: <span className="fu-form__required">*</span>
                </label>
                <input 
                  id="fu-vendor"
                  type="text" 
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={onFormChange}
                  className={`fu-form__input ${validation && validation.getFieldError('vendor_name') ? 'fu-form__input--error' : ''}`}
                  required
                  placeholder="Enter vendor name (letters only)..."
                  maxLength="50"
                  pattern="[A-Za-z\s]+"
                  title="Only letters and spaces are allowed"
                />
                <div className="fu-form__helper-text">
                  Letters and spaces only, 2-50 characters
                </div>
                {validation && <ValidationError error={validation.getFieldError('vendor_name')} />}
              </div>

              <div className="fu-form__field">
                <label className="fu-form__label" htmlFor="fu-invoice">
                  Invoice Number: <span className="fu-form__optional">(Optional)</span>
                </label>
                <input 
                  id="fu-invoice"
                  type="text" 
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={onFormChange}
                  className={`fu-form__input ${validation && validation.getFieldError('invoice_number') ? 'fu-form__input--error' : ''}`}
                  placeholder="ABC123 (exactly 6 characters)"
                  maxLength="6"
                  pattern="[A-Za-z0-9]{6}"
                  title="Exactly 6 characters (letters and numbers only)"
                />
                <div className="fu-form__helper-text">
                  Exactly 6 characters: letters and numbers only ({formData.invoice_number.length}/6)
                </div>
                {validation && <ValidationError error={validation.getFieldError('invoice_number')} />}
              </div>
            </div>
          </div>
          
          <footer className="fu-modal__footer">
            <button 
              type="button" 
              className="fu-button fu-button--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="fu-button fu-button--primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <i className={`fas ${mode === 'create' ? 'fa-save' : 'fa-save'}`} aria-hidden="true"></i>
                  {mode === 'create' ? 'Create Utility' : 'Update Utility'}
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

// Main Component
const FinancialUtilities = () => {
  // Navigation hook
  const navigate = useNavigate();
  
  // Form validation hook
  const validation = useFormValidation();

  // Custom hooks
  const {
    utilities,
    setUtilities,
    loading,
    error,
    stats,
    fetchUtilities,
    fetchStats,
    generateUniqueId,
    createUtility,
    updateUtility,
    deleteUtility
  } = useFinancialUtilities();

  const {
    formData,
    handleFormChange,
    resetForm,
    setFormData
  } = useUtilityForm({}, validation);

  // State management
  const [filteredUtilities, setFilteredUtilities] = useState([]);
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

  // Utility functions
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  }, []);

  const getPaymentStatusBadge = useCallback((status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Overdue': return 'danger';
      case 'Pending': return 'warning';
      default: return 'secondary';
    }
  }, []);

  // Navigation handler
  const handleNavigateToFinancialDashboard = useCallback(() => {
    navigate('/admin/financial');
  }, [navigate]);

  // Event handlers
  const handleFetchUtilities = useCallback(async (page = 1, filterParams = {}) => {
    try {
      const result = await fetchUtilities(page, filterParams);
      setUtilities(result.utilities);
      setFilteredUtilities(result.utilities);
      setCurrentPage(result.pagination.current_page);
      setTotalPages(result.pagination.total_pages);
      setTotalRecords(result.pagination.total_records);
    } catch (err) {
      console.error('Failed to fetch utilities:', err);
    }
  }, [fetchUtilities, setUtilities]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    handleFetchUtilities(1, newFilters);
  }, [filters, handleFetchUtilities]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    handleFetchUtilities(page, filters);
  }, [filters, handleFetchUtilities]);

  const clearFilters = useCallback(() => {
    const emptyFilters = {
      category: '',
      payment_status: '',
      vendor_name: '',
      start_date: '',
      end_date: ''
    };
    setFilters(emptyFilters);
    setCurrentPage(1);
    handleFetchUtilities(1, {});
  }, [handleFetchUtilities]);

  const openCreateModal = useCallback(async () => {
    resetForm();
    validation.clearErrors();
    try {
      const id = await generateUniqueId();
      setFormData(prev => ({ ...prev, utilityId: id }));
    } catch (err) {
      console.error('Failed to generate ID:', err);
    }
    setShowCreateModal(true);
  }, [resetForm, generateUniqueId, setFormData, validation]);

  const openEditModal = useCallback((utility) => {
    validation.clearErrors();
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
  }, [setFormData, validation]);

  const handleCreateUtility = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const isValid = validation.validateForm(formData);
    
    if (!isValid) {
      alert('Please fix all validation errors before submitting.');
      return;
    }
    
    try {
      await createUtility(formData);
      setShowCreateModal(false);
      resetForm();
      await handleFetchUtilities(currentPage, filters);
      await fetchStats();
      alert('Utility record created successfully!');
    } catch (err) {
      alert('Failed to create utility record: ' + err.message);
    }
  }, [formData, createUtility, resetForm, handleFetchUtilities, currentPage, filters, fetchStats, validation]);

  const handleUpdateUtility = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const isValid = validation.validateForm(formData);
    
    if (!isValid) {
      alert('Please fix all validation errors before submitting.');
      return;
    }
    
    try {
      const updateData = { ...formData };
      delete updateData.utilityId;
      
      await updateUtility(selectedUtility.utilityId, updateData);
      setShowEditModal(false);
      resetForm();
      await handleFetchUtilities(currentPage, filters);
      await fetchStats();
      alert('Utility record updated successfully!');
    } catch (err) {
      alert('Failed to update utility record: ' + err.message);
    }
  }, [formData, selectedUtility, updateUtility, resetForm, handleFetchUtilities, currentPage, filters, fetchStats, validation]);

  const handleDeleteUtility = useCallback(async (utilityId) => {
    if (!window.confirm('Are you sure you want to delete this utility record?')) {
      return;
    }
    
    try {
      await deleteUtility(utilityId);
      await handleFetchUtilities(currentPage, filters);
      await fetchStats();
      alert('Utility record deleted successfully!');
    } catch (err) {
      alert('Failed to delete utility record: ' + err.message);
    }
  }, [deleteUtility, handleFetchUtilities, currentPage, filters, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    handleFetchUtilities();
    fetchStats();
  }, []);

  // Calculate statistics
  const statisticsData = useMemo(() => {
    if (!stats) return null;
    
    return [
      {
        icon: 'fa-chart-line',
        title: 'Total Expenses',
        value: formatCurrency(stats.total_expenses),
        subtitle: `${stats.total_records} records`,
        className: 'total-expenses'
      },
      {
        icon: 'fa-clock',
        title: 'Pending Payments',
        value: stats.payment_status_breakdown.find(s => s._id === 'Pending')?.count || 0,
        subtitle: 'Awaiting payment',
        className: 'pending-payments'
      },
      {
        icon: 'fa-exclamation-triangle',
        title: 'Overdue Payments',
        value: stats.payment_status_breakdown.find(s => s._id === 'Overdue')?.count || 0,
        subtitle: 'Requires attention',
        className: 'overdue-payments'
      },
      {
        icon: 'fa-check-circle',
        title: 'Paid Utilities',
        value: stats.payment_status_breakdown.find(s => s._id === 'Paid')?.count || 0,
        subtitle: 'Completed payments',
        className: 'paid-utilities'
      }
    ];
  }, [stats, formatCurrency]);

  return (
    <div className="fu-container">
      {/* Header Section */}
      <header className="fu-header">
        <div className="fu-header__content">
          <h1 className="fu-header__title">
            <i className="fas fa-bolt fu-header__icon" aria-hidden="true"></i>
            Financial Utilities Management
          </h1>
          <p className="fu-header__subtitle">
            Manage electricity, water, waste management, and other utility expenses
          </p>
        </div>
        
        <div className="fu-header__actions">
          <button 
            className="fu-button fu-button--secondary fu-header__nav-btn"
            onClick={handleNavigateToFinancialDashboard}
            type="button"
          >
            <i className="fas fa-chart-pie" aria-hidden="true"></i>
            Financial Dashboard
          </button>
          <button 
            className="fu-button fu-button--primary fu-header__action"
            onClick={openCreateModal}
            type="button"
          >
            <i className="fas fa-plus" aria-hidden="true"></i>
            Add New Utility
          </button>
        </div>
      </header>

      {/* Statistics Section */}
      {statisticsData && (
        <section className="fu-statistics" aria-labelledby="fu-statistics-title">
          <h2 id="fu-statistics-title" className="fu-visually-hidden">Utility Statistics</h2>
          <div className="fu-statistics__grid">
            {statisticsData.map((stat, index) => (
              <StatisticsCard key={index} {...stat} />
            ))}
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="fu-filters" aria-labelledby="fu-filters-title">
        <header className="fu-filters__header">
          <h2 id="fu-filters-title" className="fu-filters__title">
            <i className="fas fa-filter" aria-hidden="true"></i>
            Filter Options
          </h2>
        </header>
        
        <div className="fu-filters__container">
          <FilterGroup label="Category">
            <select 
              name="category" 
              value={filters.category} 
              onChange={handleFilterChange}
              className="fu-filters__select"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {UTILITY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup label="Payment Status">
            <select 
              name="payment_status" 
              value={filters.payment_status} 
              onChange={handleFilterChange}
              className="fu-filters__select"
              aria-label="Filter by payment status"
            >
              <option value="">All Statuses</option>
              {PAYMENT_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup label="Vendor">
            <input 
              type="text" 
              name="vendor_name" 
              value={filters.vendor_name} 
              onChange={handleFilterChange}
              className="fu-filters__input"
              placeholder="Search vendor..."
              aria-label="Filter by vendor name"
            />
          </FilterGroup>

          <FilterGroup label="Start Date">
            <input 
              type="date" 
              name="start_date" 
              value={filters.start_date} 
              onChange={handleFilterChange}
              className="fu-filters__input"
              aria-label="Filter by start date"
            />
          </FilterGroup>

          <FilterGroup label="End Date">
            <input 
              type="date" 
              name="end_date" 
              value={filters.end_date} 
              onChange={handleFilterChange}
              className="fu-filters__input"
              aria-label="Filter by end date"
            />
          </FilterGroup>

          <FilterGroup label=" " className="fu-filters__group--actions">
            <button 
              className="fu-button fu-button--secondary fu-filters__clear"
              onClick={clearFilters}
              type="button"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
              Clear Filters
            </button>
          </FilterGroup>
        </div>
      </section>

      {/* Error Display */}
      {error && <ErrorAlert message={error} />}

      {/* Loading Display */}
      {loading && <LoadingSpinner />}

      {/* Data Table Section */}
      <section className="fu-data-table" aria-labelledby="fu-table-title">
        <header className="fu-data-table__header">
          <h2 id="fu-table-title" className="fu-data-table__title">
            <i className="fas fa-table" aria-hidden="true"></i>
            Utilities Records ({totalRecords})
          </h2>
        </header>
        
        <div className="fu-table-container">
          <table className="fu-table" role="table">
            <thead className="fu-table__head">
              <tr className="fu-table__row fu-table__row--header">
                <th className="fu-table__header" scope="col">Utility ID</th>
                <th className="fu-table__header" scope="col">Category</th>
                <th className="fu-table__header" scope="col">Description</th>
                <th className="fu-table__header" scope="col">Amount</th>
                <th className="fu-table__header" scope="col">Billing Period</th>
                <th className="fu-table__header" scope="col">Vendor</th>
                <th className="fu-table__header" scope="col">Status</th>
                <th className="fu-table__header" scope="col">Invoice</th>
                <th className="fu-table__header" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="fu-table__body">
              {filteredUtilities.length > 0 ? (
                filteredUtilities.map(utility => (
                  <UtilityTableRow
                    key={utility.utilityId}
                    utility={utility}
                    onEdit={openEditModal}
                    onDelete={handleDeleteUtility}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getPaymentStatusBadge={getPaymentStatusBadge}
                  />
                ))
              ) : (
                <tr className="fu-table__row">
                  <td className="fu-table__cell fu-table__cell--no-data" colSpan="9">
                    <div className="fu-no-data">
                      <i className="fas fa-inbox fu-no-data__icon" aria-hidden="true"></i>
                      <h3 className="fu-no-data__title">No utility records found</h3>
                      <p className="fu-no-data__subtitle">
                        Try adjusting your filter criteria or add a new utility record
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
        />
      </section>

      {/* Create Modal */}
      <UtilityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Utility"
        mode="create"
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleCreateUtility}
        loading={loading}
        validation={validation}
      />

      {/* Edit Modal */}
      <UtilityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Utility - ${selectedUtility?.utilityId}`}
        mode="edit"
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleUpdateUtility}
        loading={loading}
        validation={validation}
      />
    </div>
  );
};

export default FinancialUtilities;
