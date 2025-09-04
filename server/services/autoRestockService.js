import SurgicalItem from '../model/SurgicalItem.js';
import emailService from './emailService.js';

class AutoRestockService {
  constructor() {
    this.isProcessing = false;
  }

  async checkAndRestockItems() {
    if (this.isProcessing) {
      console.log('⏳ Auto-restock already in progress, skipping...');
      return { success: true, itemsProcessed: 0, results: [] };
    }

    try {
      this.isProcessing = true;
      console.log('🔄 Starting 1-minute auto-restock check...');

      const itemsNeedingRestock = await SurgicalItem.find({
        'autoRestock.enabled': true,
        $expr: {
          $lte: [
            { $toInt: '$quantity' },
            { $toInt: '$minStockLevel' }
          ]
        }
      });

      if (itemsNeedingRestock.length === 0) {
        console.log('✅ All auto-restock items are well-stocked');
        return { success: true, itemsProcessed: 0, results: [] };
      }

      console.log(`📦 Found ${itemsNeedingRestock.length} items needing auto-restock`);

      const restockResults = [];

      for (const item of itemsNeedingRestock) {
        try {
          // ✅ IMPORTANT: Always send supplier email first
          const result = await this.performAutoRestockWithEmail(item);
          restockResults.push(result);
          console.log(`✅ ${item.name}: Restocked +${result.restockQuantity} units, Email: ${result.emailSent ? '✅ Sent' : '❌ Failed'}`);
        } catch (error) {
          console.error(`❌ Failed to restock ${item.name}:`, error);
          restockResults.push({
            itemId: item._id,
            itemName: item.name,
            success: false,
            emailSent: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        itemsProcessed: restockResults.length,
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

  // ✅ Enhanced function that ALWAYS sends supplier email
  async performAutoRestockWithEmail(item) {
    const currentStock = parseInt(item.quantity) || 0;
    const minStock = parseInt(item.minStockLevel) || 0;
    const maxStock = parseInt(item.autoRestock.maxStockLevel) || (minStock * 3);
    const reorderQty = parseInt(item.autoRestock.reorderQuantity) || (maxStock - currentStock);

    let restockQuantity;
    
    if (item.autoRestock.restockMethod === 'fixed_quantity') {
      restockQuantity = reorderQty;
    } else {
      restockQuantity = maxStock - currentStock;
    }

    if (restockQuantity <= 0) {
      restockQuantity = minStock * 2;
    }

    console.log(`📈 Auto-restocking ${item.name}: ${currentStock} → ${currentStock + restockQuantity}`);

    // ✅ STEP 1: ALWAYS send supplier email first
    console.log(`📧 Sending supplier email for ${item.name}...`);
    const supplierEmailResult = await emailService.sendSupplierRestockOrder(
      item, 
      restockQuantity,
      {
        orderType: 'auto_restock_1min',
        urgency: 'immediate',
        hospitalName: 'HealX Healthcare Center',
        autoTrigger: true
      }
    );

    if (supplierEmailResult.success) {
      console.log(`✅ Supplier email sent successfully to ${supplierEmailResult.supplierEmail}`);
    } else {
      console.log(`❌ Supplier email failed: ${supplierEmailResult.error}`);
    }

    // ✅ STEP 2: Update database inventory
    const updatedItem = await SurgicalItem.findByIdAndUpdate(
      item._id,
      {
        $inc: { quantity: restockQuantity },
        $set: {
          'autoRestock.lastAutoRestock': new Date(),
          'autoRestock.autoRestockCount': (item.autoRestock.autoRestockCount || 0) + 1,
          'autoRestock.lastAutoRestockQuantity': restockQuantity,
          'autoRestock.lastSupplierOrder': supplierEmailResult.orderNumber || null,
          'autoRestock.lastEmailSent': supplierEmailResult.success,
          'autoRestock.lastEmailTime': new Date()
        }
      },
      { new: true }
    );

    // ✅ STEP 3: Send admin confirmation
    await emailService.sendRestockConfirmationToAdmin(item, restockQuantity, supplierEmailResult);

    return {
      itemId: item._id,
      itemName: item.name,
      success: true,
      previousStock: currentStock,
      restockQuantity: restockQuantity,
      newStock: currentStock + restockQuantity,
      method: item.autoRestock.restockMethod,
      timestamp: new Date(),
      emailSent: supplierEmailResult.success,
      supplierEmail: supplierEmailResult.supplierEmail,
      orderNumber: supplierEmailResult.orderNumber,
      supplierNotification: supplierEmailResult
    };
  }
}

export default new AutoRestockService();
