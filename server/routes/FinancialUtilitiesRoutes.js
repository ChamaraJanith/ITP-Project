import express from 'express';
import FinancialUtilities from '../model/FinancialUtilitiesModal.js';

import {
    createUtility,
    getAllUtilities,
    getUtilityById,
    updateUtility,
    deleteUtility,
    getUtilityStats,
    generateUniqueId
} from '../controller/FinancialUtilitiesController.js';

const utilitiesrouter = express.Router();

// CRUD Routes
utilitiesrouter.post('/', createUtility);                    // Create utility
utilitiesrouter.get('/', getAllUtilities);                    // Get all utilities with filtering
utilitiesrouter.get('/generate-id', generateUniqueId);        // Generate unique ID (before /:id route)
utilitiesrouter.get('/stats', getUtilityStats);               // Get utility statistics (before /:id route)
utilitiesrouter.get('/:id', getUtilityById);                  // Get single utility
utilitiesrouter.put('/:id', updateUtility);                   // Update utility
utilitiesrouter.delete('/:id', deleteUtility);                // Delete utility

export default utilitiesrouter;
