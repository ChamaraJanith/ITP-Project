import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import { adminDashboardApi } from "../../../services/adminApi.js";
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
} from "recharts";
import "./FinancialDashboard.css";

const FINANCIAL_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const FinancialDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBilling, setShowBilling] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      const response = await adminDashboardApi.accessFinancialDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("❌ Error loading financial dashboard:", error);
      setError("Failed to load financial dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Function to scroll to specific chart
  const scrollToFinancialChart = (chartId) => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      chartElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Handle feature button clicks
  const handleFinancialFeatureClick = (feature) => {
    switch (feature) {
      case "view_billing":
        navigate("/billing");
        break;

      case "manage_payments":
        navigate("/admin/financial/payments");
        break;

      case "Real time analytics":
         navigate("/admin/financial/payments");
        break;

      case "track_revenue":
        navigate("/revenue");
        break;

      case "payroll_processing":
        navigate("/admin/financial/payrolls");
        break;
        
      default:
        console.log("Clicked feature:", feature);
    }
  };

  // Handle analytics selection
  const handleFinancialAnalyticsSelection = (analyticsType) => {
    setShowAnalyticsModal(false);
    
    if (analyticsType === "financial") {
      navigate("admin/financial/payments/total-view");
    } else if (analyticsType === "inventory") {
      navigate("inventory-view");
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Financial Dashboard">
        <div className="fd-loading">Loading financial dashboard...</div>
      </AdminLayout>
    );
  }

  // Chart Data
  const pieData = dashboardData?.stats
    ? [
        { name: "Today's Revenue", value: dashboardData.stats.todayRevenue || 0 },
        { name: "Pending Payments", value: dashboardData.stats.pendingPayments || 0 },
        { name: "Monthly Target", value: dashboardData.stats.monthlyTarget || 0 },
      ]
    : [];

  const barData = dashboardData?.stats
    ? [
        { name: "Today", revenue: dashboardData.stats.todayRevenue || 0 },
        { name: "Pending", revenue: dashboardData.stats.pendingPayments || 0 },
        { name: "Target", revenue: dashboardData.stats.monthlyTarget || 0 },
      ]
    : [];

  const lineData = dashboardData?.stats
    ? [
        { period: "Today", amount: dashboardData.stats.todayRevenue || 0 },
        { period: "This Week", amount: dashboardData.stats.weekRevenue || 0 },
        { period: "This Month", amount: dashboardData.stats.monthRevenue || 0 },
      ]
    : [];

  const radialData = [
    {
      name: "Collection Rate",
      value: dashboardData?.stats?.collectionRate || 0,
      fill: "#10B981",
    },
  ];

  return (
    <AdminLayout admin={admin} title="Financial Dashboard">
      <div className="fd-container">
        <div className="fd-header">
          <h1>💰 Financial Manager Dashboard</h1>
          <p>Billing, payments & financial reports</p>
        </div>

        {error && <div className="fd-error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            {/* Stats Grid */}
            <div className="fd-stats-grid">
              <div className="fd-stat-card" onClick={() => scrollToFinancialChart("fd-todays-revenue-chart")}>
                <div className="fd-stat-info">
                  <h3>${dashboardData.stats?.todayRevenue?.toLocaleString() || 0}</h3>
                  <p>Today's Revenue</p>
                </div>
              </div>

              <div className="fd-stat-card" onClick={() => scrollToFinancialChart("fd-monthly-revenue-chart")}>
                <div className="fd-stat-info">
                  <h3>${dashboardData.stats?.pendingPayments?.toLocaleString() || 0}</h3>
                  <p>Pending Payments</p>
                </div>
              </div>

              <div className="fd-stat-card" onClick={() => scrollToFinancialChart("fd-pending-payments-chart")}>
                <div className="fd-stat-info">
                  <h3>${dashboardData.stats?.monthlyTarget?.toLocaleString() || 0}</h3>
                  <p>Monthly Target</p>
                </div>
              </div>

              <div className="fd-stat-card" onClick={() => scrollToFinancialChart("fd-overdue-payments-chart")}>
                <div className="fd-stat-info">
                  <h3>{dashboardData.stats?.collectionRate || 0}%</h3>
                  <p>Collection Rate</p>
                </div>
              </div>
            </div>

            {/* Billing Modal */}
            {showBilling && (
              <div className="fd-billing-modal">
                <div className="fd-billing-content">
                  <h2>🧾 Billing Information</h2>
                  <div className="fd-bill-card">
                    <p><strong>Invoice #:</strong> 12345</p>
                    <p><strong>Date:</strong> Aug 23, 2025</p>
                    <p><strong>Amount:</strong> $250.00</p>
                    <p><strong>Status:</strong> Paid ✅</p>
                  </div>
                  <button className="fd-close-btn" onClick={() => setShowBilling(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Analytics Selection Modal */}
            {showAnalyticsModal && (
              <div className="fd-analytics-modal">
                <div className="fd-analytics-modal-content">
                  <h2>📊 Select Analytics Type</h2>
                  <p>Choose the type of analytics you want to view:</p>
                  
                  <div className="fd-analytics-options">
                    <button 
                      className="fd-analytics-option fd-financial"
                      onClick={() => handleFinancialAnalyticsSelection("financial")}
                    >
                      <div className="fd-option-icon">💰</div>
                      <div className="fd-option-details">
                        <h3>Financial Analytics</h3>
                        <p>View payment trends, revenue data, and financial insights</p>
                      </div>
                    </button>

                    <button 
                      className="fd-analytics-option fd-inventory"
                      onClick={() => handleFinancialAnalyticsSelection("inventory")}
                    >
                      <div className="fd-option-icon">📦</div>
                      <div className="fd-option-details">
                        <h3>Inventory Analytics</h3>
                        <p>View stock levels, inventory trends, and supply metrics</p>
                      </div>
                    </button>
                  </div>

                  <button 
                    className="fd-analytics-close-btn" 
                    onClick={() => setShowAnalyticsModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="fd-charts-section">
              <div id="fd-todays-revenue-chart" className="fd-revenue-pie-chart">
                <h2>📊 Revenue Breakdown</h2>
                <PieChart width={400} height={300}>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={FINANCIAL_COLORS[index % FINANCIAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              <div id="fd-monthly-revenue-chart" className="fd-revenue-bar-chart">
                <h2>📈 Revenue Comparison</h2>
                <BarChart width={500} height={300} data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </div>

              <div id="fd-pending-payments-chart" className="fd-revenue-line-chart">
                <h2>📉 Revenue Trend</h2>
                <LineChart width={500} height={300} data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
                </LineChart>
              </div>

              <div id="fd-overdue-payments-chart" className="fd-collection-radial-chart">
                <h2>🎯 Collection Rate</h2>
                <RadialBarChart
                  width={300}
                  height={300}
                  cx="50%"
                  cy="50%"
                  innerRadius="80%"
                  outerRadius="100%"
                  barSize={20}
                  data={radialData}
                >
                  <RadialBar
                    minAngle={15}
                    label={{ position: "insideStart", fill: "#fff" }}
                    background
                    clockWise
                    dataKey="value"
                  />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" />
                  <Tooltip />
                </RadialBarChart>
              </div>
            </div>

            {/* Features Section */}
            <div className="fd-features-section">
              <h2>💼 Financial Features</h2>
              <div className="fd-features-grid">
                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("view_billing")}
                >
                  VIEW BILLING
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("manage_payments")}
                >
                  MANAGE PAYMENTS
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("Real time analytics")}
                >
                  REAL TIME ANALYTICS
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("track_revenue")}
                >
                  TRACK REVENUE
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("payroll_processing")}
                >
                  PAYROLL PROCESSING
                </button>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="fd-activity-section">
              <h2>📋 Recent Financial Activities</h2>
              <div className="fd-activity-list">
                {dashboardData.recentActivities?.map((activity, index) => (
                  <div key={index} className="fd-activity-item">
                    <p>{activity}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default FinancialDashboard;
