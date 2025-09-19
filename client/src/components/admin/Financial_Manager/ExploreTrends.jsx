import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../AdminLayout";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Cell,
  ComposedChart,
} from "recharts";

const ExploreTrends = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("currencies");
  const [themeMode, setThemeMode] = useState("dark");
  const [refreshTimer, setRefreshTimer] = useState(3600); // Changed to 3600 (1 hour)
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

  // Helper function to format timer display
  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    initializeTrends();
    
    // Auto-refresh every 1 hour (3600000 milliseconds)
    const interval = setInterval(() => {
      refreshAllData();
    }, 3600000);

    // Countdown timer
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

      // Load saved theme
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
      setRefreshTimer(3600); // Reset to 1 hour
      checkAlerts();
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Currency Exchange Rates
  const fetchCurrencyRates = async () => {
    try {
      const mockCurrencyData = [
        { 
          currency: "USD/EUR", 
          rate: (0.85 + Math.random() * 0.02).toFixed(4), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.5).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => (0.85 + Math.sin(i/4) * 0.02).toFixed(4)) 
        },
        { 
          currency: "USD/GBP", 
          rate: (0.73 + Math.random() * 0.02).toFixed(4), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.4).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => (0.73 + Math.sin(i/5) * 0.01).toFixed(4)) 
        },
        { 
          currency: "USD/JPY", 
          rate: (149.25 + Math.random() * 2).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => (149 + Math.sin(i/3) * 2).toFixed(2)) 
        },
        { 
          currency: "USD/LKR", 
          rate: (324.50 + Math.random() * 5).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.8).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => (324 + Math.sin(i/4) * 3).toFixed(2)) 
        },
        { 
          currency: "USD/CNY", 
          rate: (7.23 + Math.random() * 0.1).toFixed(3), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.3).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => (7.2 + Math.sin(i/6) * 0.05).toFixed(3)) 
        },
        { 
          currency: "USD/INR", 
          rate: (83.25 + Math.random() * 1).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.5).toFixed(2)}%`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          history: Array(24).fill(0).map((_, i) => (83 + Math.sin(i/4) * 0.5).toFixed(2)) 
        }
      ];
      
      setCurrencyRates(mockCurrencyData);
    } catch (error) {
      console.error("Error fetching currency rates:", error);
    }
  };

  // Fetch Stock Market Data
  const fetchStockData = async () => {
    try {
      const mockStockData = [
        { 
          symbol: "AAPL", 
          price: (189.25 + Math.random() * 10).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(2)}%`, 
          volume: `${(50 + Math.random() * 20).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => (185 + Math.sin(i/3) * 5).toFixed(2)) 
        },
        { 
          symbol: "GOOGL", 
          price: (142.18 + Math.random() * 8).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2.5).toFixed(2)}%`, 
          volume: `${(25 + Math.random() * 15).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => (140 + Math.sin(i/4) * 4).toFixed(2)) 
        },
        { 
          symbol: "MSFT", 
          price: (378.85 + Math.random() * 15).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(2)}%`, 
          volume: `${(30 + Math.random() * 12).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => (375 + Math.sin(i/5) * 8).toFixed(2)) 
        },
        { 
          symbol: "TSLA", 
          price: (248.42 + Math.random() * 20).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%`, 
          volume: `${(80 + Math.random() * 30).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => (245 + Math.sin(i/2) * 12).toFixed(2)) 
        },
        { 
          symbol: "AMZN", 
          price: (155.73 + Math.random() * 12).toFixed(2), 
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2.8).toFixed(2)}%`, 
          volume: `${(40 + Math.random() * 18).toFixed(1)}M`, 
          trend: Math.random() > 0.5 ? "up" : "down", 
          sparkline: Array(20).fill(0).map((_, i) => (154 + Math.sin(i/3.5) * 6).toFixed(2)) 
        }
      ];
      
      setStockData(mockStockData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  // Fetch Economic Indicators
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

  // Fetch Market News
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

  // Fetch Global Market Indices
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

  // Fetch Commodities Prices
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

  // Fetch Cryptocurrency Data
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

  // Analyze Market Sentiment
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

  // Check and trigger alerts
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

  // Theme Toggle
  const toggleTheme = () => {
    const newTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(newTheme);
    document.body.className = newTheme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("trendsTheme", newTheme);
  };

  // Add Custom Alert
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

  // Remove Alert
  const removeAlert = (alertId) => {
    setCustomAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Chart Color Schemes
  const chartColors = themeMode === "dark" 
    ? ["#00D4AA", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]
    : ["#2196F3", "#FF5722", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4"];

  if (loading && !currencyRates.length) {
    return (
      <AdminLayout admin={admin} title="Explore Financial Trends">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh', 
          textAlign: 'center',
          background: themeMode === 'dark' ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          color: themeMode === 'dark' ? '#ffffff' : '#333333'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(0, 212, 170, 0.3)',
            borderLeft: '4px solid #00D4AA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <h3>Loading Global Financial Insights...</h3>
          <p>Fetching real-time data from multiple sources</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Explore Financial Trends">
      <div style={{
        padding: '20px',
        minHeight: '100vh',
        background: themeMode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        color: themeMode === 'dark' ? '#ffffff' : '#333333',
        transition: 'all 0.3s ease'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 10px 0',
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>🌍 Global Financial Trends</h1>
            <p style={{ margin: '0 0 15px 0', opacity: '0.8', fontSize: '1.1rem' }}>
              Real-time insights • Updated every hour
            </p>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '5px 10px',
                background: 'rgba(0, 212, 170, 0.2)',
                borderRadius: '20px',
                border: '1px solid rgba(0, 212, 170, 0.3)'
              }}>
                Last updated: {lastUpdated}
              </span>
              <span style={{
                padding: '5px 10px',
                background: 'rgba(255, 107, 107, 0.2)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                animation: 'pulse 1s infinite'
              }}>
                Next update: {formatTimer(refreshTimer)}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={toggleTheme}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '25px',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)'
              }}
            >
              {themeMode === "dark" ? "🌞 Light" : "🌙 Dark"}
            </button>
            <button 
              onClick={refreshAllData} 
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '25px',
                background: loading ? 'rgba(0, 212, 170, 0.6)' : 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                color: 'white',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)'
              }}
            >
              {loading ? "🔄 Updating..." : "🔄 Refresh Now"}
            </button>
            <button 
              onClick={() => setAlertModal(true)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '25px',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)'
              }}
            >
              ⚠️ Alerts ({customAlerts.length})
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'linear-gradient(45deg, #ff6b6b, #ee5a5a)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
          }}>
            ⚠️ {error}
            <button 
              onClick={() => setError("")}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Market Sentiment Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 2fr' : '1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>📊 Market Sentiment</h3>
            <div style={{ marginBottom: '15px' }}>
              <span style={{
                display: 'block',
                fontSize: '3rem',
                fontWeight: '700',
                marginBottom: '5px'
              }}>
                {sentiment.score > 0 ? '+' : ''}{sentiment.score}
              </span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                padding: '5px 15px',
                borderRadius: '20px',
                background: sentiment.trend === 'bullish' 
                  ? 'rgba(0, 212, 170, 0.3)' 
                  : sentiment.trend === 'bearish' 
                    ? 'rgba(255, 107, 107, 0.3)' 
                    : 'rgba(255, 217, 61, 0.3)',
                color: sentiment.trend === 'bullish' 
                  ? '#00D4AA' 
                  : sentiment.trend === 'bearish' 
                    ? '#FF6B6B' 
                    : '#FFD93D'
              }}>
                {sentiment.trend.toUpperCase()}
              </span>
            </div>
            <p>Based on {stockData.length + currencyRates.length} indicators</p>
          </div>
          
          {alerts.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#FF6B6B' }}>🔔 Recent Alerts</h4>
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  background: 'rgba(255, 107, 107, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #FF6B6B'
                }}>
                  <span style={{ display: 'block', fontWeight: '500' }}>{alert.message}</span>
                  <small style={{ opacity: '0.7', fontSize: '0.8rem' }}>{alert.timestamp}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          overflowX: 'auto',
          paddingBottom: '10px',
          flexWrap: 'wrap'
        }}>
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
              style={{
                padding: '12px 20px',
                border: activeTab === tab.id ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                background: activeTab === tab.id 
                  ? 'linear-gradient(45deg, #00D4AA, #4ECDC4)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: activeTab === tab.id ? 'white' : 'inherit',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === tab.id ? '0 4px 15px rgba(0, 212, 170, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Currency Exchange Rates Tab */}
        {activeTab === "currencies" && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>💱 Currency Exchange Rates</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Live forex rates with historical trends</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {currencyRates.map((currency, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>{currency.currency}</h3>
                    <span style={{ fontSize: '1.5rem' }}>
                      {currency.trend === "up" ? "📈" : "📉"}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{currency.rate}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: currency.change.includes('+') 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: currency.change.includes('+') ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {currency.change}
                    </span>
                  </div>
                  <div style={{ marginTop: '15px', height: '60px' }}>
                    <ResponsiveContainer width="100%" height={60}>
                      <LineChart data={currency.history.map((value, i) => ({ value: parseFloat(value), index: i }))}>
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

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              marginTop: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.5rem' }}>
                📈 Currency Trends Comparison
              </h3>
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

        {/* Stock Market Data Tab */}
        {activeTab === "stocks" && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>📈 Stock Market Data</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Real-time stock prices with trading volumes</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {stockData.map((stock, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>{stock.symbol}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: '0.7' }}>Vol: {stock.volume}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>${stock.price}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: stock.change.includes('+') 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: stock.change.includes('+') ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {stock.change}
                    </span>
                  </div>
                  <div style={{ marginTop: '15px', height: '50px' }}>
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart data={stock.sparkline.map((value, i) => ({ value: parseFloat(value), index: i }))}>
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

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              marginTop: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.5rem' }}>
                📊 Stock Performance Comparison
              </h3>
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

        {/* Economic Indicators Tab */}
        {activeTab === "economics" && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>🏦 Economic Indicators</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Key global economic measurements and trends</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {economicIndicators.map((indicator, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{indicator.indicator}</h4>
                    <span style={{
                      fontSize: '0.9rem',
                      opacity: '0.7',
                      padding: '2px 8px',
                      background: 'rgba(0, 212, 170, 0.2)',
                      borderRadius: '10px'
                    }}>
                      {indicator.country}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: '700' }}>{indicator.value}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: indicator.change.includes('+') 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: indicator.change.includes('+') ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {indicator.change}
                    </span>
                  </div>
                  <div style={{ opacity: '0.7', fontSize: '0.8rem' }}>
                    Updated: {indicator.lastUpdate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Indices Tab */}
        {activeTab === "indices" && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>📊 Global Market Indices</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Major stock market indices worldwide</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {globalIndices.map((index, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>{index.index}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: '0.7' }}>{index.country}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                      {parseFloat(index.value).toLocaleString()}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: index.change.includes('+') 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: index.change.includes('+') ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {index.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              marginTop: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.5rem' }}>
                🌍 Global Indices Performance
              </h3>
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
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>🥇 Commodities Prices</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Live prices of precious metals, energy, and agricultural products</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {commoditiesPrices.map((commodity, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>{commodity.commodity}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: '0.7' }}>per {commodity.unit}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{commodity.price}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: commodity.change.includes('+') 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: commodity.change.includes('+') ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {commodity.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cryptocurrency Tab */}
        {activeTab === "crypto" && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>₿ Cryptocurrency Markets</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Live crypto prices and market capitalizations</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {cryptoData.map((crypto, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>{crypto.symbol}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: '0.7' }}>{crypto.name}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    marginBottom: '15px'
                  }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{crypto.price}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '15px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: crypto.change.includes('+') 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : 'rgba(255, 107, 107, 0.3)',
                      color: crypto.change.includes('+') ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {crypto.change}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: '0.8', marginTop: '10px' }}>
                    <small>Market Cap: {crypto.marketCap}</small>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              marginTop: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.5rem' }}>
                💰 Crypto Market Overview
              </h3>
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

        {/* Market News Tab */}
        {activeTab === "news" && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '2rem',
                margin: '0 0 10px 0',
                background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>📰 Market News & Analysis</h2>
              <p style={{ opacity: '0.8', fontSize: '1.1rem' }}>Latest financial news with sentiment analysis</p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {marketNews.map((news, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderLeft: `4px solid ${
                    news.sentiment === 'positive' ? '#00D4AA' 
                    : news.sentiment === 'negative' ? '#FF6B6B' 
                    : '#FFD93D'
                  }`,
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', opacity: '0.8' }}>
                      <span style={{ fontWeight: '600' }}>{news.source}</span>
                      <span>{news.time}</span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: news.impact === 'high' 
                          ? 'rgba(255, 107, 107, 0.3)' 
                          : news.impact === 'medium' 
                            ? 'rgba(255, 217, 61, 0.3)' 
                            : 'rgba(0, 212, 170, 0.3)',
                        color: news.impact === 'high' 
                          ? '#FF6B6B' 
                          : news.impact === 'medium' 
                            ? '#FFD93D' 
                            : '#00D4AA'
                      }}>
                        {news.impact.toUpperCase()}
                      </span>
                    </div>
                    <div style={{
                      padding: '5px 10px',
                      borderRadius: '15px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: news.sentiment === 'positive' 
                        ? 'rgba(0, 212, 170, 0.3)' 
                        : news.sentiment === 'negative' 
                          ? 'rgba(255, 107, 107, 0.3)' 
                          : 'rgba(255, 217, 61, 0.3)',
                      color: news.sentiment === 'positive' 
                        ? '#00D4AA' 
                        : news.sentiment === 'negative' 
                          ? '#FF6B6B' 
                          : '#FFD93D'
                    }}>
                      {news.sentiment === 'positive' ? '📈' : news.sentiment === 'negative' ? '📉' : '📊'}
                      {news.sentiment.toUpperCase()}
                    </div>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', lineHeight: '1.4' }}>
                    {news.title}
                  </h3>
                  <p style={{ margin: '0', opacity: '0.8', lineHeight: '1.5' }}>
                    {news.summary}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              marginTop: '30px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.5rem' }}>
                📊 News Sentiment Analysis
              </h3>
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
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '25px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h2 style={{ margin: '0', fontSize: '1.8rem' }}>⚠️ Custom Alerts</h2>
                <button 
                  onClick={() => setAlertModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ padding: '25px', maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{
                  marginBottom: '30px',
                  paddingBottom: '30px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Create New Alert</h3>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <select 
                      value={newAlert.type} 
                      onChange={(e) => setNewAlert(prev => ({...prev, type: e.target.value}))}
                      style={{
                        flex: '1',
                        padding: '12px 15px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'inherit',
                        fontSize: '1rem',
                        minWidth: '150px'
                      }}
                    >
                      <option value="currency">Currency</option>
                      <option value="stock">Stock</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Symbol (e.g., USD/EUR, AAPL)"
                      value={newAlert.symbol}
                      onChange={(e) => setNewAlert(prev => ({...prev, symbol: e.target.value}))}
                      style={{
                        flex: '1',
                        padding: '12px 15px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'inherit',
                        fontSize: '1rem',
                        minWidth: '200px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <select 
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert(prev => ({...prev, condition: e.target.value}))}
                      style={{
                        flex: '1',
                        padding: '12px 15px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'inherit',
                        fontSize: '1rem',
                        minWidth: '150px'
                      }}
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
                      style={{
                        flex: '1',
                        padding: '12px 15px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'inherit',
                        fontSize: '1rem',
                        minWidth: '200px'
                      }}
                    />
                  </div>
                  <button 
                    onClick={addCustomAlert} 
                    style={{
                      padding: '12px 25px',
                      border: 'none',
                      borderRadius: '25px',
                      background: 'linear-gradient(45deg, #00D4AA, #4ECDC4)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Add Alert
                  </button>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>
                    Active Alerts ({customAlerts.length})
                  </h3>
                  {customAlerts.map(alert => (
                    <div key={alert.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      marginBottom: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <span>{alert.type}: {alert.symbol} {alert.condition} {alert.threshold}</span>
                      <button 
                        onClick={() => removeAlert(alert.id)}
                        style={{
                          background: 'rgba(255, 107, 107, 0.3)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>Recent Triggered Alerts</h3>
                  {alerts.map(alert => (
                    <div key={alert.id} style={{
                      padding: '10px 15px',
                      background: 'rgba(255, 107, 107, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      borderLeft: '4px solid #FF6B6B'
                    }}>
                      <span style={{ display: 'block', fontWeight: '500' }}>{alert.message}</span>
                      <small style={{ opacity: '0.7', fontSize: '0.8rem' }}>{alert.timestamp}</small>
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
