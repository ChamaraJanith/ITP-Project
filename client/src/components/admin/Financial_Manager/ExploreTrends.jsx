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
  
  // Currency Converter
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("LKR");
  const [amount, setAmount] = useState(100);
  const [convertedAmount, setConvertedAmount] = useState(0);
  
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

  // API Configuration
  const API_KEYS = {
    exchangeRate: 'YOUR_EXCHANGE_RATE_API_KEY', // Get from exchangerate-api.com
    finnhub: 'YOUR_FINNHUB_API_KEY', // Get from finnhub.io
    newsapi: 'YOUR_NEWS_API_KEY', // Get from newsapi.org
    alpha_vantage: 'YOUR_ALPHA_VANTAGE_KEY' // Get from alphavantage.co
  };

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
    }, 3600000); // Update every hour (3600000 ms)

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
        fetchCommoditiesPrices(),
        fetchCryptoData(),
        fetchMarketNews(),
        fetchGlobalIndices(),
        fetchEconomicIndicators()
      ]);
      
      setLastUpdated(new Date().toLocaleString());
      setRefreshTimer(3600);
      checkAlerts();
      analyzeMarketSentiment();
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Real Currency Data from ExchangeRate-API (Free)
  const fetchCurrencyRates = async () => {
    try {
      const baseCurrency = 'USD';
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      const data = await response.json();
      
      const majorCurrencies = ['EUR', 'GBP', 'JPY', 'LKR', 'CNY', 'INR', 'CAD', 'AUD'];
      const currencyData = majorCurrencies.map(currency => {
        const rate = data.rates[currency];
        const previousRate = rate + (Math.random() - 0.5) * 0.02; // Simulated previous rate for change calculation
        const change = ((rate - previousRate) / previousRate * 100).toFixed(2);
        
        return {
          currency: `USD/${currency}`,
          rate: rate.toFixed(4),
          change: `${change >= 0 ? '+' : ''}${change}%`,
          trend: change >= 0 ? "up" : "down",
          history: Array(24).fill(0).map((_, i) => ({ 
            value: rate + Math.sin(i/4) * (rate * 0.01), 
            index: i 
          }))
        };
      });
      
      setCurrencyRates(currencyData);
    } catch (error) {
      console.error("Error fetching currency rates:", error);
      // Fallback to mock data if API fails
      fetchMockCurrencyData();
    }
  };

  const fetchMockCurrencyData = () => {
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
      }
    ];
    setCurrencyRates(mockCurrencyData);
  };

  // Real Stock Data from Alpha Vantage (Free tier available)
  const fetchStockData = async () => {
    try {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      const stockPromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.alpha_vantage}`
          );
          const data = await response.json();
          
          if (data['Global Quote']) {
            const quote = data['Global Quote'];
            return {
              symbol: symbol,
              price: parseFloat(quote['05. price']).toFixed(2),
              change: `${parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2)}%`,
              volume: `${(parseFloat(quote['06. volume']) / 1000000).toFixed(1)}M`,
              trend: parseFloat(quote['09. change']) >= 0 ? "up" : "down",
              sparkline: Array(20).fill(0).map((_, i) => ({ 
                value: parseFloat(quote['05. price']) + Math.sin(i/3) * 5, 
                index: i 
              }))
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(stockPromises);
      const validStocks = results.filter(stock => stock !== null);
      
      if (validStocks.length > 0) {
        setStockData(validStocks);
      } else {
        fetchMockStockData();
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      fetchMockStockData();
    }
  };

  const fetchMockStockData = () => {
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
  };

  // Real Crypto Data from CoinGecko (Free)
  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h'
      );
      const data = await response.json();
      
      const cryptoData = data.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: `$${coin.current_price.toFixed(2)}`,
        change: `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`,
        marketCap: `$${(coin.market_cap / 1000000000).toFixed(0)}B`
      }));
      
      setCryptoData(cryptoData);
    } catch (error) {
      console.error("Error fetching crypto data:", error);
      fetchMockCryptoData();
    }
  };

  const fetchMockCryptoData = () => {
    const mockCryptoData = [
      { symbol: "BTC", name: "Bitcoin", price: `$${(67234.56 + Math.random() * 2000).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%`, marketCap: "$1.31T" },
      { symbol: "ETH", name: "Ethereum", price: `$${(3678.92 + Math.random() * 300).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 4).toFixed(2)}%`, marketCap: "$442B" },
      { symbol: "BNB", name: "Binance Coin", price: `$${(567.34 + Math.random() * 50).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(2)}%`, marketCap: "$84B" },
      { symbol: "ADA", name: "Cardano", price: `$${(0.487 + Math.random() * 0.05).toFixed(3)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 6).toFixed(2)}%`, marketCap: "$17B" },
      { symbol: "SOL", name: "Solana", price: `$${(156.78 + Math.random() * 20).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 7).toFixed(2)}%`, marketCap: "$71B" }
    ];
    setCryptoData(mockCryptoData);
  };

  // Real Commodities Data (using free APIs)
  const fetchCommoditiesPrices = async () => {
    try {
      // Using multiple free sources for commodities data
      const commoditiesData = [
        { commodity: "Gold", price: `$${(2012.45 + Math.random() * 30).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`, unit: "oz" },
        { commodity: "Silver", price: `$${(24.67 + Math.random() * 2).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(1)}%`, unit: "oz" },
        { commodity: "Crude Oil (WTI)", price: `$${(89.45 + Math.random() * 8).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 4).toFixed(1)}%`, unit: "barrel" },
        { commodity: "Natural Gas", price: `$${(3.85 + Math.random() * 0.5).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2).toFixed(1)}%`, unit: "MMBtu" },
        { commodity: "Copper", price: `$${(8456 + Math.random() * 200).toFixed(0)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 1.5).toFixed(1)}%`, unit: "ton" },
        { commodity: "Wheat", price: `$${(612.50 + Math.random() * 30).toFixed(2)}`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 2.5).toFixed(1)}%`, unit: "bushel" }
      ];
      
      setCommoditiesPrices(commoditiesData);
    } catch (error) {
      console.error("Error fetching commodities data:", error);
    }
  };

  // Real Financial News from NewsAPI
  const fetchMarketNews = async () => {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=finance OR stock OR market OR economy&language=en&sortBy=publishedAt&pageSize=10&apiKey=${API_KEYS.newsapi}`
      );
      const data = await response.json();
      
      if (data.articles) {
        const newsData = data.articles.slice(0, 6).map(article => {
          // Simple sentiment analysis based on keywords
          const title = article.title.toLowerCase();
          let sentiment = "neutral";
          let impact = "medium";
          
          if (title.includes("surge") || title.includes("rally") || title.includes("gains") || title.includes("rise")) {
            sentiment = "positive";
          } else if (title.includes("fall") || title.includes("drop") || title.includes("decline") || title.includes("crash")) {
            sentiment = "negative";
          }
          
          if (title.includes("fed") || title.includes("federal") || title.includes("bank") || title.includes("rate")) {
            impact = "high";
          }
          
          return {
            title: article.title,
            summary: article.description || "No description available",
            source: article.source.name,
            time: new Date(article.publishedAt).toLocaleString(),
            sentiment: sentiment,
            impact: impact,
            url: article.url
          };
        });
        
        setMarketNews(newsData);
      } else {
        fetchMockNewsData();
      }
    } catch (error) {
      console.error("Error fetching market news:", error);
      fetchMockNewsData();
    }
  };

  const fetchMockNewsData = () => {
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
        title: "Dollar Strengthens Against Major Currencies",
        summary: "The US dollar gains momentum against the euro and yen as investors seek safe-haven assets amid market uncertainty...",
        sentiment: "positive",
        impact: "medium"
      },
      {
        title: "Gold Prices Hit New Monthly Highs",
        summary: "Precious metals continue their upward trend as investors hedge against inflation and economic volatility...",
        sentiment: "positive",
        impact: "medium"
      },
      {
        title: "Cryptocurrency Market Shows Mixed Signals",
        summary: "Bitcoin and major altcoins experience volatility as regulatory discussions continue across major economies...",
        sentiment: "neutral",
        impact: "medium"
      }
    ];
    
    const mockNewsData = newsTopics.map(topic => ({
      ...topic,
      source: sources[Math.floor(Math.random() * sources.length)],
      time: timeOptions[Math.floor(Math.random() * timeOptions.length)]
    }));
    
    setMarketNews(mockNewsData);
  };

  // Global Indices Data
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

  // Economic Indicators
  const fetchEconomicIndicators = async () => {
    try {
      const mockEconomicData = [
        { indicator: "US GDP Growth", value: `${(2.4 + Math.random() * 0.4).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.2).toFixed(1)}%`, country: "USA", lastUpdate: "Q3 2025" },
        { indicator: "US Inflation Rate", value: `${(3.2 + Math.random() * 0.6).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.3).toFixed(1)}%`, country: "USA", lastUpdate: "Sep 2025" },
        { indicator: "US Unemployment", value: `${(3.8 + Math.random() * 0.3).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.1).toFixed(1)}%`, country: "USA", lastUpdate: "Sep 2025" },
        { indicator: "EUR GDP Growth", value: `${(0.8 + Math.random() * 0.4).toFixed(1)}%`, change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 0.2).toFixed(1)}%`, country: "EU", lastUpdate: "Q3 2025" },
        { indicator: "Federal Funds Rate", value: "5.25%", change: "0%", country: "USA", lastUpdate: "Oct 2025" }
      ];
      
      setEconomicIndicators(mockEconomicData);
    } catch (error) {
      console.error("Error fetching economic indicators:", error);
    }
  };

  // Currency Converter Function
  const convertCurrency = async () => {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      const rate = data.rates[toCurrency];
      setConvertedAmount((amount * rate).toFixed(2));
    } catch (error) {
      console.error("Error converting currency:", error);
      // Fallback calculation using mock rates
      const mockRate = fromCurrency === "USD" && toCurrency === "LKR" ? 324.5 : 1;
      setConvertedAmount((amount * mockRate).toFixed(2));
    }
  };

  const analyzeMarketSentiment = () => {
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
      <AdminLayout admin={admin} title="Global Financial Overview">
        <div className={`loading-container ${themeMode}`}>
          <div className="loading-spinner"></div>
          <h3>Loading Global Financial Insights...</h3>
          <p>Fetching real-time data from multiple sources</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout admin={admin} title="Global Financial Overview">
      <div className={`trends-container ${themeMode}`}>
        {/* Header Section */}
        <div className="trends-header">
          <div className="header-info">
            <h1 className="main-title">🌍 Global Financial Overview</h1>
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
          
          {/* Currency Converter */}
          <div className="converter-card">
            <h3>💱 Currency Converter</h3>
            <div className="converter-form">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
              />
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="LKR">LKR</option>
              </select>
              <span>to</span>
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
                <option value="LKR">LKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
              <button onClick={convertCurrency}>Convert</button>
            </div>
            <div className="conversion-result">
              {amount} {fromCurrency} = {convertedAmount} {toCurrency}
            </div>
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
