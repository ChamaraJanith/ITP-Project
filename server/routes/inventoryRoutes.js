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
import { disposeItem } from '../controller/disposalController.js';

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

router.post('/surgical-items/:id/dispose', disposeItem);

export default router;
