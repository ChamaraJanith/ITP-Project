// routes/autoRestockRoutes.js
import express from 'express';
import autoRestockService from '../services/autoRestockService.js';
import SurgicalItem from '../model/SurgicalItem.js';

const RestockRouter = express.Router();

// ✅ Manual trigger for auto-restock check
RestockRouter.post('/check-and-restock', async (req, res) => {
  try {
    console.log('🔄 Manual auto-restock check triggered');
    const result = await autoRestockService.checkAndRestockItems();
    
    res.json({
      success: true,
      message: `Auto-restock check completed. Processed ${result.itemsProcessed} items.`,
      data: result
    });
  } catch (error) {
    console.error('❌ Auto-restock API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform auto-restock check',
      error: error.message
    });
  }
});

// ✅ Configure auto-restock for specific item
RestockRouter.post('/configure/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { 
      enabled, 
      maxStockLevel, 
      reorderQuantity, 
      restockMethod,
      supplier 
    } = req.body;

    const updatedItem = await SurgicalItem.findByIdAndUpdate(
      itemId,
      {
        $set: {
          'autoRestock.enabled': enabled,
          'autoRestock.maxStockLevel': maxStockLevel,
          'autoRestock.reorderQuantity': reorderQuantity,
          'autoRestock.restockMethod': restockMethod,
          'autoRestock.supplier': supplier
        }
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Auto-restock configuration updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('❌ Configure auto-restock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to configure auto-restock',
      error: error.message
    });
  }
});

// ✅ Get auto-restock status for all items
RestockRouter.get('/status', async (req, res) => {
  try {
    const items = await SurgicalItem.find({
      'autoRestock.enabled': true
    }).select('name quantity minStockLevel autoRestock');

    const restockStatus = items.map(item => ({
      id: item._id,
      name: item.name,
      currentStock: item.quantity,
      minStock: item.minStockLevel,
      maxStock: item.autoRestock.maxStockLevel,
      needsRestock: item.quantity <= item.minStockLevel,
      lastAutoRestock: item.autoRestock.lastAutoRestock,
      restockCount: item.autoRestock.autoRestockCount
    }));

    res.json({
      success: true,
      data: {
        totalAutoRestockItems: items.length,
        itemsNeedingRestock: restockStatus.filter(item => item.needsRestock).length,
        items: restockStatus
      }
    });

  } catch (error) {
    console.error('❌ Get auto-restock status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-restock status',
      error: error.message
    });
  }
});

export default RestockRouter;
