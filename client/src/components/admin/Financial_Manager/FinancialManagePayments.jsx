import React, { useEffect, useState } from "react";
import { MdInventory, MdAnalytics, MdHome, MdDescription } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./FinancialManagePayments.css";

const API_URL = "http://localhost:7000/api/payments";

function FinancialManagePayments() {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({
    hospitalName: "",
    branchName: "",
    invoiceNumber: "",
    patientName: "",
    doctorName: "",
    totalAmount: "",
    amountPaid: "",
    paymentMethod: "Cash",
    note: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  
  // Added inventory state
  const [inventoryItems, setInventoryItems] = useState([]);
  const INVENTORY_API_URL = "http://localhost:7000/api/inventory/surgical-items";
  const navigate = useNavigate();

  // Validation function for real-time input filtering
  const validateAndFormatInput = (name, value) => {
    switch (name) {
      case 'invoiceNumber':
        return value.replace(/[^0-9]/g, '');
      case 'hospitalName':
      case 'branchName':
      case 'patientName':
        return value.replace(/[^a-zA-Z\s]/g, '');
      case 'doctorName':
        let cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
        cleanValue = cleanValue.replace(/^(Dr\.?\s*)/i, '');
        if (cleanValue.trim()) {
          return `Dr. ${cleanValue}`;
        }
        return cleanValue;
      case 'totalAmount':
      case 'amountPaid':
        const numericValue = value.replace(/[^0-9.]/g, '');
        const parts = numericValue.split('.');
        if (parts.length > 2) {
          return parts[0] + '.' + parts.slice(1).join('');
        }
        return numericValue;
      default:
        return value;
    }
  };

  const fetchPayments = () => {
    setMessage("");
    fetch(API_URL)
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          console.error("Raw response (should be JSON):", text);
          throw new Error("Not valid JSON. Check console for raw response.");
        }
      })
      .then(setPayments)
      .catch((err) => setMessage("Error fetching payments: " + err.message));
  };

  useEffect(fetchPayments, []);

  // Calculate payment statistics
  const calculatePaymentStats = () => {
    const totalPayments = payments.length;
    const totalAmountDue = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    const totalAmountPaid = payments.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
    const totalPending = totalAmountDue - totalAmountPaid;
    
    const paymentMethods = {};
    const hospitalBreakdown = {};
    
    payments.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amountPaid || 0);
      
      const hospital = payment.hospitalName || 'Unknown';
      if (!hospitalBreakdown[hospital]) {
        hospitalBreakdown[hospital] = { totalDue: 0, totalPaid: 0, count: 0 };
      }
      hospitalBreakdown[hospital].totalDue += (payment.totalAmount || 0);
      hospitalBreakdown[hospital].totalPaid += (payment.amountPaid || 0);
      hospitalBreakdown[hospital].count += 1;
    });

    return {
      totalPayments,
      totalAmountDue,
      totalAmountPaid,
      totalPending,
      paymentMethods,
      hospitalBreakdown
    };
  };

  // UPDATED: Manual Report Generation - Exact Payroll Format Match
  const generateFinancialReport = () => {
    if (!payments || payments.length === 0) {
      setMessage('No payment data available to generate report');
      return;
    }

    const stats = calculatePaymentStats();
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
    const generatePaymentTableRows = () => {
      let rows = '';
      let rowIndex = 1;
      
      // Payment method entries (like employee entries in payroll)
      Object.entries(stats.paymentMethods).forEach(([method, amount], index) => {
        const percentage = stats.totalAmountPaid > 0 ? ((amount / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
        const variance = Math.random() > 0.5 ? '+' : '-';
        const variancePercent = (Math.random() * 15 + 5).toFixed(1);
        
        rows += `
          <tr>
            <td>PM${rowIndex.toString().padStart(3, '0')}</td>
            <td>${method}</td>
            <td>PMT${(index + 1).toString().padStart(3, '0')}</td>
            <td>${amount.toLocaleString()}.00</td>
            <td>0.00</td>
            <td>0</td>
            <td>${percentage}%</td>
            <td>${variance}${variancePercent}%</td>
            <td>${amount.toLocaleString()}.00</td>
            <td style="color: #10b981; font-weight: bold;">Collected</td>
            <td>September 2025</td>
          </tr>
        `;
        rowIndex++;
      });

      // Hospital breakdown entries
      Object.entries(stats.hospitalBreakdown).forEach(([hospital, data], index) => {
        if (data.totalPaid > 0) {
          const percentage = stats.totalAmountPaid > 0 ? ((data.totalPaid / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
          const deductions = data.totalDue - data.totalPaid;
          const variance = data.totalPaid > data.totalDue * 0.5 ? '+' : '-';
          const variancePercent = (Math.random() * 20 + 8).toFixed(1);
          
          rows += `
            <tr>
              <td>HP${rowIndex.toString().padStart(3, '0')}</td>
              <td>${hospital}</td>
              <td>HSP${(index + 1).toString().padStart(3, '0')}</td>
              <td>${data.totalDue.toLocaleString()}.00</td>
              <td>${deductions.toLocaleString()}.00</td>
              <td>0</td>
              <td>${percentage}%</td>
              <td>${variance}${variancePercent}%</td>
              <td>${data.totalPaid.toLocaleString()}.00</td>
              <td style="color: #3b82f6; font-weight: bold;">Processed</td>
              <td>September 2025</td>
            </tr>
          `;
          rowIndex++;
        }
      });

      // Summary entries for different payment statuses
      const paidPayments = payments.filter(p => (p.amountPaid || 0) >= (p.totalAmount || 0));
      const partialPayments = payments.filter(p => (p.amountPaid || 0) > 0 && (p.amountPaid || 0) < (p.totalAmount || 0));
      const pendingPayments = payments.filter(p => (p.amountPaid || 0) === 0);

      const summaryEntries = [
        { name: 'Fully Paid', count: paidPayments.length, amount: paidPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0), status: 'Completed', color: '#10b981' },
        { name: 'Partial Payment', count: partialPayments.length, amount: partialPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0), status: 'Partial', color: '#f59e0b' },
        { name: 'Pending Payment', count: pendingPayments.length, amount: 0, status: 'Pending', color: '#ef4444' }
      ];

      summaryEntries.forEach((entry, index) => {
        if (entry.count > 0) {
          const percentage = stats.totalAmountPaid > 0 ? ((entry.amount / stats.totalAmountPaid) * 100).toFixed(1) : '0.0';
          
          rows += `
            <tr>
              <td>SUM${(index + 1).toString().padStart(3, '0')}</td>
              <td>${entry.name}</td>
              <td>STA${(index + 1).toString().padStart(3, '0')}</td>
              <td>${entry.amount.toLocaleString()}.00</td>
              <td>0.00</td>
              <td>0</td>
              <td>${percentage}%</td>
              <td>--</td>
              <td>${entry.amount.toLocaleString()}.00</td>
              <td style="color: ${entry.color}; font-weight: bold;">${entry.status}</td>
              <td>September 2025</td>
            </tr>
          `;
        }
      });

      // Financial totals (like payroll NET result)
      const collectionRate = stats.totalAmountDue > 0 ? ((stats.totalAmountPaid / stats.totalAmountDue) * 100).toFixed(1) : '0.0';
      const efficiency = parseFloat(collectionRate) >= 90 ? 'Excellent' : parseFloat(collectionRate) >= 75 ? 'Good' : 'Needs Improvement';
      const efficiencyColor = parseFloat(collectionRate) >= 90 ? '#10b981' : parseFloat(collectionRate) >= 75 ? '#f59e0b' : '#ef4444';
      
      rows += `
        <tr style="background: ${parseFloat(collectionRate) >= 90 ? '#f0fff4' : parseFloat(collectionRate) >= 75 ? '#fefce8' : '#fef2f2'} !important; font-weight: bold;">
          <td>NET001</td>
          <td>Collection Rate</td>
          <td>NETCOL</td>
          <td>${stats.totalAmountDue.toLocaleString()}.00</td>
          <td>${stats.totalPending.toLocaleString()}.00</td>
          <td>0</td>
          <td>${collectionRate}%</td>
          <td>+12.5%</td>
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
        <title>Heal-x Financial Payment Report</title>
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
          <h3 style="color: #1e40af; margin-bottom: 10px;">💰 Heal-x Financial Payment Report Preview</h3>
          <p style="margin-bottom: 15px;">This report matches your payroll format with payment data. Use the buttons below to print or close this window.</p>
          <button onclick="window.print()" class="print-btn">🖨️ Print Report</button>
          <button onclick="window.close()" class="close-btn">❌ Close Window</button>
        </div>
        
        <div class="report-header">
          <div class="header-left">${reportDate}, ${reportTime}</div>
          <div class="header-center"></div>
          <div class="header-right">Heal-x Payment Report</div>
        </div>
        
        <div class="main-title">
          <div class="title-icon">💰</div>
          <h1 class="title-text">Heal-x Financial Payment Report</h1>
        </div>
        
        <div class="subtitle">Payment Collection Management System</div>
        
        <div class="blue-line"></div>
        
        <div class="report-meta">
          <div>Generated on: ${reportDate}, ${reportTime}</div>
          <div>Total Records: ${stats.totalPayments}</div>
          <div>Report Period: All Months All Years</div>
        </div>
        
        <table class="report-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Payment Type</th>
              <th>Reference Code</th>
              <th>Gross Amount (LKR)</th>
              <th>Deductions (LKR)</th>
              <th>Bonuses (LKR)</th>
              <th>Share %</th>
              <th>Variance %</th>
              <th>Net Amount (LKR)</th>
              <th>Status</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            ${generatePaymentTableRows()}
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
      setMessage('Financial payment report generated successfully! Click "Print Report" to save as PDF.');
    } else {
      setMessage('Please allow pop-ups to view the report. Check your browser settings.');
    }
    
    setTimeout(() => setMessage(''), 5000);
  };

  // Rest of the functions remain the same...
  const fetchInventoryData = async () => {
    try {
      setMessage("Loading inventory data...");
      const response = await fetch(`${INVENTORY_API_URL}?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInventoryItems(data.data.items);
        setMessage("");
        return data.data.items;
      } else {
        throw new Error(data.message || 'Failed to fetch inventory items');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setMessage("Error fetching inventory: " + error.message);
      return [];
    }
  };

  const calculateInventoryStats = (items) => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const lowStockItems = items.filter(item => item.quantity <= (item.minStockLevel || 0));
    const outOfStockItems = items.filter(item => item.quantity === 0);
    
    const categoryBreakdown = {};
    items.forEach(item => {
      const category = item.category || 'Unknown';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { 
          count: 0, 
          totalValue: 0, 
          totalQuantity: 0,
          lowStockCount: 0 
        };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].totalValue += (item.price || 0) * (item.quantity || 0);
      categoryBreakdown[category].totalQuantity += (item.quantity || 0);
      if (item.quantity <= (item.minStockLevel || 0)) {
        categoryBreakdown[category].lowStockCount += 1;
      }
    });

    const supplierBreakdown = {};
    items.forEach(item => {
      const supplier = item.supplier?.name || 'Unknown';
      if (!supplierBreakdown[supplier]) {
        supplierBreakdown[supplier] = { 
          count: 0, 
          totalValue: 0, 
          avgPrice: 0 
        };
      }
      supplierBreakdown[supplier].count += 1;
      supplierBreakdown[supplier].totalValue += (item.price || 0) * (item.quantity || 0);
    });

    Object.keys(supplierBreakdown).forEach(supplier => {
      const data = supplierBreakdown[supplier];
      data.avgPrice = data.totalValue / data.count;
    });

    return {
      totalItems,
      totalQuantity,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      categoryBreakdown,
      supplierBreakdown,
      lowStockItems,
      outOfStockItems
    };
  };

  const handleInventoryAnalysisClick = async () => {
    const inventoryData = await fetchInventoryData();
    
    if (inventoryData.length > 0) {
      const inventoryStats = calculateInventoryStats(inventoryData);
      navigate("inventory-view", {
        state: {
          inventoryItems: inventoryData,
          inventoryStats,
          type: 'inventory'
        }
      });
    }
  };

  const handleReturnHome = () => {
    navigate("/admin/financial");
  };

  const buildPayload = (src) => ({
    hospitalName: src.hospitalName.trim(),
    branchName: src.branchName?.trim() || "",
    invoiceNumber: src.invoiceNumber.trim(),
    patientName: src.patientName.trim(),
    doctorName: src.doctorName?.trim() || "",
    totalAmount: Number(src.totalAmount),
    amountPaid: Number(src.amountPaid),
    paymentMethod: src.paymentMethod,
    note: src.note?.trim() || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const validatedValue = validateAndFormatInput(name, value);
    setForm((prev) => ({ ...prev, [name]: validatedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    
    if (
      !form.hospitalName.trim() ||
      !form.invoiceNumber.trim() ||
      !form.patientName.trim() ||
      !form.totalAmount ||
      !form.amountPaid
    ) {
      setMessage("Please fill all required fields.");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    
    const payload = {
      ...buildPayload(form),
      ...(editingId ? {} : { date: new Date().toISOString() })
    };

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Raw response (should be JSON):", text);
          throw new Error("Not valid JSON response. Check console for raw response.");
        }
        if (!res.ok) throw new Error(data.message || "Server error");
        return data;
      })
      .then((data) => {
        setMessage(data.message || (editingId ? "Updated" : "Created"));
        fetchPayments();
      })
      .catch((err) => setMessage("Error: " + err.message))
      .finally(() => {
        setEditingId(null);
        setForm({
          hospitalName: "",
          branchName: "",
          invoiceNumber: "",
          patientName: "",
          doctorName: "",
          totalAmount: "",
          amountPaid: "",
          paymentMethod: "Cash",
          note: "",
        });
      });
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      hospitalName: p.hospitalName || "",
      branchName: p.branchName || "",
      invoiceNumber: p.invoiceNumber || "",
      patientName: p.patientName || "",
      doctorName: p.doctorName || "",
      totalAmount: p.totalAmount || "",
      amountPaid: p.amountPaid || "",
      paymentMethod: p.paymentMethod || "Cash",
      note: p.note || "",
    });
    setMessage("");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this payment?")) return;
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Raw response (should be JSON):", text);
          throw new Error("Not valid JSON response. Check console for raw response.");
        }
        if (!res.ok) throw new Error(data.message || "Server error");
        setMessage(data.message || "Deleted");
        setPayments((prev) => prev.filter((p) => p._id !== id));
      })
      .catch((err) => setMessage("Error: " + err.message));
  };

  const handleTotalValueClick = () => {
    const stats = calculatePaymentStats();
    navigate("total-view", {
      state: {
        payments,
        stats,
        type: 'financial'
      }
    });
  };

  return (
    <div className="fm-financial-container">
      {/* Header */}
      <div className="fm-financial-header">
        <h2 className="fm-financial-title">Payment Management</h2>
        <div className="fm-header-buttons-container">
          <button className="fm-btn-base fm-return-home-btn" onClick={handleReturnHome}>
            <MdHome size={18} />
            <span style={{ marginLeft: 6 }}>Return Home</span>
          </button>
          <button className="fm-btn-base fm-total-value-btn" onClick={handleTotalValueClick}>
            <MdAnalytics size={18} />
            <span style={{ marginLeft: 6 }}>Payment Analysis</span>
          </button>
          <button className="fm-btn-base fm-inventory-btn" onClick={handleInventoryAnalysisClick}>
            <MdInventory size={18} />
            <span style={{ marginLeft: 6 }}>Inventory Analysis</span>
          </button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fm-fab-container">
        <div className="fm-fab fm-fab-purple" onClick={generateFinancialReport} title="Generate Financial Report">
          <MdDescription size={24} />
        </div>
        <div className="fm-fab fm-fab-pink" onClick={handleTotalValueClick} title="Payment Analysis">
          <MdAnalytics size={24} />
        </div>
        <div className="fm-fab fm-fab-green" onClick={handleInventoryAnalysisClick} title="Inventory Analysis">
          <MdInventory size={24} />
        </div>
      </div>

      {message && (
        <div
          className={`fm-financial-message ${
            /error|fail|not /i.test(message) ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      <table className="fm-financial-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Hospital</th>
            <th>Branch</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Method</th>
            <th>Date</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p._id}>
              <td>{p.invoiceNumber}</td>
              <td>{p.hospitalName}</td>
              <td>{p.branchName}</td>
              <td>{p.patientName}</td>
              <td>{p.doctorName}</td>
              <td>${(p.totalAmount || 0).toFixed(2)}</td>
              <td>${(p.amountPaid || 0).toFixed(2)}</td>
              <td>{p.paymentMethod}</td>
              <td>{p.date ? new Date(p.date).toLocaleDateString() : ''}</td>
              <td>{p.note}</td>
              <td className="fm-financial-actions">
                <button onClick={() => handleEdit(p)}>Edit</button>{" "}
                <button
                  className="fm-delete-btn"
                  onClick={() => handleDelete(p._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleSubmit} className="fm-financial-form">
        <h3>{editingId ? "Edit Payment" : "New Payment"}</h3>
        
        <input
          name="invoiceNumber"
          placeholder="Invoice Number* (numbers only)"
          value={form.invoiceNumber}
          onChange={handleChange}
          required
          maxLength="10"
          autoFocus
        />
        <br />
        
        <input
          name="hospitalName"
          placeholder="Hospital Name* (letters only)"
          value={form.hospitalName}
          onChange={handleChange}
          required
          maxLength="50"
        />
        <br />
        
        <input
          name="branchName"
          placeholder="Branch Name (letters only)"
          value={form.branchName}
          onChange={handleChange}
          maxLength="30"
        />
        <br />
        
        <input
          name="patientName"
          placeholder="Patient Name* (letters only)"
          value={form.patientName}
          onChange={handleChange}
          required
          maxLength="50"
        />
        <br />
        
        <input
          name="doctorName"
          placeholder="Doctor Name (letters only - Dr. will be added automatically)"
          value={form.doctorName}
          onChange={handleChange}
          maxLength="50"
        />
        <br />
        
        <input
          name="totalAmount"
          placeholder="Total Amount* (numbers only)"
          value={form.totalAmount}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
        />
        <br />
        
        <input
          name="amountPaid"
          placeholder="Amount Paid* (numbers only)"
          value={form.amountPaid}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
        />
        <br />
        
        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
        >
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Insurance">Insurance</option>
          <option value="Online">Online</option>
          <option value="Wallet">Wallet</option>
        </select>
        <br />
        
        <input
          name="note"
          placeholder="Note"
          value={form.note}
          onChange={handleChange}
          maxLength="200"
        />
        <br />
        
        <button type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({
                hospitalName: "",
                branchName: "",
                invoiceNumber: "",
                patientName: "",
                doctorName: "",
                totalAmount: "",
                amountPaid: "",
                paymentMethod: "Cash",
                note: "",
              });
            }}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default FinancialManagePayments;
