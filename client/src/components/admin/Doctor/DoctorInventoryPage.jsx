// src/components/admin/Doctor/DoctorInventoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import "./DoctorInventoryPage.css";

const API_BASE_URL = "http://localhost:7000/api/inventory"; // same base used in admin inventory

const DoctorInventoryPage = () => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        if (parsed && (parsed.role === "doctor" || parsed.role === "admin")) {
          setAdmin(parsed);
        } else {
          navigate("/admin/login");
        }
      } catch {
        navigate("/admin/login");
      }
    } else {
      navigate("/admin/login");
    }
  }, [navigate]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/surgical-items?page=1&limit=1000`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data?.items)) {
        throw new Error(data.message || "Failed to fetch items");
      }
      setItems(data.data.items);
      setError("");
    } catch (err) {
      console.error("Load items error:", err);
      setError("Failed to load surgical items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const name = (it.name || "").toLowerCase();
      const desc = (it.description || "").toLowerCase();
      return name.includes(s) || desc.includes(s);
    });
  }, [items, search]);

  const getStatusClass = (quantity, minStockLevel) => {
    const qty = parseInt(quantity) || 0;
    const min = parseInt(minStockLevel) || 0;
    if (qty === 0) return "status-out";
    if (qty <= min) return "status-low";
    return "status-available";
  };

  const getQtyClass = (quantity, minStockLevel) => {
    const qty = parseInt(quantity) || 0;
    const min = parseInt(minStockLevel) || 0;
    if (qty === 0) return "qty-out";
    if (qty <= min) return "qty-low";
    return "qty-available";
  };

  const getStatusText = (quantity, minStockLevel) => {
    const qty = parseInt(quantity) || 0;
    const min = parseInt(minStockLevel) || 0;
    if (qty === 0) return "Out of Stock";
    if (qty <= min) return "Low Stock";
    return "Available";
  };

  // Adjust stock by +/-1 using existing update-stock endpoint
  const handleAdjustStock = async (item, delta) => {
    if (!item || !item._id) return;
    const currentQty = parseInt(item.quantity) || 0;
    if (delta < 0 && currentQty <= 0) return;

    try {
      setUpdatingId(item._id);
      const type = delta > 0 ? "restock" : "usage";
      const quantityChange = 1;

      const res = await fetch(`${API_BASE_URL}/surgical-items/${item._id}/update-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantityChange,
          type,
          usedBy: admin?.name || "Doctor",
          purpose: type === "usage" ? "Doctor stock usage" : "Doctor stock replenishment"
        })
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update stock");
      }

      await loadItems();
    } catch (err) {
      console.error("Adjust stock error:", err);
      alert(`❌ Failed to adjust stock: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout admin={admin} title="Doctor Inventory">
      <div className="doctor-inventory-page">
        <div className="inv-header">
          <h2>🧰 Surgical Inventory</h2>
          <div className="inv-actions">
            <button className="btn" onClick={() => navigate("/admin/doctor")}>
              ← Back to Doctor
            </button>
            <button className="btn btn-accent" onClick={loadItems}>
              ⟳ Refresh
            </button>
          </div>
        </div>

        {error && <div className="inv-error">{error}</div>}

        <div className="inv-search">
          <input
            type="text"
            placeholder="🔍 Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
          />
        </div>

        {loading ? (
          <div className="inv-loading">Loading items...</div>
        ) : (
          <div className="inv-card">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Min</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const qty = parseInt(it.quantity) || 0;
                  const min = parseInt(it.minStockLevel) || 0;
                  const price = parseFloat(it.price) || 0;
                  const statusTxt = getStatusText(qty, min);
                  const statusClass = getStatusClass(qty, min);
                  const qtyClass = getQtyClass(qty, min);
                  const busy = updatingId === it._id;

                  return (
                    <tr key={it._id}>
                      <td>
                        <div className="inv-name">{it.name || "Unknown Item"}</div>
                        {it.description && (
                          <div className="inv-desc">
                            {it.description.substring(0, 60)}
                            {it.description.length > 60 ? "..." : ""}
                          </div>
                        )}
                      </td>
                      <td>{it.category || "Other"}</td>
                      <td className={`inv-qty ${qtyClass}`}>{qty}</td>
                      <td>{min}</td>
                      <td>${price.toFixed(2)}</td>
                      <td>
                        <span className={`status-pill ${statusClass}`}>{statusTxt}</span>
                      </td>
                      <td>{it.supplier?.name || "N/A"}</td>
                      <td>
                        <div className="qty-controls">
                          <button
                            className="btn-minus"
                            onClick={() => handleAdjustStock(it, -1)}
                            disabled={busy || qty === 0}
                            title={qty === 0 ? "No stock to remove" : "Decrease by 1"}
                          >
                            −
                          </button>
                          <button
                            className="btn-plus"
                            onClick={() => handleAdjustStock(it, +1)}
                            disabled={busy}
                            title="Increase by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center" }}>
                      No items match the current search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DoctorInventoryPage;
