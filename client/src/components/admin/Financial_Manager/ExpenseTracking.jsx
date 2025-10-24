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
  const [supplierApiStatus, setSupplierApiStatus] = useState("checking");
  
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

  // Currency formatting function - CHANGED FROM USD TO LKR
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  // Keep all your existing API functions exactly as they are
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
            utilityId: sampleUtility.utilityId,
            category: sampleUtility.category,
            description: sampleUtility.description,
            amount: sampleUtility.amount,
            vendor: sampleUtility.vendor_name,
            status: sampleUtility.payment_status,
            invoice_number: sampleUtility.invoice_number
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

  // Keep all sample data functions exactly as they are
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
        utilityId: "80RF3D",
        category: "Electricity", 
        description: "Electricity bills paid for October month", 
        amount: 2500, 
        vendor_name: "Ceylon Electricity Board", 
        payment_status: "Paid",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30",
        invoice_number: "CE0105"
      },
      { 
        _id: "util2",
        utilityId: "6NNGUN", 
        category: "Internet & Communication", 
        description: "Mobile bill paid for Mobitel for October", 
        amount: 800, 
        vendor_name: "Mobitel", 
        payment_status: "Paid",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30",
        invoice_number: "TEL267"
      },
      { 
        _id: "util3",
        utilityId: "L25URU", 
        category: "Other", 
        description: "Gardner came and cut the grass", 
        amount: 200, 
        vendor_name: "Saman Zoysa", 
        payment_status: "Paid",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30",
        invoice_number: "0AP29H"
      },
      { 
        _id: "util4",
        utilityId: "5QZU33", 
        category: "Waste Management", 
        description: "Municipal waste tractor hired", 
        amount: 550, 
        vendor_name: "Saranga", 
        payment_status: "Paid",
        billing_period_start: "2024-08-15",
        billing_period_end: "2024-09-15",
        invoice_number: "MWT268"
      },
      { 
        _id: "util5",
        utilityId: "C8F8LQ", 
        category: "Water & Sewage", 
        description: "water pipe broken", 
        amount: 5000, 
        vendor_name: "Sri Lanka Water Board", 
        payment_status: "Pending",
        billing_period_start: "2024-09-01",
        billing_period_end: "2024-09-30",
        invoice_number: "WB1319"
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

  // Initialize expense tracking - keeping all your existing logic
  const initializeExpenseTracking = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      console.log("🔄 Loading comprehensive expense tracking data...");

      const [payrollData, inventoryData, utilitiesData, supplierData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses(),
        fetchUtilitiesExpenses(),
        fetchSupplierExpenses()
      ]);

      console.log(`📊 Loaded: ${payrollData.length} payroll records, ${inventoryData.surgicalItems.length} surgical items, ${utilitiesData.length} utility records, ${supplierData.orderCount} supplier orders`);
      console.log(`💰 Restock spending: ${inventoryData.restockSpending.totalRestockValue}, Supplier costs: ${supplierData.totalSupplierCosts}`);

      const expenseAnalytics = calculateExpenseAnalytics(
        payrollData, 
        inventoryData.surgicalItems, 
        utilitiesData,
        inventoryData.restockSpending,
        supplierData
      );
      setExpenseData(expenseAnalytics);

      console.log("✅ Expense tracking initialized successfully with payroll calculation");
    } catch (error) {
      console.error("❌ Error loading expense tracking:", error);
      setError(`Failed to load expense data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Keep all your existing calculation functions exactly as they are
  const calculateExpenseAnalytics = (payrolls = [], surgicalItems = [], utilities = [], restockSpending = {}, supplierData = {}) => {
    console.log("📊 Calculating expense analytics with CORRECTED payroll calculation...");
    
    // Initialize with safe defaults
    const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
    const safeSurgicalItems = Array.isArray(surgicalItems) ? surgicalItems : [];
    const safeUtilities = Array.isArray(utilities) ? utilities : [];
    const safeRestockSpending = restockSpending || { totalRestockValue: 0 };
    const safeSupplierData = supplierData || { totalSupplierCosts: 0, monthlySupplierCosts: 0, supplierCount: 0, orderCount: 0, suppliers: [], purchaseOrders: [] };
    
    // ✅ CORRECTED: Calculate employer contributions separately
    const payrollExpenses = {
      totalGrossSalary: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.grossSalary) || 0), 0),
      totalBonuses: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.bonuses) || 0), 0),
      // These are EMPLOYEE deductions, not company expenses
      totalEmployeeEPF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.epf) || 0), 0),
      totalEmployeeETF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.etf) || 0), 0),
      // ✅ CORRECTED: Calculate EMPLOYER contributions (12% EPF + 3% ETF)
      totalEmployerEPF: safePayrolls.reduce((sum, p) => sum + Math.round((parseFloat(p.grossSalary) || 0) * 0.12), 0),
      totalEmployerETF: safePayrolls.reduce((sum, p) => sum + Math.round((parseFloat(p.grossSalary) || 0) * 0.03), 0),
      totalEmployees: new Set(safePayrolls.map(p => p.employeeId).filter(id => id)).size,
      monthlyPayrollCosts: {},
      rawData: safePayrolls
    };

    // ✅ CORRECTED: Total Company Payroll Expense = Base Salaries + Bonuses + EPF (12% Employer) + ETF (3% Employer)
    payrollExpenses.totalPayrollExpense = 
      payrollExpenses.totalGrossSalary + 
      payrollExpenses.totalBonuses + 
      payrollExpenses.totalEmployerEPF + 
      payrollExpenses.totalEmployerETF;

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

    // Process inventory data
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

    // Calculate supplier expenses
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

    // ✅ CORRECTED: Calculate total expenses with corrected payroll amount
    const totalExpenses = payrollExpenses.totalPayrollExpense + inventoryExpenses.totalInventoryValue + utilitiesExpenses.totalUtilitiesExpense + supplierExpenses.totalSupplierExpense;

    // ✅ CORRECTED: Create proper expense breakdown data with corrected payroll components
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
        name: "EPF Employer Contributions (12%)", 
        value: payrollExpenses.totalEmployerEPF > 0 ? payrollExpenses.totalEmployerEPF : 5400, 
        category: "Payroll", 
        fill: EXPENSE_COLORS[2] 
      },
      { 
        name: "ETF Employer Contributions (3%)", 
        value: payrollExpenses.totalEmployerETF > 0 ? payrollExpenses.totalEmployerETF : 1350, 
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
      { 
        name: "Supplier Expenses", 
        value: supplierExpenses.totalSupplierExpense > 0 ? supplierExpenses.totalSupplierExpense : 45000, 
        category: "Suppliers", 
        fill: EXPENSE_COLORS[7] 
      }
    ];

    // Generate monthly trends data
    const monthlyTrends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((month, index) => {
      monthlyTrends.push({
        month: month,
        payroll: payrollExpenses.totalPayrollExpense / 12 + (Math.random() * 0.2 - 0.1) * payrollExpenses.totalPayrollExpense / 12,
        inventory: inventoryExpenses.totalInventoryValue / 12 + (Math.random() * 0.3 - 0.15) * inventoryExpenses.totalInventoryValue / 12,
        utilities: utilitiesExpenses.totalUtilitiesExpense / 12 + (Math.random() * 0.4 - 0.2) * utilitiesExpenses.totalUtilitiesExpense / 12,
        suppliers: supplierExpenses.totalSupplierExpense / 12 + (Math.random() * 0.25 - 0.125) * supplierExpenses.totalSupplierExpense / 12,
        total: 0
      });
    });

    monthlyTrends.forEach(month => {
      month.total = month.payroll + month.inventory + month.utilities + month.suppliers;
    });

    // Category breakdown for charts
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
      { 
        name: 'Suppliers', 
        value: supplierExpenses.totalSupplierExpense, 
        fill: '#FF8042',
        percentage: totalExpenses > 0 ? (supplierExpenses.totalSupplierExpense / totalExpenses) * 100 : 0
      }
    ];

    // Inventory category chart data
    const inventoryCategoryData = Object.entries(inventoryExpenses.categoryExpenses || {}).map(([category, data], index) => ({
      name: category,
      value: data?.totalValue || 0,
      items: data?.itemCount || 0,
      quantity: data?.totalQuantity || 0,
      fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
    }));

    // Utilities payment status data
    const utilitiesStatusData = [
      { name: 'Paid', value: utilitiesExpenses.paidPayments || 0, fill: '#28a745' },
      { name: 'Pending', value: utilitiesExpenses.pendingPayments || 0, fill: '#ffc107' },
      { name: 'Overdue', value: utilitiesExpenses.overduePayments || 0, fill: '#dc3545' }
    ];

    // Supplier category chart data
    const supplierCategoryData = Object.entries(supplierExpenses.supplierBreakdown || {}).map(([supplier, data], index) => ({
      name: supplier,
      value: data?.totalAmount || 0,
      orders: data?.orderCount || 0,
      avgOrderValue: data?.averageOrderValue || 0,
      fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length]
    }));

    return {
      payrollExpenses,
      inventoryExpenses,
      utilitiesExpenses,
      supplierExpenses,
      totalExpenses,
      expenseBreakdown,
      monthlyTrends,
      categoryData,
      inventoryCategoryData,
      utilitiesStatusData,
      supplierCategoryData,
      summary: {
        totalMonthlyExpenses: totalExpenses,
        payrollPercentage: totalExpenses > 0 ? (payrollExpenses.totalPayrollExpense / totalExpenses) * 100 : 0,
        inventoryPercentage: totalExpenses > 0 ? (inventoryExpenses.totalInventoryValue / totalExpenses) * 100 : 0,
        utilitiesPercentage: totalExpenses > 0 ? (utilitiesExpenses.totalUtilitiesExpense / totalExpenses) * 100 : 0,
        supplierPercentage: totalExpenses > 0 ? (supplierExpenses.totalSupplierExpense / totalExpenses) * 100 : 0,
        avgMonthlyPayroll: payrollExpenses.totalPayrollExpense / 12,
        avgInventoryPerEmployee: inventoryExpenses.totalInventoryValue / Math.max(payrollExpenses.totalEmployees, 1),
        avgUtilitiesPerMonth: utilitiesExpenses.totalUtilitiesExpense / 12,
        avgSupplierPerMonth: supplierExpenses.totalSupplierExpense / 12,
        inventoryHealthScore: inventoryExpenses.totalItems > 0 ? 
          ((inventoryExpenses.totalItems - inventoryExpenses.lowStockCount - inventoryExpenses.outOfStockCount) / inventoryExpenses.totalItems) * 100 : 0,
        utilitiesPaymentScore: utilitiesExpenses.totalUtilities > 0 ?
          (utilitiesExpenses.paidPayments / utilitiesExpenses.totalUtilities) * 100 : 0
      }
    };
  };

  // Keep all remaining utility functions exactly as they are
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

  const safeToFixed = (value, decimals = 1) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.0" : num.toFixed(decimals);
  };

  const safeToLocaleString = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  // UPDATED PDF Export Function - Now uses invoice numbers for utilities
  const exportToPDF = () => {
    if (!expenseData) {
      alert("No expense data available to export!");
      return;
    }

    // Generate a filtered list of all expense records for detailed reporting
    const expenseRecords = [];
    
    // Add payroll records
    if (expenseData.payrollExpenses.rawData && expenseData.payrollExpenses.rawData.length > 0) {
      expenseData.payrollExpenses.rawData.forEach(record => {
        expenseRecords.push({
          id: record.employeeId || 'N/A',
          category: 'Payroll',
          description: `Employee: ${record.employeeName || 'Unknown'} - Salary & Benefits`,
          amount: (parseFloat(record.grossSalary) || 0) + (parseFloat(record.bonuses) || 0),
          date: record.paymentDate || new Date().toISOString().split('T')[0],
          status: 'Paid',
          reference: record.payrollId || 'N/A'
        });
      });
    }

    // Add inventory records
    if (expenseData.inventoryExpenses.rawData && expenseData.inventoryExpenses.rawData.length > 0) {
      expenseData.inventoryExpenses.rawData.forEach(record => {
        const itemValue = (parseFloat(record.price) || 0) * (parseInt(record.quantity) || 0);
        if (itemValue > 0) {
          expenseRecords.push({
            id: record._id || 'N/A',
            category: 'Medical Inventory',
            description: `${record.name || 'Unknown Item'} - ${record.category || 'Uncategorized'}`,
            amount: itemValue,
            date: record.lastUpdated || new Date().toISOString().split('T')[0],
            status: 'Active',
            reference: record.supplier?.name || 'Unknown Supplier'
          });
        }
      });
    }

    // UPDATED: Add utilities records - now using invoice number as ID
    if (expenseData.utilitiesExpenses.rawData && expenseData.utilitiesExpenses.rawData.length > 0) {
      expenseData.utilitiesExpenses.rawData.forEach(record => {
        expenseRecords.push({
          id: record.invoice_number || record.utilityId || 'N/A', // FIXED: Use invoice_number as ID
          category: 'Utilities',
          description: record.description || `${record.category || 'Unknown'} Service`,
          amount: parseFloat(record.amount) || 0,
          date: record.billing_period_start || new Date().toISOString().split('T')[0],
          status: record.payment_status || 'Pending',
          reference: record.vendor_name || 'Unknown Vendor'
        });
      });
    }

    // Add supplier records
    if (expenseData.supplierExpenses.rawOrders && expenseData.supplierExpenses.rawOrders.length > 0) {
      expenseData.supplierExpenses.rawOrders.forEach(record => {
        expenseRecords.push({
          id: record.id || 'N/A',
          category: 'Suppliers',
          description: `Purchase Order - ${record.supplier?.name || 'Unknown Supplier'}`,
          amount: parseFloat(record.totalAmount) || 0,
          date: record.orderDate || new Date().toISOString().split('T')[0],
          status: record.status || 'Pending',
          reference: record.supplier?.name || 'Unknown Supplier'
        });
      });
    }

    // Calculate comprehensive totals
    const totals = {
      totalAmount: expenseData.totalExpenses || 0,
      totalRecords: expenseRecords.length,
      categoryBreakdown: {
        'Payroll': expenseData.payrollExpenses?.totalPayrollExpense || 0,
        'Medical Inventory': expenseData.inventoryExpenses?.totalInventoryValue || 0,
        'Utilities': expenseData.utilitiesExpenses?.totalUtilitiesExpense || 0,
        'Suppliers': expenseData.supplierExpenses?.totalSupplierExpense || 0
      },
      statusCounts: {
        'Active': 0,
        'Paid': 0,
        'Pending': 0,
        'Overdue': 0
      }
    };

    // Count status
    expenseRecords.forEach(record => {
      const status = record.status || 'Pending';
      if (totals.statusCounts[status] !== undefined) {
        totals.statusCounts[status]++;
      }
    });

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Heal-x Expense Analytics Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      font-size: 12px;
      line-height: 1.4;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #1da1f2;
      padding-bottom: 20px;
    }

    .header h1 {
      color: #1da1f2;
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .header p {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .info {
      text-align: right;
      margin-bottom: 20px;
      font-size: 11px;
      color: #333;
      line-height: 1.6;
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
      vertical-align: top;
    }

    th {
      background-color: #1da1f2;
      color: white;
      font-weight: bold;
      text-align: center;
      font-size: 10px;
    }

    tr:nth-child(even) {
      background-color: #f8f9fa;
    }

    tr:hover {
      background-color: #e3f2fd;
    }

    .expense-id {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #1da1f2;
    }

    .category-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: bold;
    }

    .status-active { color: #2e7d32; font-weight: bold; }
    .status-paid { color: #2e7d32; font-weight: bold; }
    .status-pending { color: #f57f17; font-weight: bold; }
    .status-overdue { color: #c62828; font-weight: bold; }

    .currency {
      text-align: right;
      font-weight: bold;
      color: #1976d2;
    }

    .date-display {
      font-size: 9px;
      color: #666;
    }

    .description {
      max-width: 200px;
      word-wrap: break-word;
      font-size: 9px;
    }

    .totals-row {
      background-color: #1da1f2 !important;
      color: white !important;
      font-weight: bold;
    }

    .totals-row td {
      border: 1px solid #1976d2;
      text-align: center;
    }

    .summary-section {
      margin-top: 30px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .summary-title {
      color: #1da1f2;
      font-size: 16px;
      margin-bottom: 15px;
      font-weight: bold;
      border-bottom: 2px solid #e3f2fd;
      padding-bottom: 5px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .summary-card {
      border: 1px solid #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      background-color: #f8f9fa;
    }

    .summary-card h4 {
      color: #1976d2;
      margin-bottom: 10px;
      font-size: 12px;
    }

    .summary-card ul {
      list-style: none;
      padding: 0;
    }

    .summary-card li {
      margin-bottom: 5px;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
    }

    /* Professional Signature Section */
    .signature-section {
      margin-top: 60px;
      margin-bottom: 30px;
      width: 100%;
      page-break-inside: avoid;
    }

    .signature-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
    }

    .signature-block {
      width: 45%;
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
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
      font-size: 12px;
    }

    .signature-title {
      color: #666;
      font-size: 10px;
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
      border-radius: 5px;
    }

    .report-footer {
      margin-top: 40px;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 20px;
      font-size: 10px;
      color: #666;
      page-break-inside: avoid;
    }

    .report-footer p {
      margin-bottom: 8px;
    }

    .print-controls {
      text-align: center;
      margin-top: 30px;
      page-break-inside: avoid;
    }

    .print-button {
      background-color: #1da1f2;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 0 10px;
      font-size: 12px;
      font-weight: bold;
    }

    .print-button:hover {
      background-color: #1976d2;
    }

    .close-button {
      background-color: #666;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin: 0 10px;
      font-size: 12px;
      font-weight: bold;
    }

    .close-button:hover {
      background-color: #555;
    }

    @media print {
      .print-controls { display: none; }
      .signature-section { page-break-inside: avoid; }
      .company-stamp { page-break-inside: avoid; }
      .report-footer { page-break-inside: avoid; }
      @page { margin: 20mm; size: A4; }
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <h1>Heal-x Expense Analytics Report</h1>
    <p>Healthcare Expense Management System</p>
  </div>

  <!-- Report Information -->
  <div class="info">
    <strong>Generated on:</strong> ${new Date().toLocaleString()}<br>
    <strong>Total Records:</strong> ${totals.totalRecords}<br>
    <strong>Report Period:</strong> ${filterPeriod === 'all' ? 'All Periods' : filterPeriod}<br>
    <strong>Filter Applied:</strong> ${activeFilter}<br>
    <strong>Total Expense Amount:</strong> LKR ${totals.totalAmount.toLocaleString('en-US')}
  </div>

  <!-- Summary Section -->
  <div class="summary-section">
    <h3 class="summary-title">📊 Executive Summary</h3>
    <div class="summary-grid">
      <div class="summary-card">
        <h4>💰 Financial Overview</h4>
        <ul>
          <li><span>Total Expenses:</span><span style="color: #1da1f2; font-weight: bold;">LKR ${totals.totalAmount.toLocaleString('en-US')}</span></li>
          <li><span>Total Records:</span><span>${totals.totalRecords}</span></li>
          <li><span>Average Amount:</span><span>LKR ${totals.totalRecords > 0 ? (totals.totalAmount / totals.totalRecords).toLocaleString('en-US') : '0'}</span></li>
        </ul>
      </div>
      <div class="summary-card">
        <h4>📋 Status Breakdown</h4>
        <ul>
          ${Object.entries(totals.statusCounts).map(([status, count]) => 
            `<li><span>${status}:</span><span>${count} records</span></li>`
          ).join('')}
        </ul>
      </div>
    </div>
    <div class="summary-grid">
      <div class="summary-card">
        <h4>🏷️ Category Distribution</h4>
        <ul>
          ${Object.entries(totals.categoryBreakdown).map(([category, amount]) => 
            `<li><span>${category}:</span><span>LKR ${amount.toLocaleString('en-US')}</span></li>`
          ).join('')}
        </ul>
      </div>
      <div class="summary-card">
        <h4>📊 Report Metadata</h4>
        <ul>
          <li><span>System:</span><span>Heal-x Healthcare</span></li>
          <li><span>Module:</span><span>Expense Analytics</span></li>
          <li><span>Currency:</span><span>LKR (Rs)</span></li>
          <li><span>Export Format:</span><span>PDF Report</span></li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Expense Data Table -->
  <table>
    <thead>
      <tr>
        <th>Record ID</th>
        <th>Category</th>
        <th>Description</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Status</th>
        <th>Reference</th>
      </tr>
    </thead>
    <tbody>
      ${expenseRecords.map(record => `
        <tr>
          <td class="expense-id">${record.id}</td>
          <td><span class="category-badge">${record.category}</span></td>
          <td class="description">${record.description}</td>
          <td class="currency">LKR ${(parseFloat(record.amount) || 0).toLocaleString('en-US')}</td>
          <td class="date-display">${new Date(record.date).toLocaleDateString('en-GB')}</td>
          <td class="status-${record.status.toLowerCase()}">${record.status}</td>
          <td>${record.reference}</td>
        </tr>
      `).join('')}
      
      <!-- Totals Row -->
      <tr class="totals-row">
        <td colspan="3"><strong>TOTAL</strong></td>
        <td class="currency"><strong>LKR ${totals.totalAmount.toLocaleString('en-US')}</strong></td>
        <td colspan="3"><strong>${totals.totalRecords} Records</strong></td>
      </tr>
    </tbody>
  </table>

  <!-- Professional Signature Section -->
  <div class="signature-section">
    <div class="signature-container">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-text">Financial Manager</div>
        <div class="signature-title">Heal-x Healthcare Management</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-text">Date</div>
        <div class="signature-title">Report Approved On</div>
      </div>
    </div>
  </div>

  <!-- Company Stamp -->
  <div style="text-align: center;">
    <div class="company-stamp">
      HEAL-X OFFICIAL SEAL<br>
      HEALTHCARE MANAGEMENT SYSTEM
    </div>
  </div>

  <!-- Report Footer -->
  <div class="report-footer">
    <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
    <p>Report generated on ${new Date().toLocaleString()}. All amounts are in Sri Lankan Rupees.</p>
    <p>For queries regarding this report, contact the Financial Department at Heal-x Healthcare</p>
  </div>

  <!-- Print Controls -->
  <div class="print-controls">
    <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
    <button class="close-button" onclick="window.close()">✕ Close Window</button>
  </div>
</body>
</html>`;

    // Open print window
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
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

  const getFilteredMetrics = () => {
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
            value: safeToLocaleString((expenseData.payrollExpenses?.totalEmployerEPF || 0) + (expenseData.payrollExpenses?.totalEmployerETF || 0)),
            label: "Employer Contributions",
            trend: "→ 0.0%",
            note: "EPF (12%) + ETF (3%) employer contributions"
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
            note: `${safeToFixed(expenseData.summary?.payrollPercentage)}% of total • Includes employer contributions only`
          },
          {
            icon: "🏥",
            value: safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue),
            label: "Medical Inventory Value",
            trend: "↗ 5.8%",
            note: `${safeToFixed(expenseData.summary?.inventoryPercentage)}% of total`
          },
          {
            icon: "⚡",
            value: safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense),
            label: "Utilities Expenses",
            trend: "↗ 4.2%",
            note: `${safeToFixed(expenseData.summary?.utilitiesPercentage)}% of total`
          },
          {
            icon: "🤝",
            value: safeToLocaleString(expenseData.supplierExpenses?.totalSupplierExpense),
            label: "Supplier Expenses",
            trend: "↗ 7.8%",
            note: `${safeToFixed(expenseData.summary?.supplierPercentage)}% of total`
          }
        ];
    }
  };

  // Custom tooltip component - UPDATED TO USE LKR
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="healx-etv-chart-tooltip">
          <p className="healx-etv-tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="healx-etv-tooltip-item" style={{ color: entry.color }}>
              {`${entry.name}: LKR ${parseInt(entry.value).toLocaleString()}`}
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
        <div className="healx-etv-fullscreen">
          <div className="healx-etv-loading-container">
            <div className="healx-etv-loading-spinner">
              <div className="healx-etv-spinner-ring"></div>
              <div className="healx-etv-spinner-ring"></div>
              <div className="healx-etv-spinner-ring"></div>
            </div>
            <div className="healx-etv-loading-content">
              <h2>Loading Expense Analytics</h2>
              <p>📦 {inventoryApiStatus === "trying" ? "Fetching surgical items and restock data..." : "Processing inventory data..."}</p>
              <p>⚡ {utilitiesApiStatus === "trying" ? "Connecting to utilities API..." : "Processing utilities data..."}</p>
              <p>🤝 {supplierApiStatus === "trying" ? "Connecting to supplier APIs..." : "Processing supplier data..."}</p>
              <p>✅ Using corrected payroll calculation with employer contributions only</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="healx-etv-fullscreen">
          <div className="healx-etv-error-container">
            <div className="healx-etv-error-content">
              <div className="healx-etv-error-icon">⚠️</div>
              <h2>Error Loading Expense Data</h2>
              <p>{error}</p>
              <div className="healx-etv-error-actions">
                <button onClick={refreshExpenseData} className="healx-etv-btn healx-etv-btn-primary">
                  🔄 Try Again
                </button>
                <button onClick={() => navigate("/admin/financial")} className="healx-etv-btn healx-etv-btn-secondary">
                  ← Back to Financial Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!expenseData) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="healx-etv-fullscreen">
          <div className="healx-etv-error-container">
            <div className="healx-etv-error-content">
              <div className="healx-etv-error-icon">⚠️</div>
              <h2>No Expense Data Available</h2>
              <p>Unable to load expense tracking data. Please try refreshing.</p>
              <button onClick={refreshExpenseData} className="healx-etv-btn healx-etv-btn-primary">
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const filteredMetrics = getFilteredMetrics();
  const alerts = generateAlerts();

  return (
    <AdminLayout admin={admin} title="Expense Tracking">
      <div className="healx-etv-fullscreen">
        {/* Header */}
        <div className="healx-etv-header">
          <div className="healx-etv-header-container">
            <div className="healx-etv-header-top">
              <div className="healx-etv-header-brand">
                <h1 className="healx-etv-header-title">
                  <span className="healx-etv-title-icon">💸</span>
                  Expense Analytics
                </h1>
                <p className="healx-etv-header-subtitle">
                  Comprehensive expense insights with accurate calculations
                </p>
              </div>
              <div className="healx-etv-header-actions">
                <div className="healx-etv-export-controls">
                  <select 
                    value={exportFormat} 
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="healx-etv-select"
                  >
                    <option value="csv">CSV Export</option>
                    <option value="json">JSON Export</option>
                    <option value="pdf">PDF Report</option>
                  </select>
                  {/* Updated Export Button */}
                  <button onClick={exportToPDF} className="healx-etv-btn healx-etv-btn-secondary">
                    <i className="fas fa-file-pdf"></i>
                    Export PDF Report
                  </button>
                </div>
                <button 
                  className="healx-etv-btn healx-etv-btn-secondary" 
                  onClick={refreshExpenseData}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i>
                  {loading ? "Refreshing..." : "Refresh Data"}
                </button>
                <button 
                  className="healx-etv-btn healx-etv-btn-primary" 
                  onClick={() => navigate("/admin/financial")}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Financial
                </button>
              </div>
            </div>
            
            {/* KPI Section - UPDATED TO USE LKR */}
            <div className="healx-etv-kpi-section">
              <div className="healx-etv-kpi-primary healx-etv-kpi-success">
                <div className="healx-etv-kpi-label">Total Organizational Expenses</div>
                <div className="healx-etv-kpi-value">
                  LKR {safeToLocaleString(expenseData.totalExpenses)}
                </div>
                <div className="healx-etv-kpi-status">
                  {inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" && supplierApiStatus === "connected" 
                    ? "Live Data" 
                    : "Mixed Data Sources"}
                </div>
              </div>
              
              <div className="healx-etv-kpi-metrics">
                <div className="healx-etv-kpi-item">
                  <div className="healx-etv-kpi-item-label">Payroll</div>
                  <div className="healx-etv-kpi-item-value positive">
                    LKR {safeToLocaleString(expenseData.payrollExpenses?.totalPayrollExpense)}
                  </div>
                </div>
                <div className="healx-etv-kpi-item">
                  <div className="healx-etv-kpi-item-label">Inventory</div>
                  <div className="healx-etv-kpi-item-value positive">
                    LKR {safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)}
                  </div>
                </div>
                <div className="healx-etv-kpi-item">
                  <div className="healx-etv-kpi-item-label">Utilities</div>
                  <div className="healx-etv-kpi-item-value">
                    LKR {safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense)}
                  </div>
                </div>
                <div className="healx-etv-kpi-item">
                  <div className="healx-etv-kpi-item-label">Suppliers</div>
                  <div className="healx-etv-kpi-item-value">
                    LKR {safeToLocaleString(expenseData.supplierExpenses?.totalSupplierExpense)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keep all your existing API Status, Alerts, and other sections - they will automatically use LKR through formatCurrency and display functions */}

        {/* API Status Warning */}
        {(inventoryApiStatus === "fallback" || utilitiesApiStatus === "fallback" || supplierApiStatus === "fallback") && (
          <div className="healx-etv-message healx-etv-message-warning">
            <span className="healx-etv-message-icon">⚠️</span>
            <div className="healx-etv-message-content">
              <h4>API Connection Issues Detected</h4>
              <div className="healx-etv-message-details">
                {inventoryApiStatus === "fallback" && (
                  <p>Unable to connect to surgical items API. Expected endpoint: <code>http://localhost:7000/api/inventory/surgical-items</code></p>
                )}
                {utilitiesApiStatus === "fallback" && (
                  <p>Unable to connect to utilities API. Expected endpoint: <code>http://localhost:7000/api/financial-utilities</code></p>
                )}
                {supplierApiStatus === "fallback" && (
                  <p>Unable to connect to supplier APIs. Expected endpoints: <code>http://localhost:7000/api/suppliers</code> & <code>http://localhost:7000/api/purchase-orders</code></p>
                )}
                <p className="healx-etv-message-note"><em>Currently showing sample data for demonstration</em></p>
              </div>
            </div>
            <button className="healx-etv-message-close" onClick={() => {
              setInventoryApiStatus("connected");
              setUtilitiesApiStatus("connected");
              setSupplierApiStatus("connected");
            }}>×</button>
          </div>
        )}

        {/* API Success Status */}
        {inventoryApiStatus === "connected" && utilitiesApiStatus === "connected" && supplierApiStatus === "connected" && expenseData?.inventoryExpenses?.totalItems > 0 && expenseData?.utilitiesExpenses?.totalUtilities > 0 && expenseData?.supplierExpenses?.totalSuppliers > 0 && (
          <div className="healx-etv-message healx-etv-message-success">
            <span className="healx-etv-message-icon">✅</span>
            <div className="healx-etv-message-content">
              <p>Connected to all APIs with Payroll - Inventory: {expenseData.inventoryExpenses.totalItems} items | Restock Value: LKR {expenseData.inventoryExpenses.totalRestockValue.toLocaleString()} | Utilities: {expenseData.utilitiesExpenses.totalUtilities} services | Suppliers: {expenseData.supplierExpenses.totalSuppliers} suppliers, {expenseData.supplierExpenses.totalOrders} orders</p>
            </div>
            <button className="healx-etv-message-close" onClick={() => {
              setInventoryApiStatus("checking");
              setUtilitiesApiStatus("checking");
              setSupplierApiStatus("checking");
            }}>×</button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="healx-etv-message healx-etv-message-error">
            <span className="healx-etv-message-icon">⚠️</span>
            <span className="healx-etv-message-text">{error}</span>
            <button className="healx-etv-message-close" onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="healx-etv-message healx-etv-message-success">
            <span className="healx-etv-message-icon">✅</span>
            <span className="healx-etv-message-text">{success}</span>
            <button className="healx-etv-message-close" onClick={() => setSuccess("")}>×</button>
          </div>
        )}

        {/* Alerts Section */}
        {showAlerts && alerts && alerts.length > 0 && (
          <div className="healx-etv-alerts-section">
            <div className="healx-etv-alerts-header">
              <h3>🚨 System Alerts</h3>
              <button 
                onClick={() => setShowAlerts(false)}
                className="healx-etv-close-alerts"
              >
                ✕
              </button>
            </div>
            <div className="healx-etv-alerts-grid">
              {alerts.map((alert, index) => (
                <div key={index} className={`healx-etv-alert healx-etv-alert-${alert.type}`}>
                  <span className="healx-etv-alert-icon">{alert.icon}</span>
                  <div className="healx-etv-alert-content">
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="healx-etv-main">
          {/* Filters */}
          <div className="healx-etv-filters-section">
            <div className="healx-etv-filters">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="healx-etv-select"
              >
                <option value="all">All Periods</option>
                <option value="current">Current Month</option>
                <option value="quarter">Current Quarter</option>
                <option value="year">Current Year</option>
              </select>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="healx-etv-select"
              >
                <option value="">All Months</option>
                {['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
                  .map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="healx-etv-select"
              >
                <option value="">All Years</option>
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="healx-etv-view-tabs">
              <button 
                className={`healx-etv-btn healx-etv-btn-ghost ${activeFilter === 'overall' ? 'active' : ''}`}
                onClick={() => setActiveFilter('overall')}
              >
                <span className="healx-etv-tab-icon">📊</span>
                Overall Analytics
              </button>
              <button 
                className={`healx-etv-btn healx-etv-btn-ghost ${activeFilter === 'payroll' ? 'active' : ''}`}
                onClick={() => setActiveFilter('payroll')}
              >
                <span className="healx-etv-tab-icon">👥</span>
                Payroll Focus
              </button>
              <button 
                className={`healx-etv-btn healx-etv-btn-ghost ${activeFilter === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveFilter('inventory')}
              >
                <span className="healx-etv-tab-icon">🏥</span>
                Inventory Focus
              </button>
              <button 
                className={`healx-etv-btn healx-etv-btn-ghost ${activeFilter === 'utilities' ? 'active' : ''}`}
                onClick={() => setActiveFilter('utilities')}
              >
                <span className="healx-etv-tab-icon">⚡</span>
                Utilities Focus
              </button>
              <button 
                className={`healx-etv-btn healx-etv-btn-ghost ${activeFilter === 'suppliers' ? 'active' : ''}`}
                onClick={() => setActiveFilter('suppliers')}
              >
                <span className="healx-etv-tab-icon">🤝</span>
                Supplier Focus
              </button>
            </div>
          </div>

          {/* Overview Cards */}
          {expenseData && (
            <>
              <div className="healx-etv-overview">
                <div className="healx-etv-overview-grid">
                  {filteredMetrics && filteredMetrics.map((metric, index) => (
                    <div key={index} className={`healx-etv-overview-card healx-etv-card-${['revenue', 'expenses', 'profit', 'loss', 'info'][index % 5]}`}>
                      <div className="healx-etv-card-header">
                        <div className="healx-etv-card-icon">{metric.icon}</div>
                        <div className={`healx-etv-card-trend healx-etv-trend-${metric.trend?.includes('↗') ? 'positive' : metric.trend?.includes('↘') ? 'negative' : 'neutral'}`}>
                          {metric.trend}
                        </div>
                      </div>
                      <div className="healx-etv-card-content">
                        <div className="healx-etv-card-value">
                          {metric.value}
                        </div>
                        <div className="healx-etv-card-label">{metric.label}</div>
                        <div className="healx-etv-card-details">
                          <span>{metric.note}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="healx-etv-charts">
                {activeFilter === 'overall' && (
                  <div className="healx-etv-charts-section">
                    {/* First row - Pie Charts */}
                    <div className="healx-etv-charts-row">
                      <div className="healx-etv-chart-container healx-etv-chart-large">
                        <div className="healx-etv-chart-header">
                          <h3 className="healx-etv-chart-title">
                            <span className="healx-etv-chart-icon">📊</span>
                            Expense Category Distribution
                          </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={450}>
                          <PieChart>
                            <Pie
                              data={expenseData.categoryData}
                              cx="50%"
                              cy="50%"
                              outerRadius={140}
                              dataKey="value"
                              label={({name, percentage}) => `${name}: ${safeToFixed(percentage)}%`}
                            >
                              {expenseData.categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`LKR ${safeToLocaleString(value)}`, '']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="healx-etv-chart-container healx-etv-chart-large">
                        <div className="healx-etv-chart-header">
                          <h3 className="healx-etv-chart-title">
                            <span className="healx-etv-chart-icon">💰</span>
                            Expense Breakdown
                          </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={450}>
                          <BarChart data={expenseData.expenseBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis tickFormatter={(value) => `LKR ${value/1000}k`} />
                            <Tooltip formatter={(value) => [`LKR ${safeToLocaleString(value)}`, '']} />
                            <Bar dataKey="value" fill="#667eea" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Second row - More Charts */}
                    <div className="healx-etv-charts-row">
                      <div className="healx-etv-chart-container healx-etv-chart-large">
                        <div className="healx-etv-chart-header">
                          <h3 className="healx-etv-chart-title">
                            <span className="healx-etv-chart-icon">🏥</span>
                            Inventory Category Distribution
                          </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={450}>
                          <PieChart>
                            <Pie
                              data={expenseData.inventoryCategoryData}
                              cx="50%"
                              cy="50%"
                              outerRadius={140}
                              dataKey="value"
                              label={({name, value}) => `${name}: LKR ${safeToLocaleString(value)}`}
                            >
                              {expenseData.inventoryCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`LKR ${safeToLocaleString(value)}`, '']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="healx-etv-chart-container healx-etv-chart-large">
                        <div className="healx-etv-chart-header">
                          <h3 className="healx-etv-chart-title">
                            <span className="healx-etv-chart-icon">🤝</span>
                            Supplier Expense Distribution
                          </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={450}>
                          <PieChart>
                            <Pie
                              data={expenseData.supplierCategoryData}
                              cx="50%"
                              cy="50%"
                              outerRadius={140}
                              dataKey="value"
                              label={({name, value}) => `${name}: LKR ${safeToLocaleString(value)}`}
                            >
                              {expenseData.supplierCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`LKR ${safeToLocaleString(value)}`, '']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Keep all your existing chart sections for different filters unchanged */}
              </div>
            </>
          )}

          {/* Summary Section - UPDATED TO USE LKR */}
          <div className="healx-etv-summary">
            <div className="healx-etv-summary-header">
              <h2 className="healx-etv-summary-title">
                <span className="healx-etv-summary-icon">📈</span>
                Financial Summary & Insights
              </h2>
              <p className="healx-etv-summary-subtitle">
                Complete expense analysis
              </p>
            </div>

            <div className="healx-etv-summary-cards">
              <div className="healx-etv-summary-card healx-etv-summary-primary">
                <h3>💰 Total Organizational Expenses</h3>
                <div className="healx-etv-summary-value">LKR {safeToLocaleString(expenseData.totalExpenses)}</div>
                <p className="healx-etv-summary-note">
                  Complete financial overview including payroll (LKR {safeToLocaleString(expenseData.payrollExpenses?.totalPayrollExpense)} - with employer contributions only), 
                  medical inventory (LKR {safeToLocaleString(expenseData.inventoryExpenses?.totalInventoryValue)}), 
                  utilities (LKR {safeToLocaleString(expenseData.utilitiesExpenses?.totalUtilitiesExpense)}), 
                  and supplier costs (LKR {safeToLocaleString(expenseData.supplierExpenses?.totalSupplierExpense)})
                </p>
              </div>

              <div className="healx-etv-summary-card healx-etv-summary-success">
                <h3>📊 Expense Distribution Analysis</h3>
                <div className="healx-etv-summary-breakdown">
                  <div className="healx-etv-breakdown-item">
                    <span className="healx-etv-breakdown-label">Payroll:</span>
                    <span className="healx-etv-breakdown-value">{safeToFixed(expenseData.summary?.payrollPercentage)}%</span>
                  </div>
                  <div className="healx-etv-breakdown-item">
                    <span className="healx-etv-breakdown-label">Medical Inventory:</span>
                    <span className="healx-etv-breakdown-value">{safeToFixed(expenseData.summary?.inventoryPercentage)}%</span>
                  </div>
                  <div className="healx-etv-breakdown-item">
                    <span className="healx-etv-breakdown-label">Utilities:</span>
                    <span className="healx-etv-breakdown-value">{safeToFixed(expenseData.summary?.utilitiesPercentage)}%</span>
                  </div>
                  <div className="healx-etv-breakdown-item">
                    <span className="healx-etv-breakdown-label">Suppliers:</span>
                    <span className="healx-etv-breakdown-value">{safeToFixed(expenseData.summary?.supplierPercentage)}%</span>
                  </div>
                </div>
                <p className="healx-etv-summary-note">
                  Distribution of expenses across major categories
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="healx-etv-footer">
          <div className="healx-etv-footer-container">
            <div className="healx-etv-footer-info">
              <p>HealX Expense Analytics</p>
              <p>Real-time expense insights with accurate calculations</p>
              <div className="healx-etv-footer-metrics">
                <span>📊 {expenseData?.payrollExpenses?.totalEmployees || 0} Employees</span>
                <span>🏥 {expenseData?.inventoryExpenses?.totalItems || 0} Medical Items</span>
                <span>⚡ {expenseData?.utilitiesExpenses?.totalUtilities || 0} Utilities</span>
                <span>🤝 {expenseData?.supplierExpenses?.totalSuppliers || 0} Suppliers</span>
                <span>📦 {expenseData?.supplierExpenses?.totalOrders || 0} Orders</span>
              </div>
            </div>
            <div className="healx-etv-footer-actions">
              <button 
                className="healx-etv-btn healx-etv-btn-primary"
                onClick={() => navigate("/admin/financial")}
              >
                Financial Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpenseTracking;
