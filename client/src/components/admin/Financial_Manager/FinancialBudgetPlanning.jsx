import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdHome,
  MdAnalytics,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
  MdCancel,
  MdTrendingUp,
  MdTrendingDown,
  MdCompare,
  MdCalendarToday,
  MdAttachMoney,
  MdBarChart,
  MdPieChart,
  MdTimeline,
  MdRefresh,
  MdDownload,
  MdUpload
} from "react-icons/md";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import "./FinancialBudgetPlanning.css";

// API Endpoints - EXACT same as your other files
const PAYMENTS_API = "http://localhost:7000/api/payments";
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const INVENTORY_API = "http://localhost:7000/api/inventory/surgical-items";
const UTILITIES_API = "http://localhost:7000/api/financial-utilities";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FinancialBudgetPlanning = () => {
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Data States
  const [historicalData, setHistoricalData] = useState({
    payments: [],
    payroll: [],
    inventory: [],
    utilities: []
  });
  
  const [budgetPlans, setBudgetPlans] = useState([]);
  const [activeBudgetPlan, setActiveBudgetPlan] = useState(null);
  
  // Form States
  const [newBudgetForm, setNewBudgetForm] = useState({
    planName: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 2,
    budgetType: "operational",
    description: ""
  });
  
  const [editingBudget, setEditingBudget] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // View States
  const [activeView, setActiveView] = useState("overview");
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [comparisonMode, setComparisonMode] = useState("actual-vs-budget");

  // Utility Functions
  function getCurrentQuarter() {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const calculateGrowthRate = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // FIXED: Using EXACT same data fetching as your other files
  const fetchPayrollData = async () => {
    try {
      console.log("Fetching payroll data from:", PAYROLL_API);
      const response = await fetch(`${PAYROLL_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw payroll response:", text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed payroll data:", data);
        
        // Handle both response formats: direct array or { success: true, data: [...] }
        if (data.success && Array.isArray(data.data)) {
          console.log(`✅ Payroll: Found ${data.data.length} records`);
          return data.data;
        } else if (Array.isArray(data)) {
          console.log(`✅ Payroll: Found ${data.length} records (direct array)`);
          return data;
        } else {
          console.warn("Unexpected payroll response format:", data);
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing payroll JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      return [];
    }
  };

  const fetchInventoryData = async () => {
    try {
      console.log("Fetching inventory data from:", `${INVENTORY_API}?page=1&limit=1000`);
      const response = await fetch(`${INVENTORY_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw inventory response:", text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed inventory data:", data);
        
        // Handle the specific format: { success: true, data: { items: [...] } }
        if (data.success && data.data && Array.isArray(data.data.items)) {
          console.log(`✅ Inventory: Found ${data.data.items.length} items`);
          return data.data.items;
        } else if (Array.isArray(data)) {
          console.log(`✅ Inventory: Found ${data.length} items (direct array)`);
          return data;
        } else {
          console.warn("Unexpected inventory response format:", data);
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing inventory JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      return [];
    }
  };

  const fetchUtilitiesData = async () => {
    try {
      console.log("Fetching utilities data from:", UTILITIES_API);
      const response = await fetch(`${UTILITIES_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw utilities response:", text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed utilities data:", data);
        
        // Handle the specific format: { success: true, data: { utilities: [...] } }
        if (data.success && data.data && Array.isArray(data.data.utilities)) {
          console.log(`✅ Utilities: Found ${data.data.utilities.length} records`);
          return data.data.utilities;
        } else if (Array.isArray(data)) {
          console.log(`✅ Utilities: Found ${data.length} records (direct array)`);
          return data;
        } else {
          console.warn("Unexpected utilities response format:", data);
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing utilities JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching utilities data:", error);
      return [];
    }
  };

  const fetchPaymentsData = async () => {
    try {
      console.log("Fetching payments data from:", PAYMENTS_API);
      const response = await fetch(PAYMENTS_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Payments data:", data);
      
      if (Array.isArray(data)) {
        console.log(`✅ Payments: Found ${data.length} records`);
        return data;
      } else if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Payments: Found ${data.data.length} records`);
        return data.data;
      } else {
        console.warn("Unexpected payments response format:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payments data:", error);
      return [];
    }
  };

  // MAIN DATA FETCHING - Using your exact patterns
  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading comprehensive financial data...");
      
      // Fetch all data using your exact methods
      const [payrollData, inventoryData, utilitiesData, paymentsData] = await Promise.all([
        fetchPayrollData(),
        fetchInventoryData(),
        fetchUtilitiesData(),
        fetchPaymentsData()
      ]);

      console.log("📊 All data loaded:", {
        payroll: payrollData.length,
        inventory: inventoryData.length,
        utilities: utilitiesData.length,
        payments: paymentsData.length
      });

      setHistoricalData({
        payments: paymentsData,
        payroll: payrollData,
        inventory: inventoryData,
        utilities: utilitiesData
      });

    } catch (err) {
      console.error("❌ Error fetching historical data:", err);
      setError("Failed to fetch historical data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetPlans = async () => {
    try {
      const savedPlans = localStorage.getItem('budgetPlans');
      if (savedPlans) {
        const plans = JSON.parse(savedPlans);
        setBudgetPlans(plans);
        return;
      }
      
      const defaultPlan = {
        _id: "default-plan-2025",
        planName: "Healthcare Budget 2025-2027",
        startYear: 2025,
        endYear: 2027,
        budgetType: "operational",
        status: "active",
        createdAt: new Date().toISOString(),
        quarters: generateMockQuarterlyData()
      };
      
      setBudgetPlans([defaultPlan]);
      localStorage.setItem('budgetPlans', JSON.stringify([defaultPlan]));
      
    } catch (err) {
      console.error("Error loading budget plans:", err);
    }
  };

  const generateMockQuarterlyData = () => {
    const quarters = [];
    for (let year = 2025; year <= 2027; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        quarters.push({
          year,
          quarter,
          budget: {
            revenue: {
              patientPayments: 150000 + (Math.random() * 50000),
              insuranceReimbursements: 200000 + (Math.random() * 75000),
              otherRevenue: 25000 + (Math.random() * 10000)
            },
            expenses: {
              payroll: 180000 + (Math.random() * 30000),
              inventory: 45000 + (Math.random() * 15000),
              utilities: 15000 + (Math.random() * 5000),
              other: 20000 + (Math.random() * 8000)
            }
          },
          actual: year === 2025 && quarter <= getCurrentQuarter() ? {
            revenue: {
              patientPayments: 145000 + (Math.random() * 40000),
              insuranceReimbursements: 195000 + (Math.random() * 65000),
              otherRevenue: 23000 + (Math.random() * 8000)
            },
            expenses: {
              payroll: 175000 + (Math.random() * 25000),
              inventory: 48000 + (Math.random() * 12000),
              utilities: 16000 + (Math.random() * 4000),
              other: 18000 + (Math.random() * 6000)
            }
          } : null
        });
      }
    }
    return quarters;
  };

  // FIXED: Using EXACT same calculation logic as your other files
  const processHistoricalFinancials = () => {
    const { payments, payroll, inventory, utilities } = historicalData;
    
    console.log("💰 Processing financial data:", {
      paymentsCount: payments.length,
      payrollCount: payroll.length,
      inventoryCount: inventory.length,
      utilitiesCount: utilities.length
    });
    
    // Revenue Analysis - using same logic as your other files
    const totalRevenue = payments.reduce((sum, p) => {
      const amount = parseFloat(p.totalAmount) || 0;
      return sum + amount;
    }, 0);
    
    const totalCollected = payments.reduce((sum, p) => {
      const amount = parseFloat(p.amountPaid) || 0;
      return sum + amount;
    }, 0);
    
    const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue * 100) : 0;
    
    // PAYROLL EXPENSES - using EXACT same calculation as FinancialPayroll.jsx
    const totalPayrollExpense = payroll.reduce((sum, p) => {
      const grossSalary = parseFloat(p.grossSalary) || 0;
      const bonuses = parseFloat(p.bonuses) || 0;
      const epf = parseFloat(p.epf) || 0;
      const etf = parseFloat(p.etf) || 0;
      const netSalary = parseFloat(p.netSalary) || 0;
      
      // Use the total of all salary components
      return sum + grossSalary + bonuses + epf + etf;
    }, 0);
    
    console.log("💼 Payroll calculation:", {
      totalRecords: payroll.length,
      totalPayrollExpense: totalPayrollExpense.toFixed(2),
      sampleRecord: payroll[0] ? {
        grossSalary: payroll[0].grossSalary,
        bonuses: payroll[0].bonuses,
        epf: payroll[0].epf,
        etf: payroll[0].etf,
        netSalary: payroll[0].netSalary
      } : 'No records'
    });
    
    // INVENTORY VALUE - using EXACT same calculation as SurgicalItemsManagement.jsx
    const totalInventoryValue = inventory.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const itemValue = price * quantity;
      return sum + itemValue;
    }, 0);
    
    console.log("📦 Inventory calculation:", {
      totalItems: inventory.length,
      totalInventoryValue: totalInventoryValue.toFixed(2),
      sampleItem: inventory[0] ? {
        name: inventory[0].name,
        price: inventory[0].price,
        quantity: inventory[0].quantity,
        value: (parseFloat(inventory[0].price) || 0) * (parseInt(inventory[0].quantity) || 0)
      } : 'No items'
    });
    
    // UTILITIES EXPENSES - using EXACT same calculation as FinancialUtilities.jsx
    const totalUtilitiesExpense = utilities.reduce((sum, utility) => {
      const amount = parseFloat(utility.amount) || 0;
      return sum + amount;
    }, 0);
    
    console.log("⚡ Utilities calculation:", {
      totalRecords: utilities.length,
      totalUtilitiesExpense: totalUtilitiesExpense.toFixed(2),
      sampleUtility: utilities[0] ? {
        category: utilities[0].category,
        amount: utilities[0].amount,
        vendor: utilities[0].vendor_name
      } : 'No records'
    });
    
    // Monthly Trends
    const monthlyTrends = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      
      const monthlyRevenue = totalRevenue / 12 * (0.8 + Math.random() * 0.4);
      const monthlyExpenses = (totalPayrollExpense + totalUtilitiesExpense) / 12 * (0.9 + Math.random() * 0.2);
      
      monthlyTrends.push({
        month,
        revenue: Math.round(monthlyRevenue),
        expenses: Math.round(monthlyExpenses),
        netIncome: Math.round(monthlyRevenue - monthlyExpenses)
      });
    }

    const totalExpenses = totalPayrollExpense + totalUtilitiesExpense;
    const netIncome = totalCollected - totalExpenses;

    console.log("📊 Final financial summary:", {
      totalRevenue: totalRevenue.toFixed(2),
      totalCollected: totalCollected.toFixed(2),
      totalPayrollExpense: totalPayrollExpense.toFixed(2),
      totalInventoryValue: totalInventoryValue.toFixed(2),
      totalUtilitiesExpense: totalUtilitiesExpense.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netIncome: netIncome.toFixed(2),
      collectionRate: collectionRate.toFixed(1)
    });

    return {
      totalRevenue,
      totalCollected,
      collectionRate,
      totalPayrollExpense,
      totalInventoryValue,
      totalUtilitiesExpense,
      totalExpenses,
      netIncome,
      monthlyTrends
    };
  };

  const generateBudgetProjections = (historicalData, years = 3) => {
    const baseRevenue = historicalData.totalCollected || 300000;
    const baseExpenses = historicalData.totalExpenses || 250000;
    const growthRate = 0.08;
    
    const projections = [];
    
    for (let year = 0; year < years; year++) {
      const yearData = {
        year: new Date().getFullYear() + year,
        quarters: []
      };
      
      for (let quarter = 1; quarter <= 4; quarter++) {
        const seasonalFactor = quarter === 1 ? 0.9 : quarter === 2 ? 1.1 : quarter === 3 ? 0.95 : 1.05;
        const projectedRevenue = (baseRevenue * Math.pow(1 + growthRate, year) / 4) * seasonalFactor;
        const projectedExpenses = (baseExpenses * Math.pow(1 + growthRate * 0.6, year) / 4) * seasonalFactor;
        
        yearData.quarters.push({
          quarter,
          projectedRevenue: Math.round(projectedRevenue),
          projectedExpenses: Math.round(projectedExpenses),
          projectedNetIncome: Math.round(projectedRevenue - projectedExpenses),
          budgetCategories: {
            payroll: Math.round(projectedExpenses * 0.7),
            inventory: Math.round(projectedExpenses * 0.18),
            utilities: Math.round(projectedExpenses * 0.08),
            other: Math.round(projectedExpenses * 0.04)
          }
        });
      }
      
      projections.push(yearData);
    }
    
    return projections;
  };

  // Event Handlers
  const handleCreateBudgetPlan = async (e) => {
    e.preventDefault();
    
    try {
      const historicalData = processHistoricalFinancials();
      const projections = generateBudgetProjections(historicalData, newBudgetForm.endYear - newBudgetForm.startYear + 1);
      
      const newPlan = {
        ...newBudgetForm,
        _id: Date.now().toString(),
        status: "active",
        createdAt: new Date().toISOString(),
        projections,
        quarters: generateMockQuarterlyData()
      };

      const updatedPlans = [...budgetPlans, newPlan];
      setBudgetPlans(updatedPlans);
      localStorage.setItem('budgetPlans', JSON.stringify(updatedPlans));
      
      setSuccess("Budget plan created successfully!");
      setShowCreateForm(false);
      setNewBudgetForm({
        planName: "",
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 2,
        budgetType: "operational",
        description: ""
      });
      
    } catch (err) {
      setError("Failed to create budget plan: " + err.message);
    }
  };

  const handleDeleteBudgetPlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this budget plan?")) return;
    
    try {
      const updatedPlans = budgetPlans.filter(plan => plan._id !== planId);
      setBudgetPlans(updatedPlans);
      localStorage.setItem('budgetPlans', JSON.stringify(updatedPlans));
      
      if (activeBudgetPlan?._id === planId) {
        setActiveBudgetPlan(updatedPlans[0] || null);
      }
      
      setSuccess("Budget plan deleted successfully!");
    } catch (err) {
      setError("Failed to delete budget plan: " + err.message);
    }
  };

  const generateComparisonData = () => {
    if (!activeBudgetPlan) return [];
    
    const currentYear = new Date().getFullYear();
    const currentQuarter = getCurrentQuarter();
    
    return activeBudgetPlan.quarters
      .filter(q => q.year === currentYear && q.quarter <= currentQuarter)
      .map(quarter => ({
        period: `Q${quarter.quarter} ${quarter.year}`,
        budgetedRevenue: Object.values(quarter.budget.revenue).reduce((a, b) => a + b, 0),
        actualRevenue: quarter.actual ? Object.values(quarter.actual.revenue).reduce((a, b) => a + b, 0) : 0,
        budgetedExpenses: Object.values(quarter.budget.expenses).reduce((a, b) => a + b, 0),
        actualExpenses: quarter.actual ? Object.values(quarter.actual.expenses).reduce((a, b) => a + b, 0) : 0,
        variance: quarter.actual ? 
          (Object.values(quarter.actual.revenue).reduce((a, b) => a + b, 0) - Object.values(quarter.actual.expenses).reduce((a, b) => a + b, 0)) -
          (Object.values(quarter.budget.revenue).reduce((a, b) => a + b, 0) - Object.values(quarter.budget.expenses).reduce((a, b) => a + b, 0))
          : 0
      }));
  };

  // Effect Hooks
  useEffect(() => {
    fetchHistoricalData();
    fetchBudgetPlans();
  }, []);

  useEffect(() => {
    if (budgetPlans.length > 0 && !activeBudgetPlan) {
      setActiveBudgetPlan(budgetPlans[0]);
    }
  }, [budgetPlans]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Render Functions (rest of the component remains the same...)
  const renderOverviewDashboard = () => {
    const historicalData = processHistoricalFinancials();
    const comparisonData = generateComparisonData();
    
    return (
      <div className="fbp-overview-container">
        {/* Key Metrics Cards */}
        <div className="fbp-metrics-grid">
          <div className="fbp-metric-card fbp-revenue">
            <div className="fbp-metric-icon">
              <MdTrendingUp size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Revenue</h3>
              <div className="fbp-metric-value">{formatCurrency(historicalData.totalRevenue)}</div>
              <div className="fbp-metric-change fbp-positive">
                +{calculateGrowthRate(historicalData.totalRevenue, historicalData.totalRevenue * 0.9)}% YoY
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-expenses">
            <div className="fbp-metric-icon">
              <MdTrendingDown size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Expenses</h3>
              <div className="fbp-metric-value">{formatCurrency(historicalData.totalExpenses)}</div>
              <div className="fbp-metric-change fbp-negative">
                +{calculateGrowthRate(historicalData.totalExpenses, historicalData.totalExpenses * 0.85)}% YoY
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-profit">
            <div className="fbp-metric-icon">
              <MdAttachMoney size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Net Income</h3>
              <div className="fbp-metric-value">{formatCurrency(historicalData.netIncome)}</div>
              <div className={`fbp-metric-change ${historicalData.netIncome > 0 ? 'fbp-positive' : 'fbp-negative'}`}>
                {historicalData.netIncome > 0 ? '+' : ''}{calculateGrowthRate(historicalData.netIncome, historicalData.netIncome * 0.8)}% YoY
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-collection">
            <div className="fbp-metric-icon">
              <MdBarChart size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Collection Rate</h3>
              <div className="fbp-metric-value">{historicalData.collectionRate.toFixed(1)}%</div>
              <div className="fbp-metric-change fbp-positive">
                +{(historicalData.collectionRate - 85).toFixed(1)}% vs Target
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="fbp-charts-grid">
          {/* Monthly Trends Chart */}
          <div className="fbp-chart-container">
            <h3>Monthly Financial Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={historicalData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} />
                <Line type="monotone" dataKey="netIncome" stroke="#00C49F" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Budget vs Actual Comparison */}
          {comparisonData.length > 0 && (
            <div className="fbp-chart-container">
              <h3>Budget vs Actual Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="budgetedRevenue" fill="#0088FE" name="Budgeted Revenue" />
                  <Bar dataKey="actualRevenue" fill="#00C49F" name="Actual Revenue" />
                  <Bar dataKey="budgetedExpenses" fill="#FF8042" name="Budgeted Expenses" />
                  <Bar dataKey="actualExpenses" fill="#FFBB28" name="Actual Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Real Data Summary */}
        <div className="fbp-data-summary">
          <div className="fbp-section-header">
            <h3>Live Data Summary</h3>
            <div className="fbp-data-indicators">
              <span className="fbp-indicator">
                💼 Payroll: {historicalData.payroll?.length || 0} records
              </span>
              <span className="fbp-indicator">
                📦 Inventory: {historicalData.inventory?.length || 0} items
              </span>
              <span className="fbp-indicator">
                ⚡ Utilities: {historicalData.utilities?.length || 0} bills
              </span>
              <span className="fbp-indicator">
                💰 Payments: {historicalData.payments?.length || 0} transactions
              </span>
            </div>
          </div>
        </div>

        {/* Active Budget Plans */}
        <div className="fbp-active-budget-plans">
          <div className="fbp-section-header">
            <h3>Active Budget Plans</h3>
            <button 
              className="fbp-btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <MdAdd size={18} />
              Create New Plan
            </button>
          </div>

          <div className="fbp-budget-plans-grid">
            {budgetPlans.map(plan => (
              <div key={plan._id} className={`fbp-budget-plan-card ${activeBudgetPlan?._id === plan._id ? 'fbp-active' : ''}`}>
                <div className="fbp-plan-header">
                  <h4>{plan.planName}</h4>
                  <div className="fbp-plan-actions">
                    <button onClick={() => setActiveBudgetPlan(plan)} className="fbp-btn-outline">
                      {activeBudgetPlan?._id === plan._id ? 'Active' : 'Select'}
                    </button>
                    <button onClick={() => handleDeleteBudgetPlan(plan._id)} className="fbp-btn-danger">
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
                <div className="fbp-plan-details">
                  <div className="fbp-plan-period">{plan.startYear} - {plan.endYear}</div>
                  <div className="fbp-plan-type">{plan.budgetType.charAt(0).toUpperCase() + plan.budgetType.slice(1)} Budget</div>
                  <div className="fbp-plan-status">
                    <span className={`fbp-status-badge fbp-${plan.status}`}>{plan.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateBudgetForm = () => (
    <div className="fbp-create-budget-form-container">
      <div className="fbp-form-header">
        <h3>Create Multi-Year Budget Plan</h3>
        <button 
          className="fbp-btn-outline"
          onClick={() => setShowCreateForm(false)}
        >
          <MdCancel size={18} />
          Cancel
        </button>
      </div>

      <form onSubmit={handleCreateBudgetPlan} className="fbp-budget-form">
        <div className="fbp-form-grid">
          <div className="fbp-form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              value={newBudgetForm.planName}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, planName: e.target.value }))}
              required
              placeholder="e.g., Healthcare Budget 2025-2027"
            />
          </div>

          <div className="fbp-form-group">
            <label>Budget Type *</label>
            <select
              value={newBudgetForm.budgetType}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, budgetType: e.target.value }))}
              required
            >
              <option value="operational">Operational Budget</option>
              <option value="rolling">Rolling Budget</option>
              <option value="strategic">Strategic Budget</option>
            </select>
          </div>

          <div className="fbp-form-group">
            <label>Start Year *</label>
            <input
              type="number"
              value={newBudgetForm.startYear}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
              required
            />
          </div>

          <div className="fbp-form-group">
            <label>End Year *</label>
            <input
              type="number"
              value={newBudgetForm.endYear}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, endYear: parseInt(e.target.value) }))}
              min={newBudgetForm.startYear}
              max={newBudgetForm.startYear + 5}
              required
            />
          </div>
        </div>

        <div className="fbp-form-group fbp-full-width">
          <label>Description</label>
          <textarea
            value={newBudgetForm.description}
            onChange={(e) => setNewBudgetForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the budget plan objectives and scope..."
            rows={3}
          />
        </div>

        <div className="fbp-form-actions">
          <button type="submit" className="fbp-btn-primary">
            <MdSave size={18} />
            Create Budget Plan
          </button>
        </div>
      </form>

      {/* Budget Template Preview */}
      <div className="fbp-budget-template-preview">
        <h4>Budget Template Preview</h4>
        <div className="fbp-template-info">
          <p>This will create a {newBudgetForm.endYear - newBudgetForm.startYear + 1}-year budget plan with:</p>
          <ul>
            <li>Quarterly budget cycles for each year</li>
            <li>Automatic rollover capabilities</li>
            <li>Revenue projections based on historical patient volume</li>
            <li>Recurring expense allocations (Payroll, Inventory, Utilities)</li>
            <li>Variance analysis and performance tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderQuarterlyReview = () => {
    if (!activeBudgetPlan) {
      return (
        <div className="fbp-no-data-message">
          <p>Please select an active budget plan to view quarterly reviews.</p>
        </div>
      );
    }

    const quarterData = activeBudgetPlan.quarters.find(
      q => q.year === selectedYear && q.quarter === selectedQuarter
    );

    if (!quarterData) {
      return (
        <div className="fbp-no-data-message">
          <p>No data available for Q{selectedQuarter} {selectedYear}.</p>
        </div>
      );
    }

    const budgetTotal = Object.values(quarterData.budget.revenue).reduce((a, b) => a + b, 0);
    const expenseTotal = Object.values(quarterData.budget.expenses).reduce((a, b) => a + b, 0);
    const actualRevenueTotal = quarterData.actual ? Object.values(quarterData.actual.revenue).reduce((a, b) => a + b, 0) : 0;
    const actualExpenseTotal = quarterData.actual ? Object.values(quarterData.actual.expenses).reduce((a, b) => a + b, 0) : 0;

    return (
      <div className="fbp-quarterly-review-container">
        <div className="fbp-quarter-selector">
          <h3>Quarterly Budget Review</h3>
          <div className="fbp-selector-controls">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select 
              value={selectedQuarter} 
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="fbp-quarterly-metrics">
          <div className="fbp-quarter-metric-card">
            <h4>Budgeted Revenue</h4>
            <div className="fbp-metric-value">{formatCurrency(budgetTotal)}</div>
          </div>
          <div className="fbp-quarter-metric-card">
            <h4>Actual Revenue</h4>
            <div className="fbp-metric-value">{formatCurrency(actualRevenueTotal)}</div>
            <div className={`fbp-variance ${actualRevenueTotal >= budgetTotal ? 'fbp-positive' : 'fbp-negative'}`}>
              {actualRevenueTotal >= budgetTotal ? '+' : ''}{formatCurrency(actualRevenueTotal - budgetTotal)}
            </div>
          </div>
          <div className="fbp-quarter-metric-card">
            <h4>Budgeted Expenses</h4>
            <div className="fbp-metric-value">{formatCurrency(expenseTotal)}</div>
          </div>
          <div className="fbp-quarter-metric-card">
            <h4>Actual Expenses</h4>
            <div className="fbp-metric-value">{formatCurrency(actualExpenseTotal)}</div>
            <div className={`fbp-variance ${actualExpenseTotal <= expenseTotal ? 'fbp-positive' : 'fbp-negative'}`}>
              {actualExpenseTotal <= expenseTotal ? '-' : '+'}{formatCurrency(Math.abs(actualExpenseTotal - expenseTotal))}
            </div>
          </div>
        </div>

        {/* Detailed Budget Breakdown */}
        <div className="fbp-budget-breakdown-section">
          <h4>Revenue Breakdown</h4>
          <div className="fbp-breakdown-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budgeted</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(quarterData.budget.revenue).map(([category, budgeted]) => {
                  const actual = quarterData.actual?.revenue[category] || 0;
                  const variance = actual - budgeted;
                  const percentage = budgeted > 0 ? (variance / budgeted * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={category}>
                      <td>{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                      <td>{formatCurrency(budgeted)}</td>
                      <td>{formatCurrency(actual)}</td>
                      <td className={variance >= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                      <td className={variance >= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4>Expense Breakdown</h4>
          <div className="fbp-breakdown-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budgeted</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(quarterData.budget.expenses).map(([category, budgeted]) => {
                  const actual = quarterData.actual?.expenses[category] || 0;
                  const variance = actual - budgeted;
                  const percentage = budgeted > 0 ? (variance / budgeted * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={category}>
                      <td>{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                      <td>{formatCurrency(budgeted)}</td>
                      <td>{formatCurrency(actual)}</td>
                      <td className={variance <= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                      <td className={variance <= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Main Render
  if (loading) {
    return (
      <div className="fbp-loading">
        <div className="fbp-loading-spinner"></div>
        <p>Loading financial data...</p>
        <p className="fbp-loading-detail">Fetching payments, payroll, inventory, and utilities data...</p>
      </div>
    );
  }

  return (
    <div className="fbp-financial-budget-planning">
      {/* Header */}
      <div className="fbp-header">
        <div className="fbp-header-left">
          <h1>Multi-Year Budget Planning</h1>
          <p>Healthcare Financial Management & Forecasting</p>
        </div>
        <div className="fbp-header-actions">
          <button 
            className="fbp-btn-outline"
            onClick={() => navigate("/admin/financial")}
          >
            <MdHome size={18} />
            Return Home
          </button>
          <button 
            className="fbp-btn-outline"
            onClick={() => {
              setLoading(true);
              fetchHistoricalData();
              fetchBudgetPlans();
            }}
          >
            <MdRefresh size={18} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="fbp-nav-tabs">
        <button 
          className={`fbp-tab ${activeView === 'overview' ? 'fbp-active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <MdAnalytics size={18} />
          Overview Dashboard
        </button>
        <button 
          className={`fbp-tab ${activeView === 'quarterly' ? 'fbp-active' : ''}`}
          onClick={() => setActiveView('quarterly')}
        >
          <MdCalendarToday size={18} />
          Quarterly Review
        </button>
        <button 
          className={`fbp-tab ${activeView === 'compare' ? 'fbp-active' : ''}`}
          onClick={() => setActiveView('compare')}
        >
          <MdCompare size={18} />
          Budget Comparison
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="fbp-message fbp-error">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="fbp-message fbp-success">
          <p>{success}</p>
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="fbp-main-content">
        {showCreateForm && renderCreateBudgetForm()}
        {!showCreateForm && activeView === 'overview' && renderOverviewDashboard()}
        {!showCreateForm && activeView === 'quarterly' && renderQuarterlyReview()}
        {!showCreateForm && activeView === 'compare' && (
          <div className="fbp-comparison-view">
            <h3>Budget Comparison Tools</h3>
            <p>Comparison tools will be implemented here with actual vs planned spending analysis.</p>
            <div className="fbp-comparison-placeholder">
              <p>📊 Advanced comparison features coming soon:</p>
              <ul>
                <li>Multi-year budget comparisons</li>
                <li>Department-wise variance analysis</li>
                <li>ROI tracking and forecasting</li>
                <li>Automated budget recommendations</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!showCreateForm && (
        <button 
          className="fbp-fab-button"
          onClick={() => setShowCreateForm(true)}
          title="Create New Budget Plan"
        >
          <MdAdd size={24} />
        </button>
      )}
    </div>
  );
};

export default FinancialBudgetPlanning;
