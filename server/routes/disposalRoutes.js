// FIXED disposalRoutes.js
import express from 'express';
import { 
  disposeItem, 
  disposeItems,
  getDisposalHistory, 
  clearDisposalHistory,
  getDisposalStats,
  getAllItems,
  bulkDisposeItems
} from '../controller/disposalController.js';

const disrouter = express.Router();

// ⭐ ADD THIS CRITICAL MISSING LINE:
disrouter.get('/items', getAllItems);

// EXISTING ROUTES (keep all these):
disrouter.post('/dispose-items', disposeItems);
disrouter.get('/disposal-history', getDisposalHistory);
disrouter.delete('/disposal-history', clearDisposalHistory);
disrouter.post('/surgical-items/:id/dispose', disposeItem);
disrouter.get('/disposal-stats', getDisposalStats);
disrouter.post('/bulk-dispose', bulkDisposeItems);

export default disrouter;
