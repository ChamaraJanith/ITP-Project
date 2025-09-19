import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import "./ExpenseTracking.css";

const EXPENSE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#FF6B6B", "#4ECDC4"];
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const SURGICAL_ITEMS_API = "http://localhost:7000/api/inventory/surgical-items";

const ExpenseTracking = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenseData, setExpenseData] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [viewType, setViewType] = useState("overview");
  const [inventoryApiStatus, setInventoryApiStatus] = useState("checking");
  
  // New filter states
  const [activeFilter, setActiveFilter] = useState("overall"); // overall, payroll, inventory
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showAlerts, setShowAlerts] = useState(true);
  const [exportFormat, setExportFormat] = useState("csv");

  const navigate = useNavigate();

  useEffect(() => {
    initializeExpenseTracking();
  }, []);

  useEffect(() => {
    if (expenseData) {
      calculateFilteredExpenses();
    }
  }, [filterPeriod, selectedMonth, selectedYear, activeFilter, dateRange]);

  // [Keep all your existing fetch functions exactly as they are]
  const fetchPayrollExpenses = async () => {
    try {
      const response = await fetch(`${PAYROLL_API}?limit=1000`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        return data.success ? data.data || [] : [];
      } catch {
        console.error("Invalid payroll response:", text);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payroll expenses:", error);
      return [];
    }
  };

  const fetchInventoryExpenses = async () => {
    console.log("🔄 Fetching surgical items from correct endpoint...");
    setInventoryApiStatus("trying");

    try {
      const apiUrl = `${SURGICAL_ITEMS_API}?page=1&limit=1000`;
      console.log(`🔍 Connecting to: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`📦 Raw response from surgical items API:`, text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        
        let surgicalItems = [];
        if (data.success && data.data && Array.isArray(data.data.items)) {
          surgicalItems = data.data.items;
        } else if (data.success && Array.isArray(data.data)) {
          surgicalItems = data.data;
        } else if (Array.isArray(data)) {
          surgicalItems = data;
        }
        
        if (surgicalItems.length > 0) {
          console.log(`✅ Successfully fetched ${surgicalItems.length} surgical items`);
          
          const sampleItem = surgicalItems[0];
          console.log("📋 Sample surgical item structure:", {
            id: sampleItem._id,
            name: sampleItem.name,
            category: sampleItem.category,
            price: sampleItem.price,
            quantity: sampleItem.quantity,
            supplier: sampleItem.supplier?.name
          });
          
          setInventoryApiStatus("connected");
          return surgicalItems;
        } else {
          throw new Error("No surgical items found in response");
        }
        
      } catch (parseError) {
        console.error("❌ JSON parsing error:", parseError);
        throw new Error("Invalid JSON response from surgical items API");
      }
      
    } catch (error) {
      console.error("❌ Error fetching surgical items:", error);
      console.warn("⚠️ API connection failed. Falling back to sample data.");
      setInventoryApiStatus("fallback");
      return getSampleInventoryData();
    }
  };

  const getSampleInventoryData = () => {
    return [
      { _id: "sample1", name: "Surgical Scissors", category: "Cutting Instruments", price: 250, quantity: 15, supplier: { name: "MedTech Ltd" } },
      { _id: "sample2", name: "Stethoscope", category: "Monitoring Equipment", price: 5000, quantity: 8, supplier: { name: "HealthCorp Inc" } },
      { _id: "sample3", name: "Surgical Masks", category: "Disposables", price: 150, quantity: 500, supplier: { name: "SafetyFirst" } },
      { _id: "sample4", name: "Scalpels", category: "Cutting Instruments", price: 3000, quantity: 25, supplier: { name: "PrecisionMed" } },
      { _id: "sample5", name: "Bandages", category: "Disposables", price: 50, quantity: 200, supplier: { name: "WoundCare Solutions" } },
      { _id: "sample6", name: "Syringes", category: "Disposables", price: 75, quantity: 100, supplier: { name: "InjectionTech" } },
      { _id: "sample7", name: "Surgical Gloves", category: "Disposables", price: 120, quantity: 300, supplier: { name: "GloveTech" } },
      { _id: "sample8", name: "Heart Monitor", category: "Monitoring Equipment", price: 12000, quantity: 3, supplier: { name: "CardioTech" } }
    ];
  };

  const initializeExpenseTracking = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      console.log("🔄 Loading expense tracking data...");

      const [payrollData, surgicalItemsData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses()
      ]);

      console.log(`📊 Loaded: ${payrollData.length} payroll records, ${surgicalItemsData.length} surgical items`);

      const expenseAnalytics = calculateExpenseAnalytics(payrollData, surgicalItemsData);
      setExpenseData(expenseAnalytics);

      console.log("✅ Expense tracking initialized successfully");

    } catch (error) {
      console.error("❌ Error loading expense tracking:", error);
      setError(`Failed to load expense data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // [Keep your existing calculateExpenseAnalytics function exactly as it is]
  const calculateExpenseAnalytics = (payrolls = [], surgicalItems = []) => {
    console.log("📊 Calculating expense analytics with surgical items...");
    
    const payrollExpenses = {
      totalGrossSalary: payrolls.reduce((sum, p) => sum + (parseFloat(p.grossSalary) || 0), 0),
      totalBonuses: payrolls.reduce((sum, p) => sum + (parseFloat(p.bonuses) || 0), 0),
      totalEPF: payrolls.reduce((sum, p) => sum + (parseFloat(p.epf) || 0), 0),
      totalETF: payrolls.reduce((sum, p) => sum + (parseFloat(p.etf) || 0), 0),
      totalEmployees: new Set(payrolls.map(p => p.employeeId).filter(id => id)).size,
      monthlyPayrollCosts: {},
      rawData: payrolls
    };

    payrollExpenses.totalPayrollExpense = 
      payrollExpenses.totalGrossSalary + 
      payrollExpenses.totalBonuses + 
      payrollExpenses.totalEPF + 
      payrollExpenses.totalETF;

    payrolls.forEach(p => {
      if (p.payrollMonth && p.payrollYear) {
        const key = `${p.payrollMonth} ${p.payrollYear}`;
        if (!payrollExpenses.monthlyPayrollCosts[key]) {
          payrollExpenses.monthlyPayrollCosts[key] = {
            month: p.payrollMonth,
            year: p.payrollYear,
            totalCost: 0,
            employeeCount: new Set()
          };
        }
        const monthlyCost = (parseFloat(p.grossSalary) || 0) + (parseFloat(p.bonuses) || 0) + (parseFloat(p.epf) || 0) + (parseFloat(p.etf) || 0);
        payrollExpenses.monthlyPayrollCosts[key].totalCost += monthlyCost;
        if (p.employeeId) {
          payrollExpenses.monthlyPayrollCosts[key].employeeCount.add(p.employeeId);
        }
      }
    });

    const inventoryExpenses = {
      totalInventoryValue: 0,
      totalItems: surgicalItems.length || 0,
      totalQuantity: 0,
      categoryExpenses: {},
      supplierExpenses: {},
      lowStockCount: 0,
      outOfStockCount: 0,
      averageItemValue: 0,
      rawData: surgicalItems
    };

    surgicalItems.forEach(item => {
      if (!item) return;
      
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const itemValue = price * quantity;
      const category = item.category || 'Uncategorized';
      const supplier = item.supplier?.name || item.supplier || 'Unknown Supplier';
      
      inventoryExpenses.totalInventoryValue += itemValue;
      inventoryExpenses.totalQuantity += quantity;
      
      const minStock = parseInt(item.minStockLevel) || 10;
      if (quantity === 0) {
        inventoryExpenses.outOfStockCount++;
      } else if (quantity <= minStock) {
        inventoryExpenses.lowStockCount++;
      }
      
      if (!inventoryExpenses.categoryExpenses[category]) {
        inventoryExpenses.categoryExpenses[category] = {
          totalValue: 0,
          itemCount: 0,
          totalQuantity: 0
        };
      }
      inventoryExpenses.categoryExpenses[category].totalValue += itemValue;
      inventoryExpenses.categoryExpenses[category].itemCount += 1;
      inventoryExpenses.categoryExpenses[category].totalQuantity += quantity;
      
      if (!inventoryExpenses.supplierExpenses[supplier]) {
        inventoryExpenses.supplierExpenses[supplier] = {
          totalValue: 0,
          itemCount: 0,
          averagePrice: 0
        };
      }
      inventoryExpenses.supplierExpenses[supplier].totalValue += itemValue;
      inventoryExpenses.supplierExpenses[supplier].itemCount += 1;
      inventoryExpenses.supplierExpenses[supplier].averagePrice = 
        inventoryExpenses.supplierExpenses[supplier].totalValue / 
        inventoryExpenses.supplierExpenses[supplier].itemCount;
    });

    inventoryExpenses.averageItemValue = inventoryExpenses.totalItems > 0 ? 
      inventoryExpenses.totalInventoryValue / inventoryExpenses.totalItems : 0;

    const totalExpenses = payrollExpenses.totalPayrollExpense + inventoryExpenses.totalInventoryValue;

    const expenseBreakdown = [
      { name: "Staff Salaries", value: payrollExpenses.totalGrossSalary, category: "Payroll" },
      { name: "Employee Benefits", value: payrollExpenses.totalBonuses, category: "Payroll" },
      { name: "EPF Contributions", value: payrollExpenses.totalEPF, category: "Payroll" },
      { name: "ETF Contributions", value: payrollExpenses.totalETF, category: "Payroll" },
      { name: "Surgical Items Value", value: inventoryExpenses.totalInventoryValue, category: "Medical Inventory" }
    ];

    const monthlyTrends = Object.values(payrollExpenses.monthlyPayrollCosts).map(month => ({
      ...month,
      employeeCount: month.employeeCount.size,
      inventoryValue: inventoryExpenses.totalInventoryValue / 12
    }));

    console.log("✅ Expense analytics calculated:", {
      totalExpenses: totalExpenses.toLocaleString(),
      payrollExpense: payrollExpenses.totalPayrollExpense.toLocaleString(),
      surgicalItemsValue: inventoryExpenses.totalInventoryValue.toLocaleString(),
      surgicalItemsCount: inventoryExpenses.totalItems
    });

    return {
      payrollExpenses,
      inventoryExpenses,
      totalExpenses,
      expenseBreakdown,
      monthlyTrends,
      summary: {
        totalMonthlyExpenses: totalExpenses,
        payrollPercentage: totalExpenses > 0 ? (payrollExpenses.totalPayrollExpense / totalExpenses) * 100 : 0,
        inventoryPercentage: totalExpenses > 0 ? (inventoryExpenses.totalInventoryValue / totalExpenses) * 100 : 0,
        avgMonthlyPayroll: payrollExpenses.totalPayrollExpense / 12,
        avgInventoryPerEmployee: inventoryExpenses.totalInventoryValue / Math.max(payrollExpenses.totalEmployees, 1),
        inventoryHealthScore: inventoryExpenses.totalItems > 0 ? 
          ((inventoryExpenses.totalItems - inventoryExpenses.lowStockCount - inventoryExpenses.outOfStockCount) / inventoryExpenses.totalItems) * 100 : 0
      }
    };
  };

  const calculateFilteredExpenses = () => {
    if (!expenseData) return;
    console.log(`📅 Filtering expenses for period: ${filterPeriod}, filter: ${activeFilter}`);
  };

  const refreshExpenseData = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🔄 Refreshing expense data...");
      await initializeExpenseTracking();
      console.log("✅ Expense data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      setError(`Failed to refresh expense data: ${error.message}`);
    }
  };

  // New utility functions
  const safeToFixed = (value, decimals = 1) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.0" : num.toFixed(decimals);
  };

  const safeToLocaleString = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  // Export functionality
  const exportData = () => {
    if (!expenseData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `expense_report_${activeFilter}_${timestamp}`;
    
    if (exportFormat === 'csv') {
      exportToCSV(filename);
    } else if (exportFormat === 'json') {
      exportToJSON(filename);
    }
  };

  const exportToCSV = (filename) => {
    let csvContent = '';
    
    if (activeFilter === 'overall' || activeFilter === 'payroll') {
      csvContent += 'Payroll Data\n';
      csvContent += 'Employee ID,Gross Salary,Bonuses,EPF,ETF,Month,Year\n';
      expenseData.payrollExpenses.rawData.forEach(item => {
        csvContent += `${item.employeeId || ''},${item.grossSalary || 0},${item.bonuses || 0},${item.epf || 0},${item.etf || 0},${item.payrollMonth || ''},${item.payrollYear || ''}\n`;
      });
      csvContent += '\n';
    }
    
    if (activeFilter === 'overall' || activeFilter === 'inventory') {
      csvContent += 'Inventory Data\n';
      csvContent += 'Item Name,Category,Price,Quantity,Supplier,Total Value\n';
      expenseData.inventoryExpenses.rawData.forEach(item => {
        const totalValue = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        csvContent += `${item.name || ''},${item.category || ''},${item.price || 0},${item.quantity || 0},${item.supplier?.name || item.supplier || ''},${totalValue}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (filename) => {
    const exportData = {
      timestamp: new Date().toISOString(),
      filter: activeFilter,
      summary: expenseData.summary,
      payrollExpenses: activeFilter !== 'inventory' ? expenseData.payrollExpenses : undefined,
      inventoryExpenses: activeFilter !== 'payroll' ? expenseData.inventoryExpenses : undefined
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Sort functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter data based on search term
  const filterTableData = (data, searchTerm) => {
    if (!searchTerm) return data;
    return data.filter(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="etx-custom-tooltip">
          <p className="etx-tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="etx-tooltip-value" style={{ color: entry.color }}>
              {`${entry.name}: $${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate alerts
  const generateAlerts = () => {
    if (!expenseData) return [];
    
    const alerts = [];
    
    // Low stock alerts
    if (expenseData.inventoryExpenses.lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${expenseData.inventoryExpenses.lowStockCount} items are running low on stock`,
        icon: '⚠️'
      });
    }
    
    // Out of stock alerts
    if (expenseData.inventoryExpenses.outOfStockCount > 0) {
      alerts.push({
        type: 'error',
        title: 'Out of Stock Alert',
        message: `${expenseData.inventoryExpenses.outOfStockCount} items are out of stock`,
        icon: '🚨'
      });
    }
    
    // High expense alert
    if (expenseData.summary.payrollPercentage > 80) {
      alerts.push({
        type: 'info',
        title: 'High Payroll Expense',
        message: `Payroll expenses account for ${safeToFixed(expenseData.summary.payrollPercentage)}% of total costs`,
        icon: '💼'
      });
    }
    
    return alerts;
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="etx-loading">
          <div className="etx-loading-content">
            <div className="etx-loading-spinner"></div>
            <h3>Loading comprehensive expense analytics...</h3>
            <p>📦 {inventoryApiStatus === "trying" ? "Fetching surgical items from correct endpoint..." : "Processing inventory data..."}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="etx-error">
          <div className="etx-error-content">
            <div className="etx-error-icon">⚠️</div>
            <h2>Error Loading Expense Data</h2>
            <p>{error}</p>
            <div className="etx-error-actions">
              <button onClick={refreshExpenseData} className="etx-refresh-btn">
                🔄 Try Again
              </button>
              <button onClick={() => navigate("/admin/financial")} className="etx-back-btn">
                ← Back to Financial Dashboard
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!expenseData) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="etx-error">
          <div className="etx-error-content">
            <div className="etx-error-icon">⚠️</div>
            <h2>No Expense Data Available</h2>
            <p>Unable to load expense tracking data. Please try refreshing.</p>
            <button onClick={refreshExpenseData} className="etx-refresh-btn">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Prepare filtered data based on active filter
  const getFilteredMetrics = () => {
    switch (activeFilter) {
      case 'payroll':
        return [
          {
            icon: "💼",
            value: safeToLocaleString(expenseData.payrollExpenses?.totalPayrollExpense),
            label: "Total Payroll Expense",
            trend: "↗ 8.3%",
            note: `${expenseData.payrollExpenses?.totalEmployees || 0} employees`
          },
          {
            icon: "💰",
            value: safeToLocaleString(expenseData.payrollExpenses?.totalGrossSalary),
            label: "Gross Salaries",
            trend: "↗ 6.2%",
            note: "Base salaries total"
          },
          {
            icon: "🎁",
            value: safeToLocaleString(expenseData.payrollExpenses?.totalBonuses),
            label: "Bonuses & Benefits",
            trend: "↗ 12.5%",
            note: "Performance incentives"
          },
          {
            icon: "🏛️",
            value: safeToLocaleString((expenseData.payrollExpenses?.totalEPF || 0) + (expenseData.payrollExpenses?.totalETF || 0)),
            label: "Government Contributions",
            trend: "→ 0.0%",
            note: "EPF + ETF contributions"
          }
        ];
      case 'inventory':
        return [
          {
            icon: "🏥",
            value: safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue),
            label: "Total Inventory Value",
            trend: "↘ 3.1%",
            note: `${expenseData.inventoryExpenses?.totalItems || 0} items`
          },
          {
            icon: "📦",
            value: expenseData.inventoryExpenses?.totalQuantity?.toLocaleString() || "0",
            label: "Total Quantity",
            trend: "↗ 5.8%",
            note: "Units in stock"
          },
          {
            icon: "⚠️",
            value: expenseData.inventoryExpenses?.lowStockCount || "0",
            label: "Low Stock Items",
            trend: "↘ 15.2%",
            note: "Needs restocking"
          },
          {
            icon: "📊",
            value: safeToFixed(expenseData.summary?.inventoryHealthScore) + "%",
            label: "Inventory Health Score",
            trend: "↗ 2.3%",
            note: "Overall stock status"
          }
        ];
      default:
        return [
          {
            icon: "💰",
            value: safeToLocaleString(expenseData.totalExpenses),
            label: "Total Expenses",
            trend: "↗ 12.5%",
            note: inventoryApiStatus === "connected" ? "Live data calculation" : "Sample data"
          },
          {
            icon: "👥",
            value: safeToLocaleString(expenseData.payrollExpenses?.totalPayrollExpense),
            label: "Payroll Expenses",
            trend: "↗ 8.3%",
            note: `${safeToFixed(expenseData.summary?.payrollPercentage)}% of total`
          },
          {
            icon: "🏥",
            value: safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue),
            label: "Medical Inventory Value",
            trend: "↘ 3.1%",
            note: `${safeToFixed(expenseData.summary?.inventoryPercentage)}% of total • ${expenseData.inventoryExpenses?.totalItems || 0} items`
          },
          {
            icon: "📊",
            value: safeToFixed(expenseData.summary?.inventoryHealthScore) + "%",
            label: "Inventory Health Score",
            trend: "→ 0.8%",
            note: "Stock availability status"
          }
        ];
    }
  };

  // Chart data preparation based on filter
  const getChartData = () => {
    if (activeFilter === 'payroll') {
      return {
        primaryChart: [
          { name: "Gross Salaries", value: expenseData.payrollExpenses?.totalGrossSalary || 0 },
          { name: "Bonuses", value: expenseData.payrollExpenses?.totalBonuses || 0 },
          { name: "EPF (8%)", value: expenseData.payrollExpenses?.totalEPF || 0 },
          { name: "ETF (3%)", value: expenseData.payrollExpenses?.totalETF || 0 }
        ],
        departmentData: Object.values(expenseData.payrollExpenses?.monthlyPayrollCosts || {}).map(month => ({
          name: `${month.month} ${month.year}`,
          value: month.totalCost,
          employees: month.employeeCount.size
        }))
      };
    } else if (activeFilter === 'inventory') {
      return {
        primaryChart: Object.entries(expenseData.inventoryExpenses?.categoryExpenses || {}).map(([category, data]) => ({
          name: category,
          value: data.totalValue || 0,
          items: data.itemCount || 0,
          quantity: data.totalQuantity || 0
        })),
        supplierData: Object.entries(expenseData.inventoryExpenses?.supplierExpenses || {})
          .map(([supplier, data]) => ({
            name: supplier,
            value: data.totalValue || 0,
            items: data.itemCount || 0,
            avgPrice: data.averagePrice || 0
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
      };
    } else {
      return {
        primaryChart: expenseData.expenseBreakdown || [],
        categoryComparison: [
          { name: "Payroll Expenses", value: expenseData.payrollExpenses?.totalPayrollExpense || 0 },
          { name: "Surgical Items Value", value: expenseData.inventoryExpenses?.totalInventoryValue || 0 }
        ]
      };
    }
  };

  const filteredMetrics = getFilteredMetrics();
  const chartData = getChartData();
  const alerts = generateAlerts();

  return (
    <AdminLayout admin={admin} title="Expense Tracking">
      <div className="etx-container">
        {/* Enhanced Header Section */}
        <div className="etx-header">
          <div className="etx-header-content">
            <h1 className="etx-title">
              <span className="etx-title-icon">💸</span>
              Advanced Expense Analytics
            </h1>
            <p className="etx-subtitle">Comprehensive financial insights with smart filtering and analytics</p>
            
            {inventoryApiStatus === "fallback" && (
              <div className="etx-api-warning">
                <div className="etx-warning-header">
                  <span className="etx-warning-icon">⚠️</span>
                  <h4>API Connection Issue Detected</h4>
                </div>
                <p><strong>Unable to connect to surgical items API</strong></p>
                <p>Expected endpoint: <code>http://localhost:7000/api/inventory/surgical-items</code></p>
                <div className="etx-warning-checklist">
                  <p><strong>Please ensure:</strong></p>
                  <ul>
                    <li>Backend server is running on port 7000</li>
                    <li>Surgical items API is accessible</li>
                    <li>No CORS configuration issues</li>
                  </ul>
                </div>
                <p className="etx-warning-note"><em>Currently showing sample data for demonstration</em></p>
              </div>
            )}
            
            {inventoryApiStatus === "connected" && expenseData.inventoryExpenses?.totalItems > 0 && (
              <div className="etx-api-success">
                <span className="etx-success-icon">✅</span>
                Connected to live surgical items API ({expenseData.inventoryExpenses.totalItems} items)
              </div>
            )}
          </div>
          
          <div className="etx-header-actions">
            <div className="etx-export-controls">
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value)}
                className="etx-export-select"
              >
                <option value="csv">CSV Export</option>
                <option value="json">JSON Export</option>
              </select>
              <button onClick={exportData} className="etx-export-btn">
                📥 Export Data
              </button>
            </div>
            <button 
              className="etx-refresh-btn" 
              onClick={refreshExpenseData}
              disabled={loading}
            >
              {loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}
            </button>
            <button 
              className="etx-back-btn" 
              onClick={() => navigate("/admin/financial")}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {showAlerts && alerts.length > 0 && (
          <div className="etx-alerts-section">
            <div className="etx-alerts-header">
              <h3>🚨 System Alerts</h3>
              <button 
                onClick={() => setShowAlerts(false)}
                className="etx-close-alerts"
              >
                ✕
              </button>
            </div>
            <div className="etx-alerts-grid">
              {alerts.map((alert, index) => (
                <div key={index} className={`etx-alert etx-alert-${alert.type}`}>
                  <span className="etx-alert-icon">{alert.icon}</span>
                  <div className="etx-alert-content">
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Filter Tabs */}
        <div className="etx-filter-section">
          <div className="etx-filter-tabs">
            <button 
              className={`etx-filter-tab ${activeFilter === 'overall' ? 'active' : ''}`}
              onClick={() => setActiveFilter('overall')}
            >
              <span className="etx-tab-icon">📊</span>
              <span className="etx-tab-label">Overall Analytics</span>
              <span className="etx-tab-count">${safeToLocaleString(expenseData.totalExpenses)}</span>
            </button>
            <button 
              className={`etx-filter-tab ${activeFilter === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveFilter('payroll')}
            >
              <span className="etx-tab-icon">👥</span>
              <span className="etx-tab-label">Payroll Focus</span>
              <span className="etx-tab-count">{expenseData.payrollExpenses?.totalEmployees || 0} employees</span>
            </button>
            <button 
              className={`etx-filter-tab ${activeFilter === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveFilter('inventory')}
            >
              <span className="etx-tab-icon">🏥</span>
              <span className="etx-tab-label">Inventory Focus</span>
              <span className="etx-tab-count">{expenseData.inventoryExpenses?.totalItems || 0} items</span>
            </button>
          </div>
          
          <div className="etx-filter-controls">
            <div className="etx-search-box">
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="etx-search-input"
              />
              <span className="etx-search-icon">🔍</span>
            </div>
            
            <div className="etx-date-range">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="etx-date-input"
              />
              <span className="etx-date-separator">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="etx-date-input"
              />
            </div>
            
            <select 
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="etx-period-select"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Dynamic Metrics Grid */}
        <div className="etx-metrics-grid">
          {filteredMetrics.map((metric, index) => (
            <div key={index} className={`etx-metric-card etx-${['primary', 'success', 'info', 'warning'][index % 4]}`}>
              <div className="etx-metric-header">
                <div className="etx-metric-icon">{metric.icon}</div>
                <div className="etx-metric-trend">
                  <span className={`etx-trend-${metric.trend.includes('↗') ? 'up' : metric.trend.includes('↘') ? 'down' : 'stable'}`}>
                    {metric.trend}
                  </span>
                </div>
              </div>
              <div className="etx-metric-content">
                <h3 className="etx-metric-value">{metric.value}</h3>
                <p className="etx-metric-label">{metric.label}</p>
                <span className="etx-metric-note">{metric.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Charts Section */}
        <div className="etx-charts-container">
          {/* Primary Chart */}
          <div className="etx-charts-row">
            <div className="etx-chart-card etx-large">
              <div className="etx-chart-header">
                <h3 className="etx-chart-title">
                  <span className="etx-chart-icon">
                    {activeFilter === 'payroll' ? '💼' : activeFilter === 'inventory' ? '📦' : '🥧'}
                  </span>
                  {activeFilter === 'payroll' ? 'Payroll Breakdown' : 
                   activeFilter === 'inventory' ? 'Inventory by Category' : 'Expense Breakdown'}
                </h3>
                <div className="etx-chart-controls">
                  <button 
                    className="etx-view-switch"
                    onClick={() => setViewType(viewType === 'pie' ? 'bar' : 'pie')}
                  >
                    {viewType === 'pie' ? '📊 Bar View' : '🥧 Pie View'}
                  </button>
                </div>
              </div>
              <div className="etx-chart-content">
                <ResponsiveContainer width="100%" height={400}>
                  {viewType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData.primaryChart}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.primaryChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData.primaryChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Chart */}
            {activeFilter === 'inventory' && chartData.supplierData && (
              <div className="etx-chart-card etx-medium">
                <div className="etx-chart-header">
                  <h3 className="etx-chart-title">
                    <span className="etx-chart-icon">🏢</span>
                    Top Suppliers
                  </h3>
                </div>
                <div className="etx-chart-content">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData.supplierData} margin={{ top: 10, right: 30, left: 20, bottom: -15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={150}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#FF8042" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeFilter === 'payroll' && chartData.departmentData && (
              <div className="etx-chart-card etx-medium">
                <div className="etx-chart-header">
                  <h3 className="etx-chart-title">
                    <span className="etx-chart-icon">📈</span>
                    Monthly Trends
                  </h3>
                </div>
                <div className="etx-chart-content">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData.departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeFilter === 'overall' && chartData.categoryComparison && (
              <div className="etx-chart-card etx-medium">
                <div className="etx-chart-header">
                  <h3 className="etx-chart-title">
                    <span className="etx-chart-icon">📊</span>
                    Category Comparison
                  </h3>
                </div>
                <div className="etx-chart-content">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData.categoryComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Summary Section */}
        <div className="etx-summary-section">
          <div className="etx-summary-header">
            <h2 className="etx-summary-title">
              <span className="etx-summary-icon">📋</span>
              {activeFilter === 'payroll' ? 'Payroll Insights' : 
               activeFilter === 'inventory' ? 'Inventory Insights' : 'Executive Summary'}
            </h2>
            <div className="etx-summary-actions">
              <button onClick={() => window.print()} className="etx-print-btn">
                🖨️ Print Report
              </button>
            </div>
          </div>
          
          <div className="etx-summary-grid">
            {activeFilter === 'payroll' ? (
              <>
                <div className="etx-summary-card">
                  <h4>💰 Payroll Overview</h4>
                  <p>Total payroll expenses amount to <strong>${safeToLocaleString(expenseData.payrollExpenses?.totalPayrollExpense)}</strong> across <strong>{expenseData.payrollExpenses?.totalEmployees || 0}</strong> employees. Average monthly cost per employee is <strong>${safeToLocaleString((expenseData.payrollExpenses?.totalPayrollExpense || 0) / Math.max(expenseData.payrollExpenses?.totalEmployees || 1, 1) / 12)}</strong>.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>📊 Cost Breakdown</h4>
                  <p>Gross salaries represent <strong>{safeToFixed((expenseData.payrollExpenses?.totalGrossSalary / expenseData.payrollExpenses?.totalPayrollExpense) * 100)}%</strong> of total payroll costs, while government contributions (EPF+ETF) account for <strong>{safeToFixed(((expenseData.payrollExpenses?.totalEPF + expenseData.payrollExpenses?.totalETF) / expenseData.payrollExpenses?.totalPayrollExpense) * 100)}%</strong>.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>📈 Trends & Recommendations</h4>
                  <p>Payroll costs show consistent growth. Consider implementing performance-based incentives and regular salary reviews to maintain competitive compensation while optimizing costs.</p>
                </div>
              </>
            ) : activeFilter === 'inventory' ? (
              <>
                <div className="etx-summary-card">
                  <h4>🏥 Inventory Status</h4>
                  <p>Medical inventory valued at <strong>${safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)}</strong> with <strong>{expenseData.inventoryExpenses?.totalItems || 0}</strong> unique items. Current health score is <strong>{safeToFixed(expenseData.summary?.inventoryHealthScore)}%</strong>.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>⚠️ Stock Alerts</h4>
                  <p>Currently <strong>{expenseData.inventoryExpenses?.lowStockCount || 0}</strong> items require restocking and <strong>{expenseData.inventoryExpenses?.outOfStockCount || 0}</strong> items are completely out of stock. Immediate attention required for critical medical supplies.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>💡 Optimization Opportunities</h4>
                  <p>Average item value is <strong>${safeToLocaleString(expenseData.inventoryExpenses?.averageItemValue)}</strong>. Consider implementing automated reordering systems and supplier consolidation to reduce costs.</p>
                </div>
              </>
            ) : (
              <>
                <div className="etx-summary-card">
                  <h4>💰 Financial Overview</h4>
                  <p>Total organizational expenses amount to <strong>${safeToLocaleString(expenseData.totalExpenses)}</strong>, with payroll accounting for <strong>{safeToFixed(expenseData.summary?.payrollPercentage)}%</strong> and medical inventory representing <strong>{safeToFixed(expenseData.summary?.inventoryPercentage)}%</strong> of total costs.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>👥 Workforce Costs</h4>
                  <p>Monthly payroll averages <strong>${safeToLocaleString(expenseData.summary?.avgMonthlyPayroll)}</strong> across <strong>{expenseData.payrollExpenses?.totalEmployees || 0}</strong> employees, with an average inventory investment of <strong>${safeToLocaleString(expenseData.summary?.avgInventoryPerEmployee)}</strong> per employee.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>🏥 Inventory Health</h4>
                  <p>Medical inventory maintains a <strong>{safeToFixed(expenseData.summary?.inventoryHealthScore)}%</strong> health score with <strong>{expenseData.inventoryExpenses?.totalItems || 0}</strong> total items. Low stock alerts: <strong>{expenseData.inventoryExpenses?.lowStockCount || 0}</strong> items, Out of stock: <strong>{expenseData.inventoryExpenses?.outOfStockCount || 0}</strong> items.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpenseTracking;
