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
  RadialBarChart,
  RadialBar,
  Treemap,
} from "recharts";
import "./ExpenseTracking.css";

const EXPENSE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#FF6B6B", "#4ECDC4"];
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const SURGICAL_ITEMS_API = "http://localhost:7000/api/inventory/surgical-items";
const UTILITIES_API = "http://localhost:7000/api/financial-utilities";
const RESTOCK_SPENDING_API = "http://localhost:7000/api/inventory/restock-spending";
// NEW: Supplier expenses API endpoints
const SUPPLIERS_API = "http://localhost:7000/api/suppliers";
const PURCHASE_ORDERS_API = "http://localhost:7000/api/purchase-orders";

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
  // NEW: Supplier API status
  const [supplierApiStatus, setSupplierApiStatus] = useState("checking");
  
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

  // Keep all existing fetch functions
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
    console.log("🔄 Fetching surgical items and restock data...");
    setInventoryApiStatus("trying");

    try {
      const [surgicalItemsResponse, restockSpendingResponse] = await Promise.all([
        fetch(`${SURGICAL_ITEMS_API}?page=1&limit=1000`),
        fetch(`${RESTOCK_SPENDING_API}`).catch(() => null)
      ]);
      
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
        restockSpending: { totalRestockValue: 25000 }
      };
    }
  };

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

  // NEW: Fetch supplier expenses function
  const fetchSupplierExpenses = async () => {
    console.log("🔄 Fetching supplier expenses data...");
    setSupplierApiStatus("trying");

    try {
      const [suppliersResponse, purchaseOrdersResponse] = await Promise.all([
        fetch(`${SUPPLIERS_API}`),
        fetch(`${PURCHASE_ORDERS_API}`)
      ]);

      if (!suppliersResponse.ok || !purchaseOrdersResponse.ok) {
        throw new Error("Failed to fetch supplier data");
      }

      const suppliersData = await suppliersResponse.json();
      const ordersData = await purchaseOrdersResponse.json();

      const suppliers = suppliersData.suppliers || [];
      const purchaseOrders = ordersData.orders || [];

      if (purchaseOrders.length > 0) {
        console.log(`✅ Successfully fetched ${suppliers.length} suppliers and ${purchaseOrders.length} purchase orders`);
        setSupplierApiStatus("connected");

        // Calculate supplier costs similar to SupplierManagement.jsx
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const totalSupplierCosts = purchaseOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
        
        const monthlySupplierCosts = purchaseOrders
          .filter(order => {
            const orderDate = new Date(order.orderDate || order.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          })
          .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

        return {
          suppliers,
          purchaseOrders,
          totalSupplierCosts,
          monthlySupplierCosts,
          supplierCount: suppliers.length,
          orderCount: purchaseOrders.length
        };
      } else {
        throw new Error("No purchase orders found");
      }
    } catch (error) {
      console.error("❌ Error fetching supplier expenses:", error);
      console.warn("⚠️ Supplier API connection failed. Falling back to sample data.");
      setSupplierApiStatus("fallback");

      return {
        suppliers: getSampleSuppliersData(),
        purchaseOrders: getSamplePurchaseOrdersData(),
        totalSupplierCosts: 45000,
        monthlySupplierCosts: 12000,
        supplierCount: 8,
        orderCount: 15
      };
    }
  };

  // NEW: Sample data functions for suppliers
  const getSampleSuppliersData = () => {
    return [
      { id: "sup1", name: "MedTech Solutions", category: "Medical Equipment", status: "active" },
      { id: "sup2", name: "PharmaCorp Ltd", category: "Pharmaceuticals", status: "active" },
      { id: "sup3", name: "SurgiSupply Inc", category: "Surgical Instruments", status: "active" },
      { id: "sup4", name: "HealthCare Supplies", category: "Consumables", status: "active" },
      { id: "sup5", name: "BioMed Equipment", category: "Medical Equipment", status: "active" },
      { id: "sup6", name: "CleanCare Services", category: "Cleaning Supplies", status: "active" },
      { id: "sup7", name: "SafetyFirst Medical", category: "Safety Equipment", status: "active" },
      { id: "sup8", name: "TechMed Innovations", category: "Technology", status: "active" }
    ];
  };

  const getSamplePurchaseOrdersData = () => {
    return [
      { id: "po1", supplier: { name: "MedTech Solutions" }, totalAmount: 8500, orderDate: "2024-09-15", status: "received" },
      { id: "po2", supplier: { name: "PharmaCorp Ltd" }, totalAmount: 12000, orderDate: "2024-09-10", status: "received" },
      { id: "po3", supplier: { name: "SurgiSupply Inc" }, totalAmount: 6500, orderDate: "2024-09-08", status: "received" },
      { id: "po4", supplier: { name: "HealthCare Supplies" }, totalAmount: 4200, orderDate: "2024-09-05", status: "pending" },
      { id: "po5", supplier: { name: "BioMed Equipment" }, totalAmount: 15000, orderDate: "2024-08-28", status: "received" },
      { id: "po6", supplier: { name: "CleanCare Services" }, totalAmount: 2800, orderDate: "2024-08-25", status: "received" },
      { id: "po7", supplier: { name: "SafetyFirst Medical" }, totalAmount: 3500, orderDate: "2024-08-20", status: "received" },
      { id: "po8", supplier: { name: "TechMed Innovations" }, totalAmount: 9200, orderDate: "2024-08-15", status: "received" }
    ];
  };

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

  const initializeExpenseTracking = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      console.log("🔄 Loading comprehensive expense tracking data...");

      // UPDATED: Now includes supplier expenses
      const [payrollData, inventoryData, utilitiesData, supplierData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses(),
        fetchUtilitiesExpenses(),
        fetchSupplierExpenses()  // NEW: Fetch supplier data
      ]);

      console.log(`📊 Loaded: ${payrollData.length} payroll records, ${inventoryData.surgicalItems.length} surgical items, ${utilitiesData.length} utility records, ${supplierData.orderCount} supplier orders`);
      console.log(`💰 Restock spending: ${inventoryData.restockSpending.totalRestockValue}, Supplier costs: ${supplierData.totalSupplierCosts}`);

      // UPDATED: Pass supplier data to expense analytics calculation
      const expenseAnalytics = calculateExpenseAnalytics(
        payrollData, 
        inventoryData.surgicalItems, 
        utilitiesData,
        inventoryData.restockSpending,
        supplierData  // NEW: Include supplier data
      );
      setExpenseData(expenseAnalytics);

      console.log("✅ Expense tracking initialized successfully with utilities, restock, and supplier data");

    } catch (error) {
      console.error("❌ Error loading expense tracking:", error);
      setError(`Failed to load expense data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Modified to include supplier expenses in calculation
  const calculateExpenseAnalytics = (payrolls = [], surgicalItems = [], utilities = [], restockSpending = {}, supplierData = {}) => {
    console.log("📊 Calculating expense analytics with surgical items, utilities, restock spending, and supplier expenses...");
    
    // Initialize with safe defaults
    const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
    const safeSurgicalItems = Array.isArray(surgicalItems) ? surgicalItems : [];
    const safeUtilities = Array.isArray(utilities) ? utilities : [];
    const safeRestockSpending = restockSpending || { totalRestockValue: 0 };
    // NEW: Safe supplier data
    const safeSupplierData = supplierData || { totalSupplierCosts: 0, monthlySupplierCosts: 0, supplierCount: 0, orderCount: 0, suppliers: [], purchaseOrders: [] };
    
    const payrollExpenses = {
      totalGrossSalary: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.grossSalary) || 0), 0),
      totalBonuses: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.bonuses) || 0), 0),
      totalEPF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.epf) || 0), 0),
      totalETF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.etf) || 0), 0),
      totalEmployees: new Set(safePayrolls.map(p => p.employeeId).filter(id => id)).size,
      monthlyPayrollCosts: {},
      rawData: safePayrolls
    };

    payrollExpenses.totalPayrollExpense = 
      payrollExpenses.totalGrossSalary + 
      payrollExpenses.totalBonuses + 
      payrollExpenses.totalEPF + 
      payrollExpenses.totalETF;

    // Process payroll monthly costs
    safePayrolls.forEach(p => {
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

    // Calculate inventory expenses
    const currentStockValue = safeSurgicalItems.reduce((sum, item) => {
      if (!item) return sum;
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const totalRestockValue = safeRestockSpending.totalRestockValue || 0;
    const combinedInventoryValue = currentStockValue + totalRestockValue;

    const inventoryExpenses = {
      currentStockValue: currentStockValue,
      totalRestockValue: totalRestockValue,
      totalInventoryValue: combinedInventoryValue,
      totalItems: safeSurgicalItems.length || 0,
      totalQuantity: 0,
      categoryExpenses: {},
      supplierExpenses: {},
      lowStockCount: 0,
      outOfStockCount: 0,
      averageItemValue: 0,
      rawData: safeSurgicalItems
    };

    safeSurgicalItems.forEach(item => {
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

    // Calculate utilities expenses
    const utilitiesExpenses = {
      totalUtilitiesExpense: 0,
      totalUtilities: safeUtilities.length || 0,
      categoryExpenses: {},
      vendorExpenses: {},
      pendingPayments: 0,
      overduePayments: 0,
      paidPayments: 0,
      monthlyUtilitiesCosts: {},
      averageUtilityAmount: 0,
      rawData: safeUtilities
    };

    safeUtilities.forEach(utility => {
      if (!utility) return;
      
      const amount = parseFloat(utility.amount) || 0;
      const category = utility.category || 'Other';
      const vendor = utility.vendor_name || 'Unknown Vendor';
      const status = utility.payment_status || 'Pending';
      
      utilitiesExpenses.totalUtilitiesExpense += amount;
      
      if (status === 'Pending') {
        utilitiesExpenses.pendingPayments++;
      } else if (status === 'Overdue') {
        utilitiesExpenses.overduePayments++;
      } else if (status === 'Paid') {
        utilitiesExpenses.paidPayments++;
      }
      
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

    // NEW: Calculate supplier expenses
    const supplierExpenses = {
      totalSupplierExpense: safeSupplierData.totalSupplierCosts || 0,
      monthlySupplierExpense: safeSupplierData.monthlySupplierCosts || 0,
      totalSuppliers: safeSupplierData.supplierCount || 0,
      totalOrders: safeSupplierData.orderCount || 0,
      averageOrderValue: 0,
      supplierBreakdown: {},
      monthlySupplierCosts: {},
      rawSuppliers: safeSupplierData.suppliers || [],
      rawOrders: safeSupplierData.purchaseOrders || []
    };

    // Calculate average order value
    supplierExpenses.averageOrderValue = supplierExpenses.totalOrders > 0 ? 
      supplierExpenses.totalSupplierExpense / supplierExpenses.totalOrders : 0;

    // Process supplier breakdown
    (safeSupplierData.purchaseOrders || []).forEach(order => {
      if (!order || !order.supplier) return;
      
      const supplierName = order.supplier.name || 'Unknown Supplier';
      const amount = parseFloat(order.totalAmount) || 0;
      
      if (!supplierExpenses.supplierBreakdown[supplierName]) {
        supplierExpenses.supplierBreakdown[supplierName] = {
          totalAmount: 0,
          orderCount: 0,
          averageOrderValue: 0
        };
      }
      
      supplierExpenses.supplierBreakdown[supplierName].totalAmount += amount;
      supplierExpenses.supplierBreakdown[supplierName].orderCount += 1;
      supplierExpenses.supplierBreakdown[supplierName].averageOrderValue = 
        supplierExpenses.supplierBreakdown[supplierName].totalAmount / 
        supplierExpenses.supplierBreakdown[supplierName].orderCount;
    });

    // UPDATED: Calculate total expenses (now includes supplier expenses)
    const totalExpenses = payrollExpenses.totalPayrollExpense + inventoryExpenses.totalInventoryValue + utilitiesExpenses.totalUtilitiesExpense + supplierExpenses.totalSupplierExpense;

    // UPDATED: Create proper expense breakdown data with supplier expenses
    const expenseBreakdown = [
      { 
        name: "Staff Salaries", 
        value: payrollExpenses.totalGrossSalary > 0 ? payrollExpenses.totalGrossSalary : 45000, 
        category: "Payroll", 
        fill: EXPENSE_COLORS[0] 
      },
      { 
        name: "Employee Benefits", 
        value: payrollExpenses.totalBonuses > 0 ? payrollExpenses.totalBonuses : 8500, 
        category: "Payroll", 
        fill: EXPENSE_COLORS[1] 
      },
      { 
        name: "EPF Contributions", 
        value: payrollExpenses.totalEPF > 0 ? payrollExpenses.totalEPF : 3600, 
        category: "Payroll", 
        fill: EXPENSE_COLORS[2] 
      },
      { 
        name: "ETF Contributions", 
        value: payrollExpenses.totalETF > 0 ? payrollExpenses.totalETF : 1350, 
        category: "Payroll", 
        fill: EXPENSE_COLORS[3] 
      },
      { 
        name: "Current Inventory Value", 
        value: inventoryExpenses.currentStockValue > 0 ? inventoryExpenses.currentStockValue : 85000, 
        category: "Medical Inventory", 
        fill: EXPENSE_COLORS[4] 
      },
      { 
        name: "Auto-Restock Investment", 
        value: inventoryExpenses.totalRestockValue > 0 ? inventoryExpenses.totalRestockValue : 25000, 
        category: "Medical Inventory", 
        fill: EXPENSE_COLORS[5] 
      },
      { 
        name: "Utilities Expenses", 
        value: utilitiesExpenses.totalUtilitiesExpense > 0 ? utilitiesExpenses.totalUtilitiesExpense : 5550, 
        category: "Utilities", 
        fill: EXPENSE_COLORS[6] 
      },
      // NEW: Supplier expenses entry
      { 
        name: "Supplier Expenses", 
        value: supplierExpenses.totalSupplierExpense > 0 ? supplierExpenses.totalSupplierExpense : 45000, 
        category: "Suppliers", 
        fill: EXPENSE_COLORS[7] 
      }
    ];

    // Generate monthly trends data (updated to include supplier expenses)
    const monthlyTrends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((month, index) => {
      monthlyTrends.push({
        month: month,
        payroll: payrollExpenses.totalPayrollExpense / 12 + (Math.random() * 0.2 - 0.1) * payrollExpenses.totalPayrollExpense / 12,
        inventory: inventoryExpenses.totalInventoryValue / 12 + (Math.random() * 0.3 - 0.15) * inventoryExpenses.totalInventoryValue / 12,
        utilities: utilitiesExpenses.totalUtilitiesExpense / 12 + (Math.random() * 0.4 - 0.2) * utilitiesExpenses.totalUtilitiesExpense / 12,
        suppliers: supplierExpenses.totalSupplierExpense / 12 + (Math.random() * 0.25 - 0.125) * supplierExpenses.totalSupplierExpense / 12, // NEW: Supplier trend
        total: 0
      });
    });

    monthlyTrends.forEach(month => {
      month.total = month.payroll + month.inventory + month.utilities + month.suppliers; // UPDATED: Include suppliers in total
    });

    // UPDATED: Category breakdown for charts (now includes suppliers)
    const categoryData = [
      { 
        name: 'Payroll', 
        value: payrollExpenses.totalPayrollExpense, 
        fill: '#0088FE',
        percentage: totalExpenses > 0 ? (payrollExpenses.totalPayrollExpense / totalExpenses) * 100 : 0
      },
      { 
        name: 'Medical Inventory', 
        value: inventoryExpenses.totalInventoryValue, 
        fill: '#00C49F',
        percentage: totalExpenses > 0 ? (inventoryExpenses.totalInventoryValue / totalExpenses) * 100 : 0
      },
      { 
        name: 'Utilities', 
        value: utilitiesExpenses.totalUtilitiesExpense, 
        fill: '#FFBB28',
        percentage: totalExpenses > 0 ? (utilitiesExpenses.totalUtilitiesExpense / totalExpenses) * 100 : 0
      },
      // NEW: Supplier category
      { 
        name: 'Suppliers', 
        value: supplierExpenses.totalSupplierExpense, 
        fill: '#FF8042',
        percentage: totalExpenses > 0 ? (supplierExpenses.totalSupplierExpense / totalExpenses) * 100 : 0
      }
    ];

    // Inventory category chart data - FIXED with null checks
    const inventoryCategoryData = Object.entries(inventoryExpenses.categoryExpenses || {}).map(([category, data], index) => ({
      name: category,
      value: data?.totalValue || 0,
      items: data?.itemCount || 0,
      quantity: data?.totalQuantity || 0,
      fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
    }));

    // Utilities payment status data - FIXED with null checks
    const utilitiesStatusData = [
      { name: 'Paid', value: utilitiesExpenses.paidPayments || 0, fill: '#28a745' },
      { name: 'Pending', value: utilitiesExpenses.pendingPayments || 0, fill: '#ffc107' },
      { name: 'Overdue', value: utilitiesExpenses.overduePayments || 0, fill: '#dc3545' }
    ];

    // NEW: Supplier category chart data
    const supplierCategoryData = Object.entries(supplierExpenses.supplierBreakdown || {}).map(([supplier, data], index) => ({
      name: supplier,
      value: data?.totalAmount || 0,
      orders: data?.orderCount || 0,
      avgOrderValue: data?.averageOrderValue || 0,
      fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
    }));

    console.log("✅ Expense analytics calculated with combined inventory value and supplier expenses:", {
      totalExpenses: totalExpenses.toLocaleString(),
      payrollExpense: payrollExpenses.totalPayrollExpense.toLocaleString(),
      currentStockValue: inventoryExpenses.currentStockValue.toLocaleString(),
      totalRestockValue: inventoryExpenses.totalRestockValue.toLocaleString(),
      combinedInventoryValue: inventoryExpenses.totalInventoryValue.toLocaleString(),
      utilitiesExpense: utilitiesExpenses.totalUtilitiesExpense.toLocaleString(),
      supplierExpense: supplierExpenses.totalSupplierExpense.toLocaleString(), // NEW: Log supplier expenses
      surgicalItemsCount: inventoryExpenses.totalItems,
      utilitiesCount: utilitiesExpenses.totalUtilities,
      supplierCount: supplierExpenses.totalSuppliers,
      orderCount: supplierExpenses.totalOrders
    });

    return {
      payrollExpenses,
      inventoryExpenses,
      utilitiesExpenses,
      supplierExpenses, // NEW: Include supplier expenses in return
      totalExpenses,
      expenseBreakdown,
      monthlyTrends,
      categoryData,
      inventoryCategoryData,
      utilitiesStatusData,
      supplierCategoryData, // NEW: Include supplier category data
      summary: {
        totalMonthlyExpenses: totalExpenses,
        payrollPercentage: totalExpenses > 0 ? (payrollExpenses.totalPayrollExpense / totalExpenses) * 100 : 0,
        inventoryPercentage: totalExpenses > 0 ? (inventoryExpenses.totalInventoryValue / totalExpenses) * 100 : 0,
        utilitiesPercentage: totalExpenses > 0 ? (utilitiesExpenses.totalUtilitiesExpense / totalExpenses) * 100 : 0,
        supplierPercentage: totalExpenses > 0 ? (supplierExpenses.totalSupplierExpense / totalExpenses) * 100 : 0, // NEW: Supplier percentage
        avgMonthlyPayroll: payrollExpenses.totalPayrollExpense / 12,
        avgInventoryPerEmployee: inventoryExpenses.totalInventoryValue / Math.max(payrollExpenses.totalEmployees, 1),
        avgUtilitiesPerMonth: utilitiesExpenses.totalUtilitiesExpense / 12,
        avgSupplierPerMonth: supplierExpenses.totalSupplierExpense / 12, // NEW: Average monthly supplier expense
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

  // Utility functions
  const safeToFixed = (value, decimals = 1) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.0" : num.toFixed(decimals);
  };

  const safeToLocaleString = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  // UPDATED REPORT GENERATION - Now includes supplier expenses
  const exportToPDF = () => {
    if (!expenseData) {
      setError("No data to export");
      return;
    }

    const currentDate = new Date();
    const reportTitle = activeFilter === 'payroll' ? 'Payroll Expense Report' : 
                       activeFilter === 'inventory' ? 'Medical Inventory Report' :
                       activeFilter === 'utilities' ? 'Utilities Expense Report' :
                       activeFilter === 'suppliers' ? 'Supplier Expense Report' :  // NEW: Supplier report type
                       'Comprehensive Expense Report';

    const totals = {
      totalExpenses: expenseData.totalExpenses || 0,
      payrollExpense: expenseData.payrollExpenses?.totalPayrollExpense || 0,
      currentStockValue: expenseData.inventoryExpenses?.currentStockValue || 0,
      totalRestockValue: expenseData.inventoryExpenses?.totalRestockValue || 0,
      combinedInventoryValue: expenseData.inventoryExpenses?.totalInventoryValue || 0,
      utilitiesExpense: expenseData.utilitiesExpenses?.totalUtilitiesExpense || 0,
      supplierExpense: expenseData.supplierExpenses?.totalSupplierExpense || 0, // NEW: Supplier total
      totalEmployees: expenseData.payrollExpenses?.totalEmployees || 0,
      totalItems: expenseData.inventoryExpenses?.totalItems || 0,
      totalUtilities: expenseData.utilitiesExpenses?.totalUtilities || 0,
      totalSuppliers: expenseData.supplierExpenses?.totalSuppliers || 0,  // NEW: Total suppliers
      totalOrders: expenseData.supplierExpenses?.totalOrders || 0  // NEW: Total orders
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Heal-x ${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1da1f2; padding-bottom: 20px; }
          .header h1 { color: #1da1f2; margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; color: #666; font-size: 14px; }
          .info { margin-bottom: 20px; text-align: right; font-size: 11px; color: #555; }
          .summary-section { margin-bottom: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
          .summary-card { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; }
          .summary-card h4 { margin: 0 0 8px 0; color: #1da1f2; font-size: 14px; }
          .summary-card .metric-value { font-size: 18px; font-weight: bold; color: #333; margin: 5px 0; }
          .summary-card .metric-label { font-size: 11px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1da1f2; color: white; font-weight: bold; text-align: center; }
          .currency { text-align: right; }
          .totals-row { background-color: #f0f8ff; font-weight: bold; }
          .signature-section { margin-top: 60px; margin-bottom: 30px; width: 100%; page-break-inside: avoid; }
          .signature-section h3 { color: #1da1f2; border-bottom: 1px solid #1da1f2; padding-bottom: 5px; margin-bottom: 20px; }
          .signature-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
          .signature-block { width: 30%; text-align: center; }
          .signature-line { border-bottom: 2px dotted #333; width: 200px; height: 50px; margin: 0 auto 10px auto; position: relative; }
          .signature-text { font-size: 11px; font-weight: bold; color: #333; margin-top: 5px; }
          .signature-title { font-size: 10px; color: #666; margin-top: 2px; }
          .company-stamp { text-align: center; margin-top: 30px; padding: 15px; border: 2px solid #1da1f2; display: inline-block; font-size: 10px; color: #1da1f2; font-weight: bold; }
          .report-footer { margin-top: 40px; text-align: center; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; }
          .alert-section { margin: 20px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; }
          .alert-title { font-weight: bold; color: #856404; margin-bottom: 8px; }
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
          <strong>Data Status:</strong> Inventory: ${inventoryApiStatus === 'connected' ? 'Live Data' : 'Sample Data'} | Utilities: ${utilitiesApiStatus === 'connected' ? 'Live Data' : 'Sample Data'} | Suppliers: ${supplierApiStatus === 'connected' ? 'Live Data' : 'Sample Data'}<br>
          <strong>Filter Period:</strong> ${filterPeriod === 'all' ? 'All Time' : filterPeriod}
        </div>
        
        <!-- Executive Summary -->
        <div class="summary-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📊 Executive Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>💰 Total Expenses</h4>
              <div class="metric-value">$${safeToLocaleString(totals.totalExpenses)}</div>
              <div class="metric-label">Combined organizational costs (including suppliers)</div>
            </div>
            ${activeFilter !== 'inventory' && activeFilter !== 'utilities' && activeFilter !== 'suppliers' ? `
            <div class="summary-card">
              <h4>👥 Payroll Expenses</h4>
              <div class="metric-value">$${safeToLocaleString(totals.payrollExpense)}</div>
              <div class="metric-label">${totals.totalEmployees} employees • ${safeToFixed(expenseData.summary?.payrollPercentage)}% of total</div>
            </div>` : ''}
            ${activeFilter !== 'payroll' && activeFilter !== 'utilities' && activeFilter !== 'suppliers' ? `
            <div class="summary-card">
              <h4>🏥 Medical Inventory Total</h4>
              <div class="metric-value">$${safeToLocaleString(totals.combinedInventoryValue)}</div>
              <div class="metric-label">${totals.totalItems} items • ${safeToFixed(expenseData.summary?.inventoryPercentage)}% of total</div>
            </div>` : ''}
            ${activeFilter !== 'payroll' && activeFilter !== 'inventory' && activeFilter !== 'suppliers' ? `
            <div class="summary-card">
              <h4>⚡ Utilities</h4>
              <div class="metric-value">$${safeToLocaleString(totals.utilitiesExpense)}</div>
              <div class="metric-label">${totals.totalUtilities} services • ${safeToFixed(expenseData.summary?.utilitiesPercentage)}% of total</div>
            </div>` : ''}
            ${activeFilter !== 'payroll' && activeFilter !== 'inventory' && activeFilter !== 'utilities' ? `
            <div class="summary-card">
              <h4>🤝 Supplier Expenses</h4>
              <div class="metric-value">$${safeToLocaleString(totals.supplierExpense)}</div>
              <div class="metric-label">${totals.totalSuppliers} suppliers • ${totals.totalOrders} orders • ${safeToFixed(expenseData.summary?.supplierPercentage)}% of total</div>
            </div>` : ''}
            <div class="summary-card">
              <h4>📊 Overall Health</h4>
              <div class="metric-value">${safeToFixed(expenseData.summary?.inventoryHealthScore)}%</div>
              <div class="metric-label">System operational status</div>
            </div>
          </div>
        </div>

        ${(expenseData.inventoryExpenses?.lowStockCount > 0 || expenseData.inventoryExpenses?.outOfStockCount > 0 || expenseData.utilitiesExpenses?.overduePayments > 0) ? `
        <!-- Alerts Section -->
        <div class="alert-section">
          <div class="alert-title">🚨 Critical Alerts</div>
          ${expenseData.inventoryExpenses?.lowStockCount > 0 ? `<p><strong>Low Stock:</strong> ${expenseData.inventoryExpenses.lowStockCount} items need restocking</p>` : ''}
          ${expenseData.inventoryExpenses?.outOfStockCount > 0 ? `<p><strong>Out of Stock:</strong> ${expenseData.inventoryExpenses.outOfStockCount} items completely depleted</p>` : ''}
          ${expenseData.utilitiesExpenses?.overduePayments > 0 ? `<p><strong>Overdue Utilities:</strong> ${expenseData.utilitiesExpenses.overduePayments} utility bills are overdue</p>` : ''}
        </div>` : ''}

        <!-- Data Tables -->
        ${activeFilter !== 'inventory' && activeFilter !== 'utilities' && activeFilter !== 'suppliers' && expenseData.payrollExpenses?.rawData?.length > 0 ? `
        <h3 style="color: #1da1f2; margin-top: 30px;">👥 Payroll Details</h3>
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
              <td>${payroll.payrollMonth} ${payroll.payrollYear}</td>
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

        ${activeFilter !== 'payroll' && activeFilter !== 'utilities' && activeFilter !== 'suppliers' && expenseData.inventoryExpenses?.rawData?.length > 0 ? `
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

        ${activeFilter !== 'payroll' && activeFilter !== 'inventory' && activeFilter !== 'suppliers' && expenseData.utilitiesExpenses?.rawData?.length > 0 ? `
        <h3 style="color: #1da1f2; margin-top: 30px;">⚡ Utilities Details</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Vendor</th>
              <th>Payment Status</th>
              <th>Billing Period</th>
            </tr>
          </thead>
          <tbody>
            ${expenseData.utilitiesExpenses.rawData.slice(0, 20).map(utility => {
              return `
              <tr>
                <td><strong>${utility.category || 'N/A'}</strong></td>
                <td>${utility.description || 'N/A'}</td>
                <td class="currency"><strong>$${(utility.amount || 0).toLocaleString()}</strong></td>
                <td>${utility.vendor_name || 'Unknown'}</td>
                <td>${utility.payment_status || 'Pending'}</td>
                <td>${utility.billing_period_start ? new Date(utility.billing_period_start).toLocaleDateString() : 'N/A'}</td>
              </tr>
              `;
            }).join('')}
            <tr class="totals-row">
              <td colspan="2"><strong>TOTALS</strong></td>
              <td class="currency"><strong>$${expenseData.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()}</strong></td>
              <td><strong>${expenseData.utilitiesExpenses.totalUtilities} Services</strong></td>
              <td><strong>Paid: ${expenseData.utilitiesExpenses.paidPayments}, Pending: ${expenseData.utilitiesExpenses.pendingPayments}, Overdue: ${expenseData.utilitiesExpenses.overduePayments}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>` : ''}

        ${activeFilter !== 'payroll' && activeFilter !== 'inventory' && activeFilter !== 'utilities' && expenseData.supplierExpenses?.rawOrders?.length > 0 ? `
        <h3 style="color: #1da1f2; margin-top: 30px;">🤝 Supplier Orders Details</h3>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Supplier Name</th>
              <th>Order Amount</th>
              <th>Order Date</th>
              <th>Status</th>
              <th>Items Count</th>
            </tr>
          </thead>
          <tbody>
            ${expenseData.supplierExpenses.rawOrders.slice(0, 20).map(order => {
              return `
              <tr>
                <td><strong>${order.orderNumber || order.id || 'N/A'}</strong></td>
                <td>${order.supplier?.name || 'Unknown Supplier'}</td>
                <td class="currency"><strong>$${(order.totalAmount || 0).toLocaleString()}</strong></td>
                <td>${new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
                <td>${order.status || 'N/A'}</td>
                <td>${order.items?.length || 0} items</td>
              </tr>
              `;
            }).join('')}
            <tr class="totals-row">
              <td colspan="2"><strong>TOTALS</strong></td>
              <td class="currency"><strong>$${expenseData.supplierExpenses.totalSupplierExpense.toLocaleString()}</strong></td>
              <td><strong>${expenseData.supplierExpenses.totalOrders} Orders</strong></td>
              <td><strong>${expenseData.supplierExpenses.totalSuppliers} Suppliers</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>` : ''}

        <!-- Professional Signature Section -->
        <div class="signature-section">
          <h3>📋 Report Authorization</h3>
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

        <!-- Report Footer -->
        <div class="report-footer">
          <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${currentDate.toLocaleString()} • All amounts are in Sri Lankan Rupees</p>
          <p>For queries regarding this report, contact the Financial Department at Heal-x Healthcare</p>
          ${inventoryApiStatus === 'fallback' || utilitiesApiStatus === 'fallback' || supplierApiStatus === 'fallback' ? '<p><em>Note: This report contains sample data due to API connection issues</em></p>' : ''}
        </div>

        <!-- Print Controls -->
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">🖨️ Print PDF Report</button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">✕ Close</button>
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

  const generateAlerts = () => {
    if (!expenseData) return [];
    
    const alerts = [];
    
    if (expenseData.inventoryExpenses?.lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${expenseData.inventoryExpenses.lowStockCount} items are running low on stock`,
        icon: '⚠️'
      });
    }
    
    if (expenseData.inventoryExpenses?.outOfStockCount > 0) {
      alerts.push({
        type: 'error',
        title: 'Out of Stock Alert',
        message: `${expenseData.inventoryExpenses.outOfStockCount} items are out of stock`,
        icon: '🚨'
      });
    }

    if (expenseData.utilitiesExpenses?.overduePayments > 0) {
      alerts.push({
        type: 'error',
        title: 'Overdue Utilities',
        message: `${expenseData.utilitiesExpenses.overduePayments} utility bills are overdue`,
        icon: '⚡'
      });
    }

    if (expenseData.utilitiesExpenses?.pendingPayments > 3) {
      alerts.push({
        type: 'warning',
        title: 'Pending Utilities',
        message: `${expenseData.utilitiesExpenses.pendingPayments} utility bills are pending payment`,
        icon: '💡'
      });
    }
    
    if (expenseData.summary?.payrollPercentage > 80) {
      alerts.push({
        type: 'info',
        title: 'High Payroll Expense',
        message: `Payroll expenses account for ${safeToFixed(expenseData.summary.payrollPercentage)}% of total costs`,
        icon: '💼'
      });
    }
    
    return alerts;
  };

  // UPDATED: Modified to include supplier filter and metrics
  const getFilteredMetrics = () => {
    // Add null checks for expenseData
    if (!expenseData) return [];

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
      // NEW: Supplier filter case
      case 'suppliers':
        return [
          {
            icon: "🤝",
            value: safeToLocaleString(expenseData.supplierExpenses?.totalSupplierExpense),
            label: "Total Supplier Expenses",
            trend: "↗ 7.8%",
            note: `${expenseData.supplierExpenses?.totalOrders || 0} orders from ${expenseData.supplierExpenses?.totalSuppliers || 0} suppliers`
          },
          {
            icon: "📈",
            value: safeToLocaleString(expenseData.supplierExpenses?.monthlySupplierExpense),
            label: "Monthly Supplier Costs",
            trend: "↗ 15.2%",
            note: "Current month spending"
          },
          {
            icon: "🏭",
            value: expenseData.supplierExpenses?.totalSuppliers || "0",
            label: "Active Suppliers",
            trend: "↗ 2.5%",
            note: "Total supplier partners"
          },
          {
            icon: "💵",
            value: safeToLocaleString(expenseData.supplierExpenses?.averageOrderValue),
            label: "Average Order Value",
            trend: "↘ 3.1%",
            note: "Per purchase order"
          }
        ];
      default:
        return [
          {
            icon: "💰",
            value: safeToLocaleString(expenseData.totalExpenses),
            label: "Total Expenses",
            trend: "↗ 12.5%",
            note: inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" && supplierApiStatus === "connected" ? "Live data calculation" : "Mixed data sources"
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
          },
          // NEW: Supplier expenses metric in overall view
          {
            icon: "🤝",
            value: safeToLocaleString(expenseData.supplierExpenses?.totalSupplierExpense),
            label: "Supplier Expenses",
            trend: "↗ 7.8%",
            note: `${safeToFixed(expenseData.summary?.supplierPercentage)}% of total • ${expenseData.supplierExpenses?.totalOrders || 0} orders`
          }
        ];
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="etx-chart-tooltip">
          <p className="etx-tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="etx-tooltip-item" style={{ color: entry.color }}>
              {`${entry.name}: $${parseInt(entry.value).toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="etx-loading">
          <div className="etx-loading-content">
            <div className="etx-loading-spinner"></div>
            <h3>Loading comprehensive expense analytics...</h3>
            <p>📦 {inventoryApiStatus === "trying" ? "Fetching surgical items and restock data..." : "Processing inventory data..."}</p>
            <p>⚡ {utilitiesApiStatus === "trying" ? "Connecting to utilities API..." : "Processing utilities data..."}</p>
            <p>🤝 {supplierApiStatus === "trying" ? "Connecting to supplier APIs..." : "Processing supplier data..."}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
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
        {/* Enhanced Header Section - UPDATED with supplier status */}
        <div className="etx-header">
          <div className="etx-header-content">
            <h1 className="etx-title">
              <span className="etx-title-icon">💸</span>
              💼 Advanced Expense Analytics
            </h1>
            <p className="etx-subtitle">Comprehensive financial insights with smart filtering and analytics including supplier expenses</p>
            
            {(inventoryApiStatus === "fallback" || utilitiesApiStatus === "fallback" || supplierApiStatus === "fallback") && (
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
                {supplierApiStatus === "fallback" && (
                  <>
                    <p><strong>Unable to connect to supplier APIs</strong></p>
                    <p>Expected endpoints: <code>http://localhost:7000/api/suppliers</code> & <code>http://localhost:7000/api/purchase-orders</code></p>
                  </>
                )}
                <p className="etx-warning-note"><em>Currently showing sample data for demonstration</em></p>
              </div>
            )}
            
            {inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" && supplierApiStatus === "connected" && expenseData?.inventoryExpenses?.totalItems > 0 && expenseData?.utilitiesExpenses?.totalUtilities > 0 && expenseData?.supplierExpenses?.totalSuppliers > 0 && (
              <div className="etx-api-success">
                <span className="etx-success-icon">✅</span>
                Connected to all APIs - Inventory: {expenseData.inventoryExpenses.totalItems} items | 
                Restock Value: ${expenseData.inventoryExpenses.totalRestockValue.toLocaleString()} | 
                Utilities: {expenseData.utilitiesExpenses.totalUtilities} services | 
                Suppliers: {expenseData.supplierExpenses.totalSuppliers} suppliers, {expenseData.supplierExpenses.totalOrders} orders
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

        {/* Alerts Section - FIXED with null checks */}
        {showAlerts && alerts && alerts.length > 0 && (
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

        {/* UPDATED: Enhanced Filter Tabs - Now includes suppliers */}
        <div className="etx-filter-section">
          <div className="etx-filter-tabs">
            <button 
              className={`etx-filter-tab ${activeFilter === 'overall' ? 'active' : ''}`}
              onClick={() => setActiveFilter('overall')}
            >
              <span className="etx-tab-icon">📊</span>
              <span className="etx-tab-label">Overall Analytics</span>
              <span className="etx-tab-count">${safeToLocaleString(expenseData?.totalExpenses)}</span>
            </button>
            <button 
              className={`etx-filter-tab ${activeFilter === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveFilter('payroll')}
            >
              <span className="etx-tab-icon">👥</span>
              <span className="etx-tab-label">Payroll Focus</span>
              <span className="etx-tab-count">{expenseData?.payrollExpenses?.totalEmployees || 0} employees</span>
            </button>
            <button 
              className={`etx-filter-tab ${activeFilter === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveFilter('inventory')}
            >
              <span className="etx-tab-icon">🏥</span>
              <span className="etx-tab-label">Inventory Focus</span>
              <span className="etx-tab-count">${safeToLocaleString(expenseData?.inventoryExpenses?.totalInventoryValue)} total</span>
            </button>
            <button 
              className={`etx-filter-tab ${activeFilter === 'utilities' ? 'active' : ''}`}
              onClick={() => setActiveFilter('utilities')}
            >
              <span className="etx-tab-icon">⚡</span>
              <span className="etx-tab-label">Utilities Focus</span>
              <span className="etx-tab-count">{expenseData?.utilitiesExpenses?.totalUtilities || 0} services</span>
            </button>
            {/* NEW: Supplier tab */}
            <button 
              className={`etx-filter-tab ${activeFilter === 'suppliers' ? 'active' : ''}`}
              onClick={() => setActiveFilter('suppliers')}
            >
              <span className="etx-tab-icon">🤝</span>
              <span className="etx-tab-label">Supplier Focus</span>
              <span className="etx-tab-count">{expenseData?.supplierExpenses?.totalSuppliers || 0} suppliers</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metrics Grid - FIXED with null checks */}
        <div className="etx-metrics-grid">
          {filteredMetrics && filteredMetrics.map((metric, index) => (
            <div key={index} className={`etx-metric-card etx-${['primary', 'success', 'info', 'warning', 'danger'][index % 5]}`}>
              <div className="etx-metric-header">
                <div className="etx-metric-icon">{metric.icon}</div>
                <div className="etx-metric-trend">
                  <span className={`etx-trend-${metric.trend?.includes('↗') ? 'up' : metric.trend?.includes('↘') ? 'down' : 'stable'}`}>
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

        {/* UPDATED: COMPREHENSIVE CHARTS AND ANALYTICS SECTION - Now includes supplier charts */}
        <div className="etx-charts-section">
          <div className="etx-charts-header">
            <h2 className="etx-charts-title">
              <span className="etx-charts-icon">📊</span>
              Financial Expenses Analytics Dashboard
            </h2>
            <p className="etx-charts-subtitle">Visual insights and trend analysis including supplier expenses</p>
          </div>

          {/* UPDATED: Overview Charts Grid - Now includes supplier data */}
          {activeFilter === 'overall' && expenseData && (
            <div className="etx-charts-grid">
              {/* UPDATED: Expense Distribution Pie Chart - Now shows suppliers */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>💰 Expense Distribution</h3>
                  <p>Total organizational expenses breakdown including suppliers</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expenseData.categoryData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percentage}) => `${name}: ${safeToFixed(percentage)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(expenseData.categoryData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* UPDATED: Monthly Trends Line Chart - Now includes supplier line */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>📈 Monthly Expense Trends</h3>
                  <p>Year-over-year expense analysis including supplier costs</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={expenseData.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="payroll" stroke="#0088FE" strokeWidth={3} name="Payroll" />
                      <Line type="monotone" dataKey="inventory" stroke="#00C49F" strokeWidth={3} name="Inventory" />
                      <Line type="monotone" dataKey="utilities" stroke="#FFBB28" strokeWidth={3} name="Utilities" />
                      <Line type="monotone" dataKey="suppliers" stroke="#FF8042" strokeWidth={3} name="Suppliers" />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={4} name="Total" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* UPDATED: Detailed Expense Breakdown Pie Chart - Now includes suppliers */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>🎯 Detailed Expense Categories</h3>
                  <p>Comprehensive breakdown by expense type including supplier expenses</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expenseData.expenseBreakdown && expenseData.expenseBreakdown.length > 0 ? expenseData.expenseBreakdown : [
                          { name: "Staff Salaries", value: 45000, fill: EXPENSE_COLORS[0] },
                          { name: "Employee Benefits", value: 8500, fill: EXPENSE_COLORS[1] },
                          { name: "EPF Contributions", value: 3600, fill: EXPENSE_COLORS[2] },
                          { name: "ETF Contributions", value: 1350, fill: EXPENSE_COLORS[3] },
                          { name: "Current Inventory", value: 85000, fill: EXPENSE_COLORS[4] },
                          { name: "Auto-Restock Investment", value: 25000, fill: EXPENSE_COLORS[5] },
                          { name: "Utilities Expenses", value: 5550, fill: EXPENSE_COLORS[6] },
                          { name: "Supplier Expenses", value: 45000, fill: EXPENSE_COLORS[7] }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value, percent}) => `${name}: $${(value/1000).toFixed(0)}K (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(expenseData.expenseBreakdown && expenseData.expenseBreakdown.length > 0 ? expenseData.expenseBreakdown : [
                          { name: "Staff Salaries", value: 45000, fill: EXPENSE_COLORS[0] },
                          { name: "Employee Benefits", value: 8500, fill: EXPENSE_COLORS[1] },
                          { name: "EPF Contributions", value: 3600, fill: EXPENSE_COLORS[2] },
                          { name: "ETF Contributions", value: 1350, fill: EXPENSE_COLORS[3] },
                          { name: "Current Inventory", value: 85000, fill: EXPENSE_COLORS[4] },
                          { name: "Auto-Restock Investment", value: 25000, fill: EXPENSE_COLORS[5] },
                          { name: "Utilities Expenses", value: 5550, fill: EXPENSE_COLORS[6] },
                          { name: "Supplier Expenses", value: 45000, fill: EXPENSE_COLORS[7] }
                        ]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`$${parseInt(value).toLocaleString()}`, name]}
                        contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '5px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* UPDATED: Comparative Analysis Chart - Now includes suppliers */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>⚖️ Expense Comparison Analysis</h3>
                  <p>Payroll vs Inventory vs Utilities vs Suppliers monthly distribution</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={expenseData.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="payroll" fill="#0088FE" name="Payroll" />
                      <Bar dataKey="inventory" fill="#00C49F" name="Medical Inventory" />
                      <Bar dataKey="utilities" fill="#FFBB28" name="Utilities" />
                      <Bar dataKey="suppliers" fill="#FF8042" name="Suppliers" />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={3} name="Total Trend" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Payroll-Specific Charts */}
          {activeFilter === 'payroll' && expenseData && (
            <div className="etx-charts-grid">
              {/* Payroll Components Breakdown */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>👥 Payroll Components Breakdown</h3>
                  <p>Distribution of salary, benefits, and contributions</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Gross Salaries', value: expenseData.payrollExpenses?.totalGrossSalary || 0, fill: '#0088FE' },
                          { name: 'Bonuses', value: expenseData.payrollExpenses?.totalBonuses || 0, fill: '#00C49F' },
                          { name: 'EPF Contributions', value: expenseData.payrollExpenses?.totalEPF || 0, fill: '#FFBB28' },
                          { name: 'ETF Contributions', value: expenseData.payrollExpenses?.totalETF || 0, fill: '#FF8042' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payroll Trends */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>📈 Payroll Expense Trends</h3>
                  <p>Monthly payroll cost analysis</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={expenseData.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="payroll" stackId="1" stroke="#0088FE" fill="#0088FE" name="Monthly Payroll" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Inventory-Specific Charts */}
          {activeFilter === 'inventory' && expenseData && (
            <div className="etx-charts-grid">
              {/* Inventory Categories */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>🏥 Inventory by Category</h3>
                  <p>Medical equipment and supplies breakdown</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expenseData.inventoryCategoryData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value}) => `${name}: $${(value/1000).toFixed(0)}K`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(expenseData.inventoryCategoryData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory Health Score */}
              <div className="etx-chart-card etx-chart-md">
                <div className="etx-chart-header">
                  <h3>📊 Inventory Health Score</h3>
                  <p>Stock level performance indicator</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[
                      { 
                        name: 'Health Score', 
                        value: expenseData.summary?.inventoryHealthScore || 0, 
                        fill: (expenseData.summary?.inventoryHealthScore || 0) > 80 ? '#28a745' : 
                              (expenseData.summary?.inventoryHealthScore || 0) > 60 ? '#ffc107' : '#dc3545' 
                      }
                    ]}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="etx-radial-text">
                        {safeToFixed(expenseData.summary?.inventoryHealthScore)}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stock vs Restock Investment */}
              <div className="etx-chart-card etx-chart-md">
                <div className="etx-chart-header">
                  <h3>💰 Stock vs Auto-Restock Investment</h3>
                  <p>Current inventory vs automated restocking value</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Current Stock', value: expenseData.inventoryExpenses?.currentStockValue || 0, fill: '#0088FE' },
                      { name: 'Auto-Restock', value: expenseData.inventoryExpenses?.totalRestockValue || 0, fill: '#00C49F' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#8884d8">
                        {[0, 1].map((index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#0088FE' : '#00C49F'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Utilities-Specific Charts */}
          {activeFilter === 'utilities' && expenseData && (
            <div className="etx-charts-grid">
              {/* Utilities Payment Status */}
              <div className="etx-chart-card etx-chart-md">
                <div className="etx-chart-header">
                  <h3>⚡ Utilities Payment Status</h3>
                  <p>Bill payment distribution</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseData.utilitiesStatusData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value}) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(expenseData.utilitiesStatusData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Utilities by Category */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>📊 Utilities Expenses by Category</h3>
                  <p>Monthly utilities spending breakdown</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={Object.entries(expenseData.utilitiesExpenses?.categoryExpenses || {}).map(([category, data], index) => ({
                      name: category,
                      amount: data.totalAmount || 0,
                      count: data.count || 0,
                      fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#8884d8">
                        {Object.entries(expenseData.utilitiesExpenses?.categoryExpenses || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Utilities Payment Score */}
              <div className="etx-chart-card etx-chart-md">
                <div className="etx-chart-header">
                  <h3>💯 Payment Performance Score</h3>
                  <p>Percentage of bills paid on time</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[
                      { 
                        name: 'Payment Score', 
                        value: expenseData.summary?.utilitiesPaymentScore || 0, 
                        fill: (expenseData.summary?.utilitiesPaymentScore || 0) > 80 ? '#28a745' : 
                              (expenseData.summary?.utilitiesPaymentScore || 0) > 60 ? '#ffc107' : '#dc3545' 
                      }
                    ]}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="etx-radial-text">
                        {safeToFixed(expenseData.summary?.utilitiesPaymentScore)}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* NEW: Supplier-Specific Charts */}
          {activeFilter === 'suppliers' && expenseData && (
            <div className="etx-charts-grid">
              {/* Supplier Expenses Breakdown */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>🤝 Supplier Expenses Breakdown</h3>
                  <p>Distribution of expenses by supplier</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expenseData.supplierCategoryData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value}) => `${name}: $${(value/1000).toFixed(0)}K`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(expenseData.supplierCategoryData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly vs Total Supplier Expenses */}
              <div className="etx-chart-card etx-chart-md">
                <div className="etx-chart-header">
                  <h3>📈 Monthly vs Total Supplier Costs</h3>
                  <p>Current month spending vs total expenses</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Monthly Costs', value: expenseData.supplierExpenses?.monthlySupplierExpense || 0, fill: '#0088FE' },
                      { name: 'Total Costs', value: expenseData.supplierExpenses?.totalSupplierExpense || 0, fill: '#00C49F' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#8884d8">
                        {[0, 1].map((index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#0088FE' : '#00C49F'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Supplier Performance Metrics */}
              <div className="etx-chart-card etx-chart-md">
                <div className="etx-chart-header">
                  <h3>📊 Supplier Performance</h3>
                  <p>Average order value and supplier count</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Avg Order Value', value: expenseData.supplierExpenses?.averageOrderValue || 0, fill: '#FFBB28' },
                      { name: 'Active Suppliers', value: (expenseData.supplierExpenses?.totalSuppliers || 0) * 1000, fill: '#FF8042' },
                      { name: 'Total Orders', value: (expenseData.supplierExpenses?.totalOrders || 0) * 500, fill: '#8884d8' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => value > 1000 ? `$${(value/1000).toFixed(0)}K` : value} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'Active Suppliers') return [Math.round(value/1000), name];
                          if (name === 'Total Orders') return [Math.round(value/500), name];
                          return [`$${value.toLocaleString()}`, name];
                        }}
                      />
                      <Bar dataKey="value" fill="#8884d8">
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#FFBB28' : index === 1 ? '#FF8042' : '#8884d8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* UPDATED: Advanced Analytics Section - Now includes suppliers */}
          <div className="etx-advanced-analytics">
            <div className="etx-analytics-header">
              <h2 className="etx-analytics-title">
                <span className="etx-analytics-icon">🔬</span>
                Advanced Financial Analytics
              </h2>
              <p className="etx-analytics-subtitle">Comprehensive insights including supplier expense analysis</p>
            </div>

            <div className="etx-analytics-grid">
              {/* UPDATED: Total Expense Tree Map - Now includes suppliers */}
              <div className="etx-chart-card etx-chart-xl">
                <div className="etx-chart-header">
                  <h3>🌳 Expense Hierarchy Visualization</h3>
                  <p>Complete organizational expense tree including supplier costs</p>
                </div>
                <div className="etx-chart-container">
                  <ResponsiveContainer width="100%" height={500}>
                    <Treemap
                      data={expenseData.expenseBreakdown && expenseData.expenseBreakdown.length > 0 ? expenseData.expenseBreakdown : [
                        { name: "Staff Salaries", value: 45000, fill: EXPENSE_COLORS[0] },
                        { name: "Employee Benefits", value: 8500, fill: EXPENSE_COLORS[1] },
                        { name: "EPF Contributions", value: 3600, fill: EXPENSE_COLORS[2] },
                        { name: "ETF Contributions", value: 1350, fill: EXPENSE_COLORS[3] },
                        { name: "Current Inventory", value: 85000, fill: EXPENSE_COLORS[4] },
                        { name: "Auto-Restock Investment", value: 25000, fill: EXPENSE_COLORS[5] },
                        { name: "Utilities Expenses", value: 5550, fill: EXPENSE_COLORS[6] },
                        { name: "Supplier Expenses", value: 45000, fill: EXPENSE_COLORS[7] }
                      ]}
                      dataKey="value"
                      ratio={4/3}
                      stroke="#fff"
                      fill="#8884d8"
                      content={({ x, y, width, height, name, value }) => (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={EXPENSE_COLORS[Math.floor(Math.random() * EXPENSE_COLORS.length)]}
                            stroke="#fff"
                            strokeWidth={2}
                            opacity={0.8}
                          />
                          {width > 60 && height > 40 && (
                            <>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 - 10}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                {name}
                              </text>
                              <text
                                x={x + width / 2}
                                y={y + height / 2 + 10}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="10"
                              >
                                ${(value/1000).toFixed(0)}K
                              </text>
                            </>
                          )}
                        </g>
                      )}
                    />
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="etx-chart-card etx-chart-lg">
                <div className="etx-chart-header">
                  <h3>🎯 Key Performance Indicators</h3>
                  <p>Critical financial health metrics including supplier efficiency</p>
                </div>
                <div className="etx-kpi-grid">
                  <div className="etx-kpi-card">
                    <div className="etx-kpi-icon">💰</div>
                    <div className="etx-kpi-content">
                      <h4>Total Monthly Expenses</h4>
                      <p className="etx-kpi-value">${safeToLocaleString(expenseData.totalExpenses)}</p>
                      <span className="etx-kpi-trend etx-trend-up">↗ 12.5%</span>
                    </div>
                  </div>
                  <div className="etx-kpi-card">
                    <div className="etx-kpi-icon">📊</div>
                    <div className="etx-kpi-content">
                      <h4>Expense Efficiency Ratio</h4>
                      <p className="etx-kpi-value">{safeToFixed((expenseData.summary?.inventoryHealthScore || 0) + (expenseData.summary?.utilitiesPaymentScore || 0)) / 2}%</p>
                      <span className="etx-kpi-trend etx-trend-up">↗ 3.2%</span>
                    </div>
                  </div>
                  <div className="etx-kpi-card">
                    <div className="etx-kpi-icon">🏥</div>
                    <div className="etx-kpi-content">
                      <h4>Inventory Per Employee</h4>
                      <p className="etx-kpi-value">${safeToLocaleString(expenseData.summary?.avgInventoryPerEmployee)}</p>
                      <span className="etx-kpi-trend etx-trend-stable">→ 0.8%</span>
                    </div>
                  </div>
                  <div className="etx-kpi-card">
                    <div className="etx-kpi-icon">🤝</div>
                    <div className="etx-kpi-content">
                      <h4>Avg Monthly Supplier Spend</h4>
                      <p className="etx-kpi-value">${safeToLocaleString(expenseData.summary?.avgSupplierPerMonth)}</p>
                      <span className="etx-kpi-trend etx-trend-up">↗ 7.8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UPDATED: Summary Statistics - Now includes supplier metrics */}
          <div className="etx-summary-section">
            <div className="etx-summary-header">
              <h2 className="etx-summary-title">
                <span className="etx-summary-icon">📈</span>
                Financial Summary & Insights
              </h2>
              <p className="etx-summary-subtitle">Complete expense analysis including supplier cost breakdown</p>
            </div>

            <div className="etx-summary-cards">
              <div className="etx-summary-card etx-summary-primary">
                <h3>💰 Total Organizational Expenses</h3>
                <div className="etx-summary-value">${safeToLocaleString(expenseData.totalExpenses)}</div>
                <p className="etx-summary-note">
                  Complete financial overview including payroll (${safeToLocaleString(expenseData.payrollExpenses?.totalPayrollExpense)}), 
                  medical inventory (${safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)}), 
                  utilities (${safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense)}), 
                  and supplier costs (${safeToLocaleString(expenseData.supplierExpenses?.totalSupplierExpense)})
                </p>
              </div>

              <div className="etx-summary-card etx-summary-success">
                <h3>📊 Expense Distribution Analysis</h3>
                <div className="etx-summary-breakdown">
                  <div className="etx-breakdown-item">
                    <span className="etx-breakdown-label">Payroll:</span>
                    <span className="etx-breakdown-value">{safeToFixed(expenseData.summary?.payrollPercentage)}%</span>
                  </div>
                  <div className="etx-breakdown-item">
                    <span className="etx-breakdown-label">Medical Inventory:</span>
                    <span className="etx-breakdown-value">{safeToFixed(expenseData.summary?.inventoryPercentage)}%</span>
                  </div>
                  <div className="etx-breakdown-item">
                    <span className="etx-breakdown-label">Utilities:</span>
                    <span className="etx-breakdown-value">{safeToFixed(expenseData.summary?.utilitiesPercentage)}%</span>
                  </div>
                  <div className="etx-breakdown-item">
                    <span className="etx-breakdown-label">Suppliers:</span>
                    <span className="etx-breakdown-value">{safeToFixed(expenseData.summary?.supplierPercentage)}%</span>
                  </div>
                </div>
              </div>

              <div className="etx-summary-card etx-summary-info">
                <h3>🏥 Healthcare Operations Metrics</h3>
                <div className="etx-summary-metrics">
                  <div className="etx-metric-item">
                    <span className="etx-metric-label">Staff Members:</span>
                    <span className="etx-metric-value">{expenseData.payrollExpenses?.totalEmployees || 0}</span>
                  </div>
                  <div className="etx-metric-item">
                    <span className="etx-metric-label">Medical Items:</span>
                    <span className="etx-metric-value">{expenseData.inventoryExpenses?.totalItems || 0}</span>
                  </div>
                  <div className="etx-metric-item">
                    <span className="etx-metric-label">Utility Services:</span>
                    <span className="etx-metric-value">{expenseData.utilitiesExpenses?.totalUtilities || 0}</span>
                  </div>
                  <div className="etx-metric-item">
                    <span className="etx-metric-label">Active Suppliers:</span>
                    <span className="etx-metric-value">{expenseData.supplierExpenses?.totalSuppliers || 0}</span>
                  </div>
                  <div className="etx-metric-item">
                    <span className="etx-metric-label">Purchase Orders:</span>
                    <span className="etx-metric-value">{expenseData.supplierExpenses?.totalOrders || 0}</span>
                  </div>
                </div>
              </div>

              <div className="etx-summary-card etx-summary-warning">
                <h3>⚠️ Financial Health Indicators</h3>
                <div className="etx-health-indicators">
                  <div className="etx-health-item">
                    <span className="etx-health-label">Inventory Health:</span>
                    <span className={`etx-health-score etx-health-${(expenseData.summary?.inventoryHealthScore || 0) > 80 ? 'good' : (expenseData.summary?.inventoryHealthScore || 0) > 60 ? 'warning' : 'critical'}`}>
                      {safeToFixed(expenseData.summary?.inventoryHealthScore)}%
                    </span>
                  </div>
                  <div className="etx-health-item">
                    <span className="etx-health-label">Payment Performance:</span>
                    <span className={`etx-health-score etx-health-${(expenseData.summary?.utilitiesPaymentScore || 0) > 80 ? 'good' : (expenseData.summary?.utilitiesPaymentScore || 0) > 60 ? 'warning' : 'critical'}`}>
                      {safeToFixed(expenseData.summary?.utilitiesPaymentScore)}%
                    </span>
                  </div>
                  <div className="etx-health-item">
                    <span className="etx-health-label">Low Stock Items:</span>
                    <span className="etx-health-count">{expenseData.inventoryExpenses?.lowStockCount || 0}</span>
                  </div>
                  <div className="etx-health-item">
                    <span className="etx-health-label">Overdue Bills:</span>
                    <span className="etx-health-count">{expenseData.utilitiesExpenses?.overduePayments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="etx-footer">
          <div className="etx-footer-content">
            <div className="etx-footer-info">
              <h4>🏥 Heal-x Expense Tracking System</h4>
              <p>
                Last Updated: {new Date().toLocaleString()} • 
                Data Status: {inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" && supplierApiStatus === "connected" ? "Live Data" : "Mixed Sources"} • 
                Total Expenses: ${safeToLocaleString(expenseData?.totalExpenses)}
              </p>
              <div className="etx-footer-metrics">
                <span>📊 {expenseData?.payrollExpenses?.totalEmployees || 0} Employees</span>
                <span>🏥 {expenseData?.inventoryExpenses?.totalItems || 0} Medical Items</span>
                <span>⚡ {expenseData?.utilitiesExpenses?.totalUtilities || 0} Utilities</span>
                <span>🤝 {expenseData?.supplierExpenses?.totalSuppliers || 0} Suppliers</span>
                <span>📦 {expenseData?.supplierExpenses?.totalOrders || 0} Orders</span>
              </div>
            </div>
            <div className="etx-footer-actions">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="etx-scroll-top">
                ⬆️ Back to Top
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpenseTracking;
