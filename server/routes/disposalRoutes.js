// routes/disposalRoutes.js
import express from 'express';
import { disposeItem, getDisposalHistory, bulkDispose } from '../controller/disposalController.js';

const router = express.Router();

// Single item disposal
router.post('/surgical-items/:id/dispose', disposeItem);

// Future routes for disposal functionality
router.get('/disposal-history', getDisposalHistory);
router.post('/bulk-dispose', bulkDispose);

export default router;
