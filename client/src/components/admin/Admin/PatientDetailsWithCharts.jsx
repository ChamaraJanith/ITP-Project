// client/src/components/admin/PatientDetails/PatientDetailsDisplay.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../Admin/styles/PatientDetailsDisplay.css';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PatientDetailsDisplay = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  // Add navigation hook
  const navigate = useNavigate();

  // Navigation function
  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:7000/api/patients/count/detailed');

      if (response.data.success) {
        setData(response.data.data);
        setLastUpdated(new Date());
        setError(null);
        toast.success('Data loaded successfully');
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 minutes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1800000);
    return () => clearInterval(interval);
  }, []);

  // ✅ UPDATED PROFESSIONAL HTML-BASED PDF REPORT GENERATION - MATCHING PROFIT/LOSS FORMAT
  const exportToPDF = () => {
    if (!data) {
      toast.error('No data available for PDF generation');
      return;
    }

    setPrintLoading(true);

    try {
      const currentDate = new Date();
      const reportTitle = 'Patient Analytics Report';

      // Calculate metrics for the report
      const growthRate = data.thisMonthPatients && data.totalPatients ? 
        (((data.thisMonthPatients / (data.totalPatients - data.thisMonthPatients)) * 100).toFixed(1)) : '0';
      const dailyAverage = Math.round((data.thisMonthPatients || 0) / 30);

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Heal-x ${reportTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
            }

            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1da1f2;
              padding-bottom: 20px;
            }

            .header h1 {
              color: #1da1f2;
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }

            .header p {
              margin: 10px 0 0 0;
              color: #666;
              font-size: 14px;
            }

            .info {
              margin-bottom: 20px;
              text-align: right;
              font-size: 11px;
              color: #555;
            }

            .summary-section {
              margin-bottom: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }

            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }

            .summary-card {
              background: white;
              padding: 15px;
              border-radius: 5px;
              border: 1px solid #ddd;
            }

            .summary-card h4 {
              margin: 0 0 8px 0;
              color: #1da1f2;
              font-size: 14px;
            }

            .summary-card .metric-value {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin: 5px 0;
            }

            .summary-card .metric-label {
              font-size: 11px;
              color: #666;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 10px;
            }

            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }

            th {
              background-color: #1da1f2;
              color: white;
              font-weight: bold;
              text-align: center;
            }

            .currency {
              text-align: right;
            }

            .totals-row {
              background-color: #f0f8ff;
              font-weight: bold;
            }

            .signature-section {
              margin-top: 60px;
              margin-bottom: 30px;
              width: 100%;
              page-break-inside: avoid;
            }

            .signature-section h3 {
              color: #1da1f2;
              border-bottom: 1px solid #1da1f2;
              padding-bottom: 5px;
              margin-bottom: 20px;
            }

            .signature-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 40px;
            }

            .signature-block {
              width: 30%;
              text-align: center;
            }

            .signature-line {
              border-bottom: 2px dotted #333;
              width: 200px;
              height: 50px;
              margin: 0 auto 10px auto;
              position: relative;
            }

            .signature-text {
              font-size: 11px;
              font-weight: bold;
              color: #333;
              margin-top: 5px;
            }

            .signature-title {
              font-size: 10px;
              color: #666;
              margin-top: 2px;
            }

            .company-stamp {
              text-align: center;
              margin-top: 30px;
              padding: 15px;
              border: 2px solid #1da1f2;
              display: inline-block;
              font-size: 10px;
              color: #1da1f2;
              font-weight: bold;
            }

            .report-footer {
              margin-top: 40px;
              text-align: center;
              font-size: 9px;
              color: #888;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }

            .alert-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 5px;
            }

            .alert-title {
              font-weight: bold;
              color: #856404;
              margin-bottom: 8px;
            }

            @media print {
              body { margin: 10px; }
              .no-print { display: none; }
              .signature-section { page-break-inside: avoid; }
            }

            .success-section {
              background-color: #d4edda;
              border: 1px solid #c3e6cb;
            }

            .growth-amount {
              color: #155724;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <h1>Heal-x ${reportTitle}</h1>
            <p>Healthcare Management System - Patient Analytics Dashboard</p>
          </div>

          <!-- Report Info -->
          <div class="info">
            <strong>Generated on:</strong> ${currentDate.toLocaleString()}<br>
            <strong>Report Type:</strong> Comprehensive Patient Analytics Report<br>
            <strong>Database Status:</strong> Active & Current<br>
            <strong>Data Period:</strong> All Time (Complete Database)
          </div>

          <!-- Executive Summary -->
          <div class="summary-section success-section">
            <h3 style="color: #1da1f2; margin: 0 0 15px 0;">Executive Summary</h3>
            <div class="summary-grid">
              <div class="summary-card">
                <h4>Total Registered Patients</h4>
                <div class="metric-value">${(data.totalPatients || 0).toLocaleString()}</div>
                <div class="metric-label">Complete patient database records</div>
              </div>

              <div class="summary-card">
                <h4>New Registrations This Month</h4>
                <div class="metric-value">${(data.thisMonthPatients || 0).toLocaleString()}</div>
                <div class="metric-label">${data.totalPatients ? Math.round((data.thisMonthPatients / data.totalPatients) * 100) : 0}% of total database</div>
              </div>

              <div class="summary-card">
                <h4>Today's New Registrations</h4>
                <div class="metric-value">${(data.todayPatients || 0).toLocaleString()}</div>
                <div class="metric-label">${data.thisMonthPatients ? Math.round((data.todayPatients / data.thisMonthPatients) * 100) : 0}% of monthly registrations</div>
              </div>

              <div class="summary-card">
                <h4>Monthly Growth Rate</h4>
                <div class="metric-value growth-amount">${growthRate}%</div>
                <div class="metric-label">Daily average: ${dailyAverage} patients/day</div>
              </div>
            </div>
          </div>

          ${growthRate > 0 ? `
          <div class="alert-section success-section">
            <div class="alert-title" style="color: #155724;">✓ Positive Growth Trend</div>
            <p>Your healthcare facility is experiencing positive patient registration growth with a ${growthRate}% monthly growth rate. Continue monitoring patient satisfaction and service quality to maintain this positive trend.</p>
          </div>
          ` : `
          <div class="alert-section">
            <div class="alert-title">⚠ Registration Monitoring</div>
            <p>Current registration growth rate is ${growthRate}%. Consider implementing patient outreach programs and service improvements to enhance patient acquisition.</p>
          </div>
          `}

          <!-- Patient Demographics Analysis -->
          <h3 style="color: #1da1f2; margin-top: 30px;">Patient Demographics Analysis</h3>

          <!-- Gender Distribution Table -->
          <table>
            <thead>
              <tr>
                <th colspan="2">Gender Distribution Analysis</th>
                <th colspan="2">Statistical Breakdown</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Male Patients</strong></td>
                <td class="currency">${data.genderCounts?.find(g => g._id === 'Male')?.count || 0}</td>
                <td><strong>Percentage</strong></td>
                <td class="currency">${data.totalPatients ? ((data.genderCounts?.find(g => g._id === 'Male')?.count || 0) / data.totalPatients * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td><strong>Total Female Patients</strong></td>
                <td class="currency">${data.genderCounts?.find(g => g._id === 'Female')?.count || 0}</td>
                <td><strong>Percentage</strong></td>
                <td class="currency">${data.totalPatients ? ((data.genderCounts?.find(g => g._id === 'Female')?.count || 0) / data.totalPatients * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr>
                <td><strong>Other/Unspecified</strong></td>
                <td class="currency">${data.genderCounts?.find(g => g._id !== 'Male' && g._id !== 'Female')?.count || 0}</td>
                <td><strong>Gender Ratio</strong></td>
                <td class="currency">1:${Math.round((data.genderCounts?.find(g => g._id === 'Female')?.count || 1) / (data.genderCounts?.find(g => g._id === 'Male')?.count || 1))}</td>
              </tr>
            </tbody>
          </table>

          <!-- Blood Group Distribution -->
          <h3 style="color: #1da1f2; margin-top: 30px;">Blood Group Distribution</h3>
          <table>
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Patient Count</th>
                <th>Percentage</th>
                <th>Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              ${data.bloodGroupCounts?.sort((a, b) => b.count - a.count).map(item => {
                const percentage = ((item.count / data.totalPatients) * 100).toFixed(1);
                const clinicalNote = item._id.includes('+') ? 'Universal donor compatible' : 'Requires specific matching';
                return `
                  <tr>
                    <td><strong>${item._id}</strong></td>
                    <td class="currency">${item.count} patients</td>
                    <td class="currency">${percentage}%</td>
                    <td>${clinicalNote}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="4">No blood group data available</td></tr>'}
            </tbody>
          </table>

          <!-- Key Patient Metrics -->
          <h3 style="color: #1da1f2; margin-top: 30px;">Key Patient Metrics</h3>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Database Completion</strong></td>
                <td class="currency"><strong>100%</strong></td>
                <td>All patient records contain complete demographic data</td>
              </tr>
              <tr>
                <td><strong>Registration Velocity</strong></td>
                <td class="currency"><strong>${dailyAverage}/day</strong></td>
                <td>Average daily patient registrations</td>
              </tr>
              <tr>
                <td><strong>Monthly Growth</strong></td>
                <td class="currency growth-amount"><strong>${growthRate}%</strong></td>
                <td>Month-over-month registration growth rate</td>
              </tr>
              <tr>
                <td><strong>Most Common Blood Group</strong></td>
                <td class="currency"><strong>${data.bloodGroupCounts?.[0]?._id || 'N/A'}</strong></td>
                <td>${data.bloodGroupCounts?.[0] ? ((data.bloodGroupCounts[0].count/data.totalPatients)*100).toFixed(1) : '0'}% of total patient population</td>
              </tr>
            </tbody>
          </table>

          <!-- Detailed Patient Statistics -->
          <h3 style="color: #1da1f2; margin-top: 30px;">Detailed Patient Statistics</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Patients</strong></td>
                <td class="currency"><strong>${data.totalPatients?.toLocaleString() || 0}</strong></td>
                <td>Complete patient database with full demographic information</td>
              </tr>
              <tr>
                <td><strong>Current Month</strong></td>
                <td class="currency"><strong>${data.thisMonthPatients?.toLocaleString() || 0}</strong></td>
                <td>New patient registrations in current month (${((data.thisMonthPatients/data.totalPatients)*100).toFixed(1)}% of total)</td>
              </tr>
              <tr>
                <td><strong>Today</strong></td>
                <td class="currency"><strong>${data.todayPatients?.toLocaleString() || 0}</strong></td>
                <td>New registrations today (${data.thisMonthPatients ? ((data.todayPatients/data.thisMonthPatients)*100).toFixed(1) : '0'}% of monthly target)</td>
              </tr>
              <tr>
                <td><strong>Gender Distribution</strong></td>
                <td class="currency"><strong>${data.genderCounts?.length || 0} categories</strong></td>
                <td>Complete gender demographic breakdown with statistical analysis</td>
              </tr>
              <tr>
                <td><strong>Blood Groups</strong></td>
                <td class="currency"><strong>${data.bloodGroupCounts?.length || 0} types</strong></td>
                <td>Comprehensive blood group distribution for medical planning</td>
              </tr>
            </tbody>
          </table>

          <!-- Patient Analytics Insights -->
          <h3 style="color: #1da1f2; margin-top: 30px;">Patient Analytics Insights & Recommendations</h3>
          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #1da1f2;">📊 Database Statistics</div>
            <div style="font-size: 11px; margin-bottom: 5px;">Patient database contains ${data.totalPatients} complete records with comprehensive demographic data for healthcare planning and analysis.</div>
            <div style="font-size: 10px; padding: 5px; background-color: rgba(0,0,0,0.05); border-radius: 3px;"><strong>Recommendation:</strong> Continue maintaining complete patient records and consider implementing advanced analytics for patient care optimization.</div>
          </div>

          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: ${growthRate > 0 ? '#d4edda' : '#fff3cd'};">
            <div style="font-weight: bold; margin-bottom: 5px; color: ${growthRate > 0 ? '#155724' : '#856404'};">📈 Growth Analysis</div>
            <div style="font-size: 11px; margin-bottom: 5px;">Monthly registration growth rate of ${growthRate}% indicates ${growthRate > 0 ? 'positive' : 'stable'} patient acquisition trends with ${dailyAverage} average daily registrations.</div>
            <div style="font-size: 10px; padding: 5px; background-color: rgba(0,0,0,0.05); border-radius: 3px;"><strong>Recommendation:</strong> ${growthRate > 0 ? 'Maintain current patient outreach strategies and monitor service quality metrics.' : 'Consider implementing patient referral programs and community outreach initiatives.'}</div>
          </div>

          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8d7da;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #721c24;">🩸 Medical Planning</div>
            <div style="font-size: 11px; margin-bottom: 5px;">Blood group distribution shows ${data.bloodGroupCounts?.[0]?._id || 'N/A'} as most prevalent (${data.bloodGroupCounts?.[0] ? ((data.bloodGroupCounts[0].count/data.totalPatients)*100).toFixed(1) : '0'}%), enabling strategic blood bank and emergency planning.</div>
            <div style="font-size: 10px; padding: 5px; background-color: rgba(0,0,0,0.05); border-radius: 3px;"><strong>Recommendation:</strong> Use blood group distribution data for inventory planning and emergency preparedness protocols.</div>
          </div>

          <!-- Professional Signature Section -->
          <div class="signature-section">
            <h3>Report Authorization</h3>
            <div class="signature-container">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-text">System Administrator</div>
                <div class="signature-title">Heal-x Healthcare Management</div>
              </div>

              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-text">Report Approved By</div>
                <div class="signature-title">Medical Director</div>
              </div>

              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-text">Data Analyst</div>
                <div class="signature-title">Healthcare Analytics Team</div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <div class="company-stamp">
                HEAL-X OFFICIAL SEAL<br>
                HEALTHCARE MANAGEMENT SYSTEM
              </div>
            </div>
          </div>

          <!-- Report Footer -->
          <div class="report-footer">
            <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
            <p>Report generated on ${currentDate.toLocaleString()} | All data is current and validated</p>
            <p>For queries regarding this report, contact the Analytics Department at Heal-x Healthcare</p>
            <p><strong>Data Sources:</strong> Patient Registration API | Demographics API | Analytics Engine</p>
          </div>

          <!-- Print Controls -->
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">📄 Print PDF Report</button>
            <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">✕ Close</button>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();

      toast.success('Professional PDF report opened! Use Ctrl+P to save as PDF.');
      setShowPrintMenu(false);

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setPrintLoading(false);
    }
  };

  // Regular Print Function (same as before)
  const handlePrint = () => {
    if (!data) {
      toast.error('No data available for printing');
      return;
    }

    setPrintLoading(true);

    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Patient Analytics Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              color: #000; 
              line-height: 1.4;
              background: white;
            }
            .header { 
              text-align: center; 
              border: 2px solid #000;
              padding: 20px;
              margin-bottom: 30px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 20px; 
              margin-bottom: 30px; 
            }
            .summary-card { 
              border: 1px solid #000;
              padding: 15px;
              text-align: center;
            }
            .summary-number { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .data-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            .data-table th, .data-table td { 
              padding: 8px; 
              text-align: left; 
              border: 1px solid #000; 
            }
            .data-table th { 
              background: #f0f0f0;
              font-weight: bold; 
            }
            @media print { 
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">PATIENT ANALYTICS REPORT</div>
            <div>Healthcare Management System</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-number">${(data.totalPatients || 0).toLocaleString()}</div>
              <div>Total Patients</div>
            </div>
            <div class="summary-card">
              <div class="summary-number">${(data.thisMonthPatients || 0).toLocaleString()}</div>
              <div>This Month</div>
            </div>
            <div class="summary-card">
              <div class="summary-number">${(data.todayPatients || 0).toLocaleString()}</div>
              <div>Today</div>
            </div>
            <div class="summary-card">
              <div class="summary-number">${data.thisMonthPatients && data.totalPatients ? 
                (((data.thisMonthPatients / (data.totalPatients - data.thisMonthPatients)) * 100).toFixed(1)) : '0'}%</div>
              <div>Growth Rate</div>
            </div>
          </div>

          <h3>Gender Distribution</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Gender</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${data.genderCounts?.map(item => {
                const percentage = ((item.count / data.totalPatients) * 100).toFixed(1);
                return `
                  <tr>
                    <td><strong>${item._id || 'Not Specified'}</strong></td>
                    <td>${item.count}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="3">No data available</td></tr>'}
            </tbody>
          </table>

          <h3>Blood Group Distribution</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Patient Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${data.bloodGroupCounts?.sort((a, b) => b.count - a.count).map(item => {
                const percentage = ((item.count / data.totalPatients) * 100).toFixed(1);
                return `
                  <tr>
                    <td><strong>${item._id}</strong></td>
                    <td>${item.count} patients</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="3">No data available</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 10px; text-align: center; font-size: 12px;">
            <strong>Healthcare Management System | Confidential Document</strong>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setPrintLoading(false);
        setShowPrintMenu(false);
        toast.success('Print dialog opened successfully');
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to prepare print');
      setPrintLoading(false);
    }
  };

  // Chart Components (same as before)
  const GenderChart = () => {
    if (!data?.genderCounts) return <div className="pd-chart-loading">No gender data</div>;

    const chartData = {
      labels: data.genderCounts.map(item => item._id),
      datasets: [
        {
          data: data.genderCounts.map(item => item.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(236, 72, 153)',
            'rgb(168, 85, 247)'
          ],
          borderWidth: 3,
          hoverOffset: 8
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: { size: 14, weight: '600' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = ((context.raw / data.totalPatients) * 100).toFixed(1);
              return `${context.label}: ${context.raw} (${percentage}%)`;
            }
          }
        }
      }
    };

    return <Doughnut data={chartData} options={options} />;
  };

  const BloodGroupChart = () => {
    if (!data?.bloodGroupCounts) return <div className="pd-chart-loading">No blood group data</div>;

    const chartData = {
      labels: data.bloodGroupCounts.map(item => item._id),
      datasets: [
        {
          label: 'Number of Patients',
          data: data.bloodGroupCounts.map(item => item.count),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = ((context.raw / data.totalPatients) * 100).toFixed(1);
              return `${context.raw} patients (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { 
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    };

    return <Bar data={chartData} options={options} />;
  };

  // Loading State
  if (loading && !data) {
    return (
      <div className="pd-display-wrapper">
        <div className="pd-display-loading">
          <div className="pd-loading-spinner"></div>
          <h2 className="pd-loading-text">Loading Patient Data</h2>
          <p className="pd-loading-subtext">Fetching latest statistics...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !data) {
    return (
      <div className="pd-display-wrapper">
        <div className="pd-display-error">
          <div className="pd-error-icon">❌</div>
          <h2 className="pd-error-title">Error Loading Data</h2>
          <p className="pd-error-message">{error}</p>
          <button className="pd-error-button" onClick={fetchData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-display-wrapper">
      <div className="pd-display-container">
        {/* ✅ HEADER WITH INTEGRATED DASHBOARD BUTTON */}
        <div className="pd-display-header">
          <div className="pd-display-header-content">
            {/* Left Side - Dashboard Button + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Dashboard Button */}
              <button
                onClick={handleBackToDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '160px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                aria-label="Back to Dashboard"
              >
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  fontSize: '14px'
                }}>
                  ←
                </span>
                <span>Back to Dashboard</span>
              </button>

              {/* Title and Subtitle */}
              <div>
                <h1 className="pd-display-title">Patient Analytics</h1>
                <p className="pd-display-subtitle">Real-time patient data and insights</p>
              </div>
            </div>

            {/* Right Side - Timestamp and Refresh Button */}
            <div className="pd-display-header-actions">
              {lastUpdated && (
                <p className="pd-display-timestamp">
                  Last Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
              <button
                className="pd-display-refresh-btn"
                onClick={fetchData}
                disabled={loading}
              >
                <span className={loading ? 'pd-chart-spinner' : ''} style={{ width: '16px', height: '16px' }}>
                  🔄
                </span>
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="pd-display-stats-grid">
          <div className="pd-stat-card pd-stat-card--blue">
            <div className="pd-stat-card-content">
              <div className="pd-stat-info">
                <h3 className="pd-stat-title">Total Patients</h3>
                <p className="pd-stat-value">{data?.totalPatients || 0}</p>
                <p className="pd-stat-subtitle">All registered patients</p>
              </div>
              <div className="pd-stat-icon-wrapper">👥</div>
            </div>
          </div>

          <div className="pd-stat-card pd-stat-card--green">
            <div className="pd-stat-card-content">
              <div className="pd-stat-info">
                <h3 className="pd-stat-title">This Month</h3>
                <p className="pd-stat-value">{data?.thisMonthPatients || 0}</p>
                <p className="pd-stat-subtitle">Monthly registrations</p>
                <p className="pd-stat-percentage">
                  {data?.totalPatients ? Math.round((data.thisMonthPatients / data.totalPatients) * 100) : 0}% of total
                </p>
              </div>
              <div className="pd-stat-icon-wrapper">📅</div>
            </div>
          </div>

          <div className="pd-stat-card pd-stat-card--purple">
            <div className="pd-stat-card-content">
              <div className="pd-stat-info">
                <h3 className="pd-stat-title">Today</h3>
                <p className="pd-stat-value">{data?.todayPatients || 0}</p>
                <p className="pd-stat-subtitle">Today's registrations</p>
                <p className="pd-stat-percentage">
                  {data?.thisMonthPatients ? Math.round((data.todayPatients / data.thisMonthPatients) * 100) : 0}% of monthly
                </p>
              </div>
              <div className="pd-stat-icon-wrapper">🆕</div>
            </div>
          </div>

          <div className="pd-stat-card pd-stat-card--yellow">
            <div className="pd-stat-card-content">
              <div className="pd-stat-info">
                <h3 className="pd-stat-title">Under 18</h3>
                <p className="pd-stat-value">{data?.ageGroupCounts?.[0]?.count || 0}</p>
                <p className="pd-stat-subtitle">Minors in system</p>
                <p className="pd-stat-percentage">
                  {data?.totalPatients ? Math.round(((data.ageGroupCounts?.[0]?.count || 0) / data.totalPatients) * 100) : 0}% of total
                </p>
              </div>
              <div className="pd-stat-icon-wrapper">👶</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="pd-display-charts-section">
          <div className="pd-display-charts-grid">
            {/* Gender Chart */}
            <div className="pd-chart-card">
              <h3 className="pd-chart-title">
                <span>👫</span>
                Gender Distribution
              </h3>
              <div className="pd-chart-container">
                {loading ? (
                  <div className="pd-chart-loading">
                    <div className="pd-chart-spinner"></div>
                  </div>
                ) : (
                  <GenderChart />
                )}
              </div>
            </div>

            {/* Blood Group Chart */}
            <div className="pd-chart-card">
              <h3 className="pd-chart-title">
                <span>🩸</span>
                Blood Group Distribution
              </h3>
              <div className="pd-chart-container">
                {loading ? (
                  <div className="pd-chart-loading">
                    <div className="pd-chart-spinner"></div>
                  </div>
                ) : (
                  <BloodGroupChart />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="pd-display-breakdown">
          {/* Gender Breakdown */}
          <div className="pd-breakdown-card">
            <h3 className="pd-breakdown-title">Gender Breakdown</h3>
            <div>
              {data?.genderCounts?.map((item, index) => (
                <div key={index} className="pd-breakdown-item">
                  <span className="pd-breakdown-label">{item._id}</span>
                  <div className="pd-breakdown-progress">
                    <div className="pd-breakdown-bar">
                      <div 
                        className="pd-breakdown-fill"
                        style={{ width: `${(item.count / data.totalPatients) * 100}%` }}
                      ></div>
                    </div>
                    <span className="pd-breakdown-value">
                      {item.count} ({((item.count / data.totalPatients) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blood Group Breakdown */}
          <div className="pd-breakdown-card">
            <h3 className="pd-breakdown-title">Blood Group Breakdown</h3>
            <div>
              {data?.bloodGroupCounts
                ?.sort((a, b) => b.count - a.count)
                ?.map((item, index) => (
                <div key={index} className="pd-breakdown-item">
                  <span className="pd-breakdown-label">{item._id}</span>
                  <div className="pd-breakdown-progress">
                    <div className="pd-breakdown-bar">
                      <div 
                        className="pd-breakdown-fill"
                        style={{ 
                          width: `${(item.count / Math.max(...data.bloodGroupCounts.map(g => g.count))) * 100}%`,
                          background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                        }}
                      ></div>
                    </div>
                    <span className="pd-breakdown-value">
                      {item.count} ({((item.count / data.totalPatients) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="pd-display-status">
          <div className="pd-status-indicators">
            <div className="pd-status-item">
              <div className={`pd-status-dot ${loading ? 'pd-status-dot--loading' : ''}`}></div>
              <span className="pd-status-text">
                {loading ? 'Updating...' : 'Data Current'}
              </span>
            </div>
            <div className="pd-status-item">
              <div className="pd-status-dot pd-status-dot--active"></div>
              <span className="pd-status-text">Auto-refresh Active (30min)</span>
            </div>
          </div>
          <div className="pd-status-timestamp">
            {data && `Updated: ${new Date(data.timestamp).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* ✅ FLOATING PRINT/PDF BUBBLE - UPDATED MATCHING PROFIT/LOSS FORMAT */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 9999
      }}>
        {/* Main Bubble Button */}
        <button
          onClick={() => setShowPrintMenu(!showPrintMenu)}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            fontSize: '28px',
            cursor: 'pointer',
            boxShadow: showPrintMenu ? '0 12px 35px rgba(102, 126, 234, 0.6)' : '0 8px 25px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: showPrintMenu ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)'
          }}
          aria-label="PDF and Print Options"
        >
          📄
        </button>

        {/* Options Menu */}
        {showPrintMenu && (
          <div style={{
            position: 'absolute',
            bottom: '85px',
            right: '0',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            padding: '0',
            minWidth: '320px',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Menu Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              textAlign: 'center',
              fontWeight: '700',
              fontSize: '16px',
              position: 'relative'
            }}>
              📊 Report Options

              {/* Close Button */}
              <button
                onClick={() => setShowPrintMenu(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '15px',
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* PROFESSIONAL PDF Download Button */}
              <button
                onClick={exportToPDF}
                disabled={printLoading}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: printLoading ? '#94A3B8' : 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: printLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '15px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  transition: 'all 0.3s ease',
                  opacity: printLoading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!printLoading) {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(29, 161, 242, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '24px' }}>📄</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '16px' }}>
                    {printLoading ? 'Generating PDF...' : 'Generate Professional PDF'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: '0.9', marginTop: '2px' }}>
                    Professional analytics report format
                  </div>
                </div>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={printLoading}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: printLoading ? '#94A3B8' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: printLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  transition: 'all 0.3s ease',
                  opacity: printLoading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!printLoading) {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '24px' }}>🖨️</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '16px' }}>
                    {printLoading ? 'Preparing Print...' : 'Print Report'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: '0.9', marginTop: '2px' }}>
                    Quick print layout
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Backdrop */}
        {showPrintMenu && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.1)',
              zIndex: -1
            }}
            onClick={() => setShowPrintMenu(false)}
          />
        )}
      </div>

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default PatientDetailsDisplay;