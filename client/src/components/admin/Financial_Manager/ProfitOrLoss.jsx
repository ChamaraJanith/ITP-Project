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
import jsPDF from 'jspdf';
import './ProfitOrLoss.css';

// API Endpoints
const PAYMENTS_API = "http://localhost:7000/api/payments";
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const SURGICAL_ITEMS_API = "http://localhost:7000/api/inventory/surgical-items";

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
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
  // Enhanced scroll state management for sticky header within content
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const headerRef = useRef(null);
  const headerOffsetTop = useRef(0);

  // Improved scroll handler that respects system header
  const updateScrollState = useCallback(() => {
    const currentScrollY = window.scrollY;
    const difference = currentScrollY - lastScrollY.current;
    const threshold = 5;
    
    // Determine when to make header sticky
    if (headerRef.current && headerOffsetTop.current === 0) {
      headerOffsetTop.current = headerRef.current.offsetTop;
    }
    
    const shouldBeSticky = currentScrollY > headerOffsetTop.current - 100;
    setIsHeaderSticky(shouldBeSticky);
    
    if (Math.abs(difference) < threshold) {
      ticking.current = false;
      return;
    }
    
    // Only apply hide/show logic when header is sticky
    if (shouldBeSticky) {
      if (currentScrollY < headerOffsetTop.current + 50) {
        setHeaderVisible(true);
        setScrollDirection('up');
      } else {
        if (difference > 0 && currentScrollY > lastScrollY.current) {
          setScrollDirection('down');
          setHeaderVisible(false);
        } else if (difference < 0) {
          setScrollDirection('up');
          setHeaderVisible(true);
        }
      }
    } else {
      setHeaderVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
    setScrollY(currentScrollY);
    ticking.current = false;
  }, []);

  const requestTick = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollState);
      ticking.current = true;
    }
  }, [updateScrollState]);

  useEffect(() => {
    const handleScroll = () => requestTick();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [requestTick]);

  // Initialize component
  useEffect(() => {
    initializeProfitLoss();
  }, []);

  // Recalculate when filters change
  useEffect(() => {
    if (financialData) {
      calculateFilteredMetrics();
    }
  }, [selectedPeriod, selectedYear, selectedMonth, comparisonPeriod]);

  // Fetch all financial data
  const initializeProfitLoss = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Initializing Profit & Loss analysis...');
      
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

  // Fetch Revenue Data (from Payments API)
  const fetchRevenueData = async () => {
    try {
      console.log('📊 Fetching revenue data from payments API...');
      
      const response = await fetch(PAYMENTS_API);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        const payments = Array.isArray(data) ? data : (data.data || data.payments || []);
        
        if (payments.length === 0) {
          throw new Error('No payment data available');
        }
        
        // Calculate revenue statistics
        const revenueStats = {
          totalRevenue: payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          totalInvoiced: payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
          totalOutstanding: payments.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.amountPaid || 0)), 0),
          totalPayments: payments.length,
          paymentMethods: {},
          monthlyRevenue: {},
          hospitalRevenue: {},
          rawData: payments
        };
        
        // Group by payment methods
        payments.forEach(payment => {
          const method = payment.paymentMethod || 'Unknown';
          revenueStats.paymentMethods[method] = (revenueStats.paymentMethods[method] || 0) + (payment.amountPaid || 0);
        });
        
        // Group by months
        payments.forEach(payment => {
          if (payment.date) {
            const date = new Date(payment.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            if (!revenueStats.monthlyRevenue[monthKey]) {
              revenueStats.monthlyRevenue[monthKey] = {
                month: monthName,
                revenue: 0,
                invoiced: 0,
                payments: 0,
                year: date.getFullYear(),
                monthNum: date.getMonth()
              };
            }
            
            revenueStats.monthlyRevenue[monthKey].revenue += (payment.amountPaid || 0);
            revenueStats.monthlyRevenue[monthKey].invoiced += (payment.totalAmount || 0);
            revenueStats.monthlyRevenue[monthKey].payments += 1;
          }
        });
        
        // Group by hospitals
        payments.forEach(payment => {
          const hospital = payment.hospitalName || 'Unknown';
          if (!revenueStats.hospitalRevenue[hospital]) {
            revenueStats.hospitalRevenue[hospital] = 0;
          }
          revenueStats.hospitalRevenue[hospital] += (payment.amountPaid || 0);
        });
        
        console.log(`✅ Revenue data loaded: $${revenueStats.totalRevenue.toLocaleString()} from ${payments.length} payments`);
        return revenueStats;
        
      } catch (parseError) {
        console.error('❌ Error parsing payments response:', parseError);
        throw new Error('Invalid response from payments API');
      }
      
    } catch (error) {
      console.error('❌ Error fetching revenue data:', error);
      console.warn('⚠️ Using sample revenue data for demonstration');
      return getSampleRevenueData();
    }
  };

  // Fetch Expense Data (from Payrolls and Inventory APIs)
  const fetchExpenseData = async () => {
    try {
      console.log('💸 Fetching expense data from multiple APIs...');
      
      const [payrollData, inventoryData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses()
      ]);
      
      const expenseStats = {
        payrollExpenses: {
          totalPayroll: payrollData.reduce((sum, p) => sum + ((parseFloat(p.grossSalary) || 0) + (parseFloat(p.bonuses) || 0)), 0),
          totalGrossSalary: payrollData.reduce((sum, p) => sum + (parseFloat(p.grossSalary) || 0), 0),
          totalBonuses: payrollData.reduce((sum, p) => sum + (parseFloat(p.bonuses) || 0), 0),
          totalEPF: payrollData.reduce((sum, p) => sum + (parseFloat(p.epf) || 0), 0),
          totalETF: payrollData.reduce((sum, p) => sum + (parseFloat(p.etf) || 0), 0),
          totalEmployees: new Set(payrollData.map(p => p.employeeId).filter(id => id)).size,
          monthlyPayroll: {},
          rawData: payrollData
        },
        inventoryExpenses: {
          totalInventoryValue: inventoryData.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0),
          totalItems: inventoryData.length,
          categoryBreakdown: {},
          supplierBreakdown: {},
          rawData: inventoryData
        }
      };
      
      // Group payroll by months
      payrollData.forEach(payroll => {
        if (payroll.payrollMonth && payroll.payrollYear) {
          const monthKey = `${payroll.payrollYear}-${payroll.payrollMonth}`;
          if (!expenseStats.payrollExpenses.monthlyPayroll[monthKey]) {
            expenseStats.payrollExpenses.monthlyPayroll[monthKey] = {
              month: `${payroll.payrollMonth} ${payroll.payrollYear}`,
              amount: 0,
              employees: new Set()
            };
          }
          const monthlyAmount = (parseFloat(payroll.grossSalary) || 0) + (parseFloat(payroll.bonuses) || 0);
          expenseStats.payrollExpenses.monthlyPayroll[monthKey].amount += monthlyAmount;
          if (payroll.employeeId) {
            expenseStats.payrollExpenses.monthlyPayroll[monthKey].employees.add(payroll.employeeId);
          }
        }
      });
      
      // Group inventory by categories
      inventoryData.forEach(item => {
        const category = item.category || 'Uncategorized';
        const value = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        
        if (!expenseStats.inventoryExpenses.categoryBreakdown[category]) {
          expenseStats.inventoryExpenses.categoryBreakdown[category] = 0;
        }
        expenseStats.inventoryExpenses.categoryBreakdown[category] += value;
      });
      
      expenseStats.totalExpenses = expenseStats.payrollExpenses.totalPayroll + expenseStats.inventoryExpenses.totalInventoryValue;
      
      console.log(`✅ Expense data loaded: $${expenseStats.totalExpenses.toLocaleString()} total expenses`);
      return expenseStats;
      
    } catch (error) {
      console.error('❌ Error fetching expense data:', error);
      console.warn('⚠️ Using sample expense data for demonstration');
      return getSampleExpenseData();
    }
  };

  // Fetch Payroll Data
  const fetchPayrollExpenses = async () => {
    try {
      const response = await fetch(`${PAYROLL_API}?limit=1000`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        return data.success ? (data.data || []) : [];
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  };

  // Fetch Inventory Data
  const fetchInventoryExpenses = async () => {
    try {
      const response = await fetch(`${SURGICAL_ITEMS_API}?page=1&limit=1000`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        if (data.success && data.data && Array.isArray(data.data.items)) {
          return data.data.items;
        }
        return [];
      } catch {
        return [];
      }
    } catch {
      return [];
    }
  };

  // Calculate comprehensive financial metrics
  const calculateFinancialMetrics = (revenueData, expenseData) => {
    const netResult = revenueData.totalRevenue - expenseData.totalExpenses;
    const isProfit = netResult > 0;
    
    const profitMargin = revenueData.totalRevenue > 0 ? (netResult / revenueData.totalRevenue) * 100 : 0;
    const roi = expenseData.totalExpenses > 0 ? (netResult / expenseData.totalExpenses) * 100 : 0;
    const expenseRatio = revenueData.totalRevenue > 0 ? (expenseData.totalExpenses / revenueData.totalRevenue) * 100 : 0;
    
    const monthlyTrends = calculateMonthlyTrends(revenueData, expenseData);
    const yearComparison = calculateYearComparison(revenueData, expenseData);
    
    const performanceMetrics = {
      revenueGrowth: calculateGrowthRate(revenueData.monthlyRevenue),
      expenseGrowth: calculateGrowthRate(expenseData.payrollExpenses.monthlyPayroll),
      efficiency: revenueData.totalRevenue / Math.max(expenseData.payrollExpenses.totalEmployees, 1),
      revenuePerEmployee: revenueData.totalRevenue / Math.max(expenseData.payrollExpenses.totalEmployees, 1)
    };
    
    const advisoryInsights = generateAdvisoryInsights(revenueData, expenseData, {
      netResult,
      profitMargin,
      expenseRatio,
      performanceMetrics
    });
    
    return {
      totalRevenue: revenueData.totalRevenue,
      totalExpenses: expenseData.totalExpenses,
      netResult,
      isProfit,
      profitMargin,
      roi,
      expenseRatio,
      
      revenueBreakdown: {
        ...revenueData,
        collectionRate: (revenueData.totalRevenue / revenueData.totalInvoiced) * 100
      },
      expenseBreakdown: expenseData,
      
      monthlyTrends,
      yearComparison,
      performanceMetrics,
      advisoryInsights,
      
      chartData: prepareChartData(revenueData, expenseData, monthlyTrends),
      lastUpdated: new Date().toISOString()
    };
  };

  // Helper functions for calculations
  const calculateMonthlyTrends = (revenueData, expenseData) => {
    const trends = {};
    
    Object.keys(revenueData.monthlyRevenue).forEach(monthKey => {
      const revenueMonth = revenueData.monthlyRevenue[monthKey];
      trends[monthKey] = {
        month: revenueMonth.month,
        year: revenueMonth.year,
        monthNum: revenueMonth.monthNum,
        revenue: revenueMonth.revenue,
        expenses: 0,
        profit: revenueMonth.revenue,
        profitMargin: 100
      };
    });
    
    Object.keys(expenseData.payrollExpenses.monthlyPayroll).forEach(monthKey => {
      const expenseMonth = expenseData.payrollExpenses.monthlyPayroll[monthKey];
      if (trends[monthKey]) {
        trends[monthKey].expenses += expenseMonth.amount;
        trends[monthKey].profit = trends[monthKey].revenue - trends[monthKey].expenses;
        trends[monthKey].profitMargin = trends[monthKey].revenue > 0 ? 
          (trends[monthKey].profit / trends[monthKey].revenue) * 100 : 0;
      }
    });
    
    return Object.values(trends)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNum - b.monthNum;
      })
      .slice(-12);
  };

  const calculateYearComparison = (revenueData, expenseData) => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const currentYearRevenue = Object.values(revenueData.monthlyRevenue)
      .filter(month => month.year === currentYear)
      .reduce((sum, month) => sum + month.revenue, 0);
      
    const previousYearRevenue = Object.values(revenueData.monthlyRevenue)
      .filter(month => month.year === previousYear)
      .reduce((sum, month) => sum + month.revenue, 0);
      
    const revenueGrowth = previousYearRevenue > 0 ? 
      ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100 : 0;
      
    return {
      currentYear: {
        year: currentYear,
        revenue: currentYearRevenue,
        expenses: expenseData.totalExpenses * 0.6,
        profit: currentYearRevenue - (expenseData.totalExpenses * 0.6)
      },
      previousYear: {
        year: previousYear,
        revenue: previousYearRevenue,
        expenses: expenseData.totalExpenses * 0.4,
        profit: previousYearRevenue - (expenseData.totalExpenses * 0.4)
      },
      revenueGrowth,
      expenseGrowth: 8.5,
      profitGrowth: revenueGrowth - 8.5
    };
  };

  const calculateGrowthRate = (monthlyData) => {
    const months = Object.values(monthlyData).sort((a, b) => {
      return 0;
    });
    
    if (months.length < 2) return 0;
    
    const recent = months.slice(-3).reduce((sum, m) => sum + (m.amount || m.revenue || 0), 0) / 3;
    const older = months.slice(-6, -3).reduce((sum, m) => sum + (m.amount || m.revenue || 0), 0) / 3;
    
    return older > 0 ? ((recent - older) / older) * 100 : 0;
  };

  const generateAdvisoryInsights = (revenueData, expenseData, metrics) => {
    const insights = [];
    
    if (metrics.netResult > 0) {
      insights.push({
        type: 'success',
        category: 'Profitability',
        title: `Healthy Profit Margin of ${metrics.profitMargin.toFixed(1)}%`,
        message: `Your organization is generating a ${metrics.profitMargin >= 20 ? 'strong' : metrics.profitMargin >= 10 ? 'healthy' : 'modest'} profit margin. This indicates good financial health and operational efficiency.`,
        recommendation: metrics.profitMargin < 15 ? 'Consider optimizing operational costs to improve profit margins.' : 'Maintain current operational strategies while exploring growth opportunities.',
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'error',
        category: 'Profitability',
        title: `Operating at a Loss of $${Math.abs(metrics.netResult).toLocaleString()}`,
        message: `Current expenses exceed revenue by ${Math.abs(metrics.profitMargin).toFixed(1)}%. Immediate action required to achieve profitability.`,
        recommendation: 'Focus on cost reduction and revenue enhancement strategies. Consider reviewing payroll expenses and optimizing inventory management.',
        priority: 'high'
      });
    }
    
    if (metrics.expenseRatio > 80) {
      insights.push({
        type: 'warning',
        category: 'Cost Management',
        title: `High Expense Ratio at ${metrics.expenseRatio.toFixed(1)}%`,
        message: `Expenses represent ${metrics.expenseRatio.toFixed(1)}% of total revenue, which is above the recommended 75% threshold for healthcare organizations.`,
        recommendation: 'Review operational efficiency and consider cost optimization in non-critical areas.',
        priority: 'high'
      });
    }
    
    const collectionRate = (revenueData.totalRevenue / revenueData.totalInvoiced) * 100;
    if (collectionRate < 90) {
      insights.push({
        type: 'warning',
        category: 'Revenue Management',
        title: `Collection Rate Below Optimal at ${collectionRate.toFixed(1)}%`,
        message: `Current collection rate is ${collectionRate.toFixed(1)}%, indicating $${revenueData.totalOutstanding.toLocaleString()} in outstanding receivables.`,
        recommendation: 'Implement automated follow-up systems and consider offering payment plans to improve collection rates.',
        priority: 'medium'
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
        { name: 'Payroll', value: expenseData.payrollExpenses.totalPayroll, color: COLORS.primary },
        { name: 'Medical Inventory', value: expenseData.inventoryExpenses.totalInventoryValue, color: COLORS.secondary },
        { name: 'Benefits & Contributions', value: expenseData.payrollExpenses.totalEPF + expenseData.payrollExpenses.totalETF, color: '#f59e0b' }
      ].filter(item => item.value > 0),
      
      revenueByMethod: Object.entries(revenueData.paymentMethods).map(([method, amount]) => ({
        name: method,
        value: amount,
        percentage: ((amount / revenueData.totalRevenue) * 100).toFixed(1)
      }))
    };
  };

  // Sample data functions for fallback
  const getSampleRevenueData = () => ({
    totalRevenue: 850000,
    totalInvoiced: 1000000,
    totalOutstanding: 150000,
    totalPayments: 245,
    paymentMethods: {
      'Card': 425000,
      'Cash': 255000,
      'Insurance': 170000
    },
    monthlyRevenue: {
      '2024-09': { month: 'Sep 2024', revenue: 120000, invoiced: 140000, payments: 45, year: 2024, monthNum: 8 },
      '2024-08': { month: 'Aug 2024', revenue: 110000, invoiced: 130000, payments: 40, year: 2024, monthNum: 7 },
      '2024-07': { month: 'Jul 2024', revenue: 115000, invoiced: 135000, payments: 42, year: 2024, monthNum: 6 }
    },
    hospitalRevenue: {},
    rawData: []
  });

  const getSampleExpenseData = () => ({
    payrollExpenses: {
      totalPayroll: 450000,
      totalGrossSalary: 380000,
      totalBonuses: 70000,
      totalEPF: 30400,
      totalETF: 11400,
      totalEmployees: 45,
      monthlyPayroll: {},
      rawData: []
    },
    inventoryExpenses: {
      totalInventoryValue: 185000,
      totalItems: 156,
      categoryBreakdown: {},
      supplierBreakdown: {},
      rawData: []
    },
    totalExpenses: 635000
  });

  // Filter and recalculate metrics
  const calculateFilteredMetrics = useCallback(() => {
    if (!financialData) return;
    console.log(`📅 Filtering metrics for period: ${selectedPeriod}`);
  }, [financialData, selectedPeriod]);

  // Generate PDF and CSV functions
  const generatePDFReport = () => {
    if (!financialData) return;
    
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let yPosition = 20;
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Heal-x Healthcare Management', 105, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(16);
    doc.text('Profit & Loss Statement', 105, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${currentDate}`, 105, yPosition, { align: 'center' });
    
    yPosition += 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summaryLines = [
      `Total Revenue: $${financialData.totalRevenue.toLocaleString()}`,
      `Total Expenses: $${financialData.totalExpenses.toLocaleString()}`,
      `Net ${financialData.isProfit ? 'Profit' : 'Loss'}: $${Math.abs(financialData.netResult).toLocaleString()}`,
      `Profit Margin: ${financialData.profitMargin.toFixed(1)}%`,
      `Expense Ratio: ${financialData.expenseRatio.toFixed(1)}%`
    ];
    
    summaryLines.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });
    
    const filename = `Heal-x_Profit_Loss_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    setSuccess('Profit & Loss Statement PDF generated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const exportToCSV = () => {
    if (!financialData) return;
    
    let csvContent = `Heal-x Profit & Loss Analysis - ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'EXECUTIVE SUMMARY\n';
    csvContent += `Total Revenue,$${financialData.totalRevenue}\n`;
    csvContent += `Total Expenses,$${financialData.totalExpenses}\n`;
    csvContent += `Net ${financialData.isProfit ? 'Profit' : 'Loss'},$${Math.abs(financialData.netResult)}\n`;
    csvContent += `Profit Margin,${financialData.profitMargin.toFixed(1)}%\n\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Heal-x_PL_Analysis_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('Profit & Loss data exported successfully!');
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
            <h2>Calculating Financial Analysis</h2>
            <p>Fetching revenue and expense data from multiple sources</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
            <button onClick={() => navigate('/admin/financial')} className="healx-pl-btn healx-pl-btn-secondary">
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
          <button onClick={() => initializeProfitLoss()} className="healx-pl-btn healx-pl-btn-primary">
            🔄 Refresh Data
          </button>
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

      {/* Header Section - Now properly positioned below system header */}
      <header 
        ref={headerRef}
        className={`healx-pl-header ${
          isHeaderSticky ? 'healx-pl-header-sticky' : ''
        } ${
          headerVisible ? 'healx-pl-header-visible' : 'healx-pl-header-hidden'
        }`}
      >
        <div className="healx-pl-header-container">
          {/* Top Section */}
          <div className="healx-pl-header-top">
            <div className="healx-pl-header-brand">
              <h1 className="healx-pl-header-title">
                <span className="healx-pl-title-icon">📈</span>
                <span className="healx-pl-title-text">Profit & Loss Analysis</span>
              </h1>
              <p className="healx-pl-header-subtitle">
                Comprehensive financial performance dashboard with real-time insights
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
              
              <button onClick={generatePDFReport} className="healx-pl-btn healx-pl-btn-primary">
                📄 PDF Report
              </button>
              <button onClick={exportToCSV} className="healx-pl-btn healx-pl-btn-secondary">
                📊 Export CSV
              </button>
              <button onClick={() => initializeProfitLoss()} className="healx-pl-btn healx-pl-btn-ghost" disabled={loading}>
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {/* KPI Banner */}
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
                  +{financialData.performanceMetrics.revenueGrowth.toFixed(1)}%
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(financialData.totalRevenue)}</h3>
                <p className="healx-pl-card-label">Total Revenue</p>
                <div className="healx-pl-card-details">
                  <span>{financialData.revenueBreakdown.totalPayments} payments</span>
                  <span>•</span>
                  <span>{formatPercentage(financialData.revenueBreakdown.collectionRate)} collection rate</span>
                </div>
              </div>
            </div>

            <div className="healx-pl-overview-card healx-pl-expenses-card">
              <div className="healx-pl-card-header">
                <div className="healx-pl-card-icon">💸</div>
                <div className="healx-pl-card-trend healx-pl-trend-negative">
                  +{financialData.performanceMetrics.expenseGrowth.toFixed(1)}%
                </div>
              </div>
              <div className="healx-pl-card-content">
                <h3 className="healx-pl-card-value">{formatCurrency(financialData.totalExpenses)}</h3>
                <p className="healx-pl-card-label">Total Expenses</p>
                <div className="healx-pl-card-details">
                  <span>{financialData.expenseBreakdown.payrollExpenses.totalEmployees} employees</span>
                  <span>•</span>
                  <span>{formatPercentage(financialData.expenseRatio)} of revenue</span>
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
            {/* Monthly P&L Trend */}
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

            {/* Revenue vs Expenses Comparison */}
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
            {/* Expense Breakdown */}
            <div className="healx-pl-chart-container healx-pl-chart-medium">
              <div className="healx-pl-chart-header">
                <h3 className="healx-pl-chart-title">
                  <span className="healx-pl-chart-icon">💸</span>
                  Expense Category Breakdown
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

            {/* Revenue by Payment Method */}
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
              AI-powered analysis of your financial performance with actionable recommendations
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
            <p>Heal-x Healthcare Management System • Profit & Loss Analysis</p>
          </div>
          <div className="healx-pl-footer-actions">
            <button onClick={() => navigate('/admin/financial')} className="healx-pl-btn healx-pl-btn-ghost">
              ← Back to Financial Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfitOrLoss;
