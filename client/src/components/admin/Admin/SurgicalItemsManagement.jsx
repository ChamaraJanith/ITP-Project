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
  
  // Cumulative purchase tracking
  const [cumulativePurchases, setCumulativePurchases] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  
  // Enhanced stats
  const [inventoryStats, setInventoryStats] = useState({
    currentValue: 0,
    cumulativePurchases: 0,
    usedValue: 0,
    deletedValue: 0
  });
  
  // Supplier spending state
  const [supplierSpending, setSupplierSpending] = useState({
    totalSpending: 0,
    monthlySpending: 0,
    topSuppliers: [],
    totalOrders: 0
  });
  
  // Restock spending tracking
  const [restockSpending, setRestockSpending] = useState({
    totalRestockValue: 0,
    monthlyRestockValue: 0,
    restockHistory: []
  });
  
  const [notifications, setNotifications] = useState({
    loading: false,
    message: '',
    type: ''
  });

  // Auto-restock state management with user-controlled quantities
  const [autoRestockConfig, setAutoRestockConfig] = useState({});
  const [showAutoRestockModal, setShowAutoRestockModal] = useState(false);
  const [selectedItemForAutoRestock, setSelectedItemForAutoRestock] = useState(null);

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
  }

  // Load cumulative purchases from localStorage
  const loadCumulativePurchases = () => {
    try {
      const stored = localStorage.getItem('healx_cumulative_purchases');
      if (stored) {
        const data = JSON.parse(stored);
        setCumulativePurchases(data.value || 0);
        setPurchaseHistory(data.history || []);
        return data.value || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error loading cumulative purchases:', error);
      return 0;
    }
  };

  // Save cumulative purchases to localStorage
  const saveCumulativePurchases = (value, action = 'update', details = {}) => {
    try {
      const data = {
        value: value,
        history: [
          ...purchaseHistory,
          {
            action,
            value,
            timestamp: new Date().toISOString(),
            admin: admin?.name || 'System',
            ...details
          }
        ].slice(-100) // Keep last 100 entries
      };
      
      localStorage.setItem('healx_cumulative_purchases', JSON.stringify(data));
      setCumulativePurchases(value);
      setPurchaseHistory(data.history);
    } catch (error) {
      console.error('Error saving cumulative purchases:', error);
    }
  };

  // Load restock spending from localStorage

  // Save restock spending to localStorage

  // Add to cumulative purchases (NEVER decreases)
  const addToCumulativePurchases = (amount, action = 'purchase', details = {}) => {
    const newValue = cumulativePurchases + amount;
    saveCumulativePurchases(newValue, action, details);
    return newValue;
  };

  // Initialize cumulative purchases from existing items
  const initializeCumulativePurchases = () => {
    const storedValue = loadCumulativePurchases();
    
    // Calculate current total investment from items
    const currentTotalInvestment = items.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      const totalPurchased = parseInt(item.totalPurchased || item.originalQuantity || item.quantity || 0);
      return sum + (price * totalPurchased);
    }, 0);
    
    // Use the higher of stored value or current calculation
    const newValue = Math.max(storedValue, currentTotalInvestment);
    
    if (newValue > storedValue) {
      saveCumulativePurchases(newValue, 'initialize', { 
        reason: 'Calculated from existing items',
        itemCount: items.length
      });
    }
    
    return newValue;
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

  // Replace the localStorage-based functions with these API calls

// Load restock spending from server
const loadRestockSpending = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/restock-spending`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setRestockSpending({
          totalRestockValue: data.data.totalRestockValue || 0,
          monthlyRestockValue: data.data.monthlyRestockValue || 0,
          restockHistory: data.data.restockHistory || []
        });
        return data.data.totalRestockValue || 0;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error loading restock spending:', error);
    return 0;
  }
};

// Save restock spending to server
const saveRestockSpending = async (restockValue, action = 'restock', details = {}) => {
  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Check if this restock is from current month
    const isCurrentMonth = details.timestamp ? 
      new Date(details.timestamp).getMonth() === currentMonth && 
      new Date(details.timestamp).getFullYear() === currentYear : 
      true;
    
    const updatedMonthlyValue = isCurrentMonth ? 
      restockSpending.monthlyRestockValue + restockValue : 
      restockSpending.monthlyRestockValue;
    
    const updatedHistory = [
      ...restockSpending.restockHistory,
      {
        action,
        restockValue,
        timestamp: new Date().toISOString(),
        admin: admin?.name || 'System',
        ...details
      }
    ].slice(-100); // Keep last 100 entries
    
    const updatedData = {
      totalRestockValue: restockSpending.totalRestockValue + restockValue,
      monthlyRestockValue: updatedMonthlyValue,
      restockHistory: updatedHistory
    };
    
    const response = await fetch(`${API_BASE_URL}/restock-spending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setRestockSpending(updatedData);
      }
    }
  } catch (error) {
    console.error('Error saving restock spending:', error);
  }
};

