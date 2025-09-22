import SurgicalItem from '../model/SurgicalItem.js';
import mongoose from 'mongoose';

// 🔥 SINGLE ITEM DISPOSAL
export const disposeItem = async (req, res) => {
  try {
    console.log(`🗑️ Disposal request received for ID: ${req.params.id}`);
    console.log(`📥 Request body:`, req.body);
    
    const itemId = req.params.id;
    const {
      quantity,
      quantityToDispose,
      quantityChange,
      reason,
      disposedBy,
      usedBy,
      type,
      operation,
      purpose,
      notes
    } = req.body;

    // Determine disposal quantity from various possible field names
    let disposeAmount = 0;
    if (quantity !== undefined) disposeAmount = Math.abs(parseInt(quantity));
    else if (quantityToDispose !== undefined) disposeAmount = Math.abs(parseInt(quantityToDispose));
    else if (quantityChange !== undefined) disposeAmount = Math.abs(parseInt(quantityChange));
    else {
      return res.status(400).json({
        success: false,
        message: 'No disposal quantity specified. Use quantity, quantityToDispose, or quantityChange.'
      });
    }

    console.log(`📊 Calculated disposal amount: ${disposeAmount}`);

    if (disposeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Disposal quantity must be greater than 0'
      });
    }

    // Validate item ID
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    // Find the item
    const item = await SurgicalItem.findById(itemId);
    if (!item) {
      console.log(`❌ Item not found: ${itemId}`);
      return res.status(404).json({
        success: false,
        message: 'Surgical item not found'
      });
    }

    console.log(`📋 Item found: ${item.name}, Current quantity: ${item.quantity}`);

    // Check sufficient quantity
    if (item.quantity < disposeAmount) {
      console.log(`❌ Insufficient quantity: Available ${item.quantity}, Requested ${disposeAmount}`);
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${item.quantity}, Requested: ${disposeAmount}`
      });
    }

    // Store original quantity for history
    const originalQuantity = item.quantity;

    // Update quantity
    item.quantity = Math.max(0, item.quantity - disposeAmount);

    // Initialize disposal history if it doesn't exist
    if (!item.disposalHistory) {
      item.disposalHistory = [];
    }

    // Add disposal record
    const disposalRecord = {
      quantityDisposed: disposeAmount,
      reason: reason || 'No reason provided',
      disposedBy: disposedBy || usedBy || 'Unknown User',
      disposalDate: new Date(),
      previousQuantity: originalQuantity,
      remainingQuantity: item.quantity,
      disposalType: type || 'manual',
      operation: operation || 'dispose',
      purpose: purpose || `Disposal: ${reason || 'No reason provided'}`,
      notes: notes || '',
      timestamp: new Date()
    };

    item.disposalHistory.push(disposalRecord);

    // Keep only last 100 disposal records
    if (item.disposalHistory.length > 100) {
      item.disposalHistory = item.disposalHistory.slice(-100);
    }

    // Save the updated item
    await item.save();

    console.log(`✅ Successfully disposed ${disposeAmount} units of ${item.name}`);
    console.log(`📊 Remaining quantity: ${item.quantity}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully disposed ${disposeAmount} units of ${item.name}`,
      data: {
        itemId: item._id,
        itemName: item.name,
        quantityDisposed: disposeAmount,
        previousQuantity: originalQuantity,
        remainingQuantity: item.quantity,
        disposalDate: disposalRecord.disposalDate,
        disposalId: disposalRecord._id
      }
    });

  } catch (error) {
    console.error('❌ Disposal error:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during disposal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// 🔥 BULK DISPOSAL (Multiple items at once)
export const bulkDisposeItems = async (req, res) => {
  try {
    console.log('🗑️ Bulk disposal request received');
    console.log('📥 Request body:', req.body);

    const { itemsToDispose, batchDisposal, preserveCumulativePurchases } = req.body;

    if (!itemsToDispose || !Array.isArray(itemsToDispose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid disposal data. Expected itemsToDispose array.'
      });
    }

    if (itemsToDispose.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items specified for disposal'
      });
    }

    console.log(`📊 Processing ${itemsToDispose.length} items for disposal`);

    const results = [];
    let totalSuccessful = 0;
    let totalFailed = 0;

    // Process each item
    for (const disposeItem of itemsToDispose) {
      try {
        const {
          itemId,
          itemName,
          quantityToDispose,
          reason,
          disposedBy
        } = disposeItem;

        console.log(`🎯 Processing: ${itemName} (ID: ${itemId})`);

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          results.push({
            itemId,
            itemName: itemName || 'Unknown',
            success: false,
            message: 'Invalid item ID format'
          });
          totalFailed++;
          continue;
        }

        const item = await SurgicalItem.findById(itemId);
        if (!item) {
          results.push({
            itemId,
            itemName: itemName || 'Unknown',
            success: false,
            message: 'Item not found'
          });
          totalFailed++;
          continue;
        }

        const disposeAmount = parseInt(quantityToDispose) || 0;
        if (disposeAmount <= 0) {
          results.push({
            itemId,
            itemName: item.name,
            success: false,
            message: 'Invalid disposal quantity'
          });
          totalFailed++;
          continue;
        }

        if (item.quantity < disposeAmount) {
          results.push({
            itemId,
            itemName: item.name,
            success: false,
            message: `Insufficient quantity. Available: ${item.quantity}`
          });
          totalFailed++;
          continue;
        }

        // Update item
        const originalQuantity = item.quantity;
        item.quantity = Math.max(0, item.quantity - disposeAmount);

        // Add disposal history
        if (!item.disposalHistory) {
          item.disposalHistory = [];
        }

        const disposalRecord = {
          quantityDisposed: disposeAmount,
          reason: reason || 'Bulk disposal',
          disposedBy: disposedBy || 'System',
          disposalDate: new Date(),
          previousQuantity: originalQuantity,
          remainingQuantity: item.quantity,
          disposalType: 'bulk',
          batchDisposal: true
        };

        item.disposalHistory.push(disposalRecord);

        // Save item
        await item.save();

        results.push({
          itemId,
          itemName: item.name,
          success: true,
          quantityDisposed: disposeAmount,
          previousQuantity: originalQuantity,
          remainingQuantity: item.quantity,
          message: `Successfully disposed ${disposeAmount} units`
        });

        totalSuccessful++;
        console.log(`✅ Successfully disposed: ${item.name}`);

      } catch (itemError) {
        console.error(`❌ Error disposing item ${disposeItem.itemName}:`, itemError);
        results.push({
          itemId: disposeItem.itemId,
          itemName: disposeItem.itemName || 'Unknown',
          success: false,
          message: itemError.message || 'Unknown error occurred'
        });
        totalFailed++;
      }
    }

    console.log(`📊 Bulk disposal completed: ${totalSuccessful} successful, ${totalFailed} failed`);

    // Return comprehensive results
    res.status(200).json({
      success: true,
      message: `Bulk disposal completed. ${totalSuccessful} successful, ${totalFailed} failed.`,
      data: {
        itemsProcessed: itemsToDispose.length,
        successCount: totalSuccessful,
        failureCount: totalFailed,
        results: results,
        batchDisposal: batchDisposal || false,
        preserveCumulativePurchases: preserveCumulativePurchases || false
      }
    });

  } catch (error) {
    console.error('❌ Bulk disposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk disposal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// 🔥 GET DISPOSAL HISTORY
export const getDisposalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    let query = {};
    
    // If specific item ID provided, filter by that item
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    }

    const items = await SurgicalItem.find(query)
      .select('name disposalHistory')
      .populate('disposalHistory');

    // Collect all disposal records
    let allDisposals = [];
    
    items.forEach(item => {
      if (item.disposalHistory && item.disposalHistory.length > 0) {
        item.disposalHistory.forEach(disposal => {
          allDisposals.push({
            itemId: item._id,
            itemName: item.name,
            ...disposal.toObject()
          });
        });
      }
    });

    // Sort by disposal date (newest first)
    allDisposals.sort((a, b) => new Date(b.disposalDate) - new Date(a.disposalDate));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedDisposals = allDisposals.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        disposals: paginatedDisposals,
        totalDisposals: allDisposals.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(allDisposals.length / limit),
        hasMore: endIndex < allDisposals.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching disposal history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching disposal history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// 🔥 GET DISPOSAL STATS
export const getDisposalStats = async (req, res) => {
  try {
    const items = await SurgicalItem.find({})
      .select('name disposalHistory price');

    let totalDisposals = 0;
    let totalValue = 0;
    let disposalsByMonth = {};

    items.forEach(item => {
      if (item.disposalHistory && item.disposalHistory.length > 0) {
        item.disposalHistory.forEach(disposal => {
          totalDisposals += disposal.quantityDisposed;
          totalValue += (disposal.quantityDisposed * (parseFloat(item.price) || 0));

          // Group by month
          const month = new Date(disposal.disposalDate).toISOString().substring(0, 7);
          if (!disposalsByMonth[month]) {
            disposalsByMonth[month] = { quantity: 0, value: 0, count: 0 };
          }
          disposalsByMonth[month].quantity += disposal.quantityDisposed;
          disposalsByMonth[month].value += (disposal.quantityDisposed * (parseFloat(item.price) || 0));
          disposalsByMonth[month].count += 1;
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalDisposals,
        totalValue,
        disposalsByMonth,
        itemsWithDisposals: items.filter(item => item.disposalHistory?.length > 0).length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching disposal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching disposal stats'
    });
  }
};

export default {
  disposeItem,
  bulkDisposeItems,
  getDisposalHistory,
  getDisposalStats
};
