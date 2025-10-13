import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import './TotalUtilityView.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler
);

// Custom hook for utility analytics using existing API
const useUtilityAnalytics = () => {
  const [allUtilities, setAllUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:7000/api/financial-utilities';

  const fetchAllUtilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let allData = [];
      let currentPage = 1;
      let totalPages = 1;

      // Fetch all pages of data
      do {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '100' // Larger page size for analytics
        });

        const response = await axios.get(`${API_BASE}?${params}`);
        
        if (response.data.success) {
          allData = [...allData, ...response.data.data.utilities];
          totalPages = response.data.data.pagination.total_pages;
          currentPage++;
        } else {
          throw new Error('Failed to fetch utilities');
        }
      } while (currentPage <= totalPages);

      setAllUtilities(allData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch utilities');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    allUtilities,
    loading,
    error,
    fetchAllUtilities
  };
};

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatPercentage = (value) => {
  return `${value.toFixed(1)}%`;
};

// Analytics processing functions
const processAnalyticsData = (utilities, timeRange = 'current_year') => {
  if (!utilities.length) return null;

  const now = new Date();
  let filteredUtilities = utilities;

  // Filter by time range
  if (timeRange !== 'all_time') {
    const { startDate, endDate } = getDateRangeForFilter(timeRange);
    filteredUtilities = utilities.filter(utility => {
      const utilityDate = new Date(utility.billing_period_start);
      return utilityDate >= startDate && utilityDate <= endDate;
    });
  }

  // Calculate totals
  const totalExpenses = filteredUtilities.reduce((sum, utility) => sum + parseFloat(utility.amount), 0);
  const totalRecords = filteredUtilities.length;

  // Category breakdown
  const categoryBreakdown = filteredUtilities.reduce((acc, utility) => {
    const category = utility.category;
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += parseFloat(utility.amount);
    acc[category].count += 1;
    return acc;
  }, {});

  // Payment status breakdown
  const paymentStatusBreakdown = filteredUtilities.reduce((acc, utility) => {
    const status = utility.payment_status;
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 };
    }
    acc[status].count += 1;
    acc[status].total += parseFloat(utility.amount);
    return acc;
  }, {});

  // Top vendors
  const vendorBreakdown = filteredUtilities.reduce((acc, utility) => {
    const vendor = utility.vendor_name;
    if (!acc[vendor]) {
      acc[vendor] = { total: 0, count: 0 };
    }
    acc[vendor].total += parseFloat(utility.amount);
    acc[vendor].count += 1;
    return acc;
  }, {});

  const topVendors = Object.entries(vendorBreakdown)
    .map(([vendor, data]) => ({ vendor, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    totalExpenses,
    totalRecords,
    averageExpense: totalRecords > 0 ? totalExpenses / totalRecords : 0,
    categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count
    })).sort((a, b) => b.total - a.total),
    paymentStatusBreakdown: Object.entries(paymentStatusBreakdown).map(([status, data]) => ({
      status,
      count: data.count,
      total: data.total
    })),
    topVendors,
    filteredData: filteredUtilities
  };
};

const getDateRangeForFilter = (timeRange) => {
  const now = new Date();
  let startDate, endDate;

  switch (timeRange) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'current_quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
      endDate = new Date(now.getFullYear(), quarterMonth + 3, 0);
      break;
    case 'current_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'last_6_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      endDate = new Date();
      break;
    case 'last_12_months':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      endDate = new Date();
      break;
    default:
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
  }

  return { startDate, endDate };
};

// Generate monthly trends from utilities data
const generateMonthlyTrends = (utilities) => {
  const monthlyData = utilities.reduce((acc, utility) => {
    const date = new Date(utility.billing_period_start);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        total: 0,
        count: 0,
        sortDate: date
      };
    }
    
    acc[monthKey].total += parseFloat(utility.amount);
    acc[monthKey].count += 1;
    
    return acc;
  }, {});

  return Object.values(monthlyData).sort((a, b) => a.sortDate - b.sortDate);
};

// Sub-components
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = 'primary',
  loading = false 
}) => (
  <div className={`tuv-metric-card tuv-metric-card--${color}`}>
    <div className="tuv-metric-card__header">
      <div className="tuv-metric-card__icon">
        <i className={`fas ${icon}`} aria-hidden="true"></i>
      </div>
      {trend && (
        <div className={`tuv-metric-card__trend tuv-metric-card__trend--${trend}`}>
          <i className={`fas ${trend === 'up' ? 'fa-arrow-up' : 'fa-arrow-down'}`} aria-hidden="true"></i>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
    <div className="tuv-metric-card__content">
      {loading ? (
        <div className="tuv-metric-card__skeleton">
          <div className="tuv-skeleton tuv-skeleton--large"></div>
          <div className="tuv-skeleton tuv-skeleton--small"></div>
        </div>
      ) : (
        <>
          <h3 className="tuv-metric-card__value">{value}</h3>
          <p className="tuv-metric-card__title">{title}</p>
          {subtitle && <small className="tuv-metric-card__subtitle">{subtitle}</small>}
        </>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, children, loading = false, className = '' }) => (
  <div className={`tuv-chart-card ${className}`}>
    <div className="tuv-chart-card__header">
      <h3 className="tuv-chart-card__title">{title}</h3>
    </div>
    <div className="tuv-chart-card__content">
      {loading ? (
        <div className="tuv-chart-card__skeleton">
          <div className="tuv-skeleton tuv-skeleton--chart"></div>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

const InsightCard = ({ title, insights, icon, color = 'info' }) => (
  <div className={`tuv-insight-card tuv-insight-card--${color}`}>
    <div className="tuv-insight-card__header">
      <div className="tuv-insight-card__icon">
        <i className={`fas ${icon}`} aria-hidden="true"></i>
      </div>
      <h3 className="tuv-insight-card__title">{title}</h3>
    </div>
    <div className="tuv-insight-card__content">
      <ul className="tuv-insight-card__list">
        {insights.map((insight, index) => (
          <li key={index} className="tuv-insight-card__item">
            <i className="fas fa-check-circle tuv-insight-card__check" aria-hidden="true"></i>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const LoadingSpinner = ({ message = 'Loading analytics...' }) => (
  <div className="tuv-loading">
    <div className="tuv-loading__spinner">
      <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
    </div>
    <p className="tuv-loading__message">{message}</p>
  </div>
);

const ErrorAlert = ({ message, onRetry }) => (
  <div className="tuv-alert tuv-alert--error">
    <div className="tuv-alert__content">
      <i className="fas fa-exclamation-triangle tuv-alert__icon" aria-hidden="true"></i>
      <div className="tuv-alert__text">
        <h4>Unable to Load Analytics</h4>
        <p>{message}</p>
      </div>
    </div>
    {onRetry && (
      <button className="tuv-alert__retry" onClick={onRetry}>
        <i className="fas fa-refresh" aria-hidden="true"></i>
        Retry
      </button>
    )}
  </div>
);

// Main Component
const TotalUtilityView = () => {
  const navigate = useNavigate();
  const { allUtilities, loading, error, fetchAllUtilities } = useUtilityAnalytics();
  
  // State management
  const [timeRange, setTimeRange] = useState('current_year');
  
  // Process analytics data
  const analyticsData = useMemo(() => {
    return processAnalyticsData(allUtilities, timeRange);
  }, [allUtilities, timeRange]);

  // Generate monthly trends
  const monthlyTrends = useMemo(() => {
    if (!allUtilities.length) return [];
    return generateMonthlyTrends(allUtilities);
  }, [allUtilities]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllUtilities();
  }, [fetchAllUtilities]);

  // Chart configurations
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#1da1f2',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };

  // Generate chart data
  const categoryExpenseData = useMemo(() => {
    if (!analyticsData?.categoryBreakdown) return null;
    
    const colors = ['#1da1f2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
    
    return {
      labels: analyticsData.categoryBreakdown.map(cat => cat.category),
      datasets: [{
        label: 'Expenses by Category',
        data: analyticsData.categoryBreakdown.map(cat => cat.total),
        backgroundColor: colors.slice(0, analyticsData.categoryBreakdown.length),
        borderColor: colors.slice(0, analyticsData.categoryBreakdown.length),
        borderWidth: 2,
        hoverBackgroundColor: colors.slice(0, analyticsData.categoryBreakdown.length).map(color => `${color}CC`),
      }]
    };
  }, [analyticsData]);

  const monthlyTrendData = useMemo(() => {
    if (!monthlyTrends.length) return null;
    
    return {
      labels: monthlyTrends.map(trend => trend.month),
      datasets: [{
        label: 'Monthly Expenses',
        data: monthlyTrends.map(trend => trend.total),
        fill: true,
        borderColor: '#1da1f2',
        backgroundColor: 'rgba(29, 161, 242, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#1da1f2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }]
    };
  }, [monthlyTrends]);

  const paymentStatusData = useMemo(() => {
    if (!analyticsData?.paymentStatusBreakdown) return null;
    
    const statusColors = {
      'Paid': '#10b981',
      'Pending': '#f59e0b', 
      'Overdue': '#ef4444'
    };
    
    return {
      labels: analyticsData.paymentStatusBreakdown.map(status => status.status),
      datasets: [{
        data: analyticsData.paymentStatusBreakdown.map(status => status.count),
        backgroundColor: analyticsData.paymentStatusBreakdown.map(status => statusColors[status.status] || '#6b7280'),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
      }]
    };
  }, [analyticsData]);

  const vendorComparisonData = useMemo(() => {
    if (!analyticsData?.topVendors) return null;
    
    const topSix = analyticsData.topVendors.slice(0, 6);
    
    return {
      labels: topSix.map(vendor => vendor.vendor),
      datasets: [{
        label: 'Vendor Expenses',
        data: topSix.map(vendor => vendor.total),
        backgroundColor: 'rgba(29, 161, 242, 0.8)',
        borderColor: '#1da1f2',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  }, [analyticsData]);

  // Generate insights
  const generateInsights = useCallback(() => {
    if (!analyticsData) return [];
    
    const insights = [];
    
    // Highest expense category
    const topCategory = analyticsData.categoryBreakdown[0];
    if (topCategory) {
      insights.push(`${topCategory.category} accounts for ${formatCurrency(topCategory.total)} of total expenses`);
    }
    
    // Payment status insights
    const overdue = analyticsData.paymentStatusBreakdown.find(s => s.status === 'Overdue');
    if (overdue && overdue.count > 0) {
      insights.push(`${overdue.count} overdue payments require immediate attention`);
    }
    
    // Vendor insights
    const topVendor = analyticsData.topVendors[0];
    if (topVendor) {
      insights.push(`${topVendor.vendor} is the top vendor with ${formatCurrency(topVendor.total)} in expenses`);
    }
    
    // Average insight
    insights.push(`Average utility expense is ${formatCurrency(analyticsData.averageExpense)} per transaction`);
    
    return insights;
  }, [analyticsData]);

  // Event handlers
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const handleExportReport = () => {
    if (!analyticsData) {
      alert('No data available to export');
      return;
    }
    
    // Generate and download CSV report
    const csvData = [
      ['Utility Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Time Range:', timeRange.replace(/_/g, ' ')],
      [''],
      ['Summary'],
      ['Total Expenses:', formatCurrency(analyticsData.totalExpenses)],
      ['Total Records:', analyticsData.totalRecords],
      ['Average Expense:', formatCurrency(analyticsData.averageExpense)],
      [''],
      ['Category Breakdown'],
      ['Category', 'Total Amount', 'Count'],
      ...analyticsData.categoryBreakdown.map(cat => [cat.category, cat.total, cat.count]),
      [''],
      ['Payment Status'],
      ['Status', 'Count', 'Total Amount'],
      ...analyticsData.paymentStatusBreakdown.map(status => [status.status, status.count, status.total]),
      [''],
      ['Top Vendors'],
      ['Vendor', 'Total Amount', 'Count'],
      ...analyticsData.topVendors.map(vendor => [vendor.vendor, vendor.total, vendor.count])
    ];
    
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `utility-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNavigateBack = () => {
    navigate('/admin/financial/utilities');
  };

  const handleNavigateToDashboard = () => {
    navigate('/admin/financial');
  };

  const handleRetry = () => {
    fetchAllUtilities();
  };

  if (loading && !allUtilities.length) {
    return (
      <div className="tuv-container">
        <LoadingSpinner message="Loading comprehensive utility analytics..." />
      </div>
    );
  }

  if (error && !allUtilities.length) {
    return (
      <div className="tuv-container">
        <ErrorAlert message={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="tuv-container">
        <div className="tuv-alert tuv-alert--info">
          <div className="tuv-alert__content">
            <i className="fas fa-info-circle tuv-alert__icon" aria-hidden="true"></i>
            <div className="tuv-alert__text">
              <h4>No Data Available</h4>
              <p>No utility records found for the selected time range.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tuv-container">
      {/* Header Section */}
      <header className="tuv-header">
        <div className="tuv-header__content">
          <div className="tuv-header__title-section">
            <div className="tuv-header__navigation">
              <button 
                className="tuv-header__back-btn tuv-header__back-btn--dashboard"
                onClick={handleNavigateToDashboard}
                aria-label="Back to financial dashboard"
              >
                <i className="fas fa-tachometer-alt" aria-hidden="true"></i>
                Dashboard
              </button>
              <button 
                className="tuv-header__back-btn tuv-header__back-btn--utilities"
                onClick={handleNavigateBack}
                aria-label="Back to utilities"
              >
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                Utilities
              </button>
            </div>
            <div>
              <h1 className="tuv-header__title">
                <i className="fas fa-chart-line tuv-header__icon" aria-hidden="true"></i>
                Utility Analytics Dashboard
              </h1>
              <p className="tuv-header__subtitle">
                Comprehensive financial insights and utility expense analysis
              </p>
            </div>
          </div>
          
          <div className="tuv-header__actions">
            <select 
              className="tuv-header__time-range"
              value={timeRange}
              onChange={handleTimeRangeChange}
            >
              <option value="current_month">Current Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="last_12_months">Last 12 Months</option>
              <option value="all_time">All Time</option>
            </select>
            
            <button 
              className="tuv-button tuv-button--secondary"
              onClick={handleExportReport}
            >
              <i className="fas fa-download" aria-hidden="true"></i>
              Export Report
            </button>
          </div>
        </div>
      </header>

      {/* Key Metrics Section */}
      <section className="tuv-metrics">
        <div className="tuv-metrics__grid">
          <MetricCard
            title="Total Expenses"
            value={formatCurrency(analyticsData.totalExpenses)}
            subtitle={`${analyticsData.totalRecords} transactions`}
            icon="fa-dollar-sign"
            color="primary"
            loading={loading}
          />
          <MetricCard
            title="Average Expense"
            value={formatCurrency(analyticsData.averageExpense)}
            subtitle="Per transaction"
            icon="fa-calculator"
            color="success"
            loading={loading}
          />
          <MetricCard
            title="Categories"
            value={analyticsData.categoryBreakdown.length}
            subtitle="Active categories"
            icon="fa-tags"
            color="info"
            loading={loading}
          />
          <MetricCard
            title="Vendors"
            value={analyticsData.topVendors.length}
            subtitle="Service providers"
            icon="fa-building"
            color="warning"
            loading={loading}
          />
        </div>
      </section>

      {/* Charts Section */}
      <section className="tuv-charts">
        <div className="tuv-charts__grid">
          {/* Monthly Trend Chart */}
          <ChartCard 
            title="Monthly Expense Trends" 
            className="tuv-chart-card--large"
            loading={loading}
          >
            {monthlyTrendData && (
              <div className="tuv-chart-container">
                <Line 
                  data={monthlyTrendData} 
                  options={{
                    ...commonChartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            )}
          </ChartCard>

          {/* Category Breakdown */}
          <ChartCard title="Expenses by Category" loading={loading}>
            {categoryExpenseData && (
              <div className="tuv-chart-container">
                <Doughnut 
                  data={categoryExpenseData}
                  options={{
                    ...commonChartOptions,
                    plugins: {
                      ...commonChartOptions.plugins,
                      tooltip: {
                        ...commonChartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context) {
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </ChartCard>

          {/* Payment Status */}
          <ChartCard title="Payment Status Distribution" loading={loading}>
            {paymentStatusData && (
              <div className="tuv-chart-container">
                <Pie 
                  data={paymentStatusData}
                  options={commonChartOptions}
                />
              </div>
            )}
          </ChartCard>

          {/* Vendor Comparison */}
          <ChartCard title="Top Vendors by Expense" loading={loading}>
            {vendorComparisonData && (
              <div className="tuv-chart-container">
                <Bar 
                  data={vendorComparisonData}
                  options={{
                    ...commonChartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    },
                    plugins: {
                      ...commonChartOptions.plugins,
                      tooltip: {
                        ...commonChartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </ChartCard>
        </div>
      </section>

      {/* Insights Section */}
      <section className="tuv-insights">
        <div className="tuv-insights__grid">
          <InsightCard
            title="Key Insights"
            insights={generateInsights()}
            icon="fa-lightbulb"
            color="success"
          />
          
          <InsightCard
            title="Recommendations"
            insights={[
              'Monitor payment statuses to improve cash flow',
              'Review high-expense categories for optimization',
              'Consider vendor consolidation for better rates',
              'Set up automated payment tracking systems'
            ]}
            icon="fa-chart-line"
            color="warning"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="tuv-footer">
        <p>
          <i className="fas fa-info-circle" aria-hidden="true"></i>
          Analytics based on {analyticsData.totalRecords} records • Time range: {timeRange.replace(/_/g, ' ')}
        </p>
      </footer>
    </div>
  );
};

export default TotalUtilityView;
