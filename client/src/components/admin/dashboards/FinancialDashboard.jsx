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
  AreaChart,
  Area,
  ComposedChart,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import "./FinancialDashboard.css";

// Modern Financial Color Schemes for 2025
const MODERN_FINANCIAL_COLORS = {
  primary: ["#667eea", "#764ba2", "#f093fb", "#f5576c"],
  revenue: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
  warning: ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"],
  danger: ["#EF4444", "#F87171", "#FCA5A5", "#FECACA"],
  success: ["#059669", "#10B981", "#34D399", "#6EE7B7"],
  neutral: ["#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6"],
  gradients: {
    blueViolet: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    greenBlue: "linear-gradient(135deg, #10B981 0%, #0891B2 100%)",
    orangeRed: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
    purplePink: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
  }
};

const API_URL = "http://localhost:7000/api/appointments";

const FinancialDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [payments, setPayments] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBilling, setShowBilling] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    initializeDashboard();
  }, []);

  // Use exact same fee calculation logic as FinancialManagePayments.jsx
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

  // **UPDATED: Custom Tooltips using real dashboard data**
  const CustomPieTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="modern-tooltip">
        <div className="tooltip-header">💰 Revenue Breakdown</div>
        <div className="tooltip-body">
          <div className="tooltip-item">
            <div className="tooltip-color" style={{ backgroundColor: payload[0].fill }}></div>
            <span className="tooltip-label">{payload[0].name}:</span>
            <span className="tooltip-value">LKR {payload[0].value.toLocaleString()}</span>
          </div>
          <div className="tooltip-percentage">
            {((payload[0].value / (dashboardData?.stats?.totalAmountDue || 1)) * 100).toFixed(1)}% of total
          </div>
        </div>
      </div>
    );
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="modern-tooltip">
        <div className="tooltip-header">📈 {label} Performance</div>
        <div className="tooltip-body">
          <div className="tooltip-item">
            <div className="tooltip-color" style={{ backgroundColor: payload[0].fill }}></div>
            <span className="tooltip-value">{label === "Unique Patients" ? payload[0].value : `LKR ${payload[0].value.toLocaleString()}`}</span>
          </div>
          <div className="tooltip-trend">
            {payload[0].value > 0 ? "🔥 Active Revenue" : "💤 No Activity"}
          </div>
        </div>
      </div>
    );
  };

  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="modern-tooltip">
        <div className="tooltip-header">📊 {label} Analysis</div>
        <div className="tooltip-body">
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item">
              <div className="tooltip-color" style={{ backgroundColor: entry.color }}></div>
              <span className="tooltip-label">{entry.name}:</span>
              <span className="tooltip-value">LKR {entry.value.toLocaleString()}</span>
            </div>
          ))}
          <div className="tooltip-growth">Real-time financial data</div>
        </div>
      </div>
    );
  };

  const CustomRadialTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const rate = payload[0].value;
    const getPerformanceText = (rate) => {
      if (rate >= 90) return "🎯 Excellent Performance";
      if (rate >= 80) return "✅ Good Performance"; 
      if (rate >= 70) return "⚠️ Average Performance";
      return "🚨 Needs Improvement";
    };

    return (
      <div className="modern-tooltip">
        <div className="tooltip-header">🎯 Collection Efficiency</div>
        <div className="tooltip-body">
          <div className="tooltip-item">
            <div className="tooltip-color" style={{ backgroundColor: payload[0].fill }}></div>
            <span className="tooltip-value">{rate}%</span>
          </div>
          <div className="tooltip-status">
            {getPerformanceText(rate)}
          </div>
        </div>
      </div>
    );
  };

  // Format functions for better number display
  const formatCurrency = (value) => {
    if (value >= 1000000) return `LKR ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `LKR ${(value / 1000).toFixed(1)}K`;
    return `LKR ${value.toLocaleString()}`;
  };

  // Enhanced fetch function with exact same logic as FinancialManagePayments.jsx
  const fetchPayments = async () => {
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        console.log("Fetched appointments:", data);
        
        // Use exact same data parsing logic
        let appointmentsData = [];
        if (Array.isArray(data)) {
          appointmentsData = data;
        } else if (data.success && data.data) {
          appointmentsData = Array.isArray(data.data) ? data.data : [data.data];
        } else if (data.appointments) {
          appointmentsData = Array.isArray(data.appointments) ? data.appointments : [data.appointments];
        } else if (data.appointment) {
          appointmentsData = [data.appointment];
        }
        
        // Filter only accepted appointments
        const acceptedAppointments = appointmentsData.filter(apt => 
          apt && apt.status === 'accepted'
        );
        
        // Use exact same transformation logic
        const paymentsData = acceptedAppointments.map((apt, index) => {
          const consultationFee = calculateConsultationFee(apt.doctorSpecialty);
          
          // Calculate age using same logic as payments component
          const age = apt.age || (
            apt.dateOfBirth
              ? (() => {
                  const d = new Date(apt.dateOfBirth), t = new Date();
                  let a = t.getFullYear() - d.getFullYear();
                  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
                  return a;
                })()
              : ""
          );

          return {
            _id: apt._id || `temp-${index}`,
            invoiceNumber: `INV-${apt._id?.slice(-6) || Math.random().toString(36).substr(2, 6)}`,
            patientName: apt.name || 'Unknown Patient',
            hospitalName: apt.doctorSpecialty || 'General Medicine',
            doctorName: apt.doctorName || 'Dr. Unknown',
            totalAmount: consultationFee,
            amountPaid: consultationFee, // Accepted = Fully Paid
            paymentMethod: apt.paymentMethod || ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer'][index % 4],
            date: apt.acceptedAt || apt.updatedAt || new Date().toISOString(),
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            specialty: apt.doctorSpecialty,
            patientEmail: apt.email,
            patientPhone: apt.phone,
            age: age,
            transactionId: apt.transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            paymentDate: apt.paymentDate || apt.acceptedAt || new Date().toISOString(),
            paymentStatus: "paid",
            formattedAppointmentDate: apt.appointmentDate ? apt.appointmentDate.split("T")[0] : ""
          };
        });
        
        console.log("Converted to payment structure:", paymentsData);
        return paymentsData || [];
        
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw response (should be JSON):", text);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  // Enhanced statistics calculation with more detailed breakdowns
  const calculateRealTimeStats = (paymentsData) => {
    if (!paymentsData || paymentsData.length === 0) {
      return {
        todayRevenue: 0,
        pendingPayments: 0,
        monthlyTarget: 125000,
        collectionRate: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalPayments: 0,
        totalAmountDue: 0,
        totalAmountPaid: 0,
        totalPending: 0,
        paymentMethods: {},
        hospitalBreakdown: {},
        specialtyBreakdown: {},
        uniquePatients: 0,
        uniqueDoctors: 0,
        averagePayment: 0
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPayments = paymentsData.length;
    const totalAmountDue = paymentsData.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    const totalAmountPaid = paymentsData.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
    const totalPending = totalAmountDue - totalAmountPaid;

    const todayRevenue = paymentsData
      .filter(payment => {
        if (!payment.date) return false;
        try {
          const paymentDate = new Date(payment.date);
          return paymentDate >= today && paymentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

    const weekRevenue = paymentsData
      .filter(payment => {
        if (!payment.date) return false;
        try {
          const paymentDate = new Date(payment.date);
          return paymentDate >= startOfWeek;
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

    const monthRevenue = paymentsData
      .filter(payment => {
        if (!payment.date) return false;
        try {
          const paymentDate = new Date(payment.date);
          return paymentDate >= startOfMonth;
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);

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

    // Enhanced analytics
    const specialtyBreakdown = {};
    paymentsData.forEach(payment => {
      const specialty = payment.specialty || payment.hospitalName || 'General Medicine';
      if (!specialtyBreakdown[specialty]) {
        specialtyBreakdown[specialty] = { count: 0, revenue: 0 };
      }
      specialtyBreakdown[specialty].count += 1;
      specialtyBreakdown[specialty].revenue += (payment.amountPaid || 0);
    });

    // FIXED: Ensure unique patients calculation is correct and never returns undefined
    const uniquePatients = paymentsData && paymentsData.length > 0 
      ? new Set(paymentsData.map(p => p.patientName || p.patientEmail || `patient-${p._id}`)).size 
      : 0;
    
    const uniqueDoctors = paymentsData && paymentsData.length > 0 
      ? new Set(paymentsData.map(p => p.doctorName || `doctor-${p._id}`)).size 
      : 0;
    
    const averagePayment = totalAmountPaid > 0 ? totalAmountPaid / totalPayments : 0;

    return {
      todayRevenue,
      pendingPayments: totalPending,
      monthlyTarget: 125000,
      collectionRate,
      weekRevenue,
      monthRevenue,
      totalPayments,
      totalAmountDue,
      totalAmountPaid,
      totalPending,
      paymentMethods,
      hospitalBreakdown,
      specialtyBreakdown,
      uniquePatients: uniquePatients, // Ensure this is always a number
      uniqueDoctors,
      averagePayment
    };
  };

  // Enhanced recent activities with more detailed information
  const generateRecentActivities = (paymentsData) => {
    if (!paymentsData || paymentsData.length === 0) {
      return ["📊 No recent activities to display", "🔄 Refresh data to see updates"];
    }

    const activities = [];

    // Get recent payments (last 10)
    const recentPayments = paymentsData
      .filter(payment => payment.date)
      .sort((a, b) => {
        try {
          return new Date(b.date) - new Date(a.date);
        } catch (e) {
          return 0;
        }
      })
      .slice(0, 10);

    recentPayments.forEach(payment => {
      if (payment.amountPaid > 0) {
        activities.push(`💰 Payment of LKR ${payment.amountPaid.toLocaleString()} received from ${payment.patientName || 'Unknown'} - ${payment.specialty || 'General'}`);
      }
      if (payment.totalAmount > payment.amountPaid) {
        const pending = payment.totalAmount - payment.amountPaid;
        activities.push(`⚠️ Pending payment of LKR ${pending.toLocaleString()} for Invoice #${payment.invoiceNumber}`);
      }
    });

    // Add some general activities
    const stats = calculateRealTimeStats(paymentsData);
    activities.push(`📊 Total collection rate: ${stats.collectionRate}% (Excellent performance!)`);
    activities.push(`🏥 Managing ${Object.keys(stats.specialtyBreakdown).length} medical specialties`);
    activities.push(`💳 ${Object.keys(stats.paymentMethods).length} payment methods in active use`);
    activities.push(`👥 Serving ${stats.uniquePatients} unique patients`);
    activities.push(`👨‍⚕️ ${stats.uniqueDoctors} healthcare providers active`);

    return activities.slice(0, 10);
  };

  const initializeDashboard = async () => {
    try {
      setError("");
      
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      // Fetch appointment data converted to payment structure
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);

      // Calculate real-time statistics
      const realTimeStats = calculateRealTimeStats(paymentsData);
      const recentActivities = generateRecentActivities(paymentsData);

      setDashboardData({
        stats: realTimeStats,
        recentActivities: recentActivities
      });

    } catch (error) {
      console.error("❌ Error loading financial dashboard:", error);
      setError(`Failed to load financial dashboard: ${error.message}`);
      
      setDashboardData({
        stats: calculateRealTimeStats([]),
        recentActivities: ["❌ Error loading data", "🔄 Please refresh to try again"]
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data function
  const refreshDashboardData = async () => {
    setLoading(true);
    try {
      await initializeDashboard();
      console.log("✅ Dashboard data refreshed");
    } catch (error) {
      setError(`Failed to refresh data: ${error.message}`);
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
      case "Real_time_analytics_payments":
        navigate("/admin/financial/payments/total-view", {
          state: {
            payments: payments,
            stats: dashboardData?.stats,
            type: 'financial'
          }
        });
        break;

      case "Real_time_analytics_Inventory":
        navigate("/admin/financial/payments/inventory-view");
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

      case "utility_analytics":
        navigate("/admin/financial/utilities/analytics");
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

  // Handle operational task clicks
  const handleOperationalTaskClick = (task) => {
    switch (task) {
      case "send_emails":
        navigate("/admin/financial/send-email");
        break;
      case "generate_reports":
        navigate("/admin/reports");
        break;
      default:
        console.log("Clicked operational task:", task);
    }
  };

  // Handle analytics selection
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

  // **UPDATED: Charts using ONLY real-time data from fd-stats-grid**
  const pieData = dashboardData?.stats
    ? [
        { 
          name: "Collected Revenue", 
          value: dashboardData.stats.totalAmountPaid || 0,
          percentage: ((dashboardData.stats.totalAmountPaid / (dashboardData.stats.totalAmountDue || 1)) * 100).toFixed(1)
        },
        { 
          name: "Pending Payments", 
          value: dashboardData.stats.pendingPayments || 0,
          percentage: ((dashboardData.stats.pendingPayments / (dashboardData.stats.totalAmountDue || 1)) * 100).toFixed(1)
        },
      ].filter(item => item.value > 0)
    : [];

  // **FIXED: Stats Grid Data Chart - Shows the 6 stat card values WITHOUT filtering out zero values for Unique Patients**
  const statsGridData = dashboardData?.stats
    ? [
        { name: "Today's Revenue", value: dashboardData.stats.todayRevenue || 0, color: "#10B981", isCount: false },
        { name: "Month Revenue", value: dashboardData.stats.monthRevenue || 0, color: "#8B5CF6", isCount: false },
        { name: "Unique Patients", value: dashboardData.stats.uniquePatients || 0, color: "#06B6D4", isCount: true }, // Always include, even if 0
        { name: "Average Payment", value: Math.round(dashboardData.stats.averagePayment || 0), color: "#EC4899", isCount: false },
      ].filter(item => item.name === "Unique Patients" || item.value > 0) // Special handling for Unique Patients
    : [];

  const timeBasedRevenueData = dashboardData?.stats
    ? [
        { period: "Today", amount: dashboardData.stats.todayRevenue || 0, target: 5000 },
        { period: "This Week", amount: dashboardData.stats.weekRevenue || 0, target: 25000 },
        { period: "This Month", amount: dashboardData.stats.monthRevenue || 0, target: dashboardData.stats.monthlyTarget || 125000 },
      ]
    : [];

  const radialData = [
    {
      name: "Collection Rate",
      value: dashboardData?.stats?.collectionRate || 0,
      fill: dashboardData?.stats?.collectionRate >= 90 ? "#10B981" : 
           dashboardData?.stats?.collectionRate >= 80 ? "#3B82F6" :
           dashboardData?.stats?.collectionRate >= 70 ? "#F59E0B" : "#EF4444",
    },
  ];

  // **NEW: Top Medical Specialties Chart (Real-time data)**
  const specialtyRevenueData = dashboardData?.stats?.specialtyBreakdown
    ? Object.entries(dashboardData.stats.specialtyBreakdown)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5) // Top 5 specialties
        .map(([specialty, data]) => ({
          name: specialty.length > 15 ? specialty.substring(0, 15) + '...' : specialty,
          fullName: specialty,
          revenue: data.revenue,
          count: data.count,
          average: (data.revenue / data.count).toFixed(0)
        }))
    : [];

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
            {/* Stats Grid with Real Data from Appointments */}
            <div className="fd-stats-grid">
              <div className="fd-stat-card fd-today-revenue" onClick={() => scrollToFinancialChart("fd-todays-revenue-chart")}>
                <div className="fd-stat-info">
                  <h3>LKR {dashboardData.stats?.todayRevenue?.toLocaleString() || 0}</h3>
                  <p>Today's Revenue</p>
                  <small>Real-time collections</small>
                </div>
              </div>

              <div className="fd-stat-card fd-pending-payments" onClick={() => scrollToFinancialChart("fd-monthly-revenue-chart")}>
                <div className="fd-stat-info">
                  <h3>LKR {dashboardData.stats?.pendingPayments?.toLocaleString() || 0}</h3>
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
                  <h3>LKR {dashboardData.stats?.monthRevenue?.toLocaleString() || 0}</h3>
                  <p>This Month's Revenue</p>
                  <small>Target: LKR {dashboardData.stats?.monthlyTarget?.toLocaleString() || 0}</small>
                </div>
              </div>

              <div className="fd-stat-card fd-unique-patients">
                <div className="fd-stat-info">
                  <h3>{dashboardData.stats?.uniquePatients || 0}</h3>
                  <p>Unique Patients</p>
                  <small>Active patient base</small>
                </div>
              </div>

              <div className="fd-stat-card fd-average-payment">
                <div className="fd-stat-info">
                  <h3>LKR {Math.round(dashboardData.stats?.averagePayment || 0)?.toLocaleString()}</h3>
                  <p>Average Payment</p>
                  <small>Per successful appointment</small>
                </div>
              </div>
            </div>

            {/* **UPDATED: Charts Section - UNIFORM SIZING** */}
            <div className="fd-charts-section">
              {/* Chart 1: Revenue vs Pending (from stats grid) */}
              <div id="fd-todays-revenue-chart" className="fd-revenue-pie-chart modern-chart">
                <h2>💰 Revenue Distribution</h2>
                {pieData.length > 0 ? (
                  <div className="uniform-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="pieGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="pieGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                        </defs>
                        <Pie 
                          data={pieData} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false}
                          label={({name, percentage}) => `${name}: ${percentage}%`}
                          outerRadius={120}
                          innerRadius={40}
                          dataKey="value"
                          animationDuration={1000}
                          animationBegin={0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? "url(#pieGradient1)" : "url(#pieGradient2)"}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => `${value} (${entry.payload.percentage}%)`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="no-data-message">No revenue data available</div>
                )}
              </div>

              {/* Chart 2: Stats Grid Overview (Shows all 6 stat values) */}
              <div id="fd-stats-overview-chart" className="fd-stats-overview-chart modern-chart">
                <h2>📊 Dashboard Stats Overview</h2>
                {statsGridData.length > 0 ? (
                  <div className="uniform-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsGridData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="statsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="100%" stopColor="#764ba2" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#666' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tickFormatter={(value) => {
                            // Check if this is count data (Unique Patients)
                            const item = statsGridData.find(d => d.value === value);
                            if (item && item.isCount) {
                              return value.toString();
                            }
                            return formatCurrency(value);
                          }}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          fill="url(#statsGradient)"
                          radius={[4, 4, 0, 0]}
                          name="Real-Time Values"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="no-data-message">No stats data available</div>
                )}
              </div>

              {/* Chart 3: Time-Based Revenue Performance */}
              <div id="fd-monthly-revenue-chart" className="fd-revenue-bar-chart modern-chart">
                <h2>📈 Time-Based Revenue Performance</h2>
                <div className="uniform-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeBasedRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="timeBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="period" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <YAxis 
                        tickFormatter={formatCurrency}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="amount" 
                        fill="url(#timeBarGradient)"
                        radius={[4, 4, 0, 0]}
                        name="Actual Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        name="Target"
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Collection Performance */}
              <div id="fd-overdue-payments-chart" className="fd-collection-radial-chart modern-chart">
                <h2>🎯 Collection Performance</h2>
                <div className="uniform-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      barSize={30}
                      data={radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        minAngle={15}
                        label={{
                          position: "insideStart",
                          fill: "#fff",
                          fontSize: 16,
                          fontWeight: 'bold'
                        }}
                        background={{ fill: "#f3f4f6" }}
                        clockWise
                        dataKey="value"
                        cornerRadius={10}
                      />
                      <Legend 
                        iconSize={12} 
                        layout="vertical" 
                        verticalAlign="bottom" 
                        wrapperStyle={{ fontSize: '14px', fontWeight: '500' }}
                      />
                      <Tooltip content={<CustomRadialTooltip />} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 5: Top Medical Specialties (Real-time data) */}
              {specialtyRevenueData.length > 0 && (
                <div id="fd-specialty-revenue-chart" className="fd-specialty-revenue-chart modern-chart">
                  <h2>🏥 Top Medical Specialties by Revenue</h2>
                  <div className="uniform-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={specialtyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="specialtyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#666' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tickFormatter={formatCurrency}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                          labelFormatter={(label, payload) => {
                            const data = payload && payload[0] && payload[0].payload;
                            return data ? `${data.fullName} (${data.count} appointments)` : label;
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="revenue" 
                          fill="url(#specialtyGradient)"
                          radius={[4, 4, 0, 0]}
                          name="Revenue by Specialty"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Features Section */}
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
                  onClick={() => handleFinancialFeatureClick("Real_time_analytics_payments")}
                >
                  PAYMENT ANALYTICS
                </button>

                <button
                  className="fd-feature-button"
                  onClick={() => handleFinancialFeatureClick("Real_time_analytics_Inventory")}
                >
                  INVENTORY ANALYTICS
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
                  onClick={() => handleFinancialFeatureClick("utility_analytics")}
                >
                  UTILITY ANALYTICS
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

            {/* Operational Tasks Section */}
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
                  onClick={() => handleOperationalTaskClick("generate_reports")}
                >
                  📋 GENERATE REPORTS
                </button>
              </div>
            </div>

            {/* Billing Modal with appointment data */}
            {showBilling && (
              <div className="fd-billing-modal">
                <div className="fd-billing-content">
                  <h2>🧾 Recent Billing Information</h2>
                  {payments.length > 0 ? (
                    payments.slice(0, 5).map((payment, index) => (
                      <div key={index} className="fd-bill-card">
                        <p><strong>Invoice #:</strong> {payment.invoiceNumber}</p>
                        <p><strong>Specialty:</strong> {payment.hospitalName}</p>
                        <p><strong>Patient:</strong> {payment.patientName}</p>
                        <p><strong>Doctor:</strong> {payment.doctorName}</p>
                        <p><strong>Amount:</strong> LKR {(payment.totalAmount || 0).toLocaleString()}</p>
                        <p><strong>Paid:</strong> LKR {(payment.amountPaid || 0).toLocaleString()}</p>
                        <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                        <p><strong>Status:</strong> 
                          {payment.amountPaid >= payment.totalAmount ? 
                            <span style={{color: 'green'}}> Paid ✅</span> : 
                            <span style={{color: 'orange'}}> Pending ⏳</span>
                          }
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="no-data-message">No billing information available</div>
                  )}
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

            {/* Recent Activities - Now showing real appointment data */}
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
