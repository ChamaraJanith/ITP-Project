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

import '../Financial_Manager/PaymentTotalView.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PaymentTotalView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  if (!state || !state.payments) {
    return (
      <div className="payment-total-view">
        <div className="error-container">
          <div className="error-content">
            <h2>⚠️ No Payment Data Available</h2>
            <p>Please navigate from the Payment Management page to view the payment analysis.</p>
            <button onClick={() => navigate("/admin/financial/payments")} className="back-btn">
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
      <div className="page-header">
        <div className="header-content">
          <h1>💰 Payment Analysis & Reports</h1>
          <div className="header-actions">
            <button onClick={() => navigate("/admin/financial/payments")} className="back-btn">
              ← Back to Payments
            </button>
            <button onClick={() => window.print()} className="print-btn">
              🖨️ Print Report
            </button>
            <button onClick={() => {
              const data = JSON.stringify({stats, payments}, null, 2);
              const blob = new Blob([data], {type: 'application/json'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'payment-analysis-report.json';
              a.click();
            }} className="export-btn">
              📤 Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card primary-card">
          <div className="card-icon">📄</div>
          <div className="card-content">
            <h2>{stats.totalPayments}</h2>
            <p>Total Invoices</p>
            <div className="card-trend">
              <span className="trend-info">🏥 All Hospitals</span>
            </div>
          </div>
        </div>
        
        <div className="summary-card success-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>${stats.totalAmountDue.toLocaleString()}</h3>
            <p>Total Amount Due</p>
            <small>All invoices combined</small>
          </div>
        </div>
        
        <div className="summary-card primary-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>${stats.totalAmountPaid.toLocaleString()}</h3>
            <p>Total Amount Paid</p>
            <small>Revenue collected</small>
          </div>
        </div>
        
        <div className="summary-card warning-card">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>${stats.totalPending.toLocaleString()}</h3>
            <p>Pending Amount</p>
            <small>{((stats.totalPending / stats.totalAmountDue) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        
        <div className="summary-card success-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%</h3>
            <p>Collection Rate</p>
            <small>Payment efficiency</small>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <h3>${(stats.totalAmountDue / stats.totalPayments).toFixed(2)}</h3>
            <p>Avg Invoice Value</p>
            <small>Per invoice</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Payment Status */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>📊 Payment Status Overview</h3>
            <p>Distribution of payments by status</p>
          </div>
          <div className="chart-wrapper">
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
        <div className="chart-container">
          <div className="chart-header">
            <h3>💳 Payment Methods Breakdown</h3>
            <p>Revenue by payment method</p>
          </div>
          <div className="chart-wrapper">
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
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3>🏥 Hospital Performance Analysis</h3>
          <p>Revenue due vs collected by hospital</p>
        </div>
        <div className="chart-wrapper large">
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
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3>📈 Monthly Revenue Trend</h3>
            <p>Revenue collection over time</p>
          </div>
          <div className="chart-wrapper large">
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
      <div className="analysis-section">
        <div className="analysis-grid">
          {/* Hospital Analysis Table */}
          <div className="analysis-card">
            <h3>🏥 Hospital Analysis</h3>
            <div className="analysis-table-container">
              <table className="analysis-table">
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
          <div className="analysis-card">
            <h3>💳 Payment Methods Analysis</h3>
            <div className="analysis-table-container">
              <table className="analysis-table">
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
        <div className="critical-items-section">
          <h3>🚨 Outstanding Payments Requiring Attention</h3>
          
          {unpaidPayments.length > 0 && (
            <div className="critical-card danger-card">
              <h4>🚫 Unpaid Invoices ({unpaidPayments.length})</h4>
              <div className="critical-items-grid">
                {unpaidPayments.slice(0, 10).map(payment => (
                  <div key={payment._id} className="critical-item">
                    <strong>Invoice: {payment.invoiceNumber}</strong>
                    <small>{payment.hospitalName} - {payment.patientName}</small>
                    <span className="critical-amount">${(payment.totalAmount || 0).toLocaleString()}</span>
                    <span className="critical-status unpaid">UNPAID</span>
                  </div>
                ))}
              </div>
              {unpaidPayments.length > 10 && (
                <p className="show-more">... and {unpaidPayments.length - 10} more</p>
              )}
            </div>
          )}

          {partiallyPaidPayments.length > 0 && (
            <div className="critical-card warning-card">
              <h4>⚠️ Partially Paid Invoices ({partiallyPaidPayments.length})</h4>
              <div className="critical-items-grid">
                {partiallyPaidPayments.slice(0, 10).map(payment => {
                  const pending = (payment.totalAmount || 0) - (payment.amountPaid || 0);
                  return (
                    <div key={payment._id} className="critical-item">
                      <strong>Invoice: {payment.invoiceNumber}</strong>
                      <small>{payment.hospitalName} - {payment.patientName}</small>
                      <span className="critical-amount">${pending.toLocaleString()} pending</span>
                      <span className="critical-status partial">PARTIAL</span>
                    </div>
                  );
                })}
              </div>
              {partiallyPaidPayments.length > 10 && (
                <p className="show-more">... and {partiallyPaidPayments.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Executive Summary */}
      <div className="summary-report">
        <h3>📋 Executive Payment Summary</h3>
        <div className="report-grid">
          <div className="report-section">
            <h4>💰 Financial Overview</h4>
            <ul>
              <li><strong>Total Invoices:</strong> {stats.totalPayments}</li>
              <li><strong>Total Amount Due:</strong> ${stats.totalAmountDue.toLocaleString()}</li>
              <li><strong>Total Amount Paid:</strong> ${stats.totalAmountPaid.toLocaleString()}</li>
              <li><strong>Collection Rate:</strong> {((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%</li>
            </ul>
          </div>
          
          <div className="report-section">
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
          
          <div className="report-section">
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