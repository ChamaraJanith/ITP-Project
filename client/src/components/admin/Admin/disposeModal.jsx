// src/components/admin/DisposeModal.jsx

import React, { useState } from 'react';
import '../Admin/styles/DisposeModal.css';

const DisposeModal = ({
  isOpen,
  onClose,
  items,
  onSuccess,
  apiBaseUrl,
  showNotification,
  admin
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentInventory, setCurrentInventory] = useState([]);
  const [errors, setErrors] = useState({});
  const API_BASE_URL = 'http://localhost:7000/api/disposalrecords';

  

  const validateQuantity = (itemId, value) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return { isValid: true, value: 0 };
    
    
    // Parse as integer
    const numValue = parseInt(value, 10);
    
    // Check if value is a number
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Please enter a valid number', value: 0 };
    }
    
    // Check if value is negative
    if (numValue < 0) {
      return { isValid: false, error: 'Quantity cannot be negative', value: 0 };
    }
    
    // Check if value exceeds available quantity
    if (numValue > item.quantity) {
      return { 
        isValid: false, 
        error: `Cannot exceed available quantity (${item.quantity})`, 
        value: item.quantity 
      };
    }
    
    return { isValid: true, value: numValue };
  };

  const handleItemSelect = (itemId, value) => {
    const validation = validateQuantity(itemId, value);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [itemId]: validation.isValid ? '' : validation.error
    }));
    
    setSelectedItems(prev => {
      const ex = prev.find(i => i.id === itemId);
      if (ex) {
        if (validation.value === 0) return prev.filter(i => i.id !== itemId);
        return prev.map(i => i.id === itemId ? { ...i, disposeQuantity: validation.value } : i);
      }
      if (validation.value > 0) {
        const it = items.find(x => x._id === itemId);
        return [...prev, { id: itemId, name: it.name, disposeQuantity: validation.value }];
      }
      return prev;
    });
  };

  const handleInputChange = (itemId, e) => {
    // Only allow numbers, backspace, delete, tab, escape, enter
    const validKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (e.key && !validKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Get the current value and append the new key if it's a digit
    const currentValue = e.target.value;
    let newValue = currentValue;
    
    if (/^\d$/.test(e.key)) {
      newValue = currentValue + e.key;
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      // Let the browser handle backspace/delete
      return;
    }
    
    // Validate the new value
    const validation = validateQuantity(itemId, newValue);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [itemId]: validation.isValid ? '' : validation.error
    }));
    
    // Update selected items
    handleItemSelect(itemId, validation.value);
  };

  const handleDispose = async () => {
    // Check if there are any validation errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      showNotification?.('Please fix validation errors before disposing', 'warning');
      return;
    }
    
    if (!selectedItems.length || !reason.trim()) {
      showNotification?.('Select items & enter reason', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dispose-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsToDispose: selectedItems.map(i => ({
            itemId: i.id,
            quantityToDispose: i.disposeQuantity,
            reason,
            disposedBy: admin.name
          }))
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      showNotification?.(data.message, data.success ? 'success' : 'error');
      if (data.success) { 
        onSuccess(); 
        onClose(); 
        // Reset form state
        setSelectedItems([]);
        setReason('');
        setErrors({});
      }
    } catch (err) {
      console.error('Dispose error:', err);
      showNotification?.('Failed to dispose items. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      // Fetch both history and current inventory
      const [historyRes, inventoryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/disposal-history`),  // ✅ Now correct
        fetch(`${API_BASE_URL}/items`) 
      ]);
      
      if (!historyRes.ok || !inventoryRes.ok) {
        throw new Error('Failed to fetch data from server');
      }
      
      const historyData = await historyRes.json();
      const inventoryData = await inventoryRes.json();
      
      const disposals = historyData?.data?.disposals;
      const inventoryItems = inventoryData?.data?.items || [];
      
      setHistory(Array.isArray(disposals) ? disposals : []);
      setCurrentInventory(inventoryItems);
    } catch (err) {
      console.error('Fetch history error:', err);
      showNotification?.('Failed to load disposal history', 'error');
      setHistory([]);
      setCurrentInventory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const downloadHistoryPdf = async () => {
    if (history.length === 0) {
      showNotification?.('No history to download', 'warning');
      return;
    }

    setPdfDownloading(true);
    try {
      // Dynamically import jsPDF and autoTable to avoid bundling issues
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Disposal History Report', 105, 15, { align: 'center' });
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
      
      // Prepare table data
      const tableData = history.map((record, index) => {
        // Find current inventory for this item
        const currentItem = currentInventory.find(item => item._id === record.itemId);
        const currentQuantity = currentItem ? currentItem.quantity : 0;
        
        return [
          index + 1,
          record.itemName,
          record.quantityDisposed,
          currentQuantity,
          new Date(record.disposalDate).toLocaleDateString(),
          new Date(record.disposalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          record.disposedBy,
          record.reason
        ];
      });
      
      // Define table headers
      const headers = [
        ['#', 'Item', 'Disposed Qty', 'Current Qty', 'Date', 'Time', 'Disposed By', 'Reason']
      ];
      
      // Add table to PDF
      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 30,
        theme: 'grid',
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 8 },  // #
          1: { cellWidth: 25 }, // Item
          2: { cellWidth: 15 }, // Disposed Qty
          3: { cellWidth: 15 }, // Current Qty
          4: { cellWidth: 20 }, // Date
          5: { cellWidth: 18 }, // Time
          6: { cellWidth: 25 }, // Disposed By
          7: { cellWidth: 'auto' } // Reason
        },
        margin: { top: 30, left: 8, right: 8 }
      });
      
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save('disposal-history.pdf');
      showNotification?.('PDF downloaded successfully', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      showNotification?.('Failed to generate PDF', 'error');
    } finally {
      setPdfDownloading(false);
    }
  };

  const clearHistory = async () => {
    if (history.length === 0) {
      showNotification?.('No history to clear', 'warning');
      return;
    }

    setClearingHistory(true);
    try {
      // Use DELETE method to clear all disposal history records
       const res = await fetch(`${API_BASE_URL}/disposal-history`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clearedBy: admin.name,
          clearAll: true
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // Refresh the history from database to ensure consistency
        await fetchHistory();
        showNotification?.('Disposal history cleared successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to clear history');
      }
    } catch (err) {
      console.error('Clear history error:', err);
      showNotification?.('Failed to clear disposal history. Please try again.', 'error');
    } finally {
      setClearingHistory(false);
      setShowClearConfirm(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="modal-backdrop">
      <div className="dispose-modal-content">
        <div className="dispose-modal-header">
          <h2>🗑️ Dispose Items</h2>
          <button className="disposal-close-btn" onClick={onClose} type="button">×</button>
        </div>

        {!showHistory ? (
          <>
            <div className="dispose-modal-body">
              <textarea
                placeholder="Reason for disposal"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
              <div className="items-list">
                {items.map(item => {
                  const sel = selectedItems.find(i => i.id === item._id);
                  const qty = sel?.disposeQuantity || 0;
                  const error = errors[item._id] || '';
                  
                  return (
                    <div key={item._id} className="dispose-item-row">
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">Available: {item.quantity}</span>
                      </div>
                      <div className="input-container">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          max={item.quantity}
                          value={qty}
                          onChange={e => handleItemSelect(item._id, e.target.value)}
                          onKeyDown={e => handleInputChange(item._id, e)}
                          className={error ? 'error-input' : ''}
                        />
                        {error && <div className="error-message">{error}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="dispose-modal-footer">
              <button className="btn btn-danger" onClick={handleDispose} disabled={loading} type="button">
                {loading ? 'Disposing...' : 'Dispose Items'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowHistory(true); fetchHistory(); }} type="button">
                📋 View History
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="history-header">
              <button className="back-btn" onClick={() => setShowHistory(false)} type="button">
                ← Back
              </button>
              <h3>📋 Disposal History</h3>
              <div className="history-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={downloadHistoryPdf} 
                  disabled={pdfDownloading || historyLoading || history.length === 0} 
                  type="button"
                >
                  {pdfDownloading ? 'Generating...' : '📄 Download PDF'}
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => setShowClearConfirm(true)} 
                  disabled={clearingHistory || historyLoading || history.length === 0} 
                  type="button"
                >
                  {clearingHistory ? 'Clearing...' : '🗑️ Clear History'}
                </button>
              </div>
            </div>
            
            {showClearConfirm && (
              <div className="confirm-dialog">
                <div className="confirm-content">
                  <h4>Confirm Action</h4>
                  <p>Are you sure you want to clear all disposal history? This action cannot be undone.</p>
                  <div className="confirm-buttons">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setShowClearConfirm(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={clearHistory}
                      disabled={clearingHistory}
                      type="button"
                    >
                      {clearingHistory ? 'Clearing...' : 'Clear History'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="history-body">
              {historyLoading ? (
                <p>Loading history...</p>
              ) : history.length === 0 ? (
                <p>No disposal records found.</p>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Disposed Qty</th>
                      <th>Current Qty</th>
                      <th>Date</th>
                      <th>By</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r, i) => {
                      // Find current inventory for this item
                      const currentItem = currentInventory.find(item => item._id === r.itemId);
                      const currentQuantity = currentItem ? currentItem.quantity : 0;
                      
                      return (
                        <tr key={r.id}>
                          <td>{i+1}</td>
                          <td>{r.itemName}</td>
                          <td>{r.quantityDisposed}</td>
                          <td className={currentQuantity === 0 ? 'out-of-stock' : ''}>
                            {currentQuantity}
                          </td>
                          <td>{new Date(r.disposalDate).toLocaleString()}</td>
                          <td>{r.disposedBy}</td>
                          <td>{r.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DisposeModal;
