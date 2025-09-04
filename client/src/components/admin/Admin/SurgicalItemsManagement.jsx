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
    'Other'
  ];

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotifications({ loading: false, message, type });
    setTimeout(() => {
      setNotifications({ loading: false, message: '', type: '' });
    }, duration);
  };

  // ✅ NEW: Auto-restock state management
  const [autoRestockConfig, setAutoRestockConfig] = useState({});
  const [showAutoRestockModal, setShowAutoRestockModal] = useState(false);
  const [selectedItemForAutoRestock, setSelectedItemForAutoRestock] = useState(null);

  // ✅ NEW: Handle auto-restock check
  const handleAutoRestockCheck = async () => {
    try {
      setNotifications({ loading: true, message: 'Checking items for auto-restock...', type: 'info' });
      
      const response = await fetch(`${API_BASE_URL}/auto-restock/check-and-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        showNotification(`✅ Auto-restock completed! Processed ${data.data.itemsProcessed} items.`, 'success');
        loadItems(); // Refresh the items list
      } else {
        throw new Error(data.message || 'Failed to perform auto-restock check');
      }
    } catch (error) {
      console.error('Auto-restock error:', error);
      showNotification(`❌ Auto-restock failed: ${error.message}`, 'error');
    }
  };

  // ✅ NEW: Configure auto-restock for item
  const handleConfigureAutoRestock = (item) => {
    setSelectedItemForAutoRestock(item);
    setAutoRestockConfig({
      enabled: item.autoRestock?.enabled || false,
      maxStockLevel: item.autoRestock?.maxStockLevel || (item.minStockLevel * 3),
      reorderQuantity: item.autoRestock?.reorderQuantity || (item.minStockLevel * 2),
      restockMethod: item.autoRestock?.restockMethod || 'to_max',
      supplier: item.autoRestock?.supplier || {
        name: item.supplier?.name || '',
        contactEmail: '',
        leadTimeDays: 3
      }
    });
    setShowAutoRestockModal(true);
  };

  // ✅ NEW: Save auto-restock configuration
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
        showNotification(`✅ Auto-restock configured for ${selectedItemForAutoRestock.name}!`, 'success');
        setShowAutoRestockModal(false);
        loadItems(); // Refresh the items list
      } else {
        throw new Error(data.message || 'Failed to configure auto-restock');
      }
    } catch (error) {
      console.error('Configure auto-restock error:', error);
      showNotification(`❌ Failed to configure auto-restock: ${error.message}`, 'error');
    }
  };

  // ✅ NEW: Get month name helper function
  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  // OPTIMIZED SINGLE PAGE PDF GENERATION
  const generatePDFReport = () => {
    try {
      if (!items || items.length === 0) {
        showNotification('❌ No items available to generate report', 'error');
        return;
      }

      showNotification('📄 Generating single-page PDF report...', 'info');

      const doc = new jsPDF('landscape', 'mm', 'a4'); // Landscape for better table fit
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 15; // Reduced top margin
      
      // COMPACT HEADER SECTION
      doc.setFontSize(18); // Reduced font size
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('HealX Healthcare Center', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 6; // Reduced spacing
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Surgical Items Inventory Management Report', pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 5; // Reduced spacing
      doc.setFontSize(10);
      doc.text('Department of Medical Equipment & Supplies', pageWidth / 2, currentY, { align: 'center' });
      
      // Compact separator line
      currentY += 6;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(15, currentY, pageWidth - 15, currentY); // Reduced margins
      
      currentY += 8;
      
      // COMPACT REPORT METADATA - Single row
      doc.setFontSize(9); // Smaller font
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      const currentDate = new Date();
      const dateString = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeString = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' IST';
      const reportId = `RPT-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}`;
      
      // Single line metadata
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Date: ${dateString} | Time: ${timeString} | Generated By: ${admin?.name || 'System Administrator'} | Report ID: ${reportId}`, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 10;
      
      // COMPACT SUMMARY SECTION
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', 20, currentY);
      
      // Compact summary box
      const summaryBoxY = currentY + 2;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(20, summaryBoxY, pageWidth - 40, 15); // Reduced height
      
      currentY += 8;
      doc.setFontSize(9); // Smaller font
      doc.setFont('helvetica', 'normal');
      
      // Horizontal summary layout
      const summaryData = [
        `Total Items: ${stats.totalItems || 0}`,
        `Total Stock: ${(stats.totalQuantity || 0).toLocaleString()}`,
        `Critical Items: ${stats.lowStockItems || 0}`,
        `Total Value: $${(stats.totalValue || 0).toLocaleString()}`
      ];

      summaryData.forEach((text, index) => {
        const x = 25 + (index * 65);
        doc.setFont('helvetica', 'bold');
        doc.text(text, x, currentY + 5);
      });
      
      currentY += 22;

      // OPTIMIZED TABLE FOR SINGLE PAGE
      const tableData = items.map((item, index) => {
        const quantity = parseInt(item.quantity) || 0;
        const minStock = parseInt(item.minStockLevel) || 0;
        const price = parseFloat(item.price) || 0;
        const totalValue = price * quantity;
        const status = getStatusText(quantity, minStock);
        const stockPercentage = minStock > 0 ? Math.round((quantity / minStock) * 100) : 0;
        const riskLevel = quantity === 0 ? 'CRITICAL' : 
                         quantity <= minStock ? 'HIGH' : 
                         quantity <= (minStock * 1.5) ? 'MEDIUM' : 'LOW';
        
        return [
          String(index + 1).padStart(3, '0'),
          (item.name || 'Unknown Item').substring(0, 20), // Shortened
          item.category ? item.category.substring(0, 12) : 'Other', // Shortened
          (item.supplier?.name || 'N/A').substring(0, 12), // Shortened
          `$${price.toFixed(2)}`,
          quantity.toString(),
          minStock.toString(),
          `${stockPercentage}%`,
          `$${totalValue.toFixed(2)}`,
          status.substring(0, 8), // Shortened
          riskLevel
        ];
      });

      // OPTIMIZED TABLE CONFIGURATION FOR SINGLE PAGE
      const tableConfig = {
        startY: currentY,
        head: [[
          'S/N',
          'Item Description',
          'Category',
          'Supplier',
          'Unit Cost',
          'Stock',
          'Min',
          'Stock %',
          'Total Value',
          'Status',
          'Risk'
        ]],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [240, 240, 240], // Light gray header
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8, // Smaller header font
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 } // Reduced padding
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 7, // Smaller body font
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 } // Reduced padding
        },
        // OPTIMIZED COLUMN WIDTHS FOR SINGLE PAGE
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // S/N
          1: { cellWidth: 45, halign: 'left', fontSize: 7 },        // Item Description
          2: { cellWidth: 25, halign: 'center', fontSize: 6 },      // Category
          3: { cellWidth: 25, halign: 'left', fontSize: 6 },        // Supplier
          4: { cellWidth: 20, halign: 'right', fontSize: 7 },       // Unit Cost
          5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // Stock
          6: { cellWidth: 12, halign: 'center', fontSize: 7 },      // Min
          7: { cellWidth: 15, halign: 'center', fontSize: 7 },      // Stock %
          8: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Total Value
          9: { cellWidth: 18, halign: 'center', fontSize: 7 },      // Status
          10: { cellWidth: 15, halign: 'center', fontSize: 6 }      // Risk
        },
        // Simple alternating rows
        didParseCell: (data) => {
          const rowIndex = data.row.index;
          if (rowIndex % 2 === 0) {
            data.cell.styles.fillColor = [248, 248, 248];
          } else {
            data.cell.styles.fillColor = [255, 255, 255];
          }
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.lineColor = [0, 0, 0];
        },
        margin: { top: 10, left: 15, right: 15, bottom: 20 }, // Reduced margins
        styles: {
          overflow: 'linebreak',
          fontSize: 7, // Smaller font
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 },
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.3
        },
        showHead: 'firstPage', // Only show header on first page
        showFoot: 'never'
      };

      // Generate the table
      autoTable(doc, tableConfig);

      // COMPACT SIGNATURE SECTION AT BOTTOM
      const finalY = doc.lastAutoTable?.finalY || 150;
      const remainingSpace = pageHeight - finalY;
      
      // Only add signature if there's enough space
      if (remainingSpace > 30) {
        let signatureY = finalY + 15;
        
        // Compact signature section
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(20, signatureY, pageWidth - 40, 25); // Reduced height
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('REPORT VERIFICATION', 25, signatureY + 6);

        signatureY += 12;
        doc.setFontSize(8); // Smaller font
        doc.setFont('helvetica', 'normal');
        
        // Compact signature lines
        doc.text('Prepared by: ______________________', 25, signatureY);
        doc.text('Reviewed by: ______________________', 150, signatureY);
        doc.text('Date: ____________', 25, signatureY + 8);
        doc.text('Date: ____________', 150, signatureY + 8);
      }

      // COMPACT FOOTER
      const footerY = pageHeight - 10;
      doc.setFontSize(7); // Very small footer
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`HealX Healthcare Center - Confidential Report | Page 1 of 1 | Generated: ${currentDate.toLocaleDateString()}`, pageWidth / 2, footerY, { align: 'center' });

      // Generate filename
      const timestamp = currentDate.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `HealX_SinglePage_Report_${timestamp}.pdf`;
      
      doc.save(fileName);
      showNotification(`✅ Single-page PDF "${fileName}" generated successfully!`, 'success', 6000);

    } catch (error) {
      console.error('PDF generation error:', error);
      showNotification(`❌ Failed to generate PDF report: ${error.message}`, 'error', 8000);
    }
  };

  // All your existing functions remain the same...
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

  const calculateStats = (itemsArray) => {
    if (!Array.isArray(itemsArray)) return { totalItems: 0, totalQuantity: 0, lowStockItems: 0, totalValue: 0 };

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
    
    const totalValue = itemsArray.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      totalValue
    };
  };

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (items && items.length >= 0) {
      const calculatedStats = calculateStats(items);
      setStats(calculatedStats);
    }
  }, [items]);

  const initializeComponent = async () => {
    try {
      setLoading(true);
      
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

      await loadItems();
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
        setItems(data.data.items);
        const calculatedStats = calculateStats(data.data.items);
        setStats(calculatedStats);
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

  const handleDeleteItem = async (itemId) => {
    if (!itemId) {
      showNotification('❌ Invalid item selected for deletion', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          showNotification('✅ Item deleted successfully!', 'success');
          loadItems();
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
        admin: admin
      }
    });
  };

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

      const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}/update-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantityChange: Math.abs(quantity),
          type: type,
          usedBy: admin?.name || 'Admin',
          purpose: type === 'usage' ? 'Manual stock reduction' : 'Manual stock replenishment'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        const action = type === 'usage' ? 'reduced' : 'increased';
        showNotification(`✅ Stock ${action} by ${quantity} units successfully!`, 'success');
        loadItems();
      } else {
        throw new Error(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification(`❌ Failed to update stock: ${error.message}`, 'error');
    }
  };

  const CustomNumberInput = ({ value, onSubmit, placeholder, title, max = 999999, type = 'add' }) => {
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = () => {
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
        const item = items.find(i => i._id === value?.itemId);
        if (item) {
          const currentStock = parseInt(item.quantity) || 0;
          if (numValue > currentStock) {
            setError(`Only ${currentStock} available`);
            return;
          }
        }
      }
      
      setError('');
      onSubmit(numValue);
      setInputValue('');
      setIsEditing(false);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setInputValue('');
        setIsEditing(false);
        setError('');
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="0"
              style={{ 
                width: '50px', 
                fontSize: '10px', 
                padding: '2px 4px',
                border: error ? '1px solid #dc3545' : '1px solid #ccc',
                borderRadius: '3px',
                textAlign: 'center'
              }}
              min="1"
              max={max}
              autoFocus
            />
            <button 
              onClick={handleSubmit} 
              style={{ 
                fontSize: '9px', 
                padding: '3px 5px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ✓
            </button>
            <button 
              onClick={() => { 
                setInputValue(''); 
                setIsEditing(false); 
                setError('');
              }} 
              style={{ 
                fontSize: '9px', 
                padding: '3px 5px',
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
          {error && (
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
      <button
        onClick={() => setIsEditing(true)}
        title={`${title} (max: ${max.toLocaleString()})`}
        style={{ 
          fontSize: '11px', 
          padding: '4px 6px', 
          cursor: 'pointer',
          border: '1px solid #007bff',
          background: '#f8f9fa',
          color: '#007bff',
          borderRadius: '3px',
          transition: 'all 0.2s ease',
          minWidth: '55px'
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
                  onMouseOver={(e) => {
                    if (!notifications.loading) {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!notifications.loading) {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }
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
                  onMouseOver={(e) => {
                    if (!notifications.loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!notifications.loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
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

                {/* ✅ NEW: Auto-Restock Check Button */}
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
                  onMouseOver={(e) => {
                    if (!notifications.loading) {
                      e.target.style.background = '#218838';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!notifications.loading) {
                      e.target.style.background = '#28a745';
                      e.target.style.transform = 'translateY(0)';
                    }
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
                <h3>{(stats.totalQuantity || 0).toLocaleString()}</h3>
                <p>Total Quantity</p>
              </div>
            </div>
            <div className="stat-card" style={{
              background: stats.lowStockItems > 0 ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' : undefined,
              color: stats.lowStockItems > 0 ? 'white' : undefined,
              animation: stats.lowStockItems > 0 ? 'pulse 2s infinite' : 'none'
            }}>
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>{stats.lowStockItems || 0}</h3>
                <p>Low Stock Items</p>
                {stats.lowStockItems > 0 && (
                  <small style={{ opacity: 0.9, fontWeight: '600' }}>Needs attention!</small>
                )}
              </div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={handleViewTotalValue}>
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>${(stats.totalValue || 0).toLocaleString()}</h3>
                <p>Total Value</p>
                <small style={{ fontSize: '12px', opacity: 0.8, color: '#007bff' }}>
                  👆 Click for details
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
                  <th>Item Value</th>
                  <th>Price Trend</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
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
                      <strong>${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}</strong>
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
                        
                        <CustomNumberInput
                          placeholder="+ Stock"
                          title="Add Stock"
                          onSubmit={(qty) => handleUpdateStock(item._id, qty, 'restock')}
                          type="add"
                        />

                        <CustomNumberInput
                          placeholder="- Stock"
                          title="Use Stock"
                          onSubmit={(qty) => handleUpdateStock(item._id, qty, 'usage')}
                          type="remove"
                          max={parseInt(item.quantity) || 0}
                        />

                        {/* ✅ NEW: Auto-Restock Configuration Button */}
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
                          title="Delete Item"
                          style={{ padding: '3px 6px', fontSize: '10px' }}
                        >
                          🗑️ Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

          {/* ADVANCED COLORFUL PDF BUTTON */}
          <div 
            className="floating-report-btn-advanced"
            onClick={generatePDFReport}
            title="Generate Professional PDF Report - Advanced Analytics"
          >
            <div className="btn-background"></div>
            <div className="btn-glow"></div>
            <div className="btn-content">
              <div className="pdf-icon-advanced">📊</div>
              <div className="pdf-text-advanced">
                Generate<br/>PDF Report
              </div>
            </div>
            
            {/* ADVANCED NOTIFICATION BUBBLE */}
            {stats.lowStockItems > 0 && (
              <div className="pdf-notification-bubble-advanced">
                <div className="bubble-pulse"></div>
                <div className="bubble-content">{stats.lowStockItems}</div>
              </div>
            )}
            
            {/* FLOATING PARTICLES */}
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
                showNotification('✅ Item saved successfully!', 'success');
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
                showNotification('✅ Items disposed successfully!', 'success');
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}

          {/* ✅ NEW: Auto-Restock Configuration Modal */}
          {showAutoRestockModal && selectedItemForAutoRestock && (
            <div className="modal-overlay" onClick={() => setShowAutoRestockModal(false)}>
              <div className="modal auto-restock-modal" onClick={e => e.stopPropagation()} style={{
                maxWidth: '600px',
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
                      <div className="form-row" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '20px',
                        marginBottom: '20px'
                      }}>
                        <div className="form-group">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            Maximum Stock Level
                          </label>
                          <input
                            type="number"
                            value={autoRestockConfig.maxStockLevel}
                            onChange={(e) => setAutoRestockConfig(prev => ({
                              ...prev,
                              maxStockLevel: parseInt(e.target.value) || 0
                            }))}
                            min="0"
                            placeholder="Target stock level"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ced4da',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <small style={{ color: '#6c757d', fontSize: '12px' }}>
                            When auto-restocking, fill up to this level
                          </small>
                        </div>
                        
                        <div className="form-group">
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            Reorder Quantity (if using fixed method)
                          </label>
                          <input
                            type="number"
                            value={autoRestockConfig.reorderQuantity}
                            onChange={(e) => setAutoRestockConfig(prev => ({
                              ...prev,
                              reorderQuantity: parseInt(e.target.value) || 0
                            }))}
                            min="0"
                            placeholder="Fixed quantity to order"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ced4da',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <small style={{ color: '#6c757d', fontSize: '12px' }}>
                            Fixed amount to order each time
                          </small>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: '#495057'
                        }}>
                          Restock Method
                        </label>
                        <select
                          value={autoRestockConfig.restockMethod}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            restockMethod: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="to_max">Restock to Maximum Level</option>
                          <option value="fixed_quantity">Use Fixed Quantity</option>
                        </select>
                      </div>

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

                      <div style={{
                        background: '#e7f3ff',
                        padding: '20px',
                        borderRadius: '8px',
                        margin: '20px 0',
                        border: '1px solid #b8daff'
                      }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#004085', fontSize: '16px' }}>
                          📊 Current Status
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Current Stock:</strong> <span style={{ color: '#28a745' }}>{selectedItemForAutoRestock.quantity}</span>
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Minimum Level:</strong> <span style={{ color: '#ffc107' }}>{selectedItemForAutoRestock.minStockLevel}</span>
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Needs Restock:</strong> {
                              selectedItemForAutoRestock.quantity <= selectedItemForAutoRestock.minStockLevel 
                                ? <span style={{ color: '#dc3545', fontWeight: 'bold' }}>🔴 Yes</span> 
                                : <span style={{ color: '#28a745', fontWeight: 'bold' }}>🟢 No</span>
                            }
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Auto-Restock:</strong> <span style={{ 
                              color: autoRestockConfig.enabled ? '#28a745' : '#6c757d',
                              fontWeight: 'bold'
                            }}>
                              {autoRestockConfig.enabled ? '🔄 Enabled' : '⚙️ Setup Required'}
                            </span>
                          </p>
                        </div>
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
                      background: 'linear-gradient(135deg, #28a745, #20c997)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ADVANCED COLORFUL PDF BUTTON CSS */}
        <style jsx>{`
          /* Advanced PDF Report Button with Glassmorphism */
          .floating-report-btn-advanced {
            position: fixed;
            right: 30px;
            bottom: 30px;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            user-select: none;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
              0 8px 32px rgba(31, 38, 135, 0.37),
              0 20px 60px rgba(31, 38, 135, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          /* Animated Background Gradient */
          .btn-background {
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            background: linear-gradient(
              45deg,
              #FF6B6B,
              #4ECDC4,
              #45B7D1,
              #96CEB4,
              #FFEAA7,
              #DDA0DD,
              #98D8C8,
              #F7DC6F
            );
            background-size: 400% 400%;
            animation: gradientShift 4s ease infinite;
            z-index: -2;
          }

          /* Glowing Effect */
          .btn-glow {
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border-radius: 50%;
            background: radial-gradient(
              circle,
              rgba(255, 107, 107, 0.4) 0%,
              rgba(78, 205, 196, 0.3) 25%,
              rgba(69, 183, 209, 0.3) 50%,
              rgba(150, 206, 180, 0.2) 75%,
              transparent 100%
            );
            filter: blur(10px);
            opacity: 0.8;
            animation: glowPulse 3s ease-in-out infinite;
            z-index: -1;
          }

          /* Button Content */
          .btn-content {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            z-index: 1;
          }

          .pdf-icon-advanced {
            font-size: 28px;
            margin-bottom: 4px;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
            animation: iconBounce 2s ease-in-out infinite;
          }

          .pdf-text-advanced {
            font-size: 11px;
            text-align: center;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          /* Advanced Notification Bubble */
          .pdf-notification-bubble-advanced {
            position: absolute;
            top: -12px;
            right: -12px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            overflow: hidden;
            background: linear-gradient(135deg, #FF416C, #FF4B2B, #FF6B6B);
            box-shadow: 
              0 4px 20px rgba(255, 65, 108, 0.5),
              0 8px 40px rgba(255, 75, 43, 0.3);
            border: 3px solid rgba(255, 255, 255, 0.8);
            animation: bubbleFloat 3s ease-in-out infinite;
          }

          .bubble-pulse {
            position: absolute;
            top: -5px;
            left: -5px;
            right: -5px;
            bottom: -5px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 65, 108, 0.6) 0%, transparent 70%);
            animation: bubblePulse 2s ease-in-out infinite;
          }

          .bubble-content {
            position: relative;
            color: white;
            font-size: 13px;
            font-weight: 900;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            z-index: 1;
          }

          /* Floating Particles */
          .floating-particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            border-radius: 50%;
          }

          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            opacity: 0.7;
          }

          .particle-1 {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            top: 20%;
            left: 80%;
            animation: particleFloat1 4s ease-in-out infinite;
          }

          .particle-2 {
            background: linear-gradient(45deg, #45B7D1, #96CEB4);
            top: 70%;
            left: 20%;
            animation: particleFloat2 3s ease-in-out infinite;
          }

          .particle-3 {
            background: linear-gradient(45deg, #FFEAA7, #DDA0DD);
            top: 30%;
            left: 30%;
            animation: particleFloat3 5s ease-in-out infinite;
          }

          .particle-4 {
            background: linear-gradient(45deg, #98D8C8, #F7DC6F);
            top: 80%;
            left: 70%;
            animation: particleFloat4 3.5s ease-in-out infinite;
          }

          /* Hover Effects */
          .floating-report-btn-advanced:hover {
            transform: scale(1.15) translateY(-5px);
            box-shadow: 
              0 15px 50px rgba(31, 38, 135, 0.5),
              0 25px 80px rgba(31, 38, 135, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }

          .floating-report-btn-advanced:hover .btn-background {
            animation-duration: 2s;
            background-size: 600% 600%;
          }

          .floating-report-btn-advanced:hover .btn-glow {
            opacity: 1;
            filter: blur(15px);
          }

          .floating-report-btn-advanced:hover .pdf-icon-advanced {
            transform: rotate(360deg) scale(1.1);
            transition: transform 0.6s ease;
          }

          .floating-report-btn-advanced:hover .floating-particles .particle {
            animation-duration: 1.5s;
          }

          /* Active State */
          .floating-report-btn-advanced:active {
            transform: scale(1.05) translateY(-2px);
          }

          /* Animations */
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes glowPulse {
            0%, 100% { 
              opacity: 0.8; 
              transform: scale(1); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.05); 
            }
          }

          @keyframes iconBounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0) rotate(0deg);
            }
            40% {
              transform: translateY(-8px) rotate(5deg);
            }
            60% {
              transform: translateY(-4px) rotate(-5deg);
            }
          }

          @keyframes bubbleFloat {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg); 
            }
            25% { 
              transform: translateY(-5px) rotate(90deg); 
            }
            50% { 
              transform: translateY(-8px) rotate(180deg); 
            }
            75% { 
              transform: translateY(-3px) rotate(270deg); 
            }
          }

          @keyframes bubblePulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 0.6; 
            }
            50% { 
              transform: scale(1.3); 
              opacity: 0.3; 
            }
          }

          @keyframes particleFloat1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
            25% { transform: translate(-10px, -10px) rotate(90deg); opacity: 1; }
            50% { transform: translate(-5px, -15px) rotate(180deg); opacity: 0.5; }
            75% { transform: translate(5px, -8px) rotate(270deg); opacity: 0.8; }
          }

          @keyframes particleFloat2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
            33% { transform: translate(8px, -12px) rotate(120deg); opacity: 1; }
            66% { transform: translate(-3px, -6px) rotate(240deg); opacity: 0.4; }
          }

          @keyframes particleFloat3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.8; }
            20% { transform: translate(-8px, 5px) rotate(72deg); opacity: 0.6; }
            40% { transform: translate(3px, -10px) rotate(144deg); opacity: 1; }
            60% { transform: translate(10px, -3px) rotate(216deg); opacity: 0.7; }
            80% { transform: translate(-5px, 8px) rotate(288deg); opacity: 0.5; }
          }

          @keyframes particleFloat4 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
            50% { transform: translate(-12px, 12px) rotate(180deg); opacity: 1; }
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .floating-report-btn-advanced {
              right: 20px;
              bottom: 20px;
              width: 75px;
              height: 75px;
            }
            
            .pdf-icon-advanced {
              font-size: 24px;
            }
            
            .pdf-text-advanced {
              font-size: 10px;
            }

            .pdf-notification-bubble-advanced {
              width: 28px;
              height: 28px;
              top: -10px;
              right: -10px;
            }

            .bubble-content {
              font-size: 12px;
            }
          }

          @media (max-width: 480px) {
            .floating-report-btn-advanced {
              right: 15px;
              bottom: 15px;
              width: 70px;
              height: 70px;
            }
            
            .pdf-icon-advanced {
              font-size: 22px;
            }
            
            .pdf-text-advanced {
              font-size: 9px;
            }

            .pdf-notification-bubble-advanced {
              width: 26px;
              height: 26px;
              top: -8px;
              right: -8px;
            }

            .bubble-content {
              font-size: 11px;
            }
          }

          /* Print styles - hide button when printing */
          @media print {
            .floating-report-btn-advanced {
              display: none !important;
            }
          }

          /* Dark mode enhancements */
          @media (prefers-color-scheme: dark) {
            .floating-report-btn-advanced {
              backdrop-filter: blur(25px);
              border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .btn-glow {
              opacity: 1;
            }
          }

          /* High contrast mode */
          @media (prefers-contrast: high) {
            .floating-report-btn-advanced {
              border: 3px solid white;
              box-shadow: 0 0 0 2px black, 0 8px 32px rgba(0, 0, 0, 0.8);
            }
          }

          /* Reduced motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            .floating-report-btn-advanced,
            .btn-background,
            .btn-glow,
            .pdf-icon-advanced,
            .pdf-notification-bubble-advanced,
            .bubble-pulse,
            .particle {
              animation: none !important;
              transition: none !important;
            }
          }

          /* Focus states for accessibility */
          .floating-report-btn-advanced:focus {
            outline: 3px solid #4A90E2;
            outline-offset: 4px;
          }

          /* High performance mode */
          @media (update: slow) {
            .floating-report-btn-advanced * {
              animation-duration: 6s !important;
            }
          }

          @keyframes pulse {
            0% { 
              transform: scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: scale(1.05); 
              opacity: 0.8; 
            }
            100% { 
              transform: scale(1); 
              opacity: 1; 
            }
          }

          @keyframes spin {
            0% { 
              transform: rotate(0deg); 
            }
            100% { 
              transform: rotate(360deg); 
            }
          }
        `}</style>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default SurgicalItemsManagement;
