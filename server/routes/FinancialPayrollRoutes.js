import express from 'express';
import FinancialPayroll from '../model/FinancialPayrollModel.js';

import {
    createPayroll,
    getAllPayrolls,
    getPayrollById,
    updatePayroll,
    deletePayroll,
    getPayrollSummary,
    updatePayrollStatus
} from '../controller/FinancialPayrollController.js';

const payrollrouter = express.Router();

// CRUD Routes
payrollrouter.post('/', createPayroll);                    // Create payroll
payrollrouter.get('/', getAllPayrolls);                    // Get all payrolls with filtering
payrollrouter.get('/summary', getPayrollSummary);          // Get payroll summary (before /:id route)
payrollrouter.get('/:id', getPayrollById);                 // Get single payroll
payrollrouter.put('/:id', updatePayroll);                  // Update payroll
payrollrouter.delete('/:id', deletePayroll);               // Delete payroll

// Additional Routes
payrollrouter.patch('/:id/status', updatePayrollStatus);   // Update payroll status only

export default payrollrouter;
