import React from 'react';    
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
import jsPDF from 'jspdf'; // Add this import
import '../Financial_Manager/PaymentTotalView.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PaymentTotalView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  if (!state || !state.payments) {
    return (
      <div className="payment-total-view">
        <div className="payment-total-error-container">
          <div className="payment-total-error-content">
            <h2>⚠️ No Payment Data Available</h2>
            <p>Please navigate from the Payment Management page to view the payment analysis.</p>
            <button onClick={() => navigate("/admin/financial/payments")} className="payment-total-back-btn">
              ← Back to Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { payments, stats } = state;

  // Calculate additional metrics
  const fullyPaidPayments = payments.filter(p => (p.amountPaid || 0) >= (p.totalAmount || 0));
  const partiallyPaidPayments = payments.filter(p => (p.amountPaid || 0) > 0 && (p.amountPaid || 0) < (p.totalAmount || 0));
  const unpaidPayments = payments.filter(p => (p.amountPaid || 0) === 0);

  // NEW: Comprehensive PDF Generation Function
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Heal-x Healthcare Center', 105, y, { align: 'center' });
      
      y += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text('Comprehensive Payment Analysis Report', 105, y, { align: 'center' });
      
      y += 8;
      doc.setFontSize(12);
      doc.text(`Report Generated: ${currentDate}`, 105, y, { align: 'center' });
      
      y += 15;

      // Executive Summary Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('EXECUTIVE SUMMARY', 20, y);
      y += 8;

      // Summary table
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Summary data
      const summaryData = [
        ['Total Invoices', stats.totalPayments.toString()],
        ['Total Amount Due', `$${stats.totalAmountDue.toLocaleString()}`],
        ['Total Amount Paid', `$${stats.totalAmountPaid.toLocaleString()}`],
        ['Pending Amount', `$${stats.totalPending.toLocaleString()}`],
        ['Collection Rate', `${((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%`],
        ['Average Invoice Value', `$${(stats.totalAmountDue / stats.totalPayments).toFixed(2)}`],
        ['Fully Paid Invoices', fullyPaidPayments.length.toString()],
        ['Partially Paid Invoices', partiallyPaidPayments.length.toString()],
        ['Unpaid Invoices', unpaidPayments.length.toString()]
      ];

      // Draw summary table
      summaryData.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.text(label + ':', 30, y);
        doc.setFont("helvetica", "bold");
        doc.text(value, 120, y);
        y += 6;
      });

      y += 10;

      // Payment Method Breakdown Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('PAYMENT METHOD BREAKDOWN', 20, y);
      y += 8;

      // Payment methods table header
      doc.setFontSize(9);
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.text('Payment Method', 25, y + 4);
      doc.text('Amount', 80, y + 4);
      doc.text('Percentage', 120, y + 4);
      doc.text('Usage Count', 155, y + 4);
      y += 6;

      // Payment methods data
      doc.setFont("helvetica", "normal");
      Object.entries(stats.paymentMethods)
        .sort(([,a], [,b]) => b - a)
        .forEach(([method, amount]) => {
          const percentage = ((amount / stats.totalAmountPaid) * 100).toFixed(1);
          const usageCount = payments.filter(p => p.paymentMethod === method).length;
          
          doc.rect(20, y, 170, 6, 'S');
          doc.text(method, 25, y + 4);
          doc.text(`$${amount.toLocaleString()}`, 80, y + 4);
          doc.text(`${percentage}%`, 120, y + 4);
          doc.text(usageCount.toString(), 155, y + 4);
          y += 6;
        });

      y += 10;

      // Hospital Performance Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('HOSPITAL PERFORMANCE ANALYSIS', 20, y);
      y += 8;

      // Hospital performance table header
      doc.setFontSize(8);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.text('Hospital', 25, y + 4);
      doc.text('Invoices', 70, y + 4);
      doc.text('Total Due', 95, y + 4);
      doc.text('Total Paid', 125, y + 4);
      doc.text('Pending', 155, y + 4);
      doc.text('Rate%', 175, y + 4);
      y += 6;

      // Hospital performance data
      doc.setFont("helvetica", "normal");
      Object.entries(stats.hospitalBreakdown)
        .sort(([,a], [,b]) => b.totalDue - a.totalDue)
        .slice(0, 10) // Top 10 hospitals
        .forEach(([hospital, data]) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          
          const pending = data.totalDue - data.totalPaid;
          const collectionRate = data.totalDue > 0 ? ((data.totalPaid / data.totalDue) * 100).toFixed(0) : 0;
          
          doc.rect(20, y, 170, 6, 'S');
          doc.text(hospital.substring(0, 15), 25, y + 4);
          doc.text(data.count.toString(), 70, y + 4);
          doc.text(`$${data.totalDue.toFixed(0)}`, 95, y + 4);
          doc.text(`$${data.totalPaid.toFixed(0)}`, 125, y + 4);
          doc.text(`$${pending.toFixed(0)}`, 155, y + 4);
          doc.text(`${collectionRate}%`, 175, y + 4);
          y += 6;
        });

      y += 10;

      // Outstanding Payments Section
      if (unpaidPayments.length > 0 || partiallyPaidPayments.length > 0) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('CRITICAL - OUTSTANDING PAYMENTS', 20, y);
        y += 8;

        if (unpaidPayments.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Unpaid Invoices (${unpaidPayments.length}):`, 30, y);
          y += 6;

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          unpaidPayments.slice(0, 15).forEach(payment => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(`• Invoice ${payment.invoiceNumber} - ${payment.hospitalName} - $${(payment.totalAmount || 0).toLocaleString()}`, 35, y);
            y += 4;
          });
          y += 5;
        }

        if (partiallyPaidPayments.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Partially Paid Invoices (${partiallyPaidPayments.length}):`, 30, y);
          y += 6;

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          partiallyPaidPayments.slice(0, 15).forEach(payment => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            const pending = (payment.totalAmount || 0) - (payment.amountPaid || 0);
            doc.text(`• Invoice ${payment.invoiceNumber} - ${payment.hospitalName} - Pending: $${pending.toLocaleString()}`, 35, y);
            y += 4;
          });
        }
      }

      // Monthly Trend Analysis (if available)
      const monthlyData = {};
      payments.forEach(payment => {
        if (payment.date) {
          const month = new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          if (!monthlyData[month]) {
            monthlyData[month] = { totalDue: 0, totalPaid: 0, count: 0 };
          }
          monthlyData[month].totalDue += (payment.totalAmount || 0);
          monthlyData[month].totalPaid += (payment.amountPaid || 0);
          monthlyData[month].count += 1;
        }
      });

      if (Object.keys(monthlyData).length > 0) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('MONTHLY REVENUE TREND', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 170, 6, 'F');
        doc.setFont("helvetica", "bold");
        doc.text('Month', 25, y + 4);
        doc.text('Invoices', 70, y + 4);
        doc.text('Revenue', 110, y + 4);
        doc.text('Invoiced', 150, y + 4);
        y += 6;

        doc.setFont("helvetica", "normal");
        Object.entries(monthlyData).forEach(([month, data]) => {
          doc.rect(20, y, 170, 6, 'S');
          doc.text(month, 25, y + 4);
          doc.text(data.count.toString(), 70, y + 4);
          doc.text(`$${data.totalPaid.toLocaleString()}`, 110, y + 4);
          doc.text(`$${data.totalDue.toLocaleString()}`, 150, y + 4);
          y += 6;
        });
      }

      // Add new page for summary and signature
      doc.addPage();
      y = 30;

      // Key Insights Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('KEY INSIGHTS & RECOMMENDATIONS', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Collection Rate Analysis
      const collectionRate = ((stats.totalAmountPaid / stats.totalAmountDue) * 100);
      doc.text(`• Overall collection rate: ${collectionRate.toFixed(1)}%`, 30, y);
      y += 6;
      
      if (collectionRate < 80) {
        doc.text(`• RECOMMENDATION: Collection rate below 80%. Focus on follow-up procedures.`, 30, y);
      } else if (collectionRate >= 90) {
        doc.text(`• EXCELLENT: Collection rate above 90%. Maintain current procedures.`, 30, y);
      } else {
        doc.text(`• GOOD: Collection rate is healthy but can be improved.`, 30, y);
      }
      y += 8;

      // Top Payment Method
      const topPaymentMethod = Object.entries(stats.paymentMethods)
        .sort(([,a], [,b]) => b - a)[0];
      doc.text(`• Primary payment method: ${topPaymentMethod[0]} (${((topPaymentMethod[1] / stats.totalAmountPaid) * 100).toFixed(1)}%)`, 30, y);
      y += 8;

      // Outstanding Amount Alert
      if (stats.totalPending > stats.totalAmountPaid * 0.1) {
        doc.text(`• ALERT: Outstanding amount ($${stats.totalPending.toLocaleString()}) exceeds 10% of collected revenue`, 30, y);
      } else {
        doc.text(`• Outstanding amount is within acceptable range: $${stats.totalPending.toLocaleString()}`, 30, y);
      }
      y += 15;

      // Report Summary
      doc.setFont("helvetica", "bold");
      doc.text('REPORT SUMMARY', 20, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`This report covers ${stats.totalPayments} invoices with a total value of $${stats.totalAmountDue.toLocaleString()}.`, 30, y);
      y += 6;
      doc.text(`Revenue collection stands at $${stats.totalAmountPaid.toLocaleString()} (${collectionRate.toFixed(1)}% collection rate).`, 30, y);
      y += 6;
      doc.text(`${unpaidPayments.length} invoices remain unpaid and ${partiallyPaidPayments.length} are partially paid.`, 30, y);
      y += 6;
      doc.text(`Immediate attention required for ${unpaidPayments.length + partiallyPaidPayments.length} outstanding accounts.`, 30, y);

      // Signature section
      y += 30;
      doc.text('Financial Manager of Heal-x', 20, y);
      y += 15;
      doc.text('.'.repeat(50), 20, y);
      y += 10;
      doc.setFontSize(8);
      doc.text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, y);

      // Save PDF
      const fileName = `Heal-x_Payment_Analysis_Report_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      alert("Comprehensive payment analysis report generated successfully!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF report: " + error.message);
    }
  };

  // Payment Status Chart Data
  const paymentStatusData = {
    labels: ['Fully Paid', 'Partially Paid', 'Unpaid'],
    datasets: [{
      data: [fullyPaidPayments.length, partiallyPaidPayments.length, unpaidPayments.length],
      backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // Payment Methods Chart Data
  const paymentMethodsChartData = {
    labels: Object.keys(stats.paymentMethods),
    datasets: [{
      label: 'Amount Paid by Method ($)',
      data: Object.values(stats.paymentMethods),
      backgroundColor: [
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF', 
        '#FF9F40'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // Hospital Performance Chart Data
  const hospitalChartData = {
    labels: Object.keys(stats.hospitalBreakdown).slice(0, 10),
    datasets: [{
      label: 'Total Due ($)',
      data: Object.values(stats.hospitalBreakdown).slice(0, 10).map(hospital => hospital.totalDue),
      backgroundColor: '#36A2EB',
      borderRadius: 4
    }, {
      label: 'Total Paid ($)',
      data: Object.values(stats.hospitalBreakdown).slice(0, 10).map(hospital => hospital.totalPaid),
      backgroundColor: '#4BC0C0',
      borderRadius: 4
    }]
  };

  // Monthly trend data (if payments have dates)
  const getMonthlyTrend = () => {
    const monthlyData = {};
    payments.forEach(payment => {
      if (payment.date) {
        const month = new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { totalDue: 0, totalPaid: 0, count: 0 };
        }
        monthlyData[month].totalDue += (payment.totalAmount || 0);
        monthlyData[month].totalPaid += (payment.amountPaid || 0);
        monthlyData[month].count += 1;
      }
    });
    return monthlyData;
  };

  const monthlyTrend = getMonthlyTrend();
  const trendChartData = {
    labels: Object.keys(monthlyTrend),
    datasets: [{
      label: 'Monthly Revenue ($)',
      data: Object.values(monthlyTrend).map(month => month.totalPaid),
      backgroundColor: '#28a745',
      borderRadius: 4
    }, {
      label: 'Monthly Invoiced ($)',
      data: Object.values(monthlyTrend).map(month => month.totalDue),
      backgroundColor: '#6c757d',
      borderRadius: 4
    }]
  };

  return (
    <div className="payment-total-view">
      {/* Header */}
      <div className="payment-total-page-header">
        <div className="payment-total-header-content">
          <h1>💰 Payment Analysis & Reports</h1>
          <div className="payment-total-header-actions">
            <button onClick={() => navigate("/admin/financial/payments")} className="payment-total-back-btn">
              ← Back to Payments
            </button>
            <button onClick={() => window.print()} className="payment-total-print-btn">
              🖨️ Print Report SS
            </button>
            <button onClick={generatePDF} className="payment-total-export-btn">
              📤 Export Report PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payment-total-summary-grid">
        <div className="payment-total-summary-card payment-total-primary-card">
          <div className="payment-total-card-icon">📄</div>
          <div className="payment-total-card-content">
            <h2>{stats.totalPayments}</h2>
            <p>Total Invoices</p>
            <div className="payment-total-card-trend">
              <span className="payment-total-trend-info">🏥 All Hospitals</span>
            </div>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-success-card">
          <div className="payment-total-card-icon">💵</div>
          <div className="payment-total-card-content">
            <h3>${stats.totalAmountDue.toLocaleString()}</h3>
            <p>Total Amount Due</p>
            <small>All invoices combined</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-primary-card">
          <div className="payment-total-card-icon">✅</div>
          <div className="payment-total-card-content">
            <h3>${stats.totalAmountPaid.toLocaleString()}</h3>
            <p>Total Amount Paid</p>
            <small>Revenue collected</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-warning-card">
          <div className="payment-total-card-icon">⏳</div>
          <div className="payment-total-card-content">
            <h3>${stats.totalPending.toLocaleString()}</h3>
            <p>Pending Amount</p>
            <small>{((stats.totalPending / stats.totalAmountDue) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-success-card">
          <div className="payment-total-card-icon">📊</div>
          <div className="payment-total-card-content">
            <h3>{((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%</h3>
            <p>Collection Rate</p>
            <small>Payment efficiency</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card">
          <div className="payment-total-card-icon">💳</div>
          <div className="payment-total-card-content">
            <h3>${(stats.totalAmountDue / stats.totalPayments).toFixed(2)}</h3>
            <p>Avg Invoice Value</p>
            <small>Per invoice</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="payment-total-charts-section">
        {/* Payment Status */}
        <div className="payment-total-chart-container">
          <div className="payment-total-chart-header">
            <h3>📊 Payment Status Overview</h3>
            <p>Distribution of payments by status</p>
          </div>
          <div className="payment-total-chart-wrapper">
            <Doughnut data={paymentStatusData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label;
                      const value = context.parsed;
                      const percentage = ((value / stats.totalPayments) * 100).toFixed(1);
                      return `${label}: ${value} invoices (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-total-chart-container">
          <div className="payment-total-chart-header">
            <h3>💳 Payment Methods Breakdown</h3>
            <p>Revenue by payment method</p>
          </div>
          <div className="payment-total-chart-wrapper">
            <Pie data={paymentMethodsChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label;
                      const value = context.parsed;
                      return `${label}: $${value.toLocaleString()}`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Hospital Performance */}
      <div className="payment-total-chart-container payment-total-full-width">
        <div className="payment-total-chart-header">
          <h3>🏥 Hospital Performance Analysis</h3>
          <p>Revenue due vs collected by hospital</p>
        </div>
        <div className="payment-total-chart-wrapper payment-total-large">
          <Bar data={hospitalChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    return '$' + value.toLocaleString();
                  }
                }
              }
            }
          }} />
        </div>
      </div>

      {/* Monthly Trend if available */}
      {Object.keys(monthlyTrend).length > 0 && (
        <div className="payment-total-chart-container payment-total-full-width">
          <div className="payment-total-chart-header">
            <h3>📈 Monthly Revenue Trend</h3>
            <p>Revenue collection over time</p>
          </div>
          <div className="payment-total-chart-wrapper payment-total-large">
            <Bar data={trendChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      )}

      {/* Detailed Analysis Tables */}
      <div className="payment-total-analysis-section">
        <div className="payment-total-analysis-grid">
          {/* Hospital Analysis Table */}
          <div className="payment-total-analysis-card">
            <h3>🏥 Hospital Analysis</h3>
            <div className="payment-total-analysis-table-container">
              <table className="payment-total-analysis-table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Invoices</th>
                    <th>Total Due</th>
                    <th>Total Paid</th>
                    <th>Pending</th>
                    <th>Collection %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.hospitalBreakdown)
                    .sort(([,a], [,b]) => b.totalDue - a.totalDue)
                    .map(([hospital, data]) => {
                      const pending = data.totalDue - data.totalPaid;
                      const collectionRate = data.totalDue > 0 ? ((data.totalPaid / data.totalDue) * 100).toFixed(1) : 0;
                      return (
                        <tr key={hospital}>
                          <td><strong>{hospital}</strong></td>
                          <td>{data.count}</td>
                          <td>${data.totalDue.toLocaleString()}</td>
                          <td>${data.totalPaid.toLocaleString()}</td>
                          <td>
                            <span style={{ 
                              color: pending > 0 ? '#dc3545' : '#28a745',
                              fontWeight: 'bold'
                            }}>
                              ${pending.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span style={{ 
                              color: collectionRate >= 80 ? '#28a745' : collectionRate >= 60 ? '#ffc107' : '#dc3545',
                              fontWeight: 'bold'
                            }}>
                              {collectionRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods Analysis */}
          <div className="payment-total-analysis-card">
            <h3>💳 Payment Methods Analysis</h3>
            <div className="payment-total-analysis-table-container">
              <table className="payment-total-analysis-table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Total Amount</th>
                    <th>% of Total Revenue</th>
                    <th>Usage Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.paymentMethods)
                    .sort(([,a], [,b]) => b - a)
                    .map(([method, amount]) => {
                      const percentage = ((amount / stats.totalAmountPaid) * 100).toFixed(1);
                      const usageCount = payments.filter(p => p.paymentMethod === method).length;
                      return (
                        <tr key={method}>
                          <td><strong>{method}</strong></td>
                          <td>${amount.toLocaleString()}</td>
                          <td>{percentage}%</td>
                          <td>{usageCount}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Payments */}
      {(partiallyPaidPayments.length > 0 || unpaidPayments.length > 0) && (
        <div className="payment-total-critical-items-section">
          <h3>🚨 Outstanding Payments Requiring Attention</h3>
          
          {unpaidPayments.length > 0 && (
            <div className="payment-total-critical-card payment-total-danger-card">
              <h4>🚫 Unpaid Invoices ({unpaidPayments.length})</h4>
              <div className="payment-total-critical-items-grid">
                {unpaidPayments.slice(0, 10).map(payment => (
                  <div key={payment._id} className="payment-total-critical-item">
                    <strong>Invoice: {payment.invoiceNumber}</strong>
                    <small>{payment.hospitalName} - {payment.patientName}</small>
                    <span className="payment-total-critical-amount">${(payment.totalAmount || 0).toLocaleString()}</span>
                    <span className="payment-total-critical-status payment-total-unpaid">UNPAID</span>
                  </div>
                ))}
              </div>
              {unpaidPayments.length > 10 && (
                <p className="payment-total-show-more">... and {unpaidPayments.length - 10} more</p>
              )}
            </div>
          )}

          {partiallyPaidPayments.length > 0 && (
            <div className="payment-total-critical-card payment-total-warning-card">
              <h4>⚠️ Partially Paid Invoices ({partiallyPaidPayments.length})</h4>
              <div className="payment-total-critical-items-grid">
                {partiallyPaidPayments.slice(0, 10).map(payment => {
                  const pending = (payment.totalAmount || 0) - (payment.amountPaid || 0);
                  return (
                    <div key={payment._id} className="payment-total-critical-item">
                      <strong>Invoice: {payment.invoiceNumber}</strong>
                      <small>{payment.hospitalName} - {payment.patientName}</small>
                      <span className="payment-total-critical-amount">${pending.toLocaleString()} pending</span>
                      <span className="payment-total-critical-status payment-total-partial">PARTIAL</span>
                    </div>
                  );
                })}
              </div>
              {partiallyPaidPayments.length > 10 && (
                <p className="payment-total-show-more">... and {partiallyPaidPayments.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Executive Summary */}
      <div className="payment-total-summary-report">
        <h3>📋 Executive Payment Summary</h3>
        <div className="payment-total-report-grid">
          <div className="payment-total-report-section">
            <h4>💰 Financial Overview</h4>
            <ul>
              <li><strong>Total Invoices:</strong> {stats.totalPayments}</li>
              <li><strong>Total Amount Due:</strong> ${stats.totalAmountDue.toLocaleString()}</li>
              <li><strong>Total Amount Paid:</strong> ${stats.totalAmountPaid.toLocaleString()}</li>
              <li><strong>Collection Rate:</strong> {((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%</li>
            </ul>
          </div>
          
          <div className="payment-total-report-section">
            <h4>🏥 Top Performing Hospital</h4>
            {(() => {
              const topHospital = Object.entries(stats.hospitalBreakdown)
                .reduce((max, [name, data]) => data.totalPaid > max.data.totalPaid ? {name, data} : max, 
                  {name: '', data: {totalPaid: 0, totalDue: 0, count: 0}});
              const collectionRate = topHospital.data.totalDue > 0 ? 
                ((topHospital.data.totalPaid / topHospital.data.totalDue) * 100).toFixed(1) : 0;
              return (
                <ul>
                  <li><strong>Hospital:</strong> {topHospital.name}</li>
                  <li><strong>Revenue:</strong> ${topHospital.data.totalPaid.toLocaleString()}</li>
                  <li><strong>Invoices:</strong> {topHospital.data.count}</li>
                  <li><strong>Collection Rate:</strong> {collectionRate}%</li>
                </ul>
              );
            })()}
          </div>
          
          <div className="payment-total-report-section">
            <h4>🚨 Collection Alerts</h4>
            <ul>
              <li><strong>Unpaid Invoices:</strong> {unpaidPayments.length}</li>
              <li><strong>Partially Paid:</strong> {partiallyPaidPayments.length}</li>
              <li><strong>Outstanding Amount:</strong> ${stats.totalPending.toLocaleString()}</li>
              <li><strong>Action Required:</strong> {unpaidPayments.length > 0 ? 'Immediate' : partiallyPaidPayments.length > 0 ? 'Follow-up' : 'None'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTotalView;
