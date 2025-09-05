import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

  const tableRef = useRef(null);

  // ✅ FIXED fetchPayrolls function with proper backend URL
  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Safe access to pagination state with defaults
      const currentPagination = pagination || { page: 1, limit: 10 };
      
      const params = {
        page: currentPagination.page || 1,
        limit: currentPagination.limit || 10,
        ...(searchTerm && { employeeId: searchTerm }),
        ...(filterMonth && { payrollMonth: filterMonth }),
        ...(filterYear && { payrollYear: filterYear })
      };

      console.log('Making API request with params:', params);
      // ✅ FIXED: Use full backend URL
      const response = await axios.get('http://localhost:7000/api/payrolls', { params });
      console.log('API Response:', response.data);
      
      // ✅ Safe access to response data - Fixed parsing
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
        // Handle unsuccessful response
        setPayrolls([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }
    } catch (error) {
      console.error('API Error:', error);
      setError('Failed to fetch payrolls: ' + (error.response?.data?.message || error.message));
      
      // Set safe defaults on error
      setPayrolls([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED Create or update payroll with proper backend URL
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingPayroll) {
        // ✅ FIXED: Use full backend URL
        await axios.put(`http://localhost:7000/api/payrolls/${editingPayroll._id}`, formData);
        setSuccess('Payroll updated successfully!');
      } else {
        // ✅ FIXED: Use full backend URL
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
      // ✅ FIXED: Use full backend URL
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
      // ✅ FIXED: Use full backend URL
      await axios.patch(`http://localhost:7000/api/payrolls/${id}/status`, { status });
      setSuccess('Status updated successfully!');
      fetchPayrolls();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update status: ' + (error.response?.data?.message || error.message));
    }
  };

  // Reset form
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

  // Export to PDF
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
          @media print { body { margin: 10px; } .no-print { display: none; } }
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
              <th>Gross Salary (LKR)</th>
              <th>Deductions (LKR)</th>
              <th>Bonuses (LKR)</th>
              <th>EPF 8% (LKR)</th>
              <th>ETF 3% (LKR)</th>
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

  // Export to Excel (CSV)
  const exportToExcel = () => {
    if (payrolls.length === 0) {
      setError('No data to export');
      return;
    }

    const headers = [
      'Payroll ID', 'Employee Name', 'Employee ID', 'Gross Salary (LKR)',
      'Deductions (LKR)', 'Bonuses (LKR)', 'EPF 8% (LKR)', 'ETF 3% (LKR)',
      'Net Salary (LKR)', 'Status', 'Month', 'Year', 'Created Date', 'Last Updated'
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

  // Print table
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

  // ✅ Fixed useEffect with proper dependency management
  useEffect(() => {
    // Initial fetch on mount
    fetchPayrolls();
  }, []); // Only run once on mount

  // Separate useEffect for search/filter changes
  useEffect(() => {
    if (searchTerm !== '' || filterMonth !== '' || filterYear !== '') {
      const timer = setTimeout(() => {
        fetchPayrolls();
      }, 300); // Debounce search
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filterMonth, filterYear]);

  // Separate useEffect for pagination changes
  useEffect(() => {
    if (pagination.page > 1) {
      fetchPayrolls();
    }
  }, [pagination.page, pagination.limit]);

  // Clear messages after some time
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
    <div className="payroll-container">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1>🏥 Heal-x Financial Payroll Management</h1>
          <p>Manage employee payrolls with automated EPF & ETF calculations</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error-message">
          <span className="message-icon">❌</span>
          {error}
          <button className="message-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="message success-message">
          <span className="message-icon">✅</span>
          {success}
          <button className="message-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="controls-left">
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) resetForm();
            }}
            className="primary-btn"
            disabled={loading}
          >
            {showForm ? '❌ Cancel' : '➕ Add New Payroll'}
          </button>
        </div>
        
        <div className="controls-center">
          <input
            type="text"
            placeholder="🔍 Search by Employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="filter-select"
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
            className="filter-select"
          >
            <option value="">📅 All Years</option>
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="controls-right">
          <button 
            onClick={exportToPDF} 
            className="export-btn pdf-btn"
            disabled={payrolls.length === 0}
            title="Generate PDF Report"
          >
            📄 PDF Report
          </button>
          <button 
            onClick={exportToExcel} 
            className="export-btn excel-btn"
            disabled={payrolls.length === 0}
            title="Download as CSV (Excel compatible)"
          >
            📊 Excel CSV
          </button>
          <button 
            onClick={printTable} 
            className="export-btn print-btn"
            disabled={payrolls.length === 0}
            title="Print Table"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-container">
          <h3>
            {editingPayroll ? '✏️ Edit Payroll Record' : '➕ Add New Payroll Record'}
          </h3>
          <form onSubmit={handleSubmit} className="payroll-form">
            <div className="form-row">
              <div className="form-group">
                <label>Payroll ID: <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.payrollId}
                  onChange={(e) => setFormData({...formData, payrollId: e.target.value})}
                  required
                  disabled={loading}
                  placeholder="e.g., PR001"
                />
              </div>
              <div className="form-group">
                <label>Employee ID: <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  required
                  disabled={loading}
                  placeholder="e.g., EMP001"
                />
              </div>
              <div className="form-group">
                <label>Employee Name: <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                  required
                  disabled={loading}
                  placeholder="Full Name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gross Salary (LKR): <span className="required">*</span></label>
                <input
                  type="number"
                  value={formData.grossSalary}
                  onChange={(e) => setFormData({...formData, grossSalary: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  disabled={loading}
                  placeholder="100000.00"
                />
              </div>
              <div className="form-group">
                <label>Deductions (LKR):</label>
                <input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                  min="0"
                  step="0.01"
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Bonuses (LKR):</label>
                <input
                  type="number"
                  value={formData.bonuses}
                  onChange={(e) => setFormData({...formData, bonuses: e.target.value})}
                  min="0"
                  step="0.01"
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Month: <span className="required">*</span></label>
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
              <div className="form-group">
                <label>Year: <span className="required">*</span></label>
                <input
                  type="number"
                  value={formData.payrollYear}
                  onChange={(e) => setFormData({...formData, payrollYear: e.target.value})}
                  required
                  min="2020"
                  max="2030"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Automatic Calculations:</label>
                <div className="calculation-preview">
                  <div>EPF (8%): <strong>LKR {preview.epf.toLocaleString()}</strong></div>
                  <div>ETF (3%): <strong>LKR {preview.etf.toLocaleString()}</strong></div>
                  <div className="net-preview">Net Salary: <strong>LKR {preview.netSalary.toLocaleString()}</strong></div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="primary-btn">
                {loading ? '⏳ Processing...' : (editingPayroll ? '✅ Update Payroll' : '✅ Create Payroll')}
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="secondary-btn"
                disabled={loading}
              >
                🔄 Reset Form
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="cancel-btn"
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
        <div className="stats-container">
          <div className="stat-card">
            <h4>📊 Total Records</h4>
            <p>{payrolls.length}</p>
          </div>
          <div className="stat-card">
            <h4>💰 Total Gross Salary</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h4>💵 Total Net Salary</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h4>🏛️ Total EPF</h4>
            <p>LKR {payrolls.reduce((sum, p) => sum + (p.epf || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table ref={tableRef} className="payroll-table">
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
                <td colSpan="12" className="loading">⏳ Loading payroll records...</td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan="12" className="no-data">
                  📝 No payroll records found. Click "Add New Payroll" to create your first record.
                </td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll._id}>
                  <td><strong>{payroll.payrollId}</strong></td>
                  <td>{payroll.employeeName}</td>
                  <td>{payroll.employeeId}</td>
                  <td className="currency">LKR {(payroll.grossSalary || 0).toLocaleString()}</td>
                  <td className="currency">LKR {(payroll.deductions || 0).toLocaleString()}</td>
                  <td className="currency">LKR {(payroll.bonuses || 0).toLocaleString()}</td>
                  <td className="currency epf">LKR {(payroll.epf || 0).toLocaleString()}</td>
                  <td className="currency etf">LKR {(payroll.etf || 0).toLocaleString()}</td>
                  <td className="currency net-salary">LKR {(payroll.netSalary || 0).toLocaleString()}</td>
                  <td>
                    <select
                      value={payroll.status || 'Pending'}
                      onChange={(e) => updateStatus(payroll._id, e.target.value)}
                      className={`status-select ${(payroll.status || 'pending').toLowerCase()}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processed">Processed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td>{payroll.payrollMonth} {payroll.payrollYear}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleEdit(payroll)}
                      className="edit-btn"
                      title="Edit Payroll"
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(payroll._id)}
                      className="delete-btn"
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
        <div className="pagination">
          <button
            onClick={() => setPagination(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
            disabled={pagination.page === 1 || loading}
            className="page-btn"
          >
            ⬅️ Previous
          </button>
          
          <span className="page-info">
            📄 Page {pagination.page} of {pagination.pages} 
            ({pagination.total} total records)
          </span>
          
          <button
            onClick={() => setPagination(prev => ({...prev, page: Math.min(prev.pages, prev.page + 1)}))}
            disabled={pagination.page >= pagination.pages || loading}
            className="page-btn"
          >
            Next ➡️
          </button>
        </div>
      )}
    </div>
  );
};

export default FinancialPayroll;
