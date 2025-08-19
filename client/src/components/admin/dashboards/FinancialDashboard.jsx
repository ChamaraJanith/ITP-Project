import React, { useState, useEffect } from "react";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const FinancialDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBills, setShowBills] = useState(false); // 🔹 moved here

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
  const scrollToChart = (chartId) => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      chartElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Financial Dashboard">
        <div className="loading">Loading financial dashboard...</div>
      </AdminLayout>
    );
  }

  // Example bills data (replace with API later)
  const billsData = [
    { id: 1, date: "2025-08-01", description: "Electricity Bill", amount: 120.50 },
    { id: 2, date: "2025-08-03", description: "Water Bill", amount: 45.75 },
    { id: 3, date: "2025-08-05", description: "Internet Bill", amount: 89.99 },
    { id: 4, date: "2025-08-07", description: "Office Rent", amount: 1500.00 },
    { id: 5, date: "2025-08-09", description: "Cleaning Services", amount: 250.00 },
    { id: 6, date: "2025-08-10", description: "Software Subscription", amount: 99.99 },
    { id: 7, date: "2025-08-12", description: "Telephone Bill", amount: 60.50 },
    { id: 8, date: "2025-08-14", description: "Maintenance Fees", amount: 120.00 },
    { id: 9, date: "2025-08-16", description: "Stationery Purchase", amount: 75.25 },
    { id: 10, date: "2025-08-18", description: "Courier Charges", amount: 40.00 }
  ];

  const handleFeatureClick = (feature) => {
  if (feature.toLowerCase().includes("billing")) {
    setShowBills((prev) => !prev); // toggle instead of always true
  } else {
    alert(`⚡ Feature selected: ${feature}`);
  }
};

  // Chart Data
  const pieData = dashboardData?.stats
    ? [
        {
          name: "Today's Revenue",
          value: dashboardData.stats.todayRevenue || 0,
        },
        {
          name: "Pending Payments",
          value: dashboardData.stats.pendingPayments || 0,
        },
        {
          name: "Monthly Target",
          value: dashboardData.stats.monthlyTarget || 0,
        },
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
      <div className="financial-dashboard">
        <div className="dashboard-header">
          <h1>💰 Financial Manager Dashboard</h1>
          <p>Billing, payments & financial reports</p>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div
                className="stat-card"
                onClick={() => scrollToChart("todaysRevenueChart")}
              >
                <div className="stat-info">
                  <h3>
                    ${dashboardData.stats?.todayRevenue?.toLocaleString() || 0}
                  </h3>
                  <p>Today's Revenue</p>
                </div>
              </div>

              <div
                className="stat-card"
                onClick={() => scrollToChart("monthlyRevenueChart")}
              >
                <div className="stat-info">
                  <h3>
                    $
                    {dashboardData.stats?.pendingPayments?.toLocaleString() ||
                      0}
                  </h3>
                  <p>Pending Payments</p>
                </div>
              </div>

              <div
                className="stat-card"
                onClick={() => scrollToChart("pendingPaymentsChart")}
              >
                <div className="stat-info">
                  <h3>
                    ${dashboardData.stats?.monthlyTarget?.toLocaleString() || 0}
                  </h3>
                  <p>Monthly Target</p>
                </div>
              </div>

              <div
                className="stat-card"
                onClick={() => scrollToChart("overduePaymentsChart")}
              >
                <div className="stat-info">
                  <h3>{dashboardData.stats?.collectionRate || 0}%</h3>
                  <p>Collection Rate</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-section">
              {/* Pie Chart */}
              <div id="todaysRevenueChart" className="chart-card">
                <h2>📊 Revenue Breakdown</h2>
                <PieChart width={400} height={300}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              {/* Bar Chart */}
              <div id="monthlyRevenueChart" className="chart-card">
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

              {/* Line Chart */}
              <div id="pendingPaymentsChart" className="chart-card">
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

              {/* Radial Bar Chart */}
              <div id="overduePaymentsChart" className="chart-card">
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
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                  />
                  <Tooltip />
                </RadialBarChart>
              </div>
            </div>

            {/* Features */}
            <div className="features-section">
              <h2>💼 Financial Features</h2>
              <div className="features-grid">
                {dashboardData.features?.map((feature, index) => (
                  <div
                    key={index}
                    className="feature-card"
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <h4>{feature.replace("_", " ").toUpperCase()}</h4>
                  </div>
                ))}
              </div>
            </div>

            {showBills && (
  <div className="bills-modal">
    <div className="bills-modal-content">
      <h3 className="modal-title">📑 Bills</h3>
      <div className="table-wrapper">
        <table className="bills-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount ($)</th>
            </tr>
          </thead>
          <tbody>
            {billsData.map((bill, index) => (
              <tr key={bill.id} className={index % 2 === 0 ? "even" : "odd"}>
                <td>{bill.date}</td>
                <td>{bill.description}</td>
                <td>{bill.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="close-btn" onClick={() => setShowBills(false)}>
        Close
      </button>
    </div>
  </div>
)}

            {/* Recent Activities */}
            <div className="activity-section">
              <h2>📋 Recent Financial Activities</h2>
              <div className="activity-list">
                {dashboardData.recentActivities?.map((activity, index) => (
                  <div key={index} className="activity-item">
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

import './FinancialDashboard.css'; // adjust path to your CSS file

/*hell00000000ooooo */
