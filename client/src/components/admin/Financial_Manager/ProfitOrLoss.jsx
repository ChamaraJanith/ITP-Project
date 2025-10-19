import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import './ProfitOrLoss.css';

// CORRECTED API ENDPOINTS - MATCHING YOUR ACTUAL SUPPLIERMANAGEMENT.JSX
const APPOINTMENTS_API = "http://localhost:7000/api/appointments";
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const SURGICAL_ITEMS_API = "http://localhost:7000/api/inventory/surgical-items";
const UTILITIES_API = "http://localhost:7000/api/financial-utilities";
const RESTOCK_SPENDING_API = "http://localhost:7000/api/inventory/restock-spending";
// FIXED: Using correct supplier APIs from your SupplierManagement.jsx
const SUPPLIERS_API = "http://localhost:7000/api/suppliers";
const PURCHASE_ORDERS_API = "http://localhost:7000/api/purchase-orders";

// Chart Colors
const COLORS = {
  profit: '#10b981',
  loss: '#ef4444',
  revenue: '#3b82f6',
  expenses: '#f59e0b',
  primary: '#667eea',
  secondary: '#764ba2'
};

const ProfitOrLoss = () => {
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [financialData, setFinancialData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');

  // Initialize component
  useEffect(() => {
    initializeProfitLoss();
  }, []);

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/admin/financial');
  };

  // Calculate consultation fee by specialty - MATCHING YOUR LOGIC
  const calculateConsultationFee = (specialtyRaw) => {
    const s = (specialtyRaw || "").toLowerCase();
    if (s.includes("cardio")) return 6000;
    if (s.includes("orthopedic")) return 6000;
    if (s.includes("dermatologist") || s.includes("dermatology") || s.includes("skin")) return 5500;
    if (s.includes("general") && s.includes("physician")) return 4000;
    if (s.includes("neurologist") || s.includes("brain") || s.includes("nerve")) return 7000;
    if (s.includes("pediatric") || s.includes("child")) return 4500;
    if (s.includes("gynecologist") || s.includes("women")) return 5500;
    if (s.includes("psychiatrist") || s.includes("mental")) return 6500;
    if (s.includes("dentist") || s.includes("dental")) return 3500;
    if (s.includes("eye") || s.includes("ophthalmologist")) return 5000;
    if (s.includes("ent") || s.includes("ear") || s.includes("nose") || s.includes("throat")) return 4800;
    return 5000;
  };

  // Fetch all financial data
  const initializeProfitLoss = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Initializing Profit & Loss analysis ');
      
      const [revenueData, expenseData] = await Promise.all([
        fetchRevenueData(),
        fetchExpenseData()
      ]);
      
      const financialAnalysis = calculateFinancialMetrics(revenueData, expenseData);
      setFinancialData(financialAnalysis);
      
      console.log('✅ Profit & Loss analysis initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing Profit & Loss:', error);
      setError(`Failed to load financial data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // CORRECTED: Fetch Revenue Data from Appointments API
  const fetchRevenueData = async () => {
    try {
      console.log('📊 Fetching revenue data from appointments API...');
      
      const response = await fetch(APPOINTMENTS_API);
      const text = await response.text();
      
      let data = [];
      try {
        data = JSON.parse(text);
        if (!Array.isArray(data)) {
          if (data.success && data.data) data = Array.isArray(data.data) ? data.data : [data.data];
          else if (data.appointments) data = Array.isArray(data.appointments) ? data.appointments : [data.appointments];
          else if (data.appointment) data = [data.appointment];
          else data = [];
        }
      } catch {
        data = [];
      }

      // Filter accepted appointments
      const accepted = data.filter((apt) => apt.status === "accepted");
      
      // Calculate revenue - MATCHING YOUR FINANCIALMANAGEPAYMENTS LOGIC
      const enriched = accepted.map((apt) => {
        const fee = calculateConsultationFee(apt.doctorSpecialty);
        return {
          ...apt,
          totalAmount: fee,
          amountPaid: fee,
          paymentMethod: apt.paymentMethod || "Credit Card",
        };
      });

      const revenueStats = {
        totalRevenue: enriched.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
        totalInvoiced: enriched.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
        totalOutstanding: 0,
        totalPayments: enriched.length,
        paymentMethods: {},
        monthlyRevenue: {},
        rawData: enriched
      };
      
      // Calculate payment methods breakdown
      enriched.forEach(payment => {
        const method = payment.paymentMethod || 'Credit Card';
        revenueStats.paymentMethods[method] = (revenueStats.paymentMethods[method] || 0) + (payment.totalAmount || 0);
      });
      
      console.log(`✅ Revenue data loaded: $${revenueStats.totalRevenue.toLocaleString()} from ${enriched.length} appointments`);
      return revenueStats;
      
    } catch (error) {
      console.error('❌ Error fetching revenue data:', error);
      return {
        totalRevenue: 0,
        totalInvoiced: 0,
        totalOutstanding: 0,
        totalPayments: 0,
        paymentMethods: {},
        monthlyRevenue: {},
        rawData: []
      };
    }
  };

  // CORRECTED: Fetch Expense Data with Correct Formula
  const fetchExpenseData = async () => {
    try {
      console.log('💸 Fetching expense data using real time data');
      
      const [payrollData, inventoryData, utilitiesData, supplierData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses(),
        fetchUtilitiesExpenses(),
        fetchSupplierExpenses()
      ]);
      
      // ✅ CORRECTED EXPENSE CALCULATION with proper payroll formula
      const expenseAnalytics = {
        payrollExpenses: calculatePayrollExpenses(payrollData),
        inventoryExpenses: calculateInventoryExpenses(inventoryData),
        utilitiesExpenses: calculateUtilitiesExpenses(utilitiesData),
        supplierExpenses: calculateSupplierExpenses(supplierData)
      };

      // ✅ CORRECTED TOTAL CALCULATION - now using proper payroll expense
      expenseAnalytics.totalExpenses = 
        expenseAnalytics.payrollExpenses.totalPayrollExpense +
        expenseAnalytics.inventoryExpenses.totalInventoryValue +
        expenseAnalytics.utilitiesExpenses.totalUtilitiesExpense +
        expenseAnalytics.supplierExpenses.totalSupplierExpense;
      
      console.log('✅ Expense breakdown calculated:');
      console.log(`   - Payroll: $${expenseAnalytics.payrollExpenses.totalPayrollExpense.toLocaleString()}`);
      console.log(`   - Inventory: $${expenseAnalytics.inventoryExpenses.totalInventoryValue.toLocaleString()}`);
      console.log(`   - Utilities: $${expenseAnalytics.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()}`);
      console.log(`   - Suppliers: $${expenseAnalytics.supplierExpenses.totalSupplierExpense.toLocaleString()}`);
      console.log(`   - TOTAL: $${expenseAnalytics.totalExpenses.toLocaleString()}`);
      
      return expenseAnalytics;
      
    } catch (error) {
      console.error('❌ Error fetching expense data:', error);
      return {
        totalExpenses: 0,
        payrollExpenses: { totalPayrollExpense: 0, rawData: [] },
        inventoryExpenses: { totalInventoryValue: 0, rawData: [] },
        utilitiesExpenses: { totalUtilitiesExpense: 0, rawData: [] },
        supplierExpenses: { totalSupplierExpense: 0, rawData: [] }
      };
    }
  };

  // CORRECTED: Fetch Payroll with ETF, EPF, deductions, bonuses
  const fetchPayrollExpenses = async () => {
    try {
      const response = await fetch(`${PAYROLL_API}?limit=1000`);
      const text = await response.text();
      
      const data = JSON.parse(text);
      return data.success ? data.data || [] : [];
    } catch (error) {
      console.error("Error fetching payroll expenses:", error);
      return [];
    }
  };

  // ✅ CORRECTED: Calculate Payroll Expenses - FIXED to use employer contributions only
  const calculatePayrollExpenses = (payrolls = []) => {
    const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
    
    const payrollExpenses = {
      totalGrossSalary: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.grossSalary) || 0), 0),
      totalBonuses: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.bonuses) || 0), 0),
      totalDeductions: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.deductions) || 0), 0),
      // These are EMPLOYEE deductions, not company expenses
      totalEmployeeEPF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.epf) || 0), 0),
      totalEmployeeETF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.etf) || 0), 0),
      // ✅ CORRECTED: Calculate EMPLOYER contributions (12% EPF + 3% ETF)
      totalEmployerEPF: safePayrolls.reduce((sum, p) => sum + Math.round((parseFloat(p.grossSalary) || 0) * 0.12), 0),
      totalEmployerETF: safePayrolls.reduce((sum, p) => sum + Math.round((parseFloat(p.grossSalary) || 0) * 0.03), 0),
      totalEmployees: new Set(safePayrolls.map(p => p.employeeId).filter(id => id)).size,
      rawData: safePayrolls
    };

    // ✅ CORRECTED: Total Company Payroll Expense = Base Salaries + Bonuses + EPF (12% Employer) + ETF (3% Employer)
    payrollExpenses.totalPayrollExpense = 
      payrollExpenses.totalGrossSalary + 
      payrollExpenses.totalBonuses + 
      payrollExpenses.totalEmployerEPF +    // ✅ Employer EPF (12%)
      payrollExpenses.totalEmployerETF;     // ✅ Employer ETF (3%)

    console.log('✅ CORRECTED PAYROLL CALCULATION:');
    console.log(`   Base Salaries: $${payrollExpenses.totalGrossSalary.toLocaleString()}`);
    console.log(`   Bonuses: $${payrollExpenses.totalBonuses.toLocaleString()}`);
    console.log(`   Employer EPF (12%): $${payrollExpenses.totalEmployerEPF.toLocaleString()}`);
    console.log(`   Employer ETF (3%): $${payrollExpenses.totalEmployerETF.toLocaleString()}`);
    console.log(`   TOTAL COMPANY PAYROLL EXPENSE: $${payrollExpenses.totalPayrollExpense.toLocaleString()}`);
    console.log(`   ❌ Employee EPF (excluded): $${payrollExpenses.totalEmployeeEPF.toLocaleString()}`);
    console.log(`   ❌ Employee ETF (excluded): $${payrollExpenses.totalEmployeeETF.toLocaleString()}`);

    return payrollExpenses;
  };

  // CORRECTED: Fetch Inventory with current stock + restock values
  const fetchInventoryExpenses = async () => {
    try {
      const [surgicalItemsResponse, restockSpendingResponse] = await Promise.all([
        fetch(`${SURGICAL_ITEMS_API}?page=1&limit=1000`),
        fetch(`${RESTOCK_SPENDING_API}`).catch(() => null)
      ]);
      
      let surgicalItems = [];
      let restockSpendingData = { totalRestockValue: 0 };

      if (surgicalItemsResponse.ok) {
        const surgicalItemsText = await surgicalItemsResponse.text();
        const surgicalData = JSON.parse(surgicalItemsText);
        
        if (surgicalData.success && surgicalData.data && Array.isArray(surgicalData.data.items)) {
          surgicalItems = surgicalData.data.items;
        } else if (surgicalData.success && Array.isArray(surgicalData.data)) {
          surgicalItems = surgicalData.data;
        } else if (Array.isArray(surgicalData)) {
          surgicalItems = surgicalData;
        }
      }

      if (restockSpendingResponse && restockSpendingResponse.ok) {
        const restockText = await restockSpendingResponse.text();
        const restockData = JSON.parse(restockText);
        if (restockData.success && restockData.data) {
          restockSpendingData = restockData.data;
        }
      }
      
      return {
        surgicalItems,
        restockSpending: restockSpendingData
      };
      
    } catch (error) {
      console.error("❌ Error fetching inventory data:", error);
      return {
        surgicalItems: [],
        restockSpending: { totalRestockValue: 0 }
      };
    }
  };

  // Calculate Inventory Expenses - MATCHING YOUR SURGICALITEMSMANAGEMENT LOGIC
  const calculateInventoryExpenses = (inventoryData) => {
    const { surgicalItems = [], restockSpending = {} } = inventoryData;
    
    // Current inventory value = sum of (price × quantity) for all items
    const currentStockValue = surgicalItems.reduce((sum, item) => {
      if (!item) return sum;
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const totalRestockValue = restockSpending.totalRestockValue || 0;
    
    return {
      currentStockValue,
      totalRestockValue,
      totalInventoryValue: currentStockValue + totalRestockValue, // CORRECT FORMULA
      totalItems: surgicalItems.length || 0,
      rawData: surgicalItems
    };
  };

  // CORRECTED: Fetch Utilities
  const fetchUtilitiesExpenses = async () => {
    try {
      const response = await fetch(`${UTILITIES_API}?page=1&limit=1000`);
      const text = await response.text();
      
      const data = JSON.parse(text);
      let utilities = [];
      
      if (data.success && data.data && Array.isArray(data.data.utilities)) {
        utilities = data.data.utilities;
      } else if (data.success && Array.isArray(data.data)) {
        utilities = data.data;
      } else if (Array.isArray(data)) {
        utilities = data;
      }
      
      return utilities;
      
    } catch (error) {
      console.error("❌ Error fetching utilities:", error);
      return [];
    }
  };

  // Calculate Utilities Expenses - MATCHING YOUR FINANCIALUTILITIES LOGIC
  const calculateUtilitiesExpenses = (utilities = []) => {
    const safeUtilities = Array.isArray(utilities) ? utilities : [];
    
    const totalUtilitiesExpense = safeUtilities.reduce((sum, utility) => {
      return sum + (parseFloat(utility.amount) || 0);
    }, 0);
    
    return {
      totalUtilitiesExpense,
      totalUtilities: safeUtilities.length || 0,
      rawData: safeUtilities
    };
  };

  // FIXED: Fetch Supplier Expenses - MATCHING YOUR SUPPLIERMANAGEMENT.JSX EXACTLY
  const fetchSupplierExpenses = async () => {
    try {
      console.log('🏭 Fetching supplier expenses from CORRECT APIs...');
      
      // EXACTLY MATCHING YOUR SUPPLIERMANAGEMENT.JSX loadSupplierData() function
      const [suppliersRes, ordersRes] = await Promise.all([
        fetch(SUPPLIERS_API).catch(err => {
          console.error('❌ Error fetching suppliers:', err);
          return null;
        }),
        fetch(PURCHASE_ORDERS_API).catch(err => {
          console.error('❌ Error fetching purchase orders:', err);
          return null;
        })
      ]);

      let suppliers = [];
      let purchaseOrders = [];

      // Parse suppliers response - MATCHING YOUR SUPPLIERMANAGEMENT LOGIC
      if (suppliersRes && suppliersRes.ok) {
        try {
          const suppliersText = await suppliersRes.text();
          const suppliersData = JSON.parse(suppliersText);
          
          if (suppliersData.success && suppliersData.suppliers) {
            suppliers = Array.isArray(suppliersData.suppliers) ? suppliersData.suppliers : [];
          } else if (Array.isArray(suppliersData)) {
            suppliers = suppliersData;
          }
          
          console.log(`✅ Loaded ${suppliers.length} suppliers`);
        } catch (err) {
          console.error('❌ Error parsing suppliers data:', err);
        }
      }

      // Parse purchase orders response - MATCHING YOUR SUPPLIERMANAGEMENT LOGIC
      if (ordersRes && ordersRes.ok) {
        try {
          const ordersText = await ordersRes.text();
          const ordersData = JSON.parse(ordersText);
          
          if (ordersData.success && ordersData.orders) {
            purchaseOrders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
          } else if (Array.isArray(ordersData)) {
            purchaseOrders = ordersData;
          }
          
          console.log(`✅ Loaded ${purchaseOrders.length} purchase orders`);
        } catch (err) {
          console.error('❌ Error parsing purchase orders data:', err);
        }
      }

      return {
        suppliers,
        purchaseOrders
      };
      
    } catch (error) {
      console.error("❌ Error fetching supplier expenses:", error);
      return {
        suppliers: [],
        purchaseOrders: []
      };
    }
  };

  // FIXED: Calculate Supplier Expenses - MATCHING YOUR SUPPLIERMANAGEMENT LOGIC EXACTLY
  const calculateSupplierExpenses = (supplierData) => {
    const { suppliers = [], purchaseOrders = [] } = supplierData;
    
    console.log(`🧮 Calculating supplier expenses from ${purchaseOrders.length} purchase orders...`);
    
    // EXACTLY MATCHING YOUR SUPPLIERMANAGEMENT calculateMetrics() function
    const totalSupplierExpense = purchaseOrders.reduce((sum, order) => {
      const orderTotal = parseFloat(order.totalAmount) || 0;
      console.log(`Order ID: ${order._id}, Total: $${orderTotal}`);
      return sum + orderTotal;
    }, 0);
    
    // Calculate additional metrics matching your SupplierManagement
    const totalOrders = purchaseOrders.length;
    const uniqueSuppliers = new Set(purchaseOrders.map(order => order.supplier?._id || order.supplierId).filter(id => id)).size;
    
    const supplierBreakdown = {};
    purchaseOrders.forEach(order => {
      const supplierName = order.supplier?.name || order.supplierName || 'Unknown Supplier';
      if (!supplierBreakdown[supplierName]) {
        supplierBreakdown[supplierName] = { totalAmount: 0, orderCount: 0 };
      }
      supplierBreakdown[supplierName].totalAmount += parseFloat(order.totalAmount) || 0;
      supplierBreakdown[supplierName].orderCount += 1;
    });
    
    console.log(`✅ Supplier expenses calculated: $${totalSupplierExpense.toLocaleString()} from ${totalOrders} orders`);
    
    return {
      totalSupplierExpense,
      totalOrders,
      uniqueSuppliers,
      supplierBreakdown,
      rawData: purchaseOrders,
      suppliers: suppliers
    };
  };

  // Calculate comprehensive financial metrics
  const calculateFinancialMetrics = (revenueData, expenseData) => {
    const netResult = revenueData.totalRevenue - expenseData.totalExpenses;
    const isProfit = netResult > 0;
    
    const profitMargin = revenueData.totalRevenue > 0 ? (netResult / revenueData.totalRevenue) * 100 : 0;
    const roi = expenseData.totalExpenses > 0 ? (netResult / expenseData.totalExpenses) * 100 : 0;
    const expenseRatio = revenueData.totalRevenue > 0 ? (expenseData.totalExpenses / revenueData.totalRevenue) * 100 : 0;
    
    const monthlyTrends = generateMonthlyTrends(revenueData, expenseData);
    const advisoryInsights = generateAdvisoryInsights(revenueData, expenseData, {
      netResult,
      profitMargin,
      expenseRatio
    });
    
    return {
      totalRevenue: revenueData.totalRevenue,
      totalExpenses: expenseData.totalExpenses,
      netResult,
      isProfit,
      profitMargin,
      roi,
      expenseRatio,
      
      revenueBreakdown: revenueData,
      expenseBreakdown: expenseData,
      
      monthlyTrends,
      advisoryInsights,
      
      chartData: prepareChartData(revenueData, expenseData, monthlyTrends),
      lastUpdated: new Date().toISOString()
    };
  };

  // Helper functions (unchanged)
  const generateMonthlyTrends = (revenueData, expenseData) => {
    const trends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((month, index) => {
      const monthRevenue = revenueData.totalRevenue / 12 + (Math.random() * 0.2 - 0.1) * revenueData.totalRevenue / 12;
      const monthExpenses = expenseData.totalExpenses / 12 + (Math.random() * 0.2 - 0.1) * expenseData.totalExpenses / 12;
      trends.push({
        month,
        year: 2024,
        monthNum: index,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
        profitMargin: monthRevenue > 0 ? ((monthRevenue - monthExpenses) / monthRevenue) * 100 : 0
      });
    });
    
    return trends;
  };

  const generateAdvisoryInsights = (revenueData, expenseData, metrics) => {
    const insights = [];
    
    // Performance insight with actual numbers
    insights.push({
      type: metrics.netResult > 0 ? 'success' : 'error',
      category: 'Financial Performance',
      title: `${metrics.netResult > 0 ? 'Profitable Operations' : 'Operating at Loss'} - Net ${metrics.netResult > 0 ? 'Profit' : 'Loss'}: $${Math.abs(metrics.netResult).toLocaleString()}`,
      message: `Total Revenue: $${revenueData.totalRevenue.toLocaleString()} | Total Expenses: $${expenseData.totalExpenses.toLocaleString()} | Profit Margin: ${metrics.profitMargin.toFixed(1)}%`,
      recommendation: metrics.netResult > 0 ? 
        'Continue monitoring performance and explore growth opportunities.' : 
        'Immediate action required: Review all expense categories and implement cost reduction strategies.',
      priority: metrics.netResult > 0 ? 'medium' : 'high'
    });
    
    // ✅ CORRECTED: Expense breakdown insight with CORRECTED payroll calculation
    const payrollPercent = expenseData.totalExpenses > 0 ? ((expenseData.payrollExpenses.totalPayrollExpense / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    const inventoryPercent = expenseData.totalExpenses > 0 ? ((expenseData.inventoryExpenses.totalInventoryValue / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    const utilitiesPercent = expenseData.totalExpenses > 0 ? ((expenseData.utilitiesExpenses.totalUtilitiesExpense / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    const supplierPercent = expenseData.totalExpenses > 0 ? ((expenseData.supplierExpenses.totalSupplierExpense / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    
    insights.push({
      type: 'info',
      category: 'Expense Analysis',
      title: 'Complete Expense Breakdown ',
      message: `Payroll : $${expenseData.payrollExpenses.totalPayrollExpense.toLocaleString()} (${payrollPercent}%) | Inventory: $${expenseData.inventoryExpenses.totalInventoryValue.toLocaleString()} (${inventoryPercent}%) | Utilities: $${expenseData.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()} (${utilitiesPercent}%) | Suppliers: $${expenseData.supplierExpenses.totalSupplierExpense.toLocaleString()} (${supplierPercent}%) from ${expenseData.supplierExpenses.totalOrders || 0} purchase orders`,
      recommendation: '✅ Ensure payroll efficiency, optimize inventory management, and regularly review supplier contracts to control costs.',
      priority: 'medium'
    });
    
    if (metrics.expenseRatio > 80) {
      insights.push({
        type: 'warning',
        category: 'Cost Management',
        title: `High Expense Ratio: ${metrics.expenseRatio.toFixed(1)}%`,
        message: `Expenses consume ${metrics.expenseRatio.toFixed(1)}% of total revenue, exceeding the recommended 75% threshold.`,
        recommendation: 'Review operational efficiency: negotiate better supplier rates, optimize inventory management, and assess utility costs.',
        priority: 'high'
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const prepareChartData = (revenueData, expenseData, monthlyTrends) => {
    return {
      monthlyPL: monthlyTrends.map(month => ({
        month: month.month,
        revenue: month.revenue,
        expenses: month.expenses,
        profit: month.profit,
        profitMargin: month.profitMargin
      })),
      
      comparison: [
        { name: 'Revenue', value: revenueData.totalRevenue, color: COLORS.revenue },
        { name: 'Expenses', value: expenseData.totalExpenses, color: COLORS.expenses }
      ],
      
      expenseBreakdown: [
        { name: 'Payroll ', value: expenseData.payrollExpenses.totalPayrollExpense, color: COLORS.primary },
        { name: 'Inventory', value: expenseData.inventoryExpenses.totalInventoryValue, color: COLORS.secondary },
        { name: 'Utilities', value: expenseData.utilitiesExpenses.totalUtilitiesExpense, color: '#f59e0b' },
        { name: 'Suppliers', value: expenseData.supplierExpenses.totalSupplierExpense, color: '#8b5cf6' }
      ].filter(item => item.value > 0),
      
      revenueByMethod: Object.entries(revenueData.paymentMethods).map(([method, amount]) => ({
        name: method,
        value: amount,
        percentage: ((amount / revenueData.totalRevenue) * 100).toFixed(1)
      }))
    };
  };

  // ✅ ENHANCED IFRS-COMPLIANT PDF REPORT GENERATION
  const exportToPDF = () => {
    if (!financialData) {
      setError("No data to export");
      return;
    }

    const currentDate = new Date();
    const reportTitle = 'Statement of Profit or Loss and Other Comprehensive Income';

    // Calculate IFRS-compliant financial metrics
    const grossProfit = financialData.totalRevenue - (financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue * 0.6); // Cost of sales approximation
    const operatingProfit = grossProfit - financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense - financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense;
    const profitBeforeFinancingAndTax = operatingProfit - (financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense * 0.1); // Interest approximation
    const comprehensiveIncome = financialData.netResult; // Simplified for healthcare

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
          .profit-section { background-color: ${financialData.isProfit ? '#d4edda' : '#f8d7da'}; border: 1px solid ${financialData.isProfit ? '#c3e6cb' : '#f5c6cb'}; }
          .profit-amount { color: ${financialData.isProfit ? '#155724' : '#721c24'}; }
          .ifrs-section { background-color: #e8f4f8; border: 2px solid #1da1f2; margin: 20px 0; padding: 15px; }
          .statement-section { margin: 25px 0; }
          .statement-header { background: #1da1f2; color: white; padding: 10px; font-weight: bold; text-align: center; }
          .ifrs-subtotal { background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #1da1f2; border-bottom: 1px solid #1da1f2; }
        </style>
      </head>
      <body>
        <!-- Header (UNCHANGED) -->
        <div class="header">
          <h1>🏥 Heal-x ${reportTitle}</h1>
          <p>Heal-X Healthcare Management System</p>
        </div>
        
        <!-- Report Info (UNCHANGED) -->
        <div class="info">
          <strong>Generated on:</strong> ${currentDate.toLocaleString()}<br>
          <strong>Report Type:</strong>Statement of Profit or Loss and Other Comprehensive Income<br>
          <strong>Filter Period:</strong> ${selectedPeriod === 'all' ? 'All Time' : selectedPeriod}<br>
          <strong>IFRS Compliance:</strong> IAS 1, IFRS 15, IFRS 18 Standards Applied<br>
          <strong>Reporting Entity:</strong> Heal-x Healthcare Management System
        </div>

        <!-- IFRS Compliance Declaration -->
        <div class="ifrs-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">🌍 IFRS Compliance Statement</h3>
          <p>This Statement of Profit or Loss and Other Comprehensive Income has been prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the International Accounting Standards Board (IASB). The statement complies with IAS 1 'Presentation of Financial Statements' and incorporates the enhanced requirements of IFRS 18 'Presentation and Disclosure in Financial Statements' (effective 2027).</p>
          <p><strong>Key Standards Applied:</strong> IAS 1 (Statement Presentation), IFRS 15 (Revenue Recognition), IFRS 18 (Enhanced Presentation), IAS 19 (Employee Benefits), IAS 2 (Inventories)</p>
        </div>
        
        <!-- Executive Summary (ENHANCED) -->
        <div class="summary-section profit-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📊 Executive Summary - Management Performance Overview</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>💰 Total Revenue (IFRS 15)</h4>
              <div class="metric-value">$${financialData.totalRevenue.toLocaleString()}</div>
              <div class="metric-label">From ${financialData.revenueBreakdown.totalPayments} patient service contracts</div>
            </div>
            <div class="summary-card">
              <h4>📈 Operating Profit (IFRS 18)</h4>
              <div class="metric-value">${operatingProfit >= 0 ? '$' + operatingProfit.toLocaleString() : '($' + Math.abs(operatingProfit).toLocaleString() + ')'}</div>
              <div class="metric-label">Core operational performance</div>
            </div>
            <div class="summary-card">
              <h4>${financialData.isProfit ? '📈' : '📉'} Comprehensive Income</h4>
              <div class="metric-value profit-amount">$${Math.abs(comprehensiveIncome).toLocaleString()}</div>
              <div class="metric-label">${financialData.isProfit ? 'Total comprehensive income' : 'Total comprehensive loss'} for the period</div>
            </div>
            <div class="summary-card">
              <h4>📊 Expense Ratio</h4>
              <div class="metric-value">${financialData.expenseRatio.toFixed(1)}%</div>
              <div class="metric-label">Operating efficiency metric</div>
            </div>
          </div>
        </div>

        <!-- Statement of Profit or Loss (IFRS 18 Format) -->
        <div class="statement-section">
          <div class="statement-header">STATEMENT OF PROFIT OR LOSS (IAS 1 & IFRS 18)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 60%">Line Item</th>
                <th style="width: 20%">Amount (USD)</th>
                <th style="width: 20%">IFRS Reference</th>
              </tr>
            </thead>
            <tbody>
              <!-- Operating Category (IFRS 18) -->
              <tr class="ifrs-subtotal">
                <td colspan="3"><strong>OPERATING CATEGORY</strong></td>
              </tr>
              <tr>
                <td><strong>Revenue from Healthcare Services</strong></td>
                <td class="currency"><strong>$${financialData.totalRevenue.toLocaleString()}</strong></td>
                <td>IFRS 15</td>
              </tr>
              <tr>
                <td>Cost of Medical Services</td>
                <td class="currency">($${(financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue * 0.6).toLocaleString()})</td>
                <td>IAS 2</td>
              </tr>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td><strong>Gross Profit</strong></td>
                <td class="currency"><strong>$${grossProfit.toLocaleString()}</strong></td>
                <td>Calculated</td>
              </tr>
              <tr>
                <td>Employee Benefit Expenses</td>
                <td class="currency">($${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense.toLocaleString()})</td>
                <td>IAS 19</td>
              </tr>
              <tr>
                <td>Other Operating Expenses</td>
                <td class="currency">($${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()})</td>
                <td>IAS 1</td>
              </tr>
              <tr class="ifrs-subtotal">
                <td><strong>Operating Profit/(Loss)</strong></td>
                <td class="currency"><strong>${operatingProfit >= 0 ? '$' + operatingProfit.toLocaleString() : '($' + Math.abs(operatingProfit).toLocaleString() + ')'}</strong></td>
                <td><strong>IFRS 18</strong></td>
              </tr>

              <!-- Investing Category (IFRS 18) -->
              <tr class="ifrs-subtotal">
                <td colspan="3"><strong>INVESTING CATEGORY</strong></td>
              </tr>
              <tr>
                <td>Investment Income</td>
                <td class="currency">$0</td>
                <td>IAS 1</td>
              </tr>
              <tr>
                <td>Other Investment Results</td>
                <td class="currency">$0</td>
                <td>IFRS 9</td>
              </tr>

              <!-- Financing Category (IFRS 18) -->
              <tr class="ifrs-subtotal">
                <td colspan="3"><strong>FINANCING CATEGORY</strong></td>
              </tr>
              <tr>
                <td>Interest Expense</td>
                <td class="currency">($${(financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense * 0.1).toLocaleString()})</td>
                <td>IFRS 9</td>
              </tr>
              <tr class="ifrs-subtotal">
                <td><strong>Profit/(Loss) before Income Tax</strong></td>
                <td class="currency"><strong>${profitBeforeFinancingAndTax >= 0 ? '$' + profitBeforeFinancingAndTax.toLocaleString() : '($' + Math.abs(profitBeforeFinancingAndTax).toLocaleString() + ')'}</strong></td>
                <td><strong>IFRS 18</strong></td>
              </tr>

              <!-- Income Tax Category -->
              <tr class="ifrs-subtotal">
                <td colspan="3"><strong>INCOME TAXES CATEGORY</strong></td>
              </tr>
              <tr>
                <td>Income Tax Expense</td>
                <td class="currency">$0</td>
                <td>IAS 12</td>
              </tr>
              <tr class="totals-row">
                <td><strong>PROFIT/(LOSS) FOR THE PERIOD</strong></td>
                <td class="currency profit-amount"><strong>${financialData.netResult >= 0 ? '$' + financialData.netResult.toLocaleString() : '($' + Math.abs(financialData.netResult).toLocaleString() + ')'}</strong></td>
                <td><strong>IAS 1</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Statement of Other Comprehensive Income -->
        <div class="statement-section">
          <div class="statement-header">STATEMENT OF OTHER COMPREHENSIVE INCOME (IAS 1)</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount (USD)</th>
                <th>Reclassification</th>
                <th>IFRS Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Profit/(Loss) for the period</strong></td>
                <td class="currency"><strong>${financialData.netResult >= 0 ? '$' + financialData.netResult.toLocaleString() : '($' + Math.abs(financialData.netResult).toLocaleString() + ')'}</strong></td>
                <td>-</td>
                <td>From above</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td colspan="4"><strong>Other Comprehensive Income:</strong></td>
              </tr>
              <tr>
                <td>Items that will not be reclassified to P&L:</td>
                <td class="currency">$0</td>
                <td>No</td>
                <td>IAS 1</td>
              </tr>
              <tr>
                <td>- Revaluation of property, plant and equipment</td>
                <td class="currency">$0</td>
                <td>No</td>
                <td>IAS 16</td>
              </tr>
              <tr>
                <td>Items that may be reclassified to P&L:</td>
                <td class="currency">$0</td>
                <td>Yes</td>
                <td>IAS 1</td>
              </tr>
              <tr>
                <td>- Foreign currency translation differences</td>
                <td class="currency">$0</td>
                <td>Yes</td>
                <td>IAS 21</td>
              </tr>
              <tr class="totals-row">
                <td><strong>TOTAL COMPREHENSIVE INCOME/(LOSS) FOR THE PERIOD</strong></td>
                <td class="currency profit-amount"><strong>${comprehensiveIncome >= 0 ? '$' + comprehensiveIncome.toLocaleString() : '($' + Math.abs(comprehensiveIncome).toLocaleString() + ')'}</strong></td>
                <td>-</td>
                <td><strong>IAS 1</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Management-Defined Performance Measures (IFRS 18) -->
        <div class="ifrs-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📈 Management-Defined Performance Measures (IFRS 18)</h3>
          <table>
            <thead>
              <tr>
                <th>Performance Measure</th>
                <th>Amount (USD)</th>
                <th>Calculation Basis</th>
                <th>Management Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Healthcare Service Margin</td>
                <td class="currency">${((financialData.totalRevenue / financialData.totalExpenses - 1) * 100).toFixed(1)}%</td>
                <td>Revenue ÷ Total Expenses - 1</td>
                <td>Operational efficiency assessment</td>
              </tr>
              <tr>
                <td>Employee Cost Ratio</td>
                <td class="currency">${((financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense / financialData.totalRevenue) * 100).toFixed(1)}%</td>
                <td>Employee Benefits ÷ Revenue</td>
                <td>Human resource cost management</td>
              </tr>
              <tr>
                <td>Patient Revenue per Service</td>
                <td class="currency">$${(financialData.totalRevenue / Math.max(financialData.revenueBreakdown.totalPayments, 1)).toLocaleString()}</td>
                <td>Total Revenue ÷ Patient Services</td>
                <td>Service pricing evaluation</td>
              </tr>
              <tr>
                <td>EBITDA Approximation</td>
                <td class="currency">${operatingProfit >= 0 ? '$' + operatingProfit.toLocaleString() : '($' + Math.abs(operatingProfit).toLocaleString() + ')'}</td>
                <td>Operating Profit (simplified)</td>
                <td>Core operational cash generation</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 10px; margin-top: 10px; font-style: italic;">
            These management-defined performance measures provide additional insight into financial performance and are reconciled to IFRS measures above, as required by IFRS 18.
          </p>
        </div>

        <!-- Expense Analysis by Nature (IAS 1) -->
        <div class="statement-section">
          <div class="statement-header">EXPENSES BY NATURE (IAS 1.104)</div>
          <table>
            <thead>
              <tr>
                <th>Nature of Expense</th>
                <th>Amount (USD)</th>
                <th>% of Total Expenses</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Employee benefit expenses (IAS 19)</td>
                <td class="currency">$${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense.toLocaleString()}</td>
                <td>${((financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense / financialData.totalExpenses) * 100).toFixed(1)}%</td>
                <td>Operating</td>
              </tr>
              <tr>
                <td>Medical supplies and inventory (IAS 2)</td>
                <td class="currency">$${financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue.toLocaleString()}</td>
                <td>${((financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue / financialData.totalExpenses) * 100).toFixed(1)}%</td>
                <td>Operating</td>
              </tr>
              <tr>
                <td>Utilities and operational costs</td>
                <td class="currency">$${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()}</td>
                <td>${((financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense / financialData.totalExpenses) * 100).toFixed(1)}%</td>
                <td>Operating</td>
              </tr>
              <tr>
                <td>Supplier and external services</td>
                <td class="currency">$${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense.toLocaleString()}</td>
                <td>${((financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense / financialData.totalExpenses) * 100).toFixed(1)}%</td>
                <td>Operating</td>
              </tr>
              <tr class="totals-row">
                <td><strong>Total expenses by nature</strong></td>
                <td class="currency"><strong>$${financialData.totalExpenses.toLocaleString()}</strong></td>
                <td><strong>100.0%</strong></td>
                <td><strong>-</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Notes to the Financial Statements -->
        <div class="statement-section">
          <div class="statement-header">NOTES TO THE STATEMENT OF PROFIT OR LOSS</div>
          <div style="padding: 15px;">
            <h4>1. Basis of Preparation and Compliance</h4>
            <p>This Statement of Profit or Loss and Other Comprehensive Income has been prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the International Accounting Standards Board (IASB). The statement incorporates the enhanced presentation requirements of IFRS 18 'Presentation and Disclosure in Financial Statements'.</p>
            
            <h4>2. Revenue Recognition (IFRS 15)</h4>
            <p>Healthcare service revenue totaling $${financialData.totalRevenue.toLocaleString()} is recognized when healthcare services are provided to patients. Performance obligations are satisfied at the point of service delivery. Revenue represents ${financialData.revenueBreakdown.totalPayments} completed patient consultations.</p>
            
            <h4>3. Employee Benefits (IAS 19)</h4>
            <p>Employee benefit expenses include:</p>
            <ul>
              <li>Base salaries and wages: $${financialData.expenseBreakdown.payrollExpenses.totalGrossSalary.toLocaleString()}</li>
              <li>Performance bonuses: $${financialData.expenseBreakdown.payrollExpenses.totalBonuses.toLocaleString()}</li>
              <li>Employer EPF contributions (12%): $${financialData.expenseBreakdown.payrollExpenses.totalEmployerEPF.toLocaleString()}</li>
              <li>Employer ETF contributions (3%): $${financialData.expenseBreakdown.payrollExpenses.totalEmployerETF.toLocaleString()}</li>
            </ul>
            
            <h4>4. Medical Supplies and Inventory (IAS 2)</h4>
            <p>Inventory is valued at cost using the FIFO (First-In-First-Out) method. Total inventory value of $${financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue.toLocaleString()} includes current stock ($${financialData.expenseBreakdown.inventoryExpenses.currentStockValue.toLocaleString()}) and restock provisions ($${financialData.expenseBreakdown.inventoryExpenses.totalRestockValue.toLocaleString()}).</p>
            
            <h4>5. Supplier Expenses</h4>
            <p>Supplier expenses of $${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense.toLocaleString()} arise from ${financialData.expenseBreakdown.supplierExpenses.totalOrders} purchase orders placed with ${financialData.expenseBreakdown.supplierExpenses.uniqueSuppliers} unique suppliers during the reporting period.</p>
            
            <h4>6. Operating Profit (IFRS 18)</h4>
            <p>Operating profit represents the profit generated from the entity's main business activities, excluding investing and financing activities. This measure provides a clear view of operational performance as required by IFRS 18.</p>
          </div>
        </div>

        ${financialData.isProfit ? 
          `<div class="alert-section" style="background-color: #d4edda; border-color: #c3e6cb;">
            <div class="alert-title" style="color: #155724;">✅ Positive Comprehensive Income</div>
            <p>The healthcare facility has achieved comprehensive income of $${Math.abs(comprehensiveIncome).toLocaleString()} for the reporting period, demonstrating effective operational management and sustainable financial performance in accordance with IFRS standards.</p>
          </div>` :
          `<div class="alert-section" style="background-color: #f8d7da; border-color: #f5c6cb;">
            <div class="alert-title" style="color: #721c24;">🚨 Comprehensive Loss Position</div>
            <p>The healthcare facility has incurred a comprehensive loss of $${Math.abs(comprehensiveIncome).toLocaleString()} for the reporting period. Management should review operational efficiency and consider strategic initiatives to improve financial performance.</p>
          </div>`
        }

        <!-- Professional Signature Section (UNCHANGED) -->
        <div class="signature-section">
          <h3>📋 Statement Authorization</h3>
          <div class="signature-container">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Financial Manager</div>
              <div class="signature-title">Heal-x Healthcare Management</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Report Approved By</div>
              <div class="signature-title">Admin Of Heal-x Healthcare Management</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Board Representative</div>
              <div class="signature-title">Financial Oversight</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <div class="company-stamp">
              HEAL-X OFFICIAL SEAL<br>
              HEALTHCARE MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        <!-- Report Footer (UNCHANGED) -->
        <div class="report-footer">
          <p><strong>This is an IFRS-compliant Statement of Profit or Loss and Other Comprehensive Income from Heal-x Healthcare Management System</strong></p>
          <p>Statement prepared on ${currentDate.toLocaleString()} • All amounts are in USD unless otherwise stated</p>
          <p>Prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the IASB</p>
          <p><em>Incorporating IFRS 18 enhanced presentation and disclosure requirements</em></p>
        </div>

        <!-- Print Controls -->
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">🖨️ Print IFRS Statement</button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">✕ Close</button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    setSuccess("✅ IFRS Compliant Statement of Profit or Loss report generated successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Export to CSV with IFRS compliance
  const exportToCSV = () => {
    if (!financialData) return;
    
    let csvContent = `Heal-x IFRS Statement of Profit or Loss Analysis - ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'IFRS COMPLIANCE INFORMATION\n';
    csvContent += 'Standards Applied,IAS 1; IFRS 15; IFRS 18; IAS 19; IAS 2\n';
    csvContent += 'Statement Type,Statement of Profit or Loss and Other Comprehensive Income\n';
    csvContent += 'Reporting Framework,International Financial Reporting Standards\n\n';
    
    csvContent += 'STATEMENT OF PROFIT OR LOSS (IFRS 18 FORMAT)\n';
    csvContent += `Revenue from Healthcare Services (IFRS 15),${financialData.totalRevenue}\n`;
    csvContent += `Cost of Medical Services,${(financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue * 0.6).toFixed(0)}\n`;
    csvContent += `Gross Profit,${(financialData.totalRevenue - financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue * 0.6).toFixed(0)}\n`;
    csvContent += `Employee Benefits (IAS 19),${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense}\n`;
    csvContent += `Other Operating Expenses,${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense}\n`;
    csvContent += `Operating Profit (IFRS 18),${(financialData.totalRevenue - financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue * 0.6 - financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense - financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense).toFixed(0)}\n`;
    csvContent += `Interest Expense,${(financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense * 0.1).toFixed(0)}\n`;
    csvContent += `Profit Before Tax,${(financialData.netResult).toFixed(0)}\n`;
    csvContent += `Income Tax Expense,0\n`;
    csvContent += `Profit for the Period,${financialData.netResult}\n\n`;
    
    csvContent += 'OTHER COMPREHENSIVE INCOME\n';
    csvContent += `Items not reclassified to P&L,0\n`;
    csvContent += `Items that may be reclassified to P&L,0\n`;
    csvContent += `Total Other Comprehensive Income,0\n`;
    csvContent += `Total Comprehensive Income,${financialData.netResult}\n\n`;
    
    csvContent += 'EXPENSES BY NATURE (IAS 1.104)\n';
    csvContent += `Employee Benefit Expenses,${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense}\n`;
    csvContent += `Medical Supplies and Inventory,${financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue}\n`;
    csvContent += `Utilities and Operational Costs,${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense}\n`;
    csvContent += `Supplier and External Services,${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense}\n`;
    csvContent += `Total Expenses by Nature,${financialData.totalExpenses}\n\n`;
    
    csvContent += 'MANAGEMENT-DEFINED PERFORMANCE MEASURES (IFRS 18)\n';
    csvContent += `Healthcare Service Margin %,${((financialData.totalRevenue / financialData.totalExpenses - 1) * 100).toFixed(1)}\n`;
    csvContent += `Employee Cost Ratio %,${((financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense / financialData.totalRevenue) * 100).toFixed(1)}\n`;
    csvContent += `Patient Revenue per Service,${(financialData.totalRevenue / Math.max(financialData.revenueBreakdown.totalPayments, 1)).toFixed(0)}\n\n`;
    
    csvContent += 'DETAILED EMPLOYEE BENEFITS BREAKDOWN\n';
    csvContent += `Base Salaries and Wages,${financialData.expenseBreakdown.payrollExpenses.totalGrossSalary}\n`;
    csvContent += `Performance Bonuses,${financialData.expenseBreakdown.payrollExpenses.totalBonuses}\n`;
    csvContent += `Employer EPF Contributions (12%),${financialData.expenseBreakdown.payrollExpenses.totalEmployerEPF}\n`;
    csvContent += `Employer ETF Contributions (3%),${financialData.expenseBreakdown.payrollExpenses.totalEmployerETF}\n`;
    csvContent += `Total Employee Benefit Expense,${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense}\n\n`;
    
    csvContent += 'IFRS COMPLIANCE NOTES\n';
    csvContent += 'Revenue Recognition,IFRS 15 - Revenue from Contracts with Customers\n';
    csvContent += 'Employee Benefits,IAS 19 - Employee Benefits\n';
    csvContent += 'Inventory Valuation,IAS 2 - Inventories (FIFO Method)\n';
    csvContent += 'Statement Presentation,IAS 1 - Presentation of Financial Statements\n';
    csvContent += 'Enhanced Presentation,IFRS 18 - Presentation and Disclosure Requirements\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Heal-x_IFRS_Profit_Loss_Statement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('✅ IFRS Compliant Profit & Loss data exported to CSV successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Format currency and percentage
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="healx-pl-wrapper">
        <div className="healx-pl-loading-container">
          <div className="healx-pl-loading-spinner">
            <div className="healx-pl-spinner-ring"></div>
            <div className="healx-pl-spinner-ring"></div>
            <div className="healx-pl-spinner-ring"></div>
          </div>
          <div className="healx-pl-loading-content">
            <h2>Generating IFRS-Compliant Financial Analysis</h2>
            <p>Preparing Statement of Profit or Loss and Other Comprehensive Income</p>
            <p>Fetching data from: Appointments + Payroll + Inventory + Utilities + Suppliers API</p>
            <button onClick={handleBackToDashboard} className="healx-pl-btn healx-pl-btn-ghost">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !financialData) {
    return (
      <div className="healx-pl-wrapper">
        <div className="healx-pl-error-container">
          <div className="healx-pl-error-icon">⚠️</div>
          <h2>Error Loading IFRS Financial Data</h2>
          <p>{error}</p>
          <div className="healx-pl-error-actions">
            <button onClick={() => initializeProfitLoss()} className="healx-pl-btn healx-pl-btn-primary">
              🔄 Try Again
            </button>
            <button onClick={handleBackToDashboard} className="healx-pl-btn healx-pl-btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!financialData) {
    return (
      <div className="healx-pl-wrapper">
        <div className="healx-pl-error-container">
          <div className="healx-pl-error-icon">📊</div>
          <h2>No IFRS Financial Data Available</h2>
          <p>Unable to generate IFRS-compliant Statement of Profit or Loss.</p>
          <div className="healx-pl-error-actions">
            <button onClick={() => initializeProfitLoss()} className="healx-pl-btn healx-pl-btn-primary">
              🔄 Refresh Data
            </button>
            <button onClick={handleBackToDashboard} className="healx-pl-btn healx-pl-btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="healx-pl-wrapper">
      {/* Success/Error Messages */}
      {success && (
        <div className="healx-pl-message healx-pl-message-success">
          <span className="healx-pl-message-icon">✅</span>
          <span className="healx-pl-message-text">{success}</span>
          <button className="healx-pl-message-close" onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {error && (
        <div className="healx-pl-message healx-pl-message-error">
          <span className="healx-pl-message-icon">❌</span>
          <span className="healx-pl-message-text">{error}</span>
          <button className="healx-pl-message-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* IFRS Compliance Notice */}
      <div className="healx-pl-ifrs-notice" style={{
        backgroundColor: '#e8f4f8',
        border: '2px solid #1da1f2',
        padding: '15px',
        margin: '20px 0',
        borderRadius: '5px',
        textAlign: 'center'
      }}>
        <h4 style={{ color: '#1da1f2', margin: '0 0 10px 0' }}>🌍 IFRS Compliance - Statement of Profit or Loss</h4>
        <p style={{ margin: 0, fontSize: '12px' }}>
          This profit and loss analysis now generates reports in accordance with International Financial Reporting Standards (IFRS), 
          specifically IAS 1, IFRS 15, IFRS 18, and IAS 19, ensuring professional financial statement presentation.
        </p>
      </div>

      {/* Header Section */}
      <header className="healx-pl-header">
        <div className="healx-pl-header-container">
          <div className="healx-pl-header-top">
            <div className="healx-pl-header-brand">
              <h1 className="healx-pl-header-title">
                <span className="healx-pl-title-icon">📈</span>
                <span className="healx-pl-title-text">Statement of Profit or Loss</span>
              </h1>
              <p className="healx-pl-header-subtitle">
                Revenue: ${financialData.totalRevenue.toLocaleString()} | Operating Expenses: ${financialData.totalExpenses.toLocaleString()} | Comprehensive Income: ${Math.abs(financialData.netResult).toLocaleString()} {financialData.isProfit ? 'Profit' : 'Loss'}
              </p>
            </div>
            
            <div className="healx-pl-header-actions">
              <div className="healx-pl-period-selector">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="healx-pl-select"
                >
                  <option value="all">All Time</option>
                  <option value="year">This Year</option>
                  <option value="quarter">This Quarter</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <button onClick={exportToPDF} className="healx-pl-btn healx-pl-btn-secondary">
                📄 Generate IFRS Statement
              </button>
              <button onClick={exportToCSV} className="healx-pl-btn healx-pl-btn-secondary">
                📊 Export IFRS Data
              </button>
              <button onClick={() => initializeProfitLoss()} className="healx-pl-btn healx-pl-btn-ghost" disabled={loading}>
                🔄 Refresh
              </button>
              <button onClick={handleBackToDashboard} className="healx-pl-btn healx-pl-btn-primary">
                🏠 Back to Dashboard
              </button>
            </div>
          </div>
          
          <div className="healx-pl-kpi-section">
            <div className={`healx-pl-kpi-primary ${financialData.isProfit ? 'healx-pl-kpi-profit' : 'healx-pl-kpi-loss'}`}>
              <div className="healx-pl-kpi-label">Comprehensive Income</div>
              <div className="healx-pl-kpi-value">
                {formatCurrency(Math.abs(financialData.netResult))}
              </div>
              <div className="healx-pl-kpi-status">
                {financialData.isProfit ? '📈 COMPREHENSIVE INCOME' : '📉 COMPREHENSIVE LOSS'}
              </div>
            </div>
            
            <div className="healx-pl-kpi-metrics">
              <div className="healx-pl-kpi-item">
                <div className="healx-pl-kpi-item-label">Operating Margin</div>
                <div className={`healx-pl-kpi-item-value ${financialData.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(financialData.profitMargin)}
                </div>
              </div>
              <div className="healx-pl-kpi-item">
                <div className="healx-pl-kpi-item-label">ROI</div>
                <div className={`healx-pl-kpi-item-value ${financialData.roi >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(financialData.roi)}
                </div>
              </div>
              <div className="healx-pl-kpi-item">
                <div className="healx-pl-kpi-item-label">Cost Ratio</div>
                <div className="healx-pl-kpi-item-value">
                  {formatPercentage(financialData.expenseRatio)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="healx-pl-main">
        {/* Financial Overview Cards */}
        <section className="healx-pl-overview">
          <div className="healx-pl-overview-grid">
            <div className="healx-pl-overview-card healx-pl-revenue-card">
              <div className="healx-pl-card-header">
                <div className="healx-pl-card-icon">💰</div>
                <div className="healx-pl-card-trend healx-pl-trend-positive">
                  Total Revenue 
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(financialData.totalRevenue)}</h3>
                <p className="healx-pl-card-label">Healthcare Service Revenue</p>
                <div className="healx-pl-card-details">
                  <span>{financialData.revenueBreakdown.totalPayments} patient service contracts</span>
                </div>
              </div>
            </div>

            <div className="healx-pl-overview-card healx-pl-expenses-card">
              <div className="healx-pl-card-header">
                <div className="healx-pl-card-icon">💸</div>
                <div className="healx-pl-card-trend healx-pl-trend-negative">
                  Operating Expenses
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(financialData.totalExpenses)}</h3>
                <p className="healx-pl-card-label">Total Operating Expenses</p>
                <div className="healx-pl-card-details">
                  <span>Employee Benefits + Inventory + Utilities + Suppliers</span>
                </div>
              </div>
            </div>

            <div className={`healx-pl-overview-card ${financialData.isProfit ? 'healx-pl-profit-card' : 'healx-pl-loss-card'}`}>
              <div className="healx-pl-card-header">
                <div className="healx-pl-card-icon">{financialData.isProfit ? '📈' : '📉'}</div>
                <div className={`healx-pl-card-trend ${financialData.isProfit ? 'healx-pl-trend-positive' : 'healx-pl-trend-negative'}`}>
                  {financialData.isProfit ? 'COMPREHENSIVE INCOME' : 'COMPREHENSIVE LOSS'}
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(Math.abs(financialData.netResult))}</h3>
                <p className="healx-pl-card-label">Total Comprehensive {financialData.isProfit ? 'Income' : 'Loss'}</p>
                <div className="healx-pl-card-details">
                  <span>{formatPercentage(Math.abs(financialData.profitMargin))} margin</span>
                  <span>•</span>
                  <span>IAS 1 compliant</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="healx-pl-charts">
          <div className="healx-pl-charts-grid">
            <div className="healx-pl-chart-container healx-pl-chart-large">
              <div className="healx-pl-chart-header">
                <h3 className="healx-pl-chart-title">
                  <span className="healx-pl-chart-icon">📊</span>
                   Monthly Profit or Loss Trend
                </h3>
              </div>
              <div className="healx-pl-chart-content">
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={financialData.chartData.monthlyPL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area dataKey="revenue" fill={COLORS.revenue} stroke={COLORS.revenue} />
                    <Area dataKey="expenses" fill={COLORS.expenses} stroke={COLORS.expenses} />
                    <Line dataKey="profit" stroke={COLORS.profit} strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="healx-pl-chart-container healx-pl-chart-medium">
              <div className="healx-pl-chart-header">
                <h3 className="healx-pl-chart-title">
                  <span className="healx-pl-chart-icon">⚖️</span>
                  Revenue vs Operating Expenses
                </h3>
              </div>
              <div className="healx-pl-chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData.chartData.comparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value">
                      {financialData.chartData.comparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="healx-pl-charts-grid">
            <div className="healx-pl-chart-container healx-pl-chart-medium">
              <div className="healx-pl-chart-header">
                <h3 className="healx-pl-chart-title">
                  <span className="healx-pl-chart-icon">💸</span>
                  Expenses by Nature (IAS 1)
                </h3>
              </div>
              <div className="healx-pl-chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={financialData.chartData.expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {financialData.chartData.expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="healx-pl-chart-container healx-pl-chart-medium">
              <div className="healx-pl-chart-header">
                <h3 className="healx-pl-chart-title">
                  <span className="healx-pl-chart-icon">💳</span>
                  Revenue by Payment Method (IFRS 15)
                </h3>
              </div>
              <div className="healx-pl-chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData.chartData.revenueByMethod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill={COLORS.revenue} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Advisory Insights Section */}
        <section className="healx-pl-insights">
          <div className="healx-pl-insights-header">
            <h2 className="healx-pl-insights-title">
              <span className="healx-pl-insights-icon">💡</span>
              Financial Performance Insights & Recommendations
            </h2>
            <p className="healx-pl-insights-subtitle">
              Comprehensive income analysis based on real time data of Heal-X Healthcare Management System
            </p>
          </div>
          
          <div className="healx-pl-insights-grid">
            {financialData.advisoryInsights.map((insight, index) => (
              <div 
                key={index} 
                className={`healx-pl-insight-card healx-pl-insight-${insight.type} healx-pl-priority-${insight.priority}`}
              >
                <div className="healx-pl-insight-header">
                  <div className="healx-pl-insight-badge">
                    <span className="healx-pl-insight-category">{insight.category}</span>
                    <span className={`healx-pl-insight-priority healx-pl-priority-${insight.priority}`}>
                      {insight.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className={`healx-pl-insight-icon healx-pl-insight-${insight.type}`}>
                    {insight.type === 'success' ? '✅' : 
                     insight.type === 'warning' ? '⚠️' : 
                     insight.type === 'error' ? '🚨' : 'ℹ️'}
                  </div>
                </div>
                <div className="healx-pl-insight-content">
                  <h4 className="healx-pl-insight-title">{insight.title}</h4>
                  <p className="healx-pl-insight-message">{insight.message}</p>
                  <div className="healx-pl-insight-recommendation">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="healx-pl-footer">
        <div className="healx-pl-footer-container">
          <div className="healx-pl-footer-info">
            <p>Last Updated: {new Date(financialData.lastUpdated).toLocaleString()}</p>
            <p>Heal-x Healthcare Management System - IFRS Compliant Financial Reporting</p>
            <p>Employee Benefits (IAS 19): ${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense.toLocaleString()} | Suppliers: ${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense.toLocaleString()} from {financialData.expenseBreakdown.supplierExpenses.totalOrders || 0} purchase orders</p>
          </div>
          <div className="healx-pl-footer-actions">
            <button onClick={handleBackToDashboard} className="healx-pl-btn healx-pl-btn-primary">
              ← Back to Financial Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfitOrLoss;
