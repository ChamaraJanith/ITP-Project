import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import './styles/InventoryTotalView.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = 'http://localhost:7000/api/inventory';

const InventoryTotalView = () => {
  const navigate = useNavigate();

  // Surgical items
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enhanced Stats (incl. autoRestock values!)
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    categoryBreakdown: {},
    supplierBreakdown: {},
    lowStockItems: [],
    outOfStockItems: [],
  });

  // Auto-Restock value (for all time, month, history)
  const [restockSpending, setRestockSpending] = useState({
    totalRestockValue: 0,
    monthlyRestockValue: 0,
    restockHistory: [],
  });

  useEffect(() => {
    fetchEverything();
    // eslint-disable-next-line
  }, []);

  async function fetchEverything() {
    setLoading(true);
    try {
      // Fetch items
      const res = await fetch(`${API_BASE_URL}/surgical-items?page=1&limit=1000`);
      const data = await res.json();
      let surgicalItems = [];
      if (data.success && Array.isArray(data.data.items)) {
        surgicalItems = data.data.items;
        setItems(surgicalItems);
        setInventoryStats(calcInventoryStats(surgicalItems));
      }

      // Fetch restock spending data
      const restockRes = await fetch(`${API_BASE_URL}/restock-spending`);
      if (restockRes.ok) {
        const restockData = await restockRes.json();
        if (restockData.success) {
          setRestockSpending({
            totalRestockValue: restockData.data.totalRestockValue ?? 0,
            monthlyRestockValue: restockData.data.monthlyRestockValue ?? 0,
            restockHistory: restockData.data.restockHistory ?? [],
          });
        }
      }
    } catch (e) {
      setItems([]);
      setInventoryStats({
        totalItems: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0,
        categoryBreakdown: {},
        supplierBreakdown: {},
        lowStockItems: [],
        outOfStockItems: [],
      });
      setRestockSpending({
        totalRestockValue: 0,
        monthlyRestockValue: 0,
        restockHistory: [],
      });
    } finally {
      setLoading(false);
    }
  }

  // Enhanced stat computation for inventory (by items array)
  function calcInventoryStats(itemsArray) {
    const totalItems = itemsArray.length;
    const totalQuantity = itemsArray.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const lowStockItems = itemsArray.filter(item => (parseInt(item.quantity) || 0) < (parseInt(item.minStockLevel) || 0));
    const outOfStockItems = itemsArray.filter(item => (parseInt(item.quantity) || 0) === 0);
    const lowStockCount = lowStockItems.length;
    const outOfStockCount = outOfStockItems.length;
    const totalValue = itemsArray.reduce((sum, item) =>
      sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0);

    // Breakdown by category
    const categoryBreakdown = {};
    itemsArray.forEach(item => {
      const category = item.category || "Other";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockCount: 0,
        };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].totalQuantity += (parseInt(item.quantity) || 0);
      categoryBreakdown[category].totalValue += ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
      if ((parseInt(item.quantity) || 0) < (parseInt(item.minStockLevel) || 0)) {
        categoryBreakdown[category].lowStockCount += 1;
      }
    });
    // Breakdown by supplier
    const supplierBreakdown = {};
    itemsArray.forEach(item => {
      const supplier = item?.supplier?.name || "Unknown";
      if (!supplierBreakdown[supplier]) {
        supplierBreakdown[supplier] = {
          count: 0,
          totalValue: 0,
          avgPrice: 0,
        };
      }
      supplierBreakdown[supplier].count += 1;
      supplierBreakdown[supplier].totalValue += ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
    });
    Object.keys(supplierBreakdown).forEach(supplier => {
      if (supplierBreakdown[supplier].count > 0) {
        supplierBreakdown[supplier].avgPrice = supplierBreakdown[supplier].totalValue / supplierBreakdown[supplier].count;
      }
    });

    return {
      totalItems, totalQuantity, lowStockCount, outOfStockCount, totalValue,
      categoryBreakdown, supplierBreakdown, lowStockItems, outOfStockItems
    };
  }

  // ✅ NEW: Professional PDF Report Generation with Signature Section
  const generateProfessionalPDF = () => {
    if (!items || items.length === 0) {
      alert('No inventory data available to generate report');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>HealX Inventory Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4BC0C0; padding-bottom: 20px; }
          .header h1 { color: #4BC0C0; margin: 0; font-size: 24px; }
          .header p { margin: 10px 0 0 0; color: #666; }
          .info { margin-bottom: 20px; text-align: right; font-size: 11px; color: #555; }
          
          .summary-section { 
            margin-bottom: 25px; 
            padding: 15px; 
            background-color: #f8f9fa; 
            border-left: 4px solid #4BC0C0; 
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin-top: 15px; 
          }
          .summary-card { 
            text-align: center; 
            padding: 10px; 
            background: white; 
            border-radius: 5px; 
            border: 1px solid #ddd; 
          }
          .summary-card h3 { 
            margin: 0 0 5px 0; 
            color: #4BC0C0; 
            font-size: 18px; 
          }
          .summary-card p { 
            margin: 0; 
            font-size: 11px; 
            color: #666; 
          }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4BC0C0; color: white; font-weight: bold; text-align: center; }
          .currency { text-align: right; }
          .status-available { color: #28a745; font-weight: bold; }
          .status-low { color: #ffc107; font-weight: bold; }
          .status-out { color: #dc3545; font-weight: bold; }
          
          /* Signature Section Styles */
          .signature-section { 
            margin-top: 60px; 
            margin-bottom: 30px; 
            width: 100%; 
            page-break-inside: avoid; 
          }
          .signature-container { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-top: 40px; 
          }
          .signature-block { 
            width: 45%; 
            text-align: center; 
          }
          .signature-line { 
            border-bottom: 2px dotted #333; 
            width: 200px; 
            height: 50px; 
            margin: 0 auto 10px auto; 
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
            border: 2px solid #4BC0C0; 
            display: inline-block; 
            font-size: 10px; 
            color: #4BC0C0; 
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
          
          @media print { 
            body { margin: 10px; } 
            .no-print { display: none; }
            .signature-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 HealX Healthcare Center</h1>
          <h2>📦 Surgical Inventory Analysis Report</h2>
          <p>Comprehensive Inventory Management System</p>
        </div>
        
        <div class="info">
          <strong>Generated on:</strong> ${new Date().toLocaleString()}<br>
          <strong>Total Items:</strong> ${inventoryStats.totalItems}<br>
          <strong>Report Type:</strong> Complete Inventory Analysis
        </div>

        <div class="summary-section">
          <h3>📊 Executive Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>${inventoryStats.totalItems}</h3>
              <p>Total Items</p>
            </div>
            <div class="summary-card">
              <h3>${inventoryStats.totalQuantity.toLocaleString()}</h3>
              <p>Total Quantity</p>
            </div>
            <div class="summary-card">
              <h3>$${inventoryStats.totalValue.toLocaleString()}</h3>
              <p>Total Value</p>
            </div>
            <div class="summary-card">
              <h3>$${restockSpending.totalRestockValue.toLocaleString()}</h3>
              <p>Auto-Restock Value</p>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <p><strong>Stock Status:</strong> Available: ${inventoryStats.totalItems - inventoryStats.lowStockCount} items | 
            Low Stock: ${inventoryStats.lowStockCount} items | Out of Stock: ${inventoryStats.outOfStockCount} items</p>
            <p><strong>Monthly Restock:</strong> $${restockSpending.monthlyRestockValue.toLocaleString()} | 
            <strong>Restock Sessions:</strong> ${restockSpending.restockHistory.length}</p>
          </div>
        </div>

        <h3>🏷️ Category Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Items Count</th>
              <th>Total Quantity</th>
              <th>Total Value ($)</th>
              <th>Low Stock Items</th>
              <th>% of Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(inventoryStats.categoryBreakdown)
              .sort(([, a], [, b]) => b.totalValue - a.totalValue)
              .map(([category, data]) => `
                <tr>
                  <td><strong>${category}</strong></td>
                  <td>${data.count}</td>
                  <td>${data.totalQuantity.toLocaleString()}</td>
                  <td class="currency">${data.totalValue.toLocaleString()}</td>
                  <td class="${data.lowStockCount > 0 ? 'status-low' : 'status-available'}">${data.lowStockCount}</td>
                  <td class="currency">${((data.totalValue / inventoryStats.totalValue) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
          </tbody>
        </table>

        <h3>🏭 Supplier Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Items Supplied</th>
              <th>Total Value ($)</th>
              <th>Average Item Price ($)</th>
              <th>Market Share (%)</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(inventoryStats.supplierBreakdown)
              .sort(([, a], [, b]) => b.totalValue - a.totalValue)
              .map(([supplier, data]) => `
                <tr>
                  <td><strong>${supplier}</strong></td>
                  <td>${data.count}</td>
                  <td class="currency">${data.totalValue.toLocaleString()}</td>
                  <td class="currency">${data.avgPrice.toFixed(2)}</td>
                  <td class="currency">${((data.totalValue / inventoryStats.totalValue) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
          </tbody>
        </table>

        <h3>📋 Complete Inventory Listing</h3>
        <table>
          <thead>
            <tr>
              <th>SN</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Min Stock</th>
              <th>Unit Price ($)</th>
              <th>Current Value ($)</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Auto-Restock</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => {
              const quantity = parseInt(item.quantity) || 0;
              const minStock = parseInt(item.minStockLevel) || 0;
              const price = parseFloat(item.price) || 0;
              const currentValue = price * quantity;
              let statusText = 'Available';
              let statusClass = 'status-available';
              if (quantity === 0) {
                statusText = "Out of Stock";
                statusClass = 'status-out';
              } else if (quantity < minStock) {
                statusText = "Low Stock";
                statusClass = 'status-low';
              }
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.name || "Unknown Item"}</strong></td>
                  <td>${item.category || "Other"}</td>
                  <td>${quantity}</td>
                  <td>${minStock}</td>
                  <td class="currency">${price.toFixed(2)}</td>
                  <td class="currency">${currentValue.toFixed(2)}</td>
                  <td class="${statusClass}">${statusText}</td>
                  <td>${item?.supplier?.name || "N/A"}</td>
                  <td>${item.autoRestock?.enabled ? 'YES' : 'NO'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${(inventoryStats.outOfStockItems.length > 0 || inventoryStats.lowStockItems.length > 0) ? `
          <h3>🚨 Critical Items Requiring Immediate Attention</h3>
          ${inventoryStats.outOfStockItems.length > 0 ? `
            <h4 style="color: #dc3545;">🚫 Out of Stock Items (${inventoryStats.outOfStockItems.length})</h4>
            <ul>
              ${inventoryStats.outOfStockItems.map(item => `
                <li><strong>${item.name}</strong> - ${item.category} - <em>Supplier: ${item?.supplier?.name || "N/A"}</em></li>
              `).join('')}
            </ul>
          ` : ''}
          ${inventoryStats.lowStockItems.filter(item => item.quantity > 0).length > 0 ? `
            <h4 style="color: #ffc107;">⚠️ Low Stock Items (${inventoryStats.lowStockItems.filter(item => item.quantity > 0).length})</h4>
            <ul>
              ${inventoryStats.lowStockItems.filter(item => item.quantity > 0).map(item => `
                <li><strong>${item.name}</strong> - ${item.category} - Remaining: ${item.quantity} - <em>Min Required: ${item.minStockLevel}</em></li>
              `).join('')}
            </ul>
          ` : ''}
        ` : ''}

        <h3>🤖 Auto-Restock Activity Summary</h3>
        <p><strong>Total Auto-Restock Value:</strong> $${restockSpending.totalRestockValue.toLocaleString()}</p>
        <p><strong>This Month:</strong> $${restockSpending.monthlyRestockValue.toLocaleString()}</p>
        <p><strong>Restock Sessions:</strong> ${restockSpending.restockHistory.length}</p>
        ${restockSpending.restockHistory.length > 0 ? `
          <p><strong>Last Activity:</strong> ${new Date(restockSpending.restockHistory[restockSpending.restockHistory.length - 1].timestamp).toLocaleString()}</p>
        ` : ''}

        <!-- Professional Signature Section -->
        <div class="signature-section">
          <div class="signature-container">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Inventory Manager</div>
              <div class="signature-title">HealX Healthcare Management</div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Date: _______________</div>
              <div class="signature-title">Report Approved On</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <div class="company-stamp">
              🏥 HEALX OFFICIAL SEAL<br>
              INVENTORY MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        <div class="report-footer">
          <p><strong>This is a system-generated report from HealX Healthcare Management System</strong></p>
          <p>Report generated on ${new Date().toLocaleString()} | All amounts are in Sri Lankan Rupees ($)</p>
          <p>For queries regarding this report, contact the Inventory Department at HealX Healthcare</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #4BC0C0; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-right: 10px;">
            🖨️ Print PDF Report
          </button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">
            ❌ Close
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    alert('Professional inventory report opened! Use Ctrl+P to save as PDF.');
  };

  // ✅ NEW: Excel/CSV Export with Complete Data
  const exportToExcel = () => {
    if (!items || items.length === 0) {
      alert('No inventory data available to export');
      return;
    }

    const headers = [
      'Item Name', 'Category', 'Quantity', 'Min Stock Level', 'Unit Price ($)',
      'Current Value ($)', 'Status', 'Supplier', 'Auto-Restock Enabled', 'Restock Quantity',
      'Description', 'Last Updated'
    ];

    const csvData = items.map(item => {
      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      const price = parseFloat(item.price) || 0;
      const currentValue = price * quantity;
      let status = 'Available';
      if (quantity === 0) status = "Out of Stock";
      else if (quantity < minStock) status = "Low Stock";

      return [
        item.name || '', item.category || '', quantity, minStock, price.toFixed(2),
        currentValue.toFixed(2), status, item?.supplier?.name || '',
        item.autoRestock?.enabled ? 'YES' : 'NO', item.autoRestock?.reorderQuantity || '',
        item.description || '', new Date(item.updatedAt || Date.now()).toLocaleDateString()
      ];
    });

    // Add summary rows
    csvData.push([]);
    csvData.push(['INVENTORY SUMMARY', '', '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Total Items', inventoryStats.totalItems, '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Total Quantity', inventoryStats.totalQuantity, '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Total Value ($)', inventoryStats.totalValue.toFixed(2), '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Low Stock Count', inventoryStats.lowStockCount, '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Out of Stock Count', inventoryStats.outOfStockCount, '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Auto-Restock Total ($)', restockSpending.totalRestockValue.toFixed(2), '', '', '', '', '', '', '', '', '', '']);
    csvData.push(['Monthly Restock ($)', restockSpending.monthlyRestockValue.toFixed(2), '', '', '', '', '', '', '', '', '', '']);

    const csvContent = [
      `"HealX Healthcare - Surgical Inventory Report"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      `"Total Records: ${items.length}"`,
      '',
      headers.map(header => `"${header}"`).join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `HealX-Inventory-Report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    alert('Excel file (CSV format) downloaded successfully!');
  };

  // Keep existing PDF generation (renamed for clarity)
  const generateSimplePDF = () => {
    if (!items || items.length === 0) {
      alert('No inventory data available to generate report');
      return;
    }
    try {
      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      doc.setFontSize(18);
      doc.text("HealX Healthcare Center", pageWidth / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(14);
      doc.text("Surgical Items Inventory Report", pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.setFontSize(10);
      doc.text("Inventory Management System", pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setLineWidth(0.8);
      doc.line(15, y, pageWidth - 15, y);
      y += 8;
      doc.setFontSize(9);
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      doc.setFont(undefined, 'normal');
      doc.text(`Report Date: ${dateString}   Time: ${timeString}   Items: ${inventoryStats.totalItems}`, pageWidth / 2, y, { align: 'center' });
      y += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("SUMMARY", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Items: ${inventoryStats.totalItems}`, 25, y);
      doc.text(`Total Value: ${inventoryStats.totalValue.toLocaleString()}`, 73, y);
      doc.text(`Low Stock Items: ${inventoryStats.lowStockCount}`, 110, y);
      doc.text(`Out of Stock: ${inventoryStats.outOfStockCount}`, 150, y);
      doc.text(`Auto-Restock Value: ${restockSpending.totalRestockValue.toLocaleString()}`, 192, y);

      y += 10;
      // Category distribution (table)
      const categoryRows = Object.entries(inventoryStats.categoryBreakdown)
        .sort(([, a], [, b]) => b.totalValue - a.totalValue)
        .map(([name, v]) => [
          name, v.count, v.totalQuantity, v.totalValue.toLocaleString(), v.lowStockCount
        ]);
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Items', 'Total Quantity', 'Total Value', 'Low Stock']],
        body: categoryRows,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240] },
        bodyStyles: { fontSize: 8 },
        margin: { left: 20 },
        tableWidth: 95
      });
      y = doc.lastAutoTable.finalY + 8;

      // Main table
      const tableData = items.map((item, idx) => {
        const quantity = parseInt(item.quantity) || 0;
        const minStock = parseInt(item.minStockLevel) || 0;
        const price = parseFloat(item.price) || 0;
        const currentValue = price * quantity;
        let statusText = 'Available';
        if (quantity === 0) statusText = "Out of Stock";
        else if (quantity < minStock) statusText = "Low Stock";
        let autoRestock = item.autoRestock?.enabled ? 'YES' : 'NO';
        let reorderQ = item.autoRestock?.reorderQuantity || "";
        return [
          idx + 1, item.name || "Unknown Item", item.category || "Other", quantity,
          minStock, price.toFixed(2), currentValue.toFixed(2), statusText,
          item?.supplier?.name || "NA", autoRestock, reorderQ
        ];
      });
      autoTable(doc, {
        startY: y,
        head: [['SN', 'Item Name', 'Category', 'Quantity', 'Min Stock', 'Unit Price', 'Current Value', 'Status', 'Supplier', 'Auto-Restock', 'Restock Qty']],
        body: tableData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 48 } }
      });
      doc.save(`HealXSurgicalItemsInventory_${now.toISOString().replace(/[:.]/g, '-')}.pdf`);
      alert('Surgical items inventory report generated successfully! Download started.');
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  // Chart Configs
  const categoryChartData = {
    labels: Object.keys(inventoryStats.categoryBreakdown),
    datasets: [{
      label: 'Total Value by Category',
      data: Object.values(inventoryStats.categoryBreakdown).map(cat => cat.totalValue),
      backgroundColor: [
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF',
        '#FF9F40', '#FF6384', '#4BC0C0', '#36A2EB', '#FFCE56'
      ],
      borderWidth: 2, borderColor: '#fff'
    }]
  };

  const stockStatusData = {
    labels: ['Available', 'Low Stock', 'Out of Stock'],
    datasets: [{
      data: [
        inventoryStats.totalItems - inventoryStats.lowStockCount,
        inventoryStats.lowStockCount - inventoryStats.outOfStockCount,
        inventoryStats.outOfStockCount
      ],
      backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
      borderWidth: 2, borderColor: '#fff'
    }]
  };

  const supplierChartData = {
    labels: Object.keys(inventoryStats.supplierBreakdown).slice(0, 10),
    datasets: [
      {
        label: 'Items Count',
        data: Object.values(inventoryStats.supplierBreakdown).slice(0, 10).map(sup => sup.count),
        backgroundColor: '#36A2EB',
      },
      {
        label: 'Total Value',
        data: Object.values(inventoryStats.supplierBreakdown).slice(0, 10).map(sup => sup.totalValue),
        backgroundColor: '#4BC0C0',
      }
    ]
  };

  if (loading) {
    return (
      <div className="itv-unique-inventory-total-view">
        <div className="itv-unique-error-container">
          <div className="itv-unique-error-content">
            <h2>⏳ Loading Inventory Data...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="itv-unique-inventory-total-view">
        <div className="itv-unique-error-container">
          <div className="itv-unique-error-content">
            <h2>⚠️ No Inventory Data Available</h2>
            <p>No surgical items found. Please add items to begin analysis.</p>
            <button onClick={() => navigate("/admin/financial")} className="itv-unique-back-btn">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="itv-unique-inventory-total-view">
      {/* Header */}
      <div className="itv-unique-page-header">
        <div className="itv-unique-header-content">
          <h1>📦 Surgical Inventory Analysis & Reports</h1>
          <div className="itv-unique-header-actions">
            <button onClick={() => navigate("/admin/financial")} className="itv-unique-back-btn">
              ← Back to Dashboard
            </button>
            <button onClick={() => window.print()} className="itv-unique-print-btn">
              🖨️ Print Report
            </button>
            <button onClick={generateSimplePDF} className="itv-unique-export-btn">
              📤 Quick PDF
            </button>
            {/* ✅ NEW: Professional Report Generation Buttons */}
            <button onClick={generateProfessionalPDF} className="itv-unique-professional-btn" style={{
              backgroundColor: '#4BC0C0',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              📋 Professional PDF Report
            </button>
            <button onClick={exportToExcel} className="itv-unique-excel-btn" style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              📊 Export Excel CSV
            </button>
          </div>
        </div>
      </div>

      <div className="itv-unique-summary-grid">
        <div className="itv-unique-summary-card itv-unique-primary-card">
          <div className="itv-unique-card-icon">🧰</div>
          <div className="itv-unique-card-content">
            <h2>{inventoryStats.totalItems}</h2>
            <p>Total Items</p>
          </div>
        </div>
        <div className="itv-unique-summary-card itv-unique-success-card">
          <div className="itv-unique-card-icon">📊</div>
          <div className="itv-unique-card-content">
            <h3>{inventoryStats.totalQuantity.toLocaleString()}</h3>
            <p>Total Quantity</p>
            <small>All items combined</small>
          </div>
        </div>
        <div className="itv-unique-summary-card itv-unique-primary-card">
          <div className="itv-unique-card-icon">💰</div>
          <div className="itv-unique-card-content">
            <h3>{inventoryStats.totalValue.toLocaleString()}</h3>
            <p>Total Inventory Value</p>
            <small>Current market value</small>
          </div>
        </div>
        <div className="itv-unique-summary-card itv-unique-warning-card">
          <div className="itv-unique-card-icon">⚠️</div>
          <div className="itv-unique-card-content">
            <h3>{inventoryStats.lowStockCount}</h3>
            <p>Low Stock Items</p>
            <small>{((inventoryStats.lowStockCount / inventoryStats.totalItems) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        <div className="itv-unique-summary-card itv-unique-danger-card">
          <div className="itv-unique-card-icon">🚫</div>
          <div className="itv-unique-card-content">
            <h3>{inventoryStats.outOfStockCount}</h3>
            <p>Out of Stock</p>
            <small>Immediate attention needed</small>
          </div>
        </div>
        <div className="itv-unique-summary-card itv-unique-info-card">
          <div className="itv-unique-card-icon">🤖</div>
          <div className="itv-unique-card-content">
            <h3>{restockSpending.totalRestockValue.toLocaleString()}</h3>
            <p>Auto-Restock Value</p>
            <small>All time automatic restocking</small>
          </div>
        </div>
        <div className="itv-unique-summary-card itv-unique-info-card">
          <div className="itv-unique-card-icon">📅</div>
          <div className="itv-unique-card-content">
            <h3>{restockSpending.monthlyRestockValue.toLocaleString()}</h3>
            <p>This Month (Restock)</p>
            <small>Auto-restock spending</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="itv-unique-charts-section">
        <div className="itv-unique-chart-container">
          <div className="itv-unique-chart-header">
            <h3>📊 Stock Status Overview</h3>
            <p>Distribution of surgical inventory by availability</p>
          </div>
          <div className="itv-unique-chart-wrapper">
            <Doughnut data={stockStatusData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label;
                      const value = context.parsed;
                      const percentage = ((value / inventoryStats.totalItems) * 100).toFixed(1);
                      return `${label}: ${value} items (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>

        <div className="itv-unique-chart-container">
          <div className="itv-unique-chart-header">
            <h3>🏷️ Category Value Breakdown</h3>
            <p>Inventory value by category</p>
          </div>
          <div className="itv-unique-chart-wrapper">
            <Pie data={categoryChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label;
                      const value = context.parsed;
                      return `${label}: ${value.toLocaleString()}`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Supplier Analysis */}
      <div className="itv-unique-chart-container itv-unique-full-width">
        <div className="itv-unique-chart-header">
          <h3>🏭 Supplier Analysis</h3>
          <p>Items count and value by supplier</p>
        </div>
        <div className="itv-unique-chart-wrapper itv-unique-large">
          <Bar data={supplierChartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    return value.toLocaleString();
                  }
                }
              }
            }
          }} />
        </div>
      </div>

      {/* Detailed Analysis Tables */}
      <div className="itv-unique-analysis-section">
        <div className="itv-unique-analysis-grid">
          {/* Category Analysis Table */}
          <div className="itv-unique-analysis-card">
            <h3>🏷️ Category Analysis</h3>
            <div className="itv-unique-analysis-table-container">
              <table className="itv-unique-analysis-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Items</th>
                    <th>Total Quantity</th>
                    <th>Total Value</th>
                    <th>Low Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inventoryStats.categoryBreakdown)
                    .sort(([, a], [, b]) => b.totalValue - a.totalValue)
                    .map(([category, data]) => (
                      <tr key={category}>
                        <td><strong>{category}</strong></td>
                        <td>{data.count}</td>
                        <td>{data.totalQuantity.toLocaleString()}</td>
                        <td>{data.totalValue.toLocaleString()}</td>
                        <td>
                          <span style={{
                            color: data.lowStockCount > 0 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {data.lowStockCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Supplier Analysis */}
          <div className="itv-unique-analysis-card">
            <h3>🏭 Supplier Analysis</h3>
            <div className="itv-unique-analysis-table-container">
              <table className="itv-unique-analysis-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total Value</th>
                    <th>Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inventoryStats.supplierBreakdown)
                    .sort(([, a], [, b]) => b.totalValue - a.totalValue)
                    .map(([supplier, data]) => (
                      <tr key={supplier}>
                        <td><strong>{supplier}</strong></td>
                        <td>{data.count}</td>
                        <td>{data.totalValue.toLocaleString()}</td>
                        <td>{data.avgPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Critical Items - Low Stock & Out of Stock */}
      {(inventoryStats.lowStockItems.length > 0 || inventoryStats.outOfStockItems.length > 0) && (
        <div className="itv-unique-critical-items-section">
          <h3>🚨 Critical Items Requiring Attention</h3>
          {inventoryStats.outOfStockItems.length > 0 && (
            <div className="itv-unique-critical-card itv-unique-danger-card">
              <h4>🚫 Out of Stock Items ({inventoryStats.outOfStockItems.length})</h4>
              <div className="itv-unique-critical-items-grid">
                {inventoryStats.outOfStockItems.map(item => (
                  <div key={item._id} className="itv-unique-critical-item">
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                    <span className="itv-unique-critical-status itv-unique-out-of-stock">OUT OF STOCK</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {inventoryStats.lowStockItems.filter(item => item.quantity > 0).length > 0 && (
            <div className="itv-unique-critical-card itv-unique-warning-card">
              <h4>⚠️ Low Stock Items ({inventoryStats.lowStockItems.filter(item => item.quantity > 0).length})</h4>
              <div className="itv-unique-critical-items-grid">
                {inventoryStats.lowStockItems.filter(item => item.quantity > 0).map(item => (
                  <div key={item._id} className="itv-unique-critical-item">
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                    <span className="itv-unique-critical-quantity">{item.quantity} remaining</span>
                    <span className="itv-unique-critical-status itv-unique-low-stock">LOW STOCK</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-Restock Summary */}
      <div className="itv-unique-summary-report">
        <h3>🤖 Auto-Restock Activity Summary</h3>
        <div className="itv-unique-report-grid">
          <div className="itv-unique-report-section">
            <h4>All Time Auto-Restock</h4>
            <ul>
              <li><strong>Total Value:</strong> {restockSpending.totalRestockValue.toLocaleString()}</li>
              <li><strong>This Month:</strong> {restockSpending.monthlyRestockValue.toLocaleString()}</li>
              <li><strong>Sessions:</strong> {restockSpending.restockHistory.length}</li>
              <li><strong>Last Activity:</strong> {restockSpending.restockHistory.length > 0
                ? (new Date(restockSpending.restockHistory[restockSpending.restockHistory.length - 1].timestamp).toLocaleString())
                : "N/A"}</li>
            </ul>
          </div>
          <div className="itv-unique-report-section">
            <h4>Recent Auto-Restock Events</h4>
            <ul>
              {restockSpending.restockHistory.slice(-3).reverse().map((entry, idx) => (
                <li key={idx}>
                  <strong>{entry.details?.itemCount || '?'}</strong> items restocked,
                  Value: <strong>{entry.restockValue?.toLocaleString()}</strong>,
                  by <strong>{entry.admin || 'System'}</strong> on <strong>{(new Date(entry.timestamp)).toLocaleDateString()}</strong>
                </li>
              ))}
              {restockSpending.restockHistory.length === 0 && <li>No recent auto-restock activity.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTotalView;
