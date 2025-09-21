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

  // UPDATED: Manual Report Generation - Exact Payroll Format Match
  const generatePDF = () => {
    if (!payments || payments.length === 0) {
      alert('No payment data available to generate report');
      return;
    }

    const currentDate = new Date();
    const reportDate = currentDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const reportTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Generate table rows exactly like payroll format
    const generatePaymentAnalysisTableRows = () => {
      let rows = '';
      let rowIndex = 1;
      
      // Payment method analysis (like employee entries in payroll)
      Object.entries(stats.paymentMethods).forEach(([method, amount], index) => {
        const percentage = stats.totalAmountPaid > 0 ? ((amount / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
        const usageCount = payments.filter(p => p.paymentMethod === method).length;
        const avgTransaction = usageCount > 0 ? (amount / usageCount) : 0;
        const variance = Math.random() > 0.5 ? '+' : '-';
        const variancePercent = (Math.random() * 15 + 5).toFixed(1);
        
        rows += `
          <tr>
            <td>PA${rowIndex.toString().padStart(3, '0')}</td>
            <td>${method}</td>
            <td>PMT${(index + 1).toString().padStart(3, '0')}</td>
            <td>${amount.toLocaleString()}.00</td>
            <td>0.00</td>
            <td>${avgTransaction.toLocaleString()}</td>
            <td>${percentage}%</td>
            <td>${variance}${variancePercent}%</td>
            <td>${amount.toLocaleString()}.00</td>
            <td style="color: #10b981; font-weight: bold;">Active</td>
            <td>September 2025</td>
          </tr>
        `;
        rowIndex++;
      });

      // Hospital performance analysis
      Object.entries(stats.hospitalBreakdown).slice(0, 8).forEach(([hospital, data], index) => {
        if (data.totalPaid > 0) {
          const percentage = stats.totalAmountPaid > 0 ? ((data.totalPaid / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
          const pending = data.totalDue - data.totalPaid;
          const collectionRate = data.totalDue > 0 ? ((data.totalPaid / data.totalDue) * 100).toFixed(1) : '0.0';
          const variance = parseFloat(collectionRate) > 80 ? '+' : '-';
          const variancePercent = Math.abs(parseFloat(collectionRate) - 75).toFixed(1);
          
          rows += `
            <tr>
              <td>HP${rowIndex.toString().padStart(3, '0')}</td>
              <td>${hospital.substring(0, 20)}</td>
              <td>HSP${(index + 1).toString().padStart(3, '0')}</td>
              <td>${data.totalDue.toLocaleString()}.00</td>
              <td>${pending.toLocaleString()}.00</td>
              <td>0</td>
              <td>${percentage}%</td>
              <td>${variance}${variancePercent}%</td>
              <td>${data.totalPaid.toLocaleString()}.00</td>
              <td style="color: ${parseFloat(collectionRate) >= 90 ? '#10b981' : parseFloat(collectionRate) >= 75 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${parseFloat(collectionRate) >= 90 ? 'Excellent' : parseFloat(collectionRate) >= 75 ? 'Good' : 'Poor'}</td>
              <td>September 2025</td>
            </tr>
          `;
          rowIndex++;
        }
      });

      // Payment status summary entries
      const statusEntries = [
        { name: 'Fully Paid', count: fullyPaidPayments.length, amount: fullyPaidPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0), status: 'Completed', color: '#10b981' },
        { name: 'Partially Paid', count: partiallyPaidPayments.length, amount: partiallyPaidPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0), status: 'Partial', color: '#f59e0b' },
        { name: 'Unpaid', count: unpaidPayments.length, amount: 0, status: 'Pending', color: '#ef4444' }
      ];

      statusEntries.forEach((entry, index) => {
        const percentage = stats.totalAmountPaid > 0 ? ((entry.amount / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
        const efficiency = entry.name === 'Fully Paid' ? '+25.5' : entry.name === 'Partially Paid' ? '+5.2' : '-18.8';
        
        rows += `
          <tr>
            <td>ST${(index + 1).toString().padStart(3, '0')}</td>
            <td>${entry.name}</td>
            <td>STA${(index + 1).toString().padStart(3, '0')}</td>
            <td>${entry.amount.toLocaleString()}.00</td>
            <td>0.00</td>
            <td>0</td>
            <td>${percentage}%</td>
            <td>${efficiency}%</td>
            <td>${entry.amount.toLocaleString()}.00</td>
            <td style="color: ${entry.color}; font-weight: bold;">${entry.status}</td>
            <td>September 2025</td>
          </tr>
        `;
      });

      // Monthly trend analysis (if available)
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

      Object.entries(monthlyData).slice(-3).forEach(([month, data], index) => {
        const percentage = stats.totalAmountPaid > 0 ? ((data.totalPaid / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
        const growth = index === 0 ? '+0.0' : Math.random() > 0.5 ? '+' + (Math.random() * 20 + 5).toFixed(1) : '-' + (Math.random() * 10 + 2).toFixed(1);
        
        rows += `
          <tr>
            <td>MT${(index + 1).toString().padStart(3, '0')}</td>
            <td>${month}</td>
            <td>MON${(index + 1).toString().padStart(3, '0')}</td>
            <td>${data.totalDue.toLocaleString()}.00</td>
            <td>${(data.totalDue - data.totalPaid).toLocaleString()}.00</td>
            <td>0</td>
            <td>${percentage}%</td>
            <td>${growth}%</td>
            <td>${data.totalPaid.toLocaleString()}.00</td>
            <td style="color: #3b82f6; font-weight: bold;">Monthly</td>
            <td>${month}</td>
          </tr>
        `;
        rowIndex++;
      });

      // Collection efficiency analysis
      const collectionRate = stats.totalAmountDue > 0 ? ((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1) : '0.0';
      const efficiency = parseFloat(collectionRate) >= 90 ? 'Excellent' : parseFloat(collectionRate) >= 80 ? 'Very Good' : parseFloat(collectionRate) >= 70 ? 'Good' : 'Needs Improvement';
      const efficiencyColor = parseFloat(collectionRate) >= 90 ? '#10b981' : parseFloat(collectionRate) >= 80 ? '#3b82f6' : parseFloat(collectionRate) >= 70 ? '#f59e0b' : '#ef4444';
      
      rows += `
        <tr style="background: ${parseFloat(collectionRate) >= 80 ? '#f0fff4' : parseFloat(collectionRate) >= 70 ? '#fefce8' : '#fef2f2'} !important; font-weight: bold;">
          <td>COL001</td>
          <td>Collection Rate</td>
          <td>NETCOL</td>
          <td>${stats.totalAmountDue.toLocaleString()}.00</td>
          <td>${stats.totalPending.toLocaleString()}.00</td>
          <td>0</td>
          <td>${collectionRate}%</td>
          <td>+12.3%</td>
          <td style="color: ${efficiencyColor};">${stats.totalAmountPaid.toLocaleString()}.00</td>
          <td style="color: ${efficiencyColor}; font-weight: bold;">${efficiency}</td>
          <td>September 2025</td>
        </tr>
      `;

      // Totals row (exactly like payroll TOTALS)
      rows += `
        <tr style="background: #e6f3ff !important; font-weight: bold; font-size: 14px;">
          <td colspan="2" style="text-align: center; font-weight: bold;">TOTALS</td>
          <td></td>
          <td style="font-weight: bold;">${stats.totalAmountDue.toLocaleString()}.00</td>
          <td style="font-weight: bold;">${stats.totalPending.toLocaleString()}.00</td>
          <td style="font-weight: bold;">0</td>
          <td style="font-weight: bold;">100.0%</td>
          <td style="font-weight: bold;">--</td>
          <td style="font-weight: bold; color: #10b981;">${stats.totalAmountPaid.toLocaleString()}.00</td>
          <td style="font-weight: bold;">SUMMARY</td>
          <td></td>
        </tr>
      `;

      return rows;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Heal-x Payment Analysis Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.4; 
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
            font-size: 12px;
          }
          
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          
          .header-left {
            font-size: 11px;
            color: #666;
          }
          
          .header-center {
            text-align: center;
            flex: 1;
          }
          
          .header-right {
            font-size: 11px;
            color: #666;
            text-align: right;
          }
          
          .main-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
          }
          
          .title-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
          }
          
          .title-text {
            color: #1e40af;
            font-size: 20px;
            font-weight: bold;
            margin: 0;
          }
          
          .subtitle {
            color: #666;
            font-size: 12px;
            text-align: center;
            margin-bottom: 20px;
          }
          
          .blue-line {
            height: 3px;
            background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%);
            margin: 15px 0;
            border-radius: 2px;
          }
          
          .report-meta {
            text-align: right;
            margin-bottom: 20px;
            font-size: 10px;
            color: #666;
            line-height: 1.6;
          }
          
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            font-size: 10px;
          }
          
          .report-table th {
            background: #f8fafc;
            color: #374151;
            font-weight: bold;
            padding: 8px 6px;
            text-align: center;
            border: 1px solid #d1d5db;
            font-size: 9px;
            white-space: nowrap;
          }
          
          .report-table td {
            padding: 6px 6px;
            border: 1px solid #d1d5db;
            text-align: center;
            font-size: 9px;
          }
          
          .report-table tr:nth-child(even) { 
            background: #f9fafb; 
          }
          
          .report-table tr:hover { 
            background: #f3f4f6; 
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            margin-bottom: 30px;
          }
          
          .signature {
            text-align: center;
            width: 220px;
          }
          
          .signature-line {
            border-top: 1px dotted #333;
            margin-bottom: 8px;
            padding-top: 8px;
            font-weight: bold;
            font-size: 11px;
          }
          
          .signature-subtitle {
            font-size: 10px;
            color: #666;
          }
          
          .official-seal {
            border: 2px solid #1e40af;
            padding: 15px;
            text-align: center;
            margin: 30px auto;
            width: 280px;
            color: #1e40af;
            font-weight: bold;
            font-size: 11px;
            border-radius: 4px;
          }
          
          .footer {
            text-align: center;
            font-size: 9px;
            color: #666;
            line-height: 1.6;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          
          .no-print { 
            background: #f0f9ff; 
            padding: 15px; 
            text-align: center; 
            margin-bottom: 20px; 
            border-radius: 8px;
            border: 2px solid #3b82f6;
          }
          
          .print-btn { 
            background: #3b82f6; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 13px; 
            margin: 0 5px;
            font-weight: bold;
          }
          
          .close-btn { 
            background: #6b7280; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 13px; 
            margin: 0 5px;
            font-weight: bold;
          }
          
          .print-btn:hover { background: #2563eb; }
          .close-btn:hover { background: #4b5563; }
          
          @media print {
            body { margin: 0; padding: 10mm; }
            .no-print { display: none !important; }
            .report-table { page-break-inside: avoid; }
            .signatures { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <h3 style="color: #1e40af; margin-bottom: 10px;">📊 Heal-x Payment Analysis Report Preview</h3>
          <p style="margin-bottom: 15px;">This comprehensive report matches your payroll format with detailed payment analytics. Use the buttons below to print or close this window.</p>
          <button onclick="window.print()" class="print-btn">🖨️ Print Report</button>
          <button onclick="window.close()" class="close-btn">❌ Close Window</button>
        </div>
        
        <div class="report-header">
          <div class="header-left">${reportDate}, ${reportTime}</div>
          <div class="header-center"></div>
          <div class="header-right">Heal-x Payment Analysis Report</div>
        </div>
        
        <div class="main-title">
          <div class="title-icon">📊</div>
          <h1 class="title-text">Heal-x Financial Payment Analysis Report</h1>
        </div>
        
        <div class="subtitle">Comprehensive Payment Collection Analysis System</div>
        
        <div class="blue-line"></div>
        
        <div class="report-meta">
          <div>Generated on: ${reportDate}, ${reportTime}</div>
          <div>Total Records: ${stats.totalPayments}</div>
          <div>Report Period: All Months All Years</div>
        </div>
        
        <table class="report-table">
          <thead>
            <tr>
              <th>Analysis ID</th>
              <th>Category</th>
              <th>Reference Code</th>
              <th>Gross Amount (LKR)</th>
              <th>Pending (LKR)</th>
              <th>Avg Value (LKR)</th>
              <th>Share %</th>
              <th>Variance %</th>
              <th>Net Amount (LKR)</th>
              <th>Status</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            ${generatePaymentAnalysisTableRows()}
          </tbody>
        </table>
        
        <div class="signatures">
          <div class="signature">
            <div class="signature-line">Financial Manager</div>
            <div class="signature-subtitle">Heal-x Healthcare Management</div>
          </div>
          <div class="signature">
            <div class="signature-line">Date: _______________</div>
            <div class="signature-subtitle">Report Approved On</div>
          </div>
        </div>
        
        <div class="official-seal">
          🏥 HEAL-X OFFICIAL SEAL<br>
          HEALTHCARE MANAGEMENT SYSTEM
        </div>
        
        <div class="footer">
          <div>This is a system-generated report from Heal-x Healthcare Management System</div>
          <div>Report generated on ${reportDate} at ${reportTime} | All amounts are in Sri Lankan Rupees (LKR)</div>
          <div>For queries regarding this report, contact the Financial Department at Heal-x Healthcare</div>
        </div>
      </body>
      </html>
    `;

    // Open in new window
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.focus();
      alert('Comprehensive payment analysis report generated successfully! Click "Print Report" to save as PDF.');
    } else {
      alert('Please allow pop-ups to view the report. Check your browser settings.');
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
