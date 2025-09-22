import express from 'express';
import autoRestockService from '../services/autoRestockService.js';
import SurgicalItem from '../model/SurgicalItem.js';

const RestockRouter = express.Router();

// ✅ Manual trigger for auto-restock check (fixed)
RestockRouter.post('/check-and-restock', async (req, res) => {
  try {
    console.log('🔄 Manual auto-restock check triggered');
    
    // Extract filtering parameters from frontend
    const { 
      respectManualQuantities = true, 
      preserveValue = true, 
      lowStockItems = null, 
      processOnlyLowStock = true 
    } = req.body;
    
    console.log('📋 Processing with options:', {
      respectManualQuantities,
      preserveValue,
      processOnlyLowStock,
      lowStockItemsCount: lowStockItems?.length || 0
    });
    
    // Call service with proper filtering
    const result = await autoRestockService.checkAndRestockItems({
      respectManualQuantities,
      preserveValue,
      processOnlyLowStock,
      lowStockItems
    });
    
    res.json({
      success: true,
      message: result.message || `Auto-restock completed. Processed ${result.itemsProcessed} low stock items with total value $${result.totalRestockValue?.toFixed(2) || '0.00'}.`,
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

// ✅ Get items that need restocking
RestockRouter.get('/items-needing-restock', async (req, res) => {
  try {
    const result = await autoRestockService.getItemsNeedingRestock();
    res.json(result);
  } catch (error) {
    console.error('❌ Get items needing restock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get items needing restock',
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
    }).select('name quantity minStockLevel autoRestock price');

    const restockStatus = items.map(item => ({
      id: item._id,
      name: item.name,
      currentStock: item.quantity,
      minStock: item.minStockLevel,
      maxStock: item.autoRestock.maxStockLevel,
      needsRestock: item.quantity <= item.minStockLevel,
      lastAutoRestock: item.autoRestock.lastAutoRestock,
      restockCount: item.autoRestock.autoRestockCount,
      pricePerUnit: parseFloat(item.price) || 0,
      hasValidPrice: parseFloat(item.price) > 0,
      estimatedRestockValue: (item.autoRestock.reorderQuantity || item.minStockLevel * 2) * (parseFloat(item.price) || 0)
    }));

    res.json({
      success: true,
      data: {
        totalAutoRestockItems: items.length,
        itemsNeedingRestock: restockStatus.filter(item => item.needsRestock).length,
        itemsWithValidPrices: restockStatus.filter(item => item.hasValidPrice).length,
        totalEstimatedRestockValue: restockStatus
          .filter(item => item.needsRestock && item.hasValidPrice)
          .reduce((sum, item) => sum + item.estimatedRestockValue, 0),
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

// ✅ Debug route to check item prices
RestockRouter.get('/debug-prices', async (req, res) => {
  try {
    const items = await SurgicalItem.find({}, 'name price quantity minStockLevel autoRestock.enabled');
    
    const priceAnalysis = items.map(item => ({
      name: item.name,
      price: item.price,
      priceType: typeof item.price,
      parsedPrice: parseFloat(item.price) || 0,
      hasValidPrice: parseFloat(item.price) > 0,
      currentStock: item.quantity,
      minStock: item.minStockLevel,
      autoRestockEnabled: item.autoRestock?.enabled || false,
      needsRestock: item.quantity <= item.minStockLevel
    }));

    const invalidPrices = priceAnalysis.filter(item => !item.hasValidPrice);
    const lowStockItems = priceAnalysis.filter(item => item.needsRestock);
    const lowStockWithValidPrices = lowStockItems.filter(item => item.hasValidPrice);
    
    res.json({
      success: true,
      data: {
        totalItems: items.length,
        itemsWithInvalidPrices: invalidPrices.length,
        lowStockItems: lowStockItems.length,
        lowStockWithValidPrices: lowStockWithValidPrices.length,
        itemsWithAutoRestock: priceAnalysis.filter(item => item.autoRestockEnabled).length,
        invalidPriceItems: invalidPrices,
        lowStockItems: lowStockItems,
        summary: {
          canAutoRestock: lowStockWithValidPrices.length,
          needsPriceUpdate: invalidPrices.length,
          totalReadyForAutoRestock: lowStockWithValidPrices.filter(item => item.autoRestockEnabled).length
        }
      }
    });
  } catch (error) {
    console.error('❌ Debug prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze prices',
      error: error.message
    });
  }
});

export default RestockRouter;
