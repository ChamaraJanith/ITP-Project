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
import './styles/InventoryTotalView.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryTotalView = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Use passed state only
  const items = state?.inventoryItems || [];
  const stats = state?.inventoryStats;

  if (!items.length || !stats) {
    return (
      <div className="itv-unique-inventory-total-view">
        <div className="itv-unique-error-container">
          <div className="itv-unique-error-content">
            <h2>⚠️ No Inventory Data Available</h2>
            <p>Please navigate from the Payment Management page to view the inventory analysis.</p>
            <button onClick={() => navigate('/admin/financial/payments')} className="itv-unique-back-btn">
              ← Back to Payments Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalItems,
    totalQuantity,
    totalValue,
    lowStockCount,
    outOfStockCount,
    categoryBreakdown,
    supplierBreakdown
  } = stats;

  const stockStatusData = { labels: ['Available','Low Stock','Out of Stock'], datasets:[{ data:[ totalItems-lowStockCount, lowStockCount-outOfStockCount, outOfStockCount ], backgroundColor:['#28a745','#ffc107','#dc3545'], borderWidth:2 }]};
  const categoryChartData = { labels:Object.keys(categoryBreakdown), datasets:[{ label:'Value by Category', data:Object.values(categoryBreakdown).map(c=>c.totalValue), backgroundColor:['#4BC0C0','#FF6384','#36A2EB','#FFCE56','#9966FF','#FF9F40'], borderWidth:2 }]};
  const supplierChartData = { labels:Object.keys(supplierBreakdown).slice(0,10), datasets:[{ label:'Item Count', data:Object.values(supplierBreakdown).slice(0,10).map(s=>s.count), backgroundColor:'#36A2EB' },{ label:'Total Value', data:Object.values(supplierBreakdown).slice(0,10).map(s=>s.totalValue), backgroundColor:'#4BC0C0' }]};

  return (
    <div className="itv-unique-inventory-total-view">
      <header className="itv-unique-page-header">
        <h1>📦 Inventory Analysis & Reports</h1>
        <div className="itv-unique-header-actions">
          <button onClick={() => navigate('/admin/financial/payments')} className="itv-unique-back-btn">← Back to Payments Management</button>
          <button onClick={() => window.print()} className="itv-unique-print-btn">🖨️ Print</button>
        </div>
      </header>

      <section className="itv-unique-summary-grid">
        {[
          { icon:'📦', title: totalItems, label:'Total Items' },
          { icon:'📊', title: totalQuantity, label:'Total Quantity' },
          { icon:'💰', title:`₨${totalValue.toLocaleString()}`, label:'Total Value' },
          { icon:'⚠️', title: lowStockCount, label:'Low Stock' },
          { icon:'🚫', title: outOfStockCount, label:'Out of Stock' },
          { icon:'📈', title:`₨${(totalValue/totalItems).toFixed(2)}`, label:'Avg Value' }
        ].map((c,i)=>(
          <div key={i} className="itv-unique-summary-card">
            <span>{c.icon}</span>
            <div><h2>{c.title}</h2><p>{c.label}</p></div>
          </div>
        ))}
      </section>

      <section className="itv-unique-charts-section">
        <div className="itv-unique-chart-container">
          <h3>📊 Stock Status Overview</h3>
          <Doughnut data={stockStatusData} options={{ maintainAspectRatio:false }} />
        </div>
        <div className="itv-unique-chart-container">
          <h3>🏷️ Category Breakdown</h3>
          <Pie data={categoryChartData} options={{ maintainAspectRatio:false }} />
        </div>
        <div className="itv-unique-chart-container itv-unique-full-width">
          <h3>🏭 Supplier Analysis</h3>
          <Bar data={supplierChartData} options={{ maintainAspectRatio:false }} />
        </div>
      </section>

      <section className="itv-unique-analysis-section">
        <h3>📋 Executive Summary</h3>
        <ul>
          <li><strong>Total Items:</strong> {totalItems}</li>
          <li><strong>Total Quantity:</strong> {totalQuantity}</li>
          <li><strong>Total Value:</strong> ₨{totalValue.toLocaleString()}</li>
          <li><strong>Low Stock:</strong> {lowStockCount}</li>
          <li><strong>Out of Stock:</strong> {outOfStockCount}</li>
          <li><strong>Avg Item Value:</strong> ₨{(totalValue/totalItems).toFixed(2)}</li>
        </ul>
      </section>
    </div>
  );
};

export default InventoryTotalView;
