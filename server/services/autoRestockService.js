import SurgicalItem from '../model/SurgicalItem.js';
import emailService from './emailService.js';

class AutoRestockService {
  constructor() {
    this.isProcessing = false;
  }

  async checkAndRestockItems(options = {}) {
    if (this.isProcessing) {
      console.log('⏳ Auto-restock already in progress, skipping...');
      return { success: true, itemsProcessed: 0, results: [] };
    }

    try {
      this.isProcessing = true;
      console.log('🔄 Starting auto-restock for low stock items...');

      const {
        filterItems = null,
        respectManualQuantities = true,
        preserveValue = true,
        processOnlyLowStock = true,
        lowStockItems = null
      } = options;

      // Query for low stock items with valid prices
      let query = { 
        'autoRestock.enabled': true,
        price: { $gt: 0 }, // Only items with valid prices
        $expr: {
          $lte: [
            { $toInt: '$quantity' },
            { $toInt: '$minStockLevel' }
          ]
        }
      };
      
      if (filterItems && filterItems.length > 0) {
        query._id = { $in: filterItems };
        console.log(`🎯 Filtering to specific ${filterItems.length} items`);
      }

      const itemsNeedingRestock = await SurgicalItem.find(query);

      if (itemsNeedingRestock.length === 0) {
        console.log('✅ No low stock items need restocking');
        return { 
          success: true, 
          itemsProcessed: 0, 
          results: [],
          message: 'All items are well-stocked or have invalid prices'
        };
      }

      console.log(`📦 Found ${itemsNeedingRestock.length} low stock items needing auto-restock`);

      const restockResults = [];
      let totalRestockValue = 0;

      for (const item of itemsNeedingRestock) {
        try {
          const result = await this.performRestockForLowStockItem(item, {
            respectManualQuantities,
            preserveValue
          });
          restockResults.push(result);
          totalRestockValue += result.restockValue || 0;
          
          console.log(`✅ ${item.name}:`);
          console.log(`   📈 Restock: +${result.restockQuantity} units`);
          console.log(`   💰 Value: +$${result.restockValue.toFixed(2)}`);
          console.log(`   📊 Final Stock: ${result.finalStock} units`);
          console.log(`   📧 Email: ${result.emailSent ? '✅ Sent' : '❌ Failed'}`);
          
        } catch (error) {
          console.error(`❌ Failed to restock ${item.name}:`, error.message);
          restockResults.push({
            itemId: item._id,
            itemName: item.name,
            success: false,
            emailSent: false,
            error: error.message,
            restockValue: 0,
            restockQuantity: 0
          });
        }
      }

      console.log(`💰 TOTAL RESTOCK VALUE: $${totalRestockValue.toFixed(2)}`);

      return {
        success: true,
        itemsProcessed: restockResults.filter(r => r.success).length,
        itemsNeedingRestock: itemsNeedingRestock.length,
        totalRestockValue: totalRestockValue,
        results: restockResults
      };

    } catch (error) {
      console.error('❌ Auto-restock service error:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isProcessing = false;
    }
  }

  async performRestockForLowStockItem(item, options = {}) {
    const { respectManualQuantities = true, preserveValue = true } = options;
    
    const currentStock = parseInt(item.quantity) || 0;
    const minStock = parseInt(item.minStockLevel) || 0;
    const maxStock = parseInt(item.autoRestock.maxStockLevel) || (minStock * 3);
    const manualReorderQty = parseInt(item.autoRestock.reorderQuantity) || 0;
    const itemPrice = parseFloat(item.price) || 0;

    console.log(`🎯 Processing low stock item: ${item.name}`);
    console.log(`   💰 Unit Price: $${itemPrice}`);
    console.log(`   📊 Current Stock: ${currentStock} (Min: ${minStock})`);

    // Validate price
    if (!itemPrice || itemPrice <= 0) {
      throw new Error(`Item "${item.name}" has invalid price ($${itemPrice}). Cannot calculate restock value.`);
    }

    // Calculate restock quantity
    let restockQuantity;
    
    if (respectManualQuantities && item.autoRestock.restockMethod === 'fixed_quantity' && manualReorderQty > 0) {
      restockQuantity = manualReorderQty;
      console.log(`📋 Using manual quantity: ${restockQuantity} units`);
    } else if (item.autoRestock.restockMethod === 'fixed_quantity' && manualReorderQty > 0) {
      restockQuantity = manualReorderQty;
    } else {
      // Auto-calculate to reach max stock level
      restockQuantity = Math.max(maxStock - currentStock, minStock);
    }

    // Ensure minimum restock quantity
    if (restockQuantity <= 0) {
      restockQuantity = Math.max(minStock * 2, 10);
    }

    // Calculate values
    const restockValue = itemPrice * restockQuantity;
    const finalStock = currentStock + restockQuantity;
    const finalTotalValue = finalStock * itemPrice;
    const currentTotalValue = currentStock * itemPrice;

    console.log(`📈 RESTOCK CALCULATION:`);
    console.log(`   Current: ${currentStock} units × $${itemPrice} = $${currentTotalValue.toFixed(2)}`);
    console.log(`   Adding: ${restockQuantity} units × $${itemPrice} = $${restockValue.toFixed(2)}`);
    console.log(`   Final: ${finalStock} units × $${itemPrice} = $${finalTotalValue.toFixed(2)}`);

    // Validate calculation
    if (restockValue <= 0) {
      throw new Error(`Invalid restock value: $${restockValue} for ${item.name}`);
    }

    // Send supplier email
    const supplierEmailResult = await emailService.sendSupplierRestockOrder(
      item, 
      restockQuantity,
      {
        orderType: 'auto_restock_low_stock',
        urgency: currentStock === 0 ? 'critical' : 'high',
        hospitalName: 'HealX Healthcare Center',
        autoTrigger: true,
        method: item.autoRestock.restockMethod || 'auto',
        respectsManualQuantity: respectManualQuantities && item.autoRestock.restockMethod === 'fixed_quantity',
        currentStock: currentStock,
        restockQuantity: restockQuantity,
        restockValue: restockValue,
        unitPrice: itemPrice,
        finalStock: finalStock,
        finalValue: finalTotalValue
      }
    );

    // Update database
    const updatedItem = await SurgicalItem.findByIdAndUpdate(
      item._id,
      {
        $set: { 
          quantity: finalStock,
          lastRestocked: new Date(),
          'autoRestock.lastAutoRestock': new Date(),
          'autoRestock.autoRestockCount': (item.autoRestock.autoRestockCount || 0) + 1,
          'autoRestock.lastAutoRestockQuantity': restockQuantity,
          'autoRestock.lastSupplierOrder': supplierEmailResult.orderNumber || null,
          'autoRestock.lastEmailSent': supplierEmailResult.success,
          'autoRestock.lastEmailTime': new Date(),
          'autoRestock.lastRestockMethod': item.autoRestock.restockMethod || 'auto',
          'autoRestock.usedManualQuantity': respectManualQuantities && item.autoRestock.restockMethod === 'fixed_quantity'
        },
        $inc: {
          'restock.totalRestocked': restockQuantity,
          'restock.totalRestockValue': restockValue
        },
        $push: {
          'restock.history': {
            amount: restockQuantity,
            value: restockValue,
            date: new Date(),
            type: 'auto_restock',
            reason: `Auto-restock for low stock: Added ${restockQuantity} units worth $${restockValue.toFixed(2)}`,
            supplierOrder: supplierEmailResult.orderNumber,
            emailSent: supplierEmailResult.success,
            performedBy: 'system',
            previousStock: currentStock,
            newStock: finalStock,
            unitPrice: itemPrice,
            previousValue: currentTotalValue,
            newValue: finalTotalValue
          }
        }
      },
      { new: true }
    );

    // Send admin confirmation
    await emailService.sendRestockConfirmationToAdmin(item, restockQuantity, {
      ...supplierEmailResult,
      method: item.autoRestock.restockMethod || 'auto',
      respectsManualQuantity: respectManualQuantities && item.autoRestock.restockMethod === 'fixed_quantity',
      currentStock: currentStock,
      restockQuantity: restockQuantity,
      restockValue: restockValue,
      unitPrice: itemPrice,
      finalStock: finalStock,
      finalTotalValue: finalTotalValue,
      valueAdded: restockValue,
      stockAdded: restockQuantity,
      transactionType: 'low_stock_auto_restock'
    });

    console.log(`✅ RESTOCK COMPLETED for ${item.name}:`);
    console.log(`   📊 Added: +${restockQuantity} units`);
    console.log(`   💰 Value Added: +$${restockValue.toFixed(2)}`);

    return {
      itemId: item._id,
      itemName: item.name,
      success: true,
      
      // Current state
      currentStock: currentStock,
      currentTotalValue: currentTotalValue,
      
      // Main positive result
      restockQuantity: restockQuantity,
      restockValue: restockValue,
      
      // Final state
      finalStock: finalStock,
      finalTotalValue: finalTotalValue,
      
      // Additional info
      pricePerUnit: itemPrice,
      valueAdded: restockValue,
      stockAdded: restockQuantity,
      
      // Method tracking
      method: item.autoRestock.restockMethod || 'auto',
      usedManualQuantity: respectManualQuantities && item.autoRestock.restockMethod === 'fixed_quantity',
      timestamp: new Date(),
      transactionType: 'low_stock_auto_restock',
      
      // Email details
      emailSent: supplierEmailResult.success,
      supplierEmail: supplierEmailResult.supplierEmail,
      orderNumber: supplierEmailResult.orderNumber,
      supplierNotification: supplierEmailResult
    };
  }

  async getItemsNeedingRestock() {
    try {
      const itemsNeedingRestock = await SurgicalItem.find({
        $expr: {
          $lte: [
            { $toInt: '$quantity' },
            { $toInt: '$minStockLevel' }
          ]
        }
      }).select('name quantity minStockLevel category supplier autoRestock price');

      // Filter items with valid prices
      const validPriceItems = itemsNeedingRestock.filter(item => {
        const price = parseFloat(item.price) || 0;
        return price > 0;
      });

      const invalidPriceItems = itemsNeedingRestock.filter(item => {
        const price = parseFloat(item.price) || 0;
        return price <= 0;
      });

      if (invalidPriceItems.length > 0) {
        console.warn(`⚠️ Found ${invalidPriceItems.length} items with invalid prices:`, 
          invalidPriceItems.map(item => item.name));
      }

      return {
        success: true,
        data: {
          totalItemsNeedingRestock: validPriceItems.length,
          itemsWithInvalidPrices: invalidPriceItems.length,
          itemsWithAutoRestock: validPriceItems.filter(item => item.autoRestock?.enabled).length,
          outOfStockItems: validPriceItems.filter(item => parseInt(item.quantity) === 0).length,
          estimatedRestockValue: validPriceItems.reduce((total, item) => {
            const restockQty = item.autoRestock?.reorderQuantity || (item.minStockLevel * 2);
            const price = parseFloat(item.price) || 0;
            return total + (restockQty * price);
          }, 0),
          items: validPriceItems.map(item => ({
            id: item._id,
            name: item.name,
            currentStock: parseInt(item.quantity) || 0,
            minStock: parseInt(item.minStockLevel) || 0,
            category: item.category,
            supplier: item.supplier?.name || 'No supplier',
            autoRestockEnabled: item.autoRestock?.enabled || false,
            autoRestockQuantity: item.autoRestock?.reorderQuantity || 0,
            canAutoRestock: item.autoRestock?.enabled && item.autoRestock?.reorderQuantity > 0,
            isOutOfStock: (parseInt(item.quantity) || 0) === 0,
            pricePerUnit: parseFloat(item.price) || 0,
            currentValue: (parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0),
            estimatedRestockValue: (item.autoRestock?.reorderQuantity || (item.minStockLevel * 2)) * (parseFloat(item.price) || 0)
          })),
          invalidPriceItems: invalidPriceItems.map(item => ({
            id: item._id,
            name: item.name,
            price: item.price
          }))
        }
      };
    } catch (error) {
      console.error('❌ Get items needing restock error:', error);
      return {
        success: false,
        message: 'Failed to get items needing restock',
        error: error.message
      };
    }
  }
}

export default new AutoRestockService();
