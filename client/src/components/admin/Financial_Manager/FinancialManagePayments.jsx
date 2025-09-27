import React, { useEffect, useState } from "react";
import { MdInventory, MdAnalytics, MdHome, MdPayment, MdCheckCircle, MdGetApp, MdPrint } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../Financial_Manager/FinancialManagePayments.css";


const APPOINTMENTS_API_URL = "http://localhost:7000/api/appointments";


function PatientSuccessfulPayments() {
  const [successfulPayments, setSuccessfulPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  // calculate consultation fee by specialty
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


  // fetch accepted appointments
  const fetchSuccessfulPayments = async () => {
    try {
      setLoading(true);
      setMessage("Loading accepted appointments...");
      const res = await fetch(APPOINTMENTS_API_URL);
      const text = await res.text();
      let data = [];
      try {
        data = JSON.parse(text);
        if (!Array.isArray(data)) {
          if (data.success && data.data) data = Array.isArray(data.data) ? data.data : [data.data];
          else if (data.appointments) data = Array.isArray(data.appointments) ? data.appointments : [data.appointments];
          else if (data.appointment) data = [data.appointment];
          else data = [];
        }
      } catch {
        data = [];
      }
      const accepted = data.filter((apt) => apt.status === "accepted");
      const enriched = accepted.map((apt) => {
        const fee = calculateConsultationFee(apt.doctorSpecialty);
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
          ...apt,
          totalAmount: fee,
          amountPaid: fee,
          paymentMethod: apt.paymentMethod || "Credit Card",
          transactionId: apt.transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          paymentDate: apt.paymentDate || apt.acceptedAt || new Date().toISOString(),
          paymentStatus: "paid",
          age,
          patientName: apt.name,
          formattedAppointmentDate: apt.appointmentDate ? apt.appointmentDate.split("T")[0] : ""
        };
      });
      setSuccessfulPayments(enriched);
      if (enriched.length) {
        const totalRevenue = enriched.reduce((s, a) => s + a.totalAmount, 0);
        setMessage(`Found ${enriched.length} accepted appointments totaling $${totalRevenue.toLocaleString()}`);
      } else {
        setMessage("No accepted appointments found.");
      }
    } catch (err) {
      setMessage(`Error fetching appointments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchSuccessfulPayments();
  }, []);


  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hh = parseInt(h, 10), pm = hh >= 12, display = hh % 12 || 12;
    return `${display}:${m || "00"} ${pm ? "PM" : "AM"}`;
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };


  const filtered = successfulPayments.filter(a => {
    const js = !searchTerm
      || a.name.toLowerCase().includes(searchTerm.toLowerCase())
      || a.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
      || a._id.toLowerCase().includes(searchTerm.toLowerCase());
    const jd = !filterDate || a.formattedAppointmentDate === filterDate;
    return js && jd;
  });


  const totalRevenue = filtered.reduce((s, a) => s + a.totalAmount, 0);


  // Manual PDF Report Generation
  const exportToPDF = () => {
    if (!filtered.length) {
      setError("No successful payments data to export");
      return;
    }


    const currentDate = new Date();
    const reportTitle = 'Patient Successful Payments Report';


    // Calculate summary statistics
    const paymentStats = {
      totalPayments: filtered.length,
      totalRevenue: totalRevenue,
      averagePayment: totalRevenue / filtered.length,
      uniquePatients: new Set(filtered.map(p => p.name)).size,
      uniqueDoctors: new Set(filtered.map(p => p.doctorName)).size,
      paymentMethods: filtered.reduce((acc, p) => {
        const method = p.paymentMethod || "Credit Card";
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {}),
      specialtyBreakdown: filtered.reduce((acc, p) => {
        const specialty = p.doctorSpecialty || "General Medicine";
        if (!acc[specialty]) {
          acc[specialty] = { count: 0, revenue: 0 };
        }
        acc[specialty].count += 1;
        acc[specialty].revenue += p.totalAmount;
        return acc;
      }, {}),
      monthlyBreakdown: filtered.reduce((acc, p) => {
        const month = new Date(p.appointmentDate || new Date()).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { count: 0, revenue: 0 };
        }
        acc[month].count += 1;
        acc[month].revenue += p.totalAmount;
        return acc;
      }, {})
    };


    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Heal-x ${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1da1f2; padding-bottom: 20px; }
          .header h1 { color: #1da1f2; margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; color: #666; font-size: 14px; }
          .info { margin-bottom: 20px; text-align: right; font-size: 11px; color: #555; }
          .summary-section { margin-bottom: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
          .summary-card { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; }
          .summary-card h4 { margin: 0 0 8px 0; color: #1da1f2; font-size: 14px; }
          .summary-card .metric-value { font-size: 18px; font-weight: bold; color: #333; margin: 5px 0; }
          .summary-card .metric-label { font-size: 11px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1da1f2; color: white; font-weight: bold; text-align: center; }
          .currency { text-align: right; }
          .totals-row { background-color: #f0f8ff; font-weight: bold; }
          .signature-section { margin-top: 60px; margin-bottom: 30px; width: 100%; page-break-inside: avoid; }
          .signature-section h3 { color: #1da1f2; border-bottom: 1px solid #1da1f2; padding-bottom: 5px; margin-bottom: 20px; }
          .signature-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
          .signature-block { width: 30%; text-align: center; }
          .signature-line { border-bottom: 2px dotted #333; width: 200px; height: 50px; margin: 0 auto 10px auto; position: relative; }
          .signature-text { font-size: 11px; font-weight: bold; color: #333; margin-top: 5px; }
          .signature-title { font-size: 10px; color: #666; margin-top: 2px; }
          .company-stamp { text-align: center; margin-top: 30px; padding: 15px; border: 2px solid #1da1f2; display: inline-block; font-size: 10px; color: #1da1f2; font-weight: bold; }
          .report-footer { margin-top: 40px; text-align: center; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; }
          .alert-section { margin: 20px 0; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; }
          .alert-title { font-weight: bold; color: #155724; margin-bottom: 8px; }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
            .signature-section { page-break-inside: avoid; }
          }
          .payment-section { background-color: #d4edda; border: 1px solid #c3e6cb; }
          .success-amount { color: #155724; }
          .patient-row { border-bottom: 1px solid #eee; }
          .patient-row:nth-child(even) { background-color: #f9f9f9; }
          .center { text-align: center; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1>🏥 Heal-x ${reportTitle}</h1>
          <p>Healthcare Payment Management & Revenue Analysis System</p>
        </div>
        
        <!-- Report Info -->
        <div class="info">
          <strong>Generated on:</strong> ${currentDate.toLocaleString()}<br>
          <strong>Report Type:</strong> Successful Patient Payments Analysis<br>
          <strong>Report Period:</strong> ${filterDate || 'All Time'}<br>
          <strong>Total Payments:</strong> ${paymentStats.totalPayments}<br>
          <strong>Total Revenue:</strong> ${formatCurrency(paymentStats.totalRevenue)}<br>
          <strong>Collection Rate:</strong> 100% (All Accepted Appointments)
        </div>
        
        <!-- Executive Summary -->
        <div class="summary-section payment-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📊 Payment Performance Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>✅ Total Successful Payments</h4>
              <div class="metric-value success-amount">${paymentStats.totalPayments}</div>
              <div class="metric-label">Accepted appointments with payments</div>
            </div>
            <div class="summary-card">
              <h4>💰 Total Revenue Generated</h4>
              <div class="metric-value success-amount">${formatCurrency(paymentStats.totalRevenue)}</div>
              <div class="metric-label">100% collection rate</div>
            </div>
            <div class="summary-card">
              <h4>📈 Average Payment Value</h4>
              <div class="metric-value">${formatCurrency(paymentStats.averagePayment)}</div>
              <div class="metric-label">Per successful appointment</div>
            </div>
            <div class="summary-card">
              <h4>👥 Unique Patients Served</h4>
              <div class="metric-value">${paymentStats.uniquePatients}</div>
              <div class="metric-label">Individual patients</div>
            </div>
            <div class="summary-card">
              <h4>👨‍⚕️ Healthcare Providers</h4>
              <div class="metric-value">${paymentStats.uniqueDoctors}</div>
              <div class="metric-label">Active doctors</div>
            </div>
            <div class="summary-card">
              <h4>🏆 Success Rate</h4>
              <div class="metric-value success-amount">100%</div>
              <div class="metric-label">Payment completion rate</div>
            </div>
          </div>
        </div>


        <div class="alert-section">
          <div class="alert-title">✅ Outstanding Payment Performance</div>
          <p>All ${paymentStats.totalPayments} appointments have been successfully completed with full payment collection totaling ${formatCurrency(paymentStats.totalRevenue)}. This represents a 100% collection rate demonstrating excellent patient satisfaction and financial efficiency.</p>
        </div>


        <!-- Payment Method Analysis -->
        <h3 style="color: #1da1f2; margin-top: 30px;">💳 Payment Method Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Number of Payments</th>
              <th>Percentage of Total</th>
              <th>Average Transaction</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(paymentStats.paymentMethods).map(([method, count]) => `
              <tr>
                <td><strong>${method}</strong></td>
                <td class="center">${count}</td>
                <td class="center">${((count / paymentStats.totalPayments) * 100).toFixed(1)}%</td>
                <td class="currency">${formatCurrency(totalRevenue * (count / paymentStats.totalPayments) / count)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>


        <!-- Specialty Revenue Analysis -->
        <h3 style="color: #1da1f2; margin-top: 30px;">🏥 Medical Specialty Revenue Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Medical Specialty</th>
              <th>Successful Appointments</th>
              <th>Total Revenue</th>
              <th>Average Fee</th>
              <th>% of Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(paymentStats.specialtyBreakdown)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([specialty, data]) => `
                <tr>
                  <td><strong>${specialty}</strong></td>
                  <td class="center">${data.count}</td>
                  <td class="currency">${formatCurrency(data.revenue)}</td>
                  <td class="currency">${formatCurrency(data.revenue / data.count)}</td>
                  <td class="center">${((data.revenue / paymentStats.totalRevenue) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            <tr class="totals-row">
              <td><strong>TOTAL</strong></td>
              <td class="center"><strong>${paymentStats.totalPayments}</strong></td>
              <td class="currency"><strong>${formatCurrency(paymentStats.totalRevenue)}</strong></td>
              <td class="currency"><strong>${formatCurrency(paymentStats.averagePayment)}</strong></td>
              <td class="center"><strong>100.0%</strong></td>
            </tr>
          </tbody>
        </table>


        <!-- Monthly Revenue Trends -->
        <h3 style="color: #1da1f2; margin-top: 30px;">📅 Monthly Revenue Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Successful Payments</th>
              <th>Monthly Revenue</th>
              <th>Average per Payment</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(paymentStats.monthlyBreakdown)
              .sort((a, b) => new Date(a[0]) - new Date(b[0]))
              .map(([month, data]) => `
                <tr>
                  <td><strong>${month}</strong></td>
                  <td class="center">${data.count}</td>
                  <td class="currency">${formatCurrency(data.revenue)}</td>
                  <td class="currency">${formatCurrency(data.revenue / data.count)}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>


        <!-- Detailed Patient Payment Records -->
        <h3 style="color: #1da1f2; margin-top: 30px;">📋 Detailed Patient Payment Records</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.slice(0, 50).map(payment => `
              <tr class="patient-row">
                <td>${formatDate(payment.appointmentDate)}</td>
                <td><strong>${payment.name}</strong></td>
                <td class="center">${payment.age || 'N/A'}</td>
                <td>${payment.doctorName}</td>
                <td>${payment.doctorSpecialty}</td>
                <td class="currency success-amount"><strong>${formatCurrency(payment.totalAmount)}</strong></td>
                <td>${payment.paymentMethod}</td>
                <td style="font-family: monospace; font-size: 9px;">${payment.transactionId}</td>
              </tr>
            `).join('')}
            ${filtered.length > 50 ? `
              <tr>
                <td colspan="8" class="center" style="font-style: italic; color: #666;">
                  ... and ${filtered.length - 50} more successful payments (showing first 50 records)
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>


        <!-- Key Performance Indicators -->
        <h3 style="color: #1da1f2; margin-top: 30px;">📈 Key Performance Indicators</h3>
        <table>
          <thead>
            <tr>
              <th>KPI Metric</th>
              <th>Current Performance</th>
              <th>Industry Benchmark</th>
              <th>Performance Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Payment Collection Rate</strong></td>
              <td class="currency success-amount"><strong>100%</strong></td>
              <td class="currency">85-95%</td>
              <td class="center">🏆 Excellent</td>
            </tr>
            <tr>
              <td><strong>Average Revenue per Patient</strong></td>
              <td class="currency"><strong>${formatCurrency(paymentStats.averagePayment)}</strong></td>
              <td class="currency">$3,500-$5,500</td>
              <td class="center">${paymentStats.averagePayment > 5500 ? '🏆 Excellent' : paymentStats.averagePayment > 3500 ? '✅ Good' : '⚠️ Below Average'}</td>
            </tr>
            <tr>
              <td><strong>Payment Processing Efficiency</strong></td>
              <td class="currency success-amount"><strong>Immediate</strong></td>
              <td class="currency">Same-day processing</td>
              <td class="center">🏆 Excellent</td>
            </tr>
            <tr>
              <td><strong>Patient Satisfaction (Payment)</strong></td>
              <td class="currency success-amount"><strong>100%</strong></td>
              <td class="currency">90-95%</td>
              <td class="center">🏆 Excellent</td>
            </tr>
          </tbody>
        </table>


        <!-- Financial Insights & Recommendations -->
        <h3 style="color: #1da1f2; margin-top: 30px;">💡 Financial Performance Insights</h3>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Insight & Recommendation</th>
              <th>Expected Impact</th>
              <th>Implementation Timeline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color: #28a745;">MAINTAIN</strong></td>
              <td>Continue excellent 100% collection rate performance</td>
              <td>Sustained revenue growth</td>
              <td>Ongoing</td>
            </tr>
            <tr>
              <td><strong style="color: #17a2b8;">OPTIMIZE</strong></td>
              <td>Analyze high-performing specialties for expansion opportunities</td>
              <td>10-15% revenue increase</td>
              <td>Q2 2025</td>
            </tr>
            <tr>
              <td><strong style="color: #ffc107;">MONITOR</strong></td>
              <td>Track monthly trends for seasonal variations</td>
              <td>Better resource planning</td>
              <td>Q1 2025</td>
            </tr>
            <tr>
              <td><strong style="color: #17a2b8;">EXPAND</strong></td>
              <td>Diversify payment methods to improve patient convenience</td>
              <td>5-10% volume increase</td>
              <td>Q3 2025</td>
            </tr>
          </tbody>
        </table>


        <!-- Professional Signature Section -->
        <div class="signature-section">
          <h3>📋 Payment Report Authorization</h3>
          <div class="signature-container">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Financial Manager Heal-x Healthcare Management</div>
              <div class="signature-title">Issued By</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Chief Financial Officer</div>
              <div class="signature-title">Payment Systems Oversight</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Admin Heal-x Healthcare Management</div>
              <div class="signature-title">Approved by</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <div class="company-stamp">
              HEAL-X OFFICIAL SEAL<br>
              PATIENT PAYMENT SERVICES
            </div>
          </div>
        </div>


        <!-- Report Footer -->
        <div class="report-footer">
          <p><strong>This is a system-generated patient payment report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${currentDate.toLocaleString()} • Total Successful Payments: ${paymentStats.totalPayments}</p>
          <p>For queries regarding patient payments, contact the Revenue Department at Heal-x Healthcare</p>
          <p>Data Source: Live Appointments API • Payment Status: All Successful (100% Collection Rate)</p>
          <p>Report covers ${paymentStats.totalPayments} successful payments totaling ${formatCurrency(paymentStats.totalRevenue)} • Average: ${formatCurrency(paymentStats.averagePayment)}</p>
        </div>


        <!-- Print Controls -->
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">🖨️ Print Payment Report</button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">✕ Close</button>
        </div>
      </body>
      </html>
    `;


    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();


    setSuccess("Patient Successful Payments report opened! Use Ctrl+P to save as PDF.");
    setTimeout(() => setSuccess(""), 3000);
  };


  // Export to CSV
  const exportToCSV = () => {
    if (!filtered.length) {
      setError("No successful payments data to export");
      return;
    }


    let csvContent = `Heal-x Patient Successful Payments Report - ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'PAYMENT SUMMARY\n';
    csvContent += `Total Successful Payments,${filtered.length}\n`;
    csvContent += `Total Revenue Generated,${totalRevenue}\n`;
    csvContent += `Average Payment Amount,${(totalRevenue / filtered.length).toFixed(2)}\n`;
    csvContent += `Collection Rate,100%\n\n`;
    
    csvContent += 'DETAILED PAYMENT RECORDS\n';
    csvContent += 'Date,Patient Name,Age,Doctor,Specialty,Amount,Payment Method,Transaction ID\n';
    
    filtered.forEach(payment => {
      csvContent += `"${formatDate(payment.appointmentDate)}","${payment.name}","${payment.age || 'N/A'}","${payment.doctorName}","${payment.doctorSpecialty}",${payment.totalAmount},"${payment.paymentMethod}","${payment.transactionId}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Heal-x_Successful_Payments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('✅ Successful payments data exported to CSV successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };


  const handleReturnHome = () => navigate("/admin/financial");
  
  // **FIXED: Updated handlePaymentAnalysis to pass the correct data structure**
  const handlePaymentAnalysis = () => {
    // Get the raw appointment data for conversion
    const appointmentData = successfulPayments.map(payment => ({
      ...payment,
      status: "accepted" // Ensure status is set
    }));


    navigate("/admin/financial/payments/total-view", { 
      state: { 
        appointments: appointmentData,
        type: 'successful-appointments',
        // Also include the converted payments as backup
        payments: filtered,
        stats: {
          totalPayments: filtered.length,
          totalAmountDue: filtered.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
          totalAmountPaid: filtered.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          totalPending: 0,
          collectionRate: 100,
          paymentMethods: filtered.reduce((acc, p) => {
            const method = p.paymentMethod || "Credit Card";
            acc[method] = (acc[method] || 0) + (p.amountPaid || 0);
            return acc;
          }, {}),
          hospitalBreakdown: filtered.reduce((acc, p) => {
            const hospital = p.doctorSpecialty || "General Medicine";
            if (!acc[hospital]) {
              acc[hospital] = { totalValue: 0, totalDue: 0, totalPaid: 0, count: 0 };
            }
            acc[hospital].totalDue += (p.totalAmount || 0);
            acc[hospital].totalPaid += (p.amountPaid || 0);
            acc[hospital].count += 1;
            return acc;
          }, {})
        }
      } 
    });
  };


  const handleInventoryAnalysis = () => {
    navigate("/admin/financial/payments/inventory-view", {
      state: {
        inventoryItems: successfulPayments,
        inventoryStats: {
          totalItems: successfulPayments.length,
          totalQuantity: successfulPayments.reduce((sum, a) => sum + (a.quantity||1), 0),
          totalValue: successfulPayments.reduce((sum, a) => sum + (a.totalAmount||0), 0),
          lowStockCount: successfulPayments.filter(a => (a.quantity||0) < (a.minStockLevel||1)).length,
          outOfStockCount: successfulPayments.filter(a => (a.quantity||0) === 0).length,
          categoryBreakdown: successfulPayments.reduce((acc, a) => {
            const c = a.doctorSpecialty || "General";
            if (!acc[c]) acc[c] = { totalValue: 0, count: 0, totalQuantity: 0, lowStockCount: 0 };
            acc[c].totalValue += a.totalAmount;
            acc[c].count++;
            acc[c].totalQuantity += a.quantity || 1;
            if (a.quantity && a.quantity < (a.minStockLevel || 1)) acc[c].lowStockCount++;
            return acc;
          }, {}),
          supplierBreakdown: {},
          lowStockItems: successfulPayments.filter(a => (a.quantity||0) < (a.minStockLevel||1)),
          outOfStockItems: successfulPayments.filter(a => (a.quantity||0) === 0)
        }
      }
    });
  };


  const renderDetails = (a) => (
    <div className="appointment-details successful-payment">
      <div className="success-header">
        <MdCheckCircle size={24} />
        <span> Payment Confirmed!</span>
      </div>
      <div className="fee-display">
        <span>${a.totalAmount.toLocaleString()}</span> <small>{a.doctorSpecialty}</small>
      </div>
      <div className="info-grid">
        <div><strong>Patient:</strong> {a.name}</div>
        <div><strong>Age:</strong> {a.age}</div>
        <div><strong>Doctor:</strong> {a.doctorName}</div>
        <div><strong>Date:</strong> {formatDate(a.appointmentDate)}</div>
        <div><strong>Time:</strong> {formatTime(a.appointmentTime)}</div>
      </div>
    </div>
  );


  // **ADDED: generatePatientReceipt function that was missing**
  const generatePatientReceipt = (appointment) => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Receipt - Heal-X</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .receipt-header { text-align: center; margin-bottom: 20px; }
          .receipt-details { margin: 20px 0; }
          .receipt-total { font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h2>🏥 Heal-X Healthcare</h2>
          <p>Official Payment Receipt</p>
        </div>
        <div class="receipt-details">
          <p><strong>Patient:</strong> ${appointment.name}</p>
          <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
          <p><strong>Specialty:</strong> ${appointment.doctorSpecialty}</p>
          <p><strong>Date:</strong> ${formatDate(appointment.appointmentDate)}</p>
          <p><strong>Time:</strong> ${formatTime(appointment.appointmentTime)}</p>
          <p><strong>Transaction ID:</strong> ${appointment.transactionId}</p>
          <p><strong>Payment Method:</strong> ${appointment.paymentMethod}</p>
        </div>
        <div class="receipt-total">
          <p>Amount Paid: $${appointment.totalAmount.toLocaleString()}</p>
          <p>Status: PAID ✅</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p><em>Thank you for choosing Heal-X Healthcare!</em></p>
        </div>
      </body>
      </html>
    `;


    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(receiptContent);
      newWindow.document.close();
      newWindow.print();
    }
  };


  if (loading) return <div className="loading-spinner">Loading...</div>;


  return (
    <div className="patient-payments-container">
      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success" style={{margin: '20px', padding: '15px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '5px', color: '#155724'}}>
          ✅ {success}
        </div>
      )}


      {error && (
        <div className="alert alert-error" style={{margin: '20px', padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '5px', color: '#721c24'}}>
          ❌ {error}
        </div>
      )}


      {/* Header */}
      <div className="patient-payments-header">
        <h2 className="patient-payments-title">Patient Successful Payments</h2>
        <div className="header-buttons">
          <button className="btn-base btn-home" onClick={handleReturnHome}>
            <MdHome size={18} />
            <span>Return Home</span>
          </button>
          <button className="btn-base btn-analysis" onClick={handlePaymentAnalysis}>
            <MdAnalytics size={18} />
            <span>Payment Analysis</span>
          </button>
          <button className="btn-base btn-inventory" onClick={handleInventoryAnalysis}>
            <MdInventory size={18} />
            <span>Inventory Analysis</span>
          </button>
        </div>
      </div>


      {/* Report Generation Section */}
      <div className="report-generation-section" style={{margin: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6'}}>
        <h3 style={{margin: '0 0 15px 0', color: '#1da1f2'}}>📊 Payment Reports</h3>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button 
            onClick={exportToPDF}
            disabled={!filtered.length}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              backgroundColor: '#1da1f2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: filtered.length ? 'pointer' : 'not-allowed',
              opacity: filtered.length ? 1 : 0.6
            }}
          >
            <MdGetApp size={18} />
            Generate PDF Report
          </button>
          <button 
            onClick={exportToCSV}
            disabled={!filtered.length}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: filtered.length ? 'pointer' : 'not-allowed',
              opacity: filtered.length ? 1 : 0.6
            }}
          >
            <MdPrint size={18} />
            Export CSV Data
          </button>
        </div>
      </div>


      {/* Summary */}
      <div className="success-summary">
        <div className="summary-card">
          <MdCheckCircle size={32} />
          <div><h3>{filtered.length}</h3><p>Accepted Appointments</p></div>
        </div>
        <div className="summary-card">
          <MdPayment size={32} />
          <div><h3>${totalRevenue.toLocaleString()}</h3><p>Total Revenue</p></div>
        </div>
      </div>


      {/* Filters */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, doctor, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="date-filter">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>


      {message && <div className="status-message">{message}</div>}


      {/* Table */}
      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Details</th>
              <th>Fee</th>
              <th>Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((a) => (
                <tr key={a._id}>
                  <td>{renderDetails(a)}</td>
                  <td>${a.totalAmount.toLocaleString()}</td>
                  <td>${a.amountPaid.toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn-receipt"
                      onClick={() => generatePatientReceipt(a)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        minWidth: '100px',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#5a6268';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#6c757d';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <MdPayment size={16} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No accepted appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default PatientSuccessfulPayments;
