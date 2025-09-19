import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './PatientRecords.css';
import {
  Search,
  Calendar,
  User,
  UserCheck,
  FileText,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Heart,
  Pill,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Clock,
  AlertTriangle,
  Info,
  Hash,
  UserRound,
  Clipboard,
  Flag,
  ArrowLeft
} from 'lucide-react';

const PatientRecords = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const navigate = useNavigate();

  // Function to navigate back to Doctor Dashboard
  const navigateToDashboard = () => {
    navigate('/admin/doctor-dashboard'); 
  };

  // Fetch prescriptions from API
  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:7000/api/doctor/prescriptions', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setPrescriptions(data.data || []);
      setFilteredPrescriptions(data.data || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    let filtered = prescriptions.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        p.patientName.toLowerCase().includes(term) ||
        p.patientId.toLowerCase().includes(term) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(term));

      const matchesDate = !dateFilter || new Date(p.date).toDateString() === new Date(dateFilter).toDateString();

      const matchesDoctor = !doctorFilter || p.doctorName.toLowerCase().includes(doctorFilter.toLowerCase());

      const matchesDiagnosis = !diagnosisFilter || 
        (p.diagnosis && p.diagnosis.toLowerCase().includes(diagnosisFilter.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && new Date(p.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
        (statusFilter === 'old' && new Date(p.date) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      return matchesSearch && matchesDate && matchesDoctor && matchesDiagnosis && matchesStatus;
    });

    // Apply tab filtering
    if (activeTab !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today
      
      filtered = filtered.filter(p => {
        const prescriptionDate = new Date(p.date);
        prescriptionDate.setHours(0, 0, 0, 0); // Set to beginning of the day
        
        if (activeTab === 'today') {
          return prescriptionDate.getTime() === today.getTime();
        }
        if (activeTab === 'week') {
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return prescriptionDate >= oneWeekAgo && prescriptionDate <= today;
        }
        if (activeTab === 'month') {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          return prescriptionDate >= oneMonthAgo && prescriptionDate <= today;
        }
        return true;
      });
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'patientName':
          aVal = a.patientName.toLowerCase();
          bVal = b.patientName.toLowerCase();
          break;
        case 'doctorName':
          aVal = a.doctorName.toLowerCase();
          bVal = b.doctorName.toLowerCase();
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

    setFilteredPrescriptions(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateFilter, doctorFilter, diagnosisFilter, statusFilter, prescriptions, sortBy, sortOrder, activeTab]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPrescriptions.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredPrescriptions.length / recordsPerPage);

  const uniqueDoctors = [...new Set(prescriptions.map((p) => p.doctorName))];
  const uniqueDiagnoses = [...new Set(prescriptions.map((p) => p.diagnosis).filter(Boolean))];

  const handleViewPatient = (prescription) => {
    setSelectedPatient(prescription);
    setShowModal(true);
  };

  const generatePDF = (prescription) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>HealX Prescription</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+Pro:wght@400;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Source Sans Pro', sans-serif;
            background: #fff;
            color: #333;
            line-height: 1.5;
            font-size: 13px;
          }
          
          .prescription-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #fff;
            position: relative;
            border: 1px solid #e0e0e0;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .hospital-logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #2980b9;
            font-size: 18px;
            font-family: 'Playfair Display', serif;
          }
          
          .hospital-info {
            text-align: center;
            flex: 1;
          }
          
          .hospital-name {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          
          .hospital-tagline {
            font-size: 14px;
            font-weight: 400;
            opacity: 0.9;
          }
          
          .prescription-title {
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: #1a5276;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
          }
          
          .prescription-title:after {
            content: "";
            display: block;
            width: 80px;
            height: 3px;
            background: #e74c3c;
            margin: 8px auto;
          }
          
          .rx-symbol {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 60px;
            font-weight: bold;
            color: rgba(231, 76, 60, 0.1);
            transform: rotate(-15deg);
            font-family: 'Playfair Display', serif;
          }
          
          .content {
            padding: 0 25px;
          }
          
          .section {
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #1a5276;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
            display: flex;
            align-items: center;
          }
          
          .section-title:before {
            content: "";
            display: inline-block;
            width: 5px;
            height: 16px;
            background: #e74c3c;
            margin-right: 8px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          
          .info-label {
            font-weight: 600;
            width: 120px;
            color: #555;
          }
          
          .info-value {
            flex: 1;
          }
          
          .diagnosis-box {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 12px 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-style: italic;
          }
          
          .medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
          }
          
          .medicines-table th {
            background: #f1f2f6;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: #1a5276;
            border: 1px solid #e0e0e0;
          }
          
          .medicines-table td {
            padding: 10px;
            border: 1px solid #e0e0e0;
          }
          
          .notes-box {
            background: #fef9e7;
            border-left: 4px solid #f39c12;
            padding: 12px 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-style: italic;
          }
          
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding: 0 25px 25px;
          }
          
          .signature-box {
            text-align: center;
            width: 45%;
          }
          
          .signature-line {
            width: 100%;
            border-bottom: 1px solid #333;
            margin: 30px 0 5px;
            height: 40px;
          }
          
          .signature-label {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
            color: #555;
          }
          
          .doctor-name {
            font-size: 16px;
            font-weight: 700;
            color: #1a5276;
          }
          
          .doctor-title {
            font-size: 14px;
            color: #555;
          }
          
          .footer {
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            padding: 15px 25px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #777;
          }
          
          .warning {
            background: #fadbd8;
            border: 1px dashed #e74c3c;
            padding: 10px;
            margin: 15px 25px;
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            color: #7d3c21;
          }
          
          .prescription-id {
            position: absolute;
            top: 15px;
            right: 25px;
            font-size: 11px;
            color: white;
            background: rgba(0,0,0,0.2);
            padding: 3px 8px;
            border-radius: 10px;
          }
        </style>
      </head>
      <body>
        <div class="prescription-container">
          <div class="prescription-id">Rx ID: ${prescription._id || 'PRE' + Date.now()}</div>
          <div class="rx-symbol">Rx</div>
          
          <div class="header">
            <div class="hospital-logo">HX</div>
            <div class="hospital-info">
              <div class="hospital-name">HEALX HOSPITAL</div>
              <div class="hospital-tagline">Advanced Healthcare for Everyone</div>
            </div>
          </div>
          
          <div class="prescription-title">Medical Prescription</div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">Name:</div>
                  <div class="info-value">${prescription.patientName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Patient ID:</div>
                  <div class="info-value">${prescription.patientId}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Age/Gender:</div>
                  <div class="info-value">${prescription.patientAge || 'N/A'} / ${prescription.patientGender || 'N/A'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Contact:</div>
                  <div class="info-value">${prescription.patientPhone || prescription.patientEmail || 'N/A'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Blood Group:</div>
                  <div class="info-value">${prescription.bloodGroup || 'N/A'}</div>
                </div>
                ${prescription.patientAllergies && prescription.patientAllergies.length > 0 ? `
                  <div class="info-row">
                    <div class="info-label">Allergies:</div>
                    <div class="info-value">${prescription.patientAllergies.join(', ')}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Doctor Information</div>
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">Name:</div>
                  <div class="info-value">Dr. ${prescription.doctorName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Department:</div>
                  <div class="info-value">${prescription.doctorSpecialization || 'General Medicine'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Registration:</div>
                  <div class="info-value">REG${Math.floor(Math.random() * 10000) + 10000}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Date:</div>
                  <div class="info-value">${new Date(prescription.date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Diagnosis</div>
              <div class="diagnosis-box">
                ${prescription.diagnosis}
              </div>
            </div>
            
            ${prescription.medicines && prescription.medicines.length > 0 ? `
              <div class="section">
                <div class="section-title">Prescribed Medicines</div>
                <table class="medicines-table">
                  <thead>
                    <tr>
                      <th width="5%">S.No.</th>
                      <th width="25%">Medicine Name</th>
                      <th width="15%">Dosage</th>
                      <th width="15%">Frequency</th>
                      <th width="15%">Duration</th>
                      <th width="25%">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${prescription.medicines.map((med, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${med.name}</td>
                        <td>${med.dosage}</td>
                        <td>${med.frequency}</td>
                        <td>${med.duration}</td>
                        <td>${med.notes || 'As directed'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
            
            ${prescription.notes ? `
              <div class="section">
                <div class="section-title">Additional Instructions</div>
                <div class="notes-box">
                  ${prescription.notes}
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="warning">
            This prescription is valid only with the signature of the attending physician and hospital seal. Please follow the dosage instructions carefully.
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">Doctor's Signature</div>
              <div class="signature-line"></div>
              <div class="doctor-name">Dr. ${prescription.doctorName}</div>
              <div class="doctor-title">${prescription.doctorSpecialization || 'General Medicine'}</div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Hospital Seal</div>
              <div class="signature-line"></div>
              <div class="doctor-name">HealX Hospital</div>
              <div class="doctor-title">Authorized Signatory</div>
            </div>
          </div>
          
          <div class="footer">
            <div>123 Medical Center Drive, Health City | Phone: (555) 123-4567</div>
            <div>Generated on ${formattedDate} at ${formattedTime} | HealX Hospital © ${currentDate.getFullYear()}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setDoctorFilter('');
    setDiagnosisFilter('');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setActiveTab('all');
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="pr-loading-container">
        <div className="pr-loading-animation">
          <RefreshCw className="pr-spinning" size={40} />
          <div className="pr-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <p>Loading patient records...</p>
      </div>
    );
  }

  return (
    <div className="pr-container">
      {/* Header */}
      <div className="pr-header-section">
        <div>
          <h1 className="pr-page-title">
            <FileText className="pr-title-icon" size={32} /> Patient Records
          </h1>
          <p className="pr-page-subtitle">Manage and view all patient prescriptions and medical records</p>
        </div>
        <div className="pr-header-actions">
          <button className="pr-refresh-btn" onClick={fetchPrescriptions}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="pr-dashboard-btn" onClick={navigateToDashboard}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="pr-stats-section">
        <div className="pr-stat-card pr-stat-card--blue">
          <div className="pr-stat-card-content">
            <div className="pr-stat-info">
              <div className="pr-stat-title">Total Prescriptions</div>
              <div className="pr-stat-value">{prescriptions.length}</div>
              <div className="pr-stat-subtitle">All records in system</div>
            </div>
            <div className="pr-stat-icon-wrapper">
              <FileText size={24} />
            </div>
          </div>
        </div>
        <div className="pr-stat-card pr-stat-card--green">
          <div className="pr-stat-card-content">
            <div className="pr-stat-info">
              <div className="pr-stat-title">Unique Patients</div>
              <div className="pr-stat-value">{new Set(prescriptions.map((p) => p.patientId)).size}</div>
              <div className="pr-stat-subtitle">Individual patients</div>
            </div>
            <div className="pr-stat-icon-wrapper">
              <User size={24} />
            </div>
          </div>
        </div>
        <div className="pr-stat-card pr-stat-card--purple">
          <div className="pr-stat-card-content">
            <div className="pr-stat-info">
              <div className="pr-stat-title">Active Doctors</div>
              <div className="pr-stat-value">{uniqueDoctors.length}</div>
              <div className="pr-stat-subtitle">Medical professionals</div>
            </div>
            <div className="pr-stat-icon-wrapper">
              <Stethoscope size={24} />
            </div>
          </div>
        </div>
        <div className="pr-stat-card pr-stat-card--yellow">
          <div className="pr-stat-card-content">
            <div className="pr-stat-info">
              <div className="pr-stat-title">Filtered Results</div>
              <div className="pr-stat-value">{filteredPrescriptions.length}</div>
              <div className="pr-stat-subtitle">Current view</div>
            </div>
            <div className="pr-stat-icon-wrapper">
              <Filter size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="pr-search-filter-section">
        <div className="pr-search-container">
          <Search className="pr-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by patient name, ID, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-search-input"
          />
        </div>
        
        <div className="pr-filters-container">
          <div className="pr-filter-group">
            <Calendar className="pr-filter-icon" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pr-filter-input"
            />
          </div>
          
          <div className="pr-filter-group">
            <UserCheck className="pr-filter-icon" size={18} />
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="pr-filter-select"
            >
              <option value="">All Doctors</option>
              {uniqueDoctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pr-filter-group">
            <Activity className="pr-filter-icon" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pr-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Recent (30 days)</option>
              <option value="old">Older (30+ days)</option>
            </select>
          </div>
          
          <button 
            className="pr-advanced-filters-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? <X size={18} /> : <Filter size={18} />}
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
          
          <button className="pr-clear-filters-btn" onClick={clearFilters}>
            Clear All
          </button>
        </div>
        
        {showAdvancedFilters && (
          <div className="pr-advanced-filters">
            <div className="pr-filter-group">
              <Stethoscope className="pr-filter-icon" size={18} />
              <select
                value={diagnosisFilter}
                onChange={(e) => setDiagnosisFilter(e.target.value)}
                className="pr-filter-select"
              >
                <option value="">All Diagnoses</option>
                {uniqueDiagnoses.map((diagnosis) => (
                  <option key={diagnosis} value={diagnosis}>
                    {diagnosis}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="pr-tabs-section">
        <div className="pr-tabs">
          {[
            { id: 'all', label: 'All Records', icon: <FileText size={16} /> },
            { id: 'today', label: 'Today', icon: <Calendar size={16} /> },
            { id: 'week', label: 'This Week', icon: <Clock size={16} /> },
            { id: 'month', label: 'This Month', icon: <Calendar size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              className={`pr-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="pr-table-section">
        <div className="pr-table-header">
          <h2>Patient Prescription Records</h2>
          <div className="pr-table-info">
            <span>Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredPrescriptions.length)} of {filteredPrescriptions.length}</span>
            <div className="pr-sort-dropdown">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="pr-sort-select"
              >
                <option value="date-desc">Latest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="patientName-asc">Patient A-Z</option>
                <option value="patientName-desc">Patient Z-A</option>
                <option value="doctorName-asc">Doctor A-Z</option>
                <option value="doctorName-desc">Doctor Z-A</option>
              </select>
              <ChevronDown className="pr-sort-icon" size={16} />
            </div>
          </div>
        </div>

        <div className="pr-table-wrapper">
          {currentRecords.length === 0 ? (
            <div className="pr-empty-state">
              <div className="pr-empty-icon">
                <FileText size={64} />
              </div>
              <h3>No Records Found</h3>
              <p>No prescriptions match your current search criteria.</p>
              <button className="pr-reset-btn" onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="pr-table">
              <thead className="pr-table-head">
                <tr>
                  <th className="pr-th pr-th-expand"></th>
                  <th className="pr-th">Date</th>
                  <th className="pr-th">Patient</th>
                  <th className="pr-th">Diagnosis</th>
                  <th className="pr-th">Doctor</th>
                  <th className="pr-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((prescription) => {
                  const isExpanded = expandedRows[prescription._id];
                  
                  return (
                    <React.Fragment key={prescription._id}>
                      <tr 
                        className={`pr-table-row ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleRowExpansion(prescription._id)}
                      >
                        <td className="pr-td pr-td-expand">
                          <button className="pr-expand-btn">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="pr-td">
                          <div className="pr-td-content">
                            <Calendar className="pr-td-icon" size={16} />
                            <div>
                              <div>{new Date(prescription.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="pr-td">
                          <div className="pr-patient-info">
                            <div className="pr-patient-name">
                              <User className="pr-td-icon" size={16} />
                              {prescription.patientName}
                            </div>
                            <div className="pr-patient-id">{prescription.patientId}</div>
                          </div>
                        </td>
                        <td className="pr-td pr-td-diagnosis">
                          <div className="pr-diagnosis-cell">
                            {prescription.diagnosis || 'N/A'}
                            {prescription.medicines && prescription.medicines.length > 0 && (
                              <div className="pr-medicine-count">
                                <Pill size={14} />
                                {prescription.medicines.length} medicine(s)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="pr-td">
                          <div className="pr-doctor-info">
                            <div className="pr-doctor-name">
                              <UserCheck className="pr-td-icon" size={16} />
                              {prescription.doctorName}
                            </div>
                            <div className="pr-doctor-specialization">
                              {prescription.doctorSpecialization || 'General'}
                            </div>
                          </div>
                        </td>
                        <td className="pr-td pr-td-actions">
                          <button
                            className="pr-action-btn pr-view-btn"
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPatient(prescription);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="pr-action-btn pr-pdf-btn"
                            title="Generate PDF"
                            onClick={(e) => {
                              e.stopPropagation();
                              generatePDF(prescription);
                            }}
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr className="pr-expanded-row">
                          <td colSpan="6">
                            <div className="pr-expanded-content">
                              <div className="pr-expanded-section">
                                <h4>Patient Details</h4>
                                <div className="pr-expanded-grid">
                                  <div>
                                    <span className="pr-expanded-label">Email:</span>
                                    <span>{prescription.patientEmail || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="pr-expanded-label">Phone:</span>
                                    <span>{prescription.patientPhone || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="pr-expanded-label">Blood Group:</span>
                                    <span>{prescription.bloodGroup || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="pr-expanded-label">Gender:</span>
                                    <span>{prescription.patientGender || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                {prescription.patientAllergies && prescription.patientAllergies.length > 0 && (
                                  <div className="pr-allergies-section">
                                    <span className="pr-expanded-label">Allergies:</span>
                                    <div className="pr-allergies-container">
                                      {prescription.patientAllergies.map((allergy, idx) => (
                                        <span key={idx} className="pr-allergy-tag">
                                          <AlertTriangle size={12} />
                                          {allergy}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="pr-expanded-section">
                                <h4>Medicines</h4>
                                {prescription.medicines && prescription.medicines.length > 0 ? (
                                  <div className="pr-medicines-list">
                                    {prescription.medicines.map((med, idx) => (
                                      <div key={idx} className="pr-medicine-item">
                                        <div className="pr-medicine-name">
                                          <Pill size={16} />
                                          {med.name}
                                        </div>
                                        <div className="pr-medicine-details">
                                          {med.dosage} • {med.frequency} • {med.duration}
                                        </div>
                                        {med.notes && (
                                          <div className="pr-medicine-notes">
                                            <Info size={14} />
                                            {med.notes}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="pr-no-medicines">No medicines prescribed</p>
                                )}
                              </div>
                              
                              {prescription.notes && (
                                <div className="pr-expanded-section">
                                  <h4>Additional Notes</h4>
                                  <div className="pr-notes-box">
                                    {prescription.notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pr-pagination">
            <div className="pr-pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            <div className="pr-pagination-controls">
              <button
                className="pr-pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                className="pr-pagination-btn"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      className={`pr-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              <button
                className="pr-pagination-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                className="pr-pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPatient && (
        <div className="pr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pr-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal-header">
              <h2>
                <UserRound className="pr-modal-icon" size={28} /> Patient Details
              </h2>
              <button
                className="pr-modal-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close Patient Details"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="pr-modal-content">
              {/* Patient Info Section */}
              <div className="pr-modal-section">
                <div className="pr-section-header">
                  <UserRound className="pr-section-icon" size={20} />
                  <h3 className="pr-section-title">Patient Information</h3>
                </div>
                
                <div className="pr-info-grid">
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Full Name</div>
                      <div className="pr-info-value">{selectedPatient.patientName}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Hash size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Patient ID</div>
                      <div className="pr-info-value">{selectedPatient.patientId}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Email</div>
                      <div className="pr-info-value">{selectedPatient.patientEmail || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Phone</div>
                      <div className="pr-info-value">{selectedPatient.patientPhone || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Flag size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Gender</div>
                      <div className="pr-info-value">{selectedPatient.patientGender || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Heart size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Blood Group</div>
                      <div className="pr-info-value">{selectedPatient.bloodGroup || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                {selectedPatient.patientAllergies && selectedPatient.patientAllergies.length > 0 && (
                  <div className="pr-allergies-section">
                    <div className="pr-allergies-header">
                      <AlertTriangle size={18} />
                      <strong>Allergies</strong>
                    </div>
                    <div className="pr-allergies-container">
                      {selectedPatient.patientAllergies.map((allergy, idx) => (
                        <span key={idx} className="pr-allergy-tag">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Doctor Info Section */}
              <div className="pr-modal-section">
                <div className="pr-section-header">
                  <UserCheck className="pr-section-icon" size={20} />
                  <h3 className="pr-section-title">Doctor Information</h3>
                </div>
                
                <div className="pr-info-grid">
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Name</div>
                      <div className="pr-info-value">{selectedPatient.doctorName}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Specialization</div>
                      <div className="pr-info-value">{selectedPatient.doctorSpecialization || 'General'}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Consultation Date</div>
                      <div className="pr-info-value">
                        {new Date(selectedPatient.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription Details Section */}
              <div className="pr-modal-section">
                <div className="pr-section-header">
                  <Clipboard className="pr-section-icon" size={20} />
                  <h3 className="pr-section-title">Prescription Details</h3>
                </div>
                
                <div className="pr-diagnosis-section">
                  <div className="pr-diagnosis-header">
                    <Clipboard size={18} />
                    <strong>Diagnosis</strong>
                  </div>
                  <div className="pr-diagnosis-box">
                    {selectedPatient.diagnosis}
                  </div>
                </div>
                
                <div className="pr-medicines-section">
                  <div className="pr-medicines-header">
                    <Pill size={18} />
                    <strong>Prescribed Medicines</strong>
                  </div>
                  
                  {selectedPatient.medicines && selectedPatient.medicines.length > 0 ? (
                    <div className="pr-medicine-table-wrapper">
                      <table className="pr-medicine-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPatient.medicines.map((med, idx) => (
                            <tr key={idx}>
                              <td>{med.name}</td>
                              <td>{med.dosage}</td>
                              <td>{med.frequency}</td>
                              <td>{med.duration}</td>
                              <td>{med.notes || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="pr-no-medicines">
                      <Pill size={24} />
                      <p>No medicines prescribed</p>
                    </div>
                  )}
                </div>
                
                {selectedPatient.notes && (
                  <div className="pr-notes-section">
                    <div className="pr-notes-header">
                      <Info size={18} />
                      <strong>Additional Notes</strong>
                    </div>
                    <div className="pr-notes-box">
                      {selectedPatient.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pr-modal-footer">
              <button
                className="pr-modal-close"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                className="pr-modal-pdf-btn"
                onClick={() => generatePDF(selectedPatient)}
              >
                <Download size={16} /> Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;