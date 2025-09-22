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

// PDF generation imports
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Separate preserved value tracking
  const [globalPreservedValue, setGlobalPreservedValue] = useState(0);
  const [preservedValueHistory, setPreservedValueHistory] = useState([]);
  
  // Enhanced stats with true preserved inventory value
  const [inventoryStats, setInventoryStats] = useState({
    currentValue: 0,
    originalValue: 0,
    preservedValue: 0,      // This will NEVER decrease
    totalInvestment: 0,
    usedValue: 0,
    deletedValue: 0         // Track value of deleted items
  });
  
  // Supplier spending state
  const [supplierSpending, setSupplierSpending] = useState({
    totalSpending: 0,
    monthlySpending: 0,
    topSuppliers: [],
    totalOrders: 0
  });
  
  const [notifications, setNotifications] = useState({
    loading: false,
    message: '',
    type: ''
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
    'Oxigen Delivery Equipment',
    'Other'
  ];

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotifications({ loading: false, message, type });
    setTimeout(() => {
      setNotifications({ loading: false, message: '', type: '' });
    }, duration);
  };

  // Load preserved value from localStorage
  const loadPreservedValue = () => {
    try {
      const stored = localStorage.getItem('healx_preserved_inventory_value');
      if (stored) {
        const data = JSON.parse(stored);
        setGlobalPreservedValue(data.value || 0);
        setPreservedValueHistory(data.history || []);
        return data.value || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error loading preserved value:', error);
      return 0;
    }
  };

  // Save preserved value to localStorage
  const savePreservedValue = (value, action = 'update') => {
    try {
      const data = {
        value: value,
        history: [
          ...preservedValueHistory,
          {
            action,
            value,
            timestamp: new Date().toISOString(),
            admin: admin?.name || 'System'
          }
        ].slice(-100) // Keep last 100 entries
      };
      
      localStorage.setItem('healx_preserved_inventory_value', JSON.stringify(data));
      setGlobalPreservedValue(value);
      setPreservedValueHistory(data.history);
    } catch (error) {
      console.error('Error saving preserved value:', error);
    }
  };

  // Initialize preserved value only if higher than current
  const initializePreservedValue = (currentValue) => {
    const storedValue = loadPreservedValue();
    if (currentValue > storedValue) {
      savePreservedValue(currentValue, 'initialize');
      return currentValue;
    }
    return storedValue;
  };

  // Fetch supplier spending data
  const fetchSupplierSpending = async () => {
    try {
      const [suppliersRes, ordersRes] = await Promise.all([
        fetch('http://localhost:7000/api/suppliers'),
        fetch('http://localhost:7000/api/purchase-orders')
      ]);

      if (suppliersRes.ok && ordersRes.ok) {
        const suppliersData = await suppliersRes.json();
        const ordersData = await ordersRes.json();

        const suppliers = suppliersData.suppliers || [];
        const orders = ordersData.orders || [];

        const totalSpending = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlySpending = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate || order.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          })
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const supplierSpendingMap = {};
        orders.forEach(order => {
          const supplierId = order.supplier?._id || order.supplier;
          const supplier = suppliers.find(s => s._id === supplierId);
          if (supplier) {
            const name = supplier.name;
            supplierSpendingMap[name] = (supplierSpendingMap[name] || 0) + (order.totalAmount || 0);
          }
        });

        const topSuppliers = Object.entries(supplierSpendingMap)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, amount]) => ({ name, amount }));

        setSupplierSpending({
          totalSpending,
          monthlySpending,
          topSuppliers,
          totalOrders: orders.length
        });
      }
    } catch (error) {
      console.error('Error fetching supplier spending:', error);
    }
  };

  // Auto-restock state management with user-controlled quantities
  const [autoRestockConfig, setAutoRestockConfig] = useState({});
  const [showAutoRestockModal, setShowAutoRestockModal] = useState(false);
  const [selectedItemForAutoRestock, setSelectedItemForAutoRestock] = useState(null);

  // Auto-restock check that respects user's manual quantities
  const handleAutoRestockCheck = async () => {
    try {
      setNotifications({ loading: true, message: 'Checking items for auto-restock using your manual quantities...', type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/auto-restock/check-and-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Send flag to respect user's manual quantities
        body: JSON.stringify({ 
          respectManualQuantities: true,
          preserveValue: true 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        showNotification(`✅ Auto-restock completed! Processed ${data.data.itemsProcessed} items using your specified quantity settings.`, 'success');
        loadItems();
      } else {
        throw new Error(data.message || 'Failed to perform auto-restock check');
      }
    } catch (error) {
      console.error('Auto-restock error:', error);
      showNotification(`❌ Auto-restock failed: ${error.message}`, 'error');
    }
  };

  // Auto-restock configuration that uses YOUR provided quantity
  const handleConfigureAutoRestock = (item) => {
    setSelectedItemForAutoRestock(item);
    
    // Use existing configuration or smart defaults - YOU control the quantity
    const existingConfig = item.autoRestock || {};
    
    setAutoRestockConfig({
      enabled: existingConfig.enabled || false,
      // If user has set maxStockLevel, use it, otherwise calculate default
      maxStockLevel: existingConfig.maxStockLevel || (item.minStockLevel * 3),
      // Use existing reorderQuantity if available, otherwise start with minStockLevel * 2 as suggestion
      reorderQuantity: existingConfig.reorderQuantity || (item.minStockLevel * 2),
      // Default to using the user's manual reorderQuantity
      restockMethod: existingConfig.restockMethod || 'fixed_quantity',
      supplier: existingConfig.supplier || {
        name: item.supplier?.name || '',
        contactEmail: existingConfig.supplier?.contactEmail || '',
        leadTimeDays: existingConfig.supplier?.leadTimeDays || 3
      }
    });
    setShowAutoRestockModal(true);
  };

  const saveAutoRestockConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auto-restock/configure/${selectedItemForAutoRestock._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoRestockConfig)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const method = autoRestockConfig.restockMethod === 'fixed_quantity' ? 'Your Manual Quantity' : 'Auto Calculate';
        showNotification(`✅ Auto-restock configured for ${selectedItemForAutoRestock.name}! Method: ${method} (${autoRestockConfig.reorderQuantity} units - your choice)`, 'success');
        setShowAutoRestockModal(false);
        loadItems();
      } else {
        throw new Error(data.message || 'Failed to configure auto-restock');
      }
    } catch (error) {
      console.error('Configure auto-restock error:', error);
      showNotification(`❌ Failed to configure auto-restock: ${error.message}`, 'error');
    }
  };

  // Calculate stats with true preserved value
  const calculateInventoryStats = (itemsArray) => {
    if (!Array.isArray(itemsArray)) {
      return { 
        totalItems: 0, 
        totalQuantity: 0, 
        lowStockItems: 0, 
        currentValue: 0,
        originalValue: 0,
        preservedValue: globalPreservedValue, // Use stored preserved value
        totalInvestment: 0,
        usedValue: 0,
        deletedValue: 0
      };
    }

    const totalItems = itemsArray.length;
    const totalQuantity = itemsArray.reduce((sum, item) => {
      const quantity = parseInt(item.quantity) || 0;
      return sum + quantity;
    }, 0);
    
    const lowStockItems = itemsArray.reduce((count, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      return count + (quantity <= minStock ? 1 : 0);
    }, 0);
    
    // Current value (based on current stock)
    const currentValue = itemsArray.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    // Original value calculation
    const originalValue = itemsArray.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const originalQuantity = parseInt(item.originalQuantity) || parseInt(item.quantity) || 0;
      return sum + (price * originalQuantity);
    }, 0);

    // Total investment
    const totalInvestment = itemsArray.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const totalPurchased = parseInt(item.totalPurchased) || parseInt(item.originalQuantity) || parseInt(item.quantity) || 0;
      return sum + (price * totalPurchased);
    }, 0);

    // Used value
    const usedValue = itemsArray.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const originalQuantity = parseInt(item.originalQuantity) || parseInt(item.quantity) || 0;
      const currentQuantity = parseInt(item.quantity) || 0;
      const usedQuantity = Math.max(0, originalQuantity - currentQuantity);
      return sum + (price * usedQuantity);
    }, 0);

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      currentValue,
      originalValue,
      preservedValue: globalPreservedValue, // Always use stored value
      totalInvestment: Math.max(totalInvestment, originalValue),
      usedValue,
      deletedValue: Math.max(0, globalPreservedValue - currentValue - usedValue) // Calculate deleted value
    };
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

// Replace the existing exportToPDF function with this new implementation
const generateSurgicalItemsPDF = () => {
  try {
    if (items.length === 0) {
      setError('No surgical items data to export');
      return;
    }

    // Calculate current totals
    const totalItems = items.length;
    const totalCurrentValue = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);
    const totalPreservedValue = globalPreservedValue;
    const lowStockCount = items.filter(item => (parseInt(item.quantity) || 0) <= (parseInt(item.minStockLevel) || 0)).length;
    const outOfStockCount = items.filter(item => (parseInt(item.quantity) || 0) === 0).length;

    // Create PDF document
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
    doc.text('Surgical Items Inventory Report', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(10);
    doc.text('Inventory Management System', pageWidth / 2, y, { align: 'center' });

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
    const reportId = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Report Date: ${dateString} | Time: ${timeString} | Items: ${totalItems} | Report ID: ${reportId}`,
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
      `Total Items: ${totalItems}`,
      `Current Value: $${totalCurrentValue.toLocaleString()}`,
      `Protected Value: $${totalPreservedValue.toLocaleString()}`,
      `Low Stock: ${lowStockCount}`
    ];
    line1.forEach((txt, i) => {
      const x = 25 + i * 75;
      doc.setFont('helvetica', 'bold');
      doc.text(txt, x, y + 1);
    });

    y += 14;
    
    // Category distribution
    const categoryMap = new Map();
    items.forEach(item => {
      const category = item.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const categoryRows = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => [name.substring(0, 24), String(count)]);

    if (categoryRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Items']],
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

    // Prepare data for the main table
    const tableData = items.map((item, index) => {
      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      const price = parseFloat(item.price) || 0;
      const currentValue = price * quantity;
      
      let statusText = 'Available';
      if (quantity === 0) statusText = 'Out of Stock';
      else if (quantity <= minStock) statusText = 'Low Stock';
      
      return [
        String(index + 1).padStart(3, '0'),
        item.name || 'Unknown Item',
        item.category || 'Other',
        String(quantity),
        String(minStock),
        `$${price.toFixed(2)}`,
        `$${currentValue.toFixed(2)}`,
        statusText,
        item.supplier?.name || 'N/A'
      ];
    });

    // Create the main table
    autoTable(doc, {
      startY: y,
      head: [[
        'S/N',
        'Item Name',
        'Category',
        'Quantity',
        'Min Stock',
        'Unit Price',
        'Current Value',
        'Status',
        'Supplier'
      ]],
      body: tableData,
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
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 22, halign: 'center' },
        8: { cellWidth: 30, halign: 'left' },
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
      doc.rect(boxX, boxY, boxW, boxH);


      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lineY = boxY + 6;
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

    // Add value protection note
    doc.setFontSize(8);
    doc.setTextColor(40, 167, 69);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `🛡 Protected Value: $${totalPreservedValue.toLocaleString()} - Value Protection System Active`,
      pageWidth / 2, footerY - 5, { align: 'center' }
    );

    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `HealX_SurgicalItems_Inventory_${timestamp}.pdf`;
    doc.save(filename);
    
    showNotification('✅ Surgical items inventory report generated successfully!', 'success');
  } catch (err) {
    console.error('Surgical Items PDF generation error:', err);
    showNotification(`❌ Failed to generate PDF: ${err.message}`, 'error');
  }
};



  const handleTestEmail = async () => {
    try {
      setNotifications({ loading: true, message: 'Sending test email...', type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/notifications/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

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

  const handleSendLowStockAlert = async () => {
    try {
      if (!items || items.length === 0) {
        showNotification('ℹ️ No items available to check for low stock', 'info');
        return;
      }

      setNotifications({ loading: true, message: 'Checking low stock items and sending alerts...', type: 'info' });
      
      const lowStockItems = items
        .filter(item => {
          const quantity = parseInt(item.quantity) || 0;
          const minStock = parseInt(item.minStockLevel) || 0;
          return quantity <= minStock;
        })
        .map(item => ({
          itemId: item._id,
          itemName: item.name || 'Unknown Item',
          quantity: parseInt(item.quantity) || 0,
          minStockLevel: parseInt(item.minStockLevel) || 0,
          isOutOfStock: parseInt(item.quantity) === 0,
          categories: item.category || 'Other',
          supplier: item.supplier?.name || 'N/A'
        }));

      if (lowStockItems.length === 0) {
        showNotification('✅ All items are well-stocked! No low stock alerts needed.', 'success');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/check-low-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lowStockItems: lowStockItems
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const count = data.data?.count || lowStockItems.length || 0;
        showNotification(`✅ Low stock alert sent successfully! Found ${count} items needing attention.`, 'success');
      } else {
        throw new Error(data.message || 'Failed to send low stock alert');
      }
    } catch (error) {
      console.error('Low stock alert error:', error);
      showNotification(`❌ Failed to send low stock alert: ${error.message}`, 'error');
    }
  };

  const handleSendItemNotification = async (item) => {
    try {
      if (!item || !item._id) {
        showNotification('❌ Invalid item selected for notification', 'error');
        return;
      }

      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      const isLowStock = quantity <= minStock;
      const isOutOfStock = quantity === 0;
      
      if (!isLowStock && !isOutOfStock) {
        showNotification(`ℹ️ ${item.name} is currently well-stocked (${quantity} units available)`, 'info');
        return;
      }

      setNotifications({ loading: true, message: `Sending notification for ${item.name}...`, type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/notifications/send-item-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: item._id,
          itemName: item.name || 'Unknown Item',
          currentQuantity: quantity,
          minStockLevel: minStock,
          isOutOfStock: isOutOfStock,
          category: item.category || 'Other',
          supplier: item.supplier?.name || 'N/A'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const status = isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK';
        showNotification(`✅ ${status} alert sent for ${item.name}!`, 'success');
      } else {
        throw new Error(data.message || 'Failed to send item notification');
      }
    } catch (error) {
      console.error('Item notification error:', error);
      showNotification(`❌ Failed to send notification for ${item.name}: ${error.message}`, 'error');
    }
  };

  // Updated calculateStats to use preserved value
  const calculateStats = (itemsArray) => {
    const inventoryData = calculateInventoryStats(itemsArray);
    return {
      totalItems: inventoryData.totalItems,
      totalQuantity: inventoryData.totalQuantity,
      lowStockItems: inventoryData.lowStockItems,
      totalValue: inventoryData.preservedValue, // Always use preserved value
      currentValue: inventoryData.currentValue,
      originalValue: inventoryData.originalValue,
      preservedValue: inventoryData.preservedValue,
      totalInvestment: inventoryData.totalInvestment,
      usedValue: inventoryData.usedValue,
      deletedValue: inventoryData.deletedValue
    };
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (items && items.length >= 0) {
      const calculatedStats = calculateStats(items);
      setStats(calculatedStats);
      
      // Only update preserved value if current value is higher
      const currentValue = calculatedStats.currentValue || 0;
      if (currentValue > globalPreservedValue) {
        savePreservedValue(currentValue, 'auto-increase');
      }
      
      const inventoryData = calculateInventoryStats(items);
      setInventoryStats(inventoryData);
    }
  }, [items, globalPreservedValue]);

  const initializeComponent = async () => {
    try {
      setLoading(true);
      
      // Load preserved value first
      loadPreservedValue();
      
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        try {
          const parsedAdmin = JSON.parse(adminData);
          if (parsedAdmin && parsedAdmin.role === 'admin') {
            setAdmin(parsedAdmin);
          } else {
            navigate('/admin/login');
            return;
          }
        } catch (parseError) {
          console.error('Error parsing admin data:', parseError);
          navigate('/admin/login');
          return;
        }
      } else {
        navigate('/admin/login');
        return;
      }

      await Promise.all([
        loadItems(),
        fetchSupplierSpending()
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize component');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/surgical-items?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data?.items)) {
        const enhancedItems = data.data.items.map(item => ({
          ...item,
          originalQuantity: item.originalQuantity || item.quantity || 0,
          preservedQuantity: item.preservedQuantity || item.originalQuantity || item.quantity || 0,
          totalPurchased: item.totalPurchased || item.originalQuantity || item.quantity || 0
        }));
        
        setItems(enhancedItems);
        
        // Initialize preserved value only if current value is higher
        const currentValue = enhancedItems.reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.quantity) || 0;
          return sum + (price * quantity);
        }, 0);
        
        if (currentValue > globalPreservedValue) {
          initializePreservedValue(currentValue);
        }
        
      } else {
        throw new Error(data.message || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Failed to load surgical items');
      setItems([]);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleDisposeItem = () => {
    if (items.length === 0) {
      showNotification('ℹ️ No items available to dispose', 'info');
      return;
    }
    setShowDisposeModal(true);
  };

  const handleEditItem = (item) => {
    if (!item || !item._id) {
      showNotification('❌ Invalid item selected for editing', 'error');
      return;
    }
    setSelectedItem(item);
    setShowEditModal(true);
  };

  // Delete item without affecting preserved value
  const handleDeleteItem = async (itemId) => {
    if (!itemId) {
      showNotification('❌ Invalid item selected for deletion', 'error');
      return;
    }

    const itemToDelete = items.find(item => item._id === itemId);
    if (!itemToDelete) {
      showNotification('❌ Item not found', 'error');
      return;
    }

    const itemValue = (parseFloat(itemToDelete.price) || 0) * (parseInt(itemToDelete.quantity) || 0);

    if (window.confirm(`Are you sure you want to delete "${itemToDelete.name}"? 

⚠️ IMPORTANT: 
- Item will be removed from inventory
- Preserved value will remain protected: $${globalPreservedValue.toLocaleString()}
- Item value: $${itemValue.toFixed(2)}

This action cannot be undone.`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          // Preserved value is NOT changed when deleting
          showNotification(`✅ Item "${itemToDelete.name}" deleted successfully! Preserved value protected: $${globalPreservedValue.toLocaleString()}`, 'success');
          loadItems();
          
          // Log the deletion in preserved value history
          const updatedHistory = [
            ...preservedValueHistory,
            {
              action: 'item-deleted',
              value: globalPreservedValue, // Same value
              itemName: itemToDelete.name,
              itemValue: itemValue,
              timestamp: new Date().toISOString(),
              admin: admin?.name || 'System',
              note: `Item deleted but preserved value maintained`
            }
          ].slice(-100);
          
          const data = {
            value: globalPreservedValue, // Keep same value
            history: updatedHistory
          };
          
          localStorage.setItem('healx_preserved_inventory_value', JSON.stringify(data));
          setPreservedValueHistory(updatedHistory);
          
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('❌ Failed to delete item: ' + error.message, 'error');
      }
    }
  };

  const handleViewTotalValue = () => {
    navigate('/admin/total-value', {
      state: {
        stats: stats,
        items: items,
        admin: admin,
        preservedValue: globalPreservedValue
      }
    });
  };

  // Enhanced stock update with auto-restock awareness
  const handleUpdateStock = async (itemId, quantityChange, type) => {
    try {
      if (!itemId) {
        showNotification('❌ Invalid item ID', 'error');
        return;
      }

      const quantity = parseInt(quantityChange);
      if (isNaN(quantity) || quantity <= 0) {
        showNotification('❌ Invalid quantity. Please enter a positive number.', 'error');
        return;
      }

      if (quantity > 999999) {
        showNotification('❌ Quantity too large. Maximum is 999,999.', 'error');
        return;
      }

      const item = items.find(i => i._id === itemId);
      if (!item) {
        showNotification('❌ Item not found', 'error');
        return;
      }

      const currentStock = parseInt(item.quantity) || 0;
      if (type === 'usage' && quantity > currentStock) {
        showNotification(`❌ Cannot remove ${quantity} units. Only ${currentStock} units available.`, 'error');
        return;
      }

      // Check if this matches the user's auto-restock manual quantity
      const hasAutoRestockManualQuantity = item.autoRestock && 
                                           item.autoRestock.enabled && 
                                           item.autoRestock.restockMethod === 'fixed_quantity' &&
                                           item.autoRestock.reorderQuantity === quantity;

      const updateData = {
        quantityChange: Math.abs(quantity),
        type: type,
        usedBy: admin?.name || 'Admin',
        purpose: type === 'usage' ? 'Manual stock reduction' : 
                 hasAutoRestockManualQuantity ? 'Manual restock using your auto-restock quantity' : 'Manual stock replenishment',
        preserveValue: true,
        originalQuantity: item.originalQuantity || item.quantity || 0,
        preservedQuantity: item.preservedQuantity || item.originalQuantity || item.quantity || 0,
        usingAutoRestockQuantity: hasAutoRestockManualQuantity // Flag for backend
      };

      const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}/update-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        const action = type === 'usage' ? 'reduced' : 'increased';
        
        // Enhanced success message
        if (type === 'restock') {
          const addedValue = (parseFloat(item.price) || 0) * quantity;
          const newPreservedValue = globalPreservedValue + addedValue;
          savePreservedValue(newPreservedValue, 'stock-increase');
          
          if (hasAutoRestockManualQuantity) {
            showNotification(`✅ Stock ${action} by ${quantity} units using your auto-restock setting! Value added: $${addedValue.toFixed(2)}. Preserved value: $${newPreservedValue.toLocaleString()}`, 'success');
          } else {
            showNotification(`✅ Stock ${action} by ${quantity} units! Value added: $${addedValue.toFixed(2)}. Preserved value: $${newPreservedValue.toLocaleString()}`, 'success');
          }
        } else {
          showNotification(`✅ Stock ${action} by ${quantity} units! Preserved value protected: $${globalPreservedValue.toLocaleString()}`, 'success');
        }
        
        loadItems();
      } else {
        throw new Error(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification(`❌ Failed to update stock: ${error.message}`, 'error');
    }
  };

  // Reset Preserved Value function (for admin use)
  const handleResetPreservedValue = () => {
    if (window.confirm(`Are you sure you want to reset the preserved value?

Current preserved value: $${globalPreservedValue.toLocaleString()}
This will set it to current inventory value: $${inventoryStats.currentValue.toLocaleString()}

This action cannot be undone.`)) {
      const newValue = inventoryStats.currentValue;
      savePreservedValue(newValue, 'admin-reset');
      showNotification(`✅ Preserved value reset to $${newValue.toLocaleString()}`, 'success');
    }
  };

  // Enhanced CustomNumberInput that respects user's auto-restock settings
  const CustomNumberInput = ({ value, onSubmit, placeholder, title, max = 999999, type = 'add', item }) => {
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [useManualQuantity, setUseManualQuantity] = useState(false);

    // Get user's auto-restock manual quantity if available
    const getManualQuantity = () => {
      if (item && item.autoRestock && item.autoRestock.enabled && item.autoRestock.restockMethod === 'fixed_quantity') {
        return item.autoRestock.reorderQuantity || 0;
      }
      return 0;
    };

    const manualQuantity = getManualQuantity();
    const hasManualQuantitySetting = manualQuantity > 0;

    const handleSubmit = () => {
      let quantityToUse;
      
      if (useManualQuantity && hasManualQuantitySetting) {
        // Use the user's auto-restock manual quantity
        quantityToUse = manualQuantity;
      } else {
        // Use the manually entered quantity
        const numValue = parseInt(inputValue);
        
        if (!inputValue.trim()) {
          setError('Please enter a number');
          return;
        }
        
        if (isNaN(numValue) || numValue <= 0) {
          setError('Enter positive number only');
          return;
        }
        
        if (numValue > max) {
          setError(`Max: ${max.toLocaleString()}`);
          return;
        }

        if (type === 'remove') {
          const currentItem = items.find(i => i._id === item?._id);
          if (currentItem) {
            const currentStock = parseInt(currentItem.quantity) || 0;
            if (numValue > currentStock) {
              setError(`Only ${currentStock} available`);
              return;
            }
          }
        }
        
        quantityToUse = numValue;
      }
      
      setError('');
      onSubmit(quantityToUse);
      setInputValue('');
      setIsEditing(false);
      setUseManualQuantity(false);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setInputValue('');
        setIsEditing(false);
        setError('');
        setUseManualQuantity(false);
      }
    };

    const handleInputChange = (e) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        setInputValue(value);
        if (error) setError('');
      }
    };

    if (isEditing) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          {/* Show user's auto-restock option if available */}
          {hasManualQuantitySetting && type === 'add' && (
            <div style={{
              background: '#e8f5e8',
              border: '2px solid #28a745',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '6px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              maxWidth: '140px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#28a745' }}>
                <input
                  type="checkbox"
                  checked={useManualQuantity}
                  onChange={(e) => setUseManualQuantity(e.target.checked)}
                  style={{ marginRight: '6px', transform: 'scale(1.1)' }}
                />
                <span style={{ fontSize: '10px', lineHeight: '1.1' }}>
                  🎯 Use YOUR Setting<br/>({manualQuantity} units)
                </span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <input
              type="number"
              value={useManualQuantity ? manualQuantity : inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={useManualQuantity ? manualQuantity.toString() : "0"}
              disabled={useManualQuantity}
              style={{ 
                width: '60px', 
                fontSize: '10px', 
                padding: '4px 6px',
                border: error ? '1px solid #dc3545' : (useManualQuantity ? '2px solid #28a745' : '1px solid #ccc'),
                borderRadius: '3px',
                textAlign: 'center',
                background: useManualQuantity ? '#f0fff0' : '#ffffff',
                fontWeight: useManualQuantity ? 'bold' : 'normal'
              }}
              min="1"
              max={max}
              autoFocus={!useManualQuantity}
            />
            <button 
              onClick={handleSubmit} 
              style={{ 
                fontSize: '9px', 
                padding: '4px 6px',
                background: useManualQuantity ? '#28a745' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {useManualQuantity ? `🎯` : '✓'}
            </button>
            <button 
              onClick={() => { 
                setInputValue(''); 
                setIsEditing(false); 
                setError('');
                setUseManualQuantity(false);
              }} 
              style={{ 
                fontSize: '9px', 
                padding: '4px 6px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {useManualQuantity && (
            <small style={{
              color: '#28a745',
              fontSize: '9px',
              textAlign: 'center',
              fontWeight: 'bold',
              maxWidth: '120px',
              lineHeight: '1.1'
            }}>
              Using YOUR auto-restock setting: {manualQuantity} units
            </small>
          )}

          {error && !useManualQuantity && (
            <small style={{ 
              color: '#dc3545', 
              fontSize: '9px',
              textAlign: 'center',
              maxWidth: '80px',
              lineHeight: '1.1',
              fontWeight: '500'
            }}>
              {error}
            </small>
          )}
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsEditing(true)}
          title={hasManualQuantitySetting && type === 'add' 
            ? `${title} - Your auto-restock setting: ${manualQuantity} units available`
            : `${title} (max: ${max.toLocaleString()})`
          }
          style={{ 
            fontSize: '11px', 
            padding: '4px 6px', 
            cursor: 'pointer',
            border: '1px solid #007bff',
            background: '#f8f9fa',
            color: '#007bff',
            borderRadius: '3px',
            transition: 'all 0.2s ease',
            minWidth: '55px',
            position: 'relative'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#007bff';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#f8f9fa';
            e.target.style.color = '#007bff';
          }}
        >
          {placeholder}
        </button>
        
        {/* Show indicator if user's auto-restock manual quantity is available */}
        {hasManualQuantitySetting && type === 'add' && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#28a745',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '1px solid white'
          }}>
            🎯
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (quantity, minStockLevel) => {
    const qty = parseInt(quantity) || 0;
    const minStock = parseInt(minStockLevel) || 0;
    
    if (qty === 0) return '#dc3545';
    if (qty <= minStock) return '#ffc107';
    return '#28a745';
  };

  const getStatusText = (quantity, minStockLevel) => {
    const qty = parseInt(quantity) || 0;
    const minStock = parseInt(minStockLevel) || 0;
    
    if (qty === 0) return 'Out of Stock';
    if (qty <= minStock) return 'Low Stock';
    return 'Available';
  };

  const filteredItems = items.filter(item => {
    if (!item) return false;
    
    const itemName = (item.name || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = itemName.includes(searchLower) || itemDesc.includes(searchLower);
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    const itemStatus = getStatusText(item.quantity, item.minStockLevel);
    const matchesStatus = filterStatus === 'all' || itemStatus === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const ItemStockChart = ({ item }) => {
    if (!item) return <div>No data</div>;
    
    const quantity = parseInt(item.quantity) || 0;
    const minStock = parseInt(item.minStockLevel) || 0;
    const isLowStock = quantity <= minStock;
    const isOutOfStock = quantity === 0;
    
    const data = {
      labels: ['Stock Level'],
      datasets: [
        {
          label: 'Current Stock',
          data: [quantity],
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
            title: () => item.name || 'Unknown Item',
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
          max: Math.max(quantity, minStock, 1) * 1.2,
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
          {quantity}/{minStock}
        </div>
      </div>
    );
  };

  const PriceTrendChart = ({ item }) => {
    if (!item || !item.price) return <div style={{ width: '60px', height: '30px' }}>No data</div>;
    
    const price = parseFloat(item.price) || 0;
    const trendData = [
      price * 0.9,
      price * 0.95,
      price,
      price * 1.02,
      price
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
          <div className="page-header">
            <div className="header-content">
              <h1>🔧 Surgical Items Management</h1>
              <div className="header-actions">
                <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
                  ← Back to Dashboard
                </button>
                <button onClick={() => navigate('/admin/Procurement')} className="supplier-btn">
                  👥 View Suppliers
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
              <div className="error-banner" style={{
                background: 'linear-gradient(135deg, #ffe6e6, #ffcccc)',
                border: '2px solid #ff9999',
                borderRadius: '8px',
                padding: '10px 15px',
                color: '#cc0000',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Supplier Spending Section */}
          <div className="supplier-spending-section" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '25px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>💰 Total Supplier Spending</h3>
              <button
                onClick={fetchSupplierSpending}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                  ${supplierSpending.totalSpending.toLocaleString()}
                </div>
                <div style={{ opacity: 0.9 }}>Total Supplier Spending</div>
                <small style={{ opacity: 0.8 }}>From {supplierSpending.totalOrders} purchase orders</small>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                  ${supplierSpending.monthlySpending.toLocaleString()}
                </div>
                <div style={{ opacity: 0.9 }}>This Month</div>
                <small style={{ opacity: 0.8 }}>
                  {supplierSpending.totalSpending > 0 
                    ? `${((supplierSpending.monthlySpending / supplierSpending.totalSpending) * 100).toFixed(1)}% of total`
                    : 'No spending this month'
                  }
                </small>
              </div>

              {supplierSpending.topSuppliers.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '20px',
                  borderRadius: '10px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🏆 Top Suppliers</h4>
                  {supplierSpending.topSuppliers.slice(0, 3).map((supplier, index) => (
                    <div key={supplier.name} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px',
                      padding: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px' }}>#{index + 1} {supplier.name}</span>
                      <strong>${supplier.amount.toLocaleString()}</strong>
                    </div>
                  ))}
                  {supplierSpending.topSuppliers.length > 3 && (
                    <div style={{ textAlign: 'center', marginTop: '10px', opacity: 0.8 }}>
                      <small>and {supplierSpending.topSuppliers.length - 3} more suppliers</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* True Inventory Value Protection Section */}
          <div className="inventory-value-section" style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '25px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>🛡️ True Value Protection System</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '8px 16px', 
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ✅ NEVER DECREASES
                </div>
                {admin?.role === 'admin' && (
                  <button
                    onClick={handleResetPreservedValue}
                    style={{
                      background: 'rgba(255,193,7,0.3)',
                      border: '1px solid rgba(255,193,7,0.5)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    🔧 Reset Value
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${inventoryStats.currentValue?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Current Stock Value</div>
                <small style={{ fontSize: '12px', opacity: 0.8 }}>Changes with stock</small>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '3px solid rgba(255,255,255,0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)',
                  backgroundSize: '20px 20px',
                  animation: 'shimmer 2s linear infinite'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                    ${globalPreservedValue?.toLocaleString() || '0'}
                  </div>
                  <div style={{ fontSize: '16px', opacity: 0.95, fontWeight: 'bold' }}>🛡️ PRESERVED VALUE</div>
                  <small style={{ fontSize: '12px', opacity: 0.9 }}>PROTECTED FOREVER</small>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${inventoryStats.deletedValue?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Deleted Items Value</div>
                <small style={{ fontSize: '12px', opacity: 0.8 }}>Still protected</small>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                  100%
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Protection Rate</div>
                <small style={{ fontSize: '12px', opacity: 0.8 }}>Always protected</small>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <strong>🛡️ True Value Protection:</strong> Your preserved inventory value of <strong>${globalPreservedValue?.toLocaleString()}</strong> will NEVER decrease, 
              even when items are deleted or used. This ensures accurate financial tracking and permanent asset value protection.
              
              {preservedValueHistory.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.9 }}>
                  <strong>Last updated:</strong> {new Date(preservedValueHistory[preservedValueHistory.length - 1]?.timestamp).toLocaleString()} 
                  by {preservedValueHistory[preservedValueHistory.length - 1]?.admin}
                </div>
              )}
            </div>
          </div>

          <div className="notification-section" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>📧 HealX Notification Center</h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                  Monitor inventory and send alerts to: <strong>chamarasweed44@gmail.com</strong>
                </p>
                <small style={{ opacity: 0.8, fontSize: '12px' }}>
                  Total items: {stats.totalItems} | Low stock: {stats.lowStockItems}
                </small>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleTestEmail}
                  disabled={notifications.loading}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: notifications.loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    opacity: notifications.loading ? 0.7 : 1
                  }}
                >
                  📬 Test Email
                </button>
                
                <button
                  onClick={handleSendLowStockAlert}
                  disabled={notifications.loading}
                  style={{
                    background: stats.lowStockItems > 0 ? '#ff4757' : 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: notifications.loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    opacity: notifications.loading ? 0.7 : 1,
                    position: 'relative'
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
                      width: '24px',
                      height: '24px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      border: '2px solid white'
                    }}>
                      {stats.lowStockItems}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleAutoRestockCheck}
                  disabled={notifications.loading}
                  style={{
                    background: '#28a745',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: notifications.loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    opacity: notifications.loading ? 0.7 : 1
                  }}
                >
                  🔄 Auto-Restock Check
                </button>
              </div>
            </div>

            {notifications.message && (
              <div style={{
                marginTop: '15px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: notifications.type === 'success' ? 'rgba(40, 167, 69, 0.2)' :
                           notifications.type === 'error' ? 'rgba(220, 53, 69, 0.2)' :
                           'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${
                  notifications.type === 'success' ? 'rgba(40, 167, 69, 0.4)' :
                  notifications.type === 'error' ? 'rgba(220, 53, 69, 0.4)' :
                  'rgba(255, 255, 255, 0.3)'
                }`,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {notifications.loading && (
                  <span style={{ marginRight: '10px' }}>
                    <div style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
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

          {/* Stats grid with true preserved value */}
          <div className="supplier-stats-grid">
            <div className="supplier-stat-card">
              <div className="supplier-stat-icon">📦</div>
              <div className="supplier-stat-info">
                <h3>{stats.totalItems || 0}</h3>
                <p>Total Items</p>
              </div>
            </div>
            <div className="supplier-stat-card">
              <div className="supplier-stat-icon">📊</div>
              <div className="supplier-stat-info">
                <h3>{(stats.totalQuantity || 0).toLocaleString()}</h3>
                <p>Total Quantity</p>
              </div>
            </div>
            <div className="supplier-stat-card" style={{
              background: stats.lowStockItems > 0 ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' : undefined,
              color: stats.lowStockItems > 0 ? 'white' : undefined,
              animation: stats.lowStockItems > 0 ? 'pulse 2s infinite' : 'none'
            }}>
              <div className="supplier-stat-icon">⚠️</div>
              <div className="supplier-stat-info">
                <h3>{stats.lowStockItems || 0}</h3>
                <p>Low Stock Items</p>
                {stats.lowStockItems > 0 && (
                  <small style={{ opacity: 0.9, fontWeight: '600' }}>Needs attention!</small>
                )}
              </div>
            </div>
            <div className="supplier-stat-card" style={{ 
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              color: 'white',
              cursor: 'pointer'
            }} onClick={() => navigate('/admin/suppliers')}>
              <div className="supplier-stat-icon">💰</div>
              <div className="supplier-stat-info">
                <h3>${supplierSpending.totalSpending.toLocaleString()}</h3>
                <p>Total Supplier Spending</p>
                <small style={{ fontSize: '12px', opacity: 0.9 }}>
                  👆 Click to manage suppliers
                </small>
              </div>
            </div>
            {/* Show true preserved inventory value */}
            <div className="supplier-stat-card" style={{ 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #6f42c1, #8e44ad)',
              color: 'white',
              border: '3px solid rgba(255,255,255,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }} onClick={handleViewTotalValue}>
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'linear-gradient(45deg, #28a745, #20c997)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                🛡️
              </div>
              <div className="supplier-stat-icon">💎</div>
              <div className="supplier-stat-info">
                <h3>${globalPreservedValue?.toLocaleString() || '0'}</h3>
                <p>Protected Value</p>
                <small style={{ fontSize: '12px', opacity: 0.9 }}>
                  ✅ Never decreases
                </small>
              </div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search items by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                maxLength="100"
              />
              <small style={{ color: '#666', fontSize: '12px', marginLeft: '10px' }}>
                {filteredItems.length} of {items.length} items
              </small>
            </div>
            <div className="filter-controls">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories ({items.length})</option>
                {categories.map(category => {
                  const count = items.filter(item => item.category === category).length;
                  return (
                    <option key={category} value={category}>
                      {category} ({count})
                    </option>
                  );
                })}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="Available">Available ({items.filter(item => getStatusText(item.quantity, item.minStockLevel) === 'Available').length})</option>
                <option value="Low Stock">Low Stock ({items.filter(item => getStatusText(item.quantity, item.minStockLevel) === 'Low Stock').length})</option>
                <option value="Out of Stock">Out of Stock ({items.filter(item => getStatusText(item.quantity, item.minStockLevel) === 'Out of Stock').length})</option>
              </select>
            </div>
          </div>

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
                  <th>Current Value</th>
                  <th>Price Trend</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => {
                  const currentValue = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
                  
                  return (
                    <tr key={item._id} style={{
                      backgroundColor: getStatusText(item.quantity, item.minStockLevel) === 'Out of Stock' ? '#fff5f5' :
                                     getStatusText(item.quantity, item.minStockLevel) === 'Low Stock' ? '#fffbf0' : undefined
                    }}>
                      <td>
                        <div className="item-info">
                          <strong>{item.name || 'Unknown Item'}</strong>
                          {item.description && (
                            <small style={{ display: 'block', color: '#666', marginTop: '2px' }}>
                              {item.description.substring(0, 40)}{item.description.length > 40 ? '...' : ''}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{item.category || 'Other'}</td>
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
                          {parseInt(item.quantity) || 0}
                        </span>
                      </td>
                      <td>{parseInt(item.minStockLevel) || 0}</td>
                      <td>${(parseFloat(item.price) || 0).toFixed(2)}</td>
                      <td>
                        <strong>${currentValue.toFixed(2)}</strong>
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
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          {getStatusText(item.quantity, item.minStockLevel)}
                        </span>
                      </td>
                      <td>{item.supplier?.name || 'N/A'}</td>
                      <td>
                        <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="action-btn edit-btn"
                            title="Edit Item"
                            style={{ padding: '3px 6px', fontSize: '10px' }}
                          >
                            ✏️ Edit
                          </button>
                          
                          {/* Pass item data to CustomNumberInput */}
                          <CustomNumberInput
                            placeholder="+ Stock"
                            title="Add Stock (Value increases preserved value)"
                            onSubmit={(qty) => handleUpdateStock(item._id, qty, 'restock')}
                            type="add"
                            item={item}
                          />

                          <CustomNumberInput
                            placeholder="- Stock"
                            title="Use Stock (Preserved value maintained)"
                            onSubmit={(qty) => handleUpdateStock(item._id, qty, 'usage')}
                            type="remove"
                            max={parseInt(item.quantity) || 0}
                            item={item}
                          />

                          <button
                            onClick={() => handleConfigureAutoRestock(item)}
                            className="action-btn auto-restock-btn"
                            title="Configure Auto-Restock"
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: '10px',
                              background: item.autoRestock?.enabled ? '#28a745' : '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {item.autoRestock?.enabled ? '🔄 Auto ON' : '⚙️ Setup'}
                          </button>

                          {(parseInt(item.quantity) <= (parseInt(item.minStockLevel) || 0)) && (
                            <button
                              onClick={() => handleSendItemNotification(item)}
                              className="action-btn notify-btn"
                              title={`Send notification for ${item.name}`}
                              disabled={notifications.loading}
                              style={{ 
                                padding: '3px 6px', 
                                fontSize: '10px',
                                background: parseInt(item.quantity) === 0 ? '#dc3545' : '#ffc107',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: notifications.loading ? 'not-allowed' : 'pointer',
                                opacity: notifications.loading ? 0.7 : 1,
                                fontWeight: '600'
                              }}
                            >
                              📧 Alert
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="action-btn delete-btn"
                            title="Delete Item (Preserved value maintained)"
                            style={{ 
                              padding: '3px 6px', 
                              fontSize: '10px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {currentItems.length === 0 && (
              <div className="no-items-message" style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '12px',
                margin: '20px 0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <h3>No surgical items found</h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  {items.length === 0 
                    ? "You haven't added any items yet." 
                    : "No items match your current search criteria."}
                </p>
                {items.length === 0 ? (
                  <button onClick={handleAddItem} className="add-first-item-btn" style={{
                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    ➕ Add Your First Item
                  </button>
                ) : (
                  <button onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterStatus('all'); }} style={{
                    background: 'linear-gradient(135deg, #6c757d, #495057)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              padding: '20px 0',
              background: '#f8f9fa',
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                ⏮️ First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                ← Previous
              </button>
              <span className="pagination-info" style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                borderRadius: '6px',
                fontWeight: '600'
              }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next →
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Last ⏭️
              </button>
            </div>
          )}

          {/* Enhanced PDF Button with new style */}
          <div 
            className="floating-report-btn-advanced"
            onClick={generateSurgicalItemsPDF}
            title="Generate Professional Inventory Report"
          >
            <div className="btn-background"></div>
            <div className="btn-glow"></div>
            <div className="btn-content">
              <div className="pdf-icon-advanced">📄</div>
              <div className="pdf-text-advanced">
                Professional<br/>Report
              </div>
            </div>
            
            {stats.lowStockItems > 0 && (
              <div className="pdf-notification-bubble-advanced">
                <div className="bubble-pulse"></div>
                <div className="bubble-content">{stats.lowStockItems}</div>
              </div>
            )}
            
            <div className="floating-particles">
              <div className="particle particle-1"></div>
              <div className="particle particle-2"></div>
              <div className="particle particle-3"></div>
              <div className="particle particle-4"></div>
            </div>
          </div>

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
                showNotification('✅ Item saved successfully! Preserved value protected.', 'success');
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}

          {showDisposeModal && (
            <DisposeModal
              isOpen={showDisposeModal}
              onClose={() => setShowDisposeModal(false)}
              items={items}
              onSuccess={() => {
                loadItems();
                setShowDisposeModal(false);
                showNotification('✅ Items disposed successfully! Preserved value maintained.', 'success');
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}

          {/* Enhanced Auto-Restock Modal - YOU Control the Quantity */}
          {showAutoRestockModal && selectedItemForAutoRestock && (
            <div className="modal-overlay" onClick={() => setShowAutoRestockModal(false)}>
              <div className="modal auto-restock-modal" onClick={e => e.stopPropagation()} style={{
                maxWidth: '700px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <div className="modal-header" style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px 12px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>
                    🔄 Configure Auto-Restock: {selectedItemForAutoRestock.name}
                  </h3>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowAutoRestockModal(false)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      fontSize: '18px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="modal-body" style={{ padding: '30px' }}>
                  <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={autoRestockConfig.enabled}
                        onChange={(e) => setAutoRestockConfig(prev => ({
                          ...prev,
                          enabled: e.target.checked
                        }))}
                        style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                      />
                      <span style={{ color: autoRestockConfig.enabled ? '#28a745' : '#6c757d' }}>
                        Enable Auto-Restock for this item
                      </span>
                    </label>
                  </div>

                  {autoRestockConfig.enabled && (
                    <div style={{ 
                      border: '2px solid #e9ecef', 
                      borderRadius: '10px', 
                      padding: '25px',
                      background: '#f8f9fa'
                    }}>
                      {/* Restock Method Selection FIRST and PROMINENT */}
                      <div className="form-group" style={{ marginBottom: '25px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: '700',
                          color: '#495057',
                          fontSize: '16px'
                        }}>
                          🎯 Restock Method (Choose Your Approach)
                        </label>
                        <select
                          value={autoRestockConfig.restockMethod}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            restockMethod: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '3px solid #007bff',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            background: '#f8f9ff'
                          }}
                        >
                          <option value="fixed_quantity">🎯 Use My Manual Quantity (YOU Control the Amount)</option>
                          <option value="to_max">📊 Restock to Maximum Level (Automatic Calculation)</option>
                        </select>
                        <small style={{ 
                          color: autoRestockConfig.restockMethod === 'fixed_quantity' ? '#28a745' : '#6c757d',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          display: 'block',
                          marginTop: '8px'
                        }}>
                          {autoRestockConfig.restockMethod === 'fixed_quantity' 
                            ? '✅ System will use YOUR exact manual quantity setting' 
                            : 'ℹ️ System will calculate quantity automatically to reach max level'
                          }
                        </small>
                      </div>

                      <div className="form-row" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '20px',
                        marginBottom: '20px'
                      }}>
                        {/* Manual Quantity Input - YOU are in control */}
                        <div className="form-group">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            fontWeight: autoRestockConfig.restockMethod === 'fixed_quantity' ? '700' : '600',
                            color: autoRestockConfig.restockMethod === 'fixed_quantity' ? '#28a745' : '#495057',
                            fontSize: autoRestockConfig.restockMethod === 'fixed_quantity' ? '16px' : '14px'
                          }}>
                            🎯 YOUR Manual Reorder Quantity
                            {autoRestockConfig.restockMethod === 'fixed_quantity' && (
                              <span style={{ color: '#28a745', marginLeft: '8px', fontSize: '14px' }}>← YOU DECIDE THIS</span>
                            )}
                          </label>
                          <input
                            type="number"
                            value={autoRestockConfig.reorderQuantity}
                            onChange={(e) => setAutoRestockConfig(prev => ({
                              ...prev,
                              reorderQuantity: parseInt(e.target.value) || 0
                            }))}
                            min="1"
                            max="100000"
                            placeholder="Enter YOUR desired reorder quantity"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: autoRestockConfig.restockMethod === 'fixed_quantity' 
                                ? '3px solid #28a745' 
                                : '1px solid #ced4da',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: autoRestockConfig.restockMethod === 'fixed_quantity' ? 'bold' : 'normal',
                              background: autoRestockConfig.restockMethod === 'fixed_quantity' 
                                ? '#f0fff0' 
                                : '#ffffff'
                            }}
                          />
                          <small style={{ 
                            color: autoRestockConfig.restockMethod === 'fixed_quantity' ? '#28a745' : '#6c757d',
                            fontWeight: autoRestockConfig.restockMethod === 'fixed_quantity' ? 'bold' : 'normal',
                            display: 'block',
                            marginTop: '5px',
                            fontSize: '13px'
                          }}>
                            {autoRestockConfig.restockMethod === 'fixed_quantity' 
                              ? `✅ System will add exactly ${autoRestockConfig.reorderQuantity} units (YOUR choice)` 
                              : 'Enter the exact quantity YOU want to reorder each time'
                            }
                          </small>
                        </div>
                        
                        {/* Max Stock Level - Only relevant for "to_max" method */}
                        <div className="form-group">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            fontWeight: autoRestockConfig.restockMethod === 'to_max' ? '700' : '600',
                            color: autoRestockConfig.restockMethod === 'to_max' ? '#007bff' : '#495057',
                            fontSize: autoRestockConfig.restockMethod === 'to_max' ? '16px' : '14px'
                          }}>
                            📊 Maximum Stock Level
                            {autoRestockConfig.restockMethod === 'to_max' && (
                              <span style={{ color: '#007bff', marginLeft: '8px', fontSize: '14px' }}>← ACTIVE METHOD</span>
                            )}
                          </label>
                          <input
                            type="number"
                            value={autoRestockConfig.maxStockLevel}
                            onChange={(e) => setAutoRestockConfig(prev => ({
                              ...prev,
                              maxStockLevel: parseInt(e.target.value) || 0
                            }))}
                            min="1"
                            max="100000"
                            placeholder="Target maximum stock level"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: autoRestockConfig.restockMethod === 'to_max' 
                                ? '3px solid #007bff' 
                                : '1px solid #ced4da',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: autoRestockConfig.restockMethod === 'to_max' ? 'bold' : 'normal',
                              background: autoRestockConfig.restockMethod === 'to_max' 
                                ? '#f0f8ff' 
                                : '#ffffff'
                            }}
                          />
                          <small style={{ 
                            color: autoRestockConfig.restockMethod === 'to_max' ? '#007bff' : '#6c757d',
                            fontWeight: autoRestockConfig.restockMethod === 'to_max' ? 'bold' : 'normal',
                            display: 'block',
                            marginTop: '5px',
                            fontSize: '13px'
                          }}>
                            {autoRestockConfig.restockMethod === 'to_max'
                              ? `📊 Auto-restock will fill to reach ${autoRestockConfig.maxStockLevel} units total`
                              : 'Only used when "Restock to Maximum Level" method is selected'
                            }
                          </small>
                        </div>
                      </div>

                      {/* Current Status with Method Preview - Shows YOUR Quantity */}
                      <div style={{
                        background: autoRestockConfig.restockMethod === 'fixed_quantity' 
                          ? 'linear-gradient(135deg, #e8f5e8, #f0fff0)' 
                          : 'linear-gradient(135deg, #e7f3ff, #f0f8ff)',
                        padding: '20px',
                        borderRadius: '8px',
                        margin: '20px 0',
                        border: autoRestockConfig.restockMethod === 'fixed_quantity' 
                          ? '2px solid #28a745' 
                          : '2px solid #007bff'
                      }}>
                        <h4 style={{ 
                          margin: '0 0 15px 0', 
                          fontSize: '18px',
                          color: autoRestockConfig.restockMethod === 'fixed_quantity' ? '#155724' : '#004085'
                        }}>
                          📊 Auto-Restock Preview & Current Status
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <p style={{ margin: '8px 0' }}><strong>Current Stock:</strong> <span style={{ color: '#28a745', fontSize: '18px' }}>{selectedItemForAutoRestock.quantity}</span></p>
                            <p style={{ margin: '8px 0' }}><strong>Minimum Level:</strong> <span style={{ color: '#ffc107', fontSize: '18px' }}>{selectedItemForAutoRestock.minStockLevel}</span></p>
                          </div>
                          <div>
                            <p style={{ margin: '8px 0' }}>
                              <strong>Selected Method:</strong> 
                              <span style={{ 
                                color: autoRestockConfig.restockMethod === 'fixed_quantity' ? '#28a745' : '#007bff',
                                fontWeight: 'bold',
                                marginLeft: '8px',
                                fontSize: '16px'
                              }}>
                                {autoRestockConfig.restockMethod === 'fixed_quantity' 
                                  ? '🎯 YOUR Manual Quantity' 
                                  : '📊 Auto Calculate'
                                }
                              </span>
                            </p>
                            <p style={{ margin: '8px 0' }}>
                              <strong>Will Add When Restocking:</strong> 
                              <span style={{ 
                                color: '#dc3545',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: 'rgba(220, 53, 69, 0.1)',
                                borderRadius: '4px'
                              }}>
                                {autoRestockConfig.restockMethod === 'fixed_quantity' 
                                  ? `${autoRestockConfig.reorderQuantity} units (YOUR Choice)` 
                                  : `${Math.max(0, autoRestockConfig.maxStockLevel - selectedItemForAutoRestock.quantity)} units (Calculated)`
                                }
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Prominent info box showing YOUR manual quantity */}
                        {autoRestockConfig.restockMethod === 'fixed_quantity' && (
                          <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            background: '#28a745',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}>
                            🎯 <strong>YOUR Manual Quantity Active:</strong> 
                            <br/>System will ALWAYS add exactly <strong>{autoRestockConfig.reorderQuantity} units</strong> (the quantity YOU specified), 
                            <br/>regardless of current stock level.
                            <br/>
                            <div style={{
                              marginTop: '10px',
                              padding: '8px',
                              background: 'rgba(255,255,255,0.2)',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}>
                              💡 Want different amount? Just change the number above ↑
                            </div>
                          </div>
                        )}

                        {/* Info for auto-calculate method */}
                        {autoRestockConfig.restockMethod === 'to_max' && (
                          <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            background: '#007bff',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}>
                            📊 <strong>Auto-Calculate Mode Active:</strong> 
                            <br/>System will calculate quantity to reach <strong>{autoRestockConfig.maxStockLevel} units</strong> total.
                            <br/>Current quantity affects how much gets added.
                          </div>
                        )}
                      </div>

                      {/* Supplier Information */}
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: '#495057'
                        }}>
                          Supplier Information
                        </label>
                        <input
                          type="text"
                          value={autoRestockConfig.supplier.name}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            supplier: { ...prev.supplier, name: e.target.value }
                          }))}
                          placeholder="Supplier name"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '14px',
                            marginBottom: '10px'
                          }}
                        />
                        <input
                          type="email"
                          value={autoRestockConfig.supplier.contactEmail}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            supplier: { ...prev.supplier, contactEmail: e.target.value }
                          }))}
                          placeholder="Supplier email"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="modal-actions" style={{
                  padding: '20px 30px',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setShowAutoRestockModal(false)}
                    className="btn-cancel"
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #6c757d',
                      background: 'white',
                      color: '#6c757d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAutoRestockConfig}
                    className="btn-save"
                    style={{
                      padding: '12px 24px',
                      background: autoRestockConfig.restockMethod === 'fixed_quantity' 
                        ? 'linear-gradient(135deg, #28a745, #20c997)' 
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '700'
                    }}
                  >
                    {autoRestockConfig.restockMethod === 'fixed_quantity' 
                      ? `🎯 Save YOUR Manual Setting (${autoRestockConfig.reorderQuantity} units)` 
                      : `📊 Save Auto Configuration (to ${autoRestockConfig.maxStockLevel} max)`
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default SurgicalItemsManagement;