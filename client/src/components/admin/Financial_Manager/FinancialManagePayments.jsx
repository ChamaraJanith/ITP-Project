import React, { useEffect, useState } from "react";
import { MdInventory, MdAnalytics, MdHome, MdDescription } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import "../Financial_Manager/financialManagePayments.css";

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

  // UPDATED: Generate Financial Report PDF with simplified format and payment method breakdown
  const generateFinancialReport = () => {
    try {
      const stats = calculatePaymentStats();
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Heal-x', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text('Statement of Financial Position', 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`as at ${currentDate}`, 105, 38, { align: 'center' });

      // Table setup - Updated to 3 columns (removed Comparative Year)
      const startX = 20;
      const startY = 55;
      const rowHeight = 6;
      let currentY = startY;

      // Table headers
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      // Header row background
      doc.setFillColor(220, 220, 255);
      doc.rect(startX, currentY, 170, rowHeight, 'F');
      
      // Header text - Updated column widths
      doc.text('', startX + 2, currentY + 4);
      doc.text('Notes', startX + 122, currentY + 4);
      doc.text('Dollars', startX + 147, currentY + 4);
      
      currentY += rowHeight;

      // UPDATED: Simplified table data
      const tableRows = [
        ['ASSETS', '', ''],
        ['Current Assets', '', ''],
        ['  Trade and Other Receivables', '1', `$${stats.totalPending.toFixed(2)}`],
        ['  Cash and Cash Equivalents', '2', `$${stats.totalAmountPaid.toFixed(2)}`],
        ['', '', ''],
        ['TOTAL ASSETS', '', `$${stats.totalAmountDue.toFixed(2)}`],
        ['', '', ''],
        ['EQUITY AND LIABILITIES', '', ''],
        ['Retained Earnings', '3', `$${(stats.totalAmountPaid * 0.15).toFixed(2)}`],
        ['TOTAL EQUITY', '', `$${(stats.totalAmountPaid * 0.15).toFixed(2)}`],
        ['', '', ''],
        ['Current Liabilities', '', ''],
        ['  Trade and Other Payables', '4', `$${stats.totalPending.toFixed(2)}`],
        ['', '', ''],
        ['Total Liabilities', '', `$${stats.totalPending.toFixed(2)}`],
        ['TOTAL EQUITY AND LIABILITIES', '', `$${stats.totalAmountDue.toFixed(2)}`]
      ];

      // Draw table rows
      tableRows.forEach((row, index) => {
        const [description, notes, dollars] = row;
        
        // Set font style for main headers
        if (description.includes('ASSETS') || description.includes('EQUITY') || description.includes('TOTAL')) {
          doc.setFont("helvetica", "bold");
          if (description.includes('TOTAL')) {
            doc.setFillColor(240, 240, 240);
            doc.rect(startX, currentY, 170, rowHeight, 'F');
          }
        } else {
          doc.setFont("helvetica", "normal");
        }

        // Draw row border - Updated column widths
        doc.setDrawColor(200, 200, 200);
        doc.rect(startX, currentY, 120, rowHeight, 'S'); // Description column (wider)
        doc.rect(startX + 120, currentY, 25, rowHeight, 'S'); // Notes column
        doc.rect(startX + 145, currentY, 25, rowHeight, 'S'); // Dollars column

        // Add text
        doc.setFontSize(9);
        doc.text(description, startX + 2, currentY + 4);
        doc.text(notes, startX + 132, currentY + 4, { align: 'center' });
        doc.text(dollars, startX + 167, currentY + 4, { align: 'right' });
        
        currentY += rowHeight;
      });

      // NEW: Add Payment Method Breakdown Section
      currentY += 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Payment Method Breakdown', startX, currentY);
      currentY += 10;

      // Payment methods table header
      doc.setFontSize(10);
      doc.setFillColor(220, 220, 255);
      doc.rect(startX, currentY, 170, rowHeight, 'F');
      doc.text('Payment Method', startX + 2, currentY + 4);
      doc.text('Amount Received', startX + 120, currentY + 4);
      doc.text('Percentage', startX + 150, currentY + 4);
      currentY += rowHeight;

      // Payment methods data
      Object.entries(stats.paymentMethods).forEach(([method, amount]) => {
        const percentage = ((amount / stats.totalAmountPaid) * 100).toFixed(1);
        
        doc.setFont("helvetica", "normal");
        doc.setDrawColor(200, 200, 200);
        doc.rect(startX, currentY, 100, rowHeight, 'S');
        doc.rect(startX + 100, currentY, 45, rowHeight, 'S');
        doc.rect(startX + 145, currentY, 25, rowHeight, 'S');

        doc.setFontSize(9);
        doc.text(method, startX + 2, currentY + 4);
        doc.text(`$${amount.toFixed(2)}`, startX + 142, currentY + 4, { align: 'right' });
        doc.text(`${percentage}%`, startX + 167, currentY + 4, { align: 'right' });
        
        currentY += rowHeight;
      });

      // Total row for payment methods
      doc.setFont("helvetica", "bold");
      doc.setFillColor(240, 240, 240);
      doc.rect(startX, currentY, 170, rowHeight, 'F');
      doc.text('TOTAL PAYMENTS', startX + 2, currentY + 4);
      doc.text(`$${stats.totalAmountPaid.toFixed(2)}`, startX + 142, currentY + 4, { align: 'right' });
      doc.text('100.0%', startX + 167, currentY + 4, { align: 'right' });

      // Add signature section
      currentY += 25;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text('Financial Manager of Heal-x', startX, currentY);
      
      // Dotted signature line
      currentY += 15;
      const dots = '.'.repeat(50);
      doc.text(dots, startX, currentY);

      // Save the PDF
      const fileName = `Heal-x_Financial_Report_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      setMessage("Financial report with payment breakdown generated successfully!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage("Error generating report: " + error.message);
    }
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
    <div className="financial-container">
      {/* Header */}
      <div className="financial-header">
        <h2 className="financial-title">Payment Management</h2>
        <div className="header-buttons-container">
          <button className="return-home-btn" onClick={handleReturnHome}>
            <MdHome size={18} />
            <span style={{ marginLeft: 6 }}>Return Home</span>
          </button>
          <button className="total-value-btn" onClick={handleTotalValueClick}>
            <MdAnalytics size={18} />
            <span style={{ marginLeft: 6 }}>Payment Analysis</span>
          </button>
          <button className="inventory-btn" onClick={handleInventoryAnalysisClick}>
            <MdInventory size={18} />
            <span style={{ marginLeft: 6 }}>Inventory Analysis</span>
          </button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fab-container">
        <div className="fab fab-purple" onClick={generateFinancialReport} title="Generate Financial Report">
          <MdDescription size={24} />
        </div>
        <div className="fab fab-pink" onClick={handleTotalValueClick} title="Payment Analysis">
          <MdAnalytics size={24} />
        </div>
        <div className="fab fab-green" onClick={handleInventoryAnalysisClick} title="Inventory Analysis">
          <MdInventory size={24} />
        </div>
      </div>

      {message && (
        <div
          className={`financial-message ${
            /error|fail|not /i.test(message) ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      <table className="financial-table">
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
              <td className="financial-actions">
                <button onClick={() => handleEdit(p)}>Edit</button>{" "}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(p._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleSubmit} className="financial-form">
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
