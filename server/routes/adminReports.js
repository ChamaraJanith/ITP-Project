// backend/routes/adminReports.js
const express = require('express');
const router = express.Router();

// Mock data generator for demonstration
const generateMockReportData = (reportData) => {
  const { month, year, includeFinancials, includePatients, includeStaff } = reportData;
  
  return {
    period: { month, year },
    financials: includeFinancials ? {
      totalRevenue: Math.floor(Math.random() * 100000) + 50000,
      totalExpenses: Math.floor(Math.random() * 60000) + 30000,
      netProfit: Math.floor(Math.random() * 40000) + 20000,
      appointmentRevenue: Math.floor(Math.random() * 30000) + 15000,
      consultationFees: Math.floor(Math.random() * 25000) + 12000
    } : null,
    patients: includePatients ? {
      total: Math.floor(Math.random() * 500) + 200,
      newPatients: Math.floor(Math.random() * 50) + 20,
      activePatients: Math.floor(Math.random() * 300) + 150,
      appointmentsCompleted: Math.floor(Math.random() * 400) + 200
    } : null,
    staff: includeStaff ? {
      totalStaff: Math.floor(Math.random() * 20) + 10,
      doctors: Math.floor(Math.random() * 8) + 3,
      nurses: Math.floor(Math.random() * 15) + 5,
      receptionists: Math.floor(Math.random() * 5) + 2
    } : null
  };
};

// Generate HTML Report
const generateHTMLReport = (data, metadata) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${metadata.reportType.toUpperCase()} Report</title>
        <style>
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                margin: 40px; 
                background: #f8f9fa;
            }
            .container { 
                background: white; 
                padding: 40px; 
                border-radius: 10px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
                border-bottom: 3px solid #007bff; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
                text-align: center;
            }
            .section { 
                margin-bottom: 40px; 
                padding: 20px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
            }
            .section h2 { 
                color: #495057; 
                border-bottom: 2px solid #e9ecef; 
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .metrics-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 20px; 
                margin: 20px 0;
            }
            .metric { 
                padding: 20px; 
                border: 1px solid #dee2e6; 
                border-radius: 8px; 
                background: #f8f9fa;
                text-align: center;
            }
            .metric-value { 
                font-size: 2em; 
                font-weight: bold; 
                color: #007bff; 
                margin-bottom: 5px;
            }
            .metric-label { 
                color: #6c757d; 
                font-size: 0.9em;
            }
            .summary-info {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            @media print {
                body { margin: 0; background: white; }
                .container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 ${metadata.reportType.toUpperCase()} REPORT</h1>
                <div class="summary-info">
                    <p><strong>📅 Period:</strong> ${monthNames[metadata.month - 1]} ${metadata.year}</p>
                    <p><strong>📊 Generated:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>⏰ Time:</strong> ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
  `;

  if (data.financials) {
    html += `
        <div class="section">
            <h2>💰 Financial Summary</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value">$${data.financials.totalRevenue.toLocaleString()}</div>
                    <div class="metric-label">Total Revenue</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$${data.financials.totalExpenses.toLocaleString()}</div>
                    <div class="metric-label">Total Expenses</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$${data.financials.netProfit.toLocaleString()}</div>
                    <div class="metric-label">Net Profit</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$${data.financials.appointmentRevenue.toLocaleString()}</div>
                    <div class="metric-label">Appointment Revenue</div>
                </div>
            </div>
        </div>
    `;
  }

  if (data.patients) {
    html += `
        <div class="section">
            <h2>👥 Patient Statistics</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value">${data.patients.total.toLocaleString()}</div>
                    <div class="metric-label">Total Patients</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.patients.newPatients}</div>
                    <div class="metric-label">New Patients</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.patients.activePatients}</div>
                    <div class="metric-label">Active Patients</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.patients.appointmentsCompleted}</div>
                    <div class="metric-label">Appointments Completed</div>
                </div>
            </div>
        </div>
    `;
  }

  if (data.staff) {
    html += `
        <div class="section">
            <h2>👨‍⚕️ Staff Overview</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value">${data.staff.totalStaff}</div>
                    <div class="metric-label">Total Staff</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.staff.doctors}</div>
                    <div class="metric-label">Doctors</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.staff.nurses}</div>
                    <div class="metric-label">Nurses</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.staff.receptionists}</div>
                    <div class="metric-label">Receptionists</div>
                </div>
            </div>
        </div>
    `;
  }

  html += `
            <div style="margin-top: 40px; text-align: center; color: #6c757d; font-size: 0.9em;">
                <p>This report was generated automatically by the Hospital Management System</p>
                <p>© ${new Date().getFullYear()} Your Hospital Name</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  return html;
};

// Main route for generating summary report
router.post('/generate-summary', async (req, res) => {
  try {
    console.log('📊 Generating summary report:', req.body);
    
    const {
      reportType = 'monthly',
      month,
      year,
      includeFinancials,
      includePatients,
      includeStaff,
      includeAppointments,
      includeBilling,
      includeAnalytics,
      reportFormat
    } = req.body;

    // Validate required fields
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Generate mock report data (replace with real data fetching)
    const reportData = generateMockReportData(req.body);
    
    const metadata = { reportType, month, year };

    if (reportFormat === 'html') {
      const htmlContent = generateHTMLReport(reportData, metadata);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
      
    } else if (reportFormat === 'pdf') {
      // For now, return HTML content that can be converted to PDF on frontend
      const htmlContent = generateHTMLReport(reportData, metadata);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="Summary_Report_${month}_${year}.html"`);
      res.send(htmlContent);
      
    } else if (reportFormat === 'excel') {
      // Return CSV format for now (can be opened in Excel)
      let csvContent = `Hospital Summary Report - ${month}/${year}\n\n`;
      
      if (reportData.financials) {
        csvContent += `Financial Summary\n`;
        csvContent += `Total Revenue,${reportData.financials.totalRevenue}\n`;
        csvContent += `Total Expenses,${reportData.financials.totalExpenses}\n`;
        csvContent += `Net Profit,${reportData.financials.netProfit}\n\n`;
      }
      
      if (reportData.patients) {
        csvContent += `Patient Statistics\n`;
        csvContent += `Total Patients,${reportData.patients.total}\n`;
        csvContent += `New Patients,${reportData.patients.newPatients}\n`;
        csvContent += `Active Patients,${reportData.patients.activePatients}\n\n`;
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Summary_Report_${month}_${year}.csv"`);
      res.send(csvContent);
    }

  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report'
    });
  }
});

module.exports = router;
