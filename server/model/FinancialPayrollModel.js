import mongoose from 'mongoose';

const financialPayrollSchema = new mongoose.Schema({
    payrollId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    employeeId: {
        type: String,
        required: true,
        trim: true
    },
    employeeName: {
        type: String,
        required: true,
        trim: true
    },
    grossSalary: {
        type: Number,
        required: true,
        min: 0
    },
    deductions: {
        type: Number,
        default: 0,
        min: 0
    },
    bonuses: {
        type: Number,
        default: 0,
        min: 0
    },
    epf: {
        type: Number,
        default: 0
    },
    etf: {
        type: Number,
        default: 0
    },
    netSalary: {
        type: Number,
        default: 0
    },
    payrollMonth: {
        type: String,
        required: true
    },
    payrollYear: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Paid'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to calculate EPF, ETF, and Net Salary
financialPayrollSchema.pre('save', function(next) {
    // Calculate EPF (8% of gross salary - employee contribution)
    this.epf = Math.round(this.grossSalary * 0.08);
    
    // Calculate ETF (3% of gross salary - employer contribution for tax purposes)
    this.etf = Math.round(this.grossSalary * 0.03);
    
    // Calculate Net Salary
    this.netSalary = this.grossSalary + this.bonuses - this.deductions - this.epf - this.etf;
    
    // Update the updatedAt field
    this.updatedAt = Date.now();
    
    next();
});

// Index for better query performance
financialPayrollSchema.index({ employeeId: 1, payrollMonth: 1, payrollYear: 1 });
financialPayrollSchema.index({ payrollId: 1 });

const FinancialPayroll = mongoose.model('FinancialPayroll', financialPayrollSchema);

export default FinancialPayroll;
