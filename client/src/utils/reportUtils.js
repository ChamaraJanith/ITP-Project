// src/utils/reportUtils.js

export const reportUtils = {
  // Download file helper
  downloadFile: (blob, filename, mimeType) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Generate filename based on report data
  generateFilename: (reportData) => {
    const { reportType, month, year, reportFormat } = reportData;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[month - 1];
    const extension = reportFormat === 'pdf' ? 'pdf' : reportFormat === 'excel' ? 'xlsx' : 'html';
    
    return `${reportType}_Report_${monthName}_${year}.${extension}`;
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format percentage
  formatPercentage: (value) => {
    return `${(value * 100).toFixed(2)}%`;
  },

  // Generate report preview data
  generateReportPreview: (formData, systemStats) => {
    const sections = [];
    
    if (formData.includeFinancials) sections.push('Financial Summary');
    if (formData.includePatients) sections.push('Patient Statistics');
    if (formData.includeStaff) sections.push('Staff Performance');
    if (formData.includeAppointments) sections.push('Appointments');
    if (formData.includeBilling) sections.push('Billing & Revenue');
    if (formData.includeAnalytics) sections.push('Growth Analytics');

    return {
      title: `${formData.reportType.charAt(0).toUpperCase() + formData.reportType.slice(1)} Report`,
      period: `${this.getMonthName(formData.month)} ${formData.year}`,
      sections: sections.join(', ') || 'No sections selected',
      format: formData.reportFormat.toUpperCase(),
      estimatedPages: Math.max(1, sections.length * 2),
      dataPoints: systemStats.totalUsers + systemStats.totalStaff + systemStats.totalPatients
    };
  },

  // Get month name
  getMonthName: (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  }
};
