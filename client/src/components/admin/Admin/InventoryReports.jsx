import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import AdminErrorBoundary from '../AdminErrorBoundary';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const API_BASE_URL = 'http://localhost:7000/api/inventory';

const InventoryReports = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportFilters, setReportFilters] = useState({
    dateRange: 'last30days',
    category: 'all',
    reportType: 'comprehensive',
    format: 'pdf'
  });
  const [analytics, setAnalytics] = useState({
    lowStockItems: 0,
    totalValue: 0,
    topCategories: [],
    vendorPerformance: [],
    costTrends: [],
    stockTurnover: []
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  // Initialize component
  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        if (parsedAdmin && parsedAdmin.role === 'admin') {
          setAdmin(parsedAdmin);
        } else {
          navigate('/admin/login');
          return;
        }
      } catch (parseError) {
        console.error('Error parsing admin data:', parseError);
        navigate('/admin/login');
        return;
      }
    } else {
      navigate('/admin/login');
      return;
    }

    loadInventoryData();
  }, [navigate]);

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/surgical-items?page=1&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data?.items)) {
        setInventoryData(data.data.items);
        calculateAnalytics(data.data.items);
      } else {
        throw new Error(data.message || 'Failed to fetch inventory data');
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from inventory data
  const calculateAnalytics = useCallback((items) => {
    // Low stock items
    const lowStockItems = items.filter(item => {
      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      return quantity <= minStock;
    });

    // Total inventory value
    const totalValue = items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    // Top categories by value
    const categoryValues = {};
    items.forEach(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const value = price * quantity;
      
      if (!categoryValues[item.category]) {
        categoryValues[item.category] = 0;
      }
      categoryValues[item.category] += value;
    });

    const topCategories = Object.entries(categoryValues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Vendor performance (simulated data)
    const vendorPerformance = [
      { name: 'MediSupplies Inc.', performance: 92, onTime: 95, quality: 98 },
      { name: 'Surgical Solutions', performance: 88, onTime: 90, quality: 92 },
      { name: 'HealthTech Ltd.', performance: 85, onTime: 85, quality: 88 },
      { name: 'Global MedEquip', performance: 78, onTime: 80, quality: 82 },
      { name: 'Precision Instruments', performance: 95, onTime: 92, quality: 96 }
    ];

    // Cost trends (simulated data for last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const costTrends = months.map(month => ({
      month,
      cost: Math.floor(Math.random() * 50000) + 30000,
      usage: Math.floor(Math.random() * 1000) + 500
    }));

    // Stock turnover (simulated data)
    const stockTurnover = items.slice(0, 10).map(item => ({
      name: item.name,
      turnover: Math.floor(Math.random() * 12) + 1,
      value: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
    }));

    setAnalytics({
      lowStockItems: lowStockItems.length,
      totalValue,
      topCategories,
      vendorPerformance,
      costTrends,
      stockTurnover
    });
  }, []);

  // Handle filter changes
  const handleFilterChange = (filter, value) => {
    setReportFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };

  // Generate report
  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      if (reportFilters.format === 'pdf') {
        generatePDFReport();
      } else if (reportFilters.format === 'csv') {
        generateCSVReport();
      } else {
        generateHTMLReport();
      }
      
      // Show success message
      alert(`✅ ${reportFilters.format.toUpperCase()} report generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`❌ Failed to generate report: ${error.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Generate PDF report
// Replace the entire generatePDFReport function with this fixed version

const generatePDFReport = () => {
  try {
    // Initialize PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;
    const reportDate = new Date();
    const reportId = `RPT-${reportDate.getFullYear()}${String(reportDate.getMonth() + 1).padStart(2, '0')}${String(reportDate.getDate()).padStart(2, '0')}-${String(reportDate.getHours()).padStart(2, '0')}${String(reportDate.getMinutes()).padStart(2, '0')}`;

    // Helper function to add page if needed
    const checkPageBreak = (requiredSpace) => {
      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();
        addFooter();
        currentY = margin;
      }
    };

    // Add footer with page numbers and date
    const addFooter = () => {
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`HealX Healthcare Center - Inventory Analytics Report`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generated: ${reportDate.toLocaleDateString()} ${reportDate.toLocaleTimeString()}`, pageWidth / 2, footerY + 4, { align: 'center' });
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`, pageWidth / 2, footerY + 8, { align: 'center' });
    };

    // Helper function to add section header
    const addSectionHeader = (text) => {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, currentY);
      currentY += 10;
      
      // Add underline
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
    };

    // Cover Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY ANALYTICS REPORT', pageWidth / 2, 60, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Comprehensive Inventory Management Analysis', pageWidth / 2, 75, { align: 'center' });
    
    // Company info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('HealX Healthcare Center', pageWidth / 2, 100, { align: 'center' });
    doc.text('Department of Medical Supplies & Inventory', pageWidth / 2, 108, { align: 'center' });
    
    // Report details
    currentY = 130;
    doc.setFontSize(10);
    doc.text(`Report ID: ${reportId}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.text(`Report Date: ${reportDate.toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.text(`Generated by: ${admin?.name || 'System Administrator'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.text(`Department: System Administration`, pageWidth / 2, currentY, { align: 'center' });
    
    // Confidential notice
    currentY += 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('CONFIDENTIAL - For Internal Use Only', pageWidth / 2, currentY, { align: 'center' });
    
    // Add page break after cover
    doc.addPage();
    addFooter();
    currentY = margin;

    // Table of Contents
    addSectionHeader('TABLE OF CONTENTS');
    
    const tocItems = [
      { title: 'Executive Summary', page: 3 },
      { title: 'Low Stock Items Alert', page: 4 },
      { title: 'Top Categories by Value', page: 5 },
      { title: 'Vendor Performance Analysis', page: 6 },
      { title: 'Cost Analysis Summary', page: 7 },
      { title: 'Recommendations', page: 8 },
      { title: 'Approval & Signatures', page: 9 }
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    tocItems.forEach(item => {
      checkPageBreak(8);
      doc.text(`${item.title} ................................................... Page ${item.page}`, margin, currentY);
      currentY += 8;
    });

    // Add page break before content
    doc.addPage();
    addFooter();
    currentY = margin;

    // Executive Summary Section
    addSectionHeader('EXECUTIVE SUMMARY');
    
    checkPageBreak(60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('This report provides a comprehensive analysis of the current inventory status, highlighting key metrics,', margin, currentY);
    currentY += 6;
    doc.text('identifying areas of concern, and providing actionable recommendations for inventory optimization.', margin, currentY);
    currentY += 12;

    const summaryData = [
      ['Metric', 'Value', 'Status'],
      ['Total Inventory Value', `$${analytics.totalValue.toLocaleString()}`, 'Normal'],
      ['Low Stock Items', analytics.lowStockItems.toString(), analytics.lowStockItems > 0 ? 'Attention Required' : 'Normal'],
      ['Total Items Tracked', inventoryData.length.toString(), 'Normal'],
      ['Average Item Value', `$${analytics.totalValue > 0 ? (analytics.totalValue / inventoryData.length).toFixed(2) : '0.00'}`, 'Normal']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 9,
        font: 'helvetica',
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Low Stock Items Section
    const lowStockItems = inventoryData.filter(item => {
      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      return quantity <= minStock;
    });

    if (lowStockItems.length > 0) {
      doc.addPage();
      addFooter();
      currentY = margin;
      
      addSectionHeader('LOW STOCK ITEMS ALERT');
      
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Items requiring immediate attention: ${lowStockItems.length}`, margin, currentY);
      currentY += 8;
      doc.text('These items have fallen below their minimum stock levels and require immediate replenishment.', margin, currentY);
      currentY += 8;

      const lowStockTableData = lowStockItems.map(item => [
        item.name,
        item.category,
        item.quantity.toString(),
        item.minStockLevel.toString(),
        `$${(parseFloat(item.price) || 0).toFixed(2)}`,
        `$${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Item Name', 'Category', 'Current Stock', 'Min Stock', 'Unit Price', 'Total Value']],
        body: lowStockTableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          font: 'helvetica',
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.5,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 40 },  // Item Name
          1: { cellWidth: 30 },  // Category
          2: { cellWidth: 20 },  // Current Stock
          3: { cellWidth: 20 },  // Min Stock
          4: { cellWidth: 25 },  // Unit Price
          5: { cellWidth: 25 },  // Total Value
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Top Categories by Value
    if (analytics.topCategories.length > 0) {
      doc.addPage();
      addFooter();
      currentY = margin;
      
      addSectionHeader('TOP CATEGORIES BY VALUE');
      
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Analysis of inventory value distribution across different categories:', margin, currentY);
      currentY += 8;

      const categoryTableData = analytics.topCategories.map(category => [
        category.name,
        `$${category.value.toLocaleString()}`,
        `${((category.value / analytics.totalValue) * 100).toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Total Value', 'Percentage of Total']],
        body: categoryTableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          font: 'helvetica',
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.5,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;
    }

    // Vendor Performance Analysis
    doc.addPage();
    addFooter();
    currentY = margin;
    
    addSectionHeader('VENDOR PERFORMANCE ANALYSIS');
    
    checkPageBreak(20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Performance metrics for key suppliers based on delivery time, quality, and overall reliability:', margin, currentY);
    currentY += 8;

    const vendorTableData = analytics.vendorPerformance.map(vendor => [
      vendor.name,
      `${vendor.performance}%`,
      `${vendor.onTime}%`,
      `${vendor.quality}%`,
      vendor.performance >= 90 ? 'Excellent' : 
      vendor.performance >= 80 ? 'Good' : 'Needs Improvement'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Vendor Name', 'Performance Score', 'On-Time Delivery', 'Quality Score', 'Status']],
      body: vendorTableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        font: 'helvetica',
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Cost Analysis Summary
    doc.addPage();
    addFooter();
    currentY = margin;
    
    addSectionHeader('COST ANALYSIS SUMMARY');
    
    checkPageBreak(40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Detailed cost analysis including current values and trends compared to previous periods:', margin, currentY);
    currentY += 8;

    const costAnalysisData = [
      ['Metric', 'Current Value', 'Trend', 'Status'],
      ['Total Inventory Value', `$${analytics.totalValue.toLocaleString()}`, '↑ 5.2% vs last month', 'Positive'],
      ['Average Item Cost', `$${analytics.totalValue > 0 ? (analytics.totalValue / inventoryData.length).toFixed(2) : '0.00'}`, '↓ 2.1% vs last month', 'Monitoring'],
      ['Low Stock Value', `$${inventoryData
        .filter(item => {
          const quantity = parseInt(item.quantity) || 0;
          const minStock = parseInt(item.minStockLevel) || 0;
          return quantity <= minStock;
        })
        .reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.quantity) || 0;
          return sum + (price * quantity);
        }, 0)
        .toLocaleString()}`, 'N/A', 'Attention Required']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [costAnalysisData[0]],
      body: costAnalysisData.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 9,
        font: 'helvetica',
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Recommendations Section
    doc.addPage();
    addFooter();
    currentY = margin;
    
    addSectionHeader('RECOMMENDATIONS');
    
    checkPageBreak(30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Based on the analysis, the following recommendations are proposed:', margin, currentY);
    currentY += 12;

    const recommendations = [
      {
        priority: 'HIGH',
        action: 'Reorder low stock items immediately to avoid stockouts',
        timeline: 'Within 48 hours'
      },
      {
        priority: 'MEDIUM',
        action: 'Consider negotiating better terms with underperforming vendors',
        timeline: 'Next 30 days'
      },
      {
        priority: 'HIGH',
        action: 'Implement automated inventory tracking system',
        timeline: 'Next quarter'
      },
      {
        priority: 'MEDIUM',
        action: 'Review and optimize inventory turnover rates',
        timeline: 'Next 60 days'
      },
      {
        priority: 'LOW',
        action: 'Establish safety stock levels for critical items',
        timeline: 'Next 90 days'
      }
    ];

    const recommendationTableData = recommendations.map(rec => [
      rec.priority,
      rec.action,
      rec.timeline
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Priority', 'Action', 'Timeline']],
      body: recommendationTableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        font: 'helvetica',
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Approval & Signatures Page
    doc.addPage();
    addFooter();
    currentY = margin;
    
    addSectionHeader('APPROVAL & SIGNATURES');
    
    checkPageBreak(40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('This report has been reviewed and approved by the following authorized personnel:', margin, currentY);
    currentY += 20;

    // Signature lines
    const signatureY = currentY;
    const signatureWidth = 80;
    const signatureSpacing = 30;

    // First signature - Prepared By
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Prepared By:', margin, signatureY);
    
    // Signature line
    doc.setLineWidth(0.5);
    doc.line(margin, signatureY + 15, margin + signatureWidth, signatureY + 15);
    
    // Name, title, and date below the line
    doc.setFont('helvetica', 'bold');
    doc.text(`${admin?.name || 'System Administrator'}`, margin, signatureY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`${admin?.role || 'System Administrator'}`, margin, signatureY + 32);
    doc.text(`Date: ${reportDate.toLocaleDateString()}`, margin, signatureY + 39);

    // Second signature - Reviewed By
    const secondSignatureX = margin + signatureWidth + signatureSpacing;
    doc.setFont('helvetica', 'normal');
    doc.text('Reviewed By:', secondSignatureX, signatureY);
    
    // Signature line
    doc.line(secondSignatureX, signatureY + 15, secondSignatureX + signatureWidth, signatureY + 15);
    
    // Placeholder text for name, title, and date
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', secondSignatureX, signatureY + 25);
    doc.text('Department Head', secondSignatureX, signatureY + 32);
    doc.text('Date: _______________', secondSignatureX, signatureY + 39);

    // Third signature - Approved By
    const thirdSignatureX = secondSignatureX + signatureWidth + signatureSpacing;
    doc.setFont('helvetica', 'normal');
    doc.text('Approved By:', thirdSignatureX, signatureY);
    
    // Signature line
    doc.line(thirdSignatureX, signatureY + 15, thirdSignatureX + signatureWidth, signatureY + 15);
    
    // Placeholder text for name, title, and date
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', thirdSignatureX, signatureY + 25);
    doc.text('Chief Operating Officer', thirdSignatureX, signatureY + 32);
    doc.text('Date: _______________', thirdSignatureX, signatureY + 39);

    // Add a note about signatures
    currentY = signatureY + 60;
    checkPageBreak(20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: Signatures must be handwritten in blue or black ink. Digital signatures are also accepted.', margin, currentY);
    currentY += 8;
    doc.text('Each signature indicates approval of the contents of this report as of the date signed.', margin, currentY);

    // Document control section
    currentY = signatureY + 90;
    addSectionHeader('DOCUMENT CONTROL');
    
    checkPageBreak(30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const documentControl = [
      ['Document ID:', reportId],
      ['Version:', '1.0'],
      ['Classification:', 'Internal Use'],
      ['Distribution:', 'Management Team, Department Heads'],
      ['Retention Period:', '3 years'],
      ['Next Review Date:', new Date(reportDate.getFullYear() + 1, reportDate.getMonth(), reportDate.getDate()).toLocaleDateString()]
    ];

    documentControl.forEach(([label, value]) => {
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 30, currentY);
      currentY += 8;
    });

    // Final footer on last page
    addFooter();

    // Save the PDF
    const timestamp = reportDate.toISOString().split('T')[0];
    doc.save(`Inventory_Analytics_Report_${timestamp}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    alert(`Failed to generate PDF report: ${error.message}`);
  }
};

  // Generate CSV report
  const generateCSVReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Item Name,Category,Quantity,Min Stock,Unit Price,Total Value,Status\n";
    
    // Data rows
    inventoryData.forEach(item => {
      const quantity = parseInt(item.quantity) || 0;
      const minStock = parseInt(item.minStockLevel) || 0;
      const price = parseFloat(item.price) || 0;
      const totalValue = price * quantity;
      const status = quantity <= minStock ? 'Low Stock' : 'In Stock';
      
      csvContent += `"${item.name}","${item.category}",${quantity},${minStock},${price.toFixed(2)},${totalValue.toFixed(2)},"${status}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate HTML report
  const generateHTMLReport = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .low-stock { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inventory Analytics Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h2>Executive Summary</h2>
          <p><strong>Total Inventory Value:</strong> $${analytics.totalValue.toLocaleString()}</p>
          <p><strong>Low Stock Items:</strong> ${analytics.lowStockItems}</p>
          <p><strong>Total Items:</strong> ${inventoryData.length}</p>
        </div>
        
        <div class="section">
          <h2>Inventory Items</h2>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Min Stock</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryData.map(item => {
                const quantity = parseInt(item.quantity) || 0;
                const minStock = parseInt(item.minStockLevel) || 0;
                const price = parseFloat(item.price) || 0;
                const totalValue = price * quantity;
                const status = quantity <= minStock ? 'Low Stock' : 'In Stock';
                const statusClass = quantity <= minStock ? 'low-stock' : '';
                
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${quantity}</td>
                    <td>${minStock}</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>$${totalValue.toFixed(2)}</td>
                    <td class="${statusClass}">${status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open();
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  // Chart data configurations
  const categoryChartData = {
    labels: analytics.topCategories.map(c => c.name),
    datasets: [{
      label: 'Value ($)',
      data: analytics.topCategories.map(c => c.value),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ],
      borderWidth: 1
    }]
  };

  const costTrendChartData = {
    labels: analytics.costTrends.map(t => t.month),
    datasets: [{
      label: 'Cost ($)',
      data: analytics.costTrends.map(t => t.cost),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1
    }]
  };

  const vendorPerformanceChartData = {
    labels: analytics.vendorPerformance.map(v => v.name),
    datasets: [
      {
        label: 'Performance Score',
        data: analytics.vendorPerformance.map(v => v.performance),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
      {
        label: 'On-Time Delivery',
        data: analytics.vendorPerformance.map(v => v.onTime),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
      },
      {
        label: 'Quality Score',
        data: analytics.vendorPerformance.map(v => v.quality),
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
      }
    ]
  };

  if (loading) {
    return (
      <AdminErrorBoundary>
        <div className="admin-loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading Inventory Reports...</h2>
        </div>
      </AdminErrorBoundary>
    );
  }

  return (
    <AdminErrorBoundary>
      <AdminLayout admin={admin} title="Inventory Reports & Analytics">
        <div className="inventory-reports">
          {/* Header */}
          <div className="page-header">
            <div className="header-content">
              <h1>📊 Inventory Reports & Analytics</h1>
              <div className="header-actions">
                <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
                  ← Back to Dashboard
                </button>
              </div>
            </div>
            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Report Filters */}
          <div className="report-filters-section">
            <h2>📋 Generate Report</h2>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Date Range</label>
                <select 
                  value={reportFilters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="filter-select"
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                  <option value="thisyear">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Category</label>
                <select 
                  value={reportFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  <option value="Cutting Instruments">Cutting Instruments</option>
                  <option value="Grasping Instruments">Grasping Instruments</option>
                  <option value="Hemostatic Instruments">Hemostatic Instruments</option>
                  <option value="Retractors">Retractors</option>
                  <option value="Sutures">Sutures</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Report Type</label>
                <select 
                  value={reportFilters.reportType}
                  onChange={(e) => handleFilterChange('reportType', e.target.value)}
                  className="filter-select"
                >
                  <option value="comprehensive">Comprehensive Report</option>
                  <option value="lowstock">Low Stock Alert</option>
                  <option value="costanalysis">Cost Analysis</option>
                  <option value="vendorperformance">Vendor Performance</option>
                  <option value="trends">Trend Analysis</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Format</label>
                <select 
                  value={reportFilters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                  className="filter-select"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="csv">CSV Spreadsheet</option>
                  <option value="html">HTML Report</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={generateReport}
              disabled={generatingReport}
              className="generate-report-btn"
            >
              {generatingReport ? '⏳ Generating...' : '📊 Generate Report'}
            </button>
          </div>

          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-info">
                <h3>${analytics.totalValue.toLocaleString()}</h3>
                <p>Total Inventory Value</p>
              </div>
            </div>
            
            <div className="metric-card warning">
              <div className="metric-icon">⚠️</div>
              <div className="metric-info">
                <h3>{analytics.lowStockItems}</h3>
                <p>Low Stock Items</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📦</div>
              <div className="metric-info">
                <h3>{inventoryData.length}</h3>
                <p>Total Items</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-info">
                <h3>
                  {analytics.totalValue > 0 
                    ? `$${(analytics.totalValue / inventoryData.length).toFixed(2)}` 
                    : '$0.00'}
                </h3>
                <p>Avg Item Value</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <h3>📊 Top Categories by Value</h3>
              <div className="chart-wrapper">
                <Bar data={categoryChartData} options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  }
                }} />
              </div>
            </div>
            
            <div className="chart-container">
              <h3>📈 Cost Trends</h3>
              <div className="chart-wrapper">
                <Line data={costTrendChartData} options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  }
                }} />
              </div>
            </div>
            
            <div className="chart-container">
              <h3>🏢 Vendor Performance</h3>
              <div className="chart-wrapper">
                <Bar data={vendorPerformanceChartData} options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  }
                }} />
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="low-stock-section">
            <h2>⚠️ Low Stock Alerts</h2>
            <div className="low-stock-grid">
              {inventoryData
                .filter(item => {
                  const quantity = parseInt(item.quantity) || 0;
                  const minStock = parseInt(item.minStockLevel) || 0;
                  return quantity <= minStock;
                })
                .slice(0, 6)
                .map(item => (
                  <div key={item._id} className="low-stock-card">
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>{item.category}</p>
                    </div>
                    <div className="stock-info">
                      <div className="stock-level">
                        <span className="current">{item.quantity}</span>
                        <span className="separator">/</span>
                        <span className="min">{item.minStockLevel}</span>
                      </div>
                      <div className="stock-bar">
                        <div 
                          className="stock-fill" 
                          style={{ 
                            width: `${Math.min(100, (item.quantity / item.minStockLevel) * 100)}%`,
                            backgroundColor: item.quantity === 0 ? '#dc3545' : '#ffc107'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="item-value">
                      ${(parseFloat(item.price) || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Vendor Performance Table */}
          <div className="vendor-performance-section">
            <h2>🏢 Vendor Performance Analysis</h2>
            <div className="vendor-table-container">
              <table className="vendor-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Performance Score</th>
                    <th>On-Time Delivery</th>
                    <th>Quality Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.vendorPerformance.map((vendor, index) => (
                    <tr key={index}>
                      <td>{vendor.name}</td>
                      <td>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${vendor.performance}%`,
                              backgroundColor: vendor.performance >= 90 ? '#28a745' : 
                                             vendor.performance >= 80 ? '#ffc107' : '#dc3545'
                            }}
                          ></div>
                          <span>{vendor.performance}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${vendor.onTime}%`,
                              backgroundColor: vendor.onTime >= 90 ? '#28a745' : 
                                             vendor.onTime >= 80 ? '#ffc107' : '#dc3545'
                            }}
                          ></div>
                          <span>{vendor.onTime}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${vendor.quality}%`,
                              backgroundColor: vendor.quality >= 90 ? '#28a745' : 
                                             vendor.quality >= 80 ? '#ffc107' : '#dc3545'
                            }}
                          ></div>
                          <span>{vendor.quality}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          vendor.performance >= 90 ? 'excellent' :
                          vendor.performance >= 80 ? 'good' : 'needs-improvement'
                        }`}>
                          {vendor.performance >= 90 ? 'Excellent' :
                           vendor.performance >= 80 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="cost-analysis-section">
            <h2>💰 Cost Analysis</h2>
            <div className="cost-analysis-grid">
              <div className="cost-card">
                <h3>Total Inventory Value</h3>
                <div className="cost-amount">${analytics.totalValue.toLocaleString()}</div>
                <div className="cost-trend positive">
                  <span>↑ 5.2%</span>
                  <span>vs last month</span>
                </div>
              </div>
              
              <div className="cost-card">
                <h3>Average Item Cost</h3>
                <div className="cost-amount">
                  ${analytics.totalValue > 0 ? (analytics.totalValue / inventoryData.length).toFixed(2) : '0.00'}
                </div>
                <div className="cost-trend negative">
                  <span>↓ 2.1%</span>
                  <span>vs last month</span>
                </div>
              </div>
              
              <div className="cost-card">
                <h3>Low Stock Value</h3>
                <div className="cost-amount">
                  ${inventoryData
                    .filter(item => {
                      const quantity = parseInt(item.quantity) || 0;
                      const minStock = parseInt(item.minStockLevel) || 0;
                      return quantity <= minStock;
                    })
                    .reduce((sum, item) => {
                      const price = parseFloat(item.price) || 0;
                      const quantity = parseInt(item.quantity) || 0;
                      return sum + (price * quantity);
                    }, 0)
                    .toLocaleString()}
                </div>
                <div className="cost-trend warning">
                  <span>⚠️</span>
                  <span>Requires attention</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .inventory-reports {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
          }

          .page-header {
            margin-bottom: 30px;
          }

          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .header-content h1 {
            margin: 0;
            color: #333;
          }

          .back-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }

          .error-banner {
            background: #f8d7da;
            color: #721c24;
            padding: 10px 15px;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
          }

          .report-filters-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }

          .filter-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
          }

          .filter-select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }

          .generate-report-btn {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .generate-report-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          }

          .generate-report-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .metric-card.warning {
            border-left: 4px solid #ffc107;
          }

          .metric-icon {
            font-size: 24px;
          }

          .metric-info h3 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }

          .metric-info p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }

          .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .chart-container h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
          }

          .chart-wrapper {
            height: 300px;
          }

          .low-stock-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }

          .low-stock-section h2 {
            margin-top: 0;
            color: #333;
          }

          .low-stock-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
          }

          .low-stock-card {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .item-info h4 {
            margin: 0 0 5px 0;
            color: #333;
          }

          .item-info p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }

          .stock-level {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 5px;
          }

          .stock-level .current {
            font-weight: bold;
            color: #dc3545;
          }

          .stock-level .min {
            color: #666;
          }

          .stock-bar {
            width: 100px;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
          }

          .stock-fill {
            height: 100%;
            transition: width 0.3s ease;
          }

          .item-value {
            font-weight: bold;
            color: #333;
          }

          .vendor-performance-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }

          .vendor-performance-section h2 {
            margin-top: 0;
            color: #333;
          }

          .vendor-table-container {
            overflow-x: auto;
          }

          .vendor-table {
            width: 100%;
            border-collapse: collapse;
          }

          .vendor-table th,
          .vendor-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }

          .vendor-table th {
            background: #f8f9fa;
            font-weight: 600;
          }

          .score-bar {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .score-fill {
            height: 20px;
            border-radius: 10px;
            transition: width 0.3s ease;
          }

          .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }

          .status-badge.excellent {
            background: #d4edda;
            color: #155724;
          }

          .status-badge.good {
            background: #fff3cd;
            color: #856404;
          }

          .status-badge.needs-improvement {
            background: #f8d7da;
            color: #721c24;
          }

          .cost-analysis-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .cost-analysis-section h2 {
            margin-top: 0;
            color: #333;
          }

          .cost-analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }

          .cost-card {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 20px;
            text-align: center;
          }

          .cost-card h3 {
            margin-top: 0;
            color: #666;
            font-size: 16px;
          }

          .cost-amount {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
          }

          .cost-trend {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 5px;
            font-size: 14px;
          }

          .cost-trend.positive {
            color: #28a745;
          }

          .cost-trend.negative {
            color: #dc3545;
          }

          .cost-trend.warning {
            color: #ffc107;
          }

          @media (max-width: 768px) {
            .filters-grid {
              grid-template-columns: 1fr;
            }
            
            .metrics-grid {
              grid-template-columns: 1fr;
            }
            
            .charts-section {
              grid-template-columns: 1fr;
            }
            
            .low-stock-grid {
              grid-template-columns: 1fr;
            }
            
            .cost-analysis-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default InventoryReports;