import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import "./ExploreTrends.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const ExploreTrends = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("currencies");
  const [themeMode, setThemeMode] = useState("dark");
  const [refreshTimer, setRefreshTimer] = useState(3600);
  const [lastUpdated, setLastUpdated] = useState("");
  
  // Financial Data States
  const [currencyRates, setCurrencyRates] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [economicIndicators, setEconomicIndicators] = useState([]);
  const [marketNews, setMarketNews] = useState([]);
  const [globalIndices, setGlobalIndices] = useState([]);
  const [commoditiesPrices, setCommoditiesPrices] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [sentiment, setSentiment] = useState({ score: 0, trend: "neutral" });
  
  // Alert System States
  const [alerts, setAlerts] = useState([]);
  const [customAlerts, setCustomAlerts] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: "currency",
    symbol: "",
    condition: "above",
    threshold: 0,
    enabled: true
  });

  const navigate = useNavigate();

  // Navigate back to Financial Dashboard
  const handleBackToFinancial = () => {
    navigate("/admin/financial");
  };

  // Helper function to format timer display
  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    initializeTrends();
    
    const interval = setInterval(() => {
      refreshAllData();
    }, 3600000);

    const timerInterval = setInterval(() => {
      setRefreshTimer(prev => prev > 0 ? prev - 1 : 3600);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, []);

  const initializeTrends = async () => {
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      const savedTheme = localStorage.getItem("trendsTheme") || "dark";
      setThemeMode(savedTheme);
      document.body.className = savedTheme === "dark" ? "dark-theme" : "light-theme";

      await refreshAllData();
    } catch (error) {
      console.error("Error initializing trends:", error);
      setError("Failed to load financial trends data");
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrencyRates(),
        fetchStockData(),
        fetchEconomicIndicators(), 
        fetchMarketNews(),
        fetchGlobalIndices(),
        fetchCommoditiesPrices(),
        fetchCryptoData(),
        analyzeMarketSentiment()
      ]);
      
      setLastUpdated(new Date().toLocaleString());
      setRefreshTimer(3600);
      checkAlerts();
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencyRates = async () => {
    try {
      const mockCurrencyData = [
        { 
          currency: "USD/EUR", 
          rate: (0.85 + Math.random() * 0.02).toFixed(4), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.5).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => ({ value: (0.85 + Math.sin(i/4) * 0.02), index: i }))
        },
        { 
          currency: "USD/GBP", 
          rate: (0.73 + Math.random() * 0.02).toFixed(4), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.4).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => ({ value: (0.73 + Math.sin(i/5) * 0.01), index: i }))
        },
        { 
          currency: "USD/JPY", 
          rate: (149.25 + Math.random() * 2).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => ({ value: (149 + Math.sin(i/3) * 2), index: i }))
        },
        { 
          currency: "USD/LKR", 
          rate: (324.50 + Math.random() * 5).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.8).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => ({ value: (324 + Math.sin(i/4) * 3), index: i }))
        },
        { 
          currency: "USD/CNY", 
          rate: (7.23 + Math.random() * 0.1).toFixed(3), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.3).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => ({ value: (7.2 + Math.sin(i/6) * 0.05), index: i }))
        },
        { 
          currency: "USD/INR", 
          rate: (83.25 + Math.random() * 1).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.5).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => ({ value: (83 + Math.sin(i/4) * 0.5), index: i }))
        }
      ];
      
      setCurrencyRates(mockCurrencyData);
    } catch (error) {
      console.error("Error fetching currency rates:", error);
    }
  };

  const fetchStockData = async () => {
    try {
      const mockStockData = [
        { 
          symbol: "AAPL", 
          price: (189.25 + Math.random() * 10).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(2)}%`, 
          volume: `${(50 + Math.random() * 20).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => ({ value: (185 + Math.sin(i/3) * 5), index: i }))
        },
        { 
          symbol: "GOOGL", 
          price: (142.18 + Math.random() * 8).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2.5).toFixed(2)}%`, 
          volume: `${(25 + Math.random() * 15).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => ({ value: (140 + Math.sin(i/4) * 4), index: i }))
        },
        { 
          symbol: "MSFT", 
          price: (378.85 + Math.random() * 15).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(2)}%`, 
          volume: `${(30 + Math.random() * 12).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => ({ value: (375 + Math.sin(i/5) * 8), index: i }))
        },
        { 
          symbol: "TSLA", 
          price: (248.42 + Math.random() * 20).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%`, 
          volume: `${(80 + Math.random() * 30).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => ({ value: (245 + Math.sin(i/2) * 12), index: i }))
        },
        { 
          symbol: "AMZN", 
          price: (155.73 + Math.random() * 12).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2.8).toFixed(2)}%`, 
          volume: `${(40 + Math.random() * 18).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => ({ value: (154 + Math.sin(i/3.5) * 6), index: i }))
        }
      ];
      
      setStockData(mockStockData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const fetchEconomicIndicators = async () => {
    try {
      const currentDate = new Date().toLocaleDateString();
      const mockEconomicData = [
        { indicator: "US GDP Growth", value: `${(2.4 + Math.random() * 0.4).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.2).toFixed(1)}%`, country: "USA", lastUpdate: "Q3 2025" },
        { indicator: "US Inflation Rate", value: `${(3.2 + Math.random() * 0.6).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.3).toFixed(1)}%`, country: "USA", lastUpdate: "Sep 2025" },
        { indicator: "US Unemployment", value: `${(3.8 + Math.random() * 0.3).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.1).toFixed(1)}%`, country: "USA", lastUpdate: "Sep 2025" },
        { indicator: "EUR GDP Growth", value: `${(0.8 + Math.random() * 0.4).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.2).toFixed(1)}%`, country: "EU", lastUpdate: "Q3 2025" },
        { indicator: "Gold Price", value: `$${(2012 + Math.random() * 50).toFixed(0)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`, country: "Global", lastUpdate: currentDate },
        { indicator: "Oil Price (WTI)", value: `$${(89.45 + Math.random() * 10).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(1)}%`, country: "Global", lastUpdate: currentDate },
        { indicator: "Federal Funds Rate", value: "5.25%", change: "0%", country: "USA", lastUpdate: "Sep 2025" }
      ];
      
      setEconomicIndicators(mockEconomicData);
    } catch (error) {
      console.error("Error fetching economic indicators:", error);
    }
  };

  const fetchMarketNews = async () => {
    try {
      const timeOptions = ["1 hour ago", "2 hours ago", "3 hours ago", "4 hours ago", "5 hours ago"];
      const sources = ["Reuters", "Bloomberg", "CNBC", "Financial Times", "Wall Street Journal", "MarketWatch"];
      
      const newsTopics = [
        {
          title: "Federal Reserve Maintains Interest Rates Amid Economic Uncertainty",
          summary: "The Fed keeps rates steady at 5.25% as inflation shows signs of cooling while monitoring global economic conditions...",
          sentiment: "neutral",
          impact: "high"
        },
        {
          title: "Tech Stocks Rally on Strong Q3 Earnings Reports",
          summary: "Major technology companies exceed earnings expectations, driving NASDAQ gains despite broader market volatility...",
          sentiment: "positive",
          impact: "medium"
        },
        {
          title: "Oil Prices Surge on Middle East Tensions",
          summary: "Crude oil prices jump 3% amid geopolitical concerns, affecting global energy markets and transportation costs...",
          sentiment: "negative",
          impact: "high"
        },
        {
          title: "Healthcare Sector Shows Resilience in Market Volatility",
          summary: "Healthcare stocks outperform broader market indices as defensive investments gain favor among institutional investors...",
          sentiment: "positive", 
          impact: "medium"
        },
        {
          title: "Cryptocurrency Markets Experience Mixed Trading",
          summary: "Bitcoin and Ethereum show divergent patterns as regulatory clarity improves institutional adoption prospects...",
          sentiment: "neutral",
          impact: "low"
        },
        {
          title: "Global Supply Chain Disruptions Impact Manufacturing",
          summary: "Manufacturing indices decline across major economies as supply chain bottlenecks persist in key sectors...",
          sentiment: "negative",
          impact: "medium"
        }
      ];
      
      const mockNewsData = newsTopics.map(topic => ({
        ...topic,
        source: sources[Math.floor(Math.random() * sources.length)],
        time: timeOptions[Math.floor(Math.random() * timeOptions.length)]
      }));
      
      setMarketNews(mockNewsData);
    } catch (error) {
      console.error("Error fetching market news:", error);
    }
  };

  const fetchGlobalIndices = async () => {
    try {
      const mockIndicesData = [
        { index: "S&P 500", value: (4789.35 + Math.random() * 100).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1.5).toFixed(2)}%`, country: "USA" },
        { index: "NASDAQ", value: (14956.23 + Math.random() * 200).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(2)}%`, country: "USA" },
        { index: "DOW JONES", value: (37248.92 + Math.random() * 300).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1.2).toFixed(2)}%`, country: "USA" },
        { index: "FTSE 100", value: (7642.18 + Math.random() * 80).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1).toFixed(2)}%`, country: "UK" },
        { index: "DAX", value: (15789.44 + Math.random() * 150).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1.5).toFixed(2)}%`, country: "Germany" },
        { index: "NIKKEI 225", value: (32567.89 + Math.random() * 400).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1.8).toFixed(2)}%`, country: "Japan" },
        { index: "CSE All Share", value: (11234.56 + Math.random() * 200).toFixed(2), change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.8).toFixed(2)}%`, country: "Sri Lanka" }
      ];
      
      setGlobalIndices(mockIndicesData);
    } catch (error) {
      console.error("Error fetching global indices:", error);
    }
  };

  const fetchCommoditiesPrices = async () => {
    try {
      const mockCommoditiesData = [
        { commodity: "Gold", price: `$${(2012.45 + Math.random() * 30).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`, unit: "oz" },
        { commodity: "Silver", price: `$${(24.67 + Math.random() * 2).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(1)}%`, unit: "oz" },
        { commodity: "Crude Oil (WTI)", price: `$${(89.45 + Math.random() * 8).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 4).toFixed(1)}%`, unit: "barrel" },
        { commodity: "Natural Gas", price: `$${(3.85 + Math.random() * 0.5).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`, unit: "MMBtu" },
        { commodity: "Copper", price: `$${(8456 + Math.random() * 200).toFixed(0)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1.5).toFixed(1)}%`, unit: "ton" },
        { commodity: "Wheat", price: `$${(612.50 + Math.random() * 30).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2.5).toFixed(1)}%`, unit: "bushel" }
      ];
      
      setCommoditiesPrices(mockCommoditiesData);
    } catch (error) {
      console.error("Error fetching commodities data:", error);
    }
  };

  const fetchCryptoData = async () => {
    try {
      const mockCryptoData = [
        { symbol: "BTC", name: "Bitcoin", price: `$${(67234.56 + Math.random() * 2000).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%`, marketCap: "$1.31T" },
        { symbol: "ETH", name: "Ethereum", price: `$${(3678.92 + Math.random() * 300).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 4).toFixed(2)}%`, marketCap: "$442B" },
        { symbol: "BNB", name: "Binance Coin", price: `$${(567.34 + Math.random() * 50).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(2)}%`, marketCap: "$84B" },
        { symbol: "ADA", name: "Cardano", price: `$${(0.487 + Math.random() * 0.05).toFixed(3)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 6).toFixed(2)}%`, marketCap: "$17B" },
        { symbol: "SOL", name: "Solana", price: `$${(156.78 + Math.random() * 20).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 7).toFixed(2)}%`, marketCap: "$71B" }
      ];
      
      setCryptoData(mockCryptoData);
    } catch (error) {
      console.error("Error fetching crypto data:", error);
    }
  };

  const analyzeMarketSentiment = async () => {
    try {
      let positiveCount = 0;
      let negativeCount = 0;
      let totalCount = 0;

      stockData.forEach(stock => {
        totalCount++;
        if (stock.change.includes('+')) positiveCount++;
        else negativeCount++;
      });

      currencyRates.forEach(currency => {
        totalCount++;
        if (currency.change.includes('+')) positiveCount++;
        else negativeCount++;
      });

      const sentimentScore = totalCount > 0 ? 
        Math.round(((positiveCount - negativeCount) / totalCount) * 100) : 0;
      
      let trend = "neutral";
      if (sentimentScore > 20) trend = "bullish";
      else if (sentimentScore < -20) trend = "bearish";

      setSentiment({ score: sentimentScore, trend });
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
    }
  };

  const checkAlerts = () => {
    const newAlerts = [];
    
    customAlerts.forEach(alert => {
      if (!alert.enabled) return;
      
      let currentValue = 0;
      let symbol = alert.symbol;
      
      if (alert.type === "currency") {
        const currency = currencyRates.find(c => c.currency.includes(symbol));
        currentValue = currency ? parseFloat(currency.rate) : 0;
      } else if (alert.type === "stock") {
        const stock = stockData.find(s => s.symbol === symbol);
        currentValue = stock ? parseFloat(stock.price.replace('$', '')) : 0;
      }
      
      const threshold = parseFloat(alert.threshold);
      let triggered = false;
      
      if (alert.condition === "above" && currentValue > threshold) triggered = true;
      if (alert.condition === "below" && currentValue < threshold) triggered = true;
      
      if (triggered) {
        newAlerts.push({
          id: Date.now() + Math.random(),
          message: `${symbol} is ${alert.condition} ${threshold}. Current: ${currentValue}`,
          type: alert.type,
          timestamp: new Date().toLocaleString()
        });
      }
    });
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  const toggleTheme = () => {
    const newTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(newTheme);
    document.body.className = newTheme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("trendsTheme", newTheme);
  };

  const addCustomAlert = () => {
    if (!newAlert.symbol || !newAlert.threshold) return;
    
    const alert = {
      id: Date.now(),
      ...newAlert,
      threshold: parseFloat(newAlert.threshold)
    };
    
    setCustomAlerts(prev => [...prev, alert]);
    setNewAlert({ type: "currency", symbol: "", condition: "above", threshold: 0, enabled: true });
    setAlertModal(false);
  };

  const removeAlert = (alertId) => {
    setCustomAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const chartColors = themeMode === "dark" 
    ? ["#00D4AA", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
    : ["#2196F3", "#FF5722", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4"];

  if (loading && !currencyRates.length) {
    return (
      <AdminLayout admin={admin} title="Explore Financial Trends">
        <div className={`loading-container ${themeMode}`}>
          <div className="loading-spinner"></div>
          <h3>Loading Global Financial Insights...</h3>
          <p>Fetching real-time data from multiple sources</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Explore Financial Trends">
      <div className={`trends-container ${themeMode}`}>
        {/* Header Section */}
        <div className="trends-header">
          <div className="header-info">
            <h1 className="main-title">🌍 Global Financial Trends</h1>
            <p className="subtitle">Real-time insights • Updated every hour</p>
            <div className="update-status">
              <span className="last-updated">Last updated: {lastUpdated}</span>
              <span className="next-update">Next update: {formatTimer(refreshTimer)}</span>
            </div>
          </div>
          
          <div className="header-actions">
            <button onClick={handleBackToFinancial} className="back-btn">
              ← Financial Dashboard
            </button>
            <button onClick={toggleTheme} className="theme-btn">
              {themeMode === "dark" ? "🌞 Light" : "🌙 Dark"}
            </button>
            <button onClick={refreshAllData} disabled={loading} className="refresh-btn">
              {loading ? "🔄 Updating..." : "🔄 Refresh Now"}
            </button>
            <button onClick={() => setAlertModal(true)} className="alerts-btn">
              ⚠️ Alerts ({customAlerts.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError("")} className="close-btn">✕</button>
          </div>
        )}

        {/* Market Sentiment Overview */}
        <div className="sentiment-overview">
          <div className="sentiment-card">
            <h3>📊 Market Sentiment</h3>
            <div className="sentiment-score">
              <span className="score">{sentiment.score > 0 ? '+' : ''}{sentiment.score}</span>
              <span className={`trend ${sentiment.trend}`}>{sentiment.trend.toUpperCase()}</span>
            </div>
            <p>Based on {stockData.length + currencyRates.length} indicators</p>
          </div>
          
          {alerts.length > 0 && (
            <div className="alerts-card">
              <h4>🔔 Recent Alerts</h4>
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="alert-item">
                  <span className="alert-message">{alert.message}</span>
                  <small className="alert-time">{alert.timestamp}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          {[
            { id: "currencies", label: "💱 Currencies" },
            { id: "stocks", label: "📈 Stocks" },
            { id: "economics", label: "🏦 Economic Data" },
            { id: "indices", label: "📊 Global Indices" },
            { id: "commodities", label: "🥇 Commodities" },
            { id: "crypto", label: "₿ Crypto" },
            { id: "news", label: "📰 Market News" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Currency Tab */}
        {activeTab === "currencies" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>💱 Currency Exchange Rates</h2>
              <p>Live forex rates with historical trends</p>
            </div>
            
            <div className="data-grid">
              {currencyRates.map((currency, index) => (
                <div key={index} className="data-card">
                  <div className="card-header">
                    <h3>{currency.currency}</h3>
                    <span className="trend-icon">{currency.trend === "up" ? "📈" : "📉"}</span>
                  </div>
                  <div className="card-content">
                    <span className="main-value">{currency.rate}</span>
                    <span className={`change ${currency.change.includes('+') ? 'positive' : 'negative'}`}>
                      {currency.change}
                    </span>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={60}>
                      <LineChart data={currency.history}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={currency.trend === "up" ? "#00D4AA" : "#FF6B6B"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-chart">
              <h3>📈 Currency Trends Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={currencyRates.map(currency => ({
                  currency: currency.currency,
                  rate: parseFloat(currency.rate)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="currency" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke={chartColors[0]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === "stocks" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>📈 Stock Market Data</h2>
              <p>Real-time stock prices with trading volumes</p>
            </div>
            
            <div className="data-grid">
              {stockData.map((stock, index) => (
                <div key={index} className="data-card">
                  <div className="card-header">
                    <h3>{stock.symbol}</h3>
                    <span className="volume">Vol: {stock.volume}</span>
                  </div>
                  <div className="card-content">
                    <span className="main-value">${stock.price}</span>
                    <span className={`change ${stock.change.includes('+') ? 'positive' : 'negative'}`}>
                      {stock.change}
                    </span>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={stock.sparkline}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={stock.change.includes('+') ? "#00D4AA" : "#FF6B6B"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-chart">
              <h3>📊 Stock Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stockData.map(stock => ({
                  symbol: stock.symbol,
                  price: parseFloat(stock.price.replace('$', ''))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="symbol" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="price" fill={chartColors[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Economic Tab */}
        {activeTab === "economics" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>🏦 Economic Indicators</h2>
              <p>Key global economic measurements and trends</p>
            </div>
            
            <div className="data-grid">
              {economicIndicators.map((indicator, index) => (
                <div key={index} className="data-card">
                  <div className="indicator-header">
                    <h4>{indicator.indicator}</h4>
                    <span className="country-tag">{indicator.country}</span>
                  </div>
                  <div className="card-content">
                    <span className="main-value">{indicator.value}</span>
                    <span className={`change ${indicator.change.includes('+') ? 'positive' : 'negative'}`}>
                      {indicator.change}
                    </span>
                  </div>
                  <div className="last-update">Updated: {indicator.lastUpdate}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Indices Tab */}
        {activeTab === "indices" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>📊 Global Market Indices</h2>
              <p>Major stock market indices worldwide</p>
            </div>
            
            <div className="data-grid">
              {globalIndices.map((index, idx) => (
                <div key={idx} className="data-card">
                  <div className="card-header">
                    <h3>{index.index}</h3>
                    <span className="country">{index.country}</span>
                  </div>
                  <div className="card-content">
                    <span className="main-value">{parseFloat(index.value).toLocaleString()}</span>
                    <span className={`change ${index.change.includes('+') ? 'positive' : 'negative'}`}>
                      {index.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-chart">
              <h3>🌍 Global Indices Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={globalIndices.map(index => ({
                  index: index.index,
                  value: parseFloat(index.value)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={chartColors[3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Commodities Tab */}
        {activeTab === "commodities" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>🥇 Commodities Prices</h2>
              <p>Live prices of precious metals, energy, and agricultural products</p>
            </div>
            
            <div className="data-grid">
              {commoditiesPrices.map((commodity, index) => (
                <div key={index} className="data-card">
                  <div className="card-header">
                    <h3>{commodity.commodity}</h3>
                    <span className="unit">per {commodity.unit}</span>
                  </div>
                  <div className="card-content">
                    <span className="main-value">{commodity.price}</span>
                    <span className={`change ${commodity.change.includes('+') ? 'positive' : 'negative'}`}>
                      {commodity.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crypto Tab */}
        {activeTab === "crypto" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>₿ Cryptocurrency Markets</h2>
              <p>Live crypto prices and market capitalizations</p>
            </div>
            
            <div className="data-grid">
              {cryptoData.map((crypto, index) => (
                <div key={index} className="data-card">
                  <div className="card-header">
                    <h3>{crypto.symbol}</h3>
                    <span className="crypto-name">{crypto.name}</span>
                  </div>
                  <div className="card-content">
                    <span className="main-value">{crypto.price}</span>
                    <span className={`change ${crypto.change.includes('+') ? 'positive' : 'negative'}`}>
                      {crypto.change}
                    </span>
                  </div>
                  <div className="market-cap">Market Cap: {crypto.marketCap}</div>
                </div>
              ))}
            </div>

            <div className="comparison-chart">
              <h3>💰 Crypto Market Overview</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={cryptoData.map(crypto => ({
                      name: crypto.symbol,
                      value: parseFloat(crypto.price.replace('$', '').replace(',', ''))
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                  >
                    {cryptoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === "news" && (
          <div className="tab-content fade-in">
            <div className="tab-header">
              <h2>📰 Market News & Analysis</h2>
              <p>Latest financial news with sentiment analysis</p>
            </div>
            
            <div className="news-grid">
              {marketNews.map((news, index) => (
                <div key={index} className={`news-card ${news.sentiment}`}>
                  <div className="news-meta">
                    <div className="news-info">
                      <span className="source">{news.source}</span>
                      <span className="time">{news.time}</span>
                      <span className={`impact ${news.impact}`}>{news.impact.toUpperCase()}</span>
                    </div>
                    <div className={`sentiment-badge ${news.sentiment}`}>
                      {news.sentiment === 'positive' ? '📈' : news.sentiment === 'negative' ? '📉' : '📊'}
                      {news.sentiment.toUpperCase()}
                    </div>
                  </div>
                  <h3 className="news-title">{news.title}</h3>
                  <p className="news-summary">{news.summary}</p>
                </div>
              ))}
            </div>

            <div className="comparison-chart">
              <h3>📊 News Sentiment Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Positive', value: marketNews.filter(n => n.sentiment === 'positive').length },
                      { name: 'Negative', value: marketNews.filter(n => n.sentiment === 'negative').length },
                      { name: 'Neutral', value: marketNews.filter(n => n.sentiment === 'neutral').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    <Cell fill="#00D4AA" />
                    <Cell fill="#FF6B6B" />
                    <Cell fill="#FFD93D" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Alerts Modal */}
        {alertModal && (
          <div className="modal-overlay">
            <div className="alert-modal">
              <div className="modal-header">
                <h2>⚠️ Custom Alerts</h2>
                <button onClick={() => setAlertModal(false)} className="close-btn">✕</button>
              </div>
              
              <div className="modal-content">
                <div className="create-alert">
                  <h3>Create New Alert</h3>
                  <div className="alert-form">
                    <select 
                      value={newAlert.type} 
                      onChange={(e) => setNewAlert(prev => ({...prev, type: e.target.value}))}
                      className="form-input"
                    >
                      <option value="currency">Currency</option>
                      <option value="stock">Stock</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Symbol (e.g., USD/EUR, AAPL)"
                      value={newAlert.symbol}
                      onChange={(e) => setNewAlert(prev => ({...prev, symbol: e.target.value}))}
                      className="form-input"
                    />
                    <select 
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert(prev => ({...prev, condition: e.target.value}))}
                      className="form-input"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Threshold value"
                      step="0.01"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert(prev => ({...prev, threshold: e.target.value}))}
                      className="form-input"
                    />
                    <button onClick={addCustomAlert} className="add-alert-btn">Add Alert</button>
                  </div>
                </div>

                <div className="active-alerts">
                  <h3>Active Alerts ({customAlerts.length})</h3>
                  {customAlerts.map(alert => (
                    <div key={alert.id} className="alert-item">
                      <span>{alert.type}: {alert.symbol} {alert.condition} {alert.threshold}</span>
                      <button onClick={() => removeAlert(alert.id)} className="delete-btn">🗑️</button>
                    </div>
                  ))}
                </div>

                <div className="triggered-alerts">
                  <h3>Recent Triggered Alerts</h3>
                  {alerts.map(alert => (
                    <div key={alert.id} className="triggered-alert">
                      <span className="alert-message">{alert.message}</span>
                      <small className="alert-time">{alert.timestamp}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ExploreTrends;
