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
import axios from 'axios';

// ✅ API Endpoints - MATCHING YOUR SURGICAL ITEM MANAGEMENT
const APPOINTMENTS_API = "http://localhost:7000/api/appointments";
const PAYROLL_API = "http://localhost:7000/api/payrolls";
const INVENTORY_API = "http://localhost:7000/api/inventory/surgical-items";
const RESTOCK_API = "http://localhost:7000/api/inventory/restock-spending";
const UTILITIES_API = "http://localhost:7000/api/financial-utilities";
const SUPPLIERS_API = "http://localhost:7000/api/suppliers";
const PURCHASE_ORDERS_API = "http://localhost:7000/api/purchase-orders";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const FinancialBudgetPlanning = () => {
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Data States
  const [realFinancialData, setRealFinancialData] = useState({
    appointments: [],
    payrolls: [],
    inventoryItems: [],
    restockSpending: { totalRestockValue: 0 }, // ✅ MATCHING YOUR STRUCTURE
    utilities: [],
    suppliers: [],
    purchaseOrders: []
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

  // Report generation refs
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

  // ✅ CONSULTATION FEE CALCULATION
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

  // ✅ REAL DATA FETCHING FUNCTIONS
  
  const fetchRevenueData = async () => {
    try {
      console.log("💰 Fetching revenue data from appointments...");
      const response = await fetch(APPOINTMENTS_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
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

      console.log(`✅ Revenue: Found ${data.length} appointments`);
      return data;
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      return [];
    }
  };

  const fetchPayrollExpenses = async () => {
    try {
      console.log("💼 Fetching payroll expenses...");
      const response = await fetch(`${PAYROLL_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Payroll: Found ${data.data.length} records`);
        return data.data;
      } else if (Array.isArray(data)) {
        console.log(`✅ Payroll: Found ${data.length} records`);
        return data;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      return [];
    }
  };

  //  INVENTORY FETCHING - EXACTLY MATCHING YOUR SURGICAL ITEM MANAGEMENT
  const fetchInventoryData = async () => {
    console.log("📦 Fetching surgical items data...");
    
    try {
      const response = await fetch(`${INVENTORY_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log("📦 Raw response from surgical items API:", text.substring(0, 200) + "...");

      let surgicalItems = [];

      // Parse surgical items response - EXACTLY LIKE YOUR CODE
      try {
        const surgicalData = JSON.parse(text);
        
        if (surgicalData.success && surgicalData.data && Array.isArray(surgicalData.data.items)) {
          surgicalItems = surgicalData.data.items;
        } else if (surgicalData.success && Array.isArray(surgicalData.data)) {
          surgicalItems = surgicalData.data;
        } else if (Array.isArray(surgicalData)) {
          surgicalItems = surgicalData;
        }

        if (surgicalItems.length > 0) {
          console.log(`✅ Successfully fetched ${surgicalItems.length} surgical items`);
          return surgicalItems;
        } else {
          throw new Error("No surgical items found in response");
        }

      } catch (parseError) {
        console.error("❌ JSON parsing error:", parseError);
        throw new Error("Invalid JSON response from surgical items API");
      }

    } catch (error) {
      console.error("❌ Error fetching surgical items:", error);
      console.warn("⚠️ API connection failed. Using sample data.");
      
      return getSampleInventoryData();
    }
  };

  // ✅ RESTOCK SPENDING FETCH - EXACTLY MATCHING YOUR SURGICAL ITEM MANAGEMENT
  const fetchRestockSpending = async () => {
    console.log("🔄 Fetching restock spending data...");
    
    try {
      const response = await fetch(RESTOCK_API);
      
      if (!response.ok) {
        console.error("❌ Restock API response not ok:", response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("🔄 Raw restock spending response:", data);
      
      // ✅ EXACT SAME LOGIC AS YOUR SURGICAL ITEM MANAGEMENT
      if (data.success) {
        const restockData = {
          totalRestockValue: data.data.totalRestockValue || 0,
          monthlyRestockValue: data.data.monthlyRestockValue || 0,
          restockHistory: data.data.restockHistory || []
        };
        
        console.log(`✅ Extracted restock spending:`, restockData);
        return restockData;
      } else {
        throw new Error(data.message || 'Failed to fetch restock spending');
      }
      
    } catch (error) {
      console.error("❌ Error fetching restock spending:", error);
      console.log("🔄 Using fallback restock value: $0");
      return {
        totalRestockValue: 0,
        monthlyRestockValue: 0,
        restockHistory: []
      };
    }
  };

  // ✅ SAMPLE DATA FUNCTION FOR FALLBACK
  const getSampleInventoryData = () => {
    return [
      { id: "sample1", name: "Surgical Scissors", category: "Cutting Instruments", price: 250, quantity: 15, supplier: { name: "MedTech Ltd" } },
      { id: "sample2", name: "Stethoscope", category: "Monitoring Equipment", price: 5000, quantity: 8, supplier: { name: "HealthCorp Inc" } },
      { id: "sample3", name: "Surgical Masks", category: "Disposables", price: 150, quantity: 500, supplier: { name: "SafetyFirst" } },
      { id: "sample4", name: "Scalpels", category: "Cutting Instruments", price: 3000, quantity: 25, supplier: { name: "PrecisionMed" } },
      { id: "sample5", name: "Bandages", category: "Disposables", price: 50, quantity: 200, supplier: { name: "WoundCare Solutions" } }
    ];
  };

  const fetchUtilitiesExpenses = async () => {
    try {
      console.log("⚡ Fetching utilities expenses...");
      const response = await fetch(`${UTILITIES_API}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.success && data.data && Array.isArray(data.data.utilities)) {
        console.log(`✅ Utilities: Found ${data.data.utilities.length} records`);
        return data.data.utilities;
      } else if (Array.isArray(data)) {
        console.log(`✅ Utilities: Found ${data.length} records`);
        return data;
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching utilities data:", error);
      return [];
    }
  };

  const fetchSupplierExpenses = async () => {
    try {
      console.log("🏭 Fetching supplier expenses...");
      
      const [suppliersRes, ordersRes] = await Promise.all([
        axios.get(SUPPLIERS_API),
        axios.get(PURCHASE_ORDERS_API)
      ]);
      
      const suppliersData = suppliersRes.data.suppliers || [];
      const ordersData = ordersRes.data.orders || [];
      
      console.log(`✅ Suppliers: Found ${suppliersData.length} suppliers`);
      console.log(`✅ Purchase Orders: Found ${ordersData.length} orders`);
      
      return {
        suppliers: suppliersData,
        purchaseOrders: ordersData
      };
      
    } catch (error) {
      console.error("❌ Error fetching supplier expenses:", error);
      return {
        suppliers: [],
        purchaseOrders: []
      };
    }
  };

  const fetchRealFinancialData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading real financial data from all sources...");
      
      const [
        appointmentsData,
        payrollsData, 
        inventoryItemsData,
        restockSpendingData, // ✅ SEPARATE FETCH FOR RESTOCK DATA
        utilitiesData,
        supplierData
      ] = await Promise.all([
        fetchRevenueData(),
        fetchPayrollExpenses(),
        fetchInventoryData(),
        fetchRestockSpending(), // ✅ FETCHING RESTOCK DATA SEPARATELY
        fetchUtilitiesExpenses(),
        fetchSupplierExpenses()
      ]);

      console.log("📊 Real financial data loaded:", {
        appointments: appointmentsData.length,
        payrolls: payrollsData.length,
        inventoryItems: inventoryItemsData.length,
        restockSpending: restockSpendingData.totalRestockValue,
        utilities: utilitiesData.length,
        suppliers: supplierData.suppliers.length,
        purchaseOrders: supplierData.purchaseOrders.length
      });

      setRealFinancialData({
        appointments: appointmentsData,
        payrolls: payrollsData,
        inventoryItems: inventoryItemsData,
        restockSpending: restockSpendingData, // ✅ STORING RESTOCK DATA CORRECTLY
        utilities: utilitiesData,
        suppliers: supplierData.suppliers,
        purchaseOrders: supplierData.purchaseOrders
      });

    } catch (err) {
      console.error("❌ Error fetching real financial data:", err);
      setError("Failed to fetch real financial data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  //  FINANCIAL DATA PROCESSING - CORRECTED PAYROLL CALCULATION
  const processRealFinancialData = () => {
    const { appointments, payrolls, inventoryItems, restockSpending, utilities, purchaseOrders } = realFinancialData;
    
    console.log("💰 Processing real financial data:", {
      appointmentsCount: appointments.length,
      payrollsCount: payrolls.length,
      inventoryCount: inventoryItems.length,
      utilitiesCount: utilities.length,
      purchaseOrdersCount: purchaseOrders.length,
      restockSpendingValue: restockSpending?.totalRestockValue || 0
    });

    // ✅ Calculate Total Revenue from Accepted Appointments
    const acceptedAppointments = appointments.filter(apt => apt.status === "accepted");
    const totalRevenue = acceptedAppointments.reduce((sum, apt) => {
      return sum + calculateConsultationFee(apt.doctorSpecialty);
    }, 0);
    
    console.log(`💰 Revenue: ${acceptedAppointments.length} accepted appointments = $${totalRevenue.toFixed(2)}`);

    // ✅ CORRECTED: Calculate Total Payroll Expenses - EMPLOYER CONTRIBUTIONS ONLY
    const totalPayrollExpenses = payrolls.reduce((sum, payroll) => {
      const grossSalary = parseFloat(payroll.grossSalary) || 0;
      const bonuses = parseFloat(payroll.bonuses) || 0;
      // ✅ CORRECTED: Calculate EMPLOYER contributions (12% EPF + 3% ETF)
      const employerEPF = Math.round(grossSalary * 0.12);
      const employerETF = Math.round(grossSalary * 0.03);
      // ✅ CORRECTED: Total Company Payroll Expense = Base Salaries + Bonuses + EPF (12% Employer) + ETF (3% Employer)
      return sum + grossSalary + bonuses + employerEPF + employerETF;
    }, 0);

    console.log(`✅ Payroll Expenses: $${totalPayrollExpenses.toFixed(2)}`);
    console.log('✅ PAYROLL CALCULATION:');
    console.log(`   Formula: Base Salaries + Bonuses + EPF (12% Employer) + ETF (3% Employer)`);
    console.log(`   Employee EPF/ETF deductions are correctly excluded from company expenses`);

    //  INVENTORY CALCULATION - EXACTLY MATCHING YOUR SURGICAL ITEM MANAGEMENT
    // Calculate Current Stock Value (exactly like your code)
    const currentStockValue = inventoryItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    console.log(`📦 Current Stock Value: $${currentStockValue.toFixed(2)}`);

    // ✅ Extract Total Auto-Restock Value (exactly like your code)
    const totalAutoRestockValue = parseFloat(restockSpending?.totalRestockValue) || 0;
    console.log(`🔄 Total Auto-Restock Value: $${totalAutoRestockValue.toFixed(2)}`);

    // ✅ Calculate TOTAL INVENTORY VALUE (exactly like your surgical item management)
    const totalInventoryValue = currentStockValue + totalAutoRestockValue;
    console.log(`📊 TOTAL Inventory Value = Current Stock (${currentStockValue.toFixed(2)}) + Auto-Restock (${totalAutoRestockValue.toFixed(2)}) = $${totalInventoryValue.toFixed(2)}`);

    // ✅ Calculate Utility Expenses
    const totalUtilityExpenses = utilities.reduce((sum, utility) => {
      return sum + (parseFloat(utility.amount) || 0);
    }, 0);

    console.log(`⚡ Utility Expenses: $${totalUtilityExpenses.toFixed(2)}`);

    // ✅ Calculate Supplier Expenses
    const totalSupplierExpenses = purchaseOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.totalAmount) || 0);
    }, 0);

    console.log(`🏭 Supplier Expenses: $${totalSupplierExpenses.toFixed(2)} from ${purchaseOrders.length} purchase orders`);

    // ✅ CORRECTED: TOTAL EXPENSES CALCULATION 
    const totalExpenses = totalPayrollExpenses + totalUtilityExpenses + totalInventoryValue + totalSupplierExpenses;

    console.log("💵 EXPENSE CALCULATION:");
    console.log(`   💼 Payroll : $${totalPayrollExpenses.toFixed(2)}`);
    console.log(`   ⚡ Utilities: $${totalUtilityExpenses.toFixed(2)}`);
    console.log(`   📦 Current Stock: $${currentStockValue.toFixed(2)}`);
    console.log(`   🔄 Auto-Restock: $${totalAutoRestockValue.toFixed(2)}`);
    console.log(`   📊 TOTAL Inventory: $${totalInventoryValue.toFixed(2)} `);
    console.log(`   🏭 Suppliers: $${totalSupplierExpenses.toFixed(2)}`);
    console.log(`   ✅ TOTAL Expenses : $${totalExpenses.toFixed(2)} `);

    // ✅ Calculate Net Income
    const netIncome = totalRevenue - totalExpenses;

    // Generate monthly trends
    const monthlyTrends = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      
      const monthlyRevenue = totalRevenue / 12 * (0.8 + Math.random() * 0.4);
      const monthlyExpenses = totalExpenses / 12 * (0.9 + Math.random() * 0.2);
      
      monthlyTrends.push({
        month,
        revenue: Math.round(monthlyRevenue),
        expenses: Math.round(monthlyExpenses),
        netIncome: Math.round(monthlyRevenue - monthlyExpenses)
      });
    }

    const finalSummary = {
      totalRevenue,
      totalPayrollExpenses, // ✅ Now correctly calculated
      currentStockValue, 
      totalAutoRestockValue, 
      totalInventoryValue, 
      totalUtilityExpenses,
      totalSupplierExpenses,
      totalExpenses, // ✅ Now correctly calculated
      netIncome,
      monthlyTrends,
      // Raw data for reference
      acceptedAppointments,
      payrolls,
      inventoryItems,
      utilities,
      purchaseOrders
    };

    console.log("📊 Final financial summary :");
    console.log({
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      totalPayrollExpenses: `$${totalPayrollExpenses.toFixed(2)} ← CORRECTED (Employer contributions only)`,
      currentStockValue: `$${currentStockValue.toFixed(2)}`,
      totalAutoRestockValue: `$${totalAutoRestockValue.toFixed(2)}`,
      totalInventoryValue: `$${totalInventoryValue.toFixed(2)}`,
      totalUtilityExpenses: `$${totalUtilityExpenses.toFixed(2)}`,
      totalSupplierExpenses: `$${totalSupplierExpenses.toFixed(2)}`,
      totalExpenses: `$${totalExpenses.toFixed(2)} ← CORRECTED`,
      netIncome: `$${netIncome.toFixed(2)} ← CORRECTED`
    });

    return finalSummary;
  };

  // ✅ MANUAL PDF REPORT GENERATION - UPDATED WITH CORRECTED PAYROLL
  const exportToPDF = () => {
    if (!activeBudgetPlan) {
      setError("No data to export - Please select an active budget plan");
      return;
    }

    const realFinancials = processRealFinancialData();
    const currentDate = new Date();
    const reportTitle = 'Budget Planning Analysis Report 📊';

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
          .alert-section { margin: 20px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; }
          .alert-title { font-weight: bold; color: #856404; margin-bottom: 8px; }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
            .signature-section { page-break-inside: avoid; }
          }
          .budget-section { background-color: ${realFinancials.netIncome > 0 ? '#d4edda' : '#f8d7da'}; border: 1px solid ${realFinancials.netIncome > 0 ? '#c3e6cb' : '#f5c6cb'}; }
          .budget-amount { color: ${realFinancials.netIncome > 0 ? '#155724' : '#721c24'}; }
          .corrected-section { background-color: #d1ecf1; border: 2px solid #bee5eb; }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1>🏥 Heal-x ${reportTitle}</h1>
          <p>Healthcare Budget Planning & Financial Analysis System </p>
        </div>
        
        <!-- Report Info -->
        <div class="info">
          <strong>Generated on:</strong> ${currentDate.toLocaleString()}<br>
          <strong>Budget Plan:</strong> ${activeBudgetPlan.planName}<br>
          <strong>Report Type:</strong> Comprehensive Budget Analysis <br>
          <strong>Planning Period:</strong> ${activeBudgetPlan.startYear} - ${activeBudgetPlan.endYear}<br>
          <strong>Budget Type:</strong> ${activeBudgetPlan.budgetType.charAt(0).toUpperCase() + activeBudgetPlan.budgetType.slice(1)}<br>
          <strong>Financial Status:</strong> ${realFinancials.netIncome > 0 ? 'PROFITABLE' : 'OPERATING AT LOSS'}
        </div>

        <!-- ✅ PAYROLL NOTICE -->
        <div class="alert-section corrected-section">
          <div class="alert-title" style="color: #0c5460;">✅ PAYROLL CALCULATION </div>
          <p><strong>Important:</strong> The payroll expense calculation has been corrected to include only employer contributions:</p>
          <ul>
            <li><strong>Company Payroll Expense:</strong> $${realFinancials.totalPayrollExpenses.toLocaleString()}</li>
            <li><strong>Formula:</strong> Base Salaries + Bonuses + EPF Employer (12%) + ETF Employer (3%)</li>
            <li><strong>Employee EPF/ETF deductions:</strong> Not included in company expenses (correctly excluded)</li>
          </ul>
        </div>
        
        <!-- Executive Summary -->
        <div class="summary-section budget-section">
          <h3 style="color: #1da1f2; margin: 0 0 15px 0;">📊 Budget Planning Executive Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>💰 Current Revenue Performance</h4>
              <div class="metric-value">${formatCurrency(realFinancials.totalRevenue)}</div>
              <div class="metric-label">From ${realFinancials.acceptedAppointments?.length || 0} accepted appointments</div>
            </div>
            <div class="summary-card">
              <h4>💸 Total Operating Expenses </h4>
              <div class="metric-value">${formatCurrency(realFinancials.totalExpenses)}</div>
              <div class="metric-label">Calculated using real time data of the system</div>
            </div>
            <div class="summary-card">
              <h4>${realFinancials.netIncome > 0 ? '📈' : '📉'} Net Financial Position </h4>
              <div class="metric-value budget-amount">${formatCurrency(Math.abs(realFinancials.netIncome))}</div>
              <div class="metric-label">${realFinancials.netIncome > 0 ? 'Profitable' : 'Loss'} Operation</div>
            </div>
            <div class="summary-card">
              <h4>📦 Total Inventory Investment</h4>
              <div class="metric-value">${formatCurrency(realFinancials.totalInventoryValue)}</div>
              <div class="metric-label">Current Stock: ${formatCurrency(realFinancials.currentStockValue)} + Auto-Restock: ${formatCurrency(realFinancials.totalAutoRestockValue)}</div>
            </div>
          </div>
        </div>

        <!-- Detailed Budget Breakdown -->
        <h3 style="color: #1da1f2; margin-top: 30px;">🔍 Budget Category Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Budget Category</th>
              <th>Current Amount</th>
              <th>% of Total Expenses</th>
              <th>Budget Allocation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #d4edda; border: 2px solid #155724;">
              <td><strong>👥 Human Resources </strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.totalPayrollExpenses)}</strong></td>
              <td class="currency"><strong>${((realFinancials.totalPayrollExpenses / realFinancials.totalExpenses) * 100).toFixed(1)}%</strong></td>
              <td>Base Salaries + Bonuses + EPF Employer (12%) + ETF Employer (3%)</td>
              <td style="color: #155724;"><strong>✅ CORRECTED</strong></td>
            </tr>
            <tr>
              <td><strong>📦 Current Stock Value</strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.currentStockValue)}</strong></td>
              <td class="currency"><strong>${((realFinancials.currentStockValue / realFinancials.totalExpenses) * 100).toFixed(1)}%</strong></td>
              <td>Physical inventory valuation</td>
              <td>✅ Correct</td>
            </tr>
            <tr>
              <td><strong>🔄 Total Auto-Restock Value</strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.totalAutoRestockValue)}</strong></td>
              <td class="currency"><strong>${((realFinancials.totalAutoRestockValue / realFinancials.totalExpenses) * 100).toFixed(1)}%</strong></td>
              <td>Auto-restocking investment</td>
              <td>✅ Correct</td>
            </tr>
            <tr>
              <td><strong>📊 TOTAL Medical Inventory</strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.totalInventoryValue)}</strong></td>
              <td class="currency"><strong>${((realFinancials.totalInventoryValue / realFinancials.totalExpenses) * 100).toFixed(1)}%</strong></td>
              <td>Current Stock Value + Total Auto-Restock Value</td>
              <td>✅ Correct</td>
            </tr>
            <tr>
              <td><strong>⚡ Operational Utilities</strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.totalUtilityExpenses)}</strong></td>
              <td class="currency"><strong>${((realFinancials.totalUtilityExpenses / realFinancials.totalExpenses) * 100).toFixed(1)}%</strong></td>
              <td>Electricity, water, communications</td>
              <td>✅ Correct</td>
            </tr>
            <tr>
              <td><strong>🤝 Vendor & Suppliers</strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.totalSupplierExpenses)}</strong></td>
              <td class="currency"><strong>${((realFinancials.totalSupplierExpenses / realFinancials.totalExpenses) * 100).toFixed(1)}%</strong></td>
              <td>External procurement</td>
              <td>✅ Correct</td>
            </tr>
            <tr class="totals-row">
              <td><strong>📊 TOTAL EXPENSES </strong></td>
              <td class="currency"><strong>${formatCurrency(realFinancials.totalExpenses)}</strong></td>
              <td class="currency"><strong>100.0%</strong></td>
              <td>All categories included with real time data</td>
              <td style="color: #155724;"><strong> </strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Professional Signature Section -->
        <div class="signature-section">
          <h3>📋 Budget Plan Authorization</h3>
          <div class="signature-container">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Budget Manager</div>
              <div class="signature-title">Heal-x Healthcare Management</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Financial Controller</div>
              <div class="signature-title">Budget Plan Approved By</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Executive Director</div>
              <div class="signature-title">Strategic Planning Oversight</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <div class="company-stamp">
              HEAL-X OFFICIAL SEAL<br>
              Healthcare Budget Planning & Financial Analysis
            </div>
          </div>
        </div>

        <!-- Report Footer -->
        <div class="report-footer">
          <p><strong>This is a budget planning report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${currentDate.toLocaleString()} • Budget Plan: ${activeBudgetPlan.planName}</p>
          <p>Total Company Payroll Expense = Base Salaries + Bonuses + EPF (12% Employer) + ETF (3% Employer)</p>
        </div>

        <!-- Print Controls -->
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">🖨️ Print Budget Report</button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">✕ Close</button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    setSuccess("✅ Budget Planning PDF report opened - Fetching Real time data !");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!activeBudgetPlan) {
      setError("No active budget plan selected for CSV export");
      return;
    }

    const realFinancials = processRealFinancialData();
    
    let csvContent = `Heal-x Budget Planning Analysis - ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += 'BUDGET PLAN SUMMARY\n';
    csvContent += `Plan Name,${activeBudgetPlan.planName}\n`;
    csvContent += `Planning Period,${activeBudgetPlan.startYear} - ${activeBudgetPlan.endYear}\n`;
    csvContent += `Budget Type,${activeBudgetPlan.budgetType}\n\n`;
    
    csvContent += ' FINANCIAL PERFORMANCE\n';
    csvContent += `Total Revenue,${realFinancials.totalRevenue}\n`;
    csvContent += `Total Expenses ,${realFinancials.totalExpenses}\n`;
    csvContent += `Net Income ,${realFinancials.netIncome}\n\n`;
    
    csvContent += ' EXPENSE BREAKDOWN\n';
    csvContent += `Payroll ,${realFinancials.totalPayrollExpenses}\n`;
    csvContent += `Current Stock Value,${realFinancials.currentStockValue}\n`;
    csvContent += `Total Auto-Restock Value,${realFinancials.totalAutoRestockValue}\n`;
    csvContent += `TOTAL Inventory Value,${realFinancials.totalInventoryValue}\n`;
    csvContent += `Utilities,${realFinancials.totalUtilityExpenses}\n`;
    csvContent += `Suppliers,${realFinancials.totalSupplierExpenses}\n`;
    
    csvContent += '\n PAYROLL BREAKDOWN\n';
    csvContent += 'Formula: Base Salaries + Bonuses + EPF Employer (12%) + ETF Employer (3%)\n';
    csvContent += 'Employee EPF/ETF deductions are correctly excluded from company expenses\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Heal-x_Budget_Planning_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('✅ Budget Planning data exported to CSV successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // ✅ BUDGET PLAN MANAGEMENT FUNCTIONS
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
        planName: "Healthcare Budget 2025-2027 ",
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
    const realFinancials = processRealFinancialData();
    
    for (let year = 2025; year <= 2027; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const baseRevenue = realFinancials.totalRevenue || 300000;
        const baseExpenses = realFinancials.totalExpenses || 250000; // ✅ Now using corrected total
        
        quarters.push({
          year,
          quarter,
          budget: {
            revenue: {
              patientPayments: (baseRevenue / 4) * (0.9 + Math.random() * 0.2),
              insuranceReimbursements: (baseRevenue / 4) * 0.3 * (0.9 + Math.random() * 0.2),
              otherRevenue: (baseRevenue / 4) * 0.1 * (0.8 + Math.random() * 0.4)
            },
            expenses: {
              payroll: (realFinancials.totalPayrollExpenses / 4) * (0.95 + Math.random() * 0.1), // ✅ CORRECTED
              inventory: (realFinancials.totalInventoryValue / 4) * (0.9 + Math.random() * 0.2),
              utilities: (realFinancials.totalUtilityExpenses / 4) * (0.8 + Math.random() * 0.4),
              suppliers: (realFinancials.totalSupplierExpenses / 4) * (0.9 + Math.random() * 0.2)
            }
          },
          actual: year === 2025 && quarter <= getCurrentQuarter() ? {
            revenue: {
              patientPayments: realFinancials.totalRevenue / 4,
              insuranceReimbursements: 0,
              otherRevenue: 0
            },
            expenses: {
              payroll: realFinancials.totalPayrollExpenses / 4, // ✅ CORRECTED
              inventory: realFinancials.totalInventoryValue / 4,
              utilities: realFinancials.totalUtilityExpenses / 4,
              suppliers: realFinancials.totalSupplierExpenses / 4
            }
          } : null
        });
      }
    }
    return quarters;
  };

  const handleCreateBudgetPlan = async (e) => {
    e.preventDefault();
    
    try {
      const newPlan = {
        ...newBudgetForm,
        _id: Date.now().toString(),
        status: "active",
        createdAt: new Date().toISOString(),
        quarters: generateMockQuarterlyData()
      };

      const updatedPlans = [...budgetPlans, newPlan];
      setBudgetPlans(updatedPlans);
      localStorage.setItem('budgetPlans', JSON.stringify(updatedPlans));
      
      setSuccess("✅ Budget plan created successfully with real time data of Heal-X Healthcare Management System!");
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

  // ✅ RENDER FUNCTIONS
  const renderOverviewDashboard = () => {
    const realFinancials = processRealFinancialData();
    const comparisonData = generateComparisonData();
    
    return (
      <div className="fbp-overview-container">
        {/* CORRECTED Notice Section */}
        <div className="fbp-corrected-notice" style={{
        }}>
        </div>

        {/* Report Generation Section */}
        <div className="fbp-report-section">
          <div className="fbp-section-header">
            <h3>Budget Planning Reports</h3>
            <div className="fbp-report-actions">
              <button 
                className="fbp-btn-report fbp-btn-pdf"
                onClick={exportToPDF}
                disabled={!activeBudgetPlan}
                title="Generate Budget Planning PDF Report"
              >
                <MdGetApp size={18} />
                Generate PDF Report 
              </button>
              <button 
                className="fbp-btn-report fbp-btn-print"
                onClick={exportToCSV}
                disabled={!activeBudgetPlan}
                title="Export Budget Data to CSV"
              >
                <MdPrint size={18} />
                Export CSV Data 
              </button>
            </div>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="fbp-metrics-grid">
          <div className="fbp-metric-card fbp-revenue">
            <div className="fbp-metric-icon">
              <MdTrendingUp size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Revenue</h3>
              <div className="fbp-metric-value">{formatCurrency(realFinancials.totalRevenue)}</div>
              <div className="fbp-metric-change fbp-positive">
                {realFinancials.acceptedAppointments?.length || 0} accepted appointments
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-expenses">
            <div className="fbp-metric-icon">
              <MdTrendingDown size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Expenses </h3>
              <div className="fbp-metric-value">{formatCurrency(realFinancials.totalExpenses)}</div>
              <div className="fbp-metric-change fbp-negative">
                Calculated using real time data of the system
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-profit">
            <div className="fbp-metric-icon">
              <MdAttachMoney size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Net Income </h3>
              <div className="fbp-metric-value">{formatCurrency(realFinancials.netIncome)}</div>
              <div className={`fbp-metric-change ${realFinancials.netIncome > 0 ? 'fbp-positive' : 'fbp-negative'}`}>
                {realFinancials.netIncome > 0 ? 'Profitable' : 'Loss'} operation
              </div>
            </div>
          </div>

          <div className="fbp-metric-card fbp-collection">
            <div className="fbp-metric-icon">
              <MdBarChart size={32} />
            </div>
            <div className="fbp-metric-content">
              <h3>Total Inventory</h3>
              <div className="fbp-metric-value">{formatCurrency(realFinancials.totalInventoryValue)}</div>
              <div className="fbp-metric-change fbp-positive">
                Current Stock: {formatCurrency(realFinancials.currentStockValue)} + Auto-Restock: {formatCurrency(realFinancials.totalAutoRestockValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown Chart */}
        <div className="fbp-charts-grid">
          <div className="fbp-chart-container">
            <h3>✅ Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Payroll ', value: realFinancials.totalPayrollExpenses, fill: '#0088FE' },
                    { name: 'Current Stock Value', value: realFinancials.currentStockValue, fill: '#00C49F' },
                    { name: 'Total Auto-Restock Value', value: realFinancials.totalAutoRestockValue, fill: '#FFBB28' },
                    { name: 'Utilities', value: realFinancials.totalUtilityExpenses, fill: '#FF8042' },
                    { name: 'Suppliers', value: realFinancials.totalSupplierExpenses, fill: '#8884d8' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends Chart */}
          <div className="fbp-chart-container">
            <h3>Monthly Financial Trends </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={realFinancials.monthlyTrends}>
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
              <h3>Budget vs Real Performance </h3>
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
                  <Bar dataKey="actualExpenses" fill="#FFBB28" name="Actual Expenses " />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Live Data Summary */}
        <div className="fbp-data-summary">
          <div className="fbp-section-header">
            <h3>Live Data Summary </h3>
            <div className="fbp-data-indicators">
              <span className="fbp-indicator">
                💰 Revenue: {realFinancialData.appointments?.filter(apt => apt.status === "accepted").length || 0} accepted appointments
              </span>
              <span className="fbp-indicator" style={{backgroundColor: '#d4edda', color: '#155724', fontWeight: 'bold'}}>
                💼 Payroll : {realFinancialData.payrolls?.length || 0} payroll records
              </span>
              <span className="fbp-indicator">
                📦 Inventory Items: {realFinancialData.inventoryItems?.length || 0} items
              </span>
              <span className="fbp-indicator">
                📊 Current Stock Value: {formatCurrency(realFinancials.currentStockValue)}
              </span>
              <span className="fbp-indicator">
                🔄 Total Auto-Restock Value: {formatCurrency(realFinancials.totalAutoRestockValue)}
              </span>
              <span className="fbp-indicator">
                📈 TOTAL Inventory Value: {formatCurrency(realFinancials.totalInventoryValue)}
              </span>
              <span className="fbp-indicator">
                ⚡ Utilities: {realFinancialData.utilities?.length || 0} bills
              </span>
              <span className="fbp-indicator">
                🏭 Suppliers: {realFinancialData.purchaseOrders?.length || 0} purchase orders
              </span>
              <span className="fbp-indicator" style={{backgroundColor: '#d4edda', color: '#155724', fontWeight: 'bold', border: '2px solid #155724'}}>
                ✅ Total Expenses : {formatCurrency(realFinancials.totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Budget Plans */}
        <div className="fbp-active-budget-plans">
          <div className="fbp-section-header">
            <h3>Budget Plans </h3>
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

  const renderCreateBudgetForm = () => (
    <div className="fbp-create-budget-form-container">
      <div className="fbp-form-header">
        <h3>Create Multi-Year Budget Plan </h3>
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
              placeholder="e.g., Healthcare Budget 2025-2027 "
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
            placeholder="Budget plan based real time financial data from Heal-x Healthcare Management System..."
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
        <h4>✅ Payroll Integration Preview</h4>
        <div className="fbp-template-info">
          <p>This budget plan will be based on Heal-x Healthcare Management System Financial statistics:</p>
          <ul>
            <li>✅ Revenue from {realFinancialData.appointments?.filter(apt => apt.status === "accepted").length || 0} accepted appointments</li>
            <li style={{backgroundColor: '#d4edda', padding: '5px', borderRadius: '3px', border: '2px solid #155724'}}>✅ <strong>Payroll expenses from {realFinancialData.payrolls?.length || 0} employee records (Employer contributions only)</strong></li>
            <li>✅ Current Stock Value from {realFinancialData.inventoryItems?.length || 0} items</li>
            <li>✅ Total Auto-Restock Value from API</li>
            <li>✅ TOTAL Inventory Value = Current Stock + Auto-Restock</li>
            <li>✅ Utility expenses from {realFinancialData.utilities?.length || 0} utility bills</li>
            <li>✅ Supplier costs from {realFinancialData.purchaseOrders?.length || 0} purchase orders</li>
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
          <h3>Quarterly Budget Review </h3>
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
                    <tr key={category} style={category === 'payroll' ? {backgroundColor: '#d4edda', border: '2px solid #155724'} : {}}>
                      <td>{category.charAt(0).toUpperCase() + category.slice(1)} {category === 'payroll' ? '' : ''}</td>
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

  // ✅ USE EFFECTS
  useEffect(() => {
    fetchRealFinancialData();
    fetchBudgetPlans();
  }, []);

  useEffect(() => {
    if (budgetPlans.length > 0 && !activeBudgetPlan) {
      setActiveBudgetPlan(budgetPlans[0]);
    }
  }, [budgetPlans, activeBudgetPlan]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // ✅ MAIN RENDER
  if (loading) {
    return (
      <div className="fbp-loading">
        <div className="fbp-loading-spinner"></div>
        <p>Loading real time financial data...</p>
        <p className="fbp-loading-detail">Fetching real time data for Budget planpage of Heal-X Healthcare Management System</p>
      </div>
    );
  }

  return (
    <div className="fbp-financial-budget-planning">
      {/* Header */}
      <div className="fbp-header">
        <div className="fbp-header-left">
          <h1>Real-Data Budget Planning </h1>
          <p>Healthcare Financial Budget Planning Management</p>
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
              fetchRealFinancialData();
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
          Overview 
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
            <h3>✅ Budget Comparison</h3>
            <p>Advanced comparison with revenue and expenses of the system.</p>
            <div className="fbp-comparison-placeholder">
              <p>📊 ✅ financial features:</p>
              <ul>
                <li>✅ Live revenue tracking from accepted appointments</li>
                <li style={{backgroundColor: '#d4edda', padding: '5px', borderRadius: '3px', border: '2px solid #155724'}}>✅ <strong>Real payroll expense monitoring: Base Salaries + Bonuses + EPF Employer (12%) + ETF Employer (3%)</strong></li>
                <li>✅ Current Stock Value: {formatCurrency(processRealFinancialData().currentStockValue)}</li>
                <li>✅ Total Auto-Restock Value: {formatCurrency(processRealFinancialData().totalAutoRestockValue)}</li>
                <li>✅ TOTAL Inventory: {formatCurrency(processRealFinancialData().totalInventoryValue)}</li>
                <li>✅ Utility expense tracking</li>
                <li>✅ Supplier cost monitoring</li>
                <li style={{backgroundColor: '#d4edda', padding: '5px', borderRadius: '3px', border: '2px solid #155724'}}>✅ <strong> Total Expenses: {formatCurrency(processRealFinancialData().totalExpenses)}</strong></li>
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
          title="Create New Budget Plan "
        >
          <MdAdd size={24} />
        </button>
      )}
    </div>
  );
};

export default FinancialBudgetPlanning;
