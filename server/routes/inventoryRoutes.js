import express from 'express';
import {
  getAllSurgicalItems,
  getSurgicalItem,
  createSurgicalItem,
  updateSurgicalItem,
  deleteSurgicalItem,
  updateStock,
  getDashboardStats
} from '../controller/surgicalItemController.js';
import { 
  disposeItem, 
  bulkDisposeItems,
  getDisposalHistory 
} from '../controller/disposalController.js';
import RestockSpending from '../model/RestockSpending.js';

const router = express.Router();

// Inventory dashboard stats
router.get('/dashboard-stats', getDashboardStats);

// CRUD operations for surgical items
router.get('/surgical-items', getAllSurgicalItems);
router.get('/surgical-items/:id', getSurgicalItem);
router.post('/surgical-items', createSurgicalItem);
router.put('/surgical-items/:id', updateSurgicalItem);
router.delete('/surgical-items/:id', deleteSurgicalItem);

// Stock management
router.post('/surgical-items/:id/update-stock', updateStock);

// Disposal routes
router.post('/surgical-items/:id/dispose', disposeItem);
router.post('/dispose-items', bulkDisposeItems);
router.post('/surgical-items/:id/reduce-stock', disposeItem);
router.get('/disposal-history', getDisposalHistory);
router.get('/surgical-items/:id/disposal-history', getDisposalHistory);

// Auto-restock routes
router.post('/auto-restock/check-and-restock', async (req, res) => {
  try {
    // Auto-restock logic here
    res.json({ success: true, message: 'Auto-restock completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/auto-restock/configure/:id', async (req, res) => {
  try {
    // Auto-restock configuration logic here
    res.json({ success: true, message: 'Auto-restock configured' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notification routes
router.post('/notifications/test-email', async (req, res) => {
  try {
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/notifications/check-low-stock', async (req, res) => {
  try {
    const { lowStockItems } = req.body;
    res.json({ 
      success: true, 
      message: 'Low stock alert sent',
      data: { count: lowStockItems?.length || 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/notifications/send-item-alert', async (req, res) => {
  try {
    res.json({ success: true, message: 'Item alert sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Restock spending routes
router.get('/restock-spending', async (req, res) => {
  try {
    // Find existing document or create new one
    let restockData = await RestockSpending.findOne();
    if (!restockData) {
      restockData = new RestockSpending({
        totalRestockValue: 0,
        monthlyRestockValue: 0,
        restockHistory: []
      });
      await restockData.save();
    }
    
    res.json({ success: true, data: restockData });
  } catch (error) {
    console.error('Error fetching restock spending:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/restock-spending', async (req, res) => {
  try {
    const { totalRestockValue, monthlyRestockValue, restockHistory } = req.body;
    
    // Find existing document or create new one
    let restockData = await RestockSpending.findOne();
    if (!restockData) {
      restockData = new RestockSpending();
    }
    
    // Update the document
    restockData.totalRestockValue = totalRestockValue;
    restockData.monthlyRestockValue = monthlyRestockValue;
    restockData.restockHistory = restockHistory;
    
    // Save to database
    await restockData.save();
    
    res.json({ success: true, data: restockData });
  } catch (error) {
    console.error('Error updating restock spending:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;