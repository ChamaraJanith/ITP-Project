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
  const [viewType, setViewType] = useState("overview"); // overview, employee, department, trends
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (payrolls.length > 0) {
      calculateAnalytics();
    }
  }, [payrolls, filterMonth, filterYear, selectedEmployee]);

  // Fetch real payroll data
  const fetchPayrolls = async () => {
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.append('payrollMonth', filterMonth);
      if (filterYear) params.append('payrollYear', filterYear);
      params.append('limit', '1000'); // Get all records for analytics

      const response = await fetch(`${API_URL}?${params}`);
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        return data.success ? data.data || [] : [];
      } catch {
        console.error("Raw response:", text);
        throw new Error("Invalid JSON response");
      }
    } catch (error) {
      console.error("Error fetching payrolls:", error);
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
      setPayrolls(payrollData);
      
    } catch (error) {
      console.error("❌ Error loading payroll analytics:", error);
      setError("Failed to load payroll analytics");
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive analytics
  const calculateAnalytics = () => {
    if (!payrolls || payrolls.length === 0) {
      setAnalytics(null);
      return;
    }

    let filteredPayrolls = [...payrolls];

    // Apply filters
    if (filterMonth) {
      filteredPayrolls = filteredPayrolls.filter(p => p.payrollMonth === filterMonth);
    }
    if (filterYear) {
      filteredPayrolls = filteredPayrolls.filter(p => p.payrollYear.toString() === filterYear);
    }
    if (selectedEmployee) {
      filteredPayrolls = filteredPayrolls.filter(p => p.employeeId === selectedEmployee);
    }

    // Basic statistics
    const totalEmployees = new Set(filteredPayrolls.map(p => p.employeeId)).size;
    const totalPayrolls = filteredPayrolls.length;
    const totalGrossSalary = filteredPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalNetSalary = filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.deductions || 0), 0);
    const totalBonuses = filteredPayrolls.reduce((sum, p) => sum + (p.bonuses || 0), 0);
    const totalEPF = filteredPayrolls.reduce((sum, p) => sum + (p.epf || 0), 0);
    const totalETF = filteredPayrolls.reduce((sum, p) => sum + (p.etf || 0), 0);

    // Average calculations
    const avgGrossSalary = totalEmployees > 0 ? totalGrossSalary / totalEmployees : 0;
    const avgNetSalary = totalEmployees > 0 ? totalNetSalary / totalEmployees : 0;

    // Status breakdown
    const statusBreakdown = {};
    filteredPayrolls.forEach(p => {
      const status = p.status || 'Pending';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Monthly trends
    const monthlyTrends = {};
    filteredPayrolls.forEach(p => {
      const key = `${p.payrollMonth} ${p.payrollYear}`;
      if (!monthlyTrends[key]) {
        monthlyTrends[key] = {
          month: p.payrollMonth,
          year: p.payrollYear,
          totalGross: 0,
          totalNet: 0,
          employeeCount: new Set(),
          totalBonuses: 0,
          totalDeductions: 0
        };
      }
      monthlyTrends[key].totalGross += (p.grossSalary || 0);
      monthlyTrends[key].totalNet += (p.netSalary || 0);
      monthlyTrends[key].totalBonuses += (p.bonuses || 0);
      monthlyTrends[key].totalDeductions += (p.deductions || 0);
      monthlyTrends[key].employeeCount.add(p.employeeId);
    });

    // Convert monthly trends to array
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
      const salary = p.grossSalary || 0;
      if (salary < 50000) salaryRanges["0-50K"]++;
      else if (salary < 100000) salaryRanges["50K-100K"]++;
      else if (salary < 150000) salaryRanges["100K-150K"]++;
      else if (salary < 200000) salaryRanges["150K-200K"]++;
      else salaryRanges["200K+"]++;
    });

    // Top employees by salary
    const employeeSalaries = {};
    filteredPayrolls.forEach(p => {
      if (!employeeSalaries[p.employeeId]) {
        employeeSalaries[p.employeeId] = {
          employeeId: p.employeeId,
          employeeName: p.employeeName,
          totalGross: 0,
          totalNet: 0,
          payrollCount: 0
        };
      }
      employeeSalaries[p.employeeId].totalGross += (p.grossSalary || 0);
      employeeSalaries[p.employeeId].totalNet += (p.netSalary || 0);
      employeeSalaries[p.employeeId].payrollCount++;
    });

    const topEmployees = Object.values(employeeSalaries)
      .sort((a, b) => b.totalGross - a.totalGross)
      .slice(0, 10);

    setAnalytics({
      summary: {
        totalEmployees,
        totalPayrolls,
        totalGrossSalary,
        totalNetSalary,
        totalDeductions,
        totalBonuses,
        totalEPF,
        totalETF,
        avgGrossSalary,
        avgNetSalary
      },
      statusBreakdown,
      monthlyTrends: monthlyTrendsArray,
      salaryRanges,
      topEmployees,
      costBreakdown: {
        grossSalary: totalGrossSalary,
        bonuses: totalBonuses,
        deductions: totalDeductions,
        epf: totalEPF,
        etf: totalETF
      }
    });
  };

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    try {
      await initializeAnalytics();
      console.log("✅ Payroll analytics refreshed");
    } catch (error) {
      setError("Failed to refresh data");
    }
  };

  // Get unique employees for filter
  const uniqueEmployees = [...new Set(payrolls.map(p => ({
    id: p.employeeId,
    name: p.employeeName
  })))];

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

  // Chart data preparation
  const statusPieData = analytics?.statusBreakdown 
    ? Object.entries(analytics.statusBreakdown).map(([status, count]) => ({
        name: status,
        value: count
      }))
    : [];

  const salaryDistributionData = analytics?.salaryRanges
    ? Object.entries(analytics.salaryRanges).map(([range, count]) => ({
        range,
        count
      }))
    : [];

  const monthlyTrendData = analytics?.monthlyTrends || [];

  const costBreakdownData = analytics?.costBreakdown
    ? [
        { name: "Gross Salary", value: analytics.costBreakdown.grossSalary },
        { name: "Bonuses", value: analytics.costBreakdown.bonuses },
        { name: "EPF (8%)", value: analytics.costBreakdown.epf },
        { name: "ETF (3%)", value: analytics.costBreakdown.etf },
      ]
    : [];

  const topEmployeesData = analytics?.topEmployees?.slice(0, 5) || [];

  return (
    <AdminLayout admin={admin} title="Payroll Analytics">
      <div className="tpv-container">
        <div className="tpv-header">
          <div className="tpv-header-content">
            <h1>📊 Total Payroll Analytics</h1>
            <p>Comprehensive payroll insights and employee salary analysis</p>
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

        {analytics && (
          <>
            {/* Summary Stats */}
            <div className="tpv-stats-grid">
              <div className="tpv-stat-card tpv-primary">
                <div className="tpv-stat-icon">👥</div>
                <div className="tpv-stat-info">
                  <h3>{analytics.summary.totalEmployees}</h3>
                  <p>Total Employees</p>
                  <small>{analytics.summary.totalPayrolls} payroll records</small>
                </div>
              </div>

              <div className="tpv-stat-card tpv-success">
                <div className="tpv-stat-icon">💰</div>
                <div className="tpv-stat-info">
                  <h3>${analytics.summary.totalGrossSalary.toLocaleString()}</h3>
                  <p>Total Gross Salary</p>
                  <small>Avg: ${Math.round(analytics.summary.avgGrossSalary).toLocaleString()}</small>
                </div>
              </div>

              <div className="tpv-stat-card tpv-info">
                <div className="tpv-stat-icon">💵</div>
                <div className="tpv-stat-info">
                  <h3>${analytics.summary.totalNetSalary.toLocaleString()}</h3>
                  <p>Total Net Salary</p>
                  <small>Avg: ${Math.round(analytics.summary.avgNetSalary).toLocaleString()}</small>
                </div>
              </div>

              <div className="tpv-stat-card tpv-warning">
                <div className="tpv-stat-icon">🏛️</div>
                <div className="tpv-stat-info">
                  <h3>${(analytics.summary.totalEPF + analytics.summary.totalETF).toLocaleString()}</h3>
                  <p>EPF + ETF Contributions</p>
                  <small>EPF: ${analytics.summary.totalEPF.toLocaleString()}</small>
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

                <div className="tpv-chart-card tpv-full-width">
                  <h3>💸 Cost Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({name, value}) => `${name}: $${value.toLocaleString()}`}
                      >
                        {costBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PAYROLL_COLORS[index % PAYROLL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewType === 'trends' && (
              <div className="tpv-charts-grid">
                <div className="tpv-chart-card tpv-full-width">
                  <h3>📈 Monthly Salary Trends</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="totalGross" stroke="#0088FE" strokeWidth={3} name="Gross Salary" />
                      <Line type="monotone" dataKey="totalNet" stroke="#00C49F" strokeWidth={3} name="Net Salary" />
                      <Line type="monotone" dataKey="totalBonuses" stroke="#FFBB28" strokeWidth={2} name="Bonuses" />
                    </LineChart>
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

                <div className="tpv-chart-card">
                  <h3>📊 Monthly Cost Analysis</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Area type="monotone" dataKey="totalDeductions" stackId="1" stroke="#FF8042" fill="#FF8042" name="Deductions" />
                      <Area type="monotone" dataKey="totalBonuses" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Bonuses" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewType === 'employee' && (
              <div className="tpv-employee-section">
                <div className="tpv-chart-card">
                  <h3>🏆 Top 5 Employees by Gross Salary</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topEmployeesData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <YAxis type="category" dataKey="employeeName" width={100} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Bar dataKey="totalGross" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="tpv-employee-table">
                  <h3>👥 Employee Salary Summary</h3>
                  <table className="tpv-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Employee Name</th>
                        <th>Total Gross</th>
                        <th>Total Net</th>
                        <th>Payroll Count</th>
                        <th>Avg Gross</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topEmployees.map((emp, index) => (
                        <tr key={emp.employeeId}>
                          <td>{emp.employeeId}</td>
                          <td>{emp.employeeName}</td>
                          <td>${emp.totalGross.toLocaleString()}</td>
                          <td>${emp.totalNet.toLocaleString()}</td>
                          <td>{emp.payrollCount}</td>
                          <td>${Math.round(emp.totalGross / emp.payrollCount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    // Export analytics data
                    const csvData = analytics.topEmployees.map(emp => 
                      `${emp.employeeId},${emp.employeeName},${emp.totalGross},${emp.totalNet},${emp.payrollCount}`
                    ).join('\n');
                    const blob = new Blob([`Employee ID,Name,Total Gross,Total Net,Payroll Count\n${csvData}`], 
                      { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payroll-analytics-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                >
                  📊 Export Analytics
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
      </div>
    </AdminLayout>
  );
};

export default TotalPayrollView;
