import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import "./TotalPayrollView.css";

const PAYROLL_COLORS = ["#667eea", "#764ba2", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];
const API_URL = "http://localhost:7000/api/payrolls";

const TotalPayrollView = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [viewType, setViewType] = useState("overview");
  
  const navigate = useNavigate();
  const location = useLocation();

  // Safe number formatting helper
  const safeFormat = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) || num === null || num === undefined ? defaultValue : num;
  };

  const formatCurrency = (value) => {
    const num = safeFormat(value, 0);
    return num.toLocaleString();
  };

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (payrolls.length > 0) {
      calculateAnalytics();
    }
  }, [payrolls, filterMonth, filterYear, selectedEmployee]);

  const fetchPayrolls = async () => {
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.append('payrollMonth', filterMonth);
      if (filterYear) params.append('payrollYear', filterYear);
      params.append('limit', '1000');

      console.log('🔍 Fetching payrolls with params:', params.toString());

      const response = await fetch(`${API_URL}?${params}`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        console.log('✅ Raw payroll data received:', data);
        
        if (data.success && data.data) {
          console.log('📊 Sample payroll record:', data.data[0]);
          return data.data;
        } else {
          console.warn('⚠️ No payroll data or unsuccessful response:', data);
          return [];
        }
      } catch {
        console.error("❌ Invalid JSON response:", text);
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error("❌ Error fetching payrolls:", error);
      throw error;
    }
  };

  const initializeAnalytics = async () => {
    try {
      const payrollData = await fetchPayrolls();
      console.log('📈 Setting payroll data for analytics:', payrollData.length, 'records');
      setPayrolls(payrollData);
      
    } catch (error) {
      console.error("❌ Error loading payroll analytics:", error);
      setError("Failed to load payroll analytics: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    if (!payrolls || payrolls.length === 0) {
      console.log('⚠️ No payroll data available for analytics');
      setAnalytics({
        summary: {
          totalEmployees: 0,
          totalPayrolls: 0,
          totalGrossSalary: 0,
          totalNetSalary: 0,
          totalDeductions: 0,
          totalBonuses: 0,
          avgGrossSalary: 0,
          avgNetSalary: 0,
          totalEmployeeEPF: 0,
          totalEmployerEPF: 0,
          totalEmployerETF: 0,
          totalEmployerContributions: 0,
          totalCompanyPayrollExpense: 0
        },
        statusBreakdown: {},
        monthlyTrends: [],
        salaryRanges: {
          "0-50K": 0,
          "50K-100K": 0,
          "100K-150K": 0,
          "150K-200K": 0,
          "200K+": 0
        },
        topEmployees: [],
        costBreakdown: {
          grossSalary: 0,
          bonuses: 0,
          deductions: 0,
          employeeEPF: 0,
          employerEPF: 0,
          employerETF: 0
        }
      });
      return;
    }

    console.log('📊 Starting analytics calculation with', payrolls.length, 'payroll records');

    let filteredPayrolls = [...payrolls];

    // Apply filters
    if (filterMonth) {
      filteredPayrolls = filteredPayrolls.filter(p => p.payrollMonth === filterMonth);
      console.log('🔍 Filtered by month:', filterMonth, '→', filteredPayrolls.length, 'records');
    }
    if (filterYear) {
      filteredPayrolls = filteredPayrolls.filter(p => p.payrollYear?.toString() === filterYear);
      console.log('🔍 Filtered by year:', filterYear, '→', filteredPayrolls.length, 'records');
    }
    if (selectedEmployee) {
      filteredPayrolls = filteredPayrolls.filter(p => p.employeeId === selectedEmployee);
      console.log('🔍 Filtered by employee:', selectedEmployee, '→', filteredPayrolls.length, 'records');
    }

    // Basic calculations using actual database values
    const totalEmployees = new Set(filteredPayrolls.map(p => p.employeeId)).size;
    const totalPayrolls = filteredPayrolls.length;
    
    const totalGrossSalary = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.grossSalary), 0);
    const totalNetSalary = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.netSalary), 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.deductions), 0);
    const totalBonuses = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.bonuses), 0);

    // EPF/ETF calculations
    const totalEmployeeEPF = filteredPayrolls.reduce((sum, p) => {
      const dbEPF = safeFormat(p.epf);
      const calculatedEPF = Math.round(safeFormat(p.grossSalary) * 0.08);
      return sum + (dbEPF > 0 ? dbEPF : calculatedEPF);
    }, 0);

    const totalEmployerEPF = filteredPayrolls.reduce((sum, p) => {
      const basicSalary = safeFormat(p.grossSalary);
      return sum + Math.round(basicSalary * 0.12);
    }, 0);

    const totalEmployerETF = filteredPayrolls.reduce((sum, p) => {
      const basicSalary = safeFormat(p.grossSalary);
      return sum + Math.round(basicSalary * 0.03);
    }, 0);

    const totalEmployerContributions = totalEmployerEPF + totalEmployerETF;
    const totalCompanyPayrollExpense = totalGrossSalary + totalBonuses + totalEmployerEPF + totalEmployerETF;

    console.log('💰 Calculated totals:', {
      totalGrossSalary: totalGrossSalary.toLocaleString(),
      totalNetSalary: totalNetSalary.toLocaleString(),
      totalEmployeeEPF: totalEmployeeEPF.toLocaleString(),
      totalEmployerEPF: totalEmployerEPF.toLocaleString(),
      totalEmployerETF: totalEmployerETF.toLocaleString(),
      totalCompanyExpense: totalCompanyPayrollExpense.toLocaleString()
    });

    // Safe Average calculations
    const avgGrossSalary = totalEmployees > 0 ? totalGrossSalary / totalEmployees : 0;
    const avgNetSalary = totalEmployees > 0 ? totalNetSalary / totalEmployees : 0;

    // Status breakdown
    const statusBreakdown = {};
    filteredPayrolls.forEach(p => {
      const status = p.status || 'Pending';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Monthly trends with EPF/ETF breakdown
    const monthlyTrends = {};
    filteredPayrolls.forEach(p => {
      const key = `${p.payrollMonth || 'Unknown'} ${p.payrollYear || 'Unknown'}`;
      if (!monthlyTrends[key]) {
        monthlyTrends[key] = {
          month: p.payrollMonth || 'Unknown',
          year: p.payrollYear || 'Unknown',
          totalGross: 0,
          totalNet: 0,
          employeeCount: new Set(),
          totalBonuses: 0,
          totalDeductions: 0,
          totalEmployeeEPF: 0,
          totalEmployerEPF: 0,
          totalEmployerETF: 0,
          totalCompanyExpense: 0
        };
      }
      
      const basicSalary = safeFormat(p.grossSalary);
      const bonuses = safeFormat(p.bonuses);
      const dbEPF = safeFormat(p.epf);
      const calculatedEPF = Math.round(basicSalary * 0.08);
      const employeeEPF = dbEPF > 0 ? dbEPF : calculatedEPF;
      
      monthlyTrends[key].totalGross += basicSalary;
      monthlyTrends[key].totalNet += safeFormat(p.netSalary);
      monthlyTrends[key].totalBonuses += bonuses;
      monthlyTrends[key].totalDeductions += safeFormat(p.deductions);
      monthlyTrends[key].totalEmployeeEPF += employeeEPF;
      monthlyTrends[key].totalEmployerEPF += Math.round(basicSalary * 0.12);
      monthlyTrends[key].totalEmployerETF += Math.round(basicSalary * 0.03);
      monthlyTrends[key].totalCompanyExpense += basicSalary + bonuses + Math.round(basicSalary * 0.12) + Math.round(basicSalary * 0.03);
      monthlyTrends[key].employeeCount.add(p.employeeId);
    });

    const monthlyTrendsArray = Object.values(monthlyTrends).map(trend => ({
      ...trend,
      employeeCount: trend.employeeCount.size
    }));

    // Salary distribution
    const salaryRanges = {
      "0-50K": 0,
      "50K-100K": 0,
      "100K-150K": 0,
      "150K-200K": 0,
      "200K+": 0
    };

    filteredPayrolls.forEach(p => {
      const salary = safeFormat(p.grossSalary);
      if (salary < 50000) salaryRanges["0-50K"]++;
      else if (salary < 100000) salaryRanges["50K-100K"]++;
      else if (salary < 150000) salaryRanges["100K-150K"]++;
      else if (salary < 200000) salaryRanges["150K-200K"]++;
      else salaryRanges["200K+"]++;
    });

    // Top employees calculation
    const employeeSalaries = {};
    
    filteredPayrolls.forEach(p => {
      const empId = p.employeeId;
      const empName = p.employeeName || 'Unknown';
      const basicSalary = safeFormat(p.grossSalary);
      const dbEPF = safeFormat(p.epf);
      const calculatedEPF = Math.round(basicSalary * 0.08);
      const employeeEPF = dbEPF > 0 ? dbEPF : calculatedEPF;
      
      if (!employeeSalaries[empId]) {
        employeeSalaries[empId] = {
          employeeId: empId,
          employeeName: empName,
          totalGross: 0,
          totalNet: 0,
          payrollCount: 0,
          averageGross: 0,
          totalEmployeeEPF: 0,
          totalEmployerEPF: 0,
          totalEmployerETF: 0
        };
      }
      
      employeeSalaries[empId].totalGross += basicSalary;
      employeeSalaries[empId].totalNet += safeFormat(p.netSalary);
      employeeSalaries[empId].totalEmployeeEPF += employeeEPF;
      employeeSalaries[empId].totalEmployerEPF += Math.round(basicSalary * 0.12);
      employeeSalaries[empId].totalEmployerETF += Math.round(basicSalary * 0.03);
      employeeSalaries[empId].payrollCount++;
    });

    const topEmployees = Object.values(employeeSalaries)
      .filter(emp => emp.employeeName && emp.employeeName !== 'Unknown' && emp.totalGross > 0)
      .map(emp => ({
        ...emp,
        averageGross: emp.payrollCount > 0 ? emp.totalGross / emp.payrollCount : 0
      }))
      .sort((a, b) => b.totalGross - a.totalGross)
      .slice(0, 10);

    console.log('🏆 Top employees calculated:', topEmployees.length);

    const analyticsResult = {
      summary: {
        totalEmployees,
        totalPayrolls,
        totalGrossSalary,
        totalNetSalary,
        totalDeductions,
        totalBonuses,
        avgGrossSalary,
        avgNetSalary,
        totalEmployeeEPF,
        totalEmployerEPF,
        totalEmployerETF,
        totalEmployerContributions,
        totalCompanyPayrollExpense
      },
      statusBreakdown,
      monthlyTrends: monthlyTrendsArray,
      salaryRanges,
      topEmployees,
      costBreakdown: {
        grossSalary: totalGrossSalary,
        bonuses: totalBonuses,
        deductions: totalDeductions,
        employeeEPF: totalEmployeeEPF,
        employerEPF: totalEmployerEPF,
        employerETF: totalEmployerETF
      }
    };

    console.log('✅ Analytics calculation complete:', analyticsResult.summary);
    setAnalytics(analyticsResult);
  };

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    setError('');
    try {
      await initializeAnalytics();
      console.log("✅ Payroll analytics refreshed");
    } catch (error) {
      setError("Failed to refresh data: " + error.message);
    }
  };

  // Get unique employees for filter
  const uniqueEmployees = [...new Map(payrolls
    .filter(p => p.employeeId && p.employeeName)
    .map(p => [p.employeeId, { id: p.employeeId, name: p.employeeName }])
  ).values()];

  if (loading) {
    return (
      <div className="healx-tpv-wrapper">
        <div className="healx-tpv-loading-container">
          <div className="healx-tpv-loading-spinner">
            <div className="healx-tpv-spinner-ring"></div>
            <div className="healx-tpv-spinner-ring"></div>
            <div className="healx-tpv-spinner-ring"></div>
          </div>
          <div className="healx-tpv-loading-content">
            <h2>Loading Payroll Analytics</h2>
            <p>Calculating comprehensive payroll insights...</p>
          </div>
        </div>
      </div>
    );
  }

  // Chart data preparation with null checks
  const statusPieData = analytics?.statusBreakdown 
    ? Object.entries(analytics.statusBreakdown).map(([status, count]) => ({
        name: status,
        value: safeFormat(count)
      }))
    : [];

  const salaryDistributionData = analytics?.salaryRanges
    ? Object.entries(analytics.salaryRanges).map(([range, count]) => ({
        range,
        count: safeFormat(count)
      }))
    : [];

  const monthlyTrendData = analytics?.monthlyTrends || [];

  const epfEtfBreakdownData = analytics?.costBreakdown
    ? [
        { 
          name: "Employee EPF (8%)", 
          value: safeFormat(analytics.costBreakdown.employeeEPF), 
          color: "#f59e0b",
          description: "Deducted from employee salary"
        },
        { 
          name: "Employer EPF (12%)", 
          value: safeFormat(analytics.costBreakdown.employerEPF), 
          color: "#10b981",
          description: "Company expense"
        },
        { 
          name: "Employer ETF (3%)", 
          value: safeFormat(analytics.costBreakdown.employerETF), 
          color: "#3b82f6",
          description: "Company expense"
        }
      ]
    : [];

  const costBreakdownData = analytics?.costBreakdown
    ? [
        { name: "Base Salaries", value: safeFormat(analytics.costBreakdown.grossSalary), color: "#667eea" },
        { name: "Bonuses", value: safeFormat(analytics.costBreakdown.bonuses), color: "#10b981" },
        { name: "Deductions", value: safeFormat(analytics.costBreakdown.deductions), color: "#ef4444" }
      ]
    : [];

  return (
    <div className="healx-tpv-wrapper">
      {/* Header */}
      <div className="healx-tpv-header">
        <div className="healx-tpv-header-container">
          <div className="healx-tpv-header-top">
            <div className="healx-tpv-header-brand">
              <h1 className="healx-tpv-header-title">
                <span className="healx-tpv-title-icon">📊</span>
                Payroll Analytics
              </h1>
              <p className="healx-tpv-header-subtitle">
                Comprehensive payroll insights with accurate EPF/ETF calculations
              </p>
            </div>
            <div className="healx-tpv-header-actions">
              <button 
                className="healx-tpv-btn healx-tpv-btn-secondary" 
                onClick={refreshData}
                disabled={loading}
              >
                <i className="fas fa-sync-alt"></i>
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
              <button 
                className="healx-tpv-btn healx-tpv-btn-primary" 
                onClick={() => navigate("/admin/financial/payrolls")}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Payrolls
              </button>
            </div>
          </div>
          
          {/* KPI Section */}
          <div className="healx-tpv-kpi-section">
            <div className="healx-tpv-kpi-primary healx-tpv-kpi-success">
              <div className="healx-tpv-kpi-label">Total Company Payroll Expense</div>
              <div className="healx-tpv-kpi-value">
                LKR {formatCurrency(analytics?.summary?.totalCompanyPayrollExpense)}
              </div>
              <div className="healx-tpv-kpi-status">Company Expense</div>
            </div>
            
            <div className="healx-tpv-kpi-metrics">
              <div className="healx-tpv-kpi-item">
                <div className="healx-tpv-kpi-item-label">Employees</div>
                <div className="healx-tpv-kpi-item-value positive">
                  {analytics?.summary?.totalEmployees || 0}
                </div>
              </div>
              <div className="healx-tpv-kpi-item">
                <div className="healx-tpv-kpi-item-label">Payrolls</div>
                <div className="healx-tpv-kpi-item-value">
                  {analytics?.summary?.totalPayrolls || 0}
                </div>
              </div>
              <div className="healx-tpv-kpi-item">
                <div className="healx-tpv-kpi-item-label">Avg Salary</div>
                <div className="healx-tpv-kpi-item-value positive">
                  LKR {formatCurrency(analytics?.summary?.avgGrossSalary)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="healx-tpv-message healx-tpv-message-error">
          <span className="healx-tpv-message-icon">⚠️</span>
          <span className="healx-tpv-message-text">{error}</span>
          <button className="healx-tpv-message-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="healx-tpv-main">
        {/* Filters */}
        <div className="healx-tpv-filters-section">
          <div className="healx-tpv-filters">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="healx-tpv-select"
            >
              <option value="">All Months</option>
              {['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
                .map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="healx-tpv-select"
            >
              <option value="">All Years</option>
              {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="healx-tpv-select"
            >
              <option value="">All Employees</option>
              {uniqueEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
              ))}
            </select>
          </div>

          <div className="healx-tpv-view-tabs">
            <button 
              className={`healx-tpv-btn healx-tpv-btn-ghost ${viewType === 'overview' ? 'active' : ''}`}
              onClick={() => setViewType('overview')}
            >
              Overview
            </button>
            <button 
              className={`healx-tpv-btn healx-tpv-btn-ghost ${viewType === 'trends' ? 'active' : ''}`}
              onClick={() => setViewType('trends')}
            >
              Trends
            </button>
            <button 
              className={`healx-tpv-btn healx-tpv-btn-ghost ${viewType === 'employee' ? 'active' : ''}`}
              onClick={() => setViewType('employee')}
            >
              Employees
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        {analytics && (
          <>
            <div className="healx-tpv-overview">
              <div className="healx-tpv-overview-grid">
                <div className="healx-tpv-overview-card healx-tpv-revenue-card">
                  <div className="healx-tpv-card-header">
                    <div className="healx-tpv-card-icon">💰</div>
                    <div className="healx-tpv-card-trend healx-tpv-trend-positive">Active</div>
                  </div>
                  <div className="healx-tpv-card-content">
                    <div className="healx-tpv-card-value">
                      LKR {formatCurrency(analytics.summary?.totalGrossSalary)}
                    </div>
                    <div className="healx-tpv-card-label">Total Gross Salary</div>
                    <div className="healx-tpv-card-details">
                      <span>Average: LKR {formatCurrency(analytics.summary?.avgGrossSalary)}</span>
                    </div>
                  </div>
                </div>

                <div className="healx-tpv-overview-card healx-tpv-expenses-card">
                  <div className="healx-tpv-card-header">
                    <div className="healx-tpv-card-icon">💵</div>
                    <div className="healx-tpv-card-trend healx-tpv-trend-positive">Net</div>
                  </div>
                  <div className="healx-tpv-card-content">
                    <div className="healx-tpv-card-value">
                      LKR {formatCurrency(analytics.summary?.totalNetSalary)}
                    </div>
                    <div className="healx-tpv-card-label">Total Net Salary</div>
                    <div className="healx-tpv-card-details">
                      <span>Average: LKR {formatCurrency(analytics.summary?.avgNetSalary)}</span>
                    </div>
                  </div>
                </div>

                <div className="healx-tpv-overview-card healx-tpv-profit-card">
                  <div className="healx-tpv-card-header">
                    <div className="healx-tpv-card-icon">🏢</div>
                    <div className="healx-tpv-card-trend healx-tpv-trend-positive">EPF</div>
                  </div>
                  <div className="healx-tpv-card-content">
                    <div className="healx-tpv-card-value">
                      LKR {formatCurrency(analytics.summary?.totalEmployerEPF)}
                    </div>
                    <div className="healx-tpv-card-label">Employer EPF (12%)</div>
                    <div className="healx-tpv-card-details">
                      <span>Company Expense</span>
                    </div>
                  </div>
                </div>

                <div className="healx-tpv-overview-card healx-tpv-loss-card">
                  <div className="healx-tpv-card-header">
                    <div className="healx-tpv-card-icon">🏦</div>
                    <div className="healx-tpv-card-trend healx-tpv-trend-positive">ETF</div>
                  </div>
                  <div className="healx-tpv-card-content">
                    <div className="healx-tpv-card-value">
                      LKR {formatCurrency(analytics.summary?.totalEmployerETF)}
                    </div>
                    <div className="healx-tpv-card-label">Employer ETF (3%)</div>
                    <div className="healx-tpv-card-details">
                      <span>Company Expense</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="healx-tpv-charts">
              {viewType === 'overview' && (
                <div className="healx-tpv-charts-section">
                  {/* First row - Pie Charts */}
                  <div className="healx-tpv-charts-row">
                    <div className="healx-tpv-chart-container healx-tpv-chart-large">
                      <div className="healx-tpv-chart-header">
                        <h3 className="healx-tpv-chart-title">
                          <span className="healx-tpv-chart-icon">📊</span>
                          Payroll Status Distribution
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            dataKey="value"
                            label={({name, value}) => `${name}: ${value}`}
                          >
                            {statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PAYROLL_COLORS[index % PAYROLL_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="healx-tpv-chart-container healx-tpv-chart-large">
                      <div className="healx-tpv-chart-header">
                        <h3 className="healx-tpv-chart-title">
                          <span className="healx-tpv-chart-icon">💰</span>
                          Salary Distribution
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={salaryDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#667eea" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Second row - More Pie Charts */}
                  <div className="healx-tpv-charts-row">
                    <div className="healx-tpv-chart-container healx-tpv-chart-large">
                      <div className="healx-tpv-chart-header">
                        <h3 className="healx-tpv-chart-title">
                          <span className="healx-tpv-chart-icon">🏦</span>
                          EPF/ETF Breakdown
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <PieChart>
                          <Pie
                            data={epfEtfBreakdownData}
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            dataKey="value"
                            label={({name, value}) => `${name}: LKR ${formatCurrency(value)}`}
                          >
                            {epfEtfBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `LKR ${formatCurrency(value)}`, 
                              `${name} - ${props.payload.description}`
                            ]} 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="healx-tpv-chart-container healx-tpv-chart-large">
                      <div className="healx-tpv-chart-header">
                        <h3 className="healx-tpv-chart-title">
                          <span className="healx-tpv-chart-icon">💸</span>
                          Cost Breakdown
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <PieChart>
                          <Pie
                            data={costBreakdownData}
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            dataKey="value"
                            label={({name, value}) => `${name}: LKR ${formatCurrency(value)}`}
                          >
                            {costBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || PAYROLL_COLORS[index % PAYROLL_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`LKR ${formatCurrency(value)}`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {viewType === 'trends' && (
                <div className="healx-tpv-charts-section">
                  {/* Full width trend chart */}
                  <div className="healx-tpv-chart-container healx-tpv-chart-full-width">
                    <div className="healx-tpv-chart-header">
                      <h3 className="healx-tpv-chart-title">
                        <span className="healx-tpv-chart-icon">📈</span>
                        Monthly Salary Trends
                      </h3>
                    </div>
                    <ResponsiveContainer width="100%" height={500}>
                      <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `LKR ${formatCurrency(value)}`} />
                        <Tooltip formatter={(value) => [`LKR ${formatCurrency(value)}`, '']} />
                        <Legend />
                        <Line type="monotone" dataKey="totalGross" stroke="#667eea" strokeWidth={3} name="Gross Salary" />
                        <Line type="monotone" dataKey="totalNet" stroke="#10b981" strokeWidth={3} name="Net Salary" />
                        <Line type="monotone" dataKey="totalCompanyExpense" stroke="#ef4444" strokeWidth={3} name="Company Expense" />
                        <Line type="monotone" dataKey="totalBonuses" stroke="#f59e0b" strokeWidth={2} name="Bonuses" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Second row - Bar charts */}
                  <div className="healx-tpv-charts-row">
                    <div className="healx-tpv-chart-container healx-tpv-chart-large">
                      <div className="healx-tpv-chart-header">
                        <h3 className="healx-tpv-chart-title">
                          <span className="healx-tpv-chart-icon">🏢</span>
                          Monthly EPF/ETF Contributions
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `LKR ${formatCurrency(value)}`} />
                          <Tooltip formatter={(value) => [`LKR ${formatCurrency(value)}`, '']} />
                          <Legend />
                          <Bar dataKey="totalEmployeeEPF" fill="#f59e0b" name="Employee EPF (8%)" />
                          <Bar dataKey="totalEmployerEPF" fill="#10b981" name="Employer EPF (12%)" />
                          <Bar dataKey="totalEmployerETF" fill="#3b82f6" name="Employer ETF (3%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="healx-tpv-chart-container healx-tpv-chart-large">
                      <div className="healx-tpv-chart-header">
                        <h3 className="healx-tpv-chart-title">
                          <span className="healx-tpv-chart-icon">👥</span>
                          Employee Count by Month
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="employeeCount" fill="#764ba2" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {viewType === 'employee' && (
                <div className="healx-tpv-insights">
                  <div className="healx-tpv-insights-header">
                    <h2 className="healx-tpv-insights-title">
                      <span className="healx-tpv-insights-icon">👥</span>
                      Employee Analysis
                    </h2>
                    <p className="healx-tpv-insights-subtitle">
                      Top performers and payroll distribution insights
                    </p>
                  </div>

                  <div className="healx-tpv-insights-grid">
                    {analytics.topEmployees && analytics.topEmployees.length > 0 ? (
                      analytics.topEmployees.slice(0, 6).map((emp, index) => (
                        <div key={emp.employeeId} className="healx-tpv-insight-card healx-tpv-insight-success">
                          <div className="healx-tpv-insight-header">
                            <div className="healx-tpv-insight-badge">
                              <div className="healx-tpv-insight-category">Rank #{index + 1}</div>
                              <div className="healx-tpv-insight-priority healx-tpv-priority-high">Top Performer</div>
                            </div>
                            <div className="healx-tpv-insight-icon">🏆</div>
                          </div>
                          <div className="healx-tpv-insight-content">
                            <h4>{emp.employeeName || 'N/A'}</h4>
                            <p className="healx-tpv-insight-message">
                              Employee ID: {emp.employeeId || 'N/A'}
                            </p>
                            <div className="healx-tpv-insight-recommendation">
                              <strong>Total Gross:</strong> LKR {formatCurrency(emp.totalGross)}<br/>
                              <strong>Average:</strong> LKR {formatCurrency(emp.averageGross)}<br/>
                              <strong>Payrolls:</strong> {emp.payrollCount || 0}<br/>
                              <strong>Employee EPF:</strong> LKR {formatCurrency(emp.totalEmployeeEPF)}<br/>
                              <strong>Employer EPF:</strong> LKR {formatCurrency(emp.totalEmployerEPF)}<br/>
                              <strong>Employer ETF:</strong> LKR {formatCurrency(emp.totalEmployerETF)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="healx-tpv-insight-card healx-tpv-insight-info">
                        <div className="healx-tpv-insight-header">
                          <div className="healx-tpv-insight-badge">
                            <div className="healx-tpv-insight-category">No Data</div>
                            <div className="healx-tpv-insight-priority healx-tpv-priority-low">Info</div>
                          </div>
                          <div className="healx-tpv-insight-icon">📊</div>
                        </div>
                        <div className="healx-tpv-insight-content">
                          <h4>No Employee Data Available</h4>
                          <p className="healx-tpv-insight-message">
                            Add some payroll records to see employee rankings and analysis.
                          </p>
                          <div className="healx-tpv-insight-recommendation">
                            <strong>Next Steps:</strong> Create payroll records to view comprehensive employee analytics and EPF/ETF insights.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!analytics && !loading && (
          <div className="healx-tpv-insights">
            <div className="healx-tpv-insights-header">
              <h2 className="healx-tpv-insights-title">
                <span className="healx-tpv-insights-icon">📊</span>
                No Data Available
              </h2>
              <p className="healx-tpv-insights-subtitle">
                Create some payroll records to see comprehensive analytics
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="healx-tpv-footer">
        <div className="healx-tpv-footer-container">
          <div className="healx-tpv-footer-info">
            <p>HealX Payroll Analytics</p>
            <p>Real-time payroll insights with accurate EPF/ETF calculations</p>
          </div>
          <div className="healx-tpv-footer-actions">
            <button 
              className="healx-tpv-btn healx-tpv-btn-primary"
              onClick={() => navigate("/admin/financial")}
            >
              Financial Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalPayrollView;
