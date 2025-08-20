// disposeModal.jsx
import React, { useState } from 'react';
import '../Admin/styles/DisposeModal.css';

const DisposeModal = ({ isOpen, onClose, items, onSuccess, apiBaseUrl }) => {
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

  const handleDispose = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to dispose');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for disposal');
      return;
    }

    setLoading(true);
    try {
      const disposalPromises = selectedItems.map(async (item) => {
        const requestBody = {
          quantityChange: item.disposeQuantity,
          type: 'disposal',
          operation: 'dispose',
          usedBy: 'Admin',
          reason: reason.trim(),
          purpose: `Disposal: ${reason.trim()}`,
          notes: `Item disposed - ${reason.trim()}`,
          timestamp: new Date().toISOString()
        };

        console.log('Disposal request for:', item.name, requestBody);

        let response = await fetch(`${apiBaseUrl}/surgical-items/${item.id}/update-stock`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        let data = await response.json();
        
        if (!data.success && response.status >= 400) {
          console.log('First attempt failed, trying alternative format...');
          
          const altRequestBody = {
            ...requestBody,
            quantityChange: -Math.abs(item.disposeQuantity),
            action: 'dispose',
            updateType: 'disposal'
          };

          response = await fetch(`${apiBaseUrl}/surgical-items/${item.id}/update-stock`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(altRequestBody)
          });
          
          data = await response.json();
        }

        if (!data.success && response.status >= 400) {
          console.log('Second attempt failed, trying direct stock update...');
          
          const directUpdateBody = {
            quantity: item.disposeQuantity,
            operation: 'subtract',
            type: 'disposal',
            reason: reason.trim(),
            usedBy: 'Admin'
          };

          response = await fetch(`${apiBaseUrl}/surgical-items/${item.id}/dispose`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(directUpdateBody)
          });
          
          data = await response.json();
        }

        if (!data.success) {
          throw new Error(`Failed to dispose ${item.name}: ${data.message || 'Unknown error'}`);
        }

        return { success: true, item: item.name };
      });
      
      const results = await Promise.all(disposalPromises);
      console.log('Disposal results:', results);
      
      alert('Items disposed successfully!');
      setSelectedItems([]);
      setReason('');
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error disposing items:', error);
      
      let errorMessage = 'Failed to dispose items: ' + error.message;
      
      if (error.message.includes('Invalid stock update data')) {
        errorMessage = 'Invalid data format. Please check if all required fields are provided and the item quantities are valid.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'API endpoint not found. Please check if the backend service is running correctly.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error occurred. Please check the backend logs for more details.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
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
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleDispose}
              disabled={loading || selectedItems.length === 0}
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
