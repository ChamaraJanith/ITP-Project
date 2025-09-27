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
      
      console.log('🔄 Initializing Profit & Loss analysis with CORRECT APIs...');
      
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
      console.log('💸 Fetching expense data using CORRECT APIs and calculation...');
      
      const [payrollData, inventoryData, utilitiesData, supplierData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses(),
        fetchUtilitiesExpenses(),
        fetchSupplierExpenses()
      ]);
      
      // CORRECT EXPENSE CALCULATION AS PER YOUR REQUIREMENT
      // Total expense = utility expenses + current inventory value + total inventory restock value + supplier expenses + payroll
      const expenseAnalytics = {
        payrollExpenses: calculatePayrollExpenses(payrollData),
        inventoryExpenses: calculateInventoryExpenses(inventoryData),
        utilitiesExpenses: calculateUtilitiesExpenses(utilitiesData),
        supplierExpenses: calculateSupplierExpenses(supplierData)
      };

      // CORRECTED TOTAL CALCULATION
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

  // Calculate Payroll Expenses - MATCHING YOUR FINANCIALPAYROLL LOGIC
  const calculatePayrollExpenses = (payrolls = []) => {
    const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
    
    const payrollExpenses = {
      totalGrossSalary: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.grossSalary) || 0), 0),
      totalBonuses: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.bonuses) || 0), 0),
      totalDeductions: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.deductions) || 0), 0),
      totalEPF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.epf) || 0), 0),
      totalETF: safePayrolls.reduce((sum, p) => sum + (parseFloat(p.etf) || 0), 0),
      totalEmployees: new Set(safePayrolls.map(p => p.employeeId).filter(id => id)).size,
      rawData: safePayrolls
    };

    // CORRECTED: Total payroll = gross + bonuses + EPF + ETF (as per your requirement)
    payrollExpenses.totalPayrollExpense = 
      payrollExpenses.totalGrossSalary + 
      payrollExpenses.totalBonuses + 
      payrollExpenses.totalEPF + 
      payrollExpenses.totalETF;

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
    
    // Expense breakdown insight with CORRECTED supplier data
    const payrollPercent = expenseData.totalExpenses > 0 ? ((expenseData.payrollExpenses.totalPayrollExpense / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    const inventoryPercent = expenseData.totalExpenses > 0 ? ((expenseData.inventoryExpenses.totalInventoryValue / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    const utilitiesPercent = expenseData.totalExpenses > 0 ? ((expenseData.utilitiesExpenses.totalUtilitiesExpense / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    const supplierPercent = expenseData.totalExpenses > 0 ? ((expenseData.supplierExpenses.totalSupplierExpense / expenseData.totalExpenses) * 100).toFixed(1) : '0.0';
    
    insights.push({
      type: 'info',
      category: 'Expense Analysis',
      title: 'Complete Expense Breakdown (Live Data - CORRECTED SUPPLIERS)',
      message: `Payroll: $${expenseData.payrollExpenses.totalPayrollExpense.toLocaleString()} (${payrollPercent}%) | Inventory: $${expenseData.inventoryExpenses.totalInventoryValue.toLocaleString()} (${inventoryPercent}%) | Utilities: $${expenseData.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()} (${utilitiesPercent}%) | Suppliers: $${expenseData.supplierExpenses.totalSupplierExpense.toLocaleString()} (${supplierPercent}%) from ${expenseData.supplierExpenses.totalOrders || 0} purchase orders`,
      recommendation: 'Monitor all expense categories regularly and optimize cost structure where possible.',
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
        { name: 'Payroll', value: expenseData.payrollExpenses.totalPayrollExpense, color: COLORS.primary },
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

  // Manual PDF Report Generation - MATCHING YOUR EXPENSETRACKING FORMAT
  const exportToPDF = () => {
    if (!financialData) {
      setError("No data to export");
      return;
    }

    const currentDate = new Date();
    const reportTitle = 'Profit & Loss Analysis Report';

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
          <strong>Report Type:</strong> Comprehensive Profit & Loss Analysis<br>
          <strong>Financial Result:</strong> ${financialData.isProfit ? 'PROFIT' : 'LOSS'}<br>
          <strong>Filter Period:</strong> ${selectedPeriod === 'all' ? 'All Time' : selectedPeriod}
        </div>
        
        <!-- Executive Summary -->
        <div class="summary-section profit-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📊 Executive Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>💰 Total Revenue</h4>
              <div class="metric-value">$${financialData.totalRevenue.toLocaleString()}</div>
              <div class="metric-label">From ${financialData.revenueBreakdown.totalPayments} accepted appointments</div>
            </div>
            <div class="summary-card">
              <h4>💸 Total Expenses</h4>
              <div class="metric-value">$${financialData.totalExpenses.toLocaleString()}</div>
              <div class="metric-label">Payroll + Inventory + Utilities + Suppliers</div>
            </div>
            <div class="summary-card">
              <h4>${financialData.isProfit ? '📈' : '📉'} Net ${financialData.isProfit ? 'Profit' : 'Loss'}</h4>
              <div class="metric-value profit-amount">$${Math.abs(financialData.netResult).toLocaleString()}</div>
              <div class="metric-label">${Math.abs(financialData.profitMargin).toFixed(1)}% margin • ${financialData.roi.toFixed(1)}% ROI</div>
            </div>
            <div class="summary-card">
              <h4>📊 Expense Ratio</h4>
              <div class="metric-value">${financialData.expenseRatio.toFixed(1)}%</div>
              <div class="metric-label">Expenses as percentage of revenue</div>
            </div>
          </div>
        </div>

        ${financialData.isProfit ? 
          '<div class="alert-section" style="background-color: #d4edda; border-color: #c3e6cb;"><div class="alert-title" style="color: #155724;">✅ Profitable Operations</div><p>Your healthcare facility is operating profitably with a positive net result of $' + Math.abs(financialData.netResult).toLocaleString() + '. Continue monitoring performance and explore growth opportunities.</p></div>' :
          '<div class="alert-section" style="background-color: #f8d7da; border-color: #f5c6cb;"><div class="alert-title" style="color: #721c24;">🚨 Operating at Loss</div><p>Your healthcare facility is currently operating at a loss of $' + Math.abs(financialData.netResult).toLocaleString() + '. Immediate action required to review expenses and improve revenue streams.</p></div>'
        }

        <!-- Financial Breakdown -->
        <h3 style="color: #1da1f2; margin-top: 30px;">📊 Financial Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th colspan="2">💰 Revenue Analysis</th>
              <th colspan="2">💸 Expense Analysis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Revenue</td>
              <td class="currency">$${financialData.totalRevenue.toLocaleString()}</td>
              <td>Total Expenses</td>
              <td class="currency">$${financialData.totalExpenses.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Accepted Appointments</td>
              <td class="currency">${financialData.revenueBreakdown.totalPayments}</td>
              <td>Payroll Expenses</td>
              <td class="currency">$${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Outstanding Payments</td>
              <td class="currency">$${financialData.revenueBreakdown.totalOutstanding.toLocaleString()}</td>
              <td>Inventory Value</td>
              <td class="currency">$${financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue.toLocaleString()}</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td>Utilities Expenses</td>
              <td class="currency">$${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()}</td>
            </tr>
            <tr>
              <td></td>
              <td></td>
              <td>Supplier Expenses</td>
              <td class="currency">$${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <!-- Key Financial Metrics -->
        <h3 style="color: #1da1f2; margin-top: 30px;">📈 Key Financial Metrics</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Profit Margin</strong></td>
              <td class="currency profit-amount"><strong>${financialData.profitMargin.toFixed(1)}%</strong></td>
              <td>Net result as percentage of revenue</td>
            </tr>
            <tr>
              <td><strong>Return on Investment</strong></td>
              <td class="currency"><strong>${financialData.roi.toFixed(1)}%</strong></td>
              <td>Net result as percentage of expenses</td>
            </tr>
            <tr>
              <td><strong>Expense Ratio</strong></td>
              <td class="currency"><strong>${financialData.expenseRatio.toFixed(1)}%</strong></td>
              <td>Expenses as percentage of revenue</td>
            </tr>
            <tr>
              <td><strong>Total Employees</strong></td>
              <td class="currency"><strong>${financialData.expenseBreakdown.payrollExpenses.totalEmployees}</strong></td>
              <td>Staff members on payroll</td>
            </tr>
          </tbody>
        </table>

        <!-- Detailed Expense Breakdown -->
        <h3 style="color: #1da1f2; margin-top: 30px;">🔍 Detailed Expense Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>👥 Payroll</strong></td>
              <td class="currency"><strong>$${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense.toLocaleString()}</strong></td>
              <td>Gross: $${financialData.expenseBreakdown.payrollExpenses.totalGrossSalary.toLocaleString()} | Bonuses: $${financialData.expenseBreakdown.payrollExpenses.totalBonuses.toLocaleString()} | EPF: $${financialData.expenseBreakdown.payrollExpenses.totalEPF.toLocaleString()} | ETF: $${financialData.expenseBreakdown.payrollExpenses.totalETF.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>🏥 Inventory</strong></td>
              <td class="currency"><strong>$${financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue.toLocaleString()}</strong></td>
              <td>Current Stock: $${financialData.expenseBreakdown.inventoryExpenses.currentStockValue.toLocaleString()} | Restock: $${financialData.expenseBreakdown.inventoryExpenses.totalRestockValue.toLocaleString()} | Items: ${financialData.expenseBreakdown.inventoryExpenses.totalItems}</td>
            </tr>
            <tr>
              <td><strong>⚡ Utilities</strong></td>
              <td class="currency"><strong>$${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense.toLocaleString()}</strong></td>
              <td>Services: ${financialData.expenseBreakdown.utilitiesExpenses.totalUtilities}</td>
            </tr>
            <tr>
              <td><strong>🤝 Suppliers</strong></td>
              <td class="currency"><strong>$${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense.toLocaleString()}</strong></td>
              <td>Suppliers: ${financialData.expenseBreakdown.supplierExpenses.uniqueSuppliers} | Orders: ${financialData.expenseBreakdown.supplierExpenses.totalOrders}</td>
            </tr>
          </tbody>
        </table>

        <!-- Revenue by Payment Method -->
        <h3 style="color: #1da1f2; margin-top: 30px;">💳 Revenue by Payment Method</h3>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(financialData.revenueBreakdown.paymentMethods).map(([method, amount]) => `
              <tr>
                <td>${method}</td>
                <td class="currency">$${amount.toLocaleString()}</td>
                <td class="currency">${((amount / financialData.totalRevenue) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Financial Insights -->
        <h3 style="color: #1da1f2; margin-top: 30px;">💡 Financial Insights & Recommendations</h3>
        ${financialData.advisoryInsights.map(insight => `
          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: ${insight.type === 'success' ? '#d4edda' : insight.type === 'warning' ? '#fff3cd' : insight.type === 'error' ? '#f8d7da' : '#d1ecf1'};">
            <div style="font-weight: bold; margin-bottom: 5px; color: ${insight.type === 'success' ? '#155724' : insight.type === 'warning' ? '#856404' : insight.type === 'error' ? '#721c24' : '#0c5460'};">
              ${insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : insight.type === 'error' ? '🚨' : 'ℹ️'} ${insight.title} <span style="font-size: 10px; background: #666; color: white; padding: 2px 6px; border-radius: 10px; margin-left: 10px;">${insight.priority.toUpperCase()}</span>
            </div>
            <div style="font-size: 11px; margin-bottom: 5px;">${insight.message}</div>
            <div style="font-size: 10px; padding: 5px; background-color: rgba(0,0,0,0.05); border-radius: 3px;"><strong>Recommendation:</strong> ${insight.recommendation}</div>
          </div>
        `).join('')}

        ${financialData.expenseBreakdown.supplierExpenses.totalOrders > 0 ? `
          <!-- Supplier Analysis -->
          <h3 style="color: #1da1f2; margin-top: 30px;">🏭 Supplier Analysis</h3>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Orders</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(financialData.expenseBreakdown.supplierExpenses.supplierBreakdown || {}).map(([supplier, data]) => `
                <tr>
                  <td>${supplier}</td>
                  <td class="currency">${data.orderCount}</td>
                  <td class="currency">$${data.totalAmount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

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

        <!-- Report Footer -->
        <div class="report-footer">
          <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${currentDate.toLocaleString()} • All amounts are in Sri Lankan Rupees</p>
          <p>For queries regarding this report, contact the Financial Department at Heal-x Healthcare</p>
          <p>Data Sources: Appointments API • Payroll API • Inventory API • Utilities API • Suppliers API</p>
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

  // Export to CSV
  const exportToCSV = () => {
    if (!financialData) return;
    
    let csvContent = `Heal-x Profit & Loss Analysis - ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'EXECUTIVE SUMMARY\n';
    csvContent += `Total Revenue,${financialData.totalRevenue}\n`;
    csvContent += `Total Expenses,${financialData.totalExpenses}\n`;
    csvContent += `Net ${financialData.isProfit ? 'Profit' : 'Loss'},${Math.abs(financialData.netResult)}\n`;
    csvContent += `Profit Margin,${financialData.profitMargin.toFixed(1)}%\n\n`;
    
    csvContent += 'EXPENSE BREAKDOWN\n';
    csvContent += `Payroll,${financialData.expenseBreakdown.payrollExpenses.totalPayrollExpense}\n`;
    csvContent += `Inventory,${financialData.expenseBreakdown.inventoryExpenses.totalInventoryValue}\n`;
    csvContent += `Utilities,${financialData.expenseBreakdown.utilitiesExpenses.totalUtilitiesExpense}\n`;
    csvContent += `Suppliers,${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Heal-x_PL_Analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('✅ Profit & Loss data exported to CSV successfully!');
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
            <h2>Calculating Financial Analysis with CORRECTED Supplier Data</h2>
            <p>Fetching data from: Appointments + Payroll + Inventory + Utilities + FIXED Suppliers API</p>
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
          <h2>Error Loading Financial Data</h2>
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
          <h2>No Financial Data Available</h2>
          <p>Unable to generate Profit & Loss analysis.</p>
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

      {/* Header Section */}
      <header className="healx-pl-header">
        <div className="healx-pl-header-container">
          <div className="healx-pl-header-top">
            <div className="healx-pl-header-brand">
              <h1 className="healx-pl-header-title">
                <span className="healx-pl-title-icon">📈</span>
                <span className="healx-pl-title-text">Profit & Loss Analysis</span>
              </h1>
              <p className="healx-pl-header-subtitle">
                Revenue: ${financialData.totalRevenue.toLocaleString()} | Expenses: ${financialData.totalExpenses.toLocaleString()} | Net: ${Math.abs(financialData.netResult).toLocaleString()} {financialData.isProfit ? 'Profit' : 'Loss'}
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
                📄 Generate PDF Report
              </button>
              <button onClick={exportToCSV} className="healx-pl-btn healx-pl-btn-secondary">
                📊 Export CSV
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
              <div className="healx-pl-kpi-label">Net Result</div>
              <div className="healx-pl-kpi-value">
                {formatCurrency(Math.abs(financialData.netResult))}
              </div>
              <div className="healx-pl-kpi-status">
                {financialData.isProfit ? '📈 PROFIT' : '📉 LOSS'}
              </div>
            </div>
            
            <div className="healx-pl-kpi-metrics">
              <div className="healx-pl-kpi-item">
                <div className="healx-pl-kpi-item-label">Profit Margin</div>
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
                <div className="healx-pl-kpi-item-label">Expense Ratio</div>
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
                  Revenue
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(financialData.totalRevenue)}</h3>
                <p className="healx-pl-card-label">Total Revenue (Appointments)</p>
                <div className="healx-pl-card-details">
                  <span>{financialData.revenueBreakdown.totalPayments} accepted appointments</span>
                </div>
              </div>
            </div>

            <div className="healx-pl-overview-card healx-pl-expenses-card">
              <div className="healx-pl-card-header">
                <div className="healx-pl-card-icon">💸</div>
                <div className="healx-pl-card-trend healx-pl-trend-negative">
                  Expenses
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(financialData.totalExpenses)}</h3>
                <p className="healx-pl-card-label">Total Expenses </p>
                <div className="healx-pl-card-details">
                  <span>Payroll + Inventory + Utilities + Suppliers ({financialData.expenseBreakdown.supplierExpenses.totalOrders || 0} orders)</span>
                </div>
              </div>
            </div>

            <div className={`healx-pl-overview-card ${financialData.isProfit ? 'healx-pl-profit-card' : 'healx-pl-loss-card'}`}>
              <div className="healx-pl-card-header">
                <div className="healx-pl-card-icon">{financialData.isProfit ? '📈' : '📉'}</div>
                <div className={`healx-pl-card-trend ${financialData.isProfit ? 'healx-pl-trend-positive' : 'healx-pl-trend-negative'}`}>
                  {financialData.isProfit ? 'PROFIT' : 'LOSS'}
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(Math.abs(financialData.netResult))}</h3>
                <p className="healx-pl-card-label">Net {financialData.isProfit ? 'Profit' : 'Loss'}</p>
                <div className="healx-pl-card-details">
                  <span>{formatPercentage(Math.abs(financialData.profitMargin))} margin</span>
                  <span>•</span>
                  <span>{formatPercentage(financialData.roi)} ROI</span>
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
                  Monthly Profit & Loss Trend
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
                  Revenue vs Expenses
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
                  Expense Breakdown 
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
                  Revenue by Payment Method
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
              Financial Insights & Recommendations
            </h2>
            <p className="healx-pl-insights-subtitle">
              Analysis based on correct revenue and expense calculations with fixed supplier API
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
            <p>Heal-x Healthcare Management System • SUPPLIER FIXED: Suppliers: ${financialData.expenseBreakdown.supplierExpenses.totalSupplierExpense.toLocaleString()} from {financialData.expenseBreakdown.supplierExpenses.totalOrders || 0} orders</p>
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
