import React from 'react';
import useSurgicalReport from '../hooks/useSurgicalReport';
import StockBarMini from '../components/StockBarMini';
import PriceTrendMini from '../components/PriceTrendMini';
import './surgicalReport.css';

const SurgicalReport = () => {
  const { items, totals, loading } = useSurgicalReport();
  if (loading) return <p>Loading…</p>;

  return (
    <>
      <h2>Surgical Inventory Report</h2>

      {/* KPI cards */}
      <div className="kpi-cards">
        <div className="kpi"><span>Total SKUs</span><strong>{totals.totalSKUs}</strong></div>
        <div className="kpi"><span>Inventory value</span><strong>${totals.inventoryValue.toFixed(2)}</strong></div>
        <div className="kpi low"><span>Low-stock items</span><strong>{totals.lowStock}</strong></div>
      </div>

      {/* Table */}
      <div className="items-table-container">
        <table className="items-table">
          <thead>
            <tr>
              <th>Item Name</th><th>Category</th><th>Stock Chart</th>
              <th>Quantity</th><th>Min Stock</th><th>Price</th>
              <th>Item Value</th><th>Price Trend</th>
              <th>Status</th><th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const status = it.quantity === 0
                ? 'Out'
                : it.quantity <= it.minStockLevel ? 'Low' : 'OK';
              return (
                <tr key={it._id}>
                  <td>{it.name}</td>
                  <td>{it.category}</td>
                  <td><StockBarMini qty={it.quantity} min={it.minStockLevel} /></td>
                  <td>{it.quantity}</td>
                  <td>{it.minStockLevel}</td>
                  <td>${it.price.toFixed(2)}</td>
                  <td><strong>${(it.price*it.quantity).toFixed(2)}</strong></td>
                  <td><PriceTrendMini history={it.priceHistory} /></td>
                  <td><span className={`status ${status}`}>{status}</span></td>
                  <td>{it.supplier?.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SurgicalReport;
