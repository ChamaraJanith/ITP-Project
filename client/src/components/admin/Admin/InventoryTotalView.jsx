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

import './styles/InventoryTotalView.css'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryTotalView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;

  if (!state || !state.inventoryItems) {
    return (
      <div className="inventory-total-view">
        <div className="error-container">
          <div className="error-content">
            <h2>⚠️ No Inventory Data Available</h2>
            <p>Please navigate from the Payment Management page to view the inventory analysis.</p>
            <button onClick={() => navigate("/admin/financial/payments")} className="back-btn">
              ← Back to Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { inventoryItems, inventoryStats } = state;

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
    <div className="inventory-total-view">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>📦 Inventory Analysis & Reports</h1>
          <div className="header-actions">
            <button onClick={() => navigate("/admin/financial/payments")} className="back-btn">
              ← Back to Payments
            </button>
            <button onClick={() => window.print()} className="print-btn">
              🖨️ Print Report
            </button>
            <button onClick={() => {
              const data = JSON.stringify({inventoryStats, inventoryItems}, null, 2);
              const blob = new Blob([data], {type: 'application/json'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'inventory-analysis-report.json';
              a.click();
            }} className="export-btn">
              📤 Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card primary-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h2>{inventoryStats.totalItems}</h2>
            <p>Total Items</p>
            <div className="card-trend">
              <span className="trend-info">🏷️ Unique Products</span>
            </div>
          </div>
        </div>
        
        <div className="summary-card success-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{inventoryStats.totalQuantity.toLocaleString()}</h3>
            <p>Total Quantity</p>
            <small>All items combined</small>
          </div>
        </div>
        
        <div className="summary-card primary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>${inventoryStats.totalValue.toLocaleString()}</h3>
            <p>Total Inventory Value</p>
            <small>Current market value</small>
          </div>
        </div>
        
        <div className="summary-card warning-card">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <h3>{inventoryStats.lowStockCount}</h3>
            <p>Low Stock Items</p>
            <small>{((inventoryStats.lowStockCount / inventoryStats.totalItems) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        
        <div className="summary-card danger-card">
          <div className="card-icon">🚫</div>
          <div className="card-content">
            <h3>{inventoryStats.outOfStockCount}</h3>
            <p>Out of Stock</p>
            <small>Immediate attention needed</small>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>${(inventoryStats.totalValue / inventoryStats.totalItems).toFixed(2)}</h3>
            <p>Avg Item Value</p>
            <small>Per product</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Stock Status */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>📊 Stock Status Overview</h3>
            <p>Distribution of inventory by availability</p>
          </div>
          <div className="chart-wrapper">
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
        <div className="chart-container">
          <div className="chart-header">
            <h3>🏷️ Category Value Breakdown</h3>
            <p>Inventory value by category</p>
          </div>
          <div className="chart-wrapper">
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
      <div className="chart-container full-width">
        <div className="chart-header">
          <h3>🏭 Supplier Analysis</h3>
          <p>Items count and value by supplier</p>
        </div>
        <div className="chart-wrapper large">
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
      <div className="analysis-section">
        <div className="analysis-grid">
          {/* Category Analysis Table */}
          <div className="analysis-card">
            <h3>🏷️ Category Analysis</h3>
            <div className="analysis-table-container">
              <table className="analysis-table">
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
          <div className="analysis-card">
            <h3>🏭 Supplier Analysis</h3>
            <div className="analysis-table-container">
              <table className="analysis-table">
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
        <div className="critical-items-section">
          <h3>🚨 Critical Items Requiring Attention</h3>
          
          {inventoryStats.outOfStockItems.length > 0 && (
            <div className="critical-card danger-card">
              <h4>🚫 Out of Stock Items ({inventoryStats.outOfStockItems.length})</h4>
              <div className="critical-items-grid">
                {inventoryStats.outOfStockItems.map(item => (
                  <div key={item._id} className="critical-item">
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                    <span className="critical-status out-of-stock">OUT OF STOCK</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inventoryStats.lowStockItems.filter(item => item.quantity > 0).length > 0 && (
            <div className="critical-card warning-card">
              <h4>⚠️ Low Stock Items ({inventoryStats.lowStockItems.filter(item => item.quantity > 0).length})</h4>
              <div className="critical-items-grid">
                {inventoryStats.lowStockItems.filter(item => item.quantity > 0).map(item => (
                  <div key={item._id} className="critical-item">
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                    <span className="critical-quantity">{item.quantity} remaining</span>
                    <span className="critical-status low-stock">LOW STOCK</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Executive Summary */}
      <div className="summary-report">
        <h3>📋 Executive Inventory Summary</h3>
        <div className="report-grid">
          <div className="report-section">
            <h4>📊 Inventory Overview</h4>
            <ul>
              <li><strong>Total Items:</strong> {inventoryStats.totalItems}</li>
              <li><strong>Total Quantity:</strong> {inventoryStats.totalQuantity.toLocaleString()}</li>
              <li><strong>Total Value:</strong> ${inventoryStats.totalValue.toLocaleString()}</li>
              <li><strong>Average Item Value:</strong> ${(inventoryStats.totalValue / inventoryStats.totalItems).toFixed(2)}</li>
            </ul>
          </div>
          
          <div className="report-section">
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
          
          <div className="report-section">
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
