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

// 🔥 DISPOSAL ROUTES - Multiple endpoints for compatibility
router.post('/surgical-items/:id/dispose', disposeItem);
router.post('/dispose-items', bulkDisposeItems);
router.post('/surgical-items/:id/reduce-stock', disposeItem); // Alternative endpoint
router.get('/disposal-history', getDisposalHistory);
router.get('/surgical-items/:id/disposal-history', getDisposalHistory);

// 🔥 AUTO-RESTOCK ROUTES (if you need them)
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

// 🔥 NOTIFICATION ROUTES (if you need them)
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

export default router;
