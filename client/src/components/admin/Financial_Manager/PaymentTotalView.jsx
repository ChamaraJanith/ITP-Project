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
      
      // Debug log to see what's happening
      console.log(`Appointment ${apt._id}: Specialty="${apt.doctorSpecialty}" -> Fee=${consultationFee}`);
      
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
        // **UPDATED: Force recalculation by using consultationFee directly**
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

    console.log('Updated payment data with proper fees:', payments);
    console.log('Updated stats:', stats);
  }

  // Calculate additional metrics
  const fullyPaidPayments = payments.filter(p => (p.amountPaid || 0) >= (p.totalAmount || 0));
  const partiallyPaidPayments = payments.filter(p => (p.amountPaid || 0) > 0 && (p.amountPaid || 0) < (p.totalAmount || 0));
  const unpaidPayments = payments.filter(p => (p.amountPaid || 0) === 0);

  // **UPDATED: Enhanced PDF Generation with Fee Details**
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

    // **UPDATED: Generate detailed payment analysis with proper fee breakdown**
    const generatePaymentAnalysisTableRows = () => {
      let rows = '';
      let rowIndex = 1;
      
      // **NEW: Specialty-wise fee analysis**
      const specialtyBreakdown = {};
      payments.forEach(payment => {
        const specialty = payment.specialty || payment.hospitalName || 'General Medicine';
        if (!specialtyBreakdown[specialty]) {
          specialtyBreakdown[specialty] = { 
            totalDue: 0, 
            totalPaid: 0, 
            count: 0, 
            avgFee: 0,
            minFee: Infinity,
            maxFee: 0
          };
        }
        const amount = payment.totalAmount || 0;
        specialtyBreakdown[specialty].totalDue += amount;
        specialtyBreakdown[specialty].totalPaid += (payment.amountPaid || 0);
        specialtyBreakdown[specialty].count += 1;
        specialtyBreakdown[specialty].minFee = Math.min(specialtyBreakdown[specialty].minFee, amount);
        specialtyBreakdown[specialty].maxFee = Math.max(specialtyBreakdown[specialty].maxFee, amount);
      });

      // Calculate average fees
      Object.keys(specialtyBreakdown).forEach(specialty => {
        const data = specialtyBreakdown[specialty];
        data.avgFee = data.count > 0 ? (data.totalDue / data.count) : 0;
        if (data.minFee === Infinity) data.minFee = 0;
      });
      
      // Specialty analysis rows
      Object.entries(specialtyBreakdown).forEach(([specialty, data], index) => {
        const percentage = stats.totalAmountPaid > 0 ? ((data.totalPaid / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
        const collectionRate = data.totalDue > 0 ? ((data.totalPaid / data.totalDue) * 100).toFixed(1) : '100.0';
        const variance = parseFloat(collectionRate) > 90 ? '+' : parseFloat(collectionRate) > 80 ? '+' : '-';
        const variancePercent = Math.abs(parseFloat(collectionRate) - 85).toFixed(1);
        
        rows += `
          <tr>
            <td>SP${rowIndex.toString().padStart(3, '0')}</td>
            <td>${specialty}</td>
            <td>MED${(index + 1).toString().padStart(3, '0')}</td>
            <td>${data.totalDue.toLocaleString()}.00</td>
            <td>${(data.totalDue - data.totalPaid).toLocaleString()}.00</td>
            <td>${data.avgFee.toLocaleString()}.00</td>
            <td>${percentage}%</td>
            <td>${variance}${variancePercent}%</td>
            <td>${data.totalPaid.toLocaleString()}.00</td>
            <td style="color: ${parseFloat(collectionRate) >= 90 ? '#10b981' : parseFloat(collectionRate) >= 80 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${collectionRate >= 90 ? 'Excellent' : collectionRate >= 80 ? 'Good' : 'Average'}</td>
            <td>September 2025</td>
          </tr>
        `;
        rowIndex++;
      });

      // **NEW: Fee range analysis**
      const feeRanges = {
        'Budget ($3,000-$4,500)': { min: 3000, max: 4500, count: 0, totalPaid: 0 },
        'Standard ($4,500-$6,000)': { min: 4500, max: 6000, count: 0, totalPaid: 0 },
        'Premium ($6,000-$7,500)': { min: 6000, max: 7500, count: 0, totalPaid: 0 },
        'Luxury ($7,500+)': { min: 7500, max: Infinity, count: 0, totalPaid: 0 }
      };

      payments.forEach(payment => {
        const fee = payment.totalAmount || 0;
        Object.entries(feeRanges).forEach(([range, data]) => {
          if (fee >= data.min && fee < data.max) {
            data.count += 1;
            data.totalPaid += (payment.amountPaid || 0);
          }
        });
      });

      Object.entries(feeRanges).forEach(([range, data], index) => {
        if (data.count > 0) {
          const percentage = stats.totalAmountPaid > 0 ? ((data.totalPaid / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
          const avgFee = data.count > 0 ? (data.totalPaid / data.count) : 0;
          
          rows += `
            <tr>
              <td>FR${(index + 1).toString().padStart(3, '0')}</td>
              <td>${range}</td>
              <td>FEE${(index + 1).toString().padStart(3, '0')}</td>
              <td>${data.totalPaid.toLocaleString()}.00</td>
              <td>0.00</td>
              <td>${avgFee.toLocaleString()}.00</td>
              <td>${percentage}%</td>
              <td>+${(Math.random() * 15 + 5).toFixed(1)}%</td>
              <td>${data.totalPaid.toLocaleString()}.00</td>
              <td style="color: #3b82f6; font-weight: bold;">${data.count} Patients</td>
              <td>September 2025</td>
            </tr>
          `;
        }
      });

      // Payment method analysis
      Object.entries(stats.paymentMethods).forEach(([method, amount], index) => {
        const percentage = stats.totalAmountPaid > 0 ? ((amount / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
        const usageCount = payments.filter(p => p.paymentMethod === method).length;
        const avgTransaction = usageCount > 0 ? (amount / usageCount) : 0;
        
        rows += `
          <tr>
            <td>PM${(index + 1).toString().padStart(3, '0')}</td>
            <td>${method}</td>
            <td>PAY${(index + 1).toString().padStart(3, '0')}</td>
            <td>${amount.toLocaleString()}.00</td>
            <td>0.00</td>
            <td>${avgTransaction.toLocaleString()}.00</td>
            <td>${percentage}%</td>
            <td>+${(Math.random() * 10 + 2).toFixed(1)}%</td>
            <td>${amount.toLocaleString()}.00</td>
            <td style="color: #10b981; font-weight: bold;">Active</td>
            <td>September 2025</td>
          </tr>
        `;
      });

      // Collection efficiency analysis
      const collectionRate = stats.totalAmountDue > 0 ? ((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1) : '100.0';
      const efficiency = parseFloat(collectionRate) >= 95 ? 'Excellent' : parseFloat(collectionRate) >= 85 ? 'Very Good' : parseFloat(collectionRate) >= 75 ? 'Good' : 'Needs Improvement';
      const efficiencyColor = parseFloat(collectionRate) >= 95 ? '#10b981' : parseFloat(collectionRate) >= 85 ? '#3b82f6' : parseFloat(collectionRate) >= 75 ? '#f59e0b' : '#ef4444';
      
      rows += `
        <tr style="background: ${parseFloat(collectionRate) >= 90 ? '#f0fff4' : parseFloat(collectionRate) >= 80 ? '#fefce8' : '#fef2f2'} !important; font-weight: bold;">
          <td>COL001</td>
          <td>Total Collection Rate</td>
          <td>TOTAL</td>
          <td>${stats.totalAmountDue.toLocaleString()}.00</td>
          <td>${stats.totalPending.toLocaleString()}.00</td>
          <td>${(stats.totalAmountDue / stats.totalPayments).toFixed(0).toLocaleString()}.00</td>
          <td>${collectionRate}%</td>
          <td>+15.2%</td>
          <td style="color: ${efficiencyColor};">${stats.totalAmountPaid.toLocaleString()}.00</td>
          <td style="color: ${efficiencyColor}; font-weight: bold;">${efficiency}</td>
          <td>September 2025</td>
        </tr>
      `;

      // **NEW: Top performing patients/appointments**
      const topPayments = [...payments]
        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
        .slice(0, 5);

      topPayments.forEach((payment, index) => {
        rows += `
          <tr>
            <td>TOP${(index + 1).toString().padStart(2, '0')}</td>
            <td>${payment.patientName || 'Patient'}</td>
            <td>PAT${(index + 1).toString().padStart(3, '0')}</td>
            <td>${(payment.totalAmount || 0).toLocaleString()}.00</td>
            <td>0.00</td>
            <td>${(payment.totalAmount || 0).toLocaleString()}.00</td>
            <td>Individual</td>
            <td>Top ${index + 1}</td>
            <td>${(payment.amountPaid || 0).toLocaleString()}.00</td>
            <td style="color: #10b981; font-weight: bold;">Paid</td>
            <td>${payment.specialty || 'General'}</td>
          </tr>
        `;
      });

      // Totals row
      rows += `
        <tr style="background: #e6f3ff !important; font-weight: bold; font-size: 14px;">
          <td colspan="2" style="text-align: center; font-weight: bold;">GRAND TOTALS</td>
          <td></td>
          <td style="font-weight: bold;">${stats.totalAmountDue.toLocaleString()}.00</td>
          <td style="font-weight: bold;">${stats.totalPending.toLocaleString()}.00</td>
          <td style="font-weight: bold;">${(stats.totalAmountDue / stats.totalPayments).toFixed(0).toLocaleString()}.00</td>
          <td style="font-weight: bold;">100.0%</td>
          <td style="font-weight: bold;">--</td>
          <td style="font-weight: bold; color: #10b981;">${stats.totalAmountPaid.toLocaleString()}.00</td>
          <td style="font-weight: bold;">COMPLETED</td>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
          }
          
          .title-text {
            color: #10b981;
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
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
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
            border: 2px solid #10b981;
            padding: 15px;
            text-align: center;
            margin: 30px auto;
            width: 280px;
            color: #10b981;
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
            background: #f0fff4; 
            padding: 15px; 
            text-align: center; 
            margin-bottom: 20px; 
            border-radius: 8px;
            border: 2px solid #10b981;
          }
          
          .print-btn { 
            background: #10b981; 
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
          
          .print-btn:hover { background: #059669; }
          .close-btn:hover { background: #4b5563; }
          
          @media print {
            body { margin: 0; padding: 10mm; }
            .no-print { display: none !important; }
            .report-table { page-break-inside: avoid; }
            .signatures { page-break-inside: avoid; }
          }
          
          .fee-highlight {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%) !important;
            font-weight: bold;
            color: #065f46;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <h3 style="color: #10b981; margin-bottom: 10px;">💰 Heal-x Payment Analysis Report Preview</h3>
          <p style="margin-bottom: 15px;">Comprehensive payment analysis with detailed fee breakdown by specialty. Total Revenue: <strong>$${stats.totalAmountPaid.toLocaleString()}</strong></p>
          <button onclick="window.print()" class="print-btn">🖨️ Print Report</button>
          <button onclick="window.close()" class="close-btn">❌ Close Window</button>
        </div>
        
        <div class="report-header">
          <div class="header-left">${reportDate}, ${reportTime}</div>
          <div class="header-center"></div>
          <div class="header-right">Heal-x Payment Analysis Report</div>
        </div>
        
        <div class="main-title">
          <div class="title-icon">💰</div>
          <h1 class="title-text">Heal-x Healthcare Payment Analysis Report</h1>
        </div>
        
        <div class="subtitle">Comprehensive Revenue Analysis by Medical Specialty & Payment Methods</div>
        
        <div class="blue-line"></div>
        
        <div class="report-meta">
          <div><strong>Generated on:</strong> ${reportDate}, ${reportTime}</div>
          <div><strong>Total Appointments:</strong> ${stats.totalPayments}</div>
          <div><strong>Total Revenue:</strong> $${stats.totalAmountPaid.toLocaleString()}</div>
          <div><strong>Collection Rate:</strong> ${stats.collectionRate}%</div>
          <div><strong>Report Period:</strong> All Accepted Appointments</div>
        </div>
        
        <table class="report-table">
          <thead>
            <tr>
              <th>Analysis ID</th>
              <th>Category/Specialty</th>
              <th>Reference Code</th>
              <th>Gross Amount (LKR)</th>
              <th>Pending (LKR)</th>
              <th>Avg Fee (LKR)</th>
              <th>Share %</th>
              <th>Performance %</th>
              <th>Net Revenue (LKR)</th>
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
          🏥 HEAL-X OFFICIAL HEALTHCARE SEAL<br>
          PAYMENT MANAGEMENT SYSTEM
        </div>
        
        <div class="footer">
          <div><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></div>
          <div>Report generated on ${reportDate} at ${reportTime} | All amounts are in Sri Lankan Rupees (LKR)</div>
          <div>Specialty fee structure: Cardiology/Orthopedic: $6,000 | Dermatology/Gynecology: $5,500 | Neurology: $7,000 | General: $4,000</div>
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
      alert(`💰 Comprehensive payment analysis report generated successfully! 
      
Total Revenue: $${stats.totalAmountPaid.toLocaleString()}
Appointments: ${stats.totalPayments}
Collection Rate: ${stats.collectionRate}%

Click "Print Report" to save as PDF.`);
    } else {
      alert('Please allow pop-ups to view the report. Check your browser settings.');
    }
  };

  // **REST OF THE COMPONENT REMAINS THE SAME BUT WITH UPDATED DISPLAY VALUES**

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

  // **UPDATED: Hospital/Specialty Performance Chart Data**
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
            <button onClick={generatePDF} className="payment-total-export-btn">
              📤 Export Detailed Report
            </button>
          </div>
        </div>
      </div>

      {/* **UPDATED: Summary Cards with Real Revenue Data** */}
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

      {/* **UPDATED: Charts Section with Healthcare Focus** */}
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

      {/* **UPDATED: Specialty Performance Analysis** */}
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

      {/* **UPDATED: Detailed Analysis Tables with Specialty Focus** */}
      <div className="payment-total-analysis-section">
        <div className="payment-total-analysis-grid">
          {/* **UPDATED: Specialty Analysis Table** */}
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
                      
                      // **NEW: Get standard fee for specialty**
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

      {/* Outstanding Payments (if any) */}
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

      {/* **UPDATED: Executive Summary with Healthcare Focus** */}
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
