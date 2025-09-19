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
  const [success, setSuccess] = useState("");
  const [expenseData, setExpenseData] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [viewType, setViewType] = useState("overview");
  const [inventoryApiStatus, setInventoryApiStatus] = useState("checking");
  
  // New filter states
  const [activeFilter, setActiveFilter] = useState("overall");
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

  // **NEW: Enhanced PDF Export with Professional Signature Section**
  const exportToPDF = () => {
    if (!expenseData) {
      setError("No data to export");
      return;
    }

    const currentDate = new Date();
    const reportTitle = activeFilter === 'payroll' ? 'Payroll Expense Report' : 
                       activeFilter === 'inventory' ? 'Inventory Expense Report' : 
                       'Comprehensive Expense Report';

    // Calculate totals based on active filter
    const totals = {
      totalExpenses: expenseData.totalExpenses || 0,
      payrollExpense: expenseData.payrollExpenses?.totalPayrollExpense || 0,
      inventoryValue: expenseData.inventoryExpenses?.totalInventoryValue || 0,
      totalEmployees: expenseData.payrollExpenses?.totalEmployees || 0,
      totalItems: expenseData.inventoryExpenses?.totalItems || 0
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Heal-x ${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1da1f2;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1da1f2;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .info {
            margin-bottom: 20px;
            text-align: right;
            font-size: 11px;
            color: #555;
          }
          .summary-section {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .summary-card {
            background: white;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #ddd;
          }
          .summary-card h4 {
            margin: 0 0 8px 0;
            color: #1da1f2;
            font-size: 14px;
          }
          .summary-card .metric-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 5px 0;
          }
          .summary-card .metric-label {
            font-size: 11px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #1da1f2;
            color: white;
            font-weight: bold;
            text-align: center;
          }
          .currency {
            text-align: right;
          }
          .totals-row {
            background-color: #f0f8ff;
            font-weight: bold;
          }
          
          /* NEW: Enhanced Signature Section Styles */
          .signature-section {
            margin-top: 60px;
            margin-bottom: 30px;
            width: 100%;
            page-break-inside: avoid;
          }
          .signature-section h3 {
            color: #1da1f2;
            border-bottom: 1px solid #1da1f2;
            padding-bottom: 5px;
            margin-bottom: 20px;
          }
          .signature-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
          }
          .signature-block {
            width: 30%;
            text-align: center;
          }
          .signature-line {
            border-bottom: 2px dotted #333;
            width: 200px;
            height: 50px;
            margin: 0 auto 10px auto;
            position: relative;
          }
          .signature-text {
            font-size: 11px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
          }
          .signature-title {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
          .company-stamp {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            border: 2px solid #1da1f2;
            display: inline-block;
            font-size: 10px;
            color: #1da1f2;
            font-weight: bold;
          }
          .report-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 9px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .alert-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
          }
          .alert-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 8px;
          }
          
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
            .signature-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1>🏥 Heal-x ${reportTitle}</h1>
          <p>Healthcare Financial Management System</p>
        </div>

        <!-- Report Info -->
        <div class="info">
          <strong>Generated on:</strong> ${currentDate.toLocaleString()}<br>
          <strong>Report Type:</strong> ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Analysis<br>
          <strong>Data Status:</strong> ${inventoryApiStatus === 'connected' ? 'Live Data' : 'Sample Data'}<br>
          <strong>Filter Period:</strong> ${filterPeriod === 'all' ? 'All Time' : filterPeriod}
        </div>

        <!-- Executive Summary -->
        <div class="summary-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📊 Executive Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>💰 Total Expenses</h4>
              <div class="metric-value">$${safeToLocaleString(totals.totalExpenses)}</div>
              <div class="metric-label">Combined organizational costs</div>
            </div>
            ${activeFilter !== 'inventory' ? `
            <div class="summary-card">
              <h4>👥 Payroll Expenses</h4>
              <div class="metric-value">$${safeToLocaleString(totals.payrollExpense)}</div>
              <div class="metric-label">${totals.totalEmployees} employees • ${safeToFixed(expenseData.summary?.payrollPercentage)}% of total</div>
            </div>` : ''}
            ${activeFilter !== 'payroll' ? `
            <div class="summary-card">
              <h4>🏥 Medical Inventory</h4>
              <div class="metric-value">$${safeToLocaleString(totals.inventoryValue)}</div>
              <div class="metric-label">${totals.totalItems} items • ${safeToFixed(expenseData.summary?.inventoryPercentage)}% of total</div>
            </div>` : ''}
            <div class="summary-card">
              <h4>📊 Health Score</h4>
              <div class="metric-value">${safeToFixed(expenseData.summary?.inventoryHealthScore)}%</div>
              <div class="metric-label">Inventory availability status</div>
            </div>
          </div>
        </div>

        ${expenseData.inventoryExpenses?.lowStockCount > 0 || expenseData.inventoryExpenses?.outOfStockCount > 0 ? `
        <!-- Alerts Section -->
        <div class="alert-section">
          <div class="alert-title">⚠️ Critical Alerts</div>
          ${expenseData.inventoryExpenses.lowStockCount > 0 ? 
            `<p><strong>Low Stock:</strong> ${expenseData.inventoryExpenses.lowStockCount} items need restocking</p>` : ''}
          ${expenseData.inventoryExpenses.outOfStockCount > 0 ? 
            `<p><strong>Out of Stock:</strong> ${expenseData.inventoryExpenses.outOfStockCount} items completely depleted</p>` : ''}
        </div>` : ''}

        <!-- Data Tables -->
        ${activeFilter !== 'inventory' && expenseData.payrollExpenses?.rawData?.length > 0 ? `
        <h3 style="color: #1da1f2; margin-top: 30px;">💼 Payroll Details</h3>
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Gross Salary</th>
              <th>Bonuses</th>
              <th>EPF (8%)</th>
              <th>ETF (3%)</th>
              <th>Net Salary</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            ${expenseData.payrollExpenses.rawData.slice(0, 20).map(payroll => `
              <tr>
                <td><strong>${payroll.employeeId || 'N/A'}</strong></td>
                <td>${payroll.employeeName || 'N/A'}</td>
                <td class="currency">$${(payroll.grossSalary || 0).toLocaleString()}</td>
                <td class="currency">$${(payroll.bonuses || 0).toLocaleString()}</td>
                <td class="currency">$${(payroll.epf || 0).toLocaleString()}</td>
                <td class="currency">$${(payroll.etf || 0).toLocaleString()}</td>
                <td class="currency"><strong>$${(payroll.netSalary || 0).toLocaleString()}</strong></td>
                <td>${payroll.payrollMonth || ''} ${payroll.payrollYear || ''}</td>
              </tr>
            `).join('')}
            <tr class="totals-row">
              <td colspan="2"><strong>TOTALS</strong></td>
              <td class="currency"><strong>$${expenseData.payrollExpenses.totalGrossSalary.toLocaleString()}</strong></td>
              <td class="currency"><strong>$${expenseData.payrollExpenses.totalBonuses.toLocaleString()}</strong></td>
              <td class="currency"><strong>$${expenseData.payrollExpenses.totalEPF.toLocaleString()}</strong></td>
              <td class="currency"><strong>$${expenseData.payrollExpenses.totalETF.toLocaleString()}</strong></td>
              <td class="currency"><strong>$${(expenseData.payrollExpenses.totalGrossSalary + expenseData.payrollExpenses.totalBonuses - expenseData.payrollExpenses.totalEPF - expenseData.payrollExpenses.totalETF).toLocaleString()}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>` : ''}

        ${activeFilter !== 'payroll' && expenseData.inventoryExpenses?.rawData?.length > 0 ? `
        <h3 style="color: #1da1f2; margin-top: 30px;">🏥 Inventory Details</h3>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total Value</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${expenseData.inventoryExpenses.rawData.slice(0, 20).map(item => {
              const totalValue = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
              const status = item.quantity === 0 ? 'Out of Stock' : 
                           item.quantity <= (item.minStockLevel || 10) ? 'Low Stock' : 'In Stock';
              return `
                <tr>
                  <td><strong>${item.name || 'N/A'}</strong></td>
                  <td>${item.category || 'Uncategorized'}</td>
                  <td class="currency">$${(item.price || 0).toLocaleString()}</td>
                  <td class="currency">${(item.quantity || 0).toLocaleString()}</td>
                  <td class="currency"><strong>$${totalValue.toLocaleString()}</strong></td>
                  <td>${item.supplier?.name || item.supplier || 'Unknown'}</td>
                  <td>${status}</td>
                </tr>
              `;
            }).join('')}
            <tr class="totals-row">
              <td colspan="4"><strong>TOTALS</strong></td>
              <td class="currency"><strong>$${expenseData.inventoryExpenses.totalInventoryValue.toLocaleString()}</strong></td>
              <td><strong>${expenseData.inventoryExpenses.totalItems} Items</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>` : ''}

        <!-- NEW: Professional Signature Section -->
        <div class="signature-section">
          <h3>✍️ Report Authorization</h3>
          <div class="signature-container">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Financial Manager</div>
              <div class="signature-title">Heal-x Healthcare Management</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Administrator</div>
              <div class="signature-title">Report Reviewed By</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Date</div>
              <div class="signature-title">Report Approved On</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <div class="company-stamp">
              HEAL-X OFFICIAL SEAL<br>
              HEALTHCARE MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        <!-- NEW: Report Footer -->
        <div class="report-footer">
          <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${currentDate.toLocaleString()} • All amounts are in Sri Lankan Rupees</p>
          <p>For queries regarding this report, contact the Financial Department at Heal-x Healthcare</p>
          ${inventoryApiStatus === 'fallback' ? '<p><em>Note: This report contains sample inventory data due to API connection issues</em></p>' : ''}
        </div>

        <!-- Print Controls -->
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">
            🖨️ Print PDF Report
          </button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">
            ✕ Close
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    setSuccess("PDF report opened! Use Ctrl+P to save as PDF.");
    setTimeout(() => setSuccess(""), 3000);
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
    } else if (exportFormat === 'pdf') {
      exportToPDF();
    }
  };

  const exportToCSV = (filename) => {
    let csvContent = `Heal-x Expense Report - ${activeFilter.toUpperCase()}\n`;
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
    csvContent += `Total Records: ${(expenseData.payrollExpenses?.rawData?.length || 0) + (expenseData.inventoryExpenses?.rawData?.length || 0)}\n\n`;
    
    if (activeFilter === 'overall' || activeFilter === 'payroll') {
      csvContent += 'Payroll Data\n';
      csvContent += 'Employee ID,Employee Name,Gross Salary,Bonuses,EPF,ETF,Net Salary,Month,Year\n';
      expenseData.payrollExpenses.rawData.forEach(item => {
        csvContent += `${item.employeeId || ''},${item.employeeName || ''},${item.grossSalary || 0},${item.bonuses || 0},${item.epf || 0},${item.etf || 0},${item.netSalary || 0},${item.payrollMonth || ''},${item.payrollYear || ''}\n`;
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

    setSuccess("CSV report downloaded successfully!");
    setTimeout(() => setSuccess(""), 3000);
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

    setSuccess("JSON report downloaded successfully!");
    setTimeout(() => setSuccess(""), 3000);
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
                <option value="pdf">PDF Report</option>
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

        {/* Success/Error Messages */}
        {error && (
          <div className="etx-message etx-error-message">
            <span className="etx-message-icon">❌</span>
            {error}
            <button className="etx-message-close" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {success && (
          <div className="etx-message etx-success-message">
            <span className="etx-message-icon">✅</span>
            {success}
            <button className="etx-message-close" onClick={() => setSuccess("")}>✕</button>
          </div>
        )}

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
              <button onClick={exportToPDF} className="etx-print-btn">
                🖨️ Generate PDF Report
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
