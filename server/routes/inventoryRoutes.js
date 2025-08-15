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

export default router;
