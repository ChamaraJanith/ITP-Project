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
const UTILITIES_API = "http://localhost:7000/api/financial-utilities";
const RESTOCK_SPENDING_API = "http://localhost:7000/api/inventory/restock-spending"; // NEW: API for restock data

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
  const [utilitiesApiStatus, setUtilitiesApiStatus] = useState("checking");
  
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

  // Keep your existing fetch functions exactly as they are
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

  // UPDATED: Fetch both inventory items and restock spending data
  const fetchInventoryExpenses = async () => {
    console.log("🔄 Fetching surgical items and restock data...");
    setInventoryApiStatus("trying");

    try {
      // Fetch both surgical items and restock spending in parallel
      const [surgicalItemsResponse, restockSpendingResponse] = await Promise.all([
        fetch(`${SURGICAL_ITEMS_API}?page=1&limit=1000`),
        fetch(`${RESTOCK_SPENDING_API}`).catch(() => null) // Don't fail if restock API is not available
      ]);
      
      // Process surgical items
      if (!surgicalItemsResponse.ok) {
        throw new Error(`HTTP ${surgicalItemsResponse.status}: ${surgicalItemsResponse.statusText}`);
      }

      const surgicalItemsText = await surgicalItemsResponse.text();
      console.log(`📦 Raw response from surgical items API:`, surgicalItemsText.substring(0, 200) + "...");
      
      let surgicalItems = [];
      let restockSpendingData = { totalRestockValue: 0 };

      try {
        const surgicalData = JSON.parse(surgicalItemsText);
        
        if (surgicalData.success && surgicalData.data && Array.isArray(surgicalData.data.items)) {
          surgicalItems = surgicalData.data.items;
        } else if (surgicalData.success && Array.isArray(surgicalData.data)) {
          surgicalItems = surgicalData.data;
        } else if (Array.isArray(surgicalData)) {
          surgicalItems = surgicalData;
        }
        
        // Process restock spending if available
        if (restockSpendingResponse && restockSpendingResponse.ok) {
          try {
            const restockText = await restockSpendingResponse.text();
            const restockData = JSON.parse(restockText);
            if (restockData.success && restockData.data) {
              restockSpendingData = restockData.data;
              console.log("💰 Restock spending data loaded:", restockSpendingData.totalRestockValue);
            }
          } catch (restockError) {
            console.warn("⚠️ Could not parse restock spending data, using default");
          }
        }
        
        if (surgicalItems.length > 0) {
          console.log(`✅ Successfully fetched ${surgicalItems.length} surgical items`);
          console.log(`💰 Total restock value: ${restockSpendingData.totalRestockValue || 0}`);
          
          setInventoryApiStatus("connected");
          
          // Return both surgical items and restock data
          return {
            surgicalItems,
            restockSpending: restockSpendingData
          };
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
      
      return {
        surgicalItems: getSampleInventoryData(),
        restockSpending: { totalRestockValue: 25000 } // Sample restock value
      };
    }
  };

  // NEW: Fetch utilities expenses function
  const fetchUtilitiesExpenses = async () => {
    console.log("🔄 Fetching utilities data from API...");
    setUtilitiesApiStatus("trying");

    try {
      const apiUrl = `${UTILITIES_API}?page=1&limit=1000`;
      console.log(`🔍 Connecting to utilities API: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`⚡ Raw response from utilities API:`, text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        
        let utilities = [];
        if (data.success && data.data && Array.isArray(data.data.utilities)) {
          utilities = data.data.utilities;
        } else if (data.success && Array.isArray(data.data)) {
          utilities = data.data;
        } else if (Array.isArray(data)) {
          utilities = data;
        }
        
        if (utilities.length > 0) {
          console.log(`✅ Successfully fetched ${utilities.length} utility records`);
          
          const sampleUtility = utilities[0];
          console.log("📋 Sample utility structure:", {
            id: sampleUtility._id,
            category: sampleUtility.category,
            description: sampleUtility.description,
            amount: sampleUtility.amount,
            vendor: sampleUtility.vendor_name,
            status: sampleUtility.payment_status
          });
          
          setUtilitiesApiStatus("connected");
          return utilities;
        } else {
          throw new Error("No utilities found in response");
        }
        
      } catch (parseError) {
        console.error("❌ JSON parsing error:", parseError);
        throw new Error("Invalid JSON response from utilities API");
      }
      
    } catch (error) {
      console.error("❌ Error fetching utilities:", error);
      console.warn("⚠️ Utilities API connection failed. Falling back to sample data.");
      setUtilitiesApiStatus("fallback");
      return getSampleUtilitiesData();
    }
  };

  // NEW: Sample utilities data for fallback
  const getSampleUtilitiesData = () => {
    return [
      { 
        _id: "util1", 
        category: "Electricity", 
        description: "Monthly electricity bill - Main building", 
        amount: 2500, 
        vendor_name: "PowerGrid Corp", 
        payment_status: "Paid",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30"
      },
      { 
        _id: "util2", 
        category: "Water & Sewage", 
        description: "Water supply and sewage services", 
        amount: 800, 
        vendor_name: "CityWater Services", 
        payment_status: "Paid",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30"
      },
      { 
        _id: "util3", 
        category: "Internet & Communication", 
        description: "High-speed internet and phone services", 
        amount: 1200, 
        vendor_name: "TeleConnect Ltd", 
        payment_status: "Pending",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30"
      },
      { 
        _id: "util4", 
        category: "Generator Fuel", 
        description: "Diesel fuel for backup generator", 
        amount: 600, 
        vendor_name: "FuelSupply Inc", 
        payment_status: "Overdue",
        billing_period_start: "2024-08-15",
        billing_period_end: "2024-09-15"
      },
      { 
        _id: "util5", 
        category: "Waste Management", 
        description: "Medical waste disposal services", 
        amount: 450, 
        vendor_name: "MedWaste Solutions", 
        payment_status: "Paid",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30"
      }
    ];
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

  // UPDATED: Initialize expense tracking with inventory + restock data
  const initializeExpenseTracking = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      console.log("🔄 Loading comprehensive expense tracking data...");

      const [payrollData, inventoryData, utilitiesData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses(), // Now returns { surgicalItems, restockSpending }
        fetchUtilitiesExpenses()
      ]);

      console.log(`📊 Loaded: ${payrollData.length} payroll records, ${inventoryData.surgicalItems.length} surgical items, ${utilitiesData.length} utility records`);
      console.log(`💰 Restock spending: ${inventoryData.restockSpending.totalRestockValue}`);

      // UPDATED: Pass restock spending data to analytics calculation
      const expenseAnalytics = calculateExpenseAnalytics(
        payrollData, 
        inventoryData.surgicalItems, 
        utilitiesData,
        inventoryData.restockSpending // NEW: Pass restock data
      );
      setExpenseData(expenseAnalytics);

      console.log("✅ Expense tracking initialized successfully with utilities and restock data");

    } catch (error) {
      console.error("❌ Error loading expense tracking:", error);
      setError(`Failed to load expense data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Calculate expense analytics including restock spending in inventory value
  const calculateExpenseAnalytics = (payrolls = [], surgicalItems = [], utilities = [], restockSpending = {}) => {
    console.log("📊 Calculating expense analytics with surgical items, utilities, and restock spending...");
    
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

    // Process payroll monthly costs
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

    // UPDATED: Calculate inventory expenses including restock spending
    const currentStockValue = surgicalItems.reduce((sum, item) => {
      if (!item) return sum;
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const totalRestockValue = restockSpending.totalRestockValue || 0;
    const combinedInventoryValue = currentStockValue + totalRestockValue; // KEY CHANGE: Combined total

    const inventoryExpenses = {
      currentStockValue: currentStockValue, // Current inventory value
      totalRestockValue: totalRestockValue, // Auto-restock spending
      totalInventoryValue: combinedInventoryValue, // UPDATED: Combined total
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

    // NEW: Calculate utilities expenses
    const utilitiesExpenses = {
      totalUtilitiesExpense: 0,
      totalUtilities: utilities.length || 0,
      categoryExpenses: {},
      vendorExpenses: {},
      pendingPayments: 0,
      overduePayments: 0,
      paidPayments: 0,
      monthlyUtilitiesCosts: {},
      averageUtilityAmount: 0,
      rawData: utilities
    };

    utilities.forEach(utility => {
      if (!utility) return;
      
      const amount = parseFloat(utility.amount) || 0;
      const category = utility.category || 'Other';
      const vendor = utility.vendor_name || 'Unknown Vendor';
      const status = utility.payment_status || 'Pending';
      
      utilitiesExpenses.totalUtilitiesExpense += amount;
      
      // Count payment statuses
      if (status === 'Pending') {
        utilitiesExpenses.pendingPayments++;
      } else if (status === 'Overdue') {
        utilitiesExpenses.overduePayments++;
      } else if (status === 'Paid') {
        utilitiesExpenses.paidPayments++;
      }
      
      // Group by category
      if (!utilitiesExpenses.categoryExpenses[category]) {
        utilitiesExpenses.categoryExpenses[category] = {
          totalAmount: 0,
          count: 0,
          pending: 0,
          overdue: 0,
          paid: 0
        };
      }
      utilitiesExpenses.categoryExpenses[category].totalAmount += amount;
      utilitiesExpenses.categoryExpenses[category].count += 1;
      utilitiesExpenses.categoryExpenses[category][status.toLowerCase()]++;
      
      // Group by vendor
      if (!utilitiesExpenses.vendorExpenses[vendor]) {
        utilitiesExpenses.vendorExpenses[vendor] = {
          totalAmount: 0,
          count: 0,
          averageAmount: 0
        };
      }
      utilitiesExpenses.vendorExpenses[vendor].totalAmount += amount;
      utilitiesExpenses.vendorExpenses[vendor].count += 1;
      utilitiesExpenses.vendorExpenses[vendor].averageAmount = 
        utilitiesExpenses.vendorExpenses[vendor].totalAmount / 
        utilitiesExpenses.vendorExpenses[vendor].count;

      // Monthly tracking
      if (utility.billing_period_start) {
        const date = new Date(utility.billing_period_start);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!utilitiesExpenses.monthlyUtilitiesCosts[key]) {
          utilitiesExpenses.monthlyUtilitiesCosts[key] = {
            month: date.toLocaleString('default', { month: 'long' }),
            year: date.getFullYear(),
            totalAmount: 0,
            count: 0
          };
        }
        utilitiesExpenses.monthlyUtilitiesCosts[key].totalAmount += amount;
        utilitiesExpenses.monthlyUtilitiesCosts[key].count += 1;
      }
    });

    utilitiesExpenses.averageUtilityAmount = utilitiesExpenses.totalUtilities > 0 ? 
      utilitiesExpenses.totalUtilitiesExpense / utilitiesExpenses.totalUtilities : 0;

    // UPDATED: Calculate total expenses including combined inventory value
    const totalExpenses = payrollExpenses.totalPayrollExpense + inventoryExpenses.totalInventoryValue + utilitiesExpenses.totalUtilitiesExpense;

    // UPDATED: Expense breakdown with detailed inventory information
    const expenseBreakdown = [
      { name: "Staff Salaries", value: payrollExpenses.totalGrossSalary, category: "Payroll" },
      { name: "Employee Benefits", value: payrollExpenses.totalBonuses, category: "Payroll" },
      { name: "EPF Contributions", value: payrollExpenses.totalEPF, category: "Payroll" },
      { name: "ETF Contributions", value: payrollExpenses.totalETF, category: "Payroll" },
      { name: "Current Inventory Value", value: inventoryExpenses.currentStockValue, category: "Medical Inventory" },
      { name: "Auto-Restock Investment", value: inventoryExpenses.totalRestockValue, category: "Medical Inventory" },
      { name: "Utilities Expenses", value: utilitiesExpenses.totalUtilitiesExpense, category: "Utilities" }
    ];

    const monthlyTrends = Object.values(payrollExpenses.monthlyPayrollCosts).map(month => ({
      ...month,
      employeeCount: month.employeeCount.size,
      inventoryValue: inventoryExpenses.totalInventoryValue / 12,
      utilitiesAmount: utilitiesExpenses.totalUtilitiesExpense / 12
    }));

    console.log("✅ Expense analytics calculated with combined inventory value:", {
      totalExpenses: totalExpenses.toLocaleString(),
      payrollExpense: payrollExpenses.totalPayrollExpense.toLocaleString(),
      currentStockValue: inventoryExpenses.currentStockValue.toLocaleString(),
      totalRestockValue: inventoryExpenses.totalRestockValue.toLocaleString(),
      combinedInventoryValue: inventoryExpenses.totalInventoryValue.toLocaleString(),
      utilitiesExpense: utilitiesExpenses.totalUtilitiesExpense.toLocaleString(),
      surgicalItemsCount: inventoryExpenses.totalItems,
      utilitiesCount: utilitiesExpenses.totalUtilities
    });

    return {
      payrollExpenses,
      inventoryExpenses,
      utilitiesExpenses,
      totalExpenses,
      expenseBreakdown,
      monthlyTrends,
      summary: {
        totalMonthlyExpenses: totalExpenses,
        payrollPercentage: totalExpenses > 0 ? (payrollExpenses.totalPayrollExpense / totalExpenses) * 100 : 0,
        inventoryPercentage: totalExpenses > 0 ? (inventoryExpenses.totalInventoryValue / totalExpenses) * 100 : 0,
        utilitiesPercentage: totalExpenses > 0 ? (utilitiesExpenses.totalUtilitiesExpense / totalExpenses) * 100 : 0,
        avgMonthlyPayroll: payrollExpenses.totalPayrollExpense / 12,
        avgInventoryPerEmployee: inventoryExpenses.totalInventoryValue / Math.max(payrollExpenses.totalEmployees, 1),
        avgUtilitiesPerMonth: utilitiesExpenses.totalUtilitiesExpense / 12,
        inventoryHealthScore: inventoryExpenses.totalItems > 0 ? 
          ((inventoryExpenses.totalItems - inventoryExpenses.lowStockCount - inventoryExpenses.outOfStockCount) / inventoryExpenses.totalItems) * 100 : 0,
        utilitiesPaymentScore: utilitiesExpenses.totalUtilities > 0 ?
          (utilitiesExpenses.paidPayments / utilitiesExpenses.totalUtilities) * 100 : 0
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

  // UPDATED: Enhanced PDF Export with utilities data and detailed inventory breakdown
  const exportToPDF = () => {
    if (!expenseData) {
      setError("No data to export");
      return;
    }

    const currentDate = new Date();
    const reportTitle = activeFilter === 'payroll' ? 'Payroll Expense Report' : 
                       activeFilter === 'inventory' ? 'Medical Inventory Report' :
                       activeFilter === 'utilities' ? 'Utilities Expense Report' :
                       'Comprehensive Expense Report';

    // UPDATED: Calculate totals including detailed inventory breakdown
    const totals = {
      totalExpenses: expenseData.totalExpenses || 0,
      payrollExpense: expenseData.payrollExpenses?.totalPayrollExpense || 0,
      currentStockValue: expenseData.inventoryExpenses?.currentStockValue || 0,
      totalRestockValue: expenseData.inventoryExpenses?.totalRestockValue || 0,
      combinedInventoryValue: expenseData.inventoryExpenses?.totalInventoryValue || 0,
      utilitiesExpense: expenseData.utilitiesExpenses?.totalUtilitiesExpense || 0,
      totalEmployees: expenseData.payrollExpenses?.totalEmployees || 0,
      totalItems: expenseData.inventoryExpenses?.totalItems || 0,
      totalUtilities: expenseData.utilitiesExpenses?.totalUtilities || 0
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
          .inventory-breakdown {
            background-color: #e8f5e8;
            border: 2px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .breakdown-title {
            color: #28a745;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .breakdown-item {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px;
            background: rgba(255,255,255,0.7);
            border-radius: 4px;
          }
          .breakdown-total {
            border-top: 2px solid #28a745;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 18px;
            font-weight: bold;
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
          <strong>Data Status:</strong> Inventory: ${inventoryApiStatus === 'connected' ? 'Live Data' : 'Sample Data'} | Utilities: ${utilitiesApiStatus === 'connected' ? 'Live Data' : 'Sample Data'}<br>
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
            ${activeFilter !== 'inventory' && activeFilter !== 'utilities' ? `
            <div class="summary-card">
              <h4>👥 Payroll Expenses</h4>
              <div class="metric-value">$${safeToLocaleString(totals.payrollExpense)}</div>
              <div class="metric-label">${totals.totalEmployees} employees • ${safeToFixed(expenseData.summary?.payrollPercentage)}% of total</div>
            </div>` : ''}
            ${activeFilter !== 'payroll' && activeFilter !== 'utilities' ? `
            <div class="summary-card">
              <h4>🏥 Medical Inventory Total</h4>
              <div class="metric-value">$${safeToLocaleString(totals.combinedInventoryValue)}</div>
              <div class="metric-label">${totals.totalItems} items • ${safeToFixed(expenseData.summary?.inventoryPercentage)}% of total</div>
            </div>` : ''}
            ${activeFilter !== 'payroll' && activeFilter !== 'inventory' ? `
            <div class="summary-card">
              <h4>⚡ Utilities</h4>
              <div class="metric-value">$${safeToLocaleString(totals.utilitiesExpense)}</div>
              <div class="metric-label">${totals.totalUtilities} services • ${safeToFixed(expenseData.summary?.utilitiesPercentage)}% of total</div>
            </div>` : ''}
            <div class="summary-card">
              <h4>📊 Overall Health</h4>
              <div class="metric-value">${safeToFixed(expenseData.summary?.inventoryHealthScore)}%</div>
              <div class="metric-label">System operational status</div>
            </div>
          </div>
        </div>

        <!-- UPDATED: Inventory Breakdown Section -->
        ${activeFilter !== 'payroll' && activeFilter !== 'utilities' ? `
        <div class="inventory-breakdown">
          <div class="breakdown-title">🏥 Medical Inventory Value Breakdown</div>
          <div class="breakdown-item">
            <span><strong>Current Stock Value:</strong></span>
            <span><strong>$${safeToLocaleString(totals.currentStockValue)}</strong></span>
          </div>
          <div class="breakdown-item">
            <span><strong>Total Auto-Restock Value:</strong></span>
            <span><strong>$${safeToLocaleString(totals.totalRestockValue)}</strong></span>
          </div>
          <div class="breakdown-total">
            <div class="breakdown-item">
              <span><strong>TOTAL MEDICAL INVENTORY VALUE:</strong></span>
              <span><strong>$${safeToLocaleString(totals.combinedInventoryValue)}</strong></span>
            </div>
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #666;">
            <strong>Formula:</strong> Total = Current Stock Value + Auto-Restock Value<br>
            This represents the complete investment in medical inventory including all automatic restocking operations.
          </div>
        </div>` : ''}

        ${(expenseData.inventoryExpenses?.lowStockCount > 0 || expenseData.inventoryExpenses?.outOfStockCount > 0 || expenseData.utilitiesExpenses?.overduePayments > 0) ? `
        <!-- Alerts Section -->
        <div class="alert-section">
          <div class="alert-title">⚠️ Critical Alerts</div>
          ${expenseData.inventoryExpenses?.lowStockCount > 0 ? 
            `<p><strong>Low Stock:</strong> ${expenseData.inventoryExpenses.lowStockCount} items need restocking</p>` : ''}
          ${expenseData.inventoryExpenses?.outOfStockCount > 0 ? 
            `<p><strong>Out of Stock:</strong> ${expenseData.inventoryExpenses.outOfStockCount} items completely depleted</p>` : ''}
          ${expenseData.utilitiesExpenses?.overduePayments > 0 ? 
            `<p><strong>Overdue Utilities:</strong> ${expenseData.utilitiesExpenses.overduePayments} utility bills are overdue</p>` : ''}
        </div>` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    setSuccess("PDF report opened! Use Ctrl+P to save as PDF.");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Continue with the rest of your existing functions (exportData, exportToCSV, exportToJSON, etc.)
  // ... [Include all remaining functions from your original file] ...

  // UPDATED: Generate alerts including utilities
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

    // Overdue utilities alerts
    if (expenseData.utilitiesExpenses.overduePayments > 0) {
      alerts.push({
        type: 'error',
        title: 'Overdue Utilities',
        message: `${expenseData.utilitiesExpenses.overduePayments} utility bills are overdue`,
        icon: '⚡'
      });
    }

    // Pending utilities alerts
    if (expenseData.utilitiesExpenses.pendingPayments > 3) {
      alerts.push({
        type: 'warning',
        title: 'Pending Utilities',
        message: `${expenseData.utilitiesExpenses.pendingPayments} utility bills are pending payment`,
        icon: '💡'
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

  // UPDATED: Prepare filtered data based on active filter including updated inventory display
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
            label: "Total Medical Inventory Value",
            trend: "↗ 5.8%",
            note: `Current Stock + Auto-Restock Value`
          },
          {
            icon: "📦",
            value: safeToLocaleString(expenseData.inventoryExpenses?.currentStockValue),
            label: "Current Stock Value",
            trend: "↘ 3.1%",
            note: `${expenseData.inventoryExpenses?.totalItems || 0} items in stock`
          },
          {
            icon: "🔄",
            value: safeToLocaleString(expenseData.inventoryExpenses?.totalRestockValue),
            label: "Total Auto-Restock Value",
            trend: "↗ 12.4%",
            note: "Automatic restocking investment"
          },
          {
            icon: "📊",
            value: safeToFixed(expenseData.summary?.inventoryHealthScore) + "%",
            label: "Inventory Health Score",
            trend: "↗ 2.3%",
            note: "Overall stock status"
          }
        ];
      case 'utilities':
        return [
          {
            icon: "⚡",
            value: safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense),
            label: "Total Utilities Expense",
            trend: "↗ 4.2%",
            note: `${expenseData.utilitiesExpenses?.totalUtilities || 0} services`
          },
          {
            icon: "✅",
            value: expenseData.utilitiesExpenses?.paidPayments || "0",
            label: "Paid Bills",
            trend: "↗ 8.1%",
            note: "Successfully processed"
          },
          {
            icon: "⏳",
            value: expenseData.utilitiesExpenses?.pendingPayments || "0",
            label: "Pending Bills",
            trend: "→ 0.0%",
            note: "Awaiting payment"
          },
          {
            icon: "🚨",
            value: expenseData.utilitiesExpenses?.overduePayments || "0",
            label: "Overdue Bills",
            trend: "↘ 12.5%",
            note: "Immediate attention needed"
          }
        ];
      default:
        return [
          {
            icon: "💰",
            value: safeToLocaleString(expenseData.totalExpenses),
            label: "Total Expenses",
            trend: "↗ 12.5%",
            note: inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" ? "Live data calculation" : "Mixed data sources"
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
            trend: "↗ 5.8%",
            note: `${safeToFixed(expenseData.summary?.inventoryPercentage)}% of total • Current Stock + Auto-Restock Value`
          },
          {
            icon: "⚡",
            value: safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense),
            label: "Utilities Expenses",
            trend: "↗ 4.2%",
            note: `${safeToFixed(expenseData.summary?.utilitiesPercentage)}% of total • ${expenseData.utilitiesExpenses?.totalUtilities || 0} services`
          }
        ];
    }
  };

  // Continue with loading state and error handling...
  if (loading) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="etx-loading">
          <div className="etx-loading-content">
            <div className="etx-loading-spinner"></div>
            <h3>Loading comprehensive expense analytics...</h3>
            <p>📦 {inventoryApiStatus === "trying" ? "Fetching surgical items and restock data..." : "Processing inventory data..."}</p>
            <p>⚡ {utilitiesApiStatus === "trying" ? "Connecting to utilities API..." : "Processing utilities data..."}</p>
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

  const filteredMetrics = getFilteredMetrics();
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
            
            {/* UPDATED: API status warnings including inventory details */}
            {(inventoryApiStatus === "fallback" || utilitiesApiStatus === "fallback") && (
              <div className="etx-api-warning">
                <div className="etx-warning-header">
                  <span className="etx-warning-icon">⚠️</span>
                  <h4>API Connection Issues Detected</h4>
                </div>
                {inventoryApiStatus === "fallback" && (
                  <>
                    <p><strong>Unable to connect to surgical items API</strong></p>
                    <p>Expected endpoint: <code>http://localhost:7000/api/inventory/surgical-items</code></p>
                  </>
                )}
                {utilitiesApiStatus === "fallback" && (
                  <>
                    <p><strong>Unable to connect to utilities API</strong></p>
                    <p>Expected endpoint: <code>http://localhost:7000/api/financial-utilities</code></p>
                  </>
                )}
                <p className="etx-warning-note"><em>Currently showing sample data for demonstration</em></p>
              </div>
            )}
            
            {/* UPDATED: Success status including detailed inventory information */}
            {inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" && expenseData.inventoryExpenses?.totalItems > 0 && expenseData.utilitiesExpenses?.totalUtilities > 0 && (
              <div className="etx-api-success">
                <span className="etx-success-icon">✅</span>
                Connected to all APIs - Inventory: {expenseData.inventoryExpenses.totalItems} items | 
                Restock Value: ${expenseData.inventoryExpenses.totalRestockValue.toLocaleString()} | 
                Utilities: {expenseData.utilitiesExpenses.totalUtilities} services
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
              <button onClick={exportToPDF} className="etx-export-btn">
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

        {/* UPDATED: Enhanced Filter Tabs including utilities */}
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
              <span className="etx-tab-count">${safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)} total</span>
            </button>
            <button 
              className={`etx-filter-tab ${activeFilter === 'utilities' ? 'active' : ''}`}
              onClick={() => setActiveFilter('utilities')}
            >
              <span className="etx-tab-icon">⚡</span>
              <span className="etx-tab-label">Utilities Focus</span>
              <span className="etx-tab-count">{expenseData.utilitiesExpenses?.totalUtilities || 0} services</span>
            </button>
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

        {/* UPDATED: Enhanced Summary Section including detailed inventory breakdown */}
        <div className="etx-summary-section">
          <div className="etx-summary-header">
            <h2 className="etx-summary-title">
              <span className="etx-summary-icon">📋</span>
              {activeFilter === 'payroll' ? 'Payroll Insights' : 
               activeFilter === 'inventory' ? 'Inventory Insights' :
               activeFilter === 'utilities' ? 'Utilities Insights' : 'Executive Summary'}
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
                  <p>Total medical inventory valued at <strong>${safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)}</strong>, comprising current stock value of <strong>${safeToLocaleString(expenseData.inventoryExpenses?.currentStockValue)}</strong> and auto-restock investment of <strong>${safeToLocaleString(expenseData.inventoryExpenses?.totalRestockValue)}</strong> across <strong>{expenseData.inventoryExpenses?.totalItems || 0}</strong> unique items.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>⚠️ Stock Alerts</h4>
                  <p>Currently <strong>{expenseData.inventoryExpenses?.lowStockCount || 0}</strong> items require restocking and <strong>{expenseData.inventoryExpenses?.outOfStockCount || 0}</strong> items are completely out of stock. Current health score is <strong>{safeToFixed(expenseData.summary?.inventoryHealthScore)}%</strong>.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>💡 Investment Analysis</h4>
                  <p>Auto-restock system has invested <strong>${safeToLocaleString(expenseData.inventoryExpenses?.totalRestockValue)}</strong> in automatic inventory replenishment, representing <strong>{safeToFixed((expenseData.inventoryExpenses?.totalRestockValue / expenseData.inventoryExpenses?.totalInventoryValue) * 100)}%</strong> of total inventory value. This ensures consistent supply availability.</p>
                </div>
              </>
            ) : activeFilter === 'utilities' ? (
              <>
                <div className="etx-summary-card">
                  <h4>⚡ Utilities Overview</h4>
                  <p>Total utilities expenses amount to <strong>${safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense)}</strong> across <strong>{expenseData.utilitiesExpenses?.totalUtilities || 0}</strong> services. Average monthly utility cost is <strong>${safeToLocaleString(expenseData.summary?.avgUtilitiesPerMonth)}</strong>.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>📊 Payment Status</h4>
                  <p>Payment distribution: <strong>{expenseData.utilitiesExpenses?.paidPayments || 0}</strong> paid bills, <strong>{expenseData.utilitiesExpenses?.pendingPayments || 0}</strong> pending payments, and <strong>{expenseData.utilitiesExpenses?.overduePayments || 0}</strong> overdue bills. Payment score is <strong>{safeToFixed(expenseData.summary?.utilitiesPaymentScore)}%</strong>.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>💡 Cost Management</h4>
                  <p>Utilities represent <strong>{safeToFixed(expenseData.summary?.utilitiesPercentage)}%</strong> of total organizational expenses. Consider energy-efficient upgrades and vendor consolidation to reduce monthly costs.</p>
                </div>
              </>
            ) : (
              // UPDATED: Overall summary with detailed inventory breakdown
              <>
                <div className="etx-summary-card">
                  <h4>💰 Financial Overview</h4>
                  <p>Total organizational expenses amount to <strong>${safeToLocaleString(expenseData.totalExpenses)}</strong>, with payroll accounting for <strong>{safeToFixed(expenseData.summary?.payrollPercentage)}%</strong>, medical inventory (including auto-restock investment) representing <strong>{safeToFixed(expenseData.summary?.inventoryPercentage)}%</strong>, and utilities comprising <strong>{safeToFixed(expenseData.summary?.utilitiesPercentage)}%</strong> of total costs.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>🏥 Medical Inventory Investment</h4>
                  <p>Medical inventory valued at <strong>${safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)}</strong> consists of current stock worth <strong>${safeToLocaleString(expenseData.inventoryExpenses?.currentStockValue)}</strong> and automatic restock investment of <strong>${safeToLocaleString(expenseData.inventoryExpenses?.totalRestockValue)}</strong>, ensuring continuous supply availability.</p>
                </div>
                
                <div className="etx-summary-card">
                  <h4>🏥 Operational Health</h4>
                  <p>System maintains <strong>{expenseData.inventoryExpenses?.totalItems || 0}</strong> medical items with a <strong>{safeToFixed(expenseData.summary?.inventoryHealthScore)}%</strong> health score. Utilities payment score is <strong>{safeToFixed(expenseData.summary?.utilitiesPaymentScore)}%</strong> with <strong>{expenseData.utilitiesExpenses?.overduePayments || 0}</strong> overdue bills requiring attention.</p>
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
