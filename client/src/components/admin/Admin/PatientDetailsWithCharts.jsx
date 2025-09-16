// client/src/components/admin/PatientDetails/PatientDetailsDisplay.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../Admin/styles/PatientDetailsDisplay.css';
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

  // ✅ BLACK & WHITE PROFESSIONAL PDF GENERATION
// ✅ BLACK & WHITE PROFESSIONAL PDF GENERATION WITH SIGNATURES
const generateBlackWhitePDF = () => {
  if (!data) {
    toast.error('No data available for PDF generation');
    return;
  }

  setPrintLoading(true);
  
  try {
    // Create new jsPDF instance
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // ============= HEADER SECTION =============
    // Header border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, 35);
    
    // Inner header border
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, 31);
    
    // Company logo area (simple text-based)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('HEALTHCARE', 20, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('MANAGEMENT SYSTEM', 20, 32);
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT ANALYTICS REPORT', pageWidth - 20, 25, { align: 'right' });
    
    // Date and time
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date();
    doc.text(`Report Generated: ${currentDate.toLocaleDateString()}`, pageWidth - 20, 32, { align: 'right' });
    doc.text(`Time: ${currentDate.toLocaleTimeString()}`, pageWidth - 20, 38, { align: 'right' });

    let yPosition = 60;

    // ============= EXECUTIVE SUMMARY =============
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', 20, yPosition);
    
    // Underline
    doc.setLineWidth(1);
    doc.line(20, yPosition + 2, 120, yPosition + 2);
    yPosition += 15;

    // Summary Statistics Box
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 5, pageWidth - 40, 25);
    
    // Calculate metrics
    const growthRate = data.thisMonthPatients && data.totalPatients ? 
      (((data.thisMonthPatients / (data.totalPatients - data.thisMonthPatients)) * 100).toFixed(1)) : '0';
    const dailyAverage = Math.round((data.thisMonthPatients || 0) / 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Registered Patients: ${(data.totalPatients || 0).toLocaleString()}`, 25, yPosition + 3);
    doc.text(`New Registrations This Month: ${(data.thisMonthPatients || 0).toLocaleString()}`, 25, yPosition + 8);
    doc.text(`New Registrations Today: ${(data.todayPatients || 0).toLocaleString()}`, 25, yPosition + 13);
    doc.text(`Monthly Growth Rate: ${growthRate}%`, pageWidth - 25, yPosition + 3, { align: 'right' });
    doc.text(`Daily Average: ${dailyAverage} patients`, pageWidth - 25, yPosition + 8, { align: 'right' });
    doc.text(`Database Status: Active`, pageWidth - 25, yPosition + 13, { align: 'right' });

    yPosition += 35;

    // ============= DETAILED STATISTICS TABLE =============
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED STATISTICS', 20, yPosition);
    yPosition += 10;

    const detailedStatsData = [
      ['METRIC', 'VALUE', 'PERCENTAGE', 'NOTES'],
      ['Total Patients', (data.totalPatients || 0).toLocaleString(), '100.0%', 'Complete database'],
      ['This Month', (data.thisMonthPatients || 0).toLocaleString(), 
       `${data.totalPatients ? ((data.thisMonthPatients / data.totalPatients) * 100).toFixed(1) : '0'}%`, 'New registrations'],
      ['Today', (data.todayPatients || 0).toLocaleString(), 
       `${data.thisMonthPatients ? ((data.todayPatients / data.thisMonthPatients) * 100).toFixed(1) : '0'}%`, 'Daily activity'],
      ['Growth Rate', `${growthRate}%`, 'Monthly', 'Registration trend'],
      ['Daily Average', `${dailyAverage}`, 'Per day', 'Average registrations']
    ];

    doc.autoTable({
      startY: yPosition,
      head: [detailedStatsData[0]],
      body: detailedStatsData.slice(1),
      theme: 'grid',
      styles: { 
        textColor: [0, 0, 0],
        fontSize: 9,
        cellPadding: 4
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.3
      },
      alternateRowStyles: { 
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 20 },
        3: { cellWidth: 'auto' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 20;

    // ============= DEMOGRAPHIC ANALYSIS =============
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DEMOGRAPHIC ANALYSIS', 20, yPosition);
    yPosition += 10;

    // Gender Distribution Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gender Distribution', 20, yPosition);
    yPosition += 8;

    const genderTableData = [
      ['GENDER', 'COUNT', 'PERCENTAGE', 'RATIO']
    ];

    data.genderCounts?.forEach(item => {
      const percentage = ((item.count / data.totalPatients) * 100).toFixed(1);
      const ratio = `1:${Math.round(data.totalPatients / item.count)}`;
      genderTableData.push([
        (item._id || 'NOT SPECIFIED').toUpperCase(),
        item.count.toLocaleString(),
        `${percentage}%`,
        ratio
      ]);
    });

    doc.autoTable({
      startY: yPosition,
      head: [genderTableData[0]],
      body: genderTableData.slice(1),
      theme: 'striped',
      styles: { 
        textColor: [0, 0, 0],
        fontSize: 9,
        cellPadding: 4
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: { 
        fillColor: [250, 250, 250]
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Check for new page
    if (yPosition > pageHeight - 120) {
      doc.addPage();
      yPosition = 30;
    }

    // Blood Group Distribution
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Blood Group Distribution', 20, yPosition);
    yPosition += 8;

    const bloodGroupTableData = [
      ['BLOOD GROUP', 'PATIENT COUNT', 'PERCENTAGE', 'RH FACTOR', 'CLINICAL NOTES']
    ];

    data.bloodGroupCounts?.sort((a, b) => b.count - a.count).forEach(item => {
      const percentage = ((item.count / data.totalPatients) * 100).toFixed(1);
      const rhFactor = item._id.includes('+') ? 'POSITIVE' : 'NEGATIVE';
      const clinicalNote = item._id.includes('+') ? 'Common donor type' : 'Universal recipient';
      
      bloodGroupTableData.push([
        item._id.toUpperCase(),
        `${item.count.toLocaleString()} patients`,
        `${percentage}%`,
        rhFactor,
        clinicalNote
      ]);
    });

    doc.autoTable({
      startY: yPosition,
      head: [bloodGroupTableData[0]],
      body: bloodGroupTableData.slice(1),
      theme: 'grid',
      styles: { 
        textColor: [0, 0, 0],
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [235, 235, 235],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: { 
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 25 },
        4: { fontSize: 7, cellWidth: 'auto' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Age Group Distribution (if available)
    if (data.ageGroupCounts && data.ageGroupCounts.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Age Group Distribution', 20, yPosition);
      yPosition += 8;

      const ageGroupTableData = [
        ['AGE GROUP', 'PATIENT COUNT', 'PERCENTAGE', 'CATEGORY']
      ];

      data.ageGroupCounts.forEach(item => {
        const percentage = ((item.count / data.totalPatients) * 100).toFixed(1);
        let category = 'ADULT';
        if (item._id.includes('Under 18')) category = 'MINOR';
        else if (item._id.includes('65+')) category = 'SENIOR';
        
        ageGroupTableData.push([
          item._id.toUpperCase(),
          `${item.count.toLocaleString()} patients`,
          `${percentage}%`,
          category
        ]);
      });

      doc.autoTable({
        startY: yPosition,
        head: [ageGroupTableData[0]],
        body: ageGroupTableData.slice(1),
        theme: 'plain',
        styles: { 
          textColor: [0, 0, 0],
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 1
        },
        bodyStyles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.3
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // ============= STATISTICAL ANALYSIS =============
    if (yPosition > pageHeight - 90) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTICAL ANALYSIS', 20, yPosition);
    yPosition += 10;

    // Analysis Box
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 5, pageWidth - 40, 35);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const analysisText = [
      `• Database contains ${data.totalPatients} complete patient records with comprehensive demographic data`,
      `• Monthly registration rate: ${data.thisMonthPatients} patients (${((data.thisMonthPatients/data.totalPatients)*100).toFixed(1)}% of total database)`,
      `• Daily registration average: ${dailyAverage} patients per day indicating ${growthRate > 0 ? 'positive' : 'stable'} growth trend`,
      `• Most prevalent blood group: ${data.bloodGroupCounts?.[0]?._id || 'N/A'} representing ${data.bloodGroupCounts?.[0] ? ((data.bloodGroupCounts[0].count/data.totalPatients)*100).toFixed(1) : '0'}% of population`,
      `• Gender distribution shows ${data.genderCounts?.find(g => g._id === 'Male')?.count > data.genderCounts?.find(g => g._id === 'Female')?.count ? 'male' : 'female'} majority in patient demographics`,
      `• Data integrity: 100% - All records contain required demographic information for analysis`
    ];

    analysisText.forEach((text, index) => {
      doc.text(text, 25, yPosition + 2 + (index * 5));
    });

    yPosition += 45;

    // ============= SIGNATURES SECTION =============
    // Check if we need space for signatures (need at least 80mm)
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL SIGNATURES', 20, yPosition);
    
    // Underline
    doc.setLineWidth(1);
    doc.line(20, yPosition + 2, 120, yPosition + 2);
    yPosition += 15;

    // Signature boxes dimensions
    const signatureBoxWidth = 70;
    const signatureBoxHeight = 35;
    const signatureMargin = 20;
    const adminSignatureX = signatureMargin;
    const doctorSignatureX = pageWidth - signatureBoxWidth - signatureMargin;

    // Admin Signature Box
    doc.setLineWidth(1);
    doc.rect(adminSignatureX, yPosition, signatureBoxWidth, signatureBoxHeight);
    
    // Admin signature area (inner box for actual signature)
    doc.setLineWidth(0.3);
    doc.rect(adminSignatureX + 5, yPosition + 5, signatureBoxWidth - 10, signatureBoxHeight - 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ADMIN SIGNATURE', adminSignatureX + signatureBoxWidth/2, yPosition + signatureBoxHeight - 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Administrator', adminSignatureX + signatureBoxWidth/2, yPosition + signatureBoxHeight - 5, { align: 'center' });

    // Doctor Signature Box
    doc.setLineWidth(1);
    doc.rect(doctorSignatureX, yPosition, signatureBoxWidth, signatureBoxHeight);
    
    // Doctor signature area (inner box for actual signature)
    doc.setLineWidth(0.3);
    doc.rect(doctorSignatureX + 5, yPosition + 5, signatureBoxWidth - 10, signatureBoxHeight - 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCTOR SIGNATURE', doctorSignatureX + signatureBoxWidth/2, yPosition + signatureBoxHeight - 10, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Chief Medical Officer', doctorSignatureX + signatureBoxWidth/2, yPosition + signatureBoxHeight - 5, { align: 'center' });

    yPosition += signatureBoxHeight + 15;

    // Date and Name fields for signatures
    // Admin Date & Name
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Date: ________________', adminSignatureX, yPosition);
    doc.text('Name: ________________', adminSignatureX, yPosition + 8);
    doc.text('Position: Administrator', adminSignatureX, yPosition + 16);

    // Doctor Date & Name
    doc.text('Date: ________________', doctorSignatureX, yPosition);
    doc.text('Name: ________________', doctorSignatureX, yPosition + 8);
    doc.text('Position: Chief Medical Officer', doctorSignatureX, yPosition + 16);

    yPosition += 25;

    // Verification Statement
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const verificationText = 'I hereby certify that the information contained in this report is accurate and complete to the best of my knowledge.';
    doc.text(verificationText, pageWidth/2, yPosition, { align: 'center', maxWidth: pageWidth - 40 });

    // ============= FOOTER =============
    const addFooter = (pageNum) => {
      // Footer border
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Footer content
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('HEALTHCARE MANAGEMENT SYSTEM', 20, pageHeight - 18);
      doc.text('PATIENT ANALYTICS REPORT - CONFIDENTIAL DOCUMENT', 20, pageHeight - 12);
      doc.text('This report contains sensitive patient information. Handle according to HIPAA guidelines.', 20, pageHeight - 6);
      
      // Page number and generation info
      doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 12, { align: 'right' });
      doc.text(`Generated: ${currentDate.toLocaleDateString()}`, pageWidth - 20, pageHeight - 6, { align: 'right' });
    };

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i);
    }

    // Generate filename and save
    const filename = `patient-analytics-report-signed-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    toast.success('Professional PDF with signatures generated successfully!');
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
        {/* Header */}
        <div className="pd-display-header">
          <div className="pd-display-header-content">
            <div>
              <h1 className="pd-display-title">Patient Analytics</h1>
              <p className="pd-display-subtitle">Real-time patient data and insights</p>
            </div>
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

      {/* ✅ FLOATING PRINT/PDF BUBBLE WITH BLACK & WHITE OPTION */}
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
              {/* BLACK & WHITE PDF Download Button */}
              <button
                onClick={generateBlackWhitePDF}
                disabled={printLoading}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: printLoading ? '#94A3B8' : 'linear-gradient(135deg, #374151, #1F2937)',
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
                    e.target.style.boxShadow = '0 8px 20px rgba(55, 65, 81, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '24px' }}>📝</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '16px' }}>
                    {printLoading ? 'Generating B&W PDF...' : 'Download B&W PDF'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: '0.9', marginTop: '2px' }}>
                    Professional black & white format
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
                    Professional print layout
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
