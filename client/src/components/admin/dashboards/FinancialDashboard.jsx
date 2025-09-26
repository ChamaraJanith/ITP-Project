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
  RadialBarChart,
  RadialBar,
} from "recharts";
import "./FinancialDashboard.css";

const FINANCIAL_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const API_URL = "http://localhost:7000/api/appointments"; // **CHANGED: From payments to appointments**

const FinancialDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [payments, setPayments] = useState([]); // Keep variable name for compatibility
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBilling, setShowBilling] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    initializeDashboard();
  }, []);

  // **UPDATED: Fetch appointments and convert to payment-like data**
  const fetchPayments = async () => {
    try {
      const response = await fetch(API_URL);
      const text = await response.text();

      try {
        const data = JSON.parse(text);
        console.log("Fetched appointments:", data);
        
        // Handle different response structures
        let appointmentsData = [];
        if (Array.isArray(data)) {
          appointmentsData = data;
        } else if (data.success && data.data) {
          appointmentsData = Array.isArray(data.data) ? data.data : [data.data];
        } else if (data.appointments) {
          appointmentsData = Array.isArray(data.appointments) ? data.appointments : [data.appointments];
        }
        
        // Filter only accepted appointments and convert to payment structure
        const acceptedAppointments = appointmentsData.filter(apt => 
          apt && apt.status === 'accepted'
        );
        
        // Convert to payment-like structure for existing logic compatibility
const paymentsData = acceptedAppointments.map((apt, index) => {
  // Calculate fee based on specialty
  let consultationFee = 5000; // Default
  const specialty = (apt.doctorSpecialty || '').toLowerCase();
  
  // More comprehensive specialty matching
  if (specialty.includes('cardio')) {
    consultationFee = 6000;
  } else if (specialty.includes('orthopedic')) {
    consultationFee = 6000;
  } else if (specialty.includes('dermatologist') || specialty.includes('dermatology') || specialty.includes('skin')) {
    consultationFee = 5500;
  } else if (specialty.includes('general') && specialty.includes('physician')) {
    consultationFee = 4000;
  } else if (specialty.includes('neurologist') || specialty.includes('neurology') || specialty.includes('brain') || specialty.includes('nerve')) {
    consultationFee = 7000;
  } else if (specialty.includes('pediatrician') || specialty.includes('pediatric') || specialty.includes('child')) {
    consultationFee = 4500;
  } else if (specialty.includes('gynecologist') || specialty.includes('gynecology') || specialty.includes('women')) {
    consultationFee = 5500;
  } else if (specialty.includes('psychiatrist') || specialty.includes('psychiatry') || specialty.includes('mental')) {
    consultationFee = 6500;
  } else if (specialty.includes('dentist') || specialty.includes('dental')) {
    consultationFee = 3500;
  } else if (specialty.includes('eye') || specialty.includes('ophthalmologist') || specialty.includes('ophthalmology')) {
    consultationFee = 5000;
  } else if (specialty.includes('ent') || specialty.includes('ear') || specialty.includes('nose') || specialty.includes('throat')) {
    consultationFee = 4800;
  }

          return {
            // Keep payment structure for compatibility
            _id: apt._id,
            invoiceNumber: `INV-${apt._id?.slice(-6) || Math.random().toString(36).substr(2, 6)}`,
            patientName: apt.name,
            hospitalName: apt.doctorSpecialty || 'General Medicine',
            doctorName: apt.doctorName,
            totalAmount: consultationFee,
            amountPaid: consultationFee, // Accepted = Fully Paid
            paymentMethod: ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer'][index % 4],
            date: apt.acceptedAt || apt.updatedAt || new Date().toISOString(),
            
            // Additional appointment data
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            specialty: apt.doctorSpecialty,
            patientEmail: apt.email,
            patientPhone: apt.phone
          };
        });
        
        console.log("Converted to payment structure:", paymentsData);
        return paymentsData || [];
      } catch (parseError) {
        console.error("Raw response (should be JSON):", text);
        throw new Error("Not valid JSON. Check console for raw response.");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }
  };

  // **KEEP ORIGINAL: Calculate real-time statistics (same logic as original)**
  const calculateRealTimeStats = (paymentsData) => {
    if (!paymentsData || paymentsData.length === 0) {
      return {
        todayRevenue: 0,
        pendingPayments: 0,
        monthlyTarget: 125000, // Keep as target
        collectionRate: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalPayments: 0,
        totalAmountDue: 0,
        totalAmountPaid: 0,
        totalPending: 0,
        paymentMethods: {},
        hospitalBreakdown: {}
      };
    }

    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate totals
    const totalPayments = paymentsData.length;
    const totalAmountDue = paymentsData.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    const totalAmountPaid = paymentsData.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
    const totalPending = totalAmountDue - totalAmountPaid;

    // Calculate today's revenue
    const todayRevenue = paymentsData
      .filter(payment => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        const today = new Date();
        return paymentDate.toDateString() === today.toDateString();
      })
      .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

    // Calculate week revenue
    const weekRevenue = paymentsData
      .filter(payment => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        return paymentDate >= startOfWeek;
      })
      .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

    // Calculate month revenue
    const monthRevenue = paymentsData
      .filter(payment => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        return paymentDate >= startOfMonth;
      })
      .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

    // Collection rate (should be 100% since all accepted appointments are paid)
    const collectionRate = totalAmountDue > 0 ? Math.round((totalAmountPaid / totalAmountDue) * 100) : 100;

    // Payment methods breakdown
    const paymentMethods = {};
    paymentsData.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amountPaid || 0);
    });

    // Hospital breakdown (using specialty as hospital)
    const hospitalBreakdown = {};
    paymentsData.forEach(payment => {
      const hospital = payment.hospitalName || payment.specialty || 'Unknown';
      if (!hospitalBreakdown[hospital]) {
        hospitalBreakdown[hospital] = { totalDue: 0, totalPaid: 0, count: 0 };
      }
      hospitalBreakdown[hospital].totalDue += (payment.totalAmount || 0);
      hospitalBreakdown[hospital].totalPaid += (payment.amountPaid || 0);
      hospitalBreakdown[hospital].count += 1;
    });

    return {
      todayRevenue,
      pendingPayments: totalPending,
      monthlyTarget: 125000, // Keep as target
      collectionRate,
      weekRevenue,
      monthRevenue,
      totalPayments,
      totalAmountDue,
      totalAmountPaid,
      totalPending,
      paymentMethods,
      hospitalBreakdown
    };
  };

  // **KEEP ORIGINAL: Generate recent activities from real data**
  const generateRecentActivities = (paymentsData) => {
    if (!paymentsData || paymentsData.length === 0) return [];

    const activities = [];

    // Get recent payments (last 10)
    const recentPayments = paymentsData
      .filter(payment => payment.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    recentPayments.forEach(payment => {
      if (payment.amountPaid > 0) {
        activities.push(`💰 Payment of $${payment.amountPaid.toLocaleString()} received from ${payment.patientName}`);
      }
      if (payment.totalAmount > payment.amountPaid) {
        const pending = payment.totalAmount - payment.amountPaid;
        activities.push(`⚠️ Pending payment of $${pending.toLocaleString()} for Invoice #${payment.invoiceNumber}`);
      }
    });

    // Add some general activities
    const stats = calculateRealTimeStats(paymentsData);
    activities.push(`📊 Total collection rate: ${stats.collectionRate}%`);
    activities.push(`🏥 Managing ${Object.keys(stats.hospitalBreakdown).length} specialties`);
    activities.push(`💳 ${Object.keys(stats.paymentMethods).length} payment methods in use`);

    return activities.slice(0, 10); // Return top 10 activities
  };

  const initializeDashboard = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      // **UPDATED: Fetch appointment data converted to payment structure**
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);

      // **KEEP ORIGINAL: Calculate real-time statistics**
      const realTimeStats = calculateRealTimeStats(paymentsData);
      const recentActivities = generateRecentActivities(paymentsData);

      setDashboardData({
        stats: realTimeStats,
        recentActivities: recentActivities
      });

    } catch (error) {
      console.error("❌ Error loading financial dashboard:", error);
      setError("Failed to load financial dashboard");
    } finally {
      setLoading(false);
    }
  };

  // **KEEP ORIGINAL: Refresh data function**
  const refreshDashboardData = async () => {
    setLoading(true);
    try {
      await initializeDashboard();
      console.log("✅ Dashboard data refreshed");
    } catch (error) {
      setError("Failed to refresh data");
    }
  };

  // **KEEP ORIGINAL: Function to scroll to specific chart**
  const scrollToFinancialChart = (chartId) => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
      chartElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // **KEEP ORIGINAL: Handle feature button clicks**
  const handleFinancialFeatureClick = (feature) => {
    switch (feature) {
      case "view_billing":
        navigate("/billing");
        break;

      case "manage_payments":
        navigate("/admin/financial/payments");
        break;

      case "Real time analytics":
        // **KEEP ORIGINAL: Navigate with payment data structure**
        navigate("/admin/financial/payments/total-view", {
          state: {
            payments: payments,
            stats: dashboardData?.stats,
            type: 'financial'
          }
        });
        break;

      case "profit_or_loss":
        navigate("/admin/financial/profit-loss");
        break;

      case "payroll_processing":
        navigate("/admin/financial/payrolls");
        break;

      case "expense_tracking":
        navigate("/admin/financial/expenses");
        break;

      case "explore_trends":
        navigate("/admin/financial/trends");
        break;

      case "utility_management":
        navigate("/admin/financial/utities");
        break; 
        
      case "budget_plan":
        navigate("/admin/financial/budget-planning");
        break;

      case "payroll_analytics":
        navigate("/admin/financial/payrolls/total-view", {
          state: {
            payrolls: [], 
            type: 'payroll'
          }
        });
        break; 

      default:
        console.log("Clicked feature:", feature);
    }
  };

  // **KEEP ORIGINAL: Handle operational task clicks**
  const handleOperationalTaskClick = (task) => {
    switch (task) {
      case "send_emails":
        navigate("/admin/financial/send-email");
        break;

      case "send_notifications":
        navigate("/admin/notifications");
        break;

      case "generate_reports":
        navigate("/admin/reports");
        break;

      default:
        console.log("Clicked operational task:", task);
    }
  };

  // **KEEP ORIGINAL: Handle analytics selection**
  const handleFinancialAnalyticsSelection = (analyticsType) => {
    setShowAnalyticsModal(false);

    if (analyticsType === "financial") {
      navigate("/admin/financial/payments/total-view", {
        state: {
          payments: payments,
          stats: dashboardData?.stats,
          type: 'financial'
        }
      });
    } else if (analyticsType === "inventory") {
      navigate("inventory-view");
    }
  };

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Financial Dashboard">
        <div className="fd-loading">
          <div>Loading real-time financial dashboard...</div>
          <div className="fd-loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  // **KEEP ORIGINAL: Chart Data with real values from appointments**
  const pieData = dashboardData?.stats
    ? [
        { name: "Collected Revenue", value: dashboardData.stats.totalAmountPaid || 0 },
        { name: "Pending Payments", value: dashboardData.stats.pendingPayments || 0 },
      ]
    : [];

  const barData = dashboardData?.stats
    ? [
        { name: "Today", revenue: dashboardData.stats.todayRevenue || 0 },
        { name: "This Week", revenue: dashboardData.stats.weekRevenue || 0 },
        { name: "This Month", revenue: dashboardData.stats.monthRevenue || 0 },
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
      fill: dashboardData?.stats?.collectionRate >= 80 ? "#10B981" : 
           dashboardData?.stats?.collectionRate >= 60 ? "#F59E0B" : "#EF4444",
    },
  ];

  return (
    <AdminLayout admin={admin} title="Financial Dashboard">
      <div className="fd-container">
        <div className="fd-header">
          <h1>💰 Financial Manager Dashboard</h1>
          <p>Real-time billing, payments & financial reports</p>
          <button 
            className="fd-refresh-btn" 
            onClick={refreshDashboardData}
            disabled={loading}
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}
          </button>
        </div>

        {error && <div className="fd-error-banner">⚠️ {error}</div>}

        {dashboardData && (
          <>
            {/* **KEEP ORIGINAL: Stats Grid with Real Data from Appointments** */}
            <div className="fd-stats-grid">
              <div className="fd-stat-card fd-today-revenue" onClick={() => scrollToFinancialChart("fd-todays-revenue-chart")}>
                <div className="fd-stat-info">
                  <h3>${dashboardData.stats?.todayRevenue?.toLocaleString() || 0}</h3>
                  <p>Today's Revenue</p>
                  <small>Real-time collections</small>
                </div>
              </div>

              <div className="fd-stat-card fd-pending-payments" onClick={() => scrollToFinancialChart("fd-monthly-revenue-chart")}>
                <div className="fd-stat-info">
                  <h3>${dashboardData.stats?.pendingPayments?.toLocaleString() || 0}</h3>
                  <p>Pending Payments</p>
                  <small>{dashboardData.stats?.totalPayments || 0} total invoices</small>
                </div>
              </div>

              <div className="fd-stat-card fd-collection-rate" onClick={() => scrollToFinancialChart("fd-overdue-payments-chart")}>
                <div className="fd-stat-info">
                  <h3>{dashboardData.stats?.collectionRate || 0}%</h3>
                  <p>Collection Rate</p>
                  <small>
                    {dashboardData.stats?.collectionRate >= 80 ? "Excellent" : 
                     dashboardData.stats?.collectionRate >= 60 ? "Good" : "Needs Attention"}
                  </small>
                </div>
              </div>

              <div className="fd-stat-card fd-monthly-target" onClick={() => scrollToFinancialChart("fd-pending-payments-chart")}>
                <div className="fd-stat-info">
                  <h3>${dashboardData.stats?.monthRevenue?.toLocaleString() || 0}</h3>
                  <p>This Month's Revenue</p>
                  <small>Target: ${dashboardData.stats?.monthlyTarget?.toLocaleString() || 0}</small>
                </div>
              </div>
            </div>

            {/* **KEEP ORIGINAL: Charts Section - Charts will now show real data** */}
            <div className="fd-charts-section">
              <div id="fd-todays-revenue-chart" className="fd-revenue-pie-chart">
                <h2>📊 Revenue vs Pending</h2>
                <PieChart width={400} height={300}>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={FINANCIAL_COLORS[index % FINANCIAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                </PieChart>
              </div>

              <div id="fd-monthly-revenue-chart" className="fd-revenue-bar-chart">
                <h2>📈 Revenue Timeline</h2>
                <BarChart width={500} height={300} data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </div>

              <div id="fd-pending-payments-chart" className="fd-revenue-line-chart">
                <h2>📉 Revenue Trend</h2>
                <LineChart width={500} height={300} data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#82ca9d" strokeWidth={3} />
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
                  <Tooltip formatter={(value) => [`${value}%`, 'Collection Rate']} />
                </RadialBarChart>
              </div>
            </div>

            {/* **KEEP ORIGINAL: Features Section** */}
            <div className="fd-features-section">
              <h2>💼 Financial Features</h2>
              <div className="fd-features-grid">
                <button
                  className="fd-feature-button"
                  onClick={() => setShowBilling(true)}
                >
                  VIEW RECENT BILLING
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
                  PAYMENT ANALYTICS
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("payroll_processing")}
                >
                  PAYROLL PROCESSING
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("payroll_analytics")}
                >
                  PAYROLL ANALYTICS
                </button>

                 <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("utility_management")}
                >
                  MANAGE UTILITIES
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("expense_tracking")}
                >
                  EXPENSE TRACKING
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("profit_or_loss")}
                >
                  PROFIT OR LOSS
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("budget_plan")}
                >
                  BUDGET PLAN
                </button>

                 <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("explore_trends")}
                >
                  EXPLORE TRENDS
                </button>
              </div>
            </div>

            {/* **KEEP ORIGINAL: Operational Tasks Section** */}
            <div className="fd-operational-section">
              <h2>⚙️ Operational Tasks</h2>
              <div className="fd-operational-grid">
                <button
                  className="fd-operational-button"
                  onClick={() => handleOperationalTaskClick("send_emails")}
                >
                  📧 SEND EMAILS
                </button>

                <button
                  className="fd-operational-button"
                  onClick={() => handleOperationalTaskClick("send_notifications")}
                >
                  🔔 SEND NOTIFICATIONS
                </button>

                <button
                  className="fd-operational-button"
                  onClick={() => handleOperationalTaskClick("generate_reports")}
                >
                  📋 GENERATE REPORTS
                </button>
              </div>
            </div>

            {/* **KEEP ORIGINAL: Billing Modal with appointment data** */}
            {showBilling && (
              <div className="fd-billing-modal">
                <div className="fd-billing-content">
                  <h2>🧾 Recent Billing Information</h2>
                  {payments.slice(0, 3).map((payment, index) => (
                    <div key={index} className="fd-bill-card">
                      <p><strong>Invoice #:</strong> {payment.invoiceNumber}</p>
                      <p><strong>Specialty:</strong> {payment.hospitalName}</p>
                      <p><strong>Patient:</strong> {payment.patientName}</p>
                      <p><strong>Doctor:</strong> {payment.doctorName}</p>
                      <p><strong>Amount:</strong> ${(payment.totalAmount || 0).toLocaleString()}</p>
                      <p><strong>Paid:</strong> ${(payment.amountPaid || 0).toLocaleString()}</p>
                      <p><strong>Status:</strong> 
                        {payment.amountPaid >= payment.totalAmount ? 
                          <span style={{color: 'green'}}> Paid ✅</span> : 
                          <span style={{color: 'orange'}}> Pending ⏳</span>
                        }
                      </p>
                    </div>
                  ))}
                  <button className="fd-close-btn" onClick={() => setShowBilling(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* **KEEP ORIGINAL: Analytics Selection Modal** */}
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
                        <small>{dashboardData.stats?.totalPayments || 0} payments analyzed</small>
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

            {/* **KEEP ORIGINAL: Recent Activities - Now showing real appointment data** */}
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
