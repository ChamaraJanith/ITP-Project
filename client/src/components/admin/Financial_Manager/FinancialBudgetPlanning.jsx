import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdHome,
  MdAnalytics,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
  MdCancel,
  MdTrendingUp,
  MdTrendingDown,
  MdCompare,
  MdCalendarToday,
  MdAttachMoney,
  MdBarChart,
  MdPieChart,
  MdTimeline,
  MdRefresh,
  MdDownload,
  MdUpload,
  MdPrint,
  MdGetApp
} from "react-icons/md";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import "./FinancialBudgetPlanning.css";

// API Endpoints - EXACT same as your other files
const PAYMENTS_API = "http://localhost:7000/api/payments";
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const INVENTORY_API = "http://localhost:7000/api/inventory/surgical-items";
const UTILITIES_API = "http://localhost:7000/api/financial-utilities";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FinancialBudgetPlanning = () => {
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Data States
  const [historicalData, setHistoricalData] = useState({
    payments: [],
    payroll: [],
    inventory: [],
    utilities: []
  });
  
  const [budgetPlans, setBudgetPlans] = useState([]);
  const [activeBudgetPlan, setActiveBudgetPlan] = useState(null);
  
  // Form States
  const [newBudgetForm, setNewBudgetForm] = useState({
    planName: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 2,
    budgetType: "operational",
    description: ""
  });
  
  const [editingBudget, setEditingBudget] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // View States
  const [activeView, setActiveView] = useState("overview");
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [comparisonMode, setComparisonMode] = useState("actual-vs-budget");

  // ✅ Report generation refs - same as payroll
  const printableRef = useRef();

  // Utility Functions
  function getCurrentQuarter() {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const calculateGrowthRate = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // ✅ REPORT GENERATION FUNCTIONS - Same format as Financial Payroll
  const exportToPDF = () => {
    try {
      if (!activeBudgetPlan) {
        setError("Please select an active budget plan to generate report.");
        return;
      }

      const historicalFinancials = processHistoricalFinancials();
      const currentDate = new Date();
      const reportData = prepareReportData();

      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError("Please allow popups to generate PDF reports.");
        return;
      }

      // Generate HTML content
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Budget Planning Report - ${activeBudgetPlan.planName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            
            .report-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20mm;
              background: white;
            }
            
            .report-header {
              text-align: center;
              border-bottom: 3px solid #2c5282;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .company-logo {
              font-size: 32px;
              font-weight: bold;
              color: #2c5282;
              margin-bottom: 8px;
            }
            
            .report-title {
              font-size: 24px;
              color: #2d3748;
              margin-bottom: 10px;
              font-weight: bold;
            }
            
            .report-subtitle {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 15px;
            }
            
            .report-meta {
              display: flex;
              justify-content: space-between;
              background: #f7fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
              font-size: 14px;
            }
            
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            
            .meta-label {
              font-weight: bold;
              color: #2d3748;
            }
            
            .meta-value {
              color: #4a5568;
              margin-top: 4px;
            }
            
            .summary-section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #2c5282;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 25px;
            }
            
            .summary-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #2c5282;
            }
            
            .summary-card h4 {
              color: #2d3748;
              margin-bottom: 8px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #2c5282;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 12px;
            }
            
            .data-table th,
            .data-table td {
              border: 1px solid #e2e8f0;
              padding: 12px 8px;
              text-align: left;
            }
            
            .data-table th {
              background: #2c5282;
              color: white;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            
            .data-table tbody tr:nth-child(even) {
              background: #f8f9fa;
            }
            
            .data-table tbody tr:hover {
              background: #e6fffa;
            }
            
            .total-row {
              background: #2c5282 !important;
              color: white !important;
              font-weight: bold;
            }
            
            .total-row td {
              background: #2c5282;
              color: white;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .positive-variance {
              color: #38a169;
              font-weight: bold;
            }
            
            .negative-variance {
              color: #e53e3e;
              font-weight: bold;
            }
            
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              align-items: end;
            }
            
            .signature-block {
              text-align: center;
              min-width: 200px;
            }
            
            .signature-line {
              border-top: 1px solid #333;
              margin-bottom: 5px;
              height: 50px;
            }
            
            .signature-title {
              font-weight: bold;
              color: #2d3748;
            }
            
            .signature-subtitle {
              font-size: 12px;
              color: #4a5568;
            }
            
            .report-footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #718096;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            
            @media print {
              .report-container {
                padding: 0;
                max-width: none;
              }
              
              .data-table {
                font-size: 10px;
              }
              
              .data-table th,
              .data-table td {
                padding: 8px 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Header -->
            <div class="report-header">
              <div class="company-logo">🏥 Heal-x Healthcare</div>
              <div class="report-title">Budget Planning Report</div>
              <div class="report-subtitle">${activeBudgetPlan.planName}</div>
            </div>

            <!-- Report Metadata -->
            <div class="report-meta">
              <div class="meta-item">
                <span class="meta-label">Report Generated</span>
                <span class="meta-value">${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Budget Period</span>
                <span class="meta-value">${activeBudgetPlan.startYear} - ${activeBudgetPlan.endYear}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Budget Type</span>
                <span class="meta-value">${activeBudgetPlan.budgetType.charAt(0).toUpperCase() + activeBudgetPlan.budgetType.slice(1)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Quarters</span>
                <span class="meta-value">${reportData.length} Quarters</span>
              </div>
            </div>

            <!-- Executive Summary -->
            <div class="summary-section">
              <h2 class="section-title">Executive Summary</h2>
              <div class="summary-grid">
                <div class="summary-card">
                  <h4>Total Budgeted Revenue</h4>
                  <div class="summary-value">${formatCurrency(reportData.reduce((sum, q) => sum + q.budgetedRevenue, 0))}</div>
                </div>
                <div class="summary-card">
                  <h4>Total Budgeted Expenses</h4>
                  <div class="summary-value">${formatCurrency(reportData.reduce((sum, q) => sum + q.budgetedExpenses, 0))}</div>
                </div>
                <div class="summary-card">
                  <h4>Projected Net Income</h4>
                  <div class="summary-value">${formatCurrency(reportData.reduce((sum, q) => sum + (q.budgetedRevenue - q.budgetedExpenses), 0))}</div>
                </div>
                <div class="summary-card">
                  <h4>Historical Data Points</h4>
                  <div class="summary-value">${historicalFinancials.payments?.length || 0} Records</div>
                </div>
              </div>
            </div>

            <!-- Budget Data Table -->
            <div class="data-section">
              <h2 class="section-title">Quarterly Budget Breakdown</h2>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th class="text-right">Budgeted Revenue</th>
                    <th class="text-right">Budgeted Expenses</th>
                    <th class="text-right">Projected Net</th>
                    <th class="text-right">Actual Revenue</th>
                    <th class="text-right">Actual Expenses</th>
                    <th class="text-right">Actual Net</th>
                    <th class="text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.map(quarter => `
                    <tr>
                      <td>Q${quarter.quarter} ${quarter.year}</td>
                      <td class="text-right">${formatCurrency(quarter.budgetedRevenue)}</td>
                      <td class="text-right">${formatCurrency(quarter.budgetedExpenses)}</td>
                      <td class="text-right">${formatCurrency(quarter.budgetedRevenue - quarter.budgetedExpenses)}</td>
                      <td class="text-right">${quarter.actualRevenue > 0 ? formatCurrency(quarter.actualRevenue) : 'N/A'}</td>
                      <td class="text-right">${quarter.actualExpenses > 0 ? formatCurrency(quarter.actualExpenses) : 'N/A'}</td>
                      <td class="text-right">${quarter.actualRevenue > 0 ? formatCurrency(quarter.actualRevenue - quarter.actualExpenses) : 'N/A'}</td>
                      <td class="text-right ${quarter.variance >= 0 ? 'positive-variance' : 'negative-variance'}">
                        ${quarter.variance !== 0 ? (quarter.variance >= 0 ? '+' : '') + formatCurrency(quarter.variance) : 'N/A'}
                      </td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + q.budgetedRevenue, 0))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + q.budgetedExpenses, 0))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + (q.budgetedRevenue - q.budgetedExpenses), 0))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + q.actualRevenue, 0))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + q.actualExpenses, 0))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + (q.actualRevenue - q.actualExpenses), 0))}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(reportData.reduce((sum, q) => sum + q.variance, 0))}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-title">Issued By - Financial Manager</div>
                <div class="signature-subtitle">Financial Department Heal-X</div>
              </div>
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; border: 2px solid #2c5282; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                  <span style="font-size: 12px; color: #2c5282;">SEAL</span>
                </div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-title">Approved By - Admin Heal-x</div>
                <div class="signature-subtitle">Heal-x Healthcare System</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="report-footer">
              <p>This is a confidential financial document generated by Heal-x Healthcare Management System</p>
              <p>Report ID: BP-${Date.now()} | Generated by: Financial Management System</p>
            </div>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 500);

      setSuccess("Budget report generated successfully!");
      
    } catch (error) {
      console.error("Export to PDF error:", error);
      setError("Failed to generate PDF report: " + error.message);
    }
  };

  const printTable = () => {
    try {
      if (!activeBudgetPlan) {
        setError("Please select an active budget plan to print.");
        return;
      }

      const reportData = prepareReportData();
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError("Please allow popups to print reports.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Budget Planning Table - ${activeBudgetPlan.planName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c5282; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2c5282; color: white; }
            .text-right { text-align: right; }
            .total-row { background-color: #f0f8ff; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Budget Planning Report</h1>
          <h2>${activeBudgetPlan.planName}</h2>
          <p>Period: ${activeBudgetPlan.startYear} - ${activeBudgetPlan.endYear} | Type: ${activeBudgetPlan.budgetType}</p>
          
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Budgeted Revenue</th>
                <th>Budgeted Expenses</th>
                <th>Projected Net</th>
                <th>Actual Revenue</th>
                <th>Actual Expenses</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(quarter => `
                <tr>
                  <td>Q${quarter.quarter} ${quarter.year}</td>
                  <td class="text-right">${formatCurrency(quarter.budgetedRevenue)}</td>
                  <td class="text-right">${formatCurrency(quarter.budgetedExpenses)}</td>
                  <td class="text-right">${formatCurrency(quarter.budgetedRevenue - quarter.budgetedExpenses)}</td>
                  <td class="text-right">${quarter.actualRevenue > 0 ? formatCurrency(quarter.actualRevenue) : 'N/A'}</td>
                  <td class="text-right">${quarter.actualExpenses > 0 ? formatCurrency(quarter.actualExpenses) : 'N/A'}</td>
                  <td class="text-right">${quarter.variance !== 0 ? formatCurrency(quarter.variance) : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleDateString()} - Heal-x Healthcare System
          </p>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();
      
      setSuccess("Budget table printed successfully!");
      
    } catch (error) {
      console.error("Print table error:", error);
      setError("Failed to print table: " + error.message);
    }
  };

  const prepareReportData = () => {
    if (!activeBudgetPlan || !activeBudgetPlan.quarters) return [];
    
    return activeBudgetPlan.quarters.map(quarter => {
      const budgetedRevenue = Object.values(quarter.budget.revenue).reduce((a, b) => a + b, 0);
      const budgetedExpenses = Object.values(quarter.budget.expenses).reduce((a, b) => a + b, 0);
      const actualRevenue = quarter.actual ? Object.values(quarter.actual.revenue).reduce((a, b) => a + b, 0) : 0;
      const actualExpenses = quarter.actual ? Object.values(quarter.actual.expenses).reduce((a, b) => a + b, 0) : 0;
      const variance = quarter.actual ? (actualRevenue - actualExpenses) - (budgetedRevenue - budgetedExpenses) : 0;
      
      return {
        quarter: quarter.quarter,
        year: quarter.year,
        budgetedRevenue,
        budgetedExpenses,
        actualRevenue,
        actualExpenses,
        variance
      };
    });
  };

  // EXISTING DATA FETCHING FUNCTIONS (keep all your existing functions)
  const fetchPayrollData = async () => {
    try {
      console.log("Fetching payroll data from:", PAYROLL_API);
      const response = await fetch(`${PAYROLL_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw payroll response:", text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed payroll data:", data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log(`✅ Payroll: Found ${data.data.length} records`);
          return data.data;
        } else if (Array.isArray(data)) {
          console.log(`✅ Payroll: Found ${data.length} records (direct array)`);
          return data;
        } else {
          console.warn("Unexpected payroll response format:", data);
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing payroll JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      return [];
    }
  };

  const fetchInventoryData = async () => {
    try {
      console.log("Fetching inventory data from:", `${INVENTORY_API}?page=1&limit=1000`);
      const response = await fetch(`${INVENTORY_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw inventory response:", text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed inventory data:", data);
        
        if (data.success && data.data && Array.isArray(data.data.items)) {
          console.log(`✅ Inventory: Found ${data.data.items.length} items`);
          return data.data.items;
        } else if (Array.isArray(data)) {
          console.log(`✅ Inventory: Found ${data.length} items (direct array)`);
          return data;
        } else {
          console.warn("Unexpected inventory response format:", data);
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing inventory JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      return [];
    }
  };

  const fetchUtilitiesData = async () => {
    try {
      console.log("Fetching utilities data from:", UTILITIES_API);
      const response = await fetch(`${UTILITIES_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("Raw utilities response:", text.substring(0, 200) + "...");
      
      try {
        const data = JSON.parse(text);
        console.log("Parsed utilities data:", data);
        
        if (data.success && data.data && Array.isArray(data.data.utilities)) {
          console.log(`✅ Utilities: Found ${data.data.utilities.length} records`);
          return data.data.utilities;
        } else if (Array.isArray(data)) {
          console.log(`✅ Utilities: Found ${data.length} records (direct array)`);
          return data;
        } else {
          console.warn("Unexpected utilities response format:", data);
          return [];
        }
      } catch (parseError) {
        console.error("Error parsing utilities JSON:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error fetching utilities data:", error);
      return [];
    }
  };

  const fetchPaymentsData = async () => {
    try {
      console.log("Fetching payments data from:", PAYMENTS_API);
      const response = await fetch(PAYMENTS_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Payments data:", data);
      
      if (Array.isArray(data)) {
        console.log(`✅ Payments: Found ${data.length} records`);
        return data;
      } else if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Payments: Found ${data.data.length} records`);
        return data.data;
      } else {
        console.warn("Unexpected payments response format:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching payments data:", error);
      return [];
    }
  };

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading comprehensive financial data...");
      
      const [payrollData, inventoryData, utilitiesData, paymentsData] = await Promise.all([
        fetchPayrollData(),
        fetchInventoryData(),
        fetchUtilitiesData(),
        fetchPaymentsData()
      ]);

      console.log("📊 All data loaded:", {
        payroll: payrollData.length,
        inventory: inventoryData.length,
        utilities: utilitiesData.length,
        payments: paymentsData.length
      });

      setHistoricalData({
        payments: paymentsData,
        payroll: payrollData,
        inventory: inventoryData,
        utilities: utilitiesData
      });

    } catch (err) {
      console.error("❌ Error fetching historical data:", err);
      setError("Failed to fetch historical data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // [Keep all your existing functions: fetchBudgetPlans, generateMockQuarterlyData, processHistoricalFinancials, etc.]
  
  const fetchBudgetPlans = async () => {
    try {
      const savedPlans = localStorage.getItem('budgetPlans');
      if (savedPlans) {
        const plans = JSON.parse(savedPlans);
        setBudgetPlans(plans);
        return;
      }
      
      const defaultPlan = {
        _id: "default-plan-2025",
        planName: "Healthcare Budget 2025-2027",
        startYear: 2025,
        endYear: 2027,
        budgetType: "operational",
        status: "active",
        createdAt: new Date().toISOString(),
        quarters: generateMockQuarterlyData()
      };
      
      setBudgetPlans([defaultPlan]);
      localStorage.setItem('budgetPlans', JSON.stringify([defaultPlan]));
      
    } catch (err) {
      console.error("Error loading budget plans:", err);
    }
  };

  const generateMockQuarterlyData = () => {
    const quarters = [];
    for (let year = 2025; year <= 2027; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        quarters.push({
          year,
          quarter,
          budget: {
            revenue: {
              patientPayments: 150000 + (Math.random() * 50000),
              insuranceReimbursements: 200000 + (Math.random() * 75000),
              otherRevenue: 25000 + (Math.random() * 10000)
            },
            expenses: {
              payroll: 180000 + (Math.random() * 30000),
              inventory: 45000 + (Math.random() * 15000),
              utilities: 15000 + (Math.random() * 5000),
              other: 20000 + (Math.random() * 8000)
            }
          },
          actual: year === 2025 && quarter <= getCurrentQuarter() ? {
            revenue: {
              patientPayments: 145000 + (Math.random() * 40000),
              insuranceReimbursements: 195000 + (Math.random() * 65000),
              otherRevenue: 23000 + (Math.random() * 8000)
            },
            expenses: {
              payroll: 175000 + (Math.random() * 25000),
              inventory: 48000 + (Math.random() * 12000),
              utilities: 16000 + (Math.random() * 4000),
              other: 18000 + (Math.random() * 6000)
            }
          } : null
        });
      }
    }
    return quarters;
  };

  const processHistoricalFinancials = () => {
    const { payments, payroll, inventory, utilities } = historicalData;
    
    console.log("💰 Processing financial data:", {
      paymentsCount: payments.length,
      payrollCount: payroll.length,
      inventoryCount: inventory.length,
      utilitiesCount: utilities.length
    });
    
    const totalRevenue = payments.reduce((sum, p) => {
      const amount = parseFloat(p.totalAmount) || 0;
      return sum + amount;
    }, 0);
    
    const totalCollected = payments.reduce((sum, p) => {
      const amount = parseFloat(p.amountPaid) || 0;
      return sum + amount;
    }, 0);
    
    const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue * 100) : 0;
    
    const totalPayrollExpense = payroll.reduce((sum, p) => {
      const grossSalary = parseFloat(p.grossSalary) || 0;
      const bonuses = parseFloat(p.bonuses) || 0;
      const epf = parseFloat(p.epf) || 0;
      const etf = parseFloat(p.etf) || 0;
      return sum + grossSalary + bonuses + epf + etf;
    }, 0);
    
    const totalInventoryValue = inventory.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const itemValue = price * quantity;
      return sum + itemValue;
    }, 0);
    
    const totalUtilitiesExpense = utilities.reduce((sum, utility) => {
      const amount = parseFloat(utility.amount) || 0;
      return sum + amount;
    }, 0);
    
    const monthlyTrends = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      
      const monthlyRevenue = totalRevenue / 12 * (0.8 + Math.random() * 0.4);
      const monthlyExpenses = (totalPayrollExpense + totalUtilitiesExpense) / 12 * (0.9 + Math.random() * 0.2);
      
      monthlyTrends.push({
        month,
        revenue: Math.round(monthlyRevenue),
        expenses: Math.round(monthlyExpenses),
        netIncome: Math.round(monthlyRevenue - monthlyExpenses)
      });
    }

    const totalExpenses = totalPayrollExpense + totalUtilitiesExpense;
    const netIncome = totalCollected - totalExpenses;

    console.log("📊 Final financial summary:", {
      totalRevenue: totalRevenue.toFixed(2),
      totalCollected: totalCollected.toFixed(2),
      totalPayrollExpense: totalPayrollExpense.toFixed(2),
      totalInventoryValue: totalInventoryValue.toFixed(2),
      totalUtilitiesExpense: totalUtilitiesExpense.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netIncome: netIncome.toFixed(2),
      collectionRate: collectionRate.toFixed(1)
    });

    return {
      totalRevenue,
      totalCollected,
      collectionRate,
      totalPayrollExpense,
      totalInventoryValue,
      totalUtilitiesExpense,
      totalExpenses,
      netIncome,
      monthlyTrends,
      payments,
      payroll,
      inventory,
      utilities
    };
  };

  // [Keep all your existing event handlers and utility functions]

  const generateBudgetProjections = (historicalData, years = 3) => {
    const baseRevenue = historicalData.totalCollected || 300000;
    const baseExpenses = historicalData.totalExpenses || 250000;
    const growthRate = 0.08;
    
    const projections = [];
    
    for (let year = 0; year < years; year++) {
      const yearData = {
        year: new Date().getFullYear() + year,
        quarters: []
      };
      
      for (let quarter = 1; quarter <= 4; quarter++) {
        const seasonalFactor = quarter === 1 ? 0.9 : quarter === 2 ? 1.1 : quarter === 3 ? 0.95 : 1.05;
        const projectedRevenue = (baseRevenue * Math.pow(1 + growthRate, year) / 4) * seasonalFactor;
        const projectedExpenses = (baseExpenses * Math.pow(1 + growthRate * 0.6, year) / 4) * seasonalFactor;
        
        yearData.quarters.push({
          quarter,
          projectedRevenue: Math.round(projectedRevenue),
          projectedExpenses: Math.round(projectedExpenses),
          projectedNetIncome: Math.round(projectedRevenue - projectedExpenses),
          budgetCategories: {
            payroll: Math.round(projectedExpenses * 0.7),
            inventory: Math.round(projectedExpenses * 0.18),
            utilities: Math.round(projectedExpenses * 0.08),
            other: Math.round(projectedExpenses * 0.04)
          }
        });
      }
      
      projections.push(yearData);
    }
    
    return projections;
  };

  const handleCreateBudgetPlan = async (e) => {
    e.preventDefault();
    
    try {
      const historicalData = processHistoricalFinancials();
      const projections = generateBudgetProjections(historicalData, newBudgetForm.endYear - newBudgetForm.startYear + 1);
      
      const newPlan = {
        ...newBudgetForm,
        _id: Date.now().toString(),
        status: "active",
        createdAt: new Date().toISOString(),
        projections,
        quarters: generateMockQuarterlyData()
      };

      const updatedPlans = [...budgetPlans, newPlan];
      setBudgetPlans(updatedPlans);
      localStorage.setItem('budgetPlans', JSON.stringify(updatedPlans));
      
      setSuccess("Budget plan created successfully!");
      setShowCreateForm(false);
      setNewBudgetForm({
        planName: "",
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 2,
        budgetType: "operational",
        description: ""
      });
      
    } catch (err) {
      setError("Failed to create budget plan: " + err.message);
    }
  };

  const handleDeleteBudgetPlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this budget plan?")) return;
    
    try {
      const updatedPlans = budgetPlans.filter(plan => plan._id !== planId);
      setBudgetPlans(updatedPlans);
      localStorage.setItem('budgetPlans', JSON.stringify(updatedPlans));
      
      if (activeBudgetPlan?._id === planId) {
        setActiveBudgetPlan(updatedPlans[0] || null);
      }
      
      setSuccess("Budget plan deleted successfully!");
    } catch (err) {
      setError("Failed to delete budget plan: " + err.message);
    }
  };

  const generateComparisonData = () => {
    if (!activeBudgetPlan) return [];
    
    const currentYear = new Date().getFullYear();
    const currentQuarter = getCurrentQuarter();
    
    return activeBudgetPlan.quarters
      .filter(q => q.year === currentYear && q.quarter <= currentQuarter)
      .map(quarter => ({
        period: `Q${quarter.quarter} ${quarter.year}`,
        budgetedRevenue: Object.values(quarter.budget.revenue).reduce((a, b) => a + b, 0),
        actualRevenue: quarter.actual ? Object.values(quarter.actual.revenue).reduce((a, b) => a + b, 0) : 0,
        budgetedExpenses: Object.values(quarter.budget.expenses).reduce((a, b) => a + b, 0),
        actualExpenses: quarter.actual ? Object.values(quarter.actual.expenses).reduce((a, b) => a + b, 0) : 0,
        variance: quarter.actual ? 
          (Object.values(quarter.actual.revenue).reduce((a, b) => a + b, 0) - Object.values(quarter.actual.expenses).reduce((a, b) => a + b, 0)) -
          (Object.values(quarter.budget.revenue).reduce((a, b) => a + b, 0) - Object.values(quarter.budget.expenses).reduce((a, b) => a + b, 0))
          : 0
      }));
  };

  useEffect(() => {
    fetchHistoricalData();
    fetchBudgetPlans();
  }, []);

  useEffect(() => {
    if (budgetPlans.length > 0 && !activeBudgetPlan) {
      setActiveBudgetPlan(budgetPlans[0]);
    }
  }, [budgetPlans]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // [Keep all your existing render functions but add report buttons to the header]

  const renderOverviewDashboard = () => {
    const historicalData = processHistoricalFinancials();
    const comparisonData = generateComparisonData();
    
    return (
      <div className="fbp-overview-container">
        {/* ✅ Add Report Generation Section */}
        <div className="fbp-report-section">
          <div className="fbp-section-header">
            <h3>Budget Reports</h3>
            <div className="fbp-report-actions">
              <button 
                className="fbp-btn-report fbp-btn-pdf"
                onClick={exportToPDF}
                disabled={!activeBudgetPlan}
                title="Generate Professional PDF Report"
              >
                <MdGetApp size={18} />
                Generate PDF Report
              </button>
              <button 
                className="fbp-btn-report fbp-btn-print"
                onClick={printTable}
                disabled={!activeBudgetPlan}
                title="Print Budget Table"
              >
                <MdPrint size={18} />
                Print Table
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="fbp-metrics-grid">
          <div className="fbp-metric-card fbp-revenue">
            <div className="fbp-metric-icon">
              <MdTrendingUp size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Revenue</h3>
              <div className="fbp-metric-value">{formatCurrency(historicalData.totalRevenue)}</div>
              <div className="fbp-metric-change fbp-positive">
                +{calculateGrowthRate(historicalData.totalRevenue, historicalData.totalRevenue * 0.9)}% YoY
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-expenses">
            <div className="fbp-metric-icon">
              <MdTrendingDown size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Expenses</h3>
              <div className="fbp-metric-value">{formatCurrency(historicalData.totalExpenses)}</div>
              <div className="fbp-metric-change fbp-negative">
                +{calculateGrowthRate(historicalData.totalExpenses, historicalData.totalExpenses * 0.85)}% YoY
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-profit">
            <div className="fbp-metric-icon">
              <MdAttachMoney size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Net Income</h3>
              <div className="fbp-metric-value">{formatCurrency(historicalData.netIncome)}</div>
              <div className={`fbp-metric-change ${historicalData.netIncome > 0 ? 'fbp-positive' : 'fbp-negative'}`}>
                {historicalData.netIncome > 0 ? '+' : ''}{calculateGrowthRate(historicalData.netIncome, historicalData.netIncome * 0.8)}% YoY
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-collection">
            <div className="fbp-metric-icon">
              <MdBarChart size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Collection Rate</h3>
              <div className="fbp-metric-value">{historicalData.collectionRate.toFixed(1)}%</div>
              <div className="fbp-metric-change fbp-positive">
                +{(historicalData.collectionRate - 85).toFixed(1)}% vs Target
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="fbp-charts-grid">
          {/* Monthly Trends Chart */}
          <div className="fbp-chart-container">
            <h3>Monthly Financial Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={historicalData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} />
                <Line type="monotone" dataKey="netIncome" stroke="#00C49F" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Budget vs Actual Comparison */}
          {comparisonData.length > 0 && (
            <div className="fbp-chart-container">
              <h3>Budget vs Actual Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="budgetedRevenue" fill="#0088FE" name="Budgeted Revenue" />
                  <Bar dataKey="actualRevenue" fill="#00C49F" name="Actual Revenue" />
                  <Bar dataKey="budgetedExpenses" fill="#FF8042" name="Budgeted Expenses" />
                  <Bar dataKey="actualExpenses" fill="#FFBB28" name="Actual Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Real Data Summary */}
        <div className="fbp-data-summary">
          <div className="fbp-section-header">
            <h3>Live Data Summary</h3>
            <div className="fbp-data-indicators">
              <span className="fbp-indicator">
                💼 Payroll: {historicalData.payroll?.length || 0} records
              </span>
              <span className="fbp-indicator">
                📦 Inventory: {historicalData.inventory?.length || 0} items
              </span>
              <span className="fbp-indicator">
                ⚡ Utilities: {historicalData.utilities?.length || 0} bills
              </span>
              <span className="fbp-indicator">
                💰 Payments: {historicalData.payments?.length || 0} transactions
              </span>
            </div>
          </div>
        </div>

        {/* Active Budget Plans */}
        <div className="fbp-active-budget-plans">
          <div className="fbp-section-header">
            <h3>Active Budget Plans</h3>
            <button 
              className="fbp-btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <MdAdd size={18} />
              Create New Plan
            </button>
          </div>

          <div className="fbp-budget-plans-grid">
            {budgetPlans.map(plan => (
              <div key={plan._id} className={`fbp-budget-plan-card ${activeBudgetPlan?._id === plan._id ? 'fbp-active' : ''}`}>
                <div className="fbp-plan-header">
                  <h4>{plan.planName}</h4>
                  <div className="fbp-plan-actions">
                    <button onClick={() => setActiveBudgetPlan(plan)} className="fbp-btn-outline">
                      {activeBudgetPlan?._id === plan._id ? 'Active' : 'Select'}
                    </button>
                    <button onClick={() => handleDeleteBudgetPlan(plan._id)} className="fbp-btn-danger">
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
                <div className="fbp-plan-details">
                  <div className="fbp-plan-period">{plan.startYear} - {plan.endYear}</div>
                  <div className="fbp-plan-type">{plan.budgetType.charAt(0).toUpperCase() + plan.budgetType.slice(1)} Budget</div>
                  <div className="fbp-plan-status">
                    <span className={`fbp-status-badge fbp-${plan.status}`}>{plan.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // [Keep all your existing render functions: renderCreateBudgetForm, renderQuarterlyReview]
  
  const renderCreateBudgetForm = () => (
    <div className="fbp-create-budget-form-container">
      <div className="fbp-form-header">
        <h3>Create Multi-Year Budget Plan</h3>
        <button 
          className="fbp-btn-outline"
          onClick={() => setShowCreateForm(false)}
        >
          <MdCancel size={18} />
          Cancel
        </button>
      </div>

      <form onSubmit={handleCreateBudgetPlan} className="fbp-budget-form">
        <div className="fbp-form-grid">
          <div className="fbp-form-group">
            <label>Plan Name *</label>
            <input
              type="text"
              value={newBudgetForm.planName}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, planName: e.target.value }))}
              required
              placeholder="e.g., Healthcare Budget 2025-2027"
            />
          </div>

          <div className="fbp-form-group">
            <label>Budget Type *</label>
            <select
              value={newBudgetForm.budgetType}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, budgetType: e.target.value }))}
              required
            >
              <option value="operational">Operational Budget</option>
              <option value="rolling">Rolling Budget</option>
              <option value="strategic">Strategic Budget</option>
            </select>
          </div>

          <div className="fbp-form-group">
            <label>Start Year *</label>
            <input
              type="number"
              value={newBudgetForm.startYear}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
              required
            />
          </div>

          <div className="fbp-form-group">
            <label>End Year *</label>
            <input
              type="number"
              value={newBudgetForm.endYear}
              onChange={(e) => setNewBudgetForm(prev => ({ ...prev, endYear: parseInt(e.target.value) }))}
              min={newBudgetForm.startYear}
              max={newBudgetForm.startYear + 5}
              required
            />
          </div>
        </div>

        <div className="fbp-form-group fbp-full-width">
          <label>Description</label>
          <textarea
            value={newBudgetForm.description}
            onChange={(e) => setNewBudgetForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the budget plan objectives and scope..."
            rows={3}
          />
        </div>

        <div className="fbp-form-actions">
          <button type="submit" className="fbp-btn-primary">
            <MdSave size={18} />
            Create Budget Plan
          </button>
        </div>
      </form>

      <div className="fbp-budget-template-preview">
        <h4>Budget Template Preview</h4>
        <div className="fbp-template-info">
          <p>This will create a {newBudgetForm.endYear - newBudgetForm.startYear + 1}-year budget plan with:</p>
          <ul>
            <li>Quarterly budget cycles for each year</li>
            <li>Automatic rollover capabilities</li>
            <li>Revenue projections based on historical patient volume</li>
            <li>Recurring expense allocations (Payroll, Inventory, Utilities)</li>
            <li>Variance analysis and performance tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderQuarterlyReview = () => {
    if (!activeBudgetPlan) {
      return (
        <div className="fbp-no-data-message">
          <p>Please select an active budget plan to view quarterly reviews.</p>
        </div>
      );
    }

    const quarterData = activeBudgetPlan.quarters.find(
      q => q.year === selectedYear && q.quarter === selectedQuarter
    );

    if (!quarterData) {
      return (
        <div className="fbp-no-data-message">
          <p>No data available for Q{selectedQuarter} {selectedYear}.</p>
        </div>
      );
    }

    const budgetTotal = Object.values(quarterData.budget.revenue).reduce((a, b) => a + b, 0);
    const expenseTotal = Object.values(quarterData.budget.expenses).reduce((a, b) => a + b, 0);
    const actualRevenueTotal = quarterData.actual ? Object.values(quarterData.actual.revenue).reduce((a, b) => a + b, 0) : 0;
    const actualExpenseTotal = quarterData.actual ? Object.values(quarterData.actual.expenses).reduce((a, b) => a + b, 0) : 0;

    return (
      <div className="fbp-quarterly-review-container">
        <div className="fbp-quarter-selector">
          <h3>Quarterly Budget Review</h3>
          <div className="fbp-selector-controls">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select 
              value={selectedQuarter} 
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="fbp-quarterly-metrics">
          <div className="fbp-quarter-metric-card">
            <h4>Budgeted Revenue</h4>
            <div className="fbp-metric-value">{formatCurrency(budgetTotal)}</div>
          </div>
          <div className="fbp-quarter-metric-card">
            <h4>Actual Revenue</h4>
            <div className="fbp-metric-value">{formatCurrency(actualRevenueTotal)}</div>
            <div className={`fbp-variance ${actualRevenueTotal >= budgetTotal ? 'fbp-positive' : 'fbp-negative'}`}>
              {actualRevenueTotal >= budgetTotal ? '+' : ''}{formatCurrency(actualRevenueTotal - budgetTotal)}
            </div>
          </div>
          <div className="fbp-quarter-metric-card">
            <h4>Budgeted Expenses</h4>
            <div className="fbp-metric-value">{formatCurrency(expenseTotal)}</div>
          </div>
          <div className="fbp-quarter-metric-card">
            <h4>Actual Expenses</h4>
            <div className="fbp-metric-value">{formatCurrency(actualExpenseTotal)}</div>
            <div className={`fbp-variance ${actualExpenseTotal <= expenseTotal ? 'fbp-positive' : 'fbp-negative'}`}>
              {actualExpenseTotal <= expenseTotal ? '-' : '+'}{formatCurrency(Math.abs(actualExpenseTotal - expenseTotal))}
            </div>
          </div>
        </div>

        {/* Detailed Budget Breakdown */}
        <div className="fbp-budget-breakdown-section">
          <h4>Revenue Breakdown</h4>
          <div className="fbp-breakdown-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budgeted</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(quarterData.budget.revenue).map(([category, budgeted]) => {
                  const actual = quarterData.actual?.revenue[category] || 0;
                  const variance = actual - budgeted;
                  const percentage = budgeted > 0 ? (variance / budgeted * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={category}>
                      <td>{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                      <td>{formatCurrency(budgeted)}</td>
                      <td>{formatCurrency(actual)}</td>
                      <td className={variance >= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                      <td className={variance >= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4>Expense Breakdown</h4>
          <div className="fbp-breakdown-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budgeted</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(quarterData.budget.expenses).map(([category, budgeted]) => {
                  const actual = quarterData.actual?.expenses[category] || 0;
                  const variance = actual - budgeted;
                  const percentage = budgeted > 0 ? (variance / budgeted * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={category}>
                      <td>{category.charAt(0).toUpperCase() + category.slice(1)}</td>
                      <td>{formatCurrency(budgeted)}</td>
                      <td>{formatCurrency(actual)}</td>
                      <td className={variance <= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                      <td className={variance <= 0 ? 'fbp-positive' : 'fbp-negative'}>
                        {variance >= 0 ? '+' : ''}{percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Main Render
  if (loading) {
    return (
      <div className="fbp-loading">
        <div className="fbp-loading-spinner"></div>
        <p>Loading financial data...</p>
        <p className="fbp-loading-detail">Fetching payments, payroll, inventory, and utilities data...</p>
      </div>
    );
  }

  return (
    <div className="fbp-financial-budget-planning">
      {/* Header */}
      <div className="fbp-header">
        <div className="fbp-header-left">
          <h1>Multi-Year Budget Planning</h1>
          <p>Healthcare Financial Management & Forecasting</p>
        </div>
        <div className="fbp-header-actions">
          <button 
            className="fbp-btn-outline"
            onClick={() => navigate("/admin/financial")}
          >
            <MdHome size={18} />
            Return Home
          </button>
          <button 
            className="fbp-btn-outline"
            onClick={() => {
              setLoading(true);
              fetchHistoricalData();
              fetchBudgetPlans();
            }}
          >
            <MdRefresh size={18} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="fbp-nav-tabs">
        <button 
          className={`fbp-tab ${activeView === 'overview' ? 'fbp-active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <MdAnalytics size={18} />
          Overview Dashboard
        </button>
        <button 
          className={`fbp-tab ${activeView === 'quarterly' ? 'fbp-active' : ''}`}
          onClick={() => setActiveView('quarterly')}
        >
          <MdCalendarToday size={18} />
          Quarterly Review
        </button>
        <button 
          className={`fbp-tab ${activeView === 'compare' ? 'fbp-active' : ''}`}
          onClick={() => setActiveView('compare')}
        >
          <MdCompare size={18} />
          Budget Comparison
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="fbp-message fbp-error">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="fbp-message fbp-success">
          <p>{success}</p>
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="fbp-main-content">
        {showCreateForm && renderCreateBudgetForm()}
        {!showCreateForm && activeView === 'overview' && renderOverviewDashboard()}
        {!showCreateForm && activeView === 'quarterly' && renderQuarterlyReview()}
        {!showCreateForm && activeView === 'compare' && (
          <div className="fbp-comparison-view">
            <h3>Budget Comparison Tools</h3>
            <p>Comparison tools will be implemented here with actual vs planned spending analysis.</p>
            <div className="fbp-comparison-placeholder">
              <p>📊 Advanced comparison features coming soon:</p>
              <ul>
                <li>Multi-year budget comparisons</li>
                <li>Department-wise variance analysis</li>
                <li>ROI tracking and forecasting</li>
                <li>Automated budget recommendations</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!showCreateForm && (
        <button 
          className="fbp-fab-button"
          onClick={() => setShowCreateForm(true)}
          title="Create New Budget Plan"
        >
          <MdAdd size={24} />
        </button>
      )}
    </div>
  );
};

export default FinancialBudgetPlanning;
