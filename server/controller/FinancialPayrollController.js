import FinancialPayroll from "../model/FinancialPayrollModel.js";
import payrollrouter from "../routes/FinancialPayrollRoutes.js";    

// Create new payroll record
export const createPayroll = async (req, res) => {
    try {
        const {
            payrollId,
            employeeId,
            employeeName,
            grossSalary,
            deductions = 0,
            bonuses = 0,
            payrollMonth,
            payrollYear
        } = req.body;

        // Check if payroll already exists for this employee in the same month/year
        const existingPayroll = await FinancialPayroll.findOne({
            employeeId,
            payrollMonth,
            payrollYear
        });

        if (existingPayroll) {
            return res.status(400).json({
                success: false,
                message: 'Payroll already exists for this employee in the specified month and year'
            });
        }

        const payroll = new FinancialPayroll({
            payrollId,
            employeeId,
            employeeName,
            grossSalary,
            deductions,
            bonuses,
            payrollMonth,
            payrollYear
        });

        const savedPayroll = await payroll.save();

        res.status(201).json({
            success: true,
            message: 'Payroll created successfully',
            data: savedPayroll
        });
    } catch (error) {
        console.error('Error creating payroll:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payroll',
            error: error.message
        });
    }
};

// Get all payroll records with pagination and filtering
export const getAllPayrolls = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            employeeId,
            payrollMonth,
            payrollYear,
            status
        } = req.query;

        const query = {};
        if (employeeId) query.employeeId = employeeId;
        if (payrollMonth) query.payrollMonth = payrollMonth;
        if (payrollYear) query.payrollYear = parseInt(payrollYear);
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const payrolls = await FinancialPayroll.find(query)
            .sort(options.sort)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);

        const total = await FinancialPayroll.countDocuments(query);

        res.status(200).json({
            success: true,
            data: payrolls,
            pagination: {
                total,
                pages: Math.ceil(total / options.limit),
                page: options.page,
                limit: options.limit
            }
        });
    } catch (error) {
        console.error('Error fetching payrolls:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payrolls',
            error: error.message
        });
    }
};

// Get single payroll record by ID
export const getPayrollById = async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await FinancialPayroll.findById(id);

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: payroll
        });
    } catch (error) {
        console.error('Error fetching payroll:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payroll',
            error: error.message
        });
    }
};

// Update payroll record
export const updatePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const payroll = await FinancialPayroll.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payroll updated successfully',
            data: payroll
        });
    } catch (error) {
        console.error('Error updating payroll:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payroll',
            error: error.message
        });
    }
};

// Delete payroll record
export const deletePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await FinancialPayroll.findByIdAndDelete(id);

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payroll deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payroll:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting payroll',
            error: error.message
        });
    }
};

// Get payroll summary/statistics
export const getPayrollSummary = async (req, res) => {
    try {
        const { payrollMonth, payrollYear } = req.query;
        
        const matchQuery = {};
        if (payrollMonth) matchQuery.payrollMonth = payrollMonth;
        if (payrollYear) matchQuery.payrollYear = parseInt(payrollYear);

        const summary = await FinancialPayroll.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    totalGrossSalary: { $sum: '$grossSalary' },
                    totalDeductions: { $sum: '$deductions' },
                    totalBonuses: { $sum: '$bonuses' },
                    totalEPF: { $sum: '$epf' },
                    totalETF: { $sum: '$etf' },
                    totalNetSalary: { $sum: '$netSalary' },
                    pendingPayrolls: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    },
                    processedPayrolls: {
                        $sum: { $cond: [{ $eq: ['$status', 'Processed'] }, 1, 0] }
                    },
                    paidPayrolls: {
                        $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: summary[0] || {
                totalEmployees: 0,
                totalGrossSalary: 0,
                totalDeductions: 0,
                totalBonuses: 0,
                totalEPF: 0,
                totalETF: 0,
                totalNetSalary: 0,
                pendingPayrolls: 0,
                processedPayrolls: 0,
                paidPayrolls: 0
            }
        });
    } catch (error) {
        console.error('Error fetching payroll summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payroll summary',
            error: error.message
        });
    }
};

// Update payroll status
export const updatePayrollStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const payroll = await FinancialPayroll.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payroll status updated successfully',
            data: payroll
        });
    } catch (error) {
        console.error('Error updating payroll status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payroll status',
            error: error.message
        });
    }
};
