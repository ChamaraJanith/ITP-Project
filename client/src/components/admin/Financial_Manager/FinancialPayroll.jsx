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
  
  // ✅ Safe pagination state with all required properties
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // ✅ Safe form state
  const [formData, setFormData] = useState({
    payrollId: '',
    employeeId: '',
    employeeName: '',
    grossSalary: '',
    deductions: '',
    bonuses: '',
    payrollMonth: '',
    payrollYear: new Date().getFullYear()
  });

  // ✅ Form validation errors state
  const [validationErrors, setValidationErrors] = useState({
    payrollId: '',
    employeeId: '',
    employeeName: '',
    grossSalary: '',
    deductions: '',
    bonuses: ''
  });

  const tableRef = useRef(null);

  // ✅ Validation functions
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

  // ✅ Real-time field validation
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

  // ✅ Check if form is valid
  const isFormValid = () => {
    const errors = Object.values(validationErrors);
    const hasErrors = errors.some(error => error !== '');
    const hasEmptyRequired = !formData.payrollId || !formData.employeeId || 
                            !formData.employeeName || !formData.grossSalary || 
                            !formData.payrollMonth;
    return !hasErrors && !hasEmptyRequired;
  };

  // ✅ FIXED: Input formatters and handlers - Allow partial typing
  const handlePayrollIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Allow partial inputs that build towards PR###
    // Allow: "", "P", "PR", "PR1", "PR12", "PR123"
    const partialPattern = /^(P(R\d{0,3})?)?$/;
    
    if (value.length <= 6 && partialPattern.test(value)) {
      setFormData(prev => ({ ...prev, payrollId: value }));
      validateField('payrollId', value);
    }
  };

  const handleEmployeeIdChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Allow partial inputs that build towards EMP###
    // Allow: "", "E", "EM", "EMP", "EMP1", "EMP12", "EMP123"
    const partialPattern = /^(E(M(P\d{0,3})?)?)?$/;
    
    if (value.length <= 6 && partialPattern.test(value)) {
      setFormData(prev => ({ ...prev, employeeId: value }));
      validateField('employeeId', value);
    }
  };

  const handleEmployeeNameChange = (e) => {
    let value = e.target.value;
    // Only allow letters and spaces
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormData(prev => ({ ...prev, employeeName: value }));
      validateField('employeeName', value);
    }
  };

  const handleNumericChange = (e, fieldName) => {
    let value = e.target.value;
    // Allow empty, digits, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      validateField(fieldName, value);
    }
  };

  // ✅ FIXED fetchPayrolls function with proper backend URL
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

      console.log('Making API request with params:', params);
      const response = await axios.get('http://localhost:7000/api/payrolls', { params });
      console.log('API Response:', response.data);
      
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
      console.error('API Error:', error);
      setError('Failed to fetch payrolls: ' + (error.response?.data?.message || error.message));
      setPayrolls([]);
      setPagination({ page: 1, limit: 10, total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Create or update payroll with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate all fields before submission
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
      if (editingPayroll) {
        await axios.put(`http://localhost:7000/api/payrolls/${editingPayroll._id}`, formData);
        setSuccess('Payroll updated successfully!');
      } else {
        await axios.post('http://localhost:7000/api/payrolls', formData);
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

  // ✅ FIXED Delete payroll with proper backend URL
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

  // ✅ FIXED Update payroll status with proper backend URL
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

  // ✅ UPDATED: Reset form with validation errors
  const resetForm = () => {
    setFormData({
      payrollId: '',
      employeeId: '',
      employeeName: '',
      grossSalary: '',
      deductions: '',
      bonuses: '',
      payrollMonth: '',
      payrollYear: new Date().getFullYear()
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

  // Edit payroll
  const handleEdit = (payroll) => {
    setFormData({
      payrollId: payroll.payrollId,
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      grossSalary: payroll.grossSalary,
      deductions: payroll.deductions || 0,
      bonuses: payroll.bonuses || 0,
      payrollMonth: payroll.payrollMonth,
      payrollYear: payroll.payrollYear
    });
    setEditingPayroll(payroll);
    setShowForm(true);
    setError('');
    // Clear validation errors when editing
    setValidationErrors({
      payrollId: '',
      employeeId: '',
      employeeName: '',
      grossSalary: '',
      deductions: '',
      bonuses: ''
    });
  };

  // Calculate preview values for form
  const calculatePreview = () => {
    const gross = parseFloat(formData.grossSalary) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;
    
    const epf = Math.round(gross * 0.08);
    const etf = Math.round(gross * 0.03);
    const netSalary = gross + bonuses - deductions - epf - etf;
    
    return { epf, etf, netSalary };
  };

  // ✅ UPDATED: Export to PDF with Professional Signature Section
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
          
          /* ✅ NEW: Signature Section Styles */
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
          <strong>Report Period:</strong> ${filterMonth || 'All Months'} ${filterYear || 'All Years'}
        </div>

        <table>
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Gross Salary ($)</th>
              <th>Deductions ($)</th>
              <th>Bonuses ($)</th>
              <th>EPF 8% ($)</th>
              <th>ETF 3% ($)</th>
              <th>Net Salary ($)</th>
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
                <td class="currency">${(payroll.deductions || 0).toLocaleString()}</td>
                <td class="currency">${(payroll.bonuses || 0).toLocaleString()}</td>
                <td class="currency">${(payroll.epf || 0).toLocaleString()}</td>
                <td class="currency">${(payroll.etf || 0).toLocaleString()}</td>
                <td class="currency"><strong>${(payroll.netSalary || 0).toLocaleString()}</strong></td>
                <td>${payroll.status || 'Pending'}</td>
                <td>${payroll.payrollMonth || ''} ${payroll.payrollYear || ''}</td>
              </tr>
            `).join('')}
            <tr class="totals-row">
              <td><strong>TOTALS</strong></td>
              <td colspan="2"></td>
              <td class="currency"><strong>${totals.grossSalary.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.deductions.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.bonuses.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.epf.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.etf.toLocaleString()}</strong></td>
              <td class="currency"><strong>${totals.netSalary.toLocaleString()}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>

        <!-- ✅ NEW: Professional Signature Section -->
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

        <!-- ✅ NEW: Report Footer -->
        <div class="report-footer">
          <p><strong>This is a system-generated report from Heal-x Healthcare Management System</strong></p>
          <p>Report generated on ${new Date().toLocaleString()} | All amounts are in Sri Lankan Rupees ($)</p>
          <p>For queries regarding this report, contact the Financial Department at Heal-x Healthcare</p>
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
      'Payroll ID', 'Employee Name', 'Employee ID', 'Gross Salary ($)',
      'Deductions ($)', 'Bonuses ($)', 'EPF 8% ($)', 'ETF 3% ($)',
      'Net Salary ($)', 'Status', 'Month', 'Year', 'Created Date', 'Last Updated'
    ];

    const csvData = payrolls.map(payroll => [
      payroll.payrollId || '', payroll.employeeName || '', payroll.employeeId || '',
      payroll.grossSalary || 0, payroll.deductions || 0, payroll.bonuses || 0,
      payroll.epf || 0, payroll.etf || 0, payroll.netSalary || 0,
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
      'TOTALS', `${payrolls.length} Employees`, '', totals.grossSalary,
      totals.deductions, totals.bonuses, totals.epf, totals.etf,
      totals.netSalary, '', '', '', '', ''
    ]);

    const csvContent = [
      `"Heal-x Financial Payroll Report"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      `"Total Records: ${payrolls.length}"`,
      '',
      headers.map(header => `"${header}"`).join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Heal-x-Payroll-Data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setSuccess('Excel file (CSV format) downloaded successfully!');
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
        <title>Heal-x Payroll Table</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #1da1f2; color: white; }
          .currency { text-align: right; }
        </style>
      </head>
      <body>
        <h2>🏥 Heal-x Payroll Records</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        ${tableRef.current?.outerHTML || '<p>No data to print</p>'}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // ✅ Get current date for date restrictions
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // ✅ Fixed useEffect with proper dependency management
  useEffect(() => {
    fetchPayrolls();
  }, []);

  useEffect(() => {
    if (searchTerm !== '' || filterMonth !== '' || filterYear !== '') {
      const timer = setTimeout(() => {
        fetchPayrolls();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filterMonth, filterYear]);

  useEffect(() => {
    if (pagination.page > 1) {
      fetchPayrolls();
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
          <h1>🏥 Heal-x Financial Payroll Management</h1>
          <p>Manage employee payrolls with automated EPF & ETF calculations</p>
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
    onClick={() => navigate('/admin/financial')} // This should now work
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
                <label>Gross Salary ($): <span className="fp-required">*</span></label>
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
                <small className="fp-field-hint">Numbers only</small>
              </div>
              
              <div className="fp-form-group">
                <label>Deductions ($):</label>
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
                <label>Bonuses ($):</label>
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
                <small className="fp-field-hint">Numbers only (optional)</small>
              </div>
            </div>

            <div className="fp-form-row">
              <div className="fp-form-group">
                <label>Month: <span className="fp-required">*</span></label>
                <select
                  value={formData.payrollMonth}
                  onChange={(e) => setFormData({...formData, payrollMonth: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">Select Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December']
                    .map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div className="fp-form-group">
                <label>Year: <span className="fp-required">*</span></label>
                <input
                  type="number"
                  value={formData.payrollYear}
                  onChange={(e) => setFormData({...formData, payrollYear: e.target.value})}
                  required
                  min={new Date().getFullYear()}
                  max="2030"
                  disabled={loading}
                />
                <small className="fp-field-hint">Current year or future years only</small>
              </div>
              
              <div className="fp-form-group">
                <label>Automatic Calculations:</label>
                <div className="fp-calculation-preview">
                  <div>EPF (8%): <strong>$ {preview.epf.toLocaleString()}</strong></div>
                  <div>ETF (3%): <strong>$ {preview.etf.toLocaleString()}</strong></div>
                  <div className="fp-net-preview">Net Salary: <strong>$ {preview.netSalary.toLocaleString()}</strong></div>
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
            <h4>💰 Total Gross Salary</h4>
            <p>$ {payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0).toLocaleString()}</p>
          </div>
          <div className="fp-stat-card">
            <h4>💵 Total Net Salary</h4>
            <p>$ {payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0).toLocaleString()}</p>
          </div>
          <div className="fp-stat-card">
            <h4>🏛️ Total EPF</h4>
            <p>$ {payrolls.reduce((sum, p) => sum + (p.epf || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="fp-table-container">
        <table ref={tableRef} className="fp-payroll-table">
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Gross Salary</th>
              <th>Deductions</th>
              <th>Bonuses</th>
              <th>EPF (8%)</th>
              <th>ETF (3%)</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="fp-loading">⏳ Loading payroll records...</td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan="12" className="fp-no-data">
                  📝 No payroll records found. Click "Add New Payroll" to create your first record.
                </td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll._id}>
                  <td><strong>{payroll.payrollId}</strong></td>
                  <td>{payroll.employeeName}</td>
                  <td>{payroll.employeeId}</td>
                  <td className="fp-currency">$ {(payroll.grossSalary || 0).toLocaleString()}</td>
                  <td className="fp-currency">$ {(payroll.deductions || 0).toLocaleString()}</td>
                  <td className="fp-currency">$ {(payroll.bonuses || 0).toLocaleString()}</td>
                  <td className="fp-currency fp-epf">$ {(payroll.epf || 0).toLocaleString()}</td>
                  <td className="fp-currency fp-etf">$ {(payroll.etf || 0).toLocaleString()}</td>
                  <td className="fp-currency fp-net-salary">$ {(payroll.netSalary || 0).toLocaleString()}</td>
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
