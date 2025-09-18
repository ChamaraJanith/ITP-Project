import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

// PatientRecords component fetches data from your prescription API
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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: 20,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
      background: 'white',
      padding: '25px 30px',
      borderRadius: 15,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)',
      borderLeft: '5px solid #4f46e5',
    },
    pageTitle: {
      display: 'flex',
      alignItems: 'center',
      fontSize: 28,
      color: '#1f2937',
      marginBottom: 8,
      fontWeight: 700,
    },
    titleIcon: {
      marginRight: 12,
      color: '#4f46e5',
      width: 32,
      height: 32,
    },
    pageSubtitle: {
      color: '#6b7280',
      fontSize: 16,
      margin: 0,
    },
    refreshBtn: {
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: 600,
      fontSize: 14,
      boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      color: '#6b7280',
    },
    searchFilterSection: {
      background: 'white',
      padding: '25px 30px',
      borderRadius: 15,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)',
      marginBottom: 25,
    },
    searchContainer: {
      position: 'relative',
      marginBottom: 20,
    },
    searchInput: {
      width: '100%',
      padding: '15px 50px',
      border: '2px solid #e5e7eb',
      borderRadius: 10,
      fontSize: 16,
      transition: 'all 0.3s ease',
      background: '#f9fafb',
    },
    filtersContainer: {
      display: 'flex',
      gap: 15,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    filterGroup: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      minWidth: 200,
    },
    filterInput: {
      padding: '12px 45px',
      border: '2px solid #e5e7eb',
      borderRadius: 8,
      fontSize: 14,
      transition: 'all 0.3s ease',
      background: '#f9fafb',
      width: '100%',
    },
    filterSelect: {
      padding: '12px 45px',
      border: '2px solid #e5e7eb',
      borderRadius: 8,
      fontSize: 14,
      transition: 'all 0.3s ease',
      background: '#f9fafb',
      width: '100%',
    },
    clearFiltersBtn: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: 8,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: 600,
      fontSize: 14,
      whiteSpace: 'nowrap',
    },
    statsSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 20,
      marginBottom: 25,
    },
    statCard: {
      background: 'white',
      padding: 25,
      borderRadius: 15,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.3s ease',
    },
    statIcon: {
      width: 50,
      height: 50,
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 20,
      color: 'white',
    },
    tableSection: {
      background: 'white',
      borderRadius: 15,
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
    },
    tableHeader: {
      padding: '25px 30px 20px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f9fafb',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'white',
    },
    tableHead: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    },
    th: {
      padding: '18px 20px',
      textAlign: 'left',
      fontWeight: 600,
      color: '#374151',
      fontSize: 14,
      borderBottom: '2px solid #e5e7eb',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '18px 20px',
      verticalAlign: 'middle',
      fontSize: 14,
      borderBottom: '1px solid #f3f4f6',
    },
    actionBtn: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    viewBtn: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
    },
    pdfBtn: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    },
    modalContainer: {
      background: 'white',
      borderRadius: 20,
      width: '100%',
      maxWidth: 900,
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    },
    modalHeader: {
      padding: '25px 30px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    },
    modalContent: {
      padding: 30,
      maxHeight: 'calc(90vh - 160px)',
      overflowY: 'auto',
    },
    modalFooter: {
      padding: '20px 30px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 15,
      background: '#f9fafb',
    },
    patientId: {
      background: 'linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%)',
      padding: '6px 12px',
      borderRadius: 20,
      fontWeight: 600,
      color: '#5b21b6',
      fontSize: 12,
      display: 'inline-block',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 15,
      marginBottom: 20,
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 15px',
      background: '#f9fafb',
      borderRadius: 10,
      borderLeft: '4px solid #4f46e5',
    },
    infoLabel: {
      fontWeight: 600,
      color: '#374151',
      marginRight: 10,
      minWidth: 80,
    },
    infoValue: {
      color: '#1f2937',
      flex: 1,
    },
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

      return matchesSearch && matchesDate && matchesDoctor;
    });

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
  }, [searchTerm, dateFilter, doctorFilter, prescriptions, sortBy, sortOrder]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPrescriptions.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredPrescriptions.length / recordsPerPage);

  const uniqueDoctors = [...new Set(prescriptions.map((p) => p.doctorName))];

  const handleViewPatient = (prescription) => {
    setSelectedPatient(prescription);
    setShowModal(true);
  };

  const generatePDF = (prescription) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html><head><title>Prescription</title></head><body>
      <h1>Prescription for ${prescription.patientName}</h1>
      <p>Date: ${new Date(prescription.date).toLocaleDateString()}</p>
      <p>Diagnosis: ${prescription.diagnosis}</p>
      <p>Doctor: ${prescription.doctorName}</p>
      <!-- Add more details here -->
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setDoctorFilter('');
    setSortBy('date');
    setSortOrder('desc');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw style={{ width: 40, height: 40, animation: 'spin 1s linear infinite', color: '#4f46e5', marginBottom: 15 }} />
        <p>Loading patient records...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div>
          <h1 style={styles.pageTitle}>
            <FileText style={styles.titleIcon} /> Patient Records
          </h1>
          <p style={styles.pageSubtitle}>Manage and view all patient prescriptions and medical records</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchPrescriptions}>
          <RefreshCw style={{ width: 18, height: 18, marginRight: 8 }} /> Refresh
        </button>
      </div>

      <div style={styles.searchFilterSection}>
        <div style={styles.searchContainer}>
          <Search style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: 20, height: 20 }} />
          <input
            type="text"
            placeholder="Search by patient name, ID, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filtersContainer}>
          <div style={styles.filterGroup}>
            <Calendar style={{ position: 'absolute', left: 12, color: '#9ca3af', width: 18, height: 18, zIndex: 1 }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={styles.filterInput}
              placeholder="Filter by date"
            />
          </div>
          <div style={styles.filterGroup}>
            <UserCheck style={{ position: 'absolute', left: 12, color: '#9ca3af', width: 18, height: 18, zIndex: 1 }} />
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Doctors</option>
              {uniqueDoctors.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <Filter style={{ position: 'absolute', left: 12, color: '#9ca3af', width: 18, height: 18, zIndex: 1 }} />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              style={styles.filterSelect}
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="patientName-asc">Patient A-Z</option>
              <option value="patientName-desc">Patient Z-A</option>
              <option value="doctorName-asc">Doctor A-Z</option>
              <option value="doctorName-desc">Doctor Z-A</option>
            </select>
          </div>
          <button style={styles.clearFiltersBtn} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div style={styles.statsSection}>
        <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <FileText />
        </div>
        <div style={styles.statCard}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 5 }}>{prescriptions.length}</h3>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Total Prescriptions</p>
        </div>
        <div style={styles.statCard}>
          <User style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }} />
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{new Set(prescriptions.map((p) => p.patientId)).size}</h3>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Unique Patients</p>
        </div>
        <div style={styles.statCard}>
          <Stethoscope style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }} />
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{uniqueDoctors.length}</h3>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Active Doctors</p>
        </div>
        <div style={styles.statCard}>
          <Filter style={{ ...styles.statIcon, background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' }} />
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{filteredPrescriptions.length}</h3>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Filtered Results</p>
        </div>
      </div>

      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <h2 style={{ fontSize: 20, color: '#1f2937', margin: 0 }}>Patient Prescription Records</h2>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredPrescriptions.length)} of {filteredPrescriptions.length}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {currentRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              <FileText style={{ width: 64, height: 64, margin: '0 auto 20px', color: '#d1d5db' }} />
              <h3>No Records Found</h3>
              <p>No prescriptions match your current search criteria.</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Patient ID</th>
                  <th style={styles.th}>Patient Name</th>
                  <th style={styles.th}>Diagnosis</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Specialization</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((prescription) => (
                  <tr key={prescription._id} style={{ transition: 'all 0.3s ease' }}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Calendar style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                        {new Date(prescription.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.patientId}>{prescription.patientId}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <User style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                        {prescription.patientName}
                      </div>
                    </td>
                    <td style={{ ...styles.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>
                      {prescription.diagnosis}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UserCheck style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                        {prescription.doctorName}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Stethoscope style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                        {prescription.doctorSpecialization || 'General'}
                      </div>
                    </td>
                    <td style={{ ...styles.td, display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        style={{ ...styles.actionBtn, ...styles.viewBtn }}
                        title="View Details"
                        onClick={() => handleViewPatient(prescription)}
                      >
                        <Eye style={{ width: 16, height: 16 }} />
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.pdfBtn }}
                        title="Generate PDF"
                        onClick={() => generatePDF(prescription)}
                      >
                        <Download style={{ width: 16, height: 16 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '25px 30px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
            <div style={{ color: '#6b7280', fontSize: 14 }}>
              Page {currentPage} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
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
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        background: currentPage === pageNum ? '#4f46e5' : 'white',
                        color: currentPage === pageNum ? 'white' : '#374151',
                        borderColor: currentPage === pageNum ? '#4f46e5' : '#d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              <button
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', background: 'white', color: '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPatient && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#1f2937', margin: 0 }}>
                <User style={{ marginRight: 12, color: '#4f46e5', width: 28, height: 28 }} />
                Patient Details
              </h2>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 32,
                  cursor: 'pointer',
                  color: '#6b7280',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setShowModal(false)}
                aria-label="Close Patient Details"
              >
                ×
              </button>
            </div>
            <div style={styles.modalContent}>
              {/* Patient Info */}
              <h3 style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: '#1f2937', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #e5e7eb' }}>
                <User style={{ marginRight: 10, color: '#4f46e5', width: 20, height: 20 }} />
                Patient Information
              </h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Name:</span>
                  <span style={styles.infoValue}>{selectedPatient.patientName}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Patient ID:</span>
                  <span style={styles.infoValue}>{selectedPatient.patientId}</span>
                </div>
                <div style={styles.infoItem}>
                  <Mail style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                  <span style={styles.infoLabel}>Email:</span>
                  <span style={styles.infoValue}>{selectedPatient.patientEmail || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <Phone style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                  <span style={styles.infoLabel}>Phone:</span>
                  <span style={styles.infoValue}>{selectedPatient.patientPhone || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Gender:</span>
                  <span style={styles.infoValue}>{selectedPatient.patientGender || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <Heart style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                  <span style={styles.infoLabel}>Blood Group:</span>
                  <span style={styles.infoValue}>{selectedPatient.bloodGroup || 'N/A'}</span>
                </div>
              </div>
              {selectedPatient.patientAllergies && selectedPatient.patientAllergies.length > 0 && (
                <div style={{ marginTop: 15 }}>
                  <strong>Allergies:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {selectedPatient.patientAllergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          color: '#dc2626',
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          border: '1px solid #fca5a5',
                        }}
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Info */}
              <h3 style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: '#1f2937', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #e5e7eb' }}>
                <UserCheck style={{ marginRight: 10, color: '#4f46e5', width: 20, height: 20 }} />
                Doctor Information
              </h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Name:</span>
                  <span style={styles.infoValue}>{selectedPatient.doctorName}</span>
                </div>
                <div style={styles.infoItem}>
                  <Stethoscope style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                  <span style={styles.infoLabel}>Specialization:</span>
                  <span style={styles.infoValue}>{selectedPatient.doctorSpecialization || 'General'}</span>
                </div>
                <div style={styles.infoItem}>
                  <Calendar style={{ width: 16, height: 16, marginRight: 8, color: '#6b7280' }} />
                  <span style={styles.infoLabel}>Consultation Date:</span>
                  <span style={styles.infoValue}>{new Date(selectedPatient.date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Prescription Details */}
              <h3 style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: '#1f2937', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #e5e7eb' }}>
                <FileText style={{ marginRight: 10, color: '#4f46e5', width: 20, height: 20 }} />
                Prescription Details
              </h3>
              <div style={{ marginBottom: 25 }}>
                <strong>Diagnosis:</strong>
                <p style={{ background: '#f0f9ff', padding: '15px 20px', borderRadius: 10, borderLeft: '4px solid #0ea5e9', marginTop: 10, lineHeight: 1.6, color: '#0c4a6e' }}>
                  {selectedPatient.diagnosis}
                </p>
              </div>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', fontSize: 16, color: '#374151', marginBottom: 15 }}>
                  <Pill style={{ marginRight: 10, color: '#4f46e5', width: 20, height: 20 }} />
                  Prescribed Medicines
                </h4>
                {selectedPatient.medicines && selectedPatient.medicines.length > 0 ? (
                  <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
                            Medicine
                          </th>
                          <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
                            Dosage
                          </th>
                          <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
                            Frequency
                          </th>
                          <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
                            Duration
                          </th>
                          <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPatient.medicines.map((med, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 15px', color: '#1f2937', fontSize: 13 }}>{med.name}</td>
                            <td style={{ padding: '12px 15px', color: '#1f2937', fontSize: 13 }}>{med.dosage}</td>
                            <td style={{ padding: '12px 15px', color: '#1f2937', fontSize: 13 }}>{med.frequency}</td>
                            <td style={{ padding: '12px 15px', color: '#1f2937', fontSize: 13 }}>{med.duration}</td>
                            <td style={{ padding: '12px 15px', color: '#1f2937', fontSize: 13 }}>{med.notes || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: 20, background: '#f9fafb', borderRadius: 10 }}>No medicines prescribed</p>
                )}
              </div>
              {selectedPatient.notes && (
                <div style={{ marginTop: 20 }}>
                  <strong>Additional Notes:</strong>
                  <p
                    style={{
                      background: '#fefce8',
                      padding: '15px 20px',
                      borderRadius: 10,
                      borderLeft: '4px solid #eab308',
                      marginTop: 10,
                      lineHeight: 1.6,
                      color: '#713f12',
                    }}
                  >
                    {selectedPatient.notes}
                  </p>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#e5e7eb',
                  color: '#374151',
                }}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                }}
                onClick={() => generatePDF(selectedPatient)}
              >
                <Download style={{ width: 16, height: 16, marginRight: 8 }} /> Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
