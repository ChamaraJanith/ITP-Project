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
} from "recharts";
import "./ExpenseTracking.css";

const EXPENSE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#FF6B6B", "#4ECDC4"];
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const INVENTORY_API = "http://localhost:7000/api/inventory"; // Adjust if your API endpoint is different

const ExpenseTracking = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenseData, setExpenseData] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [viewType, setViewType] = useState("overview");

  const navigate = useNavigate();

  useEffect(() => {
    initializeExpenseTracking();
  }, []);

  useEffect(() => {
    if (expenseData) {
      calculateFilteredExpenses();
    }
  }, [filterPeriod, selectedMonth, selectedYear]);

  // Fetch payroll expenses
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

  // Fetch inventory expenses - Mock data if API not available
  const fetchInventoryExpenses = async () => {
    try {
      // Try to fetch from inventory API
      const response = await fetch(`${INVENTORY_API}?limit=1000`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        return data.success ? data.data || [] : [];
      } catch {
        console.error("Invalid inventory response:", text);
        // Return mock inventory data if API fails
        return getMockInventoryData();
      }
    } catch (error) {
      console.error("Error fetching inventory expenses:", error);
      // Return mock inventory data as fallback
      return getMockInventoryData();
    }
  };

  // Mock inventory data for demonstration
  const getMockInventoryData = () => {
    return [
      { _id: "1", name: "Medical Supplies", category: "Supplies", price: 250, quantity: 100, supplier: "MedCorp Ltd" },
      { _id: "2", name: "Surgical Equipment", category: "Equipment", price: 5000, quantity: 10, supplier: "SurgTech Inc" },
      { _id: "3", name: "Pharmaceuticals", category: "Medicine", price: 150, quantity: 200, supplier: "PharmaLink" },
      { _id: "4", name: "Lab Equipment", category: "Equipment", price: 3000, quantity: 5, supplier: "LabTech Solutions" },
      { _id: "5", name: "Office Supplies", category: "Supplies", price: 50, quantity: 50, supplier: "OfficeMax" },
      { _id: "6", name: "Cleaning Supplies", category: "Maintenance", price: 75, quantity: 30, supplier: "CleanCorp" },
      { _id: "7", name: "PPE Equipment", category: "Safety", price: 120, quantity: 150, supplier: "SafetyFirst" },
      { _id: "8", name: "IT Equipment", category: "Technology", price: 1200, quantity: 8, supplier: "TechSolutions" }
    ];
  };

  // Initialize expense tracking
  const initializeExpenseTracking = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      // Fetch both payroll and inventory data
      const [payrollData, inventoryData] = await Promise.all([
        fetchPayrollExpenses(),
        fetchInventoryExpenses()
      ]);

      // Calculate comprehensive expense analytics
      const expenseAnalytics = calculateExpenseAnalytics(payrollData, inventoryData);
      setExpenseData(expenseAnalytics);

    } catch (error) {
      console.error("❌ Error loading expense tracking:", error);
      setError("Failed to load expense tracking data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive expense analytics
  const calculateExpenseAnalytics = (payrolls, inventory) => {
    // PAYROLL EXPENSES CALCULATION
    const payrollExpenses = {
      totalGrossSalary: payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      totalBonuses: payrolls.reduce((sum, p) => sum + (p.bonuses || 0), 0),
      totalEPF: payrolls.reduce((sum, p) => sum + (p.epf || 0), 0),
      totalETF: payrolls.reduce((sum, p) => sum + (p.etf || 0), 0),
      totalEmployees: new Set(payrolls.map(p => p.employeeId)).size,
      monthlyPayrollCosts: {}
    };

    // Calculate total payroll expense
    payrollExpenses.totalPayrollExpense = 
      payrollExpenses.totalGrossSalary + 
      payrollExpenses.totalBonuses + 
      payrollExpenses.totalEPF + 
      payrollExpenses.totalETF;

    // Monthly payroll breakdown
    payrolls.forEach(p => {
      const key = `${p.payrollMonth} ${p.payrollYear}`;
      if (!payrollExpenses.monthlyPayrollCosts[key]) {
        payrollExpenses.monthlyPayrollCosts[key] = {
          month: p.payrollMonth,
          year: p.payrollYear,
          totalCost: 0,
          employeeCount: new Set()
        };
      }
      const monthlyCost = (p.grossSalary || 0) + (p.bonuses || 0) + (p.epf || 0) + (p.etf || 0);
      payrollExpenses.monthlyPayrollCosts[key].totalCost += monthlyCost;
      payrollExpenses.monthlyPayrollCosts[key].employeeCount.add(p.employeeId);
    });

    // INVENTORY EXPENSES CALCULATION
    const inventoryExpenses = {
      totalInventoryValue: inventory.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0),
      totalItems: inventory.length,
      categoryExpenses: {},
      supplierExpenses: {},
      monthlyInventoryPurchases: {}
    };

    // Category-wise inventory expenses
    inventory.forEach(item => {
      const category = item.category || 'Uncategorized';
      const itemValue = (item.price || 0) * (item.quantity || 0);
      
      if (!inventoryExpenses.categoryExpenses[category]) {
        inventoryExpenses.categoryExpenses[category] = {
          totalValue: 0,
          itemCount: 0
        };
      }
      inventoryExpenses.categoryExpenses[category].totalValue += itemValue;
      inventoryExpenses.categoryExpenses[category].itemCount += 1;
    });

    // Supplier-wise expenses
    inventory.forEach(item => {
      const supplier = item.supplier || 'Unknown Supplier';
      const itemValue = (item.price || 0) * (item.quantity || 0);
      
      if (!inventoryExpenses.supplierExpenses[supplier]) {
        inventoryExpenses.supplierExpenses[supplier] = {
          totalValue: 0,
          itemCount: 0
        };
      }
      inventoryExpenses.supplierExpenses[supplier].totalValue += itemValue;
      inventoryExpenses.supplierExpenses[supplier].itemCount += 1;
    });

    // TOTAL EXPENSE SUMMARY
    const totalExpenses = payrollExpenses.totalPayrollExpense + inventoryExpenses.totalInventoryValue;

    // EXPENSE BREAKDOWN FOR CHARTS
    const expenseBreakdown = [
      { name: "Staff Salaries", value: payrollExpenses.totalGrossSalary, category: "Payroll" },
      { name: "Employee Benefits", value: payrollExpenses.totalBonuses, category: "Payroll" },
      { name: "EPF Contributions", value: payrollExpenses.totalEPF, category: "Payroll" },
      { name: "ETF Contributions", value: payrollExpenses.totalETF, category: "Payroll" },
      { name: "Medical Inventory", value: inventoryExpenses.totalInventoryValue, category: "Inventory" }
    ];

    // MONTHLY TRENDS (simplified - you can enhance this)
    const monthlyTrends = Object.values(payrollExpenses.monthlyPayrollCosts).map(month => ({
      ...month,
      employeeCount: month.employeeCount.size,
      inventoryValue: inventoryExpenses.totalInventoryValue / 12 // Estimate monthly inventory cost
    }));

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
        avgInventoryPerEmployee: inventoryExpenses.totalInventoryValue / (payrollExpenses.totalEmployees || 1)
      }
    };
  };

  // Calculate filtered expenses based on period
  const calculateFilteredExpenses = () => {
    // This function would filter the expense data based on selected period
    // Implementation depends on your specific filtering requirements
  };

  // Refresh expense data
  const refreshExpenseData = async () => {
    setLoading(true);
    setError("");
    try {
      await initializeExpenseTracking();
      console.log("✅ Expense data refreshed");
    } catch (error) {
      setError("Failed to refresh expense data");
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="et-loading">
          <div>Loading comprehensive expense analytics...</div>
          <div className="et-loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!expenseData) {
    return (
      <AdminLayout admin={admin} title="Expense Tracking">
        <div className="et-error">
          <h2>⚠️ No Expense Data Available</h2>
          <p>Unable to load expense tracking data. Please try refreshing.</p>
          <button onClick={refreshExpenseData} className="et-refresh-btn">
            🔄 Refresh Data
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Chart data preparation
  const expenseBreakdownData = expenseData.expenseBreakdown;
  const categoryComparisonData = [
    { name: "Payroll Expenses", value: expenseData.payrollExpenses.totalPayrollExpense },
    { name: "Inventory Expenses", value: expenseData.inventoryExpenses.totalInventoryValue }
  ];

  const monthlyTrendData = expenseData.monthlyTrends;

  const payrollDetailData = [
    { name: "Gross Salaries", value: expenseData.payrollExpenses.totalGrossSalary },
    { name: "Bonuses", value: expenseData.payrollExpenses.totalBonuses },
    { name: "EPF (8%)", value: expenseData.payrollExpenses.totalEPF },
    { name: "ETF (3%)", value: expenseData.payrollExpenses.totalETF }
  ];

  const inventoryByCategory = Object.entries(expenseData.inventoryExpenses.categoryExpenses).map(([category, data]) => ({
    category,
    value: data.totalValue,
    items: data.itemCount
  }));

  return (
    <AdminLayout admin={admin} title="Expense Tracking">
      <div className="et-container">
        <div className="et-header">
          <div className="et-header-content">
            <h1>💸 Comprehensive Expense Tracking</h1>
            <p>Monitor all organizational expenses: Payroll + Inventory costs</p>
          </div>
          <div className="et-header-actions">
            <button 
              className="et-refresh-btn" 
              onClick={refreshExpenseData}
              disabled={loading}
            >
              {loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}
            </button>
            <button 
              className="et-back-btn" 
              onClick={() => navigate("/admin/financial")}
            >
              ← Back to Financial Dashboard
            </button>
          </div>
        </div>

        {error && <div className="et-error-banner">⚠️ {error}</div>}

        {/* Filters */}
        <div className="et-filters">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="et-filter-select"
          >
            <option value="all">📅 All Time</option>
            <option value="month">📅 This Month</option>
            <option value="year">📅 This Year</option>
          </select>

          <div className="et-view-tabs">
            <button 
              className={`et-tab ${viewType === 'overview' ? 'active' : ''}`}
              onClick={() => setViewType('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`et-tab ${viewType === 'payroll' ? 'active' : ''}`}
              onClick={() => setViewType('payroll')}
            >
              👥 Payroll
            </button>
            <button 
              className={`et-tab ${viewType === 'inventory' ? 'active' : ''}`}
              onClick={() => setViewType('inventory')}
            >
              📦 Inventory
            </button>
            <button 
              className={`et-tab ${viewType === 'trends' ? 'active' : ''}`}
              onClick={() => setViewType('trends')}
            >
              📈 Trends
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="et-stats-grid">
          <div className="et-stat-card et-primary">
            <div className="et-stat-icon">💰</div>
            <div className="et-stat-info">
              <h3>${expenseData.totalExpenses.toLocaleString()}</h3>
              <p>Total Expenses</p>
              <small>All organizational costs</small>
            </div>
          </div>

          <div className="et-stat-card et-success">
            <div className="et-stat-icon">👥</div>
            <div className="et-stat-info">
              <h3>${expenseData.payrollExpenses.totalPayrollExpense.toLocaleString()}</h3>
              <p>Payroll Expenses</p>
              <small>{expenseData.summary.payrollPercentage.toFixed(1)}% of total</small>
            </div>
          </div>

          <div className="et-stat-card et-info">
            <div className="et-stat-icon">📦</div>
            <div className="et-stat-info">
              <h3>${expenseData.inventoryExpenses.totalInventoryValue.toLocaleString()}</h3>
              <p>Inventory Value</p>
              <small>{expenseData.summary.inventoryPercentage.toFixed(1)}% of total</small>
            </div>
          </div>

          <div className="et-stat-card et-warning">
            <div className="et-stat-icon">📊</div>
            <div className="et-stat-info">
              <h3>${(expenseData.totalExpenses / 12).toLocaleString()}</h3>
              <p>Avg Monthly Expenses</p>
              <small>Estimated breakdown</small>
            </div>
          </div>
        </div>

        {/* Charts based on view type */}
        {viewType === 'overview' && (
          <div className="et-charts-grid">
            <div className="et-chart-card">
              <h3>💸 Expense Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryComparisonData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({name, value}) => `${name}: $${value.toLocaleString()}`}
                  >
                    {categoryComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="et-chart-card">
              <h3>📊 Detailed Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewType === 'payroll' && (
          <div className="et-charts-grid">
            <div className="et-chart-card">
              <h3>👥 Payroll Expense Components</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={payrollDetailData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({name, value}) => `${name}: $${value.toLocaleString()}`}
                  >
                    {payrollDetailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="et-payroll-summary">
              <h3>👥 Payroll Summary</h3>
              <div className="et-summary-grid">
                <div className="et-summary-item">
                  <strong>Total Employees:</strong> {expenseData.payrollExpenses.totalEmployees}
                </div>
                <div className="et-summary-item">
                  <strong>Total Gross Salaries:</strong> ${expenseData.payrollExpenses.totalGrossSalary.toLocaleString()}
                </div>
                <div className="et-summary-item">
                  <strong>Total Bonuses:</strong> ${expenseData.payrollExpenses.totalBonuses.toLocaleString()}
                </div>
                <div className="et-summary-item">
                  <strong>EPF + ETF Contributions:</strong> ${(expenseData.payrollExpenses.totalEPF + expenseData.payrollExpenses.totalETF).toLocaleString()}
                </div>
                <div className="et-summary-item">
                  <strong>Avg Cost per Employee:</strong> ${expenseData.payrollExpenses.totalEmployees > 0 ? (expenseData.payrollExpenses.totalPayrollExpense / expenseData.payrollExpenses.totalEmployees).toLocaleString() : '0'}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewType === 'inventory' && (
          <div className="et-charts-grid">
            <div className="et-chart-card">
              <h3>📦 Inventory Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="et-inventory-summary">
              <h3>📦 Inventory Summary</h3>
              <div className="et-summary-grid">
                <div className="et-summary-item">
                  <strong>Total Items:</strong> {expenseData.inventoryExpenses.totalItems}
                </div>
                <div className="et-summary-item">
                  <strong>Total Inventory Value:</strong> ${expenseData.inventoryExpenses.totalInventoryValue.toLocaleString()}
                </div>
                <div className="et-summary-item">
                  <strong>Categories:</strong> {Object.keys(expenseData.inventoryExpenses.categoryExpenses).length}
                </div>
                <div className="et-summary-item">
                  <strong>Suppliers:</strong> {Object.keys(expenseData.inventoryExpenses.supplierExpenses).length}
                </div>
                <div className="et-summary-item">
                  <strong>Avg per Employee:</strong> ${expenseData.summary.avgInventoryPerEmployee.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewType === 'trends' && monthlyTrendData.length > 0 && (
          <div className="et-charts-grid">
            <div className="et-chart-card et-full-width">
              <h3>📈 Monthly Expense Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="totalCost" stroke="#0088FE" strokeWidth={3} name="Payroll Costs" />
                  <Line type="monotone" dataKey="inventoryValue" stroke="#00C49F" strokeWidth={3} name="Inventory Value" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="et-quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="et-actions-grid">
            <button 
              className="et-action-btn et-primary"
              onClick={() => navigate("/admin/financial/payrolls")}
            >
              👥 Manage Payrolls
            </button>
            <button 
              className="et-action-btn et-success"
              onClick={() => navigate("/admin/inventory")}
            >
              📦 Manage Inventory
            </button>
            <button 
              className="et-action-btn et-info"
              onClick={() => navigate("/admin/financial/payments/total-view")}
            >
              📊 Payment Analytics
            </button>
            <button 
              className="et-action-btn et-warning"
              onClick={() => {
                // Export expense report
                const csvData = [
                  ['Expense Category', 'Amount', 'Percentage'],
                  ['Payroll Expenses', expenseData.payrollExpenses.totalPayrollExpense, expenseData.summary.payrollPercentage.toFixed(1) + '%'],
                  ['Inventory Value', expenseData.inventoryExpenses.totalInventoryValue, expenseData.summary.inventoryPercentage.toFixed(1) + '%'],
                  ['Total Expenses', expenseData.totalExpenses, '100%']
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `expense-report-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
            >
              📤 Export Report
            </button>
          </div>
        </div>

        {/* Expense Summary Table */}
        <div className="et-summary-section">
          <h3>📋 Expense Summary Report</h3>
          <div className="et-summary-table">
            <table className="et-table">
              <thead>
                <tr>
                  <th>Expense Category</th>
                  <th>Amount</th>
                  <th>% of Total</th>
                  <th>Monthly Avg</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>👥 Payroll Expenses</strong></td>
                  <td>${expenseData.payrollExpenses.totalPayrollExpense.toLocaleString()}</td>
                  <td>{expenseData.summary.payrollPercentage.toFixed(1)}%</td>
                  <td>${expenseData.summary.avgMonthlyPayroll.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>📦 Inventory Value</strong></td>
                  <td>${expenseData.inventoryExpenses.totalInventoryValue.toLocaleString()}</td>
                  <td>{expenseData.summary.inventoryPercentage.toFixed(1)}%</td>
                  <td>${(expenseData.inventoryExpenses.totalInventoryValue / 12).toLocaleString()}</td>
                </tr>
                <tr className="et-total-row">
                  <td><strong>💰 Total Expenses</strong></td>
                  <td><strong>${expenseData.totalExpenses.toLocaleString()}</strong></td>
                  <td><strong>100.0%</strong></td>
                  <td><strong>${(expenseData.totalExpenses / 12).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpenseTracking;
