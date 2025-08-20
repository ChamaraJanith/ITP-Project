// controller/disposalController.js
import SurgicalItem from '../model/SurgicalItem.js';// Adjust path to your model

export const disposeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, usedBy } = req.body;

    console.log(`🗑️ Disposing item ${id}:`, { quantity, reason, usedBy });

    // Validate input
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity for disposal'
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Disposal reason is required'
      });
    }

    // Find the item
    const item = await SurgicalItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if enough quantity is available
    if (item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${item.quantity}, Requested: ${quantity}`
      });
    }

    // Update the quantity
    const originalQuantity = item.quantity;
    item.quantity -= quantity;
    
    // Add to history if supported
    if (item.history && Array.isArray(item.history)) {
      item.history.push({
        action: 'disposal',
        quantity: -quantity,
        reason: reason.trim(),
        usedBy: usedBy || 'Admin',
        timestamp: new Date(),
        previousQuantity: originalQuantity,
        newQuantity: item.quantity
      });
    }

    await item.save();

    console.log(`✅ Successfully disposed ${quantity} units of ${item.name}`);

    res.json({
      success: true,
      message: `Successfully disposed ${quantity} units of ${item.name}`,
      item: {
        id: item._id,
        name: item.name,
        previousQuantity: originalQuantity,
        newQuantity: item.quantity,
        disposedQuantity: quantity
      }
    });

  } catch (error) {
    console.error('❌ Error disposing item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during disposal',
      error: error.message
    });
  }
};

// You can add more disposal-related functions here in the future
export const getDisposalHistory = async (req, res) => {
  // Future functionality for getting disposal history
};

export const bulkDispose = async (req, res) => {
  // Future functionality for bulk disposal
};
