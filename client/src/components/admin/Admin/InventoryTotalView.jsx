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
import jsPDF from 'jspdf'; // Add this import

import './styles/InventoryTotalView.css'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryTotalView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  if (!state || !state.inventoryItems) {
    return (
      <div className="itv-unique-inventory-total-view">
        <div className="itv-unique-error-container">
          <div className="itv-unique-error-content">
            <h2>⚠️ No Inventory Data Available</h2>
            <p>Please navigate from the Payment Management page to view the inventory analysis.</p>
            <button onClick={() => navigate("/admin/financial/payments")} className="itv-unique-back-btn">
              ← Back to Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { inventoryItems, inventoryStats } = state;

  // NEW: Comprehensive PDF Generation Function
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text('Heal-x Healthcare Center', 105, y, { align: 'center' });
      
      y += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text('Comprehensive Inventory Analysis Report', 105, y, { align: 'center' });
      
      y += 8;
      doc.setFontSize(12);
      doc.text(`Report Generated: ${currentDate}`, 105, y, { align: 'center' });
      
      y += 15;

      // Executive Summary Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('EXECUTIVE SUMMARY', 20, y);
      y += 8;

      // Summary data
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const summaryData = [
        ['Total Items', inventoryStats.totalItems.toString()],
        ['Total Quantity', inventoryStats.totalQuantity.toLocaleString()],
        ['Total Inventory Value', `$${inventoryStats.totalValue.toLocaleString()}`],
        ['Average Item Value', `$${(inventoryStats.totalValue / inventoryStats.totalItems).toFixed(2)}`],
        ['Low Stock Items', inventoryStats.lowStockCount.toString()],
        ['Out of Stock Items', inventoryStats.outOfStockCount.toString()],
        ['Stock Health Rating', `${((1 - (inventoryStats.lowStockCount / inventoryStats.totalItems)) * 100).toFixed(1)}%`],
        ['Available Items', (inventoryStats.totalItems - inventoryStats.lowStockCount).toString()]
      ];

      // Draw summary table
      summaryData.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.text(label + ':', 30, y);
        doc.setFont("helvetica", "bold");
        doc.text(value, 120, y);
        y += 6;
      });

      y += 10;

      // Category Breakdown Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('CATEGORY BREAKDOWN', 20, y);
      y += 8;

      // Category table header
      doc.setFontSize(9);
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.text('Category', 25, y + 4);
      doc.text('Items', 70, y + 4);
      doc.text('Quantity', 95, y + 4);
      doc.text('Total Value', 125, y + 4);
      doc.text('Low Stock', 160, y + 4);
      y += 6;

      // Category data
      doc.setFont("helvetica", "normal");
      Object.entries(inventoryStats.categoryBreakdown)
        .sort(([,a], [,b]) => b.totalValue - a.totalValue)
        .forEach(([category, data]) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          doc.rect(20, y, 170, 6, 'S');
          doc.text(category, 25, y + 4);
          doc.text(data.count.toString(), 70, y + 4);
          doc.text(data.totalQuantity.toLocaleString(), 95, y + 4);
          doc.text(`$${data.totalValue.toLocaleString()}`, 125, y + 4);
          doc.text(data.lowStockCount.toString(), 160, y + 4);
          y += 6;
        });

      y += 10;

      // Supplier Breakdown Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('SUPPLIER ANALYSIS', 20, y);
      y += 8;

      // Supplier table header
      doc.setFontSize(8);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.text('Supplier', 25, y + 4);
      doc.text('Items', 75, y + 4);
      doc.text('Total Value', 105, y + 4);
      doc.text('Avg Price', 135, y + 4);
      doc.text('% of Total', 165, y + 4);
      y += 6;

      // Supplier data
      doc.setFont("helvetica", "normal");
      Object.entries(inventoryStats.supplierBreakdown)
        .sort(([,a], [,b]) => b.totalValue - a.totalValue)
        .slice(0, 15) // Top 15 suppliers
        .forEach(([supplier, data]) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          const percentage = ((data.totalValue / inventoryStats.totalValue) * 100).toFixed(1);
          
          doc.rect(20, y, 170, 6, 'S');
          doc.text(supplier.substring(0, 20), 25, y + 4);
          doc.text(data.count.toString(), 75, y + 4);
          doc.text(`$${data.totalValue.toFixed(0)}`, 105, y + 4);
          doc.text(`$${data.avgPrice.toFixed(2)}`, 135, y + 4);
          doc.text(`${percentage}%`, 165, y + 4);
          y += 6;
        });

      y += 10;

      // Critical Items Section
      if (inventoryStats.outOfStockItems.length > 0 || inventoryStats.lowStockItems.length > 0) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('CRITICAL - ITEMS REQUIRING ATTENTION', 20, y);
        y += 8;

        // Out of Stock Items
        if (inventoryStats.outOfStockItems.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Out of Stock Items (${inventoryStats.outOfStockItems.length}):`, 30, y);
          y += 6;

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          inventoryStats.outOfStockItems.slice(0, 20).forEach(item => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(`• ${item.name} (${item.category}) - OUT OF STOCK`, 35, y);
            y += 4;
          });
          y += 5;
        }

        // Low Stock Items
        const lowStockInStock = inventoryStats.lowStockItems.filter(item => item.quantity > 0);
        if (lowStockInStock.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Low Stock Items (${lowStockInStock.length}):`, 30, y);
          y += 6;

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          lowStockInStock.slice(0, 20).forEach(item => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.text(`• ${item.name} (${item.category}) - ${item.quantity} remaining`, 35, y);
            y += 4;
          });
        }
      }

      // Inventory Health Analysis
      if (y > 200) {
        doc.addPage();
        y = 20;
      } else {
        y += 15;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('INVENTORY HEALTH ANALYSIS', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Stock Health Metrics
      const stockHealthPercentage = ((1 - (inventoryStats.lowStockCount / inventoryStats.totalItems)) * 100);
      doc.text(`• Overall stock health: ${stockHealthPercentage.toFixed(1)}%`, 30, y);
      y += 6;
      
      if (stockHealthPercentage < 80) {
        doc.text(`• ALERT: Stock health below 80%. Immediate restocking recommended.`, 30, y);
      } else if (stockHealthPercentage >= 95) {
        doc.text(`• EXCELLENT: Stock health above 95%. Inventory well maintained.`, 30, y);
      } else {
        doc.text(`• GOOD: Stock health is acceptable but monitor critical items.`, 30, y);
      }
      y += 8;

      // Top Category Analysis
      const topCategory = Object.entries(inventoryStats.categoryBreakdown)
        .sort(([,a], [,b]) => b.totalValue - a.totalValue)[0];
      doc.text(`• Highest value category: ${topCategory[0]} ($${topCategory[1].totalValue.toLocaleString()})`, 30, y);
      y += 8;

      // Critical Alerts
      if (inventoryStats.outOfStockCount > 0) {
        doc.text(`• URGENT: ${inventoryStats.outOfStockCount} items completely out of stock`, 30, y);
      } else if (inventoryStats.lowStockCount > inventoryStats.totalItems * 0.1) {
        doc.text(`• WARNING: ${inventoryStats.lowStockCount} items have low stock levels`, 30, y);
      } else {
        doc.text(`• Stock levels are within acceptable ranges`, 30, y);
      }
      y += 15;

      // Key Recommendations
      doc.setFont("helvetica", "bold");
      doc.text('KEY RECOMMENDATIONS', 20, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      const recommendations = [];
      
      if (inventoryStats.outOfStockCount > 0) {
        recommendations.push(`• IMMEDIATE: Reorder ${inventoryStats.outOfStockCount} out-of-stock items`);
      }
      
      if (inventoryStats.lowStockCount > 0) {
        recommendations.push(`• PRIORITY: Review reorder points for ${inventoryStats.lowStockCount} low-stock items`);
      }
      
      const topSupplier = Object.entries(inventoryStats.supplierBreakdown)
        .sort(([,a], [,b]) => b.totalValue - a.totalValue)[0];
      recommendations.push(`• Consider negotiating bulk discounts with top supplier: ${topSupplier[0]}`);
      
      if (stockHealthPercentage < 85) {
        recommendations.push(`• Implement automated reorder system for critical items`);
      }
      
      recommendations.push(`• Regular inventory audits recommended for categories with high values`);

      recommendations.forEach(rec => {
        doc.text(rec, 30, y);
        y += 6;
      });

      // Add new page for summary
      doc.addPage();
      y = 30;

      // Report Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('REPORT SUMMARY', 20, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`This report covers ${inventoryStats.totalItems} inventory items with a total value of $${inventoryStats.totalValue.toLocaleString()}.`, 30, y);
      y += 6;
      doc.text(`Current stock levels show ${inventoryStats.outOfStockCount} out-of-stock and ${inventoryStats.lowStockCount} low-stock items.`, 30, y);
      y += 6;
      doc.text(`Inventory health rating: ${stockHealthPercentage.toFixed(1)}% with ${inventoryStats.totalItems - inventoryStats.lowStockCount} items well-stocked.`, 30, y);
      y += 6;
      doc.text(`Immediate attention required for ${inventoryStats.outOfStockCount + inventoryStats.lowStockCount} items to maintain optimal stock levels.`, 30, y);

      // Signature section
      y += 30;
      doc.text('Admin of Heal-x', 20, y);
      y += 15;
      doc.text('.'.repeat(50), 20, y);
      y += 10;
      doc.setFontSize(8);
      doc.text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, y);

      // Save PDF
      const fileName = `Heal-x_Inventory_Analysis_Report_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      alert("Comprehensive inventory analysis report generated successfully!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF report: " + error.message);
    }
  };

  // Chart configurations
  const categoryChartData = {
    labels: Object.keys(inventoryStats.categoryBreakdown),
    datasets: [{
      label: 'Total Value by Category ($)',
      data: Object.values(inventoryStats.categoryBreakdown).map(cat => cat.totalValue),
      backgroundColor: [
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF', 
        '#FF9F40', '#FF6384', '#4BC0C0', '#36A2EB', '#FFCE56'
      ],
      borderWidth: 2,
      borderColor: '#fff'
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
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const supplierChartData = {
    labels: Object.keys(inventoryStats.supplierBreakdown).slice(0, 10),
    datasets: [{
      label: 'Items Count',
      data: Object.values(inventoryStats.supplierBreakdown).slice(0, 10).map(sup => sup.count),
      backgroundColor: '#36A2EB',
      borderRadius: 4
    }, {
      label: 'Total Value ($)',
      data: Object.values(inventoryStats.supplierBreakdown).slice(0, 10).map(sup => sup.totalValue),
      backgroundColor: '#4BC0C0',
      borderRadius: 4
    }]
  };

  return (
    <div className="itv-unique-inventory-total-view">
      {/* Header */}
      <div className="itv-unique-page-header">
        <div className="itv-unique-header-content">
          <h1>📦 Inventory Analysis & Reports</h1>
          <div className="itv-unique-header-actions">
            <button onClick={() => navigate("/admin/financial/payments")} className="itv-unique-back-btn">
              ← Back to Payments
            </button>
            <button onClick={() => window.print()} className="itv-unique-print-btn">
              🖨️ Print Report SS
            </button>
            <button onClick={generatePDF} className="itv-unique-export-btn">
              📤 Export Report PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="itv-unique-summary-grid">
        <div className="itv-unique-summary-card itv-unique-primary-card">
          <div className="itv-unique-card-icon">📦</div>
          <div className="itv-unique-card-content">
            <h2>{inventoryStats.totalItems}</h2>
            <p>Total Items</p>
            <div className="itv-unique-card-trend">
              <span className="itv-unique-trend-info">🏷️ Unique Products</span>
            </div>
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
            <h3>${inventoryStats.totalValue.toLocaleString()}</h3>
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
        
        <div className="itv-unique-summary-card">
          <div className="itv-unique-card-icon">📈</div>
          <div className="itv-unique-card-content">
            <h3>${(inventoryStats.totalValue / inventoryStats.totalItems).toFixed(2)}</h3>
            <p>Avg Item Value</p>
            <small>Per product</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="itv-unique-charts-section">
        {/* Stock Status */}
        <div className="itv-unique-chart-container">
          <div className="itv-unique-chart-header">
            <h3>📊 Stock Status Overview</h3>
            <p>Distribution of inventory by availability</p>
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

        {/* Category Breakdown */}
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
                      return `${label}: $${value.toLocaleString()}`;
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
                    <th>Avg Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inventoryStats.categoryBreakdown)
                    .sort(([,a], [,b]) => b.totalValue - a.totalValue)
                    .map(([category, data]) => (
                      <tr key={category}>
                        <td><strong>{category}</strong></td>
                        <td>{data.count}</td>
                        <td>{data.totalQuantity.toLocaleString()}</td>
                        <td>${data.totalValue.toLocaleString()}</td>
                        <td>
                          <span style={{ 
                            color: data.lowStockCount > 0 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {data.lowStockCount}
                          </span>
                        </td>
                        <td>${(data.totalValue / data.count).toFixed(2)}</td>
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
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inventoryStats.supplierBreakdown)
                    .sort(([,a], [,b]) => b.totalValue - a.totalValue)
                    .map(([supplier, data]) => {
                      const percentage = ((data.totalValue / inventoryStats.totalValue) * 100).toFixed(1);
                      return (
                        <tr key={supplier}>
                          <td><strong>{supplier}</strong></td>
                          <td>{data.count}</td>
                          <td>${data.totalValue.toLocaleString()}</td>
                          <td>${data.avgPrice.toFixed(2)}</td>
                          <td>{percentage}%</td>
                        </tr>
                      );
                    })}
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

      {/* Executive Summary */}
      <div className="itv-unique-summary-report">
        <h3>📋 Executive Inventory Summary</h3>
        <div className="itv-unique-report-grid">
          <div className="itv-unique-report-section">
            <h4>📊 Inventory Overview</h4>
            <ul>
              <li><strong>Total Items:</strong> {inventoryStats.totalItems}</li>
              <li><strong>Total Quantity:</strong> {inventoryStats.totalQuantity.toLocaleString()}</li>
              <li><strong>Total Value:</strong> ${inventoryStats.totalValue.toLocaleString()}</li>
              <li><strong>Average Item Value:</strong> ${(inventoryStats.totalValue / inventoryStats.totalItems).toFixed(2)}</li>
            </ul>
          </div>
          
          <div className="itv-unique-report-section">
            <h4>🏷️ Top Category</h4>
            {(() => {
              const topCategory = Object.entries(inventoryStats.categoryBreakdown)
                .reduce((max, [name, data]) => data.totalValue > max.data.totalValue ? {name, data} : max, 
                  {name: '', data: {totalValue: 0, count: 0, totalQuantity: 0}});
              return (
                <ul>
                  <li><strong>Category:</strong> {topCategory.name}</li>
                  <li><strong>Items:</strong> {topCategory.data.count}</li>
                  <li><strong>Total Value:</strong> ${topCategory.data.totalValue.toLocaleString()}</li>
                  <li><strong>Quantity:</strong> {topCategory.data.totalQuantity.toLocaleString()}</li>
                </ul>
              );
            })()}
          </div>
          
          <div className="itv-unique-report-section">
            <h4>🚨 Stock Alerts</h4>
            <ul>
              <li><strong>Low Stock Items:</strong> {inventoryStats.lowStockCount}</li>
              <li><strong>Out of Stock:</strong> {inventoryStats.outOfStockCount}</li>
              <li><strong>Stock Health:</strong> {((1 - (inventoryStats.lowStockCount / inventoryStats.totalItems)) * 100).toFixed(1)}%</li>
              <li><strong>Action Required:</strong> {inventoryStats.outOfStockCount > 0 ? 'Immediate' : inventoryStats.lowStockCount > 0 ? 'Soon' : 'None'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTotalView;
