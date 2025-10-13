import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
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

  const navigateToDashboard = () => {
    navigate('/admin/doctor-dashboard'); 
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // UPDATED: Professional PDF Generation matching PrescriptionForm format
  const generatePDFBuffer = (prescription) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 8;
        const usableWidth = pageWidth - margin * 2;
        const signatureSectionHeight = 50;
        const footerHeight = 20;
        let y = 5;
        let currentPage = 1;
        let prescriptionId = prescription._id || `RX-${Date.now().toString(36).toUpperCase()}`;
        let patientName = prescription.patientName || "Patient";
        let formattedDate = new Date(prescription.date || new Date().toISOString().slice(0, 10)).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const addPageHeader = (pageNum, isContinuation = false) => {
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');

          doc.setFillColor(0, 51, 102);
          doc.rect(0, 0, pageWidth, 2, 'F');

          if (isContinuation) {
            doc.setFillColor(240, 248, 255);
            doc.rect(margin, y, usableWidth, 12, 'F');
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 51, 102);
            doc.text("PRESCRIPTION (Continued)", margin + 3, y + 6);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text(`Prescription #: ${prescriptionId}`, margin + 3, y + 10);
            doc.text(`Patient: ${patientName}`, margin + 70, y + 10);
            doc.text(`Date: ${formattedDate}`, pageWidth - margin - 5, y + 10, { align: 'right' });
            doc.text(`Page ${pageNum}`, pageWidth - margin - 5, y + 14, { align: 'right' });
            
            y += 18;
          } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 102);
            doc.text("HEAL X", margin, y + 10);
            doc.setFontSize(10);
            doc.text("Healthcare Center", margin, y + 16);

            const logoWidth = 35;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0, 51, 102);
            doc.text("HealX Healthcare Center", margin + logoWidth + 8, y + 8);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text("123 Healthcare Avenue, Medical District, MD 12345", margin + logoWidth + 8, y + 13);
            doc.text("Tel: (555) 123-4567 | Email: info@healxmedical.com", margin + logoWidth + 8, y + 18);
            
            y += 25;

            doc.setDrawColor(0, 51, 102);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            
            doc.setFillColor(0, 51, 102);
            doc.circle(margin + 6, y + 5, 4, 'FD');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text("Rx", margin + 6, y + 7, { align: 'center' });
            
            doc.setTextColor(0, 51, 102);
            doc.setFontSize(14);
            doc.text("PRESCRIPTION", margin + 14, y + 7);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text(`Prescription #: ${prescriptionId}`, pageWidth - margin - 5, y + 5, { align: 'right' });
            doc.text(`Date: ${formattedDate}`, pageWidth - margin - 5, y + 10, { align: 'right' });
            doc.text(`Page ${pageNum}`, pageWidth - margin - 5, y + 15, { align: 'right' });
            
            y += 20;
          }

          return y;
        };

        y = addPageHeader(currentPage, false);

        // Patient Information Section
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, usableWidth, 22);
        
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, y, usableWidth, 5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text("PATIENT INFORMATION", margin + 3, y + 3.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        const patientId = prescription.patientId || "N/A";
        const dob = prescription.patientDateOfBirth ? new Date(prescription.patientDateOfBirth).toLocaleDateString() : "N/A";
        const age = prescription.patientDateOfBirth ? calculateAge(prescription.patientDateOfBirth) : "N/A";
        
        doc.text(`Name: ${patientName}`, margin + 3, y + 9);
        doc.text(`ID: ${patientId}`, margin + 3, y + 13);
        doc.text(`DOB: ${dob} (${age} years)`, margin + 3, y + 17);
        doc.text(`Gender: ${prescription.patientGender || "N/A"}`, margin + 3, y + 21);
        
        doc.text(`Phone: ${prescription.patientPhone || "N/A"}`, margin + 90, y + 9);
        doc.text(`Email: ${prescription.patientEmail || "N/A"}`, margin + 90, y + 13);
        doc.text(`Blood Type: ${prescription.patientBloodGroup || "N/A"}`, margin + 90, y + 17);
        
        if (prescription.patientAllergies && prescription.patientAllergies.length > 0) {
          doc.setTextColor(200, 0, 0);
          doc.setFont("helvetica", "bold");
          const allergiesText = `ALLERGIES: ${prescription.patientAllergies.join(", ")}`;
          const splitText = doc.splitTextToSize(allergiesText, usableWidth - 95);
          doc.text(splitText, margin + 90, y + 21);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
        }
        
        y += 25;

        // Prescribing Physician Information
        doc.setDrawColor(0, 51, 102);
        doc.rect(margin, y, usableWidth, 15);
        
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, y, usableWidth, 5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text("PRESCRIBING PHYSICIAN", margin + 3, y + 3.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`Name: ${prescription.doctorName || "N/A"}`, margin + 3, y + 9);
        doc.text(`Specialization: ${prescription.doctorSpecialization || "N/A"}`, margin + 3, y + 13);
        
        doc.text(`License: MD-12345 | DEA: AB1234567`, margin + 90, y + 9);
        doc.text(`Phone: (555) 987-6543`, margin + 90, y + 13);
        
        y += 18;

        // Diagnosis Section
        doc.setDrawColor(0, 51, 102);
        doc.rect(margin, y, usableWidth, 18);
        
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, y, usableWidth, 5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text("DIAGNOSIS", margin + 3, y + 3.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        const diagLines = doc.splitTextToSize(prescription.diagnosis || "N/A", usableWidth - 6);
        let diagY = y + 9;
        diagLines.forEach(line => {
          doc.text(line, margin + 3, diagY);
          diagY += 3.5;
        });
        
        const actualDiagHeight = 5 + diagLines.length * 3.5 + 5;
        y += actualDiagHeight;

        // Medications Section
        doc.setDrawColor(0, 51, 102);
        doc.rect(margin, y, usableWidth, 8);
        
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, y, usableWidth, 5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text("MEDICATION ORDERS", margin + 3, y + 3.5);
        
        y += 7;

        // Table Headers
        doc.setFontSize(7);
        const colWidths = [5, 55, 28, 28, 18, 60];
        const headers = ["#", "Medication", "Dosage", "Frequency", "Duration", "Instructions"];
        const headerHeight = 5;
        
        doc.setFillColor(0, 51, 102);
        doc.rect(margin, y, usableWidth, headerHeight, "F");
        
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.2);
        let x = margin;
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        for (let i = 0; i < headers.length; i++) {
          doc.rect(x, y, colWidths[i], headerHeight);
          doc.text(headers[i], x + 1, y + 3.5);
          x += colWidths[i];
        }
        y += headerHeight;

        // Table Rows
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const rowPadding = 1;
        
        const getMaxYPosition = () => {
          return pageHeight - signatureSectionHeight - footerHeight - 5;
        };
        
        const checkAndAddNewPage = (requiredHeight) => {
          const maxYPosition = getMaxYPosition();
          if (y + requiredHeight > maxYPosition) {
            doc.addPage();
            currentPage++;
            y = addPageHeader(currentPage, true);
            
            doc.setFillColor(240, 248, 255);
            doc.rect(margin, y, usableWidth, 8, 'FD');
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(0, 51, 102);
            doc.text("MEDICATION ORDERS (Continued)", margin + 3, y + 3.5);
            
            y += 7;
            
            doc.setFillColor(0, 51, 102);
            doc.rect(margin, y, usableWidth, headerHeight, "F");
            x = margin;
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            for (let i = 0; i < headers.length; i++) {
              doc.rect(x, y, colWidths[i], headerHeight);
              doc.text(headers[i], x + 1, y + 3.5);
              x += colWidths[i];
            }
            y += headerHeight;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            return true;
          }
          return false;
        };
        
        const medicines = prescription.medicines || [];
        medicines.forEach((med, idx) => {
          const rowTexts = [
            [(idx + 1).toString()],
            doc.splitTextToSize(med.name || "", colWidths[1] - rowPadding),
            doc.splitTextToSize(med.dosage || "", colWidths[2] - rowPadding),
            doc.splitTextToSize(med.frequency || "", colWidths[3] - rowPadding),
            doc.splitTextToSize(med.duration || "", colWidths[4] - rowPadding),
            doc.splitTextToSize(med.notes || "Take as directed", colWidths[5] - rowPadding),
          ];

          const maxLines = Math.max(...rowTexts.map(c => c.length));
          const lineHeight = 3;
          const rowHeight = Math.max(5, maxLines * lineHeight + 2);

          checkAndAddNewPage(rowHeight);

          x = margin;
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(x, y, usableWidth, rowHeight, "F");
          }
          
          for (let c = 0; c < rowTexts.length; c++) {
            doc.rect(x, y, colWidths[c], rowHeight);
            x += colWidths[c];
          }

          x = margin;
          for (let c = 0; c < rowTexts.length; c++) {
            const lines = rowTexts[c];
            for (let li = 0; li < lines.length; li++) {
              const textY = y + 2 + li * lineHeight;
              doc.text(String(lines[li] || ""), x + 1, textY);
            }
            x += colWidths[c];
          }

          y += rowHeight;
        });

        y += 5;

        // Additional Instructions
        if (prescription.notes) {
          const noteLines = doc.splitTextToSize(prescription.notes, usableWidth - 6);
          const notesHeight = 5 + noteLines.length * 3.5 + 3;
          
          checkAndAddNewPage(notesHeight);
          
          doc.setDrawColor(0, 51, 102);
          doc.rect(margin, y, usableWidth, notesHeight);
          
          doc.setFillColor(240, 248, 255);
          doc.rect(margin, y, usableWidth, 5, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(0, 51, 102);
          doc.text("ADDITIONAL INSTRUCTIONS", margin + 3, y + 3.5);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          
          let noteY = y + 9;
          noteLines.forEach(line => {
            doc.text(line, margin + 3, noteY);
            noteY += 3.5;
          });
          
          y += notesHeight;
        }

        const maxYPosition = getMaxYPosition();
        if (y < maxYPosition - 10) {
          y = maxYPosition - 10;
        }

        // PHYSICIAN SIGNATURE & AUTHORIZATION
        const signatureY = pageHeight - signatureSectionHeight - footerHeight;
        
        if (y > signatureY) {
          doc.addPage();
          currentPage++;
          y = addPageHeader(currentPage, true);
        }
        
        y = signatureY;
        
        doc.setDrawColor(0, 51, 102);
        doc.rect(margin, y, usableWidth, signatureSectionHeight);
        
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, y, usableWidth, 5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 51, 102);
        doc.text("PHYSICIAN SIGNATURE & AUTHORIZATION", margin + 3, y + 3.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(margin + 3, y + 20, margin + 45, y + 20);
        
        doc.text(` ${prescription.doctorName || "N/A"}`, margin + 3, y + 25);
        doc.text(`${prescription.doctorSpecialization || "N/A"}`, margin + 3, y + 29);
        doc.text(`License: MD-12345`, margin + 3, y + 33);
        doc.text(`DEA: AB1234567`, margin + 3, y + 37);
        doc.text(`NPI: 1234567890`, margin + 3, y + 41);
        doc.text(`Phone: (555) 987-6543`, margin + 3, y + 45);
        
        const signatureDate = new Date().toLocaleDateString();
        doc.text(`Date: ${signatureDate}`, margin + 55, y + 20);
        doc.text("Refills: 0", margin + 55, y + 25);
        doc.text("Substitution: Permitted", margin + 55, y + 29);
        doc.text("DAW: ☐ Generic  ☐ Brand  ☐ Either", margin + 55, y + 33);
        doc.text("Pharmacy: Any", margin + 55, y + 37);
        doc.text("Valid until: 90 days from issue", margin + 55, y + 41);
        doc.text("Controlled Substance: No", margin + 55, y + 45);

        // Professional Footer
        const footerY = pageHeight - footerHeight;
        
        doc.setDrawColor(0, 51, 102);
        doc.rect(margin, footerY, usableWidth, footerHeight - 3);
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(60, 60, 60);
        
        const disclaimer1 = "This prescription is valid only when signed by a licensed physician. Medications should be taken exactly as prescribed.";
        const disclaimer2 = "For medical emergencies, call 911 or visit the nearest emergency room. Keep all medications out of reach of children.";
        
        doc.text(disclaimer1, margin + 3, footerY + 4, { maxWidth: usableWidth - 6 });
        doc.text(disclaimer2, margin + 3, footerY + 8, { maxWidth: usableWidth - 6 });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(0, 51, 102);
        
        const contactText = "Heal X Medical Center | (555) 123-4567 | www.healxmedical.com";
        const centerX = pageWidth / 2;
        
        doc.text(contactText, centerX, footerY + 12, { align: 'center' });

        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.rect(3, 3, pageWidth - 6, pageHeight - 6);

        const pdfBuffer = doc.output('arraybuffer');
        resolve(pdfBuffer);

      } catch (error) {
        reject(error);
      }
    });
  };

  const generatePDF = async (prescription) => {
    try {
      const pdfBuffer = await generatePDFBuffer(prescription);
      
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeFirst = (prescription.patientName || "Patient").split(' ')[0].replace(/\s+/g, "_");
      const safeLast = (prescription.patientName || "Patient").split(' ')[1] || "";
      const fileDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
      link.download = `Prescription_${safeFirst}_${safeLast}_${fileDate}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

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

    if (activeTab !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(p => {
        const prescriptionDate = new Date(p.date);
        prescriptionDate.setHours(0, 0, 0, 0);
        
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
                  <th className="pr-th pr-th-diagnosis">Diagnosis</th>
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
                            <div className="pr-diagnosis-text" title={prescription.diagnosis || 'N/A'}>
                              {prescription.diagnosis || 'N/A'}
                            </div>
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
                            title="Download PDF"
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
                                    <span>{prescription.patientBloodGroup || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="pr-expanded-label">Gender:</span>
                                    <span>{prescription.patientGender || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="pr-expanded-label">Date of Birth:</span>
                                    <span>{prescription.patientDateOfBirth ? new Date(prescription.patientDateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="pr-expanded-label">Age:</span>
                                    <span>{prescription.patientDateOfBirth ? calculateAge(prescription.patientDateOfBirth) : 'N/A'}</span>
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
                      <div className="pr-info-value">{selectedPatient.patientBloodGroup || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Date of Birth</div>
                      <div className="pr-info-value">{selectedPatient.patientDateOfBirth ? new Date(selectedPatient.patientDateOfBirth).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="pr-info-item">
                    <div className="pr-info-icon-wrapper">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="pr-info-label">Age</div>
                      <div className="pr-info-value">{selectedPatient.patientDateOfBirth ? calculateAge(selectedPatient.patientDateOfBirth) : 'N/A'}</div>
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
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;