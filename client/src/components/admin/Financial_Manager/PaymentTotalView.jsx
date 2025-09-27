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

  if (!state || (!state.payments && !state.appointments)) {
    return (
      <div className="payment-total-view">
        <div className="payment-total-error-container">
          <div className="payment-total-error-content">
            <h2>⚠️ No Payment Data Available</h2>
            <p>Please navigate from the Financial Dashboard or Payment Management page to view the analysis.</p>
            <button onClick={() => navigate("/admin/financial")} className="payment-total-back-btn">
              ← Back to Financial Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // **UPDATED: Handle both payment data and appointment data**
  let payments = state.payments || [];
  let stats = state.stats || {};

  // **NEW: If we have appointments instead of payments, convert them**
  if (state.appointments && state.type === 'successful-appointments') {
    const acceptedAppointments = state.appointments.filter(apt => apt.status === 'accepted');
    
    // **UPDATED: Enhanced fee calculation with comprehensive specialty matching**
    payments = acceptedAppointments.map((apt, index) => {
      // Calculate fee based on specialty
      let consultationFee = 5000; // Default
      const specialty = (apt.doctorSpecialty || '').toLowerCase();
      
      // **COMPREHENSIVE SPECIALTY MATCHING**
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
      
      // Calculate age if needed
      let calculatedAge = apt.age;
      if (!calculatedAge && apt.dateOfBirth) {
        const birthDate = new Date(apt.dateOfBirth);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      return {
        _id: apt._id,
        invoiceNumber: `INV-${apt._id?.slice(-6) || Math.random().toString(36).substr(2, 6)}`,
        patientName: apt.name,
        hospitalName: apt.doctorSpecialty || 'General Medicine',
        doctorName: apt.doctorName,
        totalAmount: consultationFee,
        amountPaid: consultationFee, // Accepted appointments are fully paid
        paymentMethod: ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer'][index % 4],
        date: apt.acceptedAt || apt.updatedAt || new Date().toISOString(),
        
        // Additional appointment data
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        specialty: apt.doctorSpecialty,
        patientEmail: apt.email,
        patientPhone: apt.phone,
        age: calculatedAge,
        urgency: apt.urgency,
        symptoms: apt.symptoms
      };
    });

    // **UPDATED: Recalculate statistics with proper fee structure**
    const totalAmountDue = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    const totalAmountPaid = payments.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
    const totalPending = totalAmountDue - totalAmountPaid;

    // Payment methods breakdown
    const paymentMethods = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod || 'Credit Card';
      paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amountPaid || 0);
    });

    // Hospital breakdown (using specialty as hospital)
    const hospitalBreakdown = {};
    payments.forEach(payment => {
      const hospital = payment.hospitalName || payment.specialty || 'General Medicine';
      if (!hospitalBreakdown[hospital]) {
        hospitalBreakdown[hospital] = { totalDue: 0, totalPaid: 0, count: 0 };
      }
      hospitalBreakdown[hospital].totalDue += (payment.totalAmount || 0);
      hospitalBreakdown[hospital].totalPaid += (payment.amountPaid || 0);
      hospitalBreakdown[hospital].count += 1;
    });

    stats = {
      totalPayments: payments.length,
      totalAmountDue,
      totalAmountPaid,
      totalPending,
      collectionRate: totalAmountDue > 0 ? Math.round((totalAmountPaid / totalAmountDue) * 100) : 100,
      paymentMethods,
      hospitalBreakdown
    };
  }

  // Calculate additional metrics
  const fullyPaidPayments = payments.filter(p => (p.amountPaid || 0) >= (p.totalAmount || 0));
  const partiallyPaidPayments = payments.filter(p => (p.amountPaid || 0) > 0 && (p.amountPaid || 0) < (p.totalAmount || 0));
  const unpaidPayments = payments.filter(p => (p.amountPaid || 0) === 0);

  // **NEW: Advanced Report Generation System (matching InventoryTotalView format)**
  const generateReport = () => {
    if (!payments || payments.length === 0) {
      alert('No payment data available to generate report');
      return;
    }

    const currentDate = new Date();
    const reportDate = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const reportTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const generatePaymentTableRows = () => {
      let rows = '';
      let runningTotal = 0;

      // Sort payments by amount descending for better visual impact
      const sortedPayments = [...payments].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));

      sortedPayments.forEach((payment, index) => {
        runningTotal += (payment.amountPaid || 0);
        const percentage = stats.totalAmountPaid > 0 ? ((payment.amountPaid || 0) / stats.totalAmountPaid * 100).toFixed(1) : '0.0';
        const paymentStatus = (payment.amountPaid || 0) >= (payment.totalAmount || 0) ? 'Paid' : 
                             (payment.amountPaid || 0) > 0 ? 'Partial' : 'Pending';
        const statusColor = paymentStatus === 'Paid' ? '#10b981' : paymentStatus === 'Partial' ? '#f59e0b' : '#ef4444';
        
        rows += `
          <tr ${index % 2 === 0 ? 'style="background-color: #f8fafc;"' : ''}>
            <td>${(index + 1).toString().padStart(3, '0')}</td>
            <td><strong>${payment.patientName || 'Patient'}</strong></td>
            <td>${payment.invoiceNumber || `INV-${(index + 1).toString().padStart(6, '0')}`}</td>
            <td>${payment.hospitalName || payment.specialty || 'General Medicine'}</td>
            <td>${payment.doctorName || 'Doctor'}</td>
            <td>${(payment.totalAmount || 0).toLocaleString()}.00</td>
            <td style="color: #10b981; font-weight: bold;">${(payment.amountPaid || 0).toLocaleString()}.00</td>
            <td>${((payment.totalAmount || 0) - (payment.amountPaid || 0)).toLocaleString()}.00</td>
            <td>${payment.paymentMethod || 'Cash'}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${paymentStatus}</td>
            <td>${percentage}%</td>
            <td>${new Date(payment.date || new Date()).toLocaleDateString()}</td>
          </tr>
        `;
      });

      // Add summary rows
      rows += `
        <tr style="border-top: 2px solid #374151; background: #f0f9ff; font-weight: bold;">
          <td colspan="2" style="text-align: center;"><strong>SUMMARY TOTALS</strong></td>
          <td></td>
          <td></td>
          <td></td>
          <td style="font-weight: bold;">${stats.totalAmountDue.toLocaleString()}.00</td>
          <td style="color: #10b981; font-weight: bold;">${stats.totalAmountPaid.toLocaleString()}.00</td>
          <td style="color: #ef4444; font-weight: bold;">${stats.totalPending.toLocaleString()}.00</td>
          <td></td>
          <td></td>
          <td style="font-weight: bold;">100.0%</td>
          <td></td>
        </tr>
      `;

      return rows;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Heal-X Healthcare Payment Analysis Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background: #ffffff;
            padding: 30px;
            font-size: 13px;
          }
          .report-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .report-header {
            background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .report-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            );
            animation: move 10s linear infinite;
          }
          @keyframes move {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .report-header h1 {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
          }
          .report-header p {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .report-meta {
            background: #f8fafc;
            padding: 25px 30px;
            border-left: 5px solid #10b981;
            margin-bottom: 30px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 15px;
          }
          .meta-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            text-align: center;
          }
          .meta-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-value {
            font-size: 18px;
            font-weight: bold;
            color: #10b981;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .report-table thead tr {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            color: white;
          }
          .report-table th {
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-right: 1px solid rgba(255,255,255,0.2);
          }
          .report-table th:last-child {
            border-right: none;
          }
          .report-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
          }
          .report-table td:last-child {
            border-right: none;
          }
          .report-table tr:last-child td {
            border-bottom: none;
          }
          .report-table tbody tr:hover {
            background-color: #f0f9ff;
            transform: scale(1.001);
            transition: all 0.2s ease;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin: 50px 0 30px 0;
            padding: 30px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .signature {
            text-align: center;
            flex: 1;
            margin: 0 20px;
          }
          .signature-line {
            border-top: 2px solid #374151;
            width: 200px;
            margin: 40px auto 10px auto;
            padding-top: 10px;
            font-weight: bold;
            color: #374151;
          }
          .signature-title {
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            text-align: center;
            padding: 25px;
            background: #1f2937;
            color: white;
            font-size: 11px;
            line-height: 1.6;
          }
          .print-controls {
            background: #e0f2fe;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 8px;
            border: 2px solid #10b981;
          }
          .btn {
            padding: 12px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
          }
          .btn-primary {
            background: #10b981;
            color: white;
          }
          .btn-primary:hover {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
          }
          .btn-secondary {
            background: #6b7280;
            color: white;
          }
          .btn-secondary:hover {
            background: #4b5563;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
          }
          .stats-highlight {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .stat-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          @media print {
            body { padding: 0; }
            .print-controls { display: none !important; }
            .report-table { font-size: 10px; }
            .report-table th, .report-table td { padding: 8px 6px; }
          }
        </style>
      </head>
      <body>
        <div class="print-controls">
          <h3 style="color: #10b981; margin-bottom: 10px;">💰 Heal-X Payment Analysis Report</h3>
          <p style="margin-bottom: 15px; color: #374151;">
            Generated on ${reportDate} at ${reportTime} | Total Payments: ${stats.totalPayments} | Revenue: $${stats.totalAmountPaid.toLocaleString()}
          </p>
          <button onclick="window.print()" class="btn btn-primary">🖨️ Print Report</button>
          <button onclick="exportToCSV()" class="btn btn-primary">📊 Export CSV</button>
          <button onclick="window.close()" class="btn btn-secondary">✖️ Close</button>
        </div>
        
        <div class="report-container">
          <div class="report-header">
            <h1 style="color: #2563eb">🏥 Heal-X Healthcare Payment Analysis</h1>
            <p style ="color: #000">Comprehensive Financial Report & Revenue Analysis</p>
          </div>
          
          <div class="report-meta">
            <h2 style="color: #10b981; margin-bottom: 20px; font-size: 24px;">📊 Executive Summary</h2>
            <p style="margin-bottom: 20px; color: #374151; font-size: 14px;">
              This comprehensive payment analysis report covers ${stats.totalPayments} healthcare transactions 
              with a total revenue collection of <strong>$${stats.totalAmountPaid.toLocaleString()}</strong> 
              and an overall collection efficiency of <strong>${stats.collectionRate}%</strong>.
            </p>
            
            <div class="stats-highlight">
              <h3 style="color: #059669; margin-bottom: 15px;">🎯 Key Performance Indicators</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">${stats.totalPayments}</div>
                  <div class="stat-label">Total Appointments</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">$${stats.totalAmountDue.toLocaleString()}</div>
                  <div class="stat-label">Total Due</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">$${stats.totalAmountPaid.toLocaleString()}</div>
                  <div class="stat-label">Revenue Collected</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${stats.collectionRate}%</div>
                  <div class="stat-label">Collection Rate</div>
                </div>
              </div>
            </div>
          </div>
          
          <table class="report-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Patient Name</th>
                <th>Invoice #</th>
                <th>Specialty/Department</th>
                <th>Doctor</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>% of Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${generatePaymentTableRows()}
            </tbody>
          </table>
          
          <div class="signatures">
            <div class="signature">
              <div class="signature-line">Financial Manager</div>
              <div class="signature-title">Heal-X Healthcare</div>
            </div>
            <div class="signature">
              <div class="signature-line">System Administrator</div>
              <div class="signature-title">Report Generated</div>
            </div>
            <div class="signature">
              <div class="signature-line">Date: ${reportDate}</div>
              <div class="signature-title">Approval Date</div>
            </div>
          </div>
          
          <div class="footer">
            <strong>🏥 HEAL-X HEALTHCARE MANAGEMENT SYSTEM</strong><br>
            Payment Analysis Report | Generated: ${reportDate} ${reportTime}<br>
            This is a computer-generated report. All financial figures are in USD.<br>
            For questions about this report, contact the Financial Department.
          </div>
        </div>
        
        <script>
          function exportToCSV() {
            const csvContent = [
              ['No.', 'Patient Name', 'Invoice #', 'Specialty', 'Doctor', 'Total Amount', 'Amount Paid', 'Balance', 'Payment Method', 'Status', '% of Total', 'Date'],
              ${payments.map((payment, index) => {
                const percentage = stats.totalAmountPaid > 0 ? ((payment.amountPaid || 0) / stats.totalAmountPaid * 100).toFixed(1) : '0.0';
                const paymentStatus = (payment.amountPaid || 0) >= (payment.totalAmount || 0) ? 'Paid' : 
                                     (payment.amountPaid || 0) > 0 ? 'Partial' : 'Pending';
                return `['${index + 1}', '${payment.patientName || 'Patient'}', '${payment.invoiceNumber || `INV-${(index + 1).toString().padStart(6, '0')}`}', '${payment.hospitalName || payment.specialty || 'General Medicine'}', '${payment.doctorName || 'Doctor'}', '${(payment.totalAmount || 0).toLocaleString()}.00', '${(payment.amountPaid || 0).toLocaleString()}.00', '${((payment.totalAmount || 0) - (payment.amountPaid || 0)).toLocaleString()}.00', '${payment.paymentMethod || 'Cash'}', '${paymentStatus}', '${percentage}%', '${new Date(payment.date || new Date()).toLocaleDateString()}']`;
              }).join(',\n              ')}
            ].map(row => Array.isArray(row) ? row.join(',') : row).join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'heal-x-payment-analysis-' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert('✅ Payment data exported to CSV successfully!');
          }
        </script>
      </body>
      </html>
    `;

    const reportWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (reportWindow) {
      reportWindow.document.write(htmlContent);
      reportWindow.document.close();
      reportWindow.focus();
      
      alert(`📊 Payment Analysis Report Generated Successfully! \n\n` +
            `📈 Key Metrics:\n` +
            `• Total Appointments: ${stats.totalPayments}\n` +
            `• Revenue Collected: $${stats.totalAmountPaid.toLocaleString()}\n` +
            `• Collection Rate: ${stats.collectionRate}%\n` +
            `• Outstanding: $${stats.totalPending.toLocaleString()}\n\n` +
            `Use the Print button to save as PDF or Export CSV for data analysis.`);
    } else {
      alert('❌ Pop-up blocked! Please allow pop-ups and try again.');
    }
  };

  // **NEW: CSV Export Function (matching InventoryTotalView format)**
  const exportToCSV = () => {
    if (!payments || payments.length === 0) {
      alert('No payment data available for export');
      return;
    }

    const csvHeaders = [
      'No.',
      'Patient Name',
      'Invoice Number',
      'Specialty/Department',
      'Doctor Name',
      'Total Amount ($)',
      'Amount Paid ($)',
      'Balance ($)',
      'Payment Method',
      'Status',
      '% of Total Revenue',
      'Payment Date',
      'Appointment Date',
      'Patient Email',
      'Patient Phone',
      'Age',
      'Urgency',
      'Symptoms'
    ];

    const csvData = payments.map((payment, index) => {
      const percentage = stats.totalAmountPaid > 0 ? ((payment.amountPaid || 0) / stats.totalAmountPaid * 100).toFixed(1) : '0.0';
      const paymentStatus = (payment.amountPaid || 0) >= (payment.totalAmount || 0) ? 'Fully Paid' : 
                           (payment.amountPaid || 0) > 0 ? 'Partially Paid' : 'Unpaid';
      
      return [
        index + 1,
        payment.patientName || 'N/A',
        payment.invoiceNumber || `INV-${(index + 1).toString().padStart(6, '0')}`,
        payment.hospitalName || payment.specialty || 'General Medicine',
        payment.doctorName || 'N/A',
        (payment.totalAmount || 0).toFixed(2),
        (payment.amountPaid || 0).toFixed(2),
        ((payment.totalAmount || 0) - (payment.amountPaid || 0)).toFixed(2),
        payment.paymentMethod || 'Cash',
        paymentStatus,
        `${percentage}%`,
        new Date(payment.date || new Date()).toLocaleDateString(),
        payment.appointmentDate ? new Date(payment.appointmentDate).toLocaleDateString() : 'N/A',
        payment.patientEmail || 'N/A',
        payment.patientPhone || 'N/A',
        payment.age || 'N/A',
        payment.urgency || 'N/A',
        payment.symptoms ? payment.symptoms.substring(0, 100) : 'N/A'
      ];
    });

    // Add summary row
    csvData.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      stats.totalAmountDue.toFixed(2),
      stats.totalAmountPaid.toFixed(2),
      stats.totalPending.toFixed(2),
      '',
      `${stats.collectionRate}% Collection Rate`,
      '100.0%',
      new Date().toLocaleDateString(),
      '',
      '',
      '',
      '',
      '',
      `${stats.totalPayments} Total Appointments`
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `heal-x-payment-analysis-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`📊 Payment data exported successfully!\n\n` +
            `File: heal-x-payment-analysis-${new Date().toISOString().split('T')[0]}.csv\n` +
            `Records: ${payments.length} payments\n` +
            `Total Revenue: $${stats.totalAmountPaid.toLocaleString()}\n\n` +
            `The file has been downloaded to your computer.`);
    } else {
      alert('CSV export is not supported in this browser');
    }
  };

  // Payment Status Chart Data
  const paymentStatusData = {
    labels: ['Fully Paid', 'Partially Paid', 'Unpaid'],
    datasets: [{
      data: [fullyPaidPayments.length, partiallyPaidPayments.length, unpaidPayments.length],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
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
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#06b6d4'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // Hospital/Specialty Performance Chart Data
  const hospitalChartData = {
    labels: Object.keys(stats.hospitalBreakdown).slice(0, 10),
    datasets: [{
      label: 'Total Consultation Fees ($)',
      data: Object.values(stats.hospitalBreakdown).slice(0, 10).map(hospital => hospital.totalDue),
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }, {
      label: 'Revenue Collected ($)',
      data: Object.values(stats.hospitalBreakdown).slice(0, 10).map(hospital => hospital.totalPaid),
      backgroundColor: '#10b981',
      borderRadius: 4
    }]
  };

  // Monthly trend data
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
      backgroundColor: '#10b981',
      borderRadius: 4
    }, {
      label: 'Monthly Consultation Fees ($)',
      data: Object.values(monthlyTrend).map(month => month.totalDue),
      backgroundColor: '#6b7280',
      borderRadius: 4
    }]
  };

  return (
    <div className="payment-total-view">
      {/* Header */}
      <div className="payment-total-page-header">
        <div className="payment-total-header-content">
          <h1>💰 Healthcare Payment Analysis & Reports</h1>
          <div className="payment-total-header-actions">
            <button onClick={() => navigate("/admin/financial")} className="payment-total-back-btn">
              ← Back to Financial Dashboard
            </button>
            <button onClick={() => window.print()} className="payment-total-print-btn">
              🖨️ Print Report
            </button>
            <button onClick={generateReport} className="payment-total-export-btn">
              📤 Generate Detailed Report
            </button>
            <button onClick={exportToCSV} className="payment-total-csv-btn">
              📊 Export to CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payment-total-summary-grid">
        <div className="payment-total-summary-card payment-total-primary-card">
          <div className="payment-total-card-icon">🏥</div>
          <div className="payment-total-card-content">
            <h2>{stats.totalPayments}</h2>
            <p>Accepted Appointments</p>
            <div className="payment-total-card-trend">
              <span className="payment-total-trend-info">💰 Revenue Generating</span>
            </div>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-success-card">
          <div className="payment-total-card-icon">💵</div>
          <div className="payment-total-card-content">
            <h3>${stats.totalAmountDue.toLocaleString()}</h3>
            <p>Total Consultation Fees</p>
            <small>All specialties combined</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-primary-card">
          <div className="payment-total-card-icon">✅</div>
          <div className="payment-total-card-content">
            <h3>${stats.totalAmountPaid.toLocaleString()}</h3>
            <p>Total Revenue Collected</p>
            <small>From accepted appointments</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-warning-card">
          <div className="payment-total-card-icon">⏳</div>
          <div className="payment-total-card-content">
            <h3>${stats.totalPending.toLocaleString()}</h3>
            <p>Pending Collections</p>
            <small>{((stats.totalPending / stats.totalAmountDue) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card payment-total-success-card">
          <div className="payment-total-card-icon">📊</div>
          <div className="payment-total-card-content">
            <h3>{((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%</h3>
            <p>Collection Efficiency</p>
            <small>Payment success rate</small>
          </div>
        </div>
        
        <div className="payment-total-summary-card">
          <div className="payment-total-card-icon">💎</div>
          <div className="payment-total-card-content">
            <h3>${(stats.totalAmountDue / stats.totalPayments).toFixed(0)}</h3>
            <p>Average Consultation Fee</p>
            <small>Per appointment</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="payment-total-charts-section">
        {/* Payment Status */}
        <div className="payment-total-chart-container">
          <div className="payment-total-chart-header">
            <h3>📊 Appointment Payment Status</h3>
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
                      return `${label}: ${value} appointments (${percentage}%)`;
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
            <h3>💳 Payment Methods Revenue</h3>
            <p>Revenue distribution by payment method</p>
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

      {/* Specialty Performance Analysis */}
      <div className="payment-total-chart-container payment-total-full-width">
        <div className="payment-total-chart-header">
          <h3>🩺 Medical Specialty Revenue Analysis</h3>
          <p>Consultation fees and revenue by medical specialty</p>
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
            <h3>📈 Monthly Healthcare Revenue Trend</h3>
            <p>Consultation revenue collection over time</p>
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
          {/* Specialty Analysis Table */}
          <div className="payment-total-analysis-card">
            <h3>🩺 Medical Specialty Analysis</h3>
            <div className="payment-total-analysis-table-container">
              <table className="payment-total-analysis-table">
                <thead>
                  <tr>
                    <th>Medical Specialty</th>
                    <th>Appointments</th>
                    <th>Standard Fee</th>
                    <th>Total Revenue</th>
                    <th>Avg per Patient</th>
                    <th>Collection %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.hospitalBreakdown)
                    .sort(([,a], [,b]) => b.totalPaid - a.totalPaid)
                    .map(([specialty, data]) => {
                      const collectionRate = data.totalDue > 0 ? ((data.totalPaid / data.totalDue) * 100).toFixed(1) : 100;
                      const avgPerPatient = data.count > 0 ? (data.totalPaid / data.count) : 0;
                      
                      // Get standard fee for specialty
                      let standardFee = 5000;
                      const spec = specialty.toLowerCase();
                      if (spec.includes('cardio')) standardFee = 6000;
                      else if (spec.includes('orthopedic')) standardFee = 6000;
                      else if (spec.includes('dermatologist')) standardFee = 5500;
                      else if (spec.includes('general')) standardFee = 4000;
                      else if (spec.includes('neurologist')) standardFee = 7000;
                      else if (spec.includes('pediatrician')) standardFee = 4500;
                      else if (spec.includes('gynecologist')) standardFee = 5500;
                      else if (spec.includes('psychiatrist')) standardFee = 6500;
                      else if (spec.includes('dentist')) standardFee = 3500;
                      else if (spec.includes('eye') || spec.includes('ophthalmologist')) standardFee = 5000;
                      else if (spec.includes('ent')) standardFee = 4800;
                      
                      return (
                        <tr key={specialty}>
                          <td><strong>{specialty}</strong></td>
                          <td>{data.count}</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold' }}>
                            ${standardFee.toLocaleString()}
                          </td>
                          <td style={{ color: '#059669', fontWeight: 'bold' }}>
                            ${data.totalPaid.toLocaleString()}
                          </td>
                          <td>${avgPerPatient.toLocaleString()}</td>
                          <td>
                            <span style={{ 
                              color: collectionRate >= 90 ? '#10b981' : collectionRate >= 80 ? '#f59e0b' : '#ef4444',
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
                    <th>Total Revenue</th>
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
                          <td style={{ color: '#10b981', fontWeight: 'bold' }}>
                            ${amount.toLocaleString()}
                          </td>
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
              <h4>🚫 Unpaid Appointments ({unpaidPayments.length})</h4>
              <div className="payment-total-critical-items-grid">
                {unpaidPayments.slice(0, 10).map(payment => (
                  <div key={payment._id} className="payment-total-critical-item">
                    <strong>Patient: {payment.patientName}</strong>
                    <small>{payment.hospitalName} - {payment.doctorName}</small>
                    <span className="payment-total-critical-amount">${(payment.totalAmount || 0).toLocaleString()}</span>
                    <span className="payment-total-critical-status payment-total-unpaid">UNPAID</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Executive Summary */}
      <div className="payment-total-summary-report">
        <h3>📋 Healthcare Revenue Executive Summary</h3>
        <div className="payment-total-report-grid">
          <div className="payment-total-report-section">
            <h4>🏥 Financial Overview</h4>
            <ul>
              <li><strong>Total Accepted Appointments:</strong> {stats.totalPayments}</li>
              <li><strong>Total Consultation Fees:</strong> ${stats.totalAmountDue.toLocaleString()}</li>
              <li><strong>Total Revenue Collected:</strong> ${stats.totalAmountPaid.toLocaleString()}</li>
              <li><strong>Collection Efficiency:</strong> {((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1)}%</li>
              <li><strong>Average Consultation Fee:</strong> ${(stats.totalAmountDue / stats.totalPayments).toFixed(0)}</li>
            </ul>
          </div>
          
          <div className="payment-total-report-section">
            <h4>🩺 Top Performing Specialty</h4>
            {(() => {
              const topSpecialty = Object.entries(stats.hospitalBreakdown)
                .reduce((max, [name, data]) => data.totalPaid > max.data.totalPaid ? {name, data} : max, 
                  {name: 'General Medicine', data: {totalPaid: 0, totalDue: 0, count: 0}});
              const collectionRate = topSpecialty.data.totalDue > 0 ? 
                ((topSpecialty.data.totalPaid / topSpecialty.data.totalDue) * 100).toFixed(1) : 100;
              return (
                <ul>
                  <li><strong>Medical Specialty:</strong> {topSpecialty.name}</li>
                  <li><strong>Revenue Generated:</strong> ${topSpecialty.data.totalPaid.toLocaleString()}</li>
                  <li><strong>Appointments:</strong> {topSpecialty.data.count}</li>
                  <li><strong>Collection Rate:</strong> {collectionRate}%</li>
                  <li><strong>Avg Fee:</strong> ${topSpecialty.data.count > 0 ? (topSpecialty.data.totalPaid / topSpecialty.data.count).toFixed(0) : 0}</li>
                </ul>
              );
            })()}
          </div>
          
          <div className="payment-total-report-section">
            <h4>💳 Payment Collection Status</h4>
            <ul>
              <li><strong>Fully Paid:</strong> {fullyPaidPayments.length} appointments</li>
              <li><strong>Partially Paid:</strong> {partiallyPaidPayments.length} appointments</li>
              <li><strong>Unpaid:</strong> {unpaidPayments.length} appointments</li>
              <li><strong>Outstanding Amount:</strong> ${stats.totalPending.toLocaleString()}</li>
              <li><strong>Action Required:</strong> {unpaidPayments.length > 0 ? 'Immediate Follow-up' : partiallyPaidPayments.length > 0 ? 'Monitor Payments' : 'All Clear'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTotalView;
