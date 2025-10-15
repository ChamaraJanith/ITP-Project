import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FinancialPayroll.css';

const FinancialPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const navigate = useNavigate();
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const getCurrentMonth = () => new Date().toLocaleString('default', { month: 'long' });
  const getCurrentYear = () => new Date().getFullYear();

  const [formData, setFormData] = useState({
    payrollId: '',
    employeeId: '',
    employeeName: '',
    grossSalary: '',
    deductions: '',
    bonuses: '',
    payrollMonth: getCurrentMonth(),
    payrollYear: getCurrentYear()
  });

  const [validationErrors, setValidationErrors] = useState({
    payrollId: '',
    employeeId: '',
    employeeName: '',
    grossSalary: '',
    deductions: '',
    bonuses: ''
  });

  const tableRef = useRef(null);

  // All validation functions remain the same...
  const validatePayrollId = (value) => {
    const regex = /^PR\d{3}$/;
    if (!value) return 'Payroll ID is required';
    if (!regex.test(value)) return 'Payroll ID must be in format PR001 (PR + 3 digits)';
    return '';
  };

  const validateEmployeeId = (value) => {
    const regex = /^EMP\d{3}$/;
    if (!value) return 'Employee ID is required';
    if (!regex.test(value)) return 'Employee ID must be in format EMP001 (EMP + 3 digits)';
    return '';
  };

  const validateEmployeeName = (value) => {
    const regex = /^[A-Za-z\s]+$/;
    if (!value) return 'Employee name is required';
    if (!regex.test(value)) return 'Employee name can only contain letters and spaces';
    if (value.length < 2) return 'Employee name must be at least 2 characters';
    if (value.length > 50) return 'Employee name cannot exceed 50 characters';
    return '';
  };

  const validateNumericField = (value, fieldName, isRequired = true) => {
    if (isRequired && (!value || value === '')) {
      return `${fieldName} is required`;
    }
    if (value && (isNaN(value) || parseFloat(value) < 0)) {
      return `${fieldName} must be a positive number`;
    }
    if (value && parseFloat(value) > 10000000) {
      return `${fieldName} cannot exceed 10,000,000`;
    }
    return '';
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'payrollId':
        error = validatePayrollId(value);
        break;
      case 'employeeId':
        error = validateEmployeeId(value);
        break;
      case 'employeeName':
        error = validateEmployeeName(value);
        break;
      case 'grossSalary':
        error = validateNumericField(value, 'Gross salary', true);
        break;
      case 'deductions':
        error = validateNumericField(value, 'Deductions', false);
        break;
      case 'bonuses':
        error = validateNumericField(value, 'Bonuses', false);
        break;
      default:
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return error === '';
  };

  const isFormValid = () => {
    const errors = Object.values(validationErrors);
    const hasErrors = errors.some(error => error !== '');
    const hasEmptyRequired = !formData.payrollId || !formData.employeeId || 
                            !formData.employeeName || !formData.grossSalary || 
                            !formData.payrollMonth;
    return !hasErrors && !hasEmptyRequired;
  };

  // Input handlers remain the same...
  const handlePayrollIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    const partialPattern = /^(P(R\d{0,3})?)?$/;
    
    if (value.length <= 6 && partialPattern.test(value)) {
      setFormData(prev => ({ ...prev, payrollId: value }));
      validateField('payrollId', value);
    }
  };

  const handleEmployeeIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    const partialPattern = /^(E(M(P\d{0,3})?)?)?$/;
    
    if (value.length <= 6 && partialPattern.test(value)) {
      setFormData(prev => ({ ...prev, employeeId: value }));
      validateField('employeeId', value);
    }
  };

  const handleEmployeeNameChange = (e) => {
    let value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormData(prev => ({ ...prev, employeeName: value }));
      validateField('employeeName', value);
    }
  };

  const handleNumericChange = (e, fieldName) => {
    let value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      validateField(fieldName, value);
    }
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    
    try {
      const currentPagination = pagination || { page: 1, limit: 10 };
      
      const params = {
        page: currentPagination.page || 1,
        limit: currentPagination.limit || 10,
        ...(searchTerm && { employeeId: searchTerm }),
        ...(filterMonth && { payrollMonth: filterMonth }),
        ...(filterYear && { payrollYear: filterYear })
      };

      const response = await axios.get('http://localhost:7000/api/payrolls', { params });
      const result = response.data;
      
      if (result && result.success) {
        setPayrolls(result.data || []);
        setPagination({
          page: result.pagination?.page || 1,
          limit: result.pagination?.limit || 10,
          total: result.pagination?.total || 0,
          pages: result.pagination?.pages || 1
        });
      } else {
        setPayrolls([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (error) {
      setError('Failed to fetch payrolls: ' + (error.response?.data?.message || error.message));
      setPayrolls([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const fieldsToValidate = ['payrollId', 'employeeId', 'employeeName', 'grossSalary', 'deductions', 'bonuses'];
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      const fieldValid = validateField(field, formData[field]);
      if (!fieldValid) isValid = false;
    });

    if (!isValid) {
      setError('Please fix the validation errors before submitting');
      setLoading(false);
      return;
    }

    try {
      const preview = calculatePreview();
      
      const payloadData = {
        ...formData,
        epf: preview.epf,
        etf: preview.etf, // This is for employer records only, not deducted from employee
        netSalary: preview.netSalary,
        payrollMonth: getCurrentMonth(),
        payrollYear: getCurrentYear()
      };

      console.log('🔍 Frontend calculated values:', {
        grossSalary: parseFloat(formData.grossSalary) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        epf: preview.epf,
        calculatedNetSalary: preview.netSalary
      });

      if (editingPayroll) {
        await axios.put(`http://localhost:7000/api/payrolls/${editingPayroll._id}`, payloadData);
        setSuccess('Payroll updated successfully!');
      } else {
        await axios.post('http://localhost:7000/api/payrolls', payloadData);
        setSuccess('Payroll created successfully!');
      }
      
      resetForm();
      fetchPayrolls();
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save payroll: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:7000/api/payrolls/${id}`);
      setSuccess('Payroll deleted successfully!');
      fetchPayrolls();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete payroll: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:7000/api/payrolls/${id}/status`, { status });
      setSuccess('Status updated successfully!');
      fetchPayrolls();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update status: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      payrollId: '',
      employeeId: '',
      employeeName: '',
      grossSalary: '',
      deductions: '',
      bonuses: '',
      payrollMonth: getCurrentMonth(),
      payrollYear: getCurrentYear()
    });
    setValidationErrors({
      payrollId: '',
      employeeId: '',
      employeeName: '',
      grossSalary: '',
      deductions: '',
      bonuses: ''
    });
    setEditingPayroll(null);
    setError('');
  };

  const handleEdit = (payroll) => {
    setFormData({
      payrollId: payroll.payrollId,
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      grossSalary: payroll.grossSalary,
      deductions: payroll.deductions || 0,
      bonuses: payroll.bonuses || 0,
      payrollMonth: getCurrentMonth(),
      payrollYear: getCurrentYear()
    });
    setEditingPayroll(payroll);
    setShowForm(true);
    setError('');
    setValidationErrors({
      payrollId: '',
      employeeId: '',
      employeeName: '',
      grossSalary: '',
      deductions: '',
      bonuses: ''
    });
  };

  // 🚨 CRITICAL FIX: Calculate preview values with CORRECT EPF/ETF logic
  const calculatePreview = () => {
    const grossSalary = parseFloat(formData.grossSalary) || 0; // Base salary only
    const deductions = parseFloat(formData.deductions) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;
    
    console.log('🔍 calculatePreview inputs:', {
      grossSalary,
      deductions,
      bonuses
    });
    
    // ✅ CORRECT: EPF/ETF calculated on GROSS SALARY ONLY (excludes bonuses)
    const epf = Math.round(grossSalary * 0.08); // Employee contribution: 8% of gross salary only
    const etf = Math.round(grossSalary * 0.03); // Employer contribution: 3% of gross salary only
    
    // ✅ CRITICAL FIX: Net salary = gross salary + bonuses - deductions - EPF (NO ETF deduction)
    const netSalary = grossSalary + bonuses - deductions - epf;
    
    console.log('🔍 calculatePreview outputs:', {
      epf,
      etf,
      netSalary,
      calculation: `${grossSalary} + ${bonuses} - ${deductions} - ${epf} = ${netSalary}`
    });
    
    return { epf, etf, netSalary };
  };

  // ✅ FIXED: Individual Salary Slip Generation with CORRECT EPF/ETF calculations
  const generateSalarySlip = (payroll) => {
    if (!payroll) {
      setError('No payroll data available');
      return;
    }

    // ✅ CORRECT: Use gross salary for base calculation, bonuses separate
    const basicSalary = payroll.grossSalary || 0;
    const bonusAmount = payroll.bonuses || 0;
    const totalEarnings = basicSalary + bonusAmount; // Total shown to employee
    
    // ✅ CORRECT: EPF/ETF calculated on basic salary ONLY (not total earnings)
    const epfEmployee = Math.round(basicSalary * 0.08); // 8% of basic salary only
    const epfEmployer = Math.round(basicSalary * 0.12); // 12% of basic salary only  
    const etfEmployer = Math.round(basicSalary * 0.03); // 3% of basic salary only
    
    // Other deductions
    const taxes = 0;
    const latePenalties = 0;
    const insurances = payroll.deductions || 0;
    const absences = 0;
    
    const totalDeductions = taxes + latePenalties + insurances + absences + epfEmployee;
    const netPay = totalEarnings - totalDeductions;

    console.log('🔍 Salary Slip Calculation:', {
      basicSalary,
      bonusAmount,
      totalEarnings,
      epfEmployee,
      totalDeductions,
      netPay,
      calculation: `${totalEarnings} - ${totalDeductions} = ${netPay}`
    });

    const salarySlipContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Salary Slip - ${payroll.employeeName}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px;
            font-size: 12px; 
            line-height: 1.4;
            background: #f8f9fa;
          }
          .salary-slip { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
          }
          
          .company-header { 
            background: linear-gradient(135deg, #1da1f2 0%, #0d7ec7 100%);
            color: white; 
            padding: 25px 30px; 
            text-align: center;
            border-bottom: 3px solid #0d7ec7;
          }
          .company-header h1 { 
            margin: 0 0 8px 0; 
            font-size: 24px; 
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          .company-header p { 
            margin: 0; 
            font-size: 12px; 
            opacity: 0.95;
          }
          .company-subtext {
            font-size: 11px;
            margin-top: 8px;
            opacity: 0.9;
            font-style: italic;
          }
          
          .payslip-content {
            padding: 30px;
          }
          
          .payslip-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .period-info {
            text-align: center;
            margin-bottom: 15px;
            font-size: 11px;
            color: #666;
          }
          
          .employee-info {
            margin-bottom: 25px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
          }
          
          .info-label {
            font-weight: 600;
            color: #333;
          }
          
          .info-value {
            color: #555;
          }
          
          .payslip-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .section-header {
            background: #f8f9fa;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            color: #495057;
          }
          
          .payslip-table th,
          .payslip-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
            font-size: 11px;
          }
          
          .payslip-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .amount-col {
            text-align: right;
            font-family: 'Courier New', monospace;
            font-weight: 500;
          }
          
          .total-row {
            font-weight: bold;
            background: #f8f9fa;
            border-top: 2px solid #dee2e6;
          }
          
          .net-pay-section {
            background: #e8f5e8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #28a745;
          }
          
          .net-pay-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: bold;
          }
          
          .net-amount {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #28a745;
          }
          
          .contact-info {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin: 20px 0;
            font-style: italic;
          }
          
          .employer-info {
            background: #e3f2fd;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #1da1f2;
          }
          
          .employer-info h4 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 12px;
            text-transform: uppercase;
          }
          
          .employer-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
          }
          
          .calculation-note {
            background: #fff3cd;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            border-left: 4px solid #ffc107;
            font-size: 10px;
            color: #856404;
          }
          
          .slip-footer { 
            padding: 25px 30px; 
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
          }
          
          .signature-section { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 30px;
          }
          
          .signature-block { 
            text-align: center; 
            width: 200px;
          }
          
          .signature-line { 
            border-bottom: 2px dotted #6c757d; 
            height: 40px; 
            margin-bottom: 8px;
          }
          
          .signature-text { 
            font-size: 11px; 
            color: #6c757d;
            font-weight: 500;
          }
          
          .important-notes { 
            margin-top: 20px; 
            padding: 15px; 
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
          }
          
          .important-notes h4 { 
            margin: 0 0 10px 0; 
            color: #856404;
            font-size: 12px;
          }
          
          .important-notes ul { 
            margin: 0; 
            padding-left: 18px;
            color: #856404;
            font-size: 10px;
          }
          
          .important-notes li { 
            margin-bottom: 4px;
          }
          
          @media print { 
            body { 
              background: white; 
              margin: 0;
              padding: 10px;
            }
            .salary-slip {
              box-shadow: none;
              border-radius: 0;
            }
            .no-print { 
              display: none !important; 
            }
          }
          
          .print-actions {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
          }
          
          .print-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 14px;
            border-radius: 5px;
            cursor: pointer;
            margin: 0 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          }
          
          .print-btn:hover {
            background: #218838;
            transform: translateY(-1px);
          }
          
          .close-btn {
            background: #6c757d;
          }
          
          .close-btn:hover {
            background: #545b62;
          }
        </style>
      </head>
      <body>
        <div class="salary-slip">
          <div class="company-header">
            <h1>🏥 Heal-x Healthcare Management</h1>
            <p>Employee Payroll & Financial Services</p>
            <div class="company-subtext">Comprehensive Healthcare Solutions | Est. 2020</div>
          </div>
          
          <div class="payslip-content">
            <div class="payslip-title">Cash Payment Payslip</div>
            
            <div class="period-info">
              <strong>Pay Period:</strong> ${payroll.payrollMonth || ''} 1 - 15, ${payroll.payrollYear || ''} | <strong>Pay Date:</strong> ${payroll.payrollMonth || ''} 16, ${payroll.payrollYear || ''}
            </div>
            
            <div class="employee-info">
              <div class="info-row">
                <span class="info-label">Employee Name:</span>
                <span class="info-value">${payroll.employeeName || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">SSN:</span>
                <span class="info-value">${payroll.employeeId || 'N/A'}</span>
              </div>
            </div>
            
            <!-- ✅ CORRECTED: Earnings Table -->
            <table class="payslip-table">
              <thead>
                <tr class="section-header">
                  <th>Earnings</th>
                  <th>Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Salary</td>
                  <td></td>
                  <td class="amount-col">LKR ${basicSalary.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Overtime Pay</td>
                  <td></td>
                  <td class="amount-col">LKR 0</td>
                </tr>
                <tr>
                  <td>Bonuses</td>
                  <td></td>
                  <td class="amount-col">LKR ${bonusAmount.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total Earnings</strong></td>
                  <td></td>
                  <td class="amount-col"><strong>LKR ${totalEarnings.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <!-- ✅ CORRECTED: Deductions Table - Shows correct EPF calculation -->
            <table class="payslip-table">
              <thead>
                <tr class="section-header">
                  <th>Deductions</th>
                  <th>Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Taxes</td>
                  <td></td>
                  <td class="amount-col">LKR ${taxes.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Late Penalties</td>
                  <td></td>
                  <td class="amount-col">LKR ${latePenalties.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Insurances</td>
                  <td></td>
                  <td class="amount-col">LKR ${insurances.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Absences</td>
                  <td></td>
                  <td class="amount-col">LKR ${absences.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>EPF Employee Contribution (8%)</td>
                  <td>8% of base salary only</td>
                  <td class="amount-col">LKR ${epfEmployee.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total Deductions</strong></td>
                  <td></td>
                  <td class="amount-col"><strong>LKR ${totalDeductions.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <!-- ✅ CORRECTED: Calculation Note -->
            <div class="calculation-note">
              <strong>📋 EPF/ETF Calculation Note:</strong> EPF and ETF contributions are calculated on base salary (LKR ${basicSalary.toLocaleString()}) only. Bonuses are excluded from EPF/ETF calculations as per Sri Lankan regulations.
            </div>
            
            <!-- ✅ CORRECTED: Employer Contributions Information -->
            <div class="employer-info">
              <h4>🏢 Employer Contributions (Not deducted from salary)</h4>
              <div class="employer-row">
                <span><strong>EPF Employer Contribution (12% of base salary):</strong></span>
                <span><strong>LKR ${epfEmployer.toLocaleString()}</strong></span>
              </div>
              <div class="employer-row">
                <span><strong>ETF Employer Contribution (3% of base salary):</strong></span>
                <span><strong>LKR ${etfEmployer.toLocaleString()}</strong></span>
              </div>
              <div class="employer-row" style="border-top: 1px solid #1976d2; padding-top: 5px; margin-top: 5px;">
                <span><strong>Total Employer Contributions:</strong></span>
                <span><strong>LKR ${(epfEmployer + etfEmployer).toLocaleString()}</strong></span>
              </div>
            </div>
            
            <!-- Net Pay Section -->
            <div class="net-pay-section">
              <div class="net-pay-row">
                <span><strong>Net Pay</strong></span>
                <span class="net-amount"><strong>LKR ${netPay.toLocaleString()}</strong></span>
              </div>
            </div>
            
            <div class="contact-info">
              For inquiries, please feel free to contact HR Department at hr@healx.com
            </div>
          </div>
          
          <div class="slip-footer">
            <div class="important-notes">
              <h4>📋 Important Notes:</h4>
              <ul>
                <li>This salary slip is generated electronically and is valid without physical signature</li>
                <li><strong>EPF Employee Contribution:</strong> 8% of base salary only (excludes bonuses)</li>
                <li><strong>EPF Employer Contribution:</strong> 12% of base salary paid by employer (not deducted from salary)</li>
                <li><strong>ETF Employer Contribution:</strong> 3% of base salary paid by employer (not deducted from salary)</li>
                <li><strong>Important:</strong> Bonuses are not included in EPF/ETF calculations as per Sri Lankan regulations</li>
                <li>All amounts are in Sri Lankan Rupees (LKR)</li>
              </ul>
            </div>
            
            <div class="signature-section">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-text">Employee Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-text">HR Manager Signature</div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 25px; font-size: 10px; color: #6c757d;">
              <p><strong>🏥 Heal-x Healthcare Management System</strong> | Generated on ${new Date().toLocaleString()}</p>
              <p>This is a computer-generated document and does not require a physical signature</p>
            </div>
          </div>
        </div>
        
        <div class="print-actions no-print">
          <button onclick="window.print()" class="print-btn">
            🖨️ Print Salary Slip
          </button>
          <button onclick="window.close()" class="print-btn close-btn">
            ❌ Close Window
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(salarySlipContent);
    printWindow.document.close();
    
    setSuccess(`Salary slip generated for ${payroll.employeeName}!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // 🚨 CRITICAL FIX: Recalculate existing payrolls on page load to fix backend issues
  const recalculatePayroll = async (payroll) => {
    const grossSalary = parseFloat(payroll.grossSalary) || 0;
    const deductions = parseFloat(payroll.deductions) || 0;
    const bonuses = parseFloat(payroll.bonuses) || 0;
    
    // Calculate correct values
    const epf = Math.round(grossSalary * 0.08);
    const etf = Math.round(grossSalary * 0.03);
    const netSalary = grossSalary + bonuses - deductions - epf;
    
    // Check if current values are wrong and need updating
    const currentNetSalary = payroll.netSalary || 0;
    const calculatedNetSalary = netSalary;
    
    console.log(`🔍 Payroll ${payroll.payrollId}: Current: ${currentNetSalary}, Should be: ${calculatedNetSalary}`);
    
    if (Math.abs(currentNetSalary - calculatedNetSalary) > 0.01) {
      console.log(`🚨 Found incorrect net salary for ${payroll.payrollId}. Updating...`);
      
      try {
        const updatedData = {
          ...payroll,
          epf: epf,
          etf: etf,
          netSalary: netSalary
        };
        
        await axios.put(`http://localhost:7000/api/payrolls/${payroll._id}`, updatedData);
        console.log(`✅ Updated ${payroll.payrollId} with correct net salary: ${netSalary}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to update ${payroll.payrollId}:`, error);
        return false;
      }
    }
    
    return false; // No update needed
  };

  // ✅ ENHANCED: Fetch payrolls and auto-fix incorrect calculations
  const fetchPayrollsWithFix = async () => {
    setLoading(true);
    setError('');
    
    try {
      const currentPagination = pagination || { page: 1, limit: 10 };
      
      const params = {
        page: currentPagination.page || 1,
        limit: currentPagination.limit || 10,
        ...(searchTerm && { employeeId: searchTerm }),
        ...(filterMonth && { payrollMonth: filterMonth }),
        ...(filterYear && { payrollYear: filterYear })
      };

      const response = await axios.get('http://localhost:7000/api/payrolls', { params });
      const result = response.data;
      
      if (result && result.success) {
        const payrollData = result.data || [];
        
        // 🚨 AUTO-FIX: Recalculate payrolls with wrong net salary
        let updatedCount = 0;
        for (const payroll of payrollData) {
          const wasUpdated = await recalculatePayroll(payroll);
          if (wasUpdated) updatedCount++;
        }
        
        if (updatedCount > 0) {
          console.log(`✅ Auto-fixed ${updatedCount} payroll records with incorrect calculations`);
          setSuccess(`Auto-fixed ${updatedCount} payroll records with incorrect net salary calculations`);
          
          // Refetch data after fixes
          const refetchResponse = await axios.get('http://localhost:7000/api/payrolls', { params });
          const refetchResult = refetchResponse.data;
          
          if (refetchResult && refetchResult.success) {
            setPayrolls(refetchResult.data || []);
            setPagination({
              page: refetchResult.pagination?.page || 1,
              limit: refetchResult.pagination?.limit || 10,
              total: refetchResult.pagination?.total || 0,
              pages: refetchResult.pagination?.pages || 1
            });
          }
        } else {
          setPayrolls(payrollData);
          setPagination({
            page: result.pagination?.page || 1,
            limit: result.pagination?.limit || 10,
            total: result.pagination?.total || 0,
            pages: result.pagination?.pages || 1
          });
        }
      } else {
        setPayrolls([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 1 });
      }
    } catch (error) {
      setError('Failed to fetch payrolls: ' + (error.response?.data?.message || error.message));
      setPayrolls([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  // Export functions remain the same but with fixed calculations...
  const exportToPDF = () => {
    if (payrolls.length === 0) {
      setError('No data to export');
      return;
    }

    const totals = payrolls.reduce((acc, payroll) => ({
      grossSalary: acc.grossSalary + (payroll.grossSalary || 0),
      deductions: acc.deductions + (payroll.deductions || 0),
      bonuses: acc.bonuses + (payroll.bonuses || 0),
      epf: acc.epf + (payroll.epf || 0),
      etf: acc.etf + (payroll.etf || 0),
      netSalary: acc.netSalary + (payroll.netSalary || 0)
    }), { grossSalary: 0, deductions: 0, bonuses: 0, epf: 0, etf: 0, netSalary: 0 });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Heal-x Payroll Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1da1f2; padding-bottom: 20px; }
          .header h1 { color: #1da1f2; margin: 0; font-size: 24px; }
          .header p { margin: 10px 0 0 0; color: #666; }
          .info { margin-bottom: 20px; text-align: right; font-size: 11px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1da1f2; color: white; font-weight: bold; text-align: center; }
          .currency { text-align: right; }
          .totals-row { background-color: #f0f8ff; font-weight: bold; }
          
          .signature-section { 
            margin-top: 60px; 
            margin-bottom: 30px; 
            width: 100%; 
            page-break-inside: avoid; 
          }
          .signature-container { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-top: 40px; 
          }
          .signature-block { 
            width: 45%; 
            text-align: center; 
          }
          .signature-line { 
            border-bottom: 2px dotted #333; 
            width: 200px; 
            height: 50px; 
            margin: 0 auto 10px auto; 
            position: relative;
          }
          .signature-text { 
            font-size: 11px; 
            font-weight: bold; 
            color: #333; 
            margin-top: 5px; 
          }
          .signature-title { 
            font-size: 10px; 
            color: #666; 
            margin-top: 2px; 
          }
          .company-stamp { 
            text-align: center; 
            margin-top: 30px; 
            padding: 15px; 
            border: 2px solid #1da1f2; 
            display: inline-block; 
            font-size: 10px; 
            color: #1da1f2; 
            font-weight: bold; 
          }
          .report-footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 9px; 
            color: #888; 
            border-top: 1px solid #ddd; 
            padding-top: 15px; 
          }
          
          @media print { 
            body { margin: 10px; } 
            .no-print { display: none; }
            .signature-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 Heal-x Financial Payroll Report</h1>
          <p>Employee Payroll Management System</p>
        </div>
        
        <div class="info">
          <strong>Generated on:</strong> ${new Date().toLocaleString()}<br>
          <strong>Total Records:</strong> ${payrolls.length}<br>
          <strong>Report Period:</strong> ${filterMonth || 'All Months'} ${filterYear || 'All Years'}<br>
          <strong>Note:</strong> EPF/ETF calculated on base salary only (excludes bonuses)
        </div>

        <table>
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Base Salary (LKR)</th>
              <th>Bonuses (LKR)</th>
              <th>Deductions (LKR)</th>
              <th>EPF Employee 8% (LKR)</th>
              <th>EPF Employer 12% (LKR)</th>
              <th>ETF Employer 3% (LKR)</th>
              <th>Net Salary (LKR)</th>
              <th>Status</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            ${payrolls.map(payroll => `
              <tr>
                <td><strong>${payroll.payrollId || 'N/A'}</strong></td>
                <td>${payroll.employeeName || 'N/A'}</td>
                <td>${payroll.employeeId || 'N/A'}</td>
                <td class="currency">${(payroll.grossSalary || 0).toLocaleString()}</td>
                <td class="currency">${(payroll.bonuses || 0).toLocaleString()}</td>
                <td class="currency">${(payroll.deductions || 0).toLocaleString()}</td>
                <td class="currency">${(payroll.epf || 0).toLocaleString()}</td>
                <td class="currency">${Math.round((payroll.grossSalary || 0) * 0.12).toLocaleString()}</td>
                <td class="currency">${Math.round((payroll.grossSalary || 0) * 0.03).toLocaleString()}</td>
                <td class="currency"><strong>${(payroll.netSalary || 0).toLocaleString()}</strong></td>
                <td>${payroll.status || 'Pending'}</td>
                <td>${payroll.payrollMonth || ''} ${payroll.payrollYear || ''}</td>
              </tr>
            `).join('')}
            <tr class="totals-row">
              <td><strong>TOTALS</strong></td>
              <td colspan="2"></td>
              <td class="currency"><strong>${totals.grossSalary.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.bonuses.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.deductions.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.epf.toLocaleString()}</strong></td>
              <td class="currency"><strong>${Math.round(totals.grossSalary * 0.12).toLocaleString()}</strong></td>
              <td class="currency"><strong>${Math.round(totals.grossSalary * 0.03).toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.netSalary.toLocaleString()}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-container">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Financial Manager</div>
              <div class="signature-title">Heal-x Healthcare Management</div>
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-text">Date: _______________</div>
              <div class="signature-title">Report Approved On</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <div class="company-stamp">
              🏥 HEAL-X OFFICIAL SEAL<br>
              HEALTHCARE MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        <div class="report-footer">
          <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${new Date().toLocaleString()} | All amounts are in Sri Lankan Rupees (LKR)</p>
          <p><strong>Important:</strong> EPF/ETF calculated on base salary only. Bonuses are excluded as per Sri Lankan regulations.</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #1da1f2; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer;">
            🖨️ Print PDF Report
          </button>
          <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 5px; font-size: 14px; cursor: pointer; margin-left: 10px;">
            ❌ Close
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setSuccess('PDF report opened! Use Ctrl+P to save as PDF.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const exportToExcel = () => {
    if (payrolls.length === 0) {
      setError('No data to export');
      return;
    }

    const headers = [
      'Payroll ID', 'Employee Name', 'Employee ID', 'Base Salary (LKR)', 'Bonuses (LKR)',
      'Deductions (LKR)', 'EPF Employee 8% (LKR)', 'EPF Employer 12% (LKR)', 'ETF Employer 3% (LKR)',
      'Net Salary (LKR)', 'Status', 'Month', 'Year', 'Created Date', 'Last Updated'
    ];

    const csvData = payrolls.map(payroll => [
      payroll.payrollId || '', payroll.employeeName || '', payroll.employeeId || '',
      payroll.grossSalary || 0, payroll.bonuses || 0, payroll.deductions || 0,
      payroll.epf || 0, Math.round((payroll.grossSalary || 0) * 0.12), Math.round((payroll.grossSalary || 0) * 0.03), payroll.netSalary || 0,
      payroll.status || 'Pending', payroll.payrollMonth || '', payroll.payrollYear || '',
      new Date(payroll.createdAt).toLocaleDateString(),
      new Date(payroll.updatedAt).toLocaleDateString()
    ]);

    const totals = payrolls.reduce((acc, payroll) => ({
      grossSalary: acc.grossSalary + (payroll.grossSalary || 0),
      deductions: acc.deductions + (payroll.deductions || 0),
      bonuses: acc.bonuses + (payroll.bonuses || 0),
      epf: acc.epf + (payroll.epf || 0),
      etf: acc.etf + (payroll.etf || 0),
      netSalary: acc.netSalary + (payroll.netSalary || 0)
    }), { grossSalary: 0, deductions: 0, bonuses: 0, epf: 0, etf: 0, netSalary: 0 });

    csvData.push([
      'TOTALS', `${payrolls.length} Employees`, '', totals.grossSalary, totals.bonuses,
      totals.deductions, totals.epf, Math.round(totals.grossSalary * 0.12), Math.round(totals.grossSalary * 0.03), totals.netSalary, '', '', '', '', ''
    ]);

    const csvContent = [
      `"Heal-x Financial Payroll Report (FIXED)"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      `"Total Records: ${payrolls.length}"`,
      `"Important: EPF/ETF calculated on base salary only (excludes bonuses)"`,
      '',
      headers.map(header => `"${header}"`).join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Heal-x-FIXED-Payroll-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setSuccess('Excel file (CSV format) with CORRECTED calculations downloaded!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const printTable = () => {
    if (payrolls.length === 0) {
      setError('No data to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Heal-x Payroll Table (FIXED)</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #1da1f2; color: white; }
          .currency { text-align: right; }
          .note { background: #d4edda; padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size: 11px; color: #155724; border: 1px solid #c3e6cb; }
        </style>
      </head>
      <body>
        <h2>🏥 Heal-x Payroll Records (FIXED)</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="note">
          <strong>✅ FIXED:</strong> Net salary calculations have been corrected. EPF and ETF contributions are calculated on base salary only. Bonuses are excluded from EPF/ETF calculations as per Sri Lankan regulations.
        </div>
        ${tableRef.current?.outerHTML || '<p>No data to print</p>'}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // 🚨 CRITICAL: Use the fixed fetch function with auto-correction
  useEffect(() => {
    fetchPayrollsWithFix();
  }, []);

  useEffect(() => {
    if (searchTerm !== '' || filterMonth !== '' || filterYear !== '') {
      const timer = setTimeout(() => {
        fetchPayrollsWithFix();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filterMonth, filterYear]);

  useEffect(() => {
    if (pagination.page > 1) {
      fetchPayrollsWithFix();
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const preview = calculatePreview();

  return (
    <div className="fp-payroll-container">
      {/* Header */}
      <div className="fp-header">
        <div className="fp-header-left">
          <h1>🏥 Heal-x Financial Payroll Management (FIXED)</h1>
          <p>Manage employee payrolls with automated EPF & ETF calculations (Base Salary Only) - Auto-fixes incorrect calculations</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="fp-message fp-error-message">
          <span className="fp-message-icon">❌</span>
          {error}
          <button className="fp-message-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="fp-message fp-success-message">
          <span className="fp-message-icon">✅</span>
          {success}
          <button className="fp-message-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="fp-back-navigation" style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/admin/financial')}
          className="fp-back-btn"
          style={{
            background: '#25a0c5ff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#25539eff'}
          onMouseOut={(e) => e.target.style.background = '#25a0c5ff'}
        >
          ⏮️ Back to Dashboard
        </button>
      </div>

      {/* Rest of the JSX remains the same... */}
      {/* Controls */}
      <div className="fp-controls">
        <div className="fp-controls-left">
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) resetForm();
            }}
            className="fp-primary-btn"
            disabled={loading}
          >
            {showForm ? '❌ Cancel' : '➕ Add New Payroll'}
          </button>
        </div>
        
        <div className="fp-controls-center">
          <input
            type="text"
            placeholder="🔍 Search by Employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="fp-search-input"
          />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="fp-filter-select"
          >
            <option value="">📅 All Months</option>
            {['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
              .map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="fp-filter-select"
          >
            <option value="">📅 All Years</option>
            {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="fp-controls-right">
          <button 
            onClick={exportToPDF} 
            className="fp-export-btn fp-pdf-btn"
            disabled={payrolls.length === 0}
            title="Generate PDF Report"
          >
            📄 PDF Report
          </button>
          <button 
            onClick={exportToExcel} 
            className="fp-export-btn fp-excel-btn"
            disabled={payrolls.length === 0}
            title="Download as CSV (Excel compatible)"
          >
            📊 Excel CSV
          </button>
          <button 
            onClick={printTable} 
            className="fp-export-btn fp-print-btn"
            disabled={payrolls.length === 0}
            title="Print Table"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Form with Validation */}
      {showForm && (
        <div className="fp-form-container">
          <h3>
            {editingPayroll ? '✏️ Edit Payroll Record' : '➕ Add New Payroll Record'}
          </h3>
          
          {/* EPF/ETF Calculation Notice */}
          <div style={{
            background: '#e3f2fd',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            borderLeft: '4px solid #1da1f2'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>📋 EPF/ETF Calculation Method</h4>
            <p style={{ margin: '0', fontSize: '12px', color: '#1976d2' }}>
              <strong>Important:</strong> EPF and ETF contributions are calculated on <strong>Base Salary only</strong>. 
              Bonuses are excluded from EPF/ETF calculations as per Sri Lankan regulations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="fp-payroll-form">
            <div className="fp-form-row">
              <div className="fp-form-group">
                <label>Payroll ID: <span className="fp-required">*</span></label>
                <input
                  type="text"
                  value={formData.payrollId}
                  onChange={handlePayrollIdChange}
                  required
                  disabled={loading}
                  placeholder="PR001"
                  maxLength={6}
                  className={validationErrors.payrollId ? 'fp-error' : ''}
                />
                {validationErrors.payrollId && (
                  <span className="fp-validation-error">{validationErrors.payrollId}</span>
                )}
                <small className="fp-field-hint">Format: PR001 (PR + 3 digits)</small>
              </div>
              
              <div className="fp-form-group">
                <label>Employee ID: <span className="fp-required">*</span></label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={handleEmployeeIdChange}
                  required
                  disabled={loading}
                  placeholder="EMP001"
                  maxLength={6}
                  className={validationErrors.employeeId ? 'fp-error' : ''}
                />
                {validationErrors.employeeId && (
                  <span className="fp-validation-error">{validationErrors.employeeId}</span>
                )}
                <small className="fp-field-hint">Format: EMP001 (EMP + 3 digits)</small>
              </div>
              
              <div className="fp-form-group">
                <label>Employee Name: <span className="fp-required">*</span></label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={handleEmployeeNameChange}
                  required
                  disabled={loading}
                  placeholder="John Doe"
                  maxLength={50}
                  className={validationErrors.employeeName ? 'fp-error' : ''}
                />
                {validationErrors.employeeName && (
                  <span className="fp-validation-error">{validationErrors.employeeName}</span>
                )}
                <small className="fp-field-hint">Letters and spaces only</small>
              </div>
            </div>

            <div className="fp-form-row">
              <div className="fp-form-group">
                <label>Base Salary (LKR): <span className="fp-required">*</span></label>
                <input
                  type="text"
                  value={formData.grossSalary}
                  onChange={(e) => handleNumericChange(e, 'grossSalary')}
                  required
                  disabled={loading}
                  placeholder="100000.00"
                  className={validationErrors.grossSalary ? 'fp-error' : ''}
                />
                {validationErrors.grossSalary && (
                  <span className="fp-validation-error">{validationErrors.grossSalary}</span>
                )}
                <small className="fp-field-hint" style={{color: '#1976d2', fontWeight: 'bold'}}>
                  Used for EPF/ETF calculations
                </small>
              </div>
              
              <div className="fp-form-group">
                <label>Deductions (LKR):</label>
                <input
                  type="text"
                  value={formData.deductions}
                  onChange={(e) => handleNumericChange(e, 'deductions')}
                  disabled={loading}
                  placeholder="0.00"
                  className={validationErrors.deductions ? 'fp-error' : ''}
                />
                {validationErrors.deductions && (
                  <span className="fp-validation-error">{validationErrors.deductions}</span>
                )}
                <small className="fp-field-hint">Numbers only (optional)</small>
              </div>
              
              <div className="fp-form-group">
                <label>Bonuses (LKR):</label>
                <input
                  type="text"
                  value={formData.bonuses}
                  onChange={(e) => handleNumericChange(e, 'bonuses')}
                  disabled={loading}
                  placeholder="0.00"
                  className={validationErrors.bonuses ? 'fp-error' : ''}
                />
                {validationErrors.bonuses && (
                  <span className="fp-validation-error">{validationErrors.bonuses}</span>
                )}
                <small className="fp-field-hint" style={{color: '#f57c00', fontWeight: 'bold'}}>
                  Excluded from EPF/ETF calculations
                </small>
              </div>
            </div>

            <div className="fp-form-row">
              <div className="fp-form-group">
                <label>Month: <span className="fp-required">*</span> 🔒</label>
                <div 
                  style={{
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#495057',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {getCurrentMonth()} (Current Month Only)
                </div>
                <small style={{ color: '#6c757d' }}>🔒 Fixed to current month</small>
              </div>
              
              <div className="fp-form-group">
                <label>Year: <span className="fp-required">*</span> 🔒</label>
                <div 
                  style={{
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#495057',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {getCurrentYear()} (Current Year Only)
                </div>
                <small style={{ color: '#6c757d' }}>🔒 Fixed to current year</small>
              </div>
              
              <div className="fp-form-group">
                <label>✅ Corrected Calculations:</label>
                <div className="fp-calculation-preview">
                  <div style={{ color: '#1976d2', fontWeight: 'bold' }}>
                    EPF Employee (8% of base): <strong>LKR {preview.epf.toLocaleString()}</strong>
                  </div>
                  <div style={{ color: '#28a745' }}>
                    EPF Employer (12% of base): <strong>LKR {Math.round((parseFloat(formData.grossSalary) || 0) * 0.12).toLocaleString()}</strong>
                  </div>
                  <div style={{ color: '#17a2b8' }}>
                    ETF Employer (3% of base): <strong>LKR {Math.round((parseFloat(formData.grossSalary) || 0) * 0.03).toLocaleString()}</strong>
                  </div>
                  <div className="fp-net-preview" style={{ color: '#28a745', fontSize: '16px' }}>
                    Net Salary: <strong>LKR {preview.netSalary.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="fp-form-actions">
              <button 
                type="submit" 
                disabled={loading || !isFormValid()} 
                className="fp-primary-btn"
              >
                {loading ? '⏳ Processing...' : (editingPayroll ? '✅ Update Payroll' : '✅ Create Payroll')}
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="fp-secondary-btn"
                disabled={loading}
              >
                🔄 Reset Form
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="fp-cancel-btn"
                disabled={loading}
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      {payrolls.length > 0 && (
        <div className="fp-stats-container">
          <div className="fp-stat-card">
            <h4>📊 Total Records</h4>
            <p>{payrolls.length}</p>
          </div>
          <div className="fp-stat-card">
            <h4>💰 Total Base Salary</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0).toLocaleString()}</p>
          </div>
          <div className="fp-stat-card">
            <h4>🎁 Total Bonuses</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.bonuses || 0), 0).toLocaleString()}</p>
          </div>
          <div className="fp-stat-card">
            <h4>💵 Total Net Salary</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0).toLocaleString()}</p>
          </div>
          <div className="fp-stat-card">
            <h4>🏛️ Total EPF Employee</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.epf || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* CORRECTED: Table with proper EPF/ETF columns */}
      <div className="fp-table-container">
        <table ref={tableRef} className="fp-payroll-table">
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Base Salary</th>
              <th>Bonuses</th>
              <th>Deductions</th>
              <th>EPF Employee (8%)</th>
              <th>EPF Employer (12%)</th>
              <th>ETF Employer (3%)</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" className="fp-loading">⏳ Loading and fixing payroll records...</td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan="13" className="fp-no-data">
                  📝 No payroll records found. Click "Add New Payroll" to create your first record.
                </td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll._id}>
                  <td><strong>{payroll.payrollId}</strong></td>
                  <td>{payroll.employeeName}</td>
                  <td>{payroll.employeeId}</td>
                  <td className="fp-currency">LKR {(payroll.grossSalary || 0).toLocaleString()}</td>
                  <td className="fp-currency">LKR {(payroll.bonuses || 0).toLocaleString()}</td>
                  <td className="fp-currency">LKR {(payroll.deductions || 0).toLocaleString()}</td>
                  <td className="fp-currency fp-epf">LKR {(payroll.epf || 0).toLocaleString()}</td>
                  <td className="fp-currency" style={{color: '#28a745'}}>LKR {Math.round((payroll.grossSalary || 0) * 0.12).toLocaleString()}</td>
                  <td className="fp-currency" style={{color: '#17a2b8'}}>LKR {Math.round((payroll.grossSalary || 0) * 0.03).toLocaleString()}</td>
                  <td className="fp-currency fp-net-salary" style={{color: '#28a745', fontWeight: 'bold'}}>LKR {(payroll.netSalary || 0).toLocaleString()}</td>
                  <td>
                    <select
                      value={payroll.status || 'Pending'}
                      onChange={(e) => updateStatus(payroll._id, e.target.value)}
                      className={`fp-status-select fp-${(payroll.status || 'pending').toLowerCase()}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processed">Processed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td>{payroll.payrollMonth} {payroll.payrollYear}</td>
                  <td className="fp-actions">
                    <button 
                      onClick={() => handleEdit(payroll)}
                      className="fp-edit-btn"
                      title="Edit Payroll"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(payroll._id)}
                      className="fp-delete-btn"
                      title="Delete Payroll"
                      disabled={loading}
                    >
                      🗑️
                    </button>
                    <button 
                      onClick={() => generateSalarySlip(payroll)}
                      className="fp-salary-slip-btn"
                      title="Generate Salary Slip"
                      disabled={loading}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '5px 8px',
                        margin: '2px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📄
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="fp-pagination">
          <button
            onClick={() => setPagination(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
            disabled={pagination.page === 1 || loading}
            className="fp-page-btn"
          >
            ⬅️ Previous
          </button>
          
          <span className="fp-page-info">
            📄 Page {pagination.page} of {pagination.pages} 
            ({pagination.total} total records)
          </span>
          
          <button
            onClick={() => setPagination(prev => ({...prev, page: Math.min(prev.pages, prev.page + 1)}))}
            disabled={pagination.page >= pagination.pages || loading}
            className="fp-page-btn"
          >
            Next ➡️
          </button>
        </div>
      )}
    </div>
  );
};

export default FinancialPayroll;
