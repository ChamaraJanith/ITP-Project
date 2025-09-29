// components/admin/Admin/SupplierManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Admin/styles/SupplierManagement.css';

// PDF generation imports
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Real-time cost metrics state
  const [supplierCosts, setSupplierCosts] = useState({
    totalCosts: 0,
    monthlyCosts: 0,
    recentOrders: [],
    topSuppliers: []
  });

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
    status: 'pending',
    rating: 3
  });

  // Real-time cost calculation function
  const calculateSupplierCosts = useCallback((orders, suppliersList) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Total costs across all orders
    const totalCosts = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Monthly costs (current month)
    const monthlyCosts = orders
      .filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))
      .slice(0, 10);
    
    // Top suppliers by spending
    const supplierSpending = {};
    orders.forEach(order => {
      const supplierId = order.supplier?._id || order.supplier;
      const supplier = suppliersList.find(s => s._id === supplierId);
      if (supplier) {
        if (!supplierSpending[supplier.name]) {
          supplierSpending[supplier.name] = 0;
        }
        supplierSpending[supplier.name] += (order.totalAmount || 0);
      }
    });
    
    const topSuppliers = Object.entries(supplierSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
    
    return {
      totalCosts,
      monthlyCosts,
      recentOrders,
      topSuppliers
    };
  }, []);

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
        address: { ...prev.address, [addressField]: sanitized }
      }));
    } else {
      setSupplierForm(prev => ({ ...prev, [field]: sanitized }));
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
    if (parts.length > 1) cleanValue += '.' + parts[1].slice(0, 2);
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

  const handleStatusInput = (value) => {
    const validStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (validStatuses.includes(value)) {
      setOrderForm(prev => ({ ...prev, status: value }));
      setErrors(prev => ({ ...prev, status: '' }));
    }
  };

  const handleRatingInput = (value) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) numValue = 1;
    if (numValue > 5) numValue = 5;
    setOrderForm(prev => ({ ...prev, rating: numValue }));
    setErrors(prev => ({ ...prev, rating: '' }));
  };

  // Enhanced Order Items validation
  const handleProductInput = (value, index) => {
    // Only allow letters and spaces, maximum 15 characters
    const sanitized = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 15);
    updateOrderItem(index, 'product', sanitized);
    
    // Validate product name
    if (sanitized.trim()) {
      setErrors(prev => ({ ...prev, [`item_${index}_product`]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [`item_${index}_product`]: 'Product name is required' }));
    }
  };

  const handleQuantityInput = (value, index) => {
    // Only allow positive integers
    const sanitized = value.replace(/\D/g, '');
    const numValue = parseInt(sanitized) || 0;
    const finalValue = Math.max(1, numValue); // Minimum 1
    updateOrderItem(index, 'quantity', finalValue);
    
    // Validate quantity
    if (finalValue >= 1) {
      setErrors(prev => ({ ...prev, [`item_${index}_quantity`]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [`item_${index}_quantity`]: 'Quantity must be at least 1' }));
    }
  };

  const handleUnitPriceInput = (value, index) => {
    // Only allow positive numbers with up to 2 decimal places
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    let cleanValue = parts[0];
    if (parts.length > 1) cleanValue += '.' + parts[1].slice(0, 2);
    const numValue = parseFloat(cleanValue) || 0;
    const finalValue = Math.max(0.01, numValue); // Minimum 0.01
    updateOrderItem(index, 'unitPrice', finalValue);
    
    // Validate unit price
    if (finalValue >= 0.01) {
      setErrors(prev => ({ ...prev, [`item_${index}_unitPrice`]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [`item_${index}_unitPrice`]: 'Unit price must be at least $0.01' }));
    }
  };

  // Check if an order item is valid
  const isOrderItemValid = (item) => {
    return (
      item.product.trim() !== '' &&
      item.quantity >= 1 &&
      item.unitPrice >= 0.01
    );
  };

  // Check if all order items are valid
  const areAllOrderItemsValid = () => {
    return orderForm.items.every(item => isOrderItemValid(item));
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
    const validStatuses = ['pending', 'approved', 'ordered', 'received', 'cancelled'];
    if (!validStatuses.includes(orderForm.status)) {
      newErrors.status = 'Please select a valid order status';
    }
    if (!orderForm.rating || orderForm.rating < 1 || orderForm.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }
    if (!orderForm.items.length) {
      newErrors.items = 'At least one item is required';
    } else {
      orderForm.items.forEach((item, index) => {
        if (!item.product.trim()) {
          newErrors[`item_${index}_product`] = 'Product name is required';
        } else if (!isValidText(item.product, 1, 15)) {
          newErrors[`item_${index}_product`] = 'Product name must be 1-15 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(item.product)) {
          newErrors[`item_${index}_product`] = 'Only letters and spaces allowed';
        }
        if (item.quantity < 1) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be at least 1';
        }
        if (item.unitPrice < 0.01) {
          newErrors[`item_${index}_unitPrice`] = 'Unit price must be at least $0.01';
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

  // Fetch data with cost calculations
  const fetchData = async () => {
    try {
      const [suppliersRes, ordersRes] = await Promise.all([
        axios.get('/api/suppliers'),
        axios.get('/api/purchase-orders')
      ]);
      
      const suppliersData = suppliersRes.data.suppliers || [];
      const ordersData = ordersRes.data.orders || [];
      
      setSuppliers(suppliersData);
      setPurchaseOrders(ordersData);
      
      // Calculate real-time costs
      const costs = calculateSupplierCosts(ordersData, suppliersData);
      setSupplierCosts(costs);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    setLoading(true);
    fetchData();
    setLastUpdated(new Date());
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!validateSupplierForm()) return;
    setIsSubmitting(true);
    try {
      let response;
      if (editingItem) {
        response = await axios.put(`/api/suppliers/${editingItem._id}`, supplierForm);
      } else {
        response = await axios.post('/api/suppliers', supplierForm);
      }
      alert(response.data.message || 'Supplier saved successfully!');
      resetForms();
      setShowModal(false);
      fetchData();
    } catch (error) {
      let errorMessage = 'Failed to save supplier. Please try again.';
      if (error.response) {
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
        errorMessage = 'No response from server. Please check if the backend is running on port 7000.';
      } else {
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
    if (!validateOrderForm()) return;
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
      await axios.post('/api/purchase-orders', orderData);
      resetForms();
      setShowModal(false);
      fetchData();
      alert('Purchase order created successfully!');
    } catch (error) {
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
      status: 'pending',
      rating: 3
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
    // Only add new item if the last item is valid
    const lastItem = orderForm.items[orderForm.items.length - 1];
    if (isOrderItemValid(lastItem)) {
      setOrderForm({
        ...orderForm,
        items: [...orderForm.items, { product: '', quantity: 1, unitPrice: 0 }]
      });
    } else {
      // Show error for the invalid item
      const index = orderForm.items.length - 1;
      if (!lastItem.product.trim()) {
        setErrors(prev => ({ ...prev, [`item_${index}_product`]: 'Product name is required' }));
      } else if (!/^[a-zA-Z\s]+$/.test(lastItem.product)) {
        setErrors(prev => ({ ...prev, [`item_${index}_product`]: 'Only letters and spaces allowed' }));
      } else if (lastItem.product.length > 15) {
        setErrors(prev => ({ ...prev, [`item_${index}_product`]: 'Maximum 15 characters allowed' }));
      }
      if (lastItem.quantity < 1) {
        setErrors(prev => ({ ...prev, [`item_${index}_quantity`]: 'Quantity must be at least 1' }));
      }
      if (lastItem.unitPrice < 0.01) {
        setErrors(prev => ({ ...prev, [`item_${index}_unitPrice`]: 'Unit price must be at least $0.01' }));
      }
    }
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    setOrderForm({ ...orderForm, items: newItems });

    // Clear errors when valid input is provided
    if (field === 'product' && value.trim()) {
      setErrors(prev => ({ ...prev, [`item_${index}_product`]: '' }));
    } else if (field === 'quantity' && value >= 1) {
      setErrors(prev => ({ ...prev, [`item_${index}_quantity`]: '' }));
    } else if (field === 'unitPrice' && value >= 0.01) {
      setErrors(prev => ({ ...prev, [`item_${index}_unitPrice`]: '' }));
    }
  };

  const removeOrderItem = (index) => {
    if (orderForm.items.length <= 1) return; // Prevent removing all items
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: newItems });

    // Remove errors for the deleted item
    const newErrors = { ...errors };
    delete newErrors[`item_${index}_product`];
    delete newErrors[`item_${index}_quantity`];
    delete newErrors[`item_${index}_unitPrice`];
    setErrors(newErrors);
  };

  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return <span className="supplier-management-error-message">{error}</span>;
  };

  // Generate PDF Report
  const generateSuppliersPDF = () => {
    try {
      if (!suppliers || suppliers.length === 0) {
        alert('No suppliers to export');
        return;
      }

      const safe = (v, alt = '-') => (v === null || v === undefined || v === '' ? alt : v);
      const cap = (s) => safe(s, '-').replace(/_/g, ' ');

      const activeCount = suppliers.filter(s => s.status === 'active').length;
      const inactiveCount = suppliers.filter(s => s.status === 'inactive').length;
      const blacklistedCount = suppliers.filter(s => s.status === 'blacklisted').length;
      const highRatedCount = suppliers.filter(s => (s.rating || 0) >= 4).length;

      const categoryMap = new Map();
      suppliers.forEach(s => {
        const k = s.category || 'other';
        categoryMap.set(k, (categoryMap.get(k) || 0) + 1);
      });
      const categoryRows = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => [cap(name).substring(0, 24), String(count)]);

      const rows = suppliers.map((s, i) => {
        const city = safe(s?.address?.city);
        const state = safe(s?.address?.state);
        const country = safe(s?.address?.country);
        const location = [city, state].filter(Boolean).join(', ');
        return [
          String(i + 1).padStart(3, '0'),
          safe(s.name, 'Unknown').substring(0, 30),
          safe(s.email, '-').substring(0, 28),
          safe(s.phone, '-').substring(0, 18),
          cap(s.category).substring(0, 18),
          safe(s.status, '-').substring(0, 12),
          String(s.rating ?? 0),
          location.substring(0, 26),
          country.substring(0, 18)
        ];
      });

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 15;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('HealX Healthcare Center', pageWidth / 2, y, { align: 'center' });

      y += 6;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Suppliers Master List', pageWidth / 2, y, { align: 'center' });

      y += 5;
      doc.setFontSize(10);
      doc.text('Procurement and Supplier Management', pageWidth / 2, y, { align: 'center' });

      y += 6;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(15, y, pageWidth - 15, y);

      y += 8;
      doc.setFontSize(9);
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      }) + ' IST';
      const reportId = `SUP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Report Date: ${dateString} | Time: ${timeString} | Suppliers: ${suppliers.length} | Report ID: ${reportId}`,
        pageWidth / 2, y, { align: 'center' }
      );

      y += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 20, y);

      const bandY = y + 2;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(20, bandY, pageWidth - 40, 16);

      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const line1 = [
        `Active: ${activeCount}`,
        `Inactive: ${inactiveCount}`,
        `Blacklisted: ${blacklistedCount}`,
        `High Rated (4+): ${highRatedCount}`
      ];
      line1.forEach((txt, i) => {
        const x = 25 + i * 75;
        doc.setFont('helvetica', 'bold');
        doc.text(txt, x-2, y + 1);
      });

      y += 14;
      if (categoryRows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Category', 'Suppliers']],
          body: categoryRows,
          theme: 'plain',
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.4,
            cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          },
          bodyStyles: {
            fontSize: 7,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }
          },
          columnStyles: {
            0: { cellWidth: 70, halign: 'left' },
            1: { cellWidth: 24, halign: 'right' }
          },
          margin: { left: 20 },
          tableWidth: 94
        });
        y = (doc.lastAutoTable?.finalY || y) + 8;
      }

      autoTable(doc, {
        startY: y,
        head: [[
          'S/N',
          'Name',
          'Email',
          'Phone',
          'Category',
          'Status',
          'Rating',
          'City/State',
          'Country'
        ]],
        body: rows,
        theme: 'plain',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 }
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 7,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 }
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 48, halign: 'left' },
          2: { cellWidth: 58, halign: 'left' },
          3: { cellWidth: 26, halign: 'left' },
          4: { cellWidth: 28, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 16, halign: 'right' },
          7: { cellWidth: 38, halign: 'left' },
          8: { cellWidth: 24, halign: 'left' },
        },
        didParseCell: (data) => {
          const rowIndex = data.row.index;
          data.cell.styles.fillColor = rowIndex % 2 === 0 ? [248, 248, 248] : [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.lineColor = [0, 0, 0];
        },
        margin: { top: 10, left: 15, right: 15, bottom: 20 },
        styles: {
          overflow: 'linebreak',
          fontSize: 7,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 },
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.3
        },
        showHead: 'firstPage',
        showFoot: 'never'
      });

      const finalY = doc.lastAutoTable?.finalY || (y + 10);
      const spaceLeft = pageHeight - finalY;
      if (spaceLeft > 28) {
        const boxY = finalY + 6;
        const boxX = 15;
        const boxW = pageWidth - 30;
        const boxH = 18;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(boxX, boxY+3, boxW, boxH);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lineY = boxY + 12;
        doc.text('Prepared by: ______________________', boxX + 4, lineY);
        doc.text('Reviewed by: ______________________', boxX + 120, lineY);
        doc.text('Date: ____________', boxX + 4, lineY + 7);
        doc.text('Date: ____________', boxX + 120, lineY + 7);
      }

      const footerY = pageHeight - 10;
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `HealX Healthcare Center - Confidential | Page 1 of 1 | Generated: ${now.toLocaleDateString()}`,
        pageWidth / 2, footerY, { align: 'center' }
      );

      const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `HealX_Suppliers_List_${timestamp}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Suppliers PDF generation error:', err);
      alert(`Failed to generate PDF: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="supplier-management-loading-state">
        <div className="supplier-management-spinner"></div>
        <p>Loading supplier data from port 7000...</p>
      </div>
    );
  }

  return (
    <div className="supplier-management-procurement-page">
      {/* Header & Controls */}
      <div className="supplier-management-order-page-header">
        <div className="supplier-management-order-header-left">
          <div className="supplier-management-page-icon">📦</div>
          <div>
            <h1>Procurement & Suppliers</h1>
            <p>Manage purchase orders, supplier relationships & automated restocking</p>
            <small>Order tracking, supplier ratings, contract management & cost optimization</small>
          </div>
        </div>

        <div className="supplier-management-header-actions">
          <button onClick={handleManualRefresh} className="supplier-management-action-btn supplier-management-refresh">
            🔄 Refresh Now
          </button>
          <label className="supplier-management-auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-Refresh
          </label>
          <span className="supplier-management-last-updated">
            Last Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            className="supplier-management-action-btn supplier-management-primary"
            onClick={() => {
              setModalType('supplier');
              setShowModal(true);
              resetForms();
            }}
          >
            + Add Supplier
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="supplier-management-back-btn">
            ← Back to Dashboard
          </button>
          <button
            className="supplier-management-action-btn supplier-management-secondary"
            onClick={() => {
              setModalType('order');
              setShowModal(true);
              resetForms();
            }}
          >
            + New Order
          </button>
          <button
            className="supplier-management-action-btn supplier-management-tertiary"
            onClick={generateSuppliersPDF}
            title="Export Suppliers PDF"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Real-Time Supplier Costs Dashboard */}
      <div className="supplier-management-supplier-costs-section">
        <div className="supplier-management-section-header">
          <h2>💰 Real-Time Supplier Costs</h2>
          <div className="supplier-management-refresh-indicator">
            <span className="supplier-management-live-dot"></span>
            <span>Live Data</span>
          </div>
        </div>

        <div className="supplier-management-cost-metrics-grid">
          {/* Total Spending */}
          <div className="supplier-management-cost-metric-card supplier-management-total">
            <div className="supplier-management-metric-header">
              <h3>Total Supplier Spending</h3>
              <span className="supplier-management-trend-up">↗</span>
            </div>
            <div className="supplier-management-metric-value">
              ${supplierCosts.totalCosts.toLocaleString()}
            </div>
            <div className="supplier-management-metric-subtitle">
              All-time spending across {suppliers.length} suppliers
            </div>
          </div>

          {/* Monthly Spending */}
          <div className="supplier-management-cost-metric-card supplier-management-monthly">
            <div className="supplier-management-metric-header">
              <h3>This Month</h3>
              <span className="supplier-management-period">
                {new Date().toLocaleString('default', { month: 'long' })}
              </span>
            </div>
            <div className="supplier-management-metric-value">
              ${supplierCosts.monthlyCosts.toLocaleString()}
            </div>
            <div className="supplier-management-metric-subtitle">
              {supplierCosts.monthlyCosts > 0 
                ? `${((supplierCosts.monthlyCosts / supplierCosts.totalCosts) * 100).toFixed(1)}% of total spending`
                : 'No orders this month'
              }
            </div>
          </div>

          {/* Average Order Value */}
          <div className="supplier-management-cost-metric-card supplier-management-average">
            <div className="supplier-management-metric-header">
              <h3>Average Order Value</h3>
              <span className="supplier-management-calculation">📊</span>
            </div>
            <div className="supplier-management-metric-value">
              ${purchaseOrders.length > 0 
                ? (supplierCosts.totalCosts / purchaseOrders.length).toFixed(0) 
                : '0'
              }
            </div>
            <div className="supplier-management-metric-subtitle">
              Based on {purchaseOrders.length} orders
            </div>
          </div>
        </div>

        {/* Top Suppliers by Spending */}
        <div className="supplier-management-top-suppliers-spending">
          <h3>🏆 Top Suppliers by Spending</h3>
          <div className="supplier-management-suppliers-spending-list">
            {supplierCosts.topSuppliers.map((supplier, index) => (
              <div key={supplier.name} className="supplier-management-supplier-spending-item">
                <div className="supplier-management-supplier-rank">#{index + 1}</div>
                <div className="supplier-management-supplier-info">
                  <span className="supplier-management-supplier-name">{supplier.name}</span>
                  <span className="supplier-management-spending-amount">${supplier.amount.toLocaleString()}</span>
                </div>
                <div className="supplier-management-spending-bar">
                  <div 
                    className="supplier-management-spending-fill" 
                    style={{ 
                      width: `${(supplier.amount / supplierCosts.topSuppliers[0]?.amount * 100) || 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Feed */}
        <div className="supplier-management-recent-orders-feed">
          <h3>🔄 Recent Orders & Costs</h3>
          <div className="supplier-management-orders-feed-container">
            {supplierCosts.recentOrders.slice(0, 5).map((order) => (
              <div key={order._id} className="supplier-management-recent-order-item">
                <div className="supplier-management-order-info">
                  <span className="supplier-management-order-number">#{order.orderNumber}</span>
                  <span className="supplier-management-supplier-name">{order.supplier?.name || 'Unknown'}</span>
                </div>
                <div className="supplier-management-order-details">
                  <span className="supplier-management-order-amount">${(order.totalAmount || 0).toLocaleString()}</span>
                  <span className="supplier-management-order-date">
                    {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="supplier-management-order-status">
                  <span className={`supplier-management-status-badge supplier-management-${order.status}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="supplier-management-tab-navigation">
        <button
          className={`supplier-management-tab-btn ${activeTab === 'suppliers' ? 'supplier-management-active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          Suppliers ({suppliers.length})
        </button>
        <button
          className={`supplier-management-tab-btn ${activeTab === 'orders' ? 'supplier-management-active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          className={`supplier-management-tab-btn ${activeTab === 'analytics' ? 'supplier-management-active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Content Area */}
      <div className="supplier-management-content-area">
        {activeTab === 'suppliers' && (
          <div className="supplier-management-suppliers-section">
            <div className="supplier-management-section-stats">
              <div className="supplier-management-stat-card">
                <h3>{suppliers.filter(s => s.status === 'active').length}</h3>
                <p>Active Suppliers</p>
              </div>
              <div className="supplier-management-stat-card">
                <h3>{suppliers.filter(s => s.rating >= 4).length}</h3>
                <p>High Rated (4+ ⭐)</p>
              </div>
              <div className="supplier-management-stat-card">
                <h3>{suppliers.filter(s => s.category === 'medical_equipment').length}</h3>
                <p>Equipment Suppliers</p>
              </div>
            </div>

            <div className="supplier-management-suppliers-grid">
              {suppliers.length === 0 ? (
                <div className="supplier-management-empty-state">
                  <p>No suppliers found. Add your first supplier to get started!</p>
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <div key={supplier._id} className="supplier-management-supplier-card">
                    <div className="supplier-management-card-header">
                      <h3>{supplier.name}</h3>
                      <span className={`supplier-management-status-badge supplier-management-${supplier.status}`}>
                        {supplier.status}
                      </span>
                    </div>
                    <div className="supplier-management-card-content">
                      <p><strong>Email:</strong> {supplier.email}</p>
                      <p><strong>Phone:</strong> {supplier.phone}</p>
                      <p><strong>Category:</strong>{' '}
                        <span className="supplier-management-category-tag">{supplier.category?.replace('_', ' ')}</span>
                      </p>
                      <p><strong>Rating:</strong>
                        <span className="supplier-management-rating-stars">
                          {'⭐'.repeat(supplier.rating || 3)}
                          <span className="supplier-management-rating-text">({supplier.rating || 3}/5)</span>
                        </span>
                      </p>
                      {supplier.address?.city && (
                        <p><strong>Location:</strong> {supplier.address.city}, {supplier.address.state}</p>
                      )}
                    </div>

                    <div className="supplier-management-card-actions">
                      <button
                        className="supplier-management-btn-edit"
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
                        className="supplier-management-btn-delete"
                        onClick={() => handleDelete('supplier', supplier._id)}
                      >
                        Delete
                      </button>
                      <button
                        className="supplier-management-btn-order"
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
          <div className="supplier-management-orders-section">
            <div className="supplier-management-section-stats">
              <div className="supplier-management-stat-card">
                <h3>{purchaseOrders.filter(o => o.status === 'pending').length}</h3>
                <p>Pending Orders</p>
              </div>
              <div className="supplier-management-stat-card">
                <h3>{purchaseOrders.filter(o => o.status === 'received').length}</h3>
                <p>Completed Orders</p>
              </div>
              <div className="supplier-management-stat-card">
                <h3>${purchaseOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}</h3>
                <p>Total Value</p>
              </div>
            </div>

            <div className="supplier-management-orders-table">
              {purchaseOrders.length === 0 ? (
                <div className="supplier-management-empty-state">
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
                        <td><strong>{order.orderNumber}</strong></td>
                        <td>{order.supplier?.name || 'Unknown Supplier'}</td>
                        <td><span className="supplier-management-items-count">{order.items?.length || 0} items</span></td>
                        <td><strong>${(order.totalAmount || 0).toLocaleString()}</strong></td>
                        <td><span className={`supplier-management-status-badge supplier-management-${order.status}`}>{order.status}</span></td>
                        <td><span className="supplier-management-rating-display">{'⭐'.repeat(order.rating || 3)} ({order.rating || 3}/5)</span></td>
                        <td>{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="supplier-management-table-actions">
                            <button
                              className="supplier-management-btn-view"
                              onClick={() => {
                                alert(`Order Details:\n\nOrder: ${order.orderNumber}\nSupplier: ${order.supplier?.name}\nRating: ${order.rating}/5 ⭐\nStatus: ${order.status}\nTotal: $${order.totalAmount}\nItems: ${order.items?.length}`);
                              }}
                            >
                              View
                            </button>
                            <button
                              className="supplier-management-btn-delete"
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
          <div className="supplier-management-analytics-section">
            <div className="supplier-management-analytics-cards">
              <div className="supplier-management-analytics-card">
                <h3>Top Suppliers</h3>
                <div className="supplier-management-supplier-ranking">
                  {suppliers
                    .filter(s => s.rating >= 4)
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier._id} className="supplier-management-rank-item">
                        <span className="supplier-management-rank">#{index + 1}</span>
                        <span className="supplier-management-name">{supplier.name}</span>
                        <span className="supplier-management-rating">{'⭐'.repeat(supplier.rating || 3)}</span>
                      </div>
                    ))
                  }
                  {suppliers.filter(s => s.rating >= 4).length === 0 && (
                    <p>No high-rated suppliers yet.</p>
                  )}
                </div>
              </div>

              <div className="supplier-management-analytics-card">
                <h3>Category Distribution</h3>
                <div className="supplier-management-category-stats">
                  {['medical_equipment', 'pharmaceuticals', 'consumables', 'services'].map(category => {
                    const count = suppliers.filter(s => s.category === category).length;
                    const percentage = suppliers.length > 0 ? ((count / suppliers.length) * 100).toFixed(1) : 0;
                    return (
                      <div key={category} className="supplier-management-category-stat">
                        <span className="supplier-management-category-name">{category.replace('_', ' ')}</span>
                        <div className="supplier-management-progress-bar">
                          <div className="supplier-management-progress-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="supplier-management-percentage">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="supplier-management-analytics-card">
                <h3>Order Status Overview</h3>
                <div className="supplier-management-status-overview">
                  {['pending', 'approved', 'ordered', 'received', 'cancelled'].map(status => {
                    const count = purchaseOrders.filter(o => o.status === status).length;
                    return (
                      <div key={status} className="supplier-management-status-item">
                        <span className={`supplier-management-status-indicator supplier-management-${status}`}></span>
                        <span className="supplier-management-status-name">{status}</span>
                        <span className="supplier-management-status-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="supplier-management-modal-overlay">
          <div className="supplier-management-modal">
            <div className="supplier-management-modal-header">
              <h2>
                {modalType === 'supplier' 
                  ? (editingItem ? 'Edit Supplier' : 'Add New Supplier')
                  : 'Create Purchase Order'
                }
              </h2>
              <button
                className="supplier-management-close-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForms();
                }}
              >
                ×
              </button>
            </div>

            {errors.submit && (
              <div className="supplier-management-alert supplier-management-alert-error">
                {errors.submit}
              </div>
            )}

            {modalType === 'supplier' ? (
              <form onSubmit={handleSupplierSubmit} className="supplier-management-modal-form">
                <div className="supplier-management-form-grid">
                  <div className="supplier-management-form-group">
                    <label>Supplier Name *</label>
                    <input
                      type="text"
                      value={supplierForm.name}
                      onChange={(e) => handleNameInput(e.target.value, 'name')}
                      className={errors.name ? 'supplier-management-error' : ''}
                      maxLength="100"
                      required
                      pattern="[a-zA-Z\s\.\-]{2,100}"
                      title="Only letters, spaces, periods, and hyphens allowed (2-100 characters)"
                    />
                    <ErrorMessage error={errors.name} />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => handleEmailInput(e.target.value)}
                      className={errors.email ? 'supplier-management-error' : ''}
                      maxLength="100"
                      required
                      pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                      title="Please enter a valid email address"
                    />
                    <ErrorMessage error={errors.email} />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={supplierForm.phone}
                      onChange={(e) => handlePhoneInput(e.target.value)}
                      className={errors.phone ? 'supplier-management-error' : ''}
                      placeholder="+1234567890"
                      maxLength="20"
                      required
                      pattern="[\+]?[0-9\s\-\(\)]{7,20}"
                      title="Please enter a valid phone number (7-20 digits, may include +, spaces, hyphens, and parentheses)"
                    />
                    <ErrorMessage error={errors.phone} />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Category *</label>
                    <select
                      value={supplierForm.category}
                      onChange={(e) => {
                        setSupplierForm({...supplierForm, category: e.target.value});
                        if (e.target.value) setErrors(prev => ({ ...prev, category: '' }));
                      }}
                      className={errors.category ? 'supplier-management-error' : ''}
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

                  <div className="supplier-management-form-group">
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

                  <div className="supplier-management-form-group supplier-management-full-width">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={supplierForm.address.street}
                      onChange={(e) => {
                        // Allow alphanumeric, spaces, and common address characters
                        const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s\.\,\#\-\']/g, '').slice(0, 200);
                        setSupplierForm({
                          ...supplierForm, 
                          address: {...supplierForm.address, street: sanitized}
                        });
                      }}
                      maxLength="200"
                      pattern="[a-zA-Z0-9\s\.\,\#\-\']{1,200}"
                      title="Only letters, numbers, spaces, and common address characters allowed"
                    />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={supplierForm.address.city}
                      onChange={(e) => handleNameInput(e.target.value, 'address.city')}
                      className={errors['address.city'] ? 'supplier-management-error' : ''}
                      maxLength="50"
                      pattern="[a-zA-Z\s\.\-]{2,50}"
                      title="Only letters, spaces, periods, and hyphens allowed (2-50 characters)"
                    />
                    <ErrorMessage error={errors['address.city']} />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={supplierForm.address.state}
                      onChange={(e) => handleNameInput(e.target.value, 'address.state')}
                      className={errors['address.state'] ? 'supplier-management-error' : ''}
                      maxLength="50"
                      pattern="[a-zA-Z\s\.\-]{2,50}"
                      title="Only letters, spaces, periods, and hyphens allowed (2-50 characters)"
                    />
                    <ErrorMessage error={errors['address.state']} />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={supplierForm.address.zipCode}
                      onChange={(e) => handleZipCodeInput(e.target.value)}
                      className={errors['address.zipCode'] ? 'supplier-management-error' : ''}
                      placeholder="12345"
                      maxLength="10"
                      pattern="[0-9A-Za-z\s\-]{3,10}"
                      title="Only alphanumeric characters, spaces, and hyphens allowed (3-10 characters)"
                    />
                    <ErrorMessage error={errors['address.zipCode']} />
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={supplierForm.address.country}
                      onChange={(e) => handleNameInput(e.target.value, 'address.country')}
                      className={errors['address.country'] ? 'supplier-management-error' : ''}
                      maxLength="50"
                      pattern="[a-zA-Z\s\.\-]{2,50}"
                      title="Only letters, spaces, periods, and hyphens allowed (2-50 characters)"
                    />
                    <ErrorMessage error={errors['address.country']} />
                  </div>
                </div>

                <div className="supplier-management-form-actions">
                  <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingItem ? 'Update Supplier' : 'Add Supplier')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOrderSubmit} className="supplier-management-modal-form">
                <div className="supplier-management-form-grid-order">
                  <div className="supplier-management-form-group">
                    <label>Supplier *</label>
                    <select
                      value={orderForm.supplier}
                      onChange={(e) => {
                        setOrderForm({...orderForm, supplier: e.target.value});
                        if (e.target.value) setErrors(prev => ({ ...prev, supplier: '' }));
                      }}
                      className={errors.supplier ? 'supplier-management-error' : ''}
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

                  <div className="supplier-management-form-group">
                    <label>Order Status *</label>
                    <select
                      value={orderForm.status}
                      onChange={(e) => handleStatusInput(e.target.value)}
                      className={errors.status ? 'supplier-management-error' : ''}
                      required
                    >
                      <option value="pending">📋 Pending</option>
                      <option value="approved">✅ Approved</option>
                      <option value="ordered">🛒 Ordered</option>
                      <option value="received">📦 Received</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                    <ErrorMessage error={errors.status} />
                    <small className="supplier-management-field-help">Select the current status of this order</small>
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Supplier Rating *</label>
                    <div className="supplier-management-rating-input-container">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={orderForm.rating}
                        onChange={(e) => handleRatingInput(e.target.value)}
                        className={errors.rating ? 'supplier-management-error' : ''}
                        required
                        pattern="[1-5]"
                        title="Rating must be between 1 and 5"
                      />
                      <div className="supplier-management-rating-stars-preview">
                        {'⭐'.repeat(orderForm.rating)} ({orderForm.rating}/5)
                      </div>
                    </div>
                    <ErrorMessage error={errors.rating} />
                    <small className="supplier-management-field-help">Rate this supplier from 1 to 5 stars</small>
                  </div>

                  <div className="supplier-management-form-group">
                    <label>Expected Delivery Date</label>
                    <input
                      type="date"
                      value={orderForm.expectedDelivery}
                      onChange={(e) => {
                        setOrderForm({...orderForm, expectedDelivery: e.target.value});
                        if (isValidDate(e.target.value)) setErrors(prev => ({ ...prev, expectedDelivery: '' }));
                      }}
                      className={errors.expectedDelivery ? 'supplier-management-error' : ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <ErrorMessage error={errors.expectedDelivery} />
                  </div>
                </div>

                <div className="supplier-management-form-section">
                  <div className="supplier-management-section-header">
                    <h3>Order Items *</h3>
                    <button 
                      type="button" 
                      onClick={addOrderItem} 
                      className="supplier-management-add-item-btn"
                      disabled={!areAllOrderItemsValid()}
                      title={areAllOrderItemsValid() ? "Add another item" : "Please complete current item before adding a new one"}
                    >
                      + Add Item
                    </button>
                  </div>

                  <ErrorMessage error={errors.items} />

                  {orderForm.items.map((item, index) => (
                    <div key={index} className="supplier-management-order-item">
                      <div className="supplier-management-item-fields">
                        <div className="supplier-management-field-container">
                          <input
                            type="text"
                            placeholder="Product name *"
                            value={item.product}
                            onChange={(e) => handleProductInput(e.target.value, index)}
                            className={errors[`item_${index}_product`] ? 'supplier-management-error' : ''}
                            maxLength="15"
                            required
                            pattern="[a-zA-Z\s]{1,15}"
                            title="Only letters and spaces allowed (maximum 15 characters)"
                          />
                          <ErrorMessage error={errors[`item_${index}_product`]} />
                        </div>

                        <div className="supplier-management-field-container">
                          <input
                            type="number"
                            placeholder="Quantity *"
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(e.target.value, index)}
                            className={errors[`item_${index}_quantity`] ? 'supplier-management-error' : ''}
                            min="1"
                            max="999999"
                            required
                            pattern="[0-9]+"
                            title="Quantity must be a positive integer"
                          />
                          <ErrorMessage error={errors[`item_${index}_quantity`]} />
                        </div>

                        <div className="supplier-management-field-container">
                          <input
                            type="number"
                            placeholder="Unit Price ($) *"
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceInput(e.target.value, index)}
                            className={errors[`item_${index}_unitPrice`] ? 'supplier-management-error' : ''}
                            min="0.01"
                            max="999999"
                            step="0.01"
                            required
                            pattern="[0-9]+(\.[0-9]{1,2})?"
                            title="Unit price must be a positive number with up to 2 decimal places"
                          />
                          <ErrorMessage error={errors[`item_${index}_unitPrice`]} />
                        </div>

                        <span className="supplier-management-item-total">
                          ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </span>

                        {orderForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            className="supplier-management-remove-item-btn"
                            title="Remove this item"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="supplier-management-order-total">
                    <strong>
                      Total: ${orderForm.items.reduce((sum, item) =>
                        sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="supplier-management-form-group supplier-management-full-width">
                  <label>Notes</label>
                  <textarea
                    value={orderForm.notes}
                    onChange={(e) => {
                      // Allow most characters but limit length
                      const value = e.target.value.slice(0, 500);
                      setOrderForm({...orderForm, notes: value});
                      if (value.length <= 500) setErrors(prev => ({ ...prev, notes: '' }));
                    }}
                    className={errors.notes ? 'supplier-management-error' : ''}
                    placeholder="Additional notes or special instructions"
                    rows="3"
                    maxLength="500"
                  />
                  <ErrorMessage error={errors.notes} />
                  <small className="supplier-management-char-counter">{orderForm.notes.length}/500 characters</small>
                </div>

                <div className="supplier-management-form-actions">
                  <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting || !areAllOrderItemsValid()}>
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