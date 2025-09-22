// disposeModal.jsx - Fixed Version
import React, { useState } from 'react';
import '../Admin/styles/DisposeModal.css';

// PDF generation imports
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DisposeModal = ({ isOpen, onClose, items, onSuccess, apiBaseUrl, showNotification, admin }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleItemSelect = (itemId, quantity) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        if (quantity === 0) {
          return prev.filter(item => item.id !== itemId);
        }
        return prev.map(item =>
          item.id === itemId ? { ...item, disposeQuantity: quantity } : item
        );
      } else if (quantity > 0) {
        const item = items.find(i => i._id === itemId);
        return [...prev, {
          id: itemId,
          name: item.name,
          disposeQuantity: quantity,
          maxQuantity: item.quantity
        }];
      }
      return prev;
    });
  };

  // 🔥 FIXED: Safe API call with proper error handling
  const safeApiCall = async (url, options = {}) => {
    try {
      console.log(`🌐 Making API call to: ${url}`);
      console.log(`📤 Request options:`, options);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });

      console.log(`📥 Response status: ${response.status}`);

      // Get response text first
      const responseText = await response.text();
      console.log(`📥 Response text:`, responseText);

      // Handle empty responses
      if (!responseText || responseText.trim() === '') {
        if (response.ok) {
          return { success: true, message: 'Operation completed successfully' };
        } else {
          throw new Error(`Empty response with status ${response.status}`);
        }
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        
        // Check if response looks like success
        if (response.ok && (
          responseText.toLowerCase().includes('success') ||
          responseText.toLowerCase().includes('updated') ||
          responseText.toLowerCase().includes('disposed')
        )) {
          return { success: true, message: responseText };
        }
        
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      console.log(`✅ Parsed JSON:`, data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;

    } catch (error) {
      console.error(`❌ API call failed:`, error);
      throw error;
    }
  };

  // 🔥 FIXED: Updated disposal handler with better error handling
// In your disposeModal.jsx, update the disposal call to:
const handleDispose = async () => {
  if (selectedItems.length === 0) {
    showNotification?.('Please select at least one item to dispose', 'warning');
    return;
  }

  if (!reason.trim()) {
    showNotification?.('Please provide a reason for disposal', 'warning');
    return;
  }

  setLoading(true);
  
  try {
    // Prepare disposal data
    const itemsToDispose = selectedItems.map(item => ({
      itemId: item.id,
      itemName: item.name,
      quantityToDispose: item.disposeQuantity,
      reason: reason.trim(),
      disposedBy: admin?.name || 'Admin'
    }));

    console.log('🗑️ Sending disposal request:', itemsToDispose);

    const response = await fetch(`${apiBaseUrl}/dispose-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        itemsToDispose: itemsToDispose,
        batchDisposal: true,
        preserveCumulativePurchases: true
      })
    });

    const responseText = await response.text();
    console.log('📥 Response text:', responseText);

    let data;
    if (responseText.trim() === '') {
      data = { success: true, message: 'Items disposed successfully' };
    } else {
      data = JSON.parse(responseText);
    }

    if (data.success) {
      const message = `✅ ${data.message || 'Items disposed successfully!'}`;
      showNotification?.(message, 'success');
      
      // Reset and close
      setSelectedItems([]);
      setReason('');
      onSuccess?.();
      onClose?.();
    } else {
      throw new Error(data.message || 'Disposal failed');
    }

  } catch (error) {
    console.error('❌ Disposal error:', error);
    showNotification?.(`❌ Failed to dispose items: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

  // Generate Disposal PDF Report
  const generateDisposalPDF = () => {
    if (!selectedItems || selectedItems.length === 0) {
      showNotification?.('Please select at least one item to include in the disposal report', 'warning') || 
      alert('Please select at least one item to include in the disposal report');
      return;
    }

    try {
      // Helpers
      const money = (n) => `$${(Number(n || 0)).toFixed(2)}`;
      const safe = (v, alt = '-') => (v === null || v === undefined || v === '' ? alt : v);
      const dmy = (v) => {
        try {
          const d = new Date(v);
          if (isNaN(d.getTime())) return '-';
          return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
        } catch { return '-'; }
      };

      // Compose rows from selected items, enrich from items array
      let totalDisposedUnits = 0;
      let totalValueDisposed = 0;

      const rows = selectedItems.map((sel, idx) => {
        const full = items.find(i => i._id === sel.id) || {};
        const available = parseInt(full.quantity) || 0;
        const price = parseFloat(full.price) || 0;
        const disp = parseInt(sel.disposeQuantity) || 0;
        const remaining = Math.max(0, available - disp);
        const lineValue = disp * price;
        totalDisposedUnits += disp;
        totalValueDisposed += lineValue;

        return [
          String(idx + 1).padStart(3, '0'),                              // S/N
          safe(full.name, 'Unknown').substring(0, 30),                    // Item
          safe(full.category, 'Other').substring(0, 18),                  // Category
          String(available),                                              // Available
          String(disp),                                                   // Dispose
          String(remaining),                                              // Remaining
          money(price),                                                   // Unit Value
          money(lineValue),                                               // Total Value
          safe(reason, '-').substring(0, 40)                              // Notes
        ];
      });

      // PDF setup
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let currentY = 15;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('HealX Healthcare Center', pageWidth / 2, currentY, { align: 'center' });

      currentY += 6;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Inventory Disposal Report', pageWidth / 2, currentY, { align: 'center' });

      currentY += 5;
      doc.setFontSize(10);
      doc.text('Department of Medical Equipment & Supplies', pageWidth / 2, currentY, { align: 'center' });

      // Separator
      currentY += 6;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(15, currentY, pageWidth - 15, currentY);

      // Metadata
      currentY += 8;
      doc.setFontSize(9);
      const now = new Date();
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      }) + ' IST';
      const reportId = `DSP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Report Date: ${dateString} | Time: ${timeString} | Items Selected: ${selectedItems.length} | Report ID: ${reportId}`,
        pageWidth / 2, currentY, { align: 'center' }
      );

      // Reason + Summary band
      currentY += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DISPOSAL SUMMARY', 20, currentY);

      const bandY = currentY + 2;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(20, bandY, pageWidth - 40, 16);

      currentY += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const sum1 = [
        `Total Items: ${selectedItems.length}`,
        `Total Units: ${totalDisposedUnits}`,
        `Estimated Value: ${money(totalValueDisposed)}`,
        `Reason: ${safe(reason, '-')}`
      ];

      sum1.forEach((txt, i) => {
        const x = 25 + i * 75;
        doc.setFont('helvetica', 'bold');
        doc.text(txt, x, currentY + 1);
      });

      currentY += 14;

      // Disposal table
      autoTable(doc, {
        startY: currentY,
        head: [[
          'S/N',
          'Item',
          'Category',
          'Available',
          'Dispose',
          'Remaining',
          'Unit Value',
          'Total Value',
          'Notes'
        ]],
        body: rows,
        theme: 'plain',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 }
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 7,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 }
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 46, halign: 'left' },
          2: { cellWidth: 24, halign: 'center' },
          3: { cellWidth: 16, halign: 'right' },
          4: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
          8: { cellWidth: 40, halign: 'left' },
        },
        didParseCell: (data) => {
          const rowIndex = data.row.index;
          data.cell.styles.fillColor = rowIndex % 2 === 0 ? [248, 248, 248] : [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.lineColor = [0, 0, 0];
        },
        margin: { top: 10, left: 15, right: 15, bottom: 20 },
        styles: {
          overflow: 'linebreak',
          fontSize: 7,
          cellPadding: { top: 2, right: 1, bottom: 2, left: 1 },
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.3
        },
        showHead: 'firstPage',
        showFoot: 'never'
      });

      const finalY = (doc).lastAutoTable?.finalY || (currentY + 10);

      // Verification box if space allows
      const spaceLeft = pageHeight - finalY;
      if (spaceLeft > 28) {
        const boxY = finalY + 6;
        const boxX = 15;
        const boxW = pageWidth - 30;
        const boxH = 18;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(boxX, boxY, boxW, boxH);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DISPOSAL VERIFICATION', boxX + 4, boxY + 6);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lineY = boxY + 12;
        doc.text('Prepared by: ______________________', boxX + 4, lineY);
        doc.text('Reviewed by: ______________________', boxX + 120, lineY);
        doc.text('Date: ____________', boxX + 4, lineY + 7);
        doc.text('Date: ____________', boxX + 120, lineY + 7);
      }

      // Footer
      const footerY = pageHeight - 10;
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `HealX Healthcare Center - Confidential | Page 1 of 1 | Generated: ${now.toLocaleDateString()}`,
        pageWidth / 2, footerY, { align: 'center' }
      );

      const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `HealX_Disposal_Report_${timestamp}.pdf`;
      doc.save(filename);

      showNotification?.('✅ Disposal report PDF generated successfully!', 'success');

    } catch (pdfError) {
      console.error('❌ PDF generation error:', pdfError);
      showNotification?.('❌ Failed to generate PDF report', 'error') || alert('Failed to generate PDF report');
    }
  };

  const handleClose = () => {
    setSelectedItems([]);
    setReason('');
    onClose();
  };

  const getSelectedQuantity = (itemId) => {
    const selected = selectedItems.find(item => item.id === itemId);
    return selected ? selected.disposeQuantity : 0;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="dispose-modal-content">
        <div className="dispose-modal-header">
          <h2>🗑️ Dispose Items</h2>
          <button className="close-btn" onClick={handleClose}>&times;</button>
        </div>

        <div className="dispose-modal-body">
          <div className="dispose-reason">
            <label htmlFor="disposal-reason">
              Reason for Disposal <span className="required">*</span>
            </label>
            <textarea
              id="disposal-reason"
              placeholder="Enter the reason for disposing these items..."
              maxLength="500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="character-count">{reason.length}/500 characters</div>
          </div>

          <div className="items-selection">
            <h3>Select Items to Dispose:</h3>
            <div className="items-list">
              {items?.map((item) => {
                const selectedQuantity = getSelectedQuantity(item._id);
                return (
                  <div
                    key={item._id}
                    className={`dispose-item-row ${selectedQuantity > 0 ? 'has-quantity' : ''}`}
                  >
                    <div className="item-details">
                      <strong className="item-name">{item.name}</strong>
                      <div className="item-info">
                        <span>Available: {item.quantity}</span>
                        <span>Category: {item.category}</span>
                        <span>Price: ${parseFloat(item.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="quantity-input">
                      <label>Dispose:</label>
                      <div className="quantity-controls">
                        <input
                          type="number"
                          value={selectedQuantity}
                          min="0"
                          max={item.quantity}
                          onChange={(e) => handleItemSelect(item._id, parseInt(e.target.value) || 0)}
                        />
                        <span className="max-quantity">/ {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dispose-modal-footer">
          <div className="selected-count">
            {selectedItems.length} item(s) selected for disposal
            {selectedItems.length > 0 && (
              <span className="total-value">
                (Estimated value: $
                {selectedItems.reduce((total, sel) => {
                  const item = items.find(i => i._id === sel.id);
                  return total + (parseFloat(item?.price || 0) * sel.disposeQuantity);
                }, 0).toFixed(2)})
              </span>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={generateDisposalPDF}
              disabled={loading || selectedItems.length === 0}
              title="Generate Disposal Report PDF"
            >
              📄 Generate PDF
            </button>

            <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDispose}
              disabled={loading || selectedItems.length === 0 || !reason.trim()}
            >
              {loading ? 'Disposing...' : 'Dispose Items'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisposeModal;