// Reset restock spending function
const handleResetRestockSpending = async () => {
  if (window.confirm(`Are you sure you want to reset the restock spending?\n\nCurrent restock spending: $${restockSpending.totalRestockValue.toLocaleString()}\nThis will set all restock values to zero.\n\nThis action cannot be undone.`)) {
    try {
      const response = await fetch(`${API_BASE_URL}/restock-spending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          totalRestockValue: 0,
          monthlyRestockValue: 0,
          restockHistory: []
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRestockSpending({
            totalRestockValue: 0,
            monthlyRestockValue: 0,
            restockHistory: []
          });
          showNotification(`✅ Restock spending reset to $0`, 'success');
        }
      }
    } catch (error) {
      console.error('Error resetting restock spending:', error);
      showNotification('❌ Failed to reset restock spending', 'error');
    }
  }
};

  // 🔥 ENHANCED Auto-restock check function with proper value tracking
  const handleAutoRestockCheck = async () => {
    try {
      setNotifications({ 
        loading: true, 
        message: 'Processing auto-restock for low stock items...', 
        type: 'info' 
      });
      
      // Identify low stock items with valid prices
      const lowStockItems = items
        .filter(item => {
          const quantity = parseInt(item.quantity) || 0;
          const minStock = parseInt(item.minStockLevel) || 0;
          const price = parseFloat(item.price) || 0;
          return quantity <= minStock && price > 0 && item.autoRestock?.enabled;
        })
        .map(item => ({
          itemId: item._id,
          itemName: item.name || 'Unknown Item',
          currentQuantity: parseInt(item.quantity) || 0,
          minStockLevel: parseInt(item.minStockLevel) || 0,
          price: parseFloat(item.price) || 0,
          isOutOfStock: parseInt(item.quantity) === 0,
          category: item.category || 'Other',
          supplier: item.supplier?.name || 'N/A',
          autoRestockConfig: item.autoRestock || null
        }));

      console.log(`🎯 Found ${lowStockItems.length} low stock items for auto-restock:`, lowStockItems);

      if (lowStockItems.length === 0) {
        showNotification('✅ All items are well-stocked or need price/auto-restock configuration!', 'success');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auto-restock/check-and-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          respectManualQuantities: true,
          preserveValue: true,
          lowStockItems: lowStockItems,
          processOnlyLowStock: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Auto-restock response data:', data);
      
      if (data.success) {
        const results = data.data?.results || [];
        const totalValue = data.data?.totalRestockValue || 0;
        const itemsProcessed = data.data?.itemsProcessed || 0;
        
        console.log('📊 Processing results:', {
          results,
          totalValue,
          itemsProcessed
        });

        // 🔥 IMPORTANT: Track restock spending in frontend
        if (totalValue > 0) {
          // Add to restock spending
          saveRestockSpending(totalValue, 'auto-restock-bulk', {
            itemCount: itemsProcessed,
            timestamp: new Date().toISOString(),
            source: 'auto-restock-check',
            details: results.map(r => ({
              name: r.itemName,
              quantity: r.restockQuantity || 0,
              value: r.restockValue || 0
            }))
          });

          // Also add to cumulative purchases (since restocking means buying more inventory)
          addToCumulativePurchases(totalValue, 'auto-restock', {
            itemCount: itemsProcessed,
            totalValue: totalValue,
            source: 'auto-restock-check'
          });
        }

        // Show detailed success message
        let message = `✅ Auto-restock completed!\n`;
        message += `📦 Processed: ${itemsProcessed} items\n`;
        message += `💰 Total value: $${totalValue.toFixed(2)}\n`;
        
        if (results.length > 0) {
          message += `\n📋 Details:\n`;
          results.slice(0, 3).forEach(result => {
            if (result.success) {
              message += `• ${result.itemName}: +${result.restockQuantity || 0} units ($${(result.restockValue || 0).toFixed(2)})\n`;
            }
          });
          if (results.length > 3) {
            message += `• ...and ${results.length - 3} more items\n`;
          }
        }

        showNotification(message, 'success');
        
        // Reload items to show updated quantities and values
        await loadItems();
        
        console.log('✅ Auto-restock completed successfully with value tracking');
        
      } else {
        throw new Error(data.message || 'Failed to perform auto-restock check');
      }
    } catch (error) {
      console.error('Auto-restock error:', error);
      showNotification(`❌ Auto-restock failed: ${error.message}`, 'error');
    }
  };

  // 🔥 NEW: Enhanced Restock Spending Section Component
  const RestockSpendingSection = () => {
    return (
      <div className="restock-spending-section" style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>Auto-Restock Value Tracking</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              LIVE TRACKING
            </div>
            {admin?.role === 'admin' && (
              <button
                onClick={handleResetRestockSpending}
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
                Reset
              </button>
            )}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* Total Restock Value */}
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            border: restockSpending.totalRestockValue > 0 ? '3px solid rgba(40,167,69,0.6)' : 'none'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: restockSpending.totalRestockValue > 0 ? '#ffffff' : '#ffffff'
            }}>
              ${restockSpending.totalRestockValue.toLocaleString()}
            </div>
            <div style={{ opacity: 0.9, fontWeight: 'bold' }}>Total Auto-Restock Value</div>
            <small style={{ opacity: 0.8 }}>All automatic restocking spending</small>
          </div>

          {/* Monthly Restock Value */}
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              ${restockSpending.monthlyRestockValue.toLocaleString()}
            </div>
            <div style={{ opacity: 0.9, fontWeight: 'bold' }}>This Month Restock</div>
            <small style={{ opacity: 0.8 }}>
              {restockSpending.totalRestockValue > 0 
                ? `${((restockSpending.monthlyRestockValue / restockSpending.totalRestockValue) * 100).toFixed(1)}% of total`
                : 'No restock this month'
              }
            </small>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Recent Auto-Restock</h4>
            {restockSpending.restockHistory.length > 0 ? (
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {restockSpending.restockHistory.slice(-3).map((entry, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {entry.details?.itemCount || 1} items restocked
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {new Date(entry.timestamp).toLocaleDateString()} by {entry.admin}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        +${(entry.restockValue || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', opacity: 0.8 }}>
                No auto-restock history available
              </div>
            )}
          </div>
        </div>

        {/* Auto-restock Summary */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Auto-Restock Value Tracking:</strong> This system tracks all monetary values from automatic restocking operations. 
          Each time auto-restock runs, the system calculates the total value of items added to inventory and records it here.
          
          <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.9 }}>
            <strong>Formula:</strong> Restock Value = (Items Restocked × Unit Price) for each processed item
          </div>
          
          {restockSpending.restockHistory.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.9 }}>
              <strong>Last auto-restock:</strong> {new Date(restockSpending.restockHistory[restockSpending.restockHistory.length - 1]?.timestamp).toLocaleString()} by {restockSpending.restockHistory[restockSpending.restockHistory.length - 1]?.admin}
            </div>
          )}
        </div>
      </div>
    );
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

  // Calculate stats with cumulative purchase tracking
  const calculateInventoryStats = (itemsArray) => {
    if (!Array.isArray(itemsArray)) {
      return { 
        totalItems: 0, 
        totalQuantity: 0, 
        lowStockItems: 0, 
        currentValue: 0,
        cumulativePurchases: cumulativePurchases,
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

    // Used value
    const usedValue = Math.max(0, cumulativePurchases - currentValue);

    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      currentValue,
      cumulativePurchases: cumulativePurchases,
      usedValue,
      deletedValue: 0 // We don't track deleted items separately since cumulative never decreases
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
      const totalCumulativePurchases = cumulativePurchases;
      const totalRestockValue = restockSpending.totalRestockValue;
      const totalUsedValue = Math.max(0, cumulativePurchases - totalCurrentValue);
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
      doc.rect(20, bandY, pageWidth - 30, 16);

      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const line1 = [
        `Total Items: ${totalItems}`,
        `Current Value: $${totalCurrentValue.toLocaleString()}`,
        `Total Purchases: $${totalCumulativePurchases.toLocaleString()}`,
        `Restock Value: $${totalRestockValue.toLocaleString()}`
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

      // Add cumulative purchase tracking note
      doc.setFontSize(8);
      doc.setTextColor(40, 167, 69);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `🛡 Total Purchases: $${totalCumulativePurchases.toLocaleString()} - Restock Value: $${totalRestockValue.toLocaleString()}`,
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
        showNotification('✅ Test email sent successfully to cjtmadmhealx@gmail.com!', 'success');
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

  // Updated calculateStats to use cumulative purchase tracking
  const calculateStats = (itemsArray) => {
    const inventoryData = calculateInventoryStats(itemsArray);
    return {
      totalItems: inventoryData.totalItems,
      totalQuantity: inventoryData.totalQuantity,
      lowStockItems: inventoryData.lowStockItems,
      currentValue: inventoryData.currentValue,
      cumulativePurchases: inventoryData.cumulativePurchases,
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
      
      // Initialize cumulative purchases
      initializeCumulativePurchases();
      
      const inventoryData = calculateInventoryStats(items);
      setInventoryStats(inventoryData);
    }
  }, [items, cumulativePurchases]);

const initializeComponent = async () => {
  try {
    setLoading(true);
    
    // Load cumulative purchases first
    loadCumulativePurchases();
    
    // Load restock spending from server
    await loadRestockSpending();
    
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
          totalPurchased: item.totalPurchased || item.originalQuantity || item.quantity || 0
        }));
        
        setItems(enhancedItems);
        
        // Initialize cumulative purchases after loading items
        setTimeout(() => {
          initializeCumulativePurchases();
        }, 100);
        
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

  // Delete item without affecting cumulative purchases
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

    if (window.confirm(`Are you sure you want to delete "${itemToDelete.name}"? \n\n⚠️ IMPORTANT: \n- Item will be removed from inventory\n- Total purchases will remain tracked: $${cumulativePurchases.toLocaleString()}\n- Item value: $${itemValue.toFixed(2)}\n\nThis action cannot be undone.`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/surgical-items/${itemId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          // Cumulative purchases is NOT changed when deleting
          showNotification(`✅ Item "${itemToDelete.name}" deleted successfully! Total purchases tracked: $${cumulativePurchases.toLocaleString()}`, 'success');
          loadItems();
          
          // Log the deletion in purchase history
          const updatedHistory = [
            ...purchaseHistory,
            {
              action: 'item-deleted',
              value: cumulativePurchases,
              itemName: itemToDelete.name,
              itemValue: itemValue,
              timestamp: new Date().toISOString(),
              admin: admin?.name || 'System',
              note: `Item deleted but total purchases maintained`
            }
          ].slice(-100);
          
          const data = {
            value: cumulativePurchases,
            history: updatedHistory
          };
          
          localStorage.setItem('healx_cumulative_purchases', JSON.stringify(data));
          setPurchaseHistory(updatedHistory);
          
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
        cumulativePurchases: cumulativePurchases,
        restockSpending: restockSpending
      }
    });
  };

  // Enhanced stock update with cumulative purchase tracking
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
        
        // Enhanced success message with cumulative purchase tracking
        if (type === 'restock') {
          const addedValue = (parseFloat(item.price) || 0) * quantity;
          
          // KEY CHANGE: Always add to cumulative purchases when restocking
          const newCumulativePurchases = addToCumulativePurchases(addedValue, 'restock', {
            itemName: item.name,
            quantity: quantity,
            unitPrice: parseFloat(item.price) || 0
          });
          
          // Add to restock spending tracking
          saveRestockSpending(addedValue, 'restock', {
            itemName: item.name,
            quantity: quantity,
            unitPrice: parseFloat(item.price) || 0,
            timestamp: new Date().toISOString()
          });
          
          if (hasAutoRestockManualQuantity) {
            showNotification(`✅ Stock ${action} by ${quantity} units using your auto-restock setting! Added $${addedValue.toFixed(2)} to total purchases. New total: $${newCumulativePurchases.toLocaleString()}`, 'success');
          } else {
            showNotification(`✅ Stock ${action} by ${quantity} units! Added $${addedValue.toFixed(2)} to total purchases. New total: $${newCumulativePurchases.toLocaleString()}`, 'success');
          }
        } else {
          showNotification(`✅ Stock ${action} by ${quantity} units! Total purchases maintained: $${cumulativePurchases.toLocaleString()}`, 'success');
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

  // Reset Cumulative Purchases function (for admin use)
  const handleResetCumulativePurchases = () => {
    if (window.confirm(`Are you sure you want to reset the total purchases?\n\nCurrent total purchases: $${cumulativePurchases.toLocaleString()}\nThis will recalculate from current inventory value: $${inventoryStats.currentValue.toLocaleString()}\n\nThis action cannot be undone.`)) {
      const newValue = inventoryStats.currentValue;
      saveCumulativePurchases(newValue, 'admin-reset', { 
        reason: 'Reset to current inventory value',
        previousValue: cumulativePurchases
      });
      showNotification(`✅ Total purchases reset to $${newValue.toLocaleString()}`, 'success');
    }
  };

  // Reset Restock Spending function (for admin use)

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

          {/* Enhanced notification section with restock value display */}
          <div className="notification-section" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>HealX Auto-Restock Center</h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                  Automated inventory management with value tracking
                </p>
                <small style={{ opacity: 0.8, fontSize: '12px' }}>
                  Total items: {stats.totalItems} | Low stock: {stats.lowStockItems} | 
                  Total restock value: <strong>${restockSpending.totalRestockValue.toLocaleString()}</strong>
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
                  Test Email
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
                  Send Low Stock Alert
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
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: notifications.loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '700',
                    transition: 'all 0.3s ease',
                    opacity: notifications.loading ? 0.7 : 1,
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
                  }}
                >
                  🚀 AUTO-RESTOCK CHECK
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    With Value Tracking
                  </div>
                </button>
              </div>
            </div>

            {/* Enhanced notification display */}
            {notifications.message && (
              <div style={{
                marginTop: '15px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: notifications.type === 'success' 
                  ? 'rgba(40, 167, 69, 0.2)' 
                  : notifications.type === 'error' 
                    ? 'rgba(220, 53, 69, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${
                  notifications.type === 'success' 
                    ? 'rgba(40, 167, 69, 0.4)' 
                    : notifications.type === 'error' 
                      ? 'rgba(220, 53, 69, 0.4)' 
                      : 'rgba(255, 255, 255, 0.3)'
                }`,
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'pre-line' // This allows \n line breaks to display properly
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

          {/* 🔥 NEW: Use the RestockSpendingSection component */}
          <RestockSpendingSection />

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

          {/* Cumulative Purchase Tracking Section */}
          <div className="inventory-value-section" style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '25px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>🛡️ Total Purchase Tracking System</h3>
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
                    onClick={handleResetCumulativePurchases}
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
                    🔧 Reset
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
                    ${cumulativePurchases?.toLocaleString() || '0'}
                  </div>
                  <div style={{ fontSize: '16px', opacity: 0.95, fontWeight: 'bold' }}>🛡️ TOTAL PURCHASES</div>
                  <small style={{ fontSize: '12px', opacity: 0.9 }}>ALL BUYING TRACKED</small>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ${Math.max(0, cumulativePurchases - inventoryStats.currentValue)?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Used/Deleted Value</div>
                <small style={{ fontSize: '12px', opacity: '0.8' }}>Still tracked</small>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {cumulativePurchases > 0 ? '100%' : '0%'}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Investment Tracking</div>
                <small style={{ fontSize: '12px', opacity: '0.8' }}>Always accurate</small>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <strong>🛡️ Total Purchase Tracking:</strong> Your system tracks <strong>ALL</strong> inventory purchases made over time, 
              creating a cumulative total of <strong>${cumulativePurchases?.toLocaleString()}</strong>. 
              This value <strong>NEVER decreases</strong> - it only grows with each new purchase, providing an accurate 
              record of your total spending on inventory regardless of usage or deletion.
              
              <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.9 }}>
                <strong>Formula:</strong> Total Purchases = Current Stock Value + All Restock Order Values
              </div>
              
              {purchaseHistory.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.9 }}>
                  <strong>Last updated:</strong> {new Date(purchaseHistory[purchaseHistory.length - 1]?.timestamp).toLocaleString()} 
                  by {purchaseHistory[purchaseHistory.length - 1]?.admin}
                </div>
              )}
            </div>
          </div>

          {/* Stats Display */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Items</h3>
              <span className="stat-number">{stats.totalItems || 0}</span>
            </div>
            <div className="stat-card">
              <h3>Current Value</h3>
              <span className="stat-number">${(stats.currentValue || 0).toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <h3>Low Stock Items</h3>
              <span className="stat-number low-stock">{stats.lowStockItems || 0}</span>
            </div>
            <div className="stat-card">
              <h3>Total Value</h3>
              <span className="stat-number highlight">${(cumulativePurchases || 0).toLocaleString()}</span>
            </div>
            <button onClick={generateSurgicalItemsPDF} className="export-pdf-btn">
              📄 Export PDF Report
            </button>
          </div>

          {/* Filters */}
          <div className="filters-container">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Items Table */}
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
                              {item.description.substring(0, 40)}...
                            </small>
                          )}
                          {/* Auto-restock indicator */}
                          {item.autoRestock?.enabled && (
                            <div style={{
                              display: 'inline-block',
                              background: '#e8f5e8',
                              color: '#28a745',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              marginTop: '4px',
                              border: '1px solid #28a745'
                            }}>
                              🎯 AUTO-RESTOCK: {item.autoRestock.reorderQuantity || 0} units
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">{item.category || 'Other'}</span>
                      </td>
                      <td>
                        <ItemStockChart item={item} />
                      </td>
                      <td>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: getStatusColor(item.quantity, item.minStockLevel),
                            minWidth: '30px',
                            textAlign: 'center'
                          }}>
                            {parseInt(item.quantity) || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', color: '#dc3545', fontWeight: 'bold' }}>
                        {parseInt(item.minStockLevel) || 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${(parseFloat(item.price) || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${currentValue.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
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
                      <td>
                        <div className="supplier-info">
                          <strong>{item.supplier?.name || 'N/A'}</strong>
                          {item.supplier?.email && (
                            <small style={{ display: 'block', color: '#666' }}>
                              {item.supplier.email}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '4px', 
                            alignItems: 'center' 
                          }}>
                            {/* Stock Management */}
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <CustomNumberInput
                                onSubmit={(qty) => handleUpdateStock(item._id, qty, 'restock')}
                                placeholder="+ Add"
                                title="Add Stock"
                                type="add"
                                item={item}
                              />
                              <CustomNumberInput
                                onSubmit={(qty) => handleUpdateStock(item._id, qty, 'usage')}
                                placeholder="- Use"
                                title="Remove Stock"
                                max={parseInt(item.quantity) || 0}
                                type="remove"
                                item={item}
                              />
                            </div>
                            
                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button
                                onClick={() => handleEditItem(item)}
                                title="Edit Item"
                                style={{
                                  fontSize: '10px',
                                  padding: '3px 6px',
                                  background: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✏️
                              </button>
                              
                              <button
                                onClick={() => handleConfigureAutoRestock(item)}
                                title="Configure Auto-Restock"
                                style={{
                                  fontSize: '10px',
                                  padding: '3px 6px',
                                  background: item.autoRestock?.enabled ? '#28a745' : '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                🎯
                              </button>
                              
                              <button
                                onClick={() => handleSendItemNotification(item)}
                                title="Send Alert"
                                style={{
                                  fontSize: '10px',
                                  padding: '3px 6px',
                                  background: getStatusText(item.quantity, item.minStockLevel) === 'Available' ? '#6c757d' : '#ffc107',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                📧
                              </button>
                              
                              <button
                                onClick={() => handleDeleteItem(item._id)}
                                title="Delete Item"
                                style={{
                                  fontSize: '10px',
                                  padding: '3px 6px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const start = Math.max(1, currentPage - 2);
                    const end = Math.min(totalPages, start + 4);
                    const adjustedStart = Math.max(1, end - 4);
                    pageNum = adjustedStart + i;
                  }
                  
                  if (pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Modals */}
          {showAddModal && (
            <SurgicalItemModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSave={() => {
                setShowAddModal(false);
                loadItems();
                // Add value to cumulative purchases if new item is added
                const newItemValue = 0; // This would be calculated from the modal
                // addToCumulativePurchases(newItemValue, 'new-item', { source: 'add-modal' });
              }}
              categories={categories}
              suppliers={[]}
              admin={admin}
            />
          )}

          {showEditModal && selectedItem && (
            <SurgicalItemModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={() => {
                setShowEditModal(false);
                loadItems();
              }}
              item={selectedItem}
              categories={categories}
              suppliers={[]}
              admin={admin}
            />
          )}

          {showDisposeModal && (
  <DisposeModal
    isOpen={showDisposeModal}
    onClose={() => setShowDisposeModal(false)}
    items={items}
    onSuccess={() => {
      setShowDisposeModal(false);
      loadItems(); // Refresh items
    }}
    admin={admin}
    apiBaseUrl={API_BASE_URL}
    showNotification={showNotification} // Pass notification function
  />
)}


          {/* Auto-Restock Configuration Modal */}
          {showAutoRestockModal && selectedItemForAutoRestock && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '600px', padding: '30px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px',
                  borderBottom: '2px solid #f0f0f0',
                  paddingBottom: '15px'
                }}>
                  <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
                    🎯 Configure Auto-Restock for {selectedItemForAutoRestock.name}
                  </h2>
                  <button
                    onClick={() => setShowAutoRestockModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <div style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      <strong>Current Status:</strong> Stock: {selectedItemForAutoRestock.quantity}, 
                      Min Level: {selectedItemForAutoRestock.minStockLevel}, 
                      Price: ${parseFloat(selectedItemForAutoRestock.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={autoRestockConfig.enabled}
                        onChange={(e) => setAutoRestockConfig(prev => ({
                          ...prev,
                          enabled: e.target.checked
                        }))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      🎯 Enable Auto-Restock
                    </label>
                  </div>

                  {autoRestockConfig.enabled && (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                          📊 Maximum Stock Level
                        </label>
                        <input
                          type="number"
                          value={autoRestockConfig.maxStockLevel || ''}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            maxStockLevel: parseInt(e.target.value) || 0
                          }))}
                          placeholder="Maximum stock to maintain"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                          min="1"
                        />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                          🎯 YOUR Restock Quantity (YOU Control This!)
                        </label>
                        <input
                          type="number"
                          value={autoRestockConfig.reorderQuantity || ''}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            reorderQuantity: parseInt(e.target.value) || 0
                          }))}
                          placeholder="How many units to add when restocking"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '3px solid #28a745',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            background: '#f8fff8'
                          }}
                          min="1"
                        />
                        <small style={{ color: '#28a745', fontSize: '12px', fontWeight: 'bold' }}>
                          This is YOUR quantity - the system will use exactly this amount when auto-restocking
                        </small>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                          ⚙️ Restock Method
                        </label>
                        <select
                          value={autoRestockConfig.restockMethod || 'fixed_quantity'}
                          onChange={(e) => setAutoRestockConfig(prev => ({
                            ...prev,
                            restockMethod: e.target.value
                          }))}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="fixed_quantity">🎯 Use My Fixed Quantity (Recommended)</option>
                          <option value="to_max">📊 Calculate to Max Level</option>
                        </select>
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          {autoRestockConfig.restockMethod === 'fixed_quantity' ? 
                            'Always use your specified quantity' : 
                            'Calculate quantity to reach maximum level'
                          }
                        </small>
                      </div>

                      {autoRestockConfig.reorderQuantity > 0 && (
                        <div style={{
                          background: '#e8f5e8',
                          border: '2px solid #28a745',
                          borderRadius: '8px',
                          padding: '15px',
                          marginBottom: '20px'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
                            🎯 Your Auto-Restock Configuration:
                          </h4>
                          <p style={{ margin: '0 0 5px 0' }}>
                            <strong>When stock ≤ {selectedItemForAutoRestock.minStockLevel}:</strong>
                          </p>
                          <p style={{ margin: '0 0 5px 0' }}>
                            → Add exactly <strong>{autoRestockConfig.reorderQuantity} units</strong>
                          </p>
                          <p style={{ margin: 0 }}>
                            → Cost: <strong>${((parseFloat(selectedItemForAutoRestock.price) || 0) * autoRestockConfig.reorderQuantity).toFixed(2)}</strong>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  justifyContent: 'flex-end',
                  borderTop: '1px solid #eee',
                  paddingTop: '20px'
                }}>
                  <button
                    onClick={() => setShowAutoRestockModal(false)}
                    style={{
                      padding: '12px 24px',
                      border: '2px solid #6c757d',
                      background: 'white',
                      color: '#6c757d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAutoRestockConfig}
                    disabled={autoRestockConfig.enabled && (!autoRestockConfig.reorderQuantity || autoRestockConfig.reorderQuantity <= 0)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: autoRestockConfig.enabled && autoRestockConfig.reorderQuantity > 0 ? '#28a745' : '#6c757d',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: autoRestockConfig.enabled && autoRestockConfig.reorderQuantity > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    🎯 Save Configuration
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




                      