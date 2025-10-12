// DoctorDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../AdminLayout";
import { adminDashboardApi } from "../../../services/adminApi.js";
import { useNavigate } from "react-router-dom";
import EmergencyAlertsPage from "../Doctor/EmergencyAlertsPage.jsx";
import { getAllPrescriptions } from "../../../services/prescriptionService";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, TrendingUp, Activity, AlertTriangle, Clock, FileText, Stethoscope, 
  Pill, RefreshCw, Download, Filter, ChevronDown, ChevronUp, Eye, Target, Zap, 
  Heart, Brain, Timer, Award, TrendingDown, BarChart3, PieChartIcon, ActivityIcon,
  CalendarDays, UserCheck, Star, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState('dashboard');
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [todayPrescriptionsCount, setTodayPrescriptionsCount] = useState(0);
  const [todayPatientsCount, setTodayPatientsCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [doctorActivities, setDoctorActivities] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prescriptions, setPrescriptions] = useState([]);
  
  // Advanced chart states
  const [visitTimeRange, setVisitTimeRange] = useState('week');
  const [visitChartData, setVisitChartData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [patientDemographics, setPatientDemographics] = useState([]);
  const [visitTypes, setVisitTypes] = useState([]);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [visitStats, setVisitStats] = useState({
    total: 0,
    average: 0,
    peak: 0,
    trend: 'stable',
    growthRate: 0,
    comparison: 0,
    satisfaction: 0,
    efficiency: 0
  });
  
  const navigate = useNavigate();
  const backendUrl = "http://localhost:7000";
  const isMounted = useRef(true);
  const activityCounterRef = useRef(0);
  const chartContainerRef = useRef(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for when API is unavailable
  const mockDashboardData = {
    stats: {
      todayPatients: 8,
      pendingReports: 3,
      consultationsCompleted: 12,
      emergencyAlerts: 1
    },
    recentActivities: [
      { id: 1, text: "Completed consultation with Patient #1234", time: "10:30 AM" },
      { id: 2, text: "Reviewed lab results for Patient #5678", time: "9:15 AM" },
      { id: 3, text: "Updated prescription for Patient #9012", time: "Yesterday" }
    ],
    upcomingAppointments: [
      { id: 1, patient: "John Smith", time: "11:00 AM", type: "Follow-up" },
      { id: 2, patient: "Emma Johnson", time: "1:30 PM", type: "Consultation" },
      { id: 3, patient: "Michael Brown", time: "3:00 PM", type: "Examination" }
    ],
    doctorSchedule: [
      { id: 1, day: "Monday", time: "9:00 AM - 5:00 PM", available: true },
      { id: 2, day: "Tuesday", time: "9:00 AM - 1:00 PM", available: true },
      { id: 3, day: "Wednesday", time: "10:00 AM - 4:00 PM", available: true },
      { id: 4, day: "Thursday", time: "9:00 AM - 5:00 PM", available: false },
      { id: 5, day: "Friday", time: "9:00 AM - 3:00 PM", available: true },
    ]
  };

  // Function to check if a date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    
    let date;
    // Handle different date formats
    if (typeof dateString === 'string') {
      // If it's already in YYYY-MM-DD format
      if (dateString.includes('-') && dateString.length === 10) {
        date = new Date(dateString + 'T00:00:00');
      } else {
        // Try parsing as is
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    return date.getTime() === today.getTime();
  };

  // Function to check if appointment time has passed
  const isTimePassed = (appointmentTime) => {
    if (!appointmentTime) return false;
    
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date();
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    return appointmentDateTime < currentTime;
  };

  // Function to format time
  const formatTime = (time) => {
    if (!time || typeof time !== "string") return "Time not set";
    const parts = time.split(":");
    if (parts.length !== 2) return time;
    const hour = parseInt(parts[0], 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${parts[1]} ${ampm}`;
  };

  // Function to format activity time
  const formatActivityTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMins = Math.floor(diffSeconds / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return activityTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Function to filter prescriptions for today
  const filterTodaysPrescriptions = (prescriptions) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return prescriptions.filter((prescription) => {
      if (!prescription.date) return false;
      const prescriptionDate = new Date(prescription.date).toISOString().slice(0, 10);
      return prescriptionDate === todayStr;
    });
  };

  // Advanced data processing functions using real prescription data
  const processPatientVisitsData = (prescriptions, range) => {
    const now = new Date();
    const data = [];
    const comparison = [];
    
    // Debug: Log prescriptions to see what we're working with
    console.log('Processing prescriptions for range:', range, 'Total prescriptions:', prescriptions.length);
    
    if (range === 'day') {
      // Today's hourly data (8 AM to 8 PM)
      const todayPrescriptions = prescriptions.filter(p => {
        if (!p.date) return false;
        return isToday(p.date);
      });
      
      console.log('Today prescriptions:', todayPrescriptions.length);
      
      for (let hour = 8; hour <= 20; hour++) {
        const visits = todayPrescriptions.filter(p => {
          if (!p.date) return false;
          try {
            const prescDate = new Date(p.date);
            if (isNaN(prescDate.getTime())) return false;
            return prescDate.getHours() === hour;
          } catch (e) {
            console.error('Error parsing date:', p.date, e);
            return false;
          }
        }).length;
        
        data.push({
          date: `${hour}:00`,
          visits: visits,
          fullDate: now.toISOString().split('T')[0]
        });
      }
      
      // Yesterday's hourly data for comparison
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayPrescriptions = prescriptions.filter(p => {
        if (!p.date) return false;
        const prescDate = new Date(p.date).toISOString().split('T')[0];
        return prescDate === yesterdayStr;
      });
      
      for (let hour = 8; hour <= 20; hour++) {
        const visits = yesterdayPrescriptions.filter(p => {
          if (!p.date) return false;
          try {
            const prescDate = new Date(p.date);
            if (isNaN(prescDate.getTime())) return false;
            return prescDate.getHours() === hour;
          } catch (e) {
            return false;
          }
        }).length;
        
        comparison.push({
          date: `${hour}:00`,
          visits: visits,
          period: 'Yesterday'
        });
      }
    } else if (range === 'week') {
      // Current week data
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const visits = prescriptions.filter(p => {
          if (!p.date) return false;
          const prescDate = new Date(p.date).toISOString().split('T')[0];
          return prescDate === dateStr;
        }).length;
        
        data.push({
          date: dayName,
          visits: visits,
          fullDate: dateStr
        });
      }
      
      // Previous week for comparison
      for (let i = 13; i >= 7; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const visits = prescriptions.filter(p => {
          if (!p.date) return false;
          const prescDate = new Date(p.date).toISOString().split('T')[0];
          return prescDate === dateStr;
        }).length;
        
        comparison.push({
          date: dayName,
          visits: visits,
          period: 'Previous'
        });
      }
    } else if (range === 'month') {
      // Last 30 days grouped by week
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      weeks.forEach((week, index) => {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (30 - (index * 7)));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const visits = prescriptions.filter(p => {
          if (!p.date) return false;
          const prescDate = new Date(p.date);
          return prescDate >= startDate && prescDate <= endDate;
        }).length;
        
        data.push({
          date: week,
          visits: visits,
          fullDate: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`
        });
      });
      
      // Previous month for comparison
      const prevWeeks = ['Prev W1', 'Prev W2', 'Prev W3', 'Prev W4'];
      prevWeeks.forEach((week, index) => {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (60 - (index * 7)));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const visits = prescriptions.filter(p => {
          if (!p.date) return false;
          const prescDate = new Date(p.date);
          return prescDate >= startDate && prescDate <= endDate;
        }).length;
        
        comparison.push({
          date: week,
          visits: visits,
          period: 'Previous'
        });
      });
    } else if (range === 'year') {
      // Last 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = now.getMonth();
      
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = monthIndex > currentMonth ? now.getFullYear() - 1 : now.getFullYear();
        
        const visits = prescriptions.filter(p => {
          if (!p.date) return false;
          const prescDate = new Date(p.date);
          return prescDate.getMonth() === monthIndex && prescDate.getFullYear() === year;
        }).length;
        
        data.push({
          date: months[monthIndex],
          visits: visits,
          fullDate: `${year}-${String(monthIndex + 1).padStart(2, '0')}`
        });
      }
      
      // Previous year for comparison
      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const year = monthIndex > currentMonth ? now.getFullYear() - 2 : now.getFullYear() - 1;
        
        const visits = prescriptions.filter(p => {
          if (!p.date) return false;
          const prescDate = new Date(p.date);
          return prescDate.getMonth() === monthIndex && prescDate.getFullYear() === year;
        }).length;
        
        comparison.push({
          date: months[monthIndex],
          visits: visits,
          period: 'Previous'
        });
      }
    }
    
    // Debug: Log processed data
    console.log('Processed chart data:', data);
    console.log('Comparison data:', comparison);
    
    // Process patient demographics from real data
    const demographics = [
      { name: '0-18', value: 0, color: '#FF6B6B' },
      { name: '19-35', value: 0, color: '#4ECDC4' },
      { name: '36-50', value: 0, color: '#45B7D1' },
      { name: '51-65', value: 0, color: '#96CEB4' },
      { name: '65+', value: 0, color: '#FFEAA7' }
    ];
    
    // Calculate age from prescription data
    prescriptions.forEach(p => {
      if (p.patientDateOfBirth) {
        const birthDate = new Date(p.patientDateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age <= 18) demographics[0].value++;
        else if (age <= 35) demographics[1].value++;
        else if (age <= 50) demographics[2].value++;
        else if (age <= 65) demographics[3].value++;
        else demographics[4].value++;
      }
    });
    
    // Process visit types from real data
    const visitTypesData = [
      { type: 'New Patient', count: 0, color: '#6C5CE7' },
      { type: 'Follow-up', count: 0, color: '#00B894' },
      { type: 'Emergency', count: 0, color: '#E17055' },
      { type: 'Consultation', count: 0, color: '#0984E3' },
      { type: 'Check-up', count: 0, color: '#FDCB6E' }
    ];
    
    // Categorize visits based on diagnosis and other factors
    prescriptions.forEach(p => {
      if (p.diagnosis) {
        const diagnosis = p.diagnosis.toLowerCase();
        if (diagnosis.includes('emergency') || diagnosis.includes('urgent')) {
          visitTypesData[2].count++;
        } else if (diagnosis.includes('follow-up') || diagnosis.includes('review')) {
          visitTypesData[1].count++;
        } else if (diagnosis.includes('consultation')) {
          visitTypesData[3].count++;
        } else if (diagnosis.includes('check-up') || diagnosis.includes('routine')) {
          visitTypesData[4].count++;
        } else {
          visitTypesData[0].count++;
        }
      } else {
        visitTypesData[0].count++;
      }
    });
    
    // Calculate advanced statistics
    const totalVisits = data.reduce((sum, item) => sum + item.visits, 0);
    const averageVisits = data.length > 0 ? Math.round(totalVisits / data.length) : 0;
    const peakVisits = data.length > 0 ? Math.max(...data.map(item => item.visits)) : 0;
    
    // Calculate trend and growth
    const recentVisits = data.slice(-3).reduce((sum, item) => sum + item.visits, 0);
    const previousVisits = data.length > 6 ? data.slice(-6, -3).reduce((sum, item) => sum + item.visits, 0) : 0;
    const trend = recentVisits > previousVisits ? 'up' : recentVisits < previousVisits ? 'down' : 'stable';
    const growthRate = previousVisits > 0 ? ((recentVisits - previousVisits) / previousVisits * 100).toFixed(1) : 0;
    
    // Calculate comparison with previous period
    const currentTotal = data.reduce((sum, item) => sum + item.visits, 0);
    const previousTotal = comparison.reduce((sum, item) => sum + item.visits, 0);
    const comparisonPercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0;
    
    // Calculate efficiency metrics based on real data
    const avgConsultationTime = 30; // Average consultation time in minutes
    const totalConsultationTime = totalVisits * avgConsultationTime;
    const workingHoursPerDay = 8;
    const workingDays = range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365;
    const totalAvailableTime = workingDays * workingHoursPerDay * 60;
    const efficiencyScore = Math.min(100, Math.max(0, (totalConsultationTime / totalAvailableTime) * 100));
    
    // Calculate satisfaction based on follow-up rate
    const followUpRate = visitTypesData[1].count > 0 ? (visitTypesData[1].count / totalVisits * 100) : 0;
    const satisfactionScore = Math.min(100, Math.max(0, 70 + followUpRate));
    
    setVisitStats({
      total: totalVisits,
      average: averageVisits,
      peak: peakVisits,
      trend: trend,
      growthRate: parseFloat(growthRate),
      comparison: parseFloat(comparisonPercent),
      satisfaction: Math.round(satisfactionScore),
      efficiency: Math.round(efficiencyScore)
    });
    
    setVisitChartData(data);
    setComparisonData(comparison);
    setPatientDemographics(demographics);
    setVisitTypes(visitTypesData);
  };

  // Function to log doctor activities
  const logDoctorActivity = (action, details = "", category = "general", priority = "normal") => {
    if (!isMounted.current) return;
    
    activityCounterRef.current += 1;
    
    const activity = {
      id: `${Date.now()}-${activityCounterRef.current}`,
      action,
      details,
      category,
      priority,
      timestamp: new Date().toISOString(),
      doctorId: 'DOC001',
      doctorName: 'Dr. Gayath Dahanayake',
      isNew: true
    };
    
    setDoctorActivities(prev => {
      const updated = [activity, ...prev.slice(0, 14)];
      setTimeout(() => {
        setDoctorActivities(current => 
          current.map(a => a.id === activity.id ? {...a, isNew: false} : a)
        );
      }, 3000);
      return updated;
    });
    
    console.log(`[${category.toUpperCase()}] ${action}${details ? ': ' + details : ''}`);
  };

  // Fetch all prescriptions
  const fetchAllPrescriptions = async () => {
    logDoctorActivity("Loading prescriptions", "Fetching all prescription data", "prescription", "high");
    
    try {
      const res = await getAllPrescriptions();
      const allPrescriptions = res.data?.data || [];
      
      if (isMounted.current) {
        setPrescriptions(allPrescriptions);
        
        // Process patient visits data
        processPatientVisitsData(allPrescriptions, visitTimeRange);
        
        // Filter today's prescriptions
        const todaysPrescriptions = filterTodaysPrescriptions(allPrescriptions);
        setTodayPrescriptionsCount(todaysPrescriptions.length);
        
        logDoctorActivity(
          "Prescriptions loaded", 
          `Found ${allPrescriptions.length} total prescriptions, ${todaysPrescriptions.length} for today`, 
          "prescription",
          "low"
        );
      }
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      if (isMounted.current) {
        logDoctorActivity(
          "Prescription load failed", 
          err.message || "Failed to load prescriptions", 
          "error",
          "high"
        );
      }
    }
  };

  // Fetch today's upcoming appointments
  const fetchUpcomingAppointments = async () => {
    logDoctorActivity("Checking appointments", "Loading upcoming appointments", "appointment", "high");
    
    try {
      const res = await axios.get(`${backendUrl}/api/appointments/accepted`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const allAppointments = res.data.appointments || [];
      
      const todayUpcoming = allAppointments.filter(appt => {
        return isToday(appt.appointmentDate) && !isTimePassed(appt.appointmentTime);
      });
      
      todayUpcoming.sort((a, b) => {
        const timeA = a.appointmentTime || "23:59";
        const timeB = b.appointmentTime || "23:59";
        return timeA.localeCompare(timeB);
      });
      
      const todayAppts = allAppointments.filter(appt => isToday(appt.appointmentDate));
      const uniquePatients = new Set(todayAppts.map(appt => appt.email || appt.phone || appt.name));
      
      if (isMounted.current) {
        setUpcomingAppointments(todayUpcoming);
        setTodayPatientsCount(uniquePatients.size);
        logDoctorActivity(
          "Appointments loaded", 
          `Found ${todayUpcoming.length} upcoming appointments for ${uniquePatients.size} patients`, 
          "appointment",
          "low"
        );
      }
    } catch (err) {
      console.error("Failed to fetch upcoming appointments:", err);
      if (isMounted.current) {
        setUpcomingAppointments([]);
        setTodayPatientsCount(0);
        logDoctorActivity(
          "Appointment load failed", 
          err.message || "Failed to load appointments", 
          "error",
          "high"
        );
      }
    }
  };

  // Doctor information
  const [doctor] = useState({
    id: 'DOC001',
    name: 'Dr. Gayath Dahanayake',
    specialization: 'Emergency Medicine'
  });

  const fetchEmergencyAlertCount = async () => {
    logDoctorActivity("Checking alerts", "Looking for emergency alerts", "emergency", "high");
    
    try {
      const response = await fetch('http://localhost:7000/api/doctor/emergency-alerts/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && isMounted.current) {
          const alertCount = data.data.overview?.activeAlerts || 0;
          setDashboardData(prev => ({
            ...prev,
            stats: {
              ...prev?.stats,
              emergencyAlerts: alertCount
            }
          }));
          logDoctorActivity(
            "Alerts checked", 
            `Found ${alertCount} active emergency alerts`, 
            "emergency",
            alertCount > 0 ? "high" : "low"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching emergency alert count:", error);
      logDoctorActivity(
        "Alert check failed", 
        error.message || "Failed to check emergency alerts", 
        "error",
        "medium"
      );
    }
  };

  const initializeDashboard = async () => {
    logDoctorActivity("Dashboard access", "Initializing doctor dashboard", "system", "high");
    
    try {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }

      const response = await adminDashboardApi.accessDoctorDashboard();
      if (response.success) {
        if (isMounted.current) {
          setDashboardData(response.data);
          setApiUnavailable(false);
          logDoctorActivity(
            "Dashboard loaded", 
            "Successfully loaded dashboard data", 
            "system",
            "low"
          );
        }
      } else {
        if (isMounted.current) {
          setDashboardData(mockDashboardData);
          setApiUnavailable(true);
          logDoctorActivity(
            "Using mock data", 
            "API unavailable, using demo data", 
            "warning",
            "medium"
          );
        }
      }
      
      await fetchEmergencyAlertCount();
      await fetchAllPrescriptions();
      await fetchUpcomingAppointments();
    } catch (error) {
      console.error("❌ Error loading doctor dashboard:", error);
      if (isMounted.current) {
        setError("Failed to load doctor dashboard. Using demo data.");
        setDashboardData(mockDashboardData);
        setApiUnavailable(true);
        logDoctorActivity(
          "Dashboard error", 
          error.message || "Failed to initialize dashboard", 
          "error",
          "high"
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        logDoctorActivity(
          "Dashboard ready", 
          "Doctor dashboard initialization complete", 
          "system",
          "low"
        );
      }
    }
  };

  const handleEmergencyAlertsClick = () => {
    if (isMounted.current) {
      setCurrentView('emergency-alerts');
      logDoctorActivity(
        "Viewing emergency alerts", 
        "Navigated to emergency alerts page", 
        "emergency",
        "high"
      );
    }
  };

  const handleStartConsultation = (appointment) => {
    logDoctorActivity(
      "Starting consultation", 
      `Beginning consultation with ${appointment.name}`, 
      "consultation",
      "high"
    );
    
    navigate(`/admin/doctor/consultation/${appointment._id}`, {
      state: { patient: appointment }
    });
  };

  const handleRetryApiConnection = () => {
    if (isMounted.current) {
      setLoading(true);
      setError("");
      logDoctorActivity(
        "Retrying connection", 
        "User requested API retry", 
        "system",
        "medium"
      );
      initializeDashboard();
    }
  };

  // Export analytics data
  const exportAnalytics = () => {
    const data = {
      visitStats,
      visitChartData,
      patientDemographics,
      visitTypes,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logDoctorActivity(
      "Analytics exported", 
      "Patient analytics data downloaded", 
      "system",
      "medium"
    );
  };

  // Function to get activity icon based on category
  const getActivityIcon = (category) => {
    switch (category) {
      case 'prescription': return '💊';
      case 'appointment': return '📅';
      case 'patient': return '👤';
      case 'consultation': return '🩺';
      case 'emergency': return '🚨';
      case 'system': return '⚙️';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return '📝';
    }
  };

  // Function to get activity color based on category and priority
  const getActivityColor = (category, priority) => {
    if (priority === 'high') {
      switch (category) {
        case 'emergency': return '#F44336';
        case 'error': return '#F44336';
        case 'prescription': return '#FF5722';
        case 'appointment': return '#FF9800';
        default: return '#FF5722';
      }
    }
    
    switch (category) {
      case 'prescription': return '#4CAF50';
      case 'appointment': return '#2196F3';
      case 'patient': return '#9C27B0';
      case 'consultation': return '#00BCD4';
      case 'emergency': return '#F44336';
      case 'system': return '#607D8B';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'success': return '#4CAF50';
      default: return '#78909C';
    }
  };

  // Update chart data when time range changes
  useEffect(() => {
    if (prescriptions.length > 0) {
      processPatientVisitsData(prescriptions, visitTimeRange);
    }
  }, [visitTimeRange, prescriptions]);

  // Initialize activities on component mount
  useEffect(() => {
    isMounted.current = true;
    
    const initialActivities = [
      { 
        id: Date.now() - 1000, 
        action: "System initialized", 
        details: "Doctor dashboard starting up",
        category: "system",
        priority: "low",
        timestamp: new Date(Date.now() - 1000).toISOString(),
        doctorId: 'DOC001',
        doctorName: 'Dr. Gayath Dahanayake',
        isNew: false
      },
      { 
        id: Date.now() - 2000, 
        action: "Connecting to server", 
        details: "Establishing connection to backend services",
        category: "system",
        priority: "medium",
        timestamp: new Date(Date.now() - 2000).toISOString(),
        doctorId: 'DOC001',
        doctorName: 'Dr. Gayath Dahanayake',
        isNew: false
      }
    ];
    
    setDoctorActivities(initialActivities);
    initializeDashboard();
    
    const appointmentInterval = setInterval(() => {
      fetchUpcomingAppointments();
      logDoctorActivity(
        "Auto-refresh", 
        "Automatically refreshed appointments", 
        "system",
        "low"
      );
    }, 300000);
    
    const activityInterval = setInterval(() => {
      logDoctorActivity(
        "Dashboard active", 
        "Doctor dashboard is actively monitoring", 
        "system",
        "low"
      );
    }, 30000);
    
    const randomActivityInterval = setInterval(() => {
      const randomActivities = [
        { action: "Patient record accessed", details: "Viewing patient history", category: "patient" },
        { action: "Lab results reviewed", details: "Checking recent test results", category: "system" },
        { action: "Medication inventory checked", details: "Verifying stock levels", category: "system" },
        { action: "Schedule updated", details: "Modified availability", category: "appointment" },
        { action: "Reports generated", details: "Creating daily summary", category: "system" }
      ];
      
      const randomActivity = randomActivities[Math.floor(Math.random() * randomActivities.length)];
      logDoctorActivity(
        randomActivity.action,
        randomActivity.details,
        randomActivity.category,
        "low"
      );
    }, 45000);
    
    return () => {
      isMounted.current = false;
      clearInterval(appointmentInterval);
      clearInterval(activityInterval);
      clearInterval(randomActivityInterval);
    };
  }, []);

  if (loading) {
    return (
      <AdminLayout admin={admin} title="Doctor Dashboard">
        <div className="doctor-dashboard-loading-container">
          <div className="doctor-dashboard-loading-spinner"></div>
          <p>Loading doctor dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  if (currentView === 'emergency-alerts') {
    return (
      <AdminLayout admin={admin} title="Emergency Alerts">
        <div className="doctor-dashboard-back-button-container">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              logDoctorActivity(
                "Returning to dashboard", 
                "Navigated back from emergency alerts", 
                "system",
                "medium"
              );
            }}
            className="doctor-dashboard-back-button"
          >
            ← Back to Dashboard
          </button>
        </div>
        <EmergencyAlertsPage doctor={doctor} />
      </AdminLayout>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="advanced-chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    // Ensure we have data to display
    if (!visitChartData || visitChartData.length === 0) {
      return (
        <div className="chart-no-data">
          <p>No data available for the selected time range</p>
        </div>
      );
    }

    switch (selectedChartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visitChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666', fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="#2196F3" 
                strokeWidth={3} 
                dot={{ fill: '#2196F3', r: 6 }} 
                name="Current Period"
              />
              {comparisonData.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  data={comparisonData} 
                  stroke="#FF9800" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  name="Previous Period"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visitChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666', fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="visits" 
                stroke="#2196F3" 
                fill="#2196F3" 
                fillOpacity={0.6} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#666', fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="visits" 
                fill="#2196F3" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <AdminLayout admin={admin} title="Doctor Dashboard">
      <div className="doctor-dashboard-container">
        {/* Header Section */}
        <div className="doctor-dashboard-header-section">
          <div className="doctor-dashboard-welcome">
            <h1>Doctor Dashboard</h1>
            <p>Welcome back, Dr. Dahanayake</p>
          </div>
          <div className="doctor-dashboard-doctor-info">
            <div className="doctor-dashboard-doctor-avatar">
              <div className="doctor-dashboard-male-doctor-icon">👨‍⚕️</div>
            </div>
            <div className="doctor-dashboard-doctor-details">
              <h3>{doctor.name}</h3>
              <p>{doctor.specialization}</p>
            </div>
          </div>
        </div>

        {apiUnavailable && (
          <div className="doctor-dashboard-api-unavailable">
            <div className="doctor-dashboard-api-unavailable-content">
              <span>⚠️ Backend connection unavailable. Using demo data.</span>
              <button 
                onClick={() => {
                  handleRetryApiConnection();
                  logDoctorActivity(
                    "Connection retry", 
                    "User clicked retry connection button", 
                    "system",
                    "medium"
                  );
                }}
                className="doctor-dashboard-retry-button"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {error && !apiUnavailable && (
          <div className="doctor-dashboard-error">
            ⚠️ {error}
            <button 
              onClick={() => {
                handleRetryApiConnection();
                logDoctorActivity(
                  "Error retry", 
                  "User clicked retry button after error", 
                  "system",
                  "medium"
                );
              }}
              className="doctor-dashboard-retry-button"
            >
              Retry
            </button>
          </div>
        )}

        {dashboardData && (
          <>
            {/* Stats Section */}
            <div className="doctor-dashboard-stats-section">
              <div className="doctor-dashboard-stats-grid">
                <div 
                  className="doctor-dashboard-stat-card doctor-dashboard-patients-card"
                  onClick={() => logDoctorActivity(
                    "Viewed patients", 
                    "Checked today's patient count", 
                    "patient",
                    "low"
                  )}
                >
                  <div className="doctor-dashboard-stat-icon">👥</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{todayPatientsCount}</h3>
                    <p>Today's Patients</p>
                  </div>
                </div>
                <div 
                  className="doctor-dashboard-stat-card doctor-dashboard-reports-card"
                  onClick={() => logDoctorActivity(
                    "Viewed reports", 
                    "Checked pending reports", 
                    "report",
                    "low"
                  )}
                >
                  <div className="doctor-dashboard-stat-icon">📋</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{dashboardData.stats?.pendingReports || 0}</h3>
                    <p>Pending Reports</p>
                  </div>
                </div>
                <div 
                  className="doctor-dashboard-stat-card doctor-dashboard-consultations-card"
                  onClick={() => logDoctorActivity(
                    "Viewed consultations", 
                    "Checked consultation count", 
                    "consultation",
                    "low"
                  )}
                >
                  <div className="doctor-dashboard-stat-icon">💬</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{todayPrescriptionsCount}</h3>
                    <p>Consultations</p>
                  </div>
                </div>
                <div 
                  className={`doctor-dashboard-stat-card doctor-dashboard-alerts-card ${
                    dashboardData.stats?.emergencyAlerts > 0 ? 'doctor-dashboard-has-alerts' : ''
                  }`} 
                  onClick={() => {
                    handleEmergencyAlertsClick();
                  }}
                >
                  <div className="doctor-dashboard-stat-icon">🚨</div>
                  <div className="doctor-dashboard-stat-content">
                    <h3>{dashboardData.stats?.emergencyAlerts || 0}</h3>
                    <p>Emergency Alerts</p>
                  </div>
                  {dashboardData.stats?.emergencyAlerts > 0 && (
                    <div className="doctor-dashboard-alert-badge">{dashboardData.stats.emergencyAlerts}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Patient Visits Chart Section */}
            <div className="doctor-dashboard-visits-section">
              <div className="visits-chart-header">
                <div className="visits-chart-title">
                  <h2>Patient Visits Analytics</h2>
                </div>
                
                <div className="visits-chart-controls">
                  <div className="visits-time-range-selector">
                    {['day', 'week', 'month', 'year'].map(range => (
                      <button
                        key={range}
                        className={`visits-range-btn ${visitTimeRange === range ? 'active' : ''}`}
                        onClick={() => setVisitTimeRange(range)}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="chart-type-selector">
                    {[
                      { type: 'bar', icon: BarChart3 },
                      { type: 'line', icon: Activity },
                      { type: 'area', icon: PieChartIcon }
                    ].map(({ type, icon: Icon }) => (
                      <button
                        key={type}
                        className={`chart-type-btn ${selectedChartType === type ? 'active' : ''}`}
                        onClick={() => setSelectedChartType(type)}
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className="export-btn"
                    onClick={exportAnalytics}
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <div className="metric-header">
                    <Users className="metric-icon" size={20} />
                    <span className="metric-title">Total Visits</span>
                  </div>
                  <div className="metric-value">{visitStats.total}</div>
                  <div className="metric-change positive">
                    <ArrowUpRight size={16} />
                    +{visitStats.growthRate}%
                  </div>
                </div>
                
                <div className="metric-card success">
                  <div className="metric-header">
                    <TrendingUp className="metric-icon" size={20} />
                    <span className="metric-title">Growth Rate</span>
                  </div>
                  <div className="metric-value">{visitStats.growthRate}%</div>
                  <div className={`metric-change ${visitStats.growthRate >= 0 ? 'positive' : 'negative'}`}>
                    {visitStats.growthRate >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {visitStats.comparison}% vs last period
                  </div>
                </div>
                
                <div className="metric-card info">
                  <div className="metric-header">
                    <Heart className="metric-icon" size={20} />
                    <span className="metric-title">Satisfaction</span>
                  </div>
                  <div className="metric-value">{visitStats.satisfaction}%</div>
                  <div className="metric-change">
                    <Minus size={16} />
                    Based on follow-up rate
                  </div>
                </div>
                
                <div className="metric-card warning">
                  <div className="metric-header">
                    <Timer className="metric-icon" size={20} />
                    <span className="metric-title">Efficiency</span>
                  </div>
                  <div className="metric-value">{visitStats.efficiency}%</div>
                  <div className="metric-change">
                    <Minus size={16} />
                    Time utilization
                  </div>
                </div>
              </div>
              
              {/* Main Chart Section */}
              <div className="main-chart-section">
                <div className="chart-container" ref={chartContainerRef}>
                  {renderChart()}
                </div>
              </div>

              {/* Secondary Charts Grid */}
              <div className="secondary-charts-grid">
                {/* Patient Demographics */}
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h4>Patient Demographics</h4>
                    <Eye size={16} className="chart-action-icon" />
                  </div>
                  <div className="chart-content">
                    <div className="demographics-list">
                      {patientDemographics.map((item, index) => (
                        <div key={index} className="demographic-item">
                          <div className="demographic-color" style={{ backgroundColor: item.color }}></div>
                          <span className="demographic-label">{item.name}</span>
                          <span className="demographic-value">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visit Types */}
                <div className="chart-card">
                  <div className="chart-card-header">
                    <h4>Visit Types Distribution</h4>
                    <Eye size={16} className="chart-action-icon" />
                  </div>
                  <div className="chart-content">
                    <div className="visit-types-list">
                      {visitTypes.map((item, index) => (
                        <div key={index} className="visit-type-item">
                          <div className="visit-type-color" style={{ backgroundColor: item.color }}></div>
                          <span className="visit-type-label">{item.type}</span>
                          <span className="visit-type-value">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="doctor-dashboard-content-grid">
              {/* Upcoming Appointments Section */}
              <div className="doctor-dashboard-appointments-section">
                <div className="doctor-dashboard-section-header">
                  <h2>Today's Appointments</h2>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => {
                      navigate("/admin/doctor/appointments");
                      logDoctorActivity(
                        "Viewed all appointments", 
                        "Navigated to appointments page", 
                        "appointment",
                        "medium"
                      );
                    }}
                  >
                    View All
                  </button>
                </div>
                <div className="doctor-dashboard-appointments-list">
                  {upcomingAppointments.length === 0 ? (
                    <div className="doctor-dashboard-no-appointments">
                      <div className="no-appointments-icon">🎉</div>
                      <h3>No more appointments today</h3>
                      <p>You're all caught up! Enjoy your free time.</p>
                    </div>
                  ) : (
                    upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className="doctor-dashboard-appointment-card">
                        <div className="doctor-dashboard-appointment-time">
                          🕐 {formatTime(appointment.appointmentTime)}
                        </div>
                        <div className="doctor-dashboard-appointment-details">
                          <h4>{appointment.name}</h4>
                          <p>{appointment.doctorSpecialty || "General Consultation"}</p>
                          <div className="doctor-dashboard-patient-contact">
                            <span>📱 {appointment.phone}</span>
                            {appointment.symptoms && (
                              <span className="doctor-dashboard-symptoms">💭 {appointment.symptoms.substring(0, 50)}...</span>
                            )}
                          </div>
                        </div>
                        <div className="doctor-dashboard-appointment-actions">
                          <button 
                            className="doctor-dashboard-appointment-action"
                            onClick={() => handleStartConsultation(appointment)}
                          >
                            Start
                          </button>
                          <div className={`doctor-dashboard-urgency-indicator ${appointment.urgency || 'normal'}`}>
                            {appointment.urgency || 'Normal'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Doctor Schedule Section */}
              <div className="doctor-dashboard-schedule-section">
                <div className="doctor-dashboard-section-header">
                  <h2>Weekly Schedule</h2>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => {
                      navigate("/admin/doctor/schedule-consultation");
                      logDoctorActivity(
                        "Schedule consultation", 
                        "Navigated to consultation scheduling", 
                        "consultation",
                        "medium"
                      );
                    }}
                  >
                    Manage
                  </button>
                </div>
                <div className="doctor-dashboard-schedule-list">
                  {dashboardData.doctorSchedule?.map((schedule) => (
                    <div 
                      key={schedule.id} 
                      className={`doctor-dashboard-schedule-card ${!schedule.available ? 'doctor-dashboard-unavailable' : ''}`}
                      onClick={() => logDoctorActivity(
                        "Viewed schedule", 
                        `Checked ${schedule.day} schedule`, 
                        "system",
                        "low"
                      )}
                    >
                      <div className="doctor-dashboard-schedule-day">{schedule.day}</div>
                      <div className="doctor-dashboard-schedule-time">{schedule.time}</div>
                      <div className={`doctor-dashboard-schedule-status ${schedule.available ? 'doctor-dashboard-available' : 'doctor-dashboard-unavailable-status'}`}>
                        {schedule.available ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="doctor-dashboard-features-section">
              <h2 className="doctor-dashboard-section-title">Medical Features</h2>
              <div className="doctor-dashboard-features-grid">
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/schedule-consultation");
                    logDoctorActivity(
                      "Schedule consultation", 
                      "Navigated to consultation scheduling", 
                      "consultation",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">📅</div>
                  <h3>Schedule Consultation</h3>
                  <p>Set your availability</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/patient-records");
                    logDoctorActivity(
                      "Patient records", 
                      "Accessed patient records", 
                      "patient",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">📁</div>
                  <h3>Patient Records</h3>
                  <p>Access medical history</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    alert("Lab Reports clicked");
                    logDoctorActivity(
                      "Lab reports", 
                      "Viewed lab reports", 
                      "report",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">🔬</div>
                  <h3>Lab Reports</h3>
                  <p>View test results</p>
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/prescriptions");
                    logDoctorActivity(
                      "Prescriptions", 
                      "Accessed prescription management", 
                      "prescription",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">💊</div>
                  <h3>Prescriptions</h3>
                  <p>Manage medications</p>
                </button>
                <button
                  className={`doctor-dashboard-feature-card doctor-dashboard-emergency-alert-feature ${
                    dashboardData.stats?.emergencyAlerts > 0 ? 'doctor-dashboard-has-alerts' : ''
                  }`}
                  onClick={() => {
                    handleEmergencyAlertsClick();
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">🚨</div>
                  <h3>Emergency Alerts</h3>
                  <p>Critical patient situations</p>
                  {dashboardData.stats?.emergencyAlerts > 0 && (
                    <div className="doctor-dashboard-alert-count">{dashboardData.stats.emergencyAlerts} urgent</div>
                  )}
                </button>
                <button
                  className="doctor-dashboard-feature-card"
                  onClick={() => {
                    navigate("/admin/doctor/inventory");
                    logDoctorActivity(
                      "Inventory", 
                      "Accessed medical inventory", 
                      "system",
                      "medium"
                    );
                  }}
                >
                  <div className="doctor-dashboard-feature-icon">📦</div>
                  <h3>Item Requests</h3>
                  <p>Medical supplies</p>
                </button>
              </div>
            </div>

            {/* Doctor Activities Section */}
            <div className="doctor-dashboard-activity-section">
              <div className="doctor-dashboard-section-header">
                <h2>Live Activity Feed</h2>
                <div className="activity-controls">
                  <div className="live-indicator">
                    <span className="live-dot"></span>
                    <span className="live-text">LIVE</span>
                  </div>
                  <button 
                    className="doctor-dashboard-view-all-button"
                    onClick={() => {
                      setDoctorActivities([]);
                      logDoctorActivity(
                        "Cleared activities", 
                        "Activity feed cleared by user", 
                        "system",
                        "medium"
                      );
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="doctor-dashboard-activity-list">
                {doctorActivities.length === 0 ? (
                  <div className="doctor-dashboard-no-activities">
                    <div className="no-activities-icon">📋</div>
                    <h3>No activities yet</h3>
                    <p>Your activities will appear here as you use the system.</p>
                  </div>
                ) : (
                  doctorActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`doctor-dashboard-activity-item ${activity.isNew ? 'new-activity' : ''}`}
                    >
                      <div className="doctor-dashboard-activity-icon">
                        <div 
                          className="doctor-dashboard-activity-dot" 
                          style={{ backgroundColor: getActivityColor(activity.category, activity.priority) }}
                        >
                          {getActivityIcon(activity.category)}
                        </div>
                      </div>
                      <div className="doctor-dashboard-activity-content">
                        <p className="activity-action">{activity.action}</p>
                        {activity.details && (
                          <p className="activity-details">{activity.details}</p>
                        )}
                        <span className="doctor-dashboard-activity-time">
                          {formatActivityTime(activity.timestamp)}
                        </span>
                      </div>
                      <div className="activity-category">
                        <span 
                          className="category-badge" 
                          style={{ backgroundColor: getActivityColor(activity.category, activity.priority) }}
                        >
                          {activity.category}
                        </span>
                      </div>
                      {activity.isNew && (
                        <div className="new-activity-badge">NEW</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default DoctorDashboard;