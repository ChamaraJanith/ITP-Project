import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import jsPDF from 'jspdf';
import '../Financial_Manager/PaymentTotalView.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Constants for the Payment Analytics Dashboard
const PAYMENT_ANALYTICS_CONFIG = {
  brandName: 'Heal-x Healthcare Center',
  pageTitle: 'Payment Analytics Dashboard',
  collectionThresholds: {
    excellent: 90,
    good: 80,
    poor: 60
  },
  chartColors: {
    fullyPaid: '#00C851',
    partiallyPaid: '#ffbb33',
    unpaid: '#ff4444',
    primary: '#4285F4',
    secondary: '#00C851',
    warning: '#ffbb33',
    danger: '#ff4444',
    info: '#33b5e5'
  },
  displayLimits: {
    hospitalChart: 12,
    criticalItems: 15,
    pdfHospitals: 20,
    trendsMonths: 12
  }
};

const PaymentAnalyticsDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  // Enhanced Analytics Calculations
  const analyticsData = useMemo(() => {
    if (!state?.payments) return null;

    const { payments, stats } = state;
    
    // Payment categorization
    const fullyPaid = payments.filter(p => (p.amountPaid || 0) >= (p.totalAmount || 0));
    const partiallyPaid = payments.filter(p => (p.amountPaid || 0) > 0 && (p.amountPaid || 0) < (p.totalAmount || 0));
    const unpaid = payments.filter(p => (p.amountPaid || 0) === 0);

    // Advanced metrics
    const avgInvoiceValue = stats.totalAmountDue / stats.totalPayments;
    const collectionRate = (stats.totalAmountPaid / stats.totalAmountDue) * 100;
    const pendingRate = (stats.totalPending / stats.totalAmountDue) * 100;

    // Monthly trend analysis
    const monthlyTrends = payments.reduce((acc, payment) => {
      if (payment.date) {
        const month = new Date(payment.date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!acc[month]) {
          acc[month] = { totalDue: 0, totalPaid: 0, count: 0, pending: 0 };
        }
        acc[month].totalDue += (payment.totalAmount || 0);
        acc[month].totalPaid += (payment.amountPaid || 0);
        acc[month].pending += ((payment.totalAmount || 0) - (payment.amountPaid || 0));
        acc[month].count += 1;
      }
      return acc;
    }, {});

    // Performance insights
    const performanceInsights = {
      collectionStatus: collectionRate >= PAYMENT_ANALYTICS_CONFIG.collectionThresholds.excellent 
        ? 'excellent' 
        : collectionRate >= PAYMENT_ANALYTICS_CONFIG.collectionThresholds.good 
        ? 'good' 
        : 'needs_improvement',
      topPaymentMethod: Object.entries(stats.paymentMethods)
        .sort(([,a], [,b]) => b - a)[0],
      worstPerformingHospital: Object.entries(stats.hospitalBreakdown)
        .map(([name, data]) => ({
          name,
          collectionRate: data.totalDue > 0 ? (data.totalPaid / data.totalDue) * 100 : 0,
          pending: data.totalDue - data.totalPaid
        }))
        .sort((a, b) => a.collectionRate - b.collectionRate)[0],
      criticalAlerts: {
        highPendingHospitals: Object.entries(stats.hospitalBreakdown)
          .filter(([, data]) => (data.totalDue - data.totalPaid) > avgInvoiceValue * 5)
          .length,
        overdueCritical: unpaid.filter(p => {
          const invoiceDate = new Date(p.date);
          const daysDiff = (new Date() - invoiceDate) / (1000 * 60 * 60 * 24);
          return daysDiff > 30;
        }).length
      }
    };

    return {
      payments,
      stats,
      categories: { fullyPaid, partiallyPaid, unpaid },
      metrics: { avgInvoiceValue, collectionRate, pendingRate },
      monthlyTrends,
      performanceInsights
    };
  }, [state]);

  // PDF Generation Functions - Modularized
  const generateExecutiveSummaryPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header Section
    const addPDFHeader = (doc, y = 20) => {
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(PAYMENT_ANALYTICS_CONFIG.brandName, 105, y, { align: 'center' });
      
      y += 12;
      doc.setFontSize(16);
      doc.text('Executive Payment Analytics Report', 105, y, { align: 'center' });
      
      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${currentDate} | Report ID: HXL-${Date.now()}`, 105, y, { align: 'center' });
      
      return y + 20;
    };

    // Key Metrics Section
    const addKeyMetrics = (doc, y, data) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('🎯 KEY PERFORMANCE INDICATORS', 20, y);
      y += 10;

      const kpiData = [
        ['Total Revenue Collected', `$${data.stats.totalAmountPaid.toLocaleString()}`],
        ['Collection Efficiency', `${data.metrics.collectionRate.toFixed(1)}%`],
        ['Outstanding Balance', `$${data.stats.totalPending.toLocaleString()}`],
        ['Average Invoice Value', `$${data.metrics.avgInvoiceValue.toFixed(2)}`],
        ['Active Hospitals', Object.keys(data.stats.hospitalBreakdown).length.toString()],
        ['Payment Success Rate', `${(data.categories.fullyPaid.length / data.stats.totalPayments * 100).toFixed(1)}%`]
      ];

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      kpiData.forEach(([label, value]) => {
        doc.text(label + ':', 25, y);
        doc.setFont("helvetica", "bold");
        doc.text(value, 120, y);
        doc.setFont("helvetica", "normal");
        y += 7;
      });

      return y + 10;
    };

    // Performance Analysis
    const addPerformanceAnalysis = (doc, y, data) => {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('📊 PERFORMANCE ANALYSIS', 20, y);
      y += 10;

      const { performanceInsights } = data;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      // Collection Status
      const statusColors = {
        excellent: { color: 'green', text: 'EXCELLENT PERFORMANCE' },
        good: { color: 'blue', text: 'GOOD PERFORMANCE' },
        needs_improvement: { color: 'red', text: 'NEEDS IMPROVEMENT' }
      };
      
      const status = statusColors[performanceInsights.collectionStatus];
      doc.text(`Collection Status: ${status.text}`, 25, y);
      y += 8;

      // Top Payment Method
      if (performanceInsights.topPaymentMethod) {
        const [method, amount] = performanceInsights.topPaymentMethod;
        const percentage = ((amount / data.stats.totalAmountPaid) * 100).toFixed(1);
        doc.text(`Primary Payment Method: ${method} (${percentage}% - $${amount.toLocaleString()})`, 25, y);
        y += 8;
      }

      // Critical Alerts
      if (performanceInsights.criticalAlerts.overdueCritical > 0) {
        doc.text(`🚨 CRITICAL: ${performanceInsights.criticalAlerts.overdueCritical} overdue invoices (>30 days)`, 25, y);
        y += 8;
      }

      return y + 10;
    };

    try {
      let currentY = addPDFHeader(doc);
      currentY = addKeyMetrics(doc, currentY, analyticsData);
      currentY = addPerformanceAnalysis(doc, currentY, analyticsData);

      // Save with unique filename
      const fileName = `HealX_Executive_Payment_Report_${currentDate.replace(/\//g, '-')}_${Date.now()}.pdf`;
      doc.save(fileName);

      // Success notification
      const notification = document.createElement('div');
      notification.className = 'payment-analytics-notification success';
      notification.innerHTML = '✅ Executive report generated successfully!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

    } catch (error) {
      console.error("PDF Generation Error:", error);
      const notification = document.createElement('div');
      notification.className = 'payment-analytics-notification error';
      notification.innerHTML = '❌ Error generating report. Please try again.';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  // Chart Data Generators
  const generateChartData = () => {
    if (!analyticsData) return {};

    const { categories, stats, monthlyTrends } = analyticsData;

    return {
      paymentStatusChart: {
        labels: ['Fully Paid', 'Partially Paid', 'Unpaid'],
        datasets: [{
          data: [categories.fullyPaid.length, categories.partiallyPaid.length, categories.unpaid.length],
          backgroundColor: [
            PAYMENT_ANALYTICS_CONFIG.chartColors.fullyPaid,
            PAYMENT_ANALYTICS_CONFIG.chartColors.partiallyPaid,
            PAYMENT_ANALYTICS_CONFIG.chartColors.unpaid
          ],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 4
        }]
      },

      paymentMethodsChart: {
        labels: Object.keys(stats.paymentMethods),
        datasets: [{
          label: 'Revenue by Payment Method',
          data: Object.values(stats.paymentMethods),
          backgroundColor: [
            '#4285F4', '#00C851', '#ffbb33', '#ff4444', 
            '#9C27B0', '#FF6F00', '#607D8B', '#795548'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },

      hospitalPerformanceChart: {
        labels: Object.keys(stats.hospitalBreakdown)
          .slice(0, PAYMENT_ANALYTICS_CONFIG.displayLimits.hospitalChart),
        datasets: [{
          label: 'Amount Due',
          data: Object.values(stats.hospitalBreakdown)
            .slice(0, PAYMENT_ANALYTICS_CONFIG.displayLimits.hospitalChart)
            .map(hospital => hospital.totalDue),
          backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.info,
          borderRadius: 6,
          borderSkipped: false
        }, {
          label: 'Amount Collected',
          data: Object.values(stats.hospitalBreakdown)
            .slice(0, PAYMENT_ANALYTICS_CONFIG.displayLimits.hospitalChart)
            .map(hospital => hospital.totalPaid),
          backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.secondary,
          borderRadius: 6,
          borderSkipped: false
        }]
      },

      monthlyTrendChart: Object.keys(monthlyTrends).length > 0 ? {
        labels: Object.keys(monthlyTrends).slice(-PAYMENT_ANALYTICS_CONFIG.displayLimits.trendsMonths),
        datasets: [{
          label: 'Monthly Collections',
          data: Object.values(monthlyTrends)
            .slice(-PAYMENT_ANALYTICS_CONFIG.displayLimits.trendsMonths)
            .map(month => month.totalPaid),
          backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.secondary,
          borderRadius: 8
        }, {
          label: 'Monthly Invoiced',
          data: Object.values(monthlyTrends)
            .slice(-PAYMENT_ANALYTICS_CONFIG.displayLimits.trendsMonths)
            .map(month => month.totalDue),
          backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.primary,
          borderRadius: 8
        }]
      } : null
    };
  };

  // Error State
  if (!analyticsData) {
    return (
      <div className="payment-analytics-dashboard">
        <div className="analytics-error-container">
          <div className="analytics-error-content">
            <div className="analytics-error-icon">📊</div>
            <h2>Payment Analytics Unavailable</h2>
            <p>No payment data found. Please ensure you've navigated from the Payment Management section.</p>
            <button 
              onClick={() => navigate("/admin/financial/payments")} 
              className="analytics-back-button"
            >
              Return to Payment Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chartData = generateChartData();
  const { categories, stats, metrics, performanceInsights } = analyticsData;

  return (
    <div className="payment-analytics-dashboard">
      {/* Unique Dashboard Header */}
      <div className="analytics-header-section">
        <div className="analytics-header-content">
          <div className="analytics-title-group">
            <h1 className="analytics-main-title">
              <span className="analytics-icon">💰</span>
              {PAYMENT_ANALYTICS_CONFIG.pageTitle}
            </h1>
            <p className="analytics-subtitle">
              Comprehensive financial insights and performance metrics
            </p>
          </div>
          <div className="analytics-action-buttons">
            <button 
              onClick={() => navigate("/admin/financial/payments")} 
              className="analytics-btn analytics-btn-secondary"
            >
              ← Payment Management
            </button>
            <button 
              onClick={() => window.print()} 
              className="analytics-btn analytics-btn-outline"
            >
              🖨️ Print Dashboard
            </button>
            <button 
              onClick={generateExecutiveSummaryPDF} 
              className="analytics-btn analytics-btn-primary"
            >
              📋 Executive Report
            </button>
          </div>
        </div>
      </div>

      {/* Performance Status Banner */}
      <div className={`analytics-performance-banner status-${performanceInsights.collectionStatus}`}>
        <div className="performance-banner-content">
          <div className="performance-status">
            <span className="status-icon">
              {performanceInsights.collectionStatus === 'excellent' ? '🎯' : 
               performanceInsights.collectionStatus === 'good' ? '📈' : '⚠️'}
            </span>
            <div className="status-text">
              <h3>Collection Rate: {metrics.collectionRate.toFixed(1)}%</h3>
              <p>
                {performanceInsights.collectionStatus === 'excellent' && 'Outstanding performance! Keep up the excellent work.'}
                {performanceInsights.collectionStatus === 'good' && 'Good performance with room for improvement.'}
                {performanceInsights.collectionStatus === 'needs_improvement' && 'Action required to improve collection efficiency.'}
              </p>
            </div>
          </div>
          {performanceInsights.criticalAlerts.overdueCritical > 0 && (
            <div className="critical-alert">
              <span className="alert-icon">🚨</span>
              <span>{performanceInsights.criticalAlerts.overdueCritical} overdue invoices need immediate attention</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card primary-kpi">
          <div className="kpi-icon-wrapper">
            <span className="kpi-icon">💵</span>
          </div>
          <div className="kpi-content">
            <div className="kpi-value">${stats.totalAmountPaid.toLocaleString()}</div>
            <div className="kpi-label">Total Revenue Collected</div>
            <div className="kpi-trend positive">
              +${(stats.totalAmountPaid - stats.totalPending).toLocaleString()} net
            </div>
          </div>
        </div>

        <div className="analytics-kpi-card success-kpi">
          <div className="kpi-icon-wrapper">
            <span className="kpi-icon">🎯</span>
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{metrics.collectionRate.toFixed(1)}%</div>
            <div className="kpi-label">Collection Efficiency</div>
            <div className={`kpi-trend ${metrics.collectionRate >= 80 ? 'positive' : 'negative'}`}>
              {metrics.collectionRate >= 80 ? 'Above target' : 'Below target'}
            </div>
          </div>
        </div>

        <div className="analytics-kpi-card warning-kpi">
          <div className="kpi-icon-wrapper">
            <span className="kpi-icon">⏳</span>
          </div>
          <div className="kpi-content">
            <div className="kpi-value">${stats.totalPending.toLocaleString()}</div>
            <div className="kpi-label">Outstanding Balance</div>
            <div className="kpi-trend neutral">
              {metrics.pendingRate.toFixed(1)}% of total due
            </div>
          </div>
        </div>

        <div className="analytics-kpi-card info-kpi">
          <div className="kpi-icon-wrapper">
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.totalPayments}</div>
            <div className="kpi-label">Total Invoices</div>
            <div className="kpi-trend neutral">
              ${metrics.avgInvoiceValue.toFixed(2)} average
            </div>
          </div>
        </div>

        <div className="analytics-kpi-card success-kpi">
          <div className="kpi-icon-wrapper">
            <span className="kpi-icon">✅</span>
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{categories.fullyPaid.length}</div>
            <div className="kpi-label">Fully Paid</div>
            <div className="kpi-trend positive">
              {((categories.fullyPaid.length / stats.totalPayments) * 100).toFixed(1)}% success rate
            </div>
          </div>
        </div>

        <div className="analytics-kpi-card danger-kpi">
          <div className="kpi-icon-wrapper">
            <span className="kpi-icon">🚨</span>
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{categories.unpaid.length}</div>
            <div className="kpi-label">Unpaid Invoices</div>
            <div className="kpi-trend negative">
              Require immediate action
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chart Section */}
      <div className="analytics-charts-section">
        {/* Payment Status Distribution */}
        <div className="analytics-chart-container featured-chart">
          <div className="chart-header-enhanced">
            <div className="chart-title-group">
              <h3>Payment Status Distribution</h3>
              <p>Current status of all invoices in the system</p>
            </div>
            <div className="chart-stats">
              <span className="chart-stat">
                <span className="stat-dot" style={{backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.fullyPaid}}></span>
                {categories.fullyPaid.length} Paid
              </span>
              <span className="chart-stat">
                <span className="stat-dot" style={{backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.partiallyPaid}}></span>
                {categories.partiallyPaid.length} Partial
              </span>
              <span className="chart-stat">
                <span className="stat-dot" style={{backgroundColor: PAYMENT_ANALYTICS_CONFIG.chartColors.unpaid}}></span>
                {categories.unpaid.length} Unpaid
              </span>
            </div>
          </div>
          <div className="chart-wrapper-enhanced">
            <Doughnut 
              data={chartData.paymentStatusChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: { size: 14 }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const percentage = ((context.parsed / stats.totalPayments) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed} invoices (${percentage}%)`;
                      }
                    }
                  }
                },
                cutout: '60%'
              }} 
            />
          </div>
        </div>

        {/* Payment Methods Analysis */}
        <div className="analytics-chart-container">
          <div className="chart-header-enhanced">
            <div className="chart-title-group">
              <h3>Payment Methods Revenue</h3>
              <p>Revenue distribution by payment method</p>
            </div>
          </div>
          <div className="chart-wrapper-enhanced">
            <Pie 
              data={chartData.paymentMethodsChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 15
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const percentage = ((context.parsed / stats.totalAmountPaid) * 100).toFixed(1);
                        return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Hospital Performance Chart - Full Width */}
      <div className="analytics-chart-container full-width-chart">
        <div className="chart-header-enhanced">
          <div className="chart-title-group">
            <h3>Hospital Performance Comparison</h3>
            <p>Revenue due vs. collected by hospital (Top {PAYMENT_ANALYTICS_CONFIG.displayLimits.hospitalChart})</p>
          </div>
        </div>
        <div className="chart-wrapper-large">
          <Bar 
            data={chartData.hospitalPerformanceChart} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                intersect: false,
                mode: 'index'
              },
              plugins: {
                legend: { 
                  position: 'top',
                  labels: { usePointStyle: true, padding: 20 }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
                  }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { maxRotation: 45 }
                },
                y: {
                  beginAtZero: true,
                  grid: { color: '#f0f0f0' },
                  ticks: {
                    callback: (value) => '$' + value.toLocaleString()
                  }
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Monthly Trend Chart (if data available) */}
      {chartData.monthlyTrendChart && (
        <div className="analytics-chart-container full-width-chart">
          <div className="chart-header-enhanced">
            <div className="chart-title-group">
              <h3>Monthly Revenue Trends</h3>
              <p>Revenue collection patterns over time</p>
            </div>
          </div>
          <div className="chart-wrapper-large">
            <Bar 
              data={chartData.monthlyTrendChart} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => '$' + value.toLocaleString()
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      )}

      {/* Critical Items Section */}
      {(categories.unpaid.length > 0 || categories.partiallyPaid.length > 0) && (
        <div className="analytics-critical-section">
          <div className="critical-section-header">
            <h3>🚨 Items Requiring Immediate Attention</h3>
            <p>Outstanding payments that need follow-up action</p>
          </div>
          
          <div className="critical-items-grid">
            {categories.unpaid.length > 0 && (
              <div className="critical-items-card unpaid-items">
                <div className="critical-card-header">
                  <h4>🚫 Unpaid Invoices ({categories.unpaid.length})</h4>
                  <span className="critical-amount-total">
                    ${categories.unpaid.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="critical-items-list">
                  {categories.unpaid.slice(0, PAYMENT_ANALYTICS_CONFIG.displayLimits.criticalItems).map(payment => (
                    <div key={payment._id} className="critical-item-row">
                      <div className="item-details">
                        <span className="invoice-number">#{payment.invoiceNumber}</span>
                        <span className="hospital-name">{payment.hospitalName}</span>
                        <span className="patient-name">{payment.patientName}</span>
                      </div>
                      <div className="item-amount unpaid-amount">
                        ${(payment.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                {categories.unpaid.length > PAYMENT_ANALYTICS_CONFIG.displayLimits.criticalItems && (
                  <div className="items-overflow">
                    +{categories.unpaid.length - PAYMENT_ANALYTICS_CONFIG.displayLimits.criticalItems} more unpaid invoices
                  </div>
                )}
              </div>
            )}

            {categories.partiallyPaid.length > 0 && (
              <div className="critical-items-card partial-items">
                <div className="critical-card-header">
                  <h4>⚠️ Partially Paid Invoices ({categories.partiallyPaid.length})</h4>
                  <span className="critical-amount-total">
                    ${categories.partiallyPaid.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.amountPaid || 0)), 0).toLocaleString()} pending
                  </span>
                </div>
                <div className="critical-items-list">
                  {categories.partiallyPaid.slice(0, PAYMENT_ANALYTICS_CONFIG.displayLimits.criticalItems).map(payment => {
                    const pending = (payment.totalAmount || 0) - (payment.amountPaid || 0);
                    return (
                      <div key={payment._id} className="critical-item-row">
                        <div className="item-details">
                          <span className="invoice-number">#{payment.invoiceNumber}</span>
                          <span className="hospital-name">{payment.hospitalName}</span>
                          <span className="patient-name">{payment.patientName}</span>
                        </div>
                        <div className="item-amount partial-amount">
                          ${pending.toLocaleString()} pending
                        </div>
                      </div>
                    );
                  })}
                </div>
                {categories.partiallyPaid.length > PAYMENT_ANALYTICS_CONFIG.displayLimits.criticalItems && (
                  <div className="items-overflow">
                    +{categories.partiallyPaid.length - PAYMENT_ANALYTICS_CONFIG.displayLimits.criticalItems} more partial payments
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive Summary Section */}
      <div className="analytics-executive-summary">
        <div className="executive-summary-header">
          <h3>📋 Executive Summary</h3>
          <p>Key insights and recommendations based on current payment data</p>
        </div>
        
        <div className="executive-summary-grid">
          <div className="summary-insight-card">
            <h4>🎯 Performance Highlights</h4>
            <ul className="insight-list">
              <li>Collection rate of <strong>{metrics.collectionRate.toFixed(1)}%</strong> indicates {performanceInsights.collectionStatus} performance</li>
              <li>Average invoice value of <strong>${metrics.avgInvoiceValue.toFixed(2)}</strong> across {stats.totalPayments} invoices</li>
              <li><strong>{categories.fullyPaid.length}</strong> invoices fully paid ({((categories.fullyPaid.length / stats.totalPayments) * 100).toFixed(1)}% success rate)</li>
              <li>Primary payment method: <strong>{performanceInsights.topPaymentMethod?.[0] || 'N/A'}</strong></li>
            </ul>
          </div>

          <div className="summary-insight-card">
            <h4>⚠️ Areas Requiring Attention</h4>
            <ul className="insight-list attention-items">
              <li><strong>{categories.unpaid.length}</strong> unpaid invoices requiring immediate follow-up</li>
              <li><strong>{categories.partiallyPaid.length}</strong> partially paid invoices need completion</li>
              <li>Total outstanding: <strong>${stats.totalPending.toLocaleString()}</strong> ({metrics.pendingRate.toFixed(1)}% of total)</li>
              {performanceInsights.criticalAlerts.overdueCritical > 0 && (
                <li className="critical-item">🚨 <strong>{performanceInsights.criticalAlerts.overdueCritical}</strong> invoices overdue by 30+ days</li>
              )}
            </ul>
          </div>

          <div className="summary-insight-card">
            <h4>💡 Strategic Recommendations</h4>
            <ul className="insight-list recommendations">
              {metrics.collectionRate < PAYMENT_ANALYTICS_CONFIG.collectionThresholds.good && (
                <li>Implement stricter follow-up procedures for outstanding payments</li>
              )}
              {categories.unpaid.length > stats.totalPayments * 0.1 && (
                <li>Consider automated reminder systems for unpaid invoices</li>
              )}
              <li>Focus collection efforts on top-performing payment methods</li>
              <li>Regular review of hospital payment patterns for optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalyticsDashboard;
