import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import "./TotalPayrollView.css";

const PAYROLL_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];
const API_URL = "http://localhost:7000/api/payrolls";

const TotalPayrollView = () => {
  const [admin, setAdmin] = useState(null);
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

  // ✅ SAFE NUMBER FORMATTING HELPER
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

  // ✅ CORRECTED: Fetch payroll data with proper error handling
  const fetchPayrolls = async () => {
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.append('payrollMonth', filterMonth);
      if (filterYear) params.append('payrollYear', filterYear);
      params.append('limit', '1000'); // Get all records for analytics

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
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

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

  // ✅ FIXED: Calculate analytics using ACTUAL DATABASE VALUES
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

    // ✅ BASIC CALCULATIONS using ACTUAL database values
    const totalEmployees = new Set(filteredPayrolls.map(p => p.employeeId)).size;
    const totalPayrolls = filteredPayrolls.length;
    
    const totalGrossSalary = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.grossSalary), 0);
    const totalNetSalary = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.netSalary), 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.deductions), 0);
    const totalBonuses = filteredPayrolls.reduce((sum, p) => sum + safeFormat(p.bonuses), 0);

    // ✅ CORRECT EPF/ETF CALCULATIONS using database values AND recalculated values
    // Employee EPF (8%) - Use database value if available, otherwise calculate
    const totalEmployeeEPF = filteredPayrolls.reduce((sum, p) => {
      // Try to use database EPF value first, fallback to calculation
      const dbEPF = safeFormat(p.epf);
      const calculatedEPF = Math.round(safeFormat(p.grossSalary) * 0.08);
      return sum + (dbEPF > 0 ? dbEPF : calculatedEPF);
    }, 0);

    // Employer EPF (12%) - Always calculate as this might not be stored in DB
    const totalEmployerEPF = filteredPayrolls.reduce((sum, p) => {
      const basicSalary = safeFormat(p.grossSalary);
      return sum + Math.round(basicSalary * 0.12);
    }, 0);

    // Employer ETF (3%) - Always calculate as this might not be stored in DB
    const totalEmployerETF = filteredPayrolls.reduce((sum, p) => {
      const basicSalary = safeFormat(p.grossSalary);
      return sum + Math.round(basicSalary * 0.03);
    }, 0);

    // Total employer contributions (company expense)
    const totalEmployerContributions = totalEmployerEPF + totalEmployerETF;

    // ✅ CORRECT: Total company payroll expense
    const totalCompanyPayrollExpense = totalGrossSalary + totalBonuses + totalEmployerEPF + totalEmployerETF;

    console.log('💰 Calculated totals:', {
      totalGrossSalary: totalGrossSalary.toLocaleString(),
      totalNetSalary: totalNetSalary.toLocaleString(),
      totalEmployeeEPF: totalEmployeeEPF.toLocaleString(),
      totalEmployerEPF: totalEmployerEPF.toLocaleString(),
      totalEmployerETF: totalEmployerETF.toLocaleString(),
      totalCompanyExpense: totalCompanyPayrollExpense.toLocaleString()
    });

    // ✅ SAFE Average calculations
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

    // Convert monthly trends to array
    const monthlyTrendsArray = Object.values(monthlyTrends).map(trend => ({
      ...trend,
      employeeCount: trend.employeeCount.size
    }));

    // ✅ SAFE Salary distribution
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

    // ✅ SAFE Top employees calculation with correct EPF/ETF breakdown
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

    // Calculate averages and sort
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

  // ✅ SAFE Get unique employees for filter
  const uniqueEmployees = [...new Map(payrolls
    .filter(p => p.employeeId && p.employeeName)
    .map(p => [p.employeeId, { id: p.employeeId, name: p.employeeName }])
  ).values()];

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Payroll Analytics">
        <div className="tpv-loading">
          <div>Loading comprehensive payroll analytics...</div>
          <div className="tpv-loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  // ✅ SAFE Chart data preparation with null checks
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

  // ✅ UPDATED: EPF/ETF breakdown chart with correct values
  const epfEtfBreakdownData = analytics?.costBreakdown
    ? [
        { 
          name: "Employee EPF (8%)", 
          value: safeFormat(analytics.costBreakdown.employeeEPF), 
          color: "#ffc107",
          description: "Deducted from employee salary"
        },
        { 
          name: "Employer EPF (12%)", 
          value: safeFormat(analytics.costBreakdown.employerEPF), 
          color: "#28a745",
          description: "Company expense"
        },
        { 
          name: "Employer ETF (3%)", 
          value: safeFormat(analytics.costBreakdown.employerETF), 
          color: "#17a2b8",
          description: "Company expense"
        }
      ]
    : [];

  const costBreakdownData = analytics?.costBreakdown
    ? [
        { name: "Base Salaries", value: safeFormat(analytics.costBreakdown.grossSalary), color: "#0088FE" },
        { name: "Bonuses", value: safeFormat(analytics.costBreakdown.bonuses), color: "#00C49F" },
        { name: "Deductions", value: safeFormat(analytics.costBreakdown.deductions), color: "#FF8042" }
      ]
    : [];

  return (
    <AdminLayout admin={admin} title="Payroll Analytics">
      <div className="tpv-container">
        <div className="tpv-header">
          <div className="tpv-header-content">
            <h1>📊 Total Payroll Analytics</h1>
            <p>Comprehensive payroll insights with accurate EPF/ETF calculations</p>
          </div>
          <div className="tpv-header-actions">
            <button 
              className="tpv-refresh-btn" 
              onClick={refreshData}
              disabled={loading}
            >
              {loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}
            </button>
            <button 
              className="tpv-back-btn" 
              onClick={() => navigate("/admin/financial/payrolls")}
            >
              ← Back to Payroll Management
            </button>
          </div>
        </div>

        {error && <div className="tpv-error-banner">⚠️ {error}</div>}

        {/* Filters */}
        <div className="tpv-filters">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="tpv-filter-select"
          >
            <option value="">📅 All Months</option>
            {['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
              .map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="tpv-filter-select"
          >
            <option value="">📅 All Years</option>
            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="tpv-filter-select"
          >
            <option value="">👤 All Employees</option>
            {uniqueEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
            ))}
          </select>

          <div className="tpv-view-tabs">
            <button 
              className={`tpv-tab ${viewType === 'overview' ? 'active' : ''}`}
              onClick={() => setViewType('overview')}
            >
              📈 Overview
            </button>
            <button 
              className={`tpv-tab ${viewType === 'trends' ? 'active' : ''}`}
              onClick={() => setViewType('trends')}
            >
              📊 Trends
            </button>
            <button 
              className={`tpv-tab ${viewType === 'employee' ? 'active' : ''}`}
              onClick={() => setViewType('employee')}
            >
              👥 Employees
            </button>
          </div>
        </div>

        {/* ✅ CONDITIONAL RENDERING: Only render if analytics exists */}
        {analytics && (
          <>
            {/* ✅ CORRECTED Summary Stats with accurate EPF/ETF values */}
            <div className="tpv-stats-grid">
              <div className="tpv-stat-card tpv-primary">
                <div className="tpv-stat-icon">👥</div>
                <div className="tpv-stat-info">
                  <h3>{analytics.summary?.totalEmployees || 0}</h3>
                  <p>Total Employees</p>
                  <small>{analytics.summary?.totalPayrolls || 0} payroll records</small>
                </div>
              </div>

              <div className="tpv-stat-card tpv-success">
                <div className="tpv-stat-icon">💰</div>
                <div className="tpv-stat-info">
                  <h3>LKR {formatCurrency(analytics.summary?.totalGrossSalary)}</h3>
                  <p>Total Gross Salary</p>
                  <small>Avg: LKR {formatCurrency(analytics.summary?.avgGrossSalary)}</small>
                </div>
              </div>

              <div className="tpv-stat-card tpv-info">
                <div className="tpv-stat-icon">💵</div>
                <div className="tpv-stat-info">
                  <h3>LKR {formatCurrency(analytics.summary?.totalNetSalary)}</h3>
                  <p>Total Net Salary</p>
                  <small>Avg: LKR {formatCurrency(analytics.summary?.avgNetSalary)}</small>
                </div>
              </div>

              {/* ✅ ACCURATE Employee EPF Card */}
              <div className="tpv-stat-card" style={{
                background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
                color: 'white'
              }}>
                <div className="tpv-stat-icon" style={{ color: 'white' }}>👤</div>
                <div className="tpv-stat-info">
                  <h3 style={{ color: 'white' }}>LKR {formatCurrency(analytics.summary?.totalEmployeeEPF)}</h3>
                  <p style={{ color: 'white' }}>Employee EPF (8%)</p>
                  <small style={{ color: 'rgba(255,255,255,0.9)' }}>Deducted from salaries</small>
                </div>
              </div>

              {/* ✅ ACCURATE Employer EPF Card */}
              <div className="tpv-stat-card" style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white'
              }}>
                <div className="tpv-stat-icon" style={{ color: 'white' }}>🏢</div>
                <div className="tpv-stat-info">
                  <h3 style={{ color: 'white' }}>LKR {formatCurrency(analytics.summary?.totalEmployerEPF)}</h3>
                  <p style={{ color: 'white' }}>Employer EPF (12%)</p>
                  <small style={{ color: 'rgba(255,255,255,0.9)' }}>Company expense</small>
                </div>
              </div>

              {/* ✅ ACCURATE Employer ETF Card */}
              <div className="tpv-stat-card" style={{
                background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                color: 'white'
              }}>
                <div className="tpv-stat-icon" style={{ color: 'white' }}>🏦</div>
                <div className="tpv-stat-info">
                  <h3 style={{ color: 'white' }}>LKR {formatCurrency(analytics.summary?.totalEmployerETF)}</h3>
                  <p style={{ color: 'white' }}>Employer ETF (3%)</p>
                  <small style={{ color: 'rgba(255,255,255,0.9)' }}>Company expense</small>
                </div>
              </div>

              {/* ✅ ACCURATE Total Company Expense Card */}
              <div className="tpv-stat-card" style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                color: 'white',
                gridColumn: 'span 2'
              }}>
                <div className="tpv-stat-icon" style={{ color: 'white' }}>🏭</div>
                <div className="tpv-stat-info">
                  <h3 style={{ color: 'white', fontSize: '1.8rem' }}>LKR {formatCurrency(analytics.summary?.totalCompanyPayrollExpense)}</h3>
                  <p style={{ color: 'white' }}>Total Company Payroll Expense</p>
                  <small style={{ color: 'rgba(255,255,255,0.9)' }}>
                    Base Salaries + Bonuses + Employer EPF (12%) + Employer ETF (3%)
                  </small>
                </div>
              </div>
            </div>

            {/* Charts based on view type */}
            {viewType === 'overview' && (
              <div className="tpv-charts-grid">
                <div className="tpv-chart-card">
                  <h3>📊 Payroll Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
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

                <div className="tpv-chart-card">
                  <h3>💰 Salary Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salaryDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ✅ CORRECTED EPF/ETF Breakdown Chart */}
                <div className="tpv-chart-card tpv-full-width">
                  <h3>🏦 EPF/ETF Contribution Breakdown</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={epfEtfBreakdownData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
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

                <div className="tpv-chart-card">
                  <h3>💸 Salary & Benefits Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
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
            )}

            {viewType === 'trends' && (
              <div className="tpv-charts-grid">
                <div className="tpv-chart-card tpv-full-width">
                  <h3>📈 Monthly Salary & Company Expense Trends</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `LKR ${formatCurrency(value)}`} />
                      <Tooltip formatter={(value) => [`LKR ${formatCurrency(value)}`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="totalGross" stroke="#0088FE" strokeWidth={3} name="Gross Salary" />
                      <Line type="monotone" dataKey="totalNet" stroke="#00C49F" strokeWidth={3} name="Net Salary" />
                      <Line type="monotone" dataKey="totalCompanyExpense" stroke="#FF8042" strokeWidth={3} name="Total Company Expense" />
                      <Line type="monotone" dataKey="totalBonuses" stroke="#FFBB28" strokeWidth={2} name="Bonuses" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="tpv-chart-card">
                  <h3>🏢 Monthly EPF/ETF Contributions</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `LKR ${formatCurrency(value)}`} />
                      <Tooltip formatter={(value) => [`LKR ${formatCurrency(value)}`, '']} />
                      <Legend />
                      <Bar dataKey="totalEmployeeEPF" fill="#ffc107" name="Employee EPF (8%)" />
                      <Bar dataKey="totalEmployerEPF" fill="#28a745" name="Employer EPF (12%)" />
                      <Bar dataKey="totalEmployerETF" fill="#17a2b8" name="Employer ETF (3%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="tpv-chart-card">
                  <h3>👥 Employee Count by Month</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="employeeCount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewType === 'employee' && (
              <div className="tpv-employee-section">
                <div className="tpv-chart-card">
                  <h3>🏆 Top 5 Employees by Gross Salary</h3>
                  {analytics.topEmployees && analytics.topEmployees.length > 0 ? (
                    <div className="tpv-employee-list">
                      {analytics.topEmployees.slice(0, 5).map((emp, index) => (
                        <div key={emp.employeeId} className="tpv-employee-item">
                          <div className="tpv-employee-rank">
                            <span className={`tpv-rank-badge rank-${index + 1}`}>
                              #{index + 1}
                            </span>
                          </div>
                          <div className="tpv-employee-info">
                            <h4>{emp.employeeName || 'N/A'}</h4>
                            <p>ID: {emp.employeeId || 'N/A'}</p>
                          </div>
                          <div className="tpv-employee-salary">
                            <div className="tpv-gross-salary">
                              <strong>LKR {formatCurrency(emp.totalGross)}</strong>
                              <span>Total Gross</span>
                            </div>
                            <div className="tpv-avg-salary">
                              <span>LKR {formatCurrency(emp.averageGross)}</span>
                              <small>Avg per month</small>
                            </div>
                            <div className="tpv-contributions">
                              <div style={{ fontSize: '10px', color: '#ffc107' }}>
                                Employee EPF: LKR {formatCurrency(emp.totalEmployeeEPF)}
                              </div>
                              <div style={{ fontSize: '10px', color: '#28a745' }}>
                                Employer EPF: LKR {formatCurrency(emp.totalEmployerEPF)}
                              </div>
                              <div style={{ fontSize: '10px', color: '#17a2b8' }}>
                                Employer ETF: LKR {formatCurrency(emp.totalEmployerETF)}
                              </div>
                            </div>
                          </div>
                          <div className="tpv-salary-bar">
                            <div 
                              className="tpv-salary-progress"
                              style={{
                                width: `${analytics.topEmployees.length > 0 ? 
                                  (safeFormat(emp.totalGross) / Math.max(...analytics.topEmployees.map(e => safeFormat(e.totalGross)))) * 100 : 0}%`,
                                backgroundColor: PAYROLL_COLORS[index % PAYROLL_COLORS.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tpv-no-data">
                      <div style={{ 
                        height: '200px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: '16px',
                        flexDirection: 'column'
                      }}>
                        <div>📊 No employee salary data available</div>
                        <small style={{ marginTop: '10px', color: '#999' }}>
                          Add some payroll records to see employee rankings
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ CORRECTED Employee table with accurate EPF/ETF breakdown */}
                <div className="tpv-employee-table">
                  <h3>👥 Employee Salary & Contribution Summary</h3>
                  <div className="tpv-table-container">
                    <table className="tpv-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Employee ID</th>
                          <th>Employee Name</th>
                          <th>Total Gross</th>
                          <th>Total Net</th>
                          <th>Employee EPF (8%)</th>
                          <th>Employer EPF (12%)</th>
                          <th>Employer ETF (3%)</th>
                          <th>Payroll Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topEmployees && analytics.topEmployees.length > 0 ? (
                          analytics.topEmployees.map((emp, index) => (
                            <tr key={emp.employeeId || index}>
                              <td>
                                <span className={`tpv-table-rank rank-${index + 1}`}>
                                  #{index + 1}
                                </span>
                              </td>
                              <td><strong>{emp.employeeId || 'N/A'}</strong></td>
                              <td>{emp.employeeName || 'N/A'}</td>
                              <td className="tpv-currency">LKR {formatCurrency(emp.totalGross)}</td>
                              <td className="tpv-currency">LKR {formatCurrency(emp.totalNet)}</td>
                              <td className="tpv-currency" style={{ color: '#ffc107' }}>
                                LKR {formatCurrency(emp.totalEmployeeEPF)}
                              </td>
                              <td className="tpv-currency" style={{ color: '#28a745' }}>
                                LKR {formatCurrency(emp.totalEmployerEPF)}
                              </td>
                              <td className="tpv-currency" style={{ color: '#17a2b8' }}>
                                LKR {formatCurrency(emp.totalEmployerETF)}
                              </td>
                              <td className="tpv-center">{emp.payrollCount || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                              <div>📋 No employee salary data available</div>
                              <small style={{ display: 'block', marginTop: '10px', color: '#999' }}>
                                Create some payroll records to see employee statistics
                              </small>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="tpv-quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="tpv-actions-grid">
                <button 
                  className="tpv-action-btn tpv-primary"
                  onClick={() => navigate("/admin/financial/payrolls")}
                >
                  📋 Manage Payrolls
                </button>
                <button 
                  className="tpv-action-btn tpv-success"
                  onClick={() => {
                    if (analytics?.topEmployees && analytics.topEmployees.length > 0) {
                      const csvData = analytics.topEmployees.map(emp => 
                        `${emp.employeeId || ''},${emp.employeeName || ''},${safeFormat(emp.totalGross)},${safeFormat(emp.totalNet)},${safeFormat(emp.totalEmployeeEPF)},${safeFormat(emp.totalEmployerEPF)},${safeFormat(emp.totalEmployerETF)},${emp.payrollCount || 0}`
                      ).join('\n');
                      const blob = new Blob([`Employee ID,Name,Total Gross,Total Net,Employee EPF (8%),Employer EPF (12%),Employer ETF (3%),Payroll Count\n${csvData}`], 
                        { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `payroll-analytics-accurate-epf-etf-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    } else {
                      alert('No data available to export');
                    }
                  }}
                >
                  📊 Export Accurate EPF/ETF Analytics
                </button>
                <button 
                  className="tpv-action-btn tpv-info"
                  onClick={() => navigate("/admin/financial")}
                >
                  🏠 Financial Manager Dashboard
                </button>
              </div>
            </div>
          </>
        )}

        {!analytics && !loading && (
          <div className="tpv-no-analytics">
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '60px 20px',
              fontSize: '18px'
            }}>
              <div>📊 No payroll data available for analytics</div>
              <p style={{ margin: '20px 0', color: '#999', fontSize: '14px' }}>
                Create some payroll records first to see comprehensive analytics and accurate EPF/ETF insights.
              </p>
              <button 
                className="tpv-action-btn tpv-primary"
                onClick={() => navigate("/admin/financial/payrolls")}
                style={{ marginTop: '20px' }}
              >
                📋 Go to Payroll Management
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TotalPayrollView;
