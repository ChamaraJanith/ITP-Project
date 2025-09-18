import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createPrescription, updatePrescription } from "../../../services/prescriptionService";
import { jsPDF } from "jspdf";

// Custom validation patterns
const namePattern = /^[a-zA-Z\s\-'.]+$/; // Only letters, spaces, hyphens, apostrophes, periods
const phonePattern = /^[\+]?[1-9][\d]{0,15}$/; // International phone format
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Email format
const dosagePattern = /^[0-9]+(\.[0-9]+)?\s*(mg|g|ml|l|tablet|tablets|capsule|capsules|drop|drops|tsp|tbsp|unit|units)?$/i;
const frequencyPattern = /^[0-9]+\s*(time|times|daily|weekly|monthly|hourly|per day|per week|per month|once|twice|thrice|morning|evening|night|afternoon).*$/i;
const durationPattern = /^[0-9]+\s*(day|days|week|weeks|month|months|year|years)$/i;


// Medicine validation schema
const MedicineSchema = yup.object({
  name: yup
    .string()
    .required("Medicine name is required")
    .min(2, "Medicine name must be at least 2 characters")
    .max(100, "Medicine name cannot exceed 100 characters")
    .matches(namePattern, "Medicine name can only contain letters, spaces, hyphens, apostrophes, and periods")
    .test('no-numbers', 'Medicine name cannot contain numbers', (value) => {
      if (!value) return true;
      return !/\d/.test(value);
    }),
  
  dosage: yup
    .string()
    .required("Dosage is required")
    .min(1, "Dosage is required")
    .max(50, "Dosage cannot exceed 50 characters")
    .matches(dosagePattern, "Invalid dosage format. Use format like: 10mg, 2 tablets, 5ml, etc.")
    .test('has-number', 'Dosage must contain a number', (value) => {
      if (!value) return true;
      return /\d/.test(value);
    }),
  
  frequency: yup
    .string()
    .required("Frequency is required")
    .min(1, "Frequency is required")
    .max(100, "Frequency cannot exceed 100 characters")
    .matches(frequencyPattern, "Invalid frequency format. Use format like: 3 times daily, twice daily, once per day, etc.")
    .test('has-number-or-text', 'Frequency must specify how often to take', (value) => {
      if (!value) return true;
      const validKeywords = ['once', 'twice', 'thrice', 'daily', 'weekly', 'monthly', 'morning', 'evening', 'night'];
      return /\d/.test(value) || validKeywords.some(keyword => value.toLowerCase().includes(keyword));
    }),
  
  duration: yup
    .string()
    .required("Duration is required")
    .min(1, "Duration is required")
    .max(50, "Duration cannot exceed 50 characters")
    .matches(durationPattern, "Invalid duration format. Use format like: 7 days, 2 weeks, 1 month, etc.")
    .test('reasonable-duration', 'Duration seems unreasonable', (value) => {
      if (!value) return true;
      const match = value.match(/^(\d+)\s*(day|days|week|weeks|month|months|year|years)$/i);
      if (!match) return false;
      
      const number = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.includes('day')) return number <= 365;
      if (unit.includes('week')) return number <= 52;
      if (unit.includes('month')) return number <= 12;
      if (unit.includes('year')) return number <= 5;
      
      return true;
    }),
  
  notes: yup
    .string()
    .optional()
    .max(500, "Notes cannot exceed 500 characters")
    .test('no-special-chars', 'Notes contain invalid characters', (value) => {
      if (!value) return true;
      // Allow letters, numbers, spaces, and common punctuation
      const allowedPattern = /^[a-zA-Z0-9\s\-_.,;:!?'"()[\]{}]+$/;
      return allowedPattern.test(value);
    }),
});

// Patient ID validation
const patientIdValidation = yup
  .string()
  .required("Patient is required")
  .test('valid-patient', 'Please select a valid patient from the search results', function(value) {
    return value && value.length > 0;
  });

// Prescription validation schema
const PrescriptionSchema = yup.object({

  diagnosis: yup
    .string()
    .required("Diagnosis is required")
    .min(3, "Diagnosis must be at least 3 characters")
    .max(1000, "Diagnosis cannot exceed 1000 characters")
    .test('meaningful-content', 'Please provide a meaningful diagnosis', (value) => {
      if (!value) return true;
      // Check if it's not just spaces or meaningless characters
      const meaningfulPattern = /[a-zA-Z]{3,}/;
      return meaningfulPattern.test(value);
    }),
  
  medicines: yup
    .array()
    .of(MedicineSchema)
    .min(1, "At least one medicine is required")
    .max(10, "Cannot prescribe more than 10 medicines at once")
    .test('unique-medicines', 'Duplicate medicine names are not allowed', function(medicines) {
      if (!medicines || medicines.length <= 1) return true;
      
      const names = medicines.map(med => med.name?.toLowerCase().trim()).filter(Boolean);
      const uniqueNames = new Set(names);
      
      return names.length === uniqueNames.size;
    }),
  
  notes: yup
    .string()
    .optional()
    .max(1000, "Notes cannot exceed 1000 characters"),
  
  patientId: patientIdValidation,
  

});

// Default form values
const defaultValues = ( patient) => ({
  date: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  medicines: [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }],
  notes: "",
  patientId: patient?._id || "",
});

// Utility function to filter prescriptions for today
export const filterTodaysPrescriptions = (prescriptions) => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  return prescriptions.filter((prescription) => {
    const prescriptionDate = prescription.date?.slice(0, 10);
    return prescriptionDate === todayStr;
  });
};

// Input validation helpers
const validatePhoneInput = (value) => {
  return value.replace(/[^\d\+\-\s\(\)]/g, '');
};

const validateNameInput = (value) => {
  return value.replace(/[^a-zA-Z\s\-'.]/g, '');
};

const validateNameNumberInput = (value) => {
  return value.replace(/[^a-zA-Z0-9\s\-'.]/g, '');
};

const validateNumberInput = (value) => {
  return value.replace(/[^0-9.]/g, '');
};

const PrescriptionForm = ({
  doctor,
  parentPatient,
  ocrTextFromCanvas,
  onSaved,
  editingPrescription,
  prescriptions,
  scannedPatientId,
}) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    resolver: yupResolver(PrescriptionSchema),
    defaultValues: defaultValues(parentPatient),
    mode: "onChange", // Validate on change for real-time feedback
  });

  const { fields, append, remove } = useFieldArray({ control, name: "medicines" });

  const [activeField, setActiveField] = useState(null);
  const [search, setSearch] = useState("");
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(parentPatient || null);
  const [searchError, setSearchError] = useState("");

  // Watch form values for additional validation
  const watchedMedicines = watch("medicines");
  const watchedDiagnosis = watch("diagnosis");

  // Filter today's prescriptions
  const todaysPrescriptions = React.useMemo(() => {
    if (!prescriptions) return [];
    return filterTodaysPrescriptions(prescriptions);
  }, [prescriptions]);


  // Add this useEffect to handle scanned patient ID
useEffect(() => {
  if (!scannedPatientId || selectedPatient) return;

  const fetchScannedPatient = async () => {
    try {
      setSearchError("");
      
      // Try to fetch patient by ID directly
      const res = await fetch(`http://localhost:7000/api/patients/${scannedPatientId}`);
      
      if (res.ok) {
        const data = await res.json();
        const patient = data.patient || data;
        
        if (patient) {
          handleSelectPatient({
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            phone: patient.phone,
            gender: patient.gender,
            dateOfBirth: patient.dateOfBirth,
            bloodGroup: patient.bloodGroup,
            allergies: patient.allergies || []
          });
          return;
        }
      }
      
      // If direct fetch fails, try searching by patient ID
      const searchRes = await fetch(`http://localhost:7000/api/patients?search=${encodeURIComponent(scannedPatientId)}`);
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          // Find exact match first, otherwise take first result
          const exactMatch = searchData.find(p => 
            p._id === scannedPatientId || 
            p.patientId === scannedPatientId
          );
          
          const patientToSelect = exactMatch || searchData[0];
          handleSelectPatient(patientToSelect);
        } else {
          setSearchError(`No patient found with ID: ${scannedPatientId}`);
        }
      } else {
        setSearchError("Failed to search for scanned patient");
      }
      
    } catch (err) {
      console.error("Failed to fetch scanned patient:", err);
      setSearchError("Failed to load scanned patient data");
    }
  };

  fetchScannedPatient();
}, [scannedPatientId, selectedPatient]);



  // Prefill form for editing
// Effect to handle editing prescription and fetch full patient data
useEffect(() => {
  if (!editingPrescription) return;

  reset({
    date: editingPrescription.date?.slice(0, 10) || "",
    diagnosis: editingPrescription.diagnosis || "",
    medicines: editingPrescription.medicines?.length
      ? editingPrescription.medicines
      : [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }],
    notes: editingPrescription.notes || "",
    patientId: editingPrescription.patientId || ""
  });

  // Fetch full patient info for dateOfBirth and other fields
  const pid = editingPrescription.patientId || editingPrescription._id;

  fetch(`http://localhost:7000/api/patients/${pid}`)
    .then(res => res.json())
    .then(data => {
      if (!data?.patient) return;

      const patient = data.patient;

      setSelectedPatient({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth
          ? new Date(patient.dateOfBirth).toLocaleDateString()
          : "",
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies || []
      });
      setSearch(`${patient.firstName} ${patient.lastName} ${patient.patientId || patient._id}`);
    })
    .catch(err => console.error("Failed to fetch patient for editing:", err));
}, [editingPrescription, reset]);

  // Enhanced patient search with validation
  const handleSearchButton = async () => {
    setSearchError("");
    
    if (!search.trim()) {
      setSearchError("Enter a patient name to search");
      return;
    }

    if (search.trim().length < 2) {
      setSearchError("Search term must be at least 2 characters");
      return;
    }

    // if (!/^[a-zA-Z\s\-'.]+$/.test(search.trim())) {
    //   setSearchError("Search can only contain letters, spaces, hyphens, apostrophes, and periods");
    //   return;
    // }

    try {
      const res = await fetch(`http://localhost:7000/api/patients?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError("No patient found with that name");
        setPatientsList([]);
        setSelectedPatient(null);
        setValue("patientId", "");
        return;
      }
      
      setPatientsList(data);
      setSearchError("");
    } catch (err) {
      console.error("Patient search failed:", err);
      setSearchError("Failed to search patients. Please try again.");
    }
  };

  const handleSelectPatient = (patient) => {
    // Validate patient data
    if (!patient.patientId) {
      setSearchError("Invalid patient data");
      return;
    }

    setSelectedPatient(patient);
    setValue("patientId",patient.patientId);
    setSearch(`${patient.firstName} ${patient.lastName} (${patient.patientId || patient._id})`);
    setPatientsList([]);
    setSearchError("");
    trigger("patientId"); // Trigger validation
  };

  // Handle search input changes with validation
  const handleSearchChange = (e) => {
    const value = validateNameNumberInput(e.target.value);
    setSearch(value);
    setSearchError("");
    
    if (value.length === 0) {
      setSelectedPatient(null);
      setValue("patientId", "");
    }
  };

  useEffect(() => {
    if (parentPatient) {
      setSelectedPatient(parentPatient);
      setValue("patientId", parentPatient.patientId);
      setSearch(`${parentPatient.firstName} ${parentPatient.lastName}`);
    }
  }, [parentPatient, setValue]);

  // OCR text integration with validation
  useEffect(() => {
    if (!ocrTextFromCanvas || !activeField) return;
    
    let processedValue = ocrTextFromCanvas;
    
    // Apply appropriate validation based on field type
    if (activeField.includes('name') && activeField.includes('medicines')) {
      processedValue = validateNameInput(ocrTextFromCanvas);
    } else if (activeField.includes('dosage')) {
      // Allow dosage pattern
      processedValue = ocrTextFromCanvas;
    }
    
    setValue(activeField, processedValue);
    trigger(activeField); // Trigger validation
  }, [ocrTextFromCanvas, activeField, setValue, trigger]);

  // Enhanced form submission with final validation
  const onSubmit = async (data) => {
    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }

    // Additional business logic validation
    const totalMedicines = data.medicines.length;
    if (totalMedicines > 10) {
      alert("Cannot prescribe more than 10 medicines at once.");
      return;
    }

    // Check for drug interactions (basic example)
    const medicineNames = data.medicines.map(m => m.name.toLowerCase());
    const commonInteractions = [
      ['aspirin', 'warfarin'],
      ['paracetamol', 'alcohol'],
    ];

    for (const interaction of commonInteractions) {
      if (interaction.every(drug => medicineNames.some(name => name.includes(drug)))) {
        const confirmProceed = window.confirm(
          `Warning: Potential drug interaction detected between ${interaction.join(' and ')}. Do you want to proceed?`
        );
        if (!confirmProceed) return;
      }
    }

    try {
      const payload = {
        date: data.date,
        diagnosis: data.diagnosis,
        medicines: data.medicines,
        notes: data.notes,
        patientId: selectedPatient.patientId,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientEmail: selectedPatient.email,
        patientPhone: selectedPatient.phone,
        patientGender: selectedPatient.gender,
        bloodGroup: selectedPatient.bloodGroup,
        patientAllergies: selectedPatient.allergies
      };

      let res;
      if (editingPrescription) {
        res = await updatePrescription(editingPrescription._id, payload);
        alert("Prescription updated successfully.");
      } else {
        res = await createPrescription(payload);
        alert("Prescription saved successfully.");
      }

      if (onSaved) onSaved(res.data?.data || res.data);
      reset(defaultValues(doctor, selectedPatient));
      setSearch("");
      setSelectedPatient(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to save prescription.");
    }
  };

  const addMedicine = () => {
    if (fields.length >= 10) {
      alert("Cannot add more than 10 medicines");
      return;
    }
    append({ name: "", dosage: "", frequency: "", duration: "", notes: "" });
  };

  // PDF generation function


// PDF generation function
// Replace your existing generateProfessionalPDF with this function
const generateProfessionalPDF = (selectedPatient, diagnosis, medicines, additionalNotes, doctor, date) => {
  if (!selectedPatient) {
    alert("Please select a patient to generate PDF");
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;
  let y = 18;

  // Helper: safe text splitter
  const split = (text, width) => doc.splitTextToSize(text || "", width);

  // Header (clinic title + subtitle)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HealIX Healthcare Center", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Prescription", pageWidth / 2, y, { align: "center" });
  y += 6;

  // small department/subtitle line
  doc.setFontSize(10);
  doc.text("Department of Medical Equipment & Supplies", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Thin horizontal rule
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Metadata row (date, time, doctor, report id)
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date || now.toISOString().slice(0, 10);
  const reportId = `RPT-${now.toISOString().slice(0,10).replace(/-/g,"")}-${now.getHours()}${now.getMinutes()}`;
  doc.setFontSize(9);
  doc.text(`Report Date: ${dateStr} | Time: ${timeStr}`, margin, y);
  doc.text(`Generated By: ${doctor?.name || "N/A"} | Report ID: ${reportId}`, pageWidth - margin, y, { align: "right" });
  y += 8;

  // EXECUTIVE SUMMARY box
  const summaryBoxHeight = 18;
  doc.setLineWidth(0.6);
  doc.rect(margin, y, usableWidth, summaryBoxHeight); // stroke
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("EXECUTIVE SUMMARY", margin + 2, y + 6);
  doc.setFont("helvetica", "normal");
  const totalMedicines = (medicines || []).length;
  const totalNotes = additionalNotes ? 1 : 0;
  doc.text(`Total Medicines: ${totalMedicines}`, margin + 4, y + 12);
  doc.text(`Diagnosis: ${diagnosis || "N/A"}`, margin + 60, y + 12);
  doc.text(`Notes present: ${totalNotes}`, pageWidth - margin - 40, y + 12, { align: "right" });
  y += summaryBoxHeight + 10;

  // Patient details boxed area (left) + small doctor box (right)
  const patientBoxHeight = 28;
  doc.setLineWidth(0.6);
  doc.rect(margin, y, usableWidth, patientBoxHeight);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Details", margin + 2, y + 7);
  doc.setFont("helvetica", "normal");
  const patientName = `${selectedPatient.firstName || ""} ${selectedPatient.lastName || ""}`.trim();
  doc.text(`Name: ${patientName}`, margin + 4, y + 13);
  doc.text(`Patient ID: ${selectedPatient._id || selectedPatient.patientId || "N/A"}`, margin + 4, y + 19);
  doc.text(`Gender: ${selectedPatient.gender || "N/A"}`, margin + 70, y + 13);
  doc.text(`Blood Group: ${selectedPatient.bloodGroup || "N/A"}`, margin + 70, y + 19);

  // Allergies (highlighted if present)
  if (selectedPatient.allergies && selectedPatient.allergies.length) {
    doc.setTextColor(160, 0, 0);
    doc.setFontSize(9);
    doc.text(`⚠ Allergies: ${selectedPatient.allergies.join(", ")}`, margin + 4, y + 25);
    doc.setTextColor(0, 0, 0);
  }

  y += patientBoxHeight + 10;

  // Diagnosis block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Diagnosis / Symptoms:", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const diagLines = split(diagnosis || "N/A", usableWidth);
  diagLines.forEach(line => {
    // page break protection
    if (y > 275) { doc.addPage(); y = 18; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 6;

  // Medicines table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  // column widths that sum to usableWidth
  const colWidths = [10, 60, 30, 35, 25, 22]; // total 182 for A4 with margins 14
  const headers = ["S/N", "Medicine", "Dosage", "Frequency", "Duration", "Notes"];
  let x = margin;
  const headerHeight = 8;

  // If not enough vertical space for header+1 row, add page
  if (y + 12 > 285) { doc.addPage(); y = 18; }

  // draw header background & text
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, usableWidth, headerHeight, "F"); // filled header strip
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  // draw header cell borders & labels
  let headerX = x;
  for (let i = 0; i < headers.length; i++) {
    doc.rect(headerX, y, colWidths[i], headerHeight); // stroke border
    doc.text(headers[i], headerX + 2, y + 6);
    headerX += colWidths[i];
  }
  y += headerHeight;

  // table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const rowPadding = 2;
  (medicines || []).forEach((med, idx) => {
    // Prepare wrapped text per cell
    const rowTexts = [
      [(idx + 1).toString()],
      split(med.name || "", colWidths[1] - rowPadding),
      split(med.dosage || "", colWidths[2] - rowPadding),
      split(med.frequency || "", colWidths[3] - rowPadding),
      split(med.duration || "", colWidths[4] - rowPadding),
      split(med.notes || "", colWidths[5] - rowPadding),
    ];

    // Calculate max lines in this row
    const maxLines = Math.max(...rowTexts.map(c => c.length));

    // Row height based on lines
    const lineHeight = 4.5;
    const rowHeight = Math.max(7, maxLines * lineHeight + 4);

    // page break if needed
    if (y + rowHeight > 285) {
      doc.addPage();
      y = 18;

      // redraw header on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, usableWidth, headerHeight, "F");
      headerX = x;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      for (let i = 0; i < headers.length; i++) {
        doc.rect(headerX, y, colWidths[i], headerHeight);
        doc.text(headers[i], headerX + 2, y + 6);
        headerX += colWidths[i];
      }
      y += headerHeight;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }

    // draw cells and text
    let cellX = x;
    for (let c = 0; c < rowTexts.length; c++) {
      // cell border
      doc.rect(cellX, y, colWidths[c], rowHeight);

      // draw each wrapped line
      const lines = rowTexts[c];
      for (let li = 0; li < lines.length; li++) {
        const textY = y + 4 + li * lineHeight;
        doc.text(String(lines[li] || ""), cellX + 2, textY);
      }

      cellX += colWidths[c];
    }

    y += rowHeight;
  });

  y += 8;

  // Additional notes box
  if (additionalNotes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Additional Notes & Instructions:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const noteLines = split(additionalNotes, usableWidth);
    noteLines.forEach(line => {
      if (y > 275) { doc.addPage(); y = 18; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 6;
  }

  // Footer: Signature blocks
  // Ensure space
  if (y + 30 > 285) { doc.addPage(); y = 220; }

  const sigY = Math.max(y + 10, 220);
  const sigBoxWidth = 70;

  // Prepared by
  doc.setFont("helvetica", "normal");
  doc.text("Prepared by:", margin, sigY);
  doc.line(margin, sigY + 6, margin + sigBoxWidth, sigY + 6);
  doc.text("(Name & Signature)", margin, sigY + 12);

  // Reviewed by (right side)
  const rightX = pageWidth - margin - sigBoxWidth;
  doc.text("Reviewed by:", rightX, sigY);
  doc.line(rightX, sigY + 6, rightX + sigBoxWidth, sigY + 6);
  doc.text("(Name & Signature)", rightX, sigY + 12);

  // Doctor signature rightmost
  const docSigX = pageWidth - margin - 40;
  doc.text("____________________", docSigX, sigY + 20, { align: "left" });
  doc.text(`${doctor?.name || "Doctor"}`, docSigX, sigY + 26, { align: "left" });
  doc.text(`${doctor?.specialization || ""}`, docSigX, sigY + 31, { align: "left" });

  // Save file (filename safe)
  const safeFirst = (selectedPatient.firstName || "Patient").replace(/\s+/g, "_");
  const safeLast = (selectedPatient.lastName || "").replace(/\s+/g, "_");
  const fileDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
  doc.save(`Prescription_${safeFirst}_${safeLast}_${fileDate}.pdf`);
};


  // Error display component
  const ErrorMessage = ({ error }) => (
    error ? <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{error.message}</div> : null
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 12 }}>
      {/* Today's prescriptions count */}
      {prescriptions && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#e3f2fd", borderRadius: 6, border: "1px solid #90caf9" }}>
          <strong>Today's Prescriptions Count: {todaysPrescriptions.length}</strong>
        </div>
      )}

      {/* Patient search */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Patient Search</strong></label>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <input
            type="text"
            placeholder="Enter patient name or patient id..."
            value={search}
            onChange={handleSearchChange}
            style={{ 
              flex: 1, 
              padding: 8, 
              borderRadius: 4, 
              border: searchError ? "1px solid red" : "1px solid #ccc" 
            }}
          />
          <button
            type="button"
            onClick={handleSearchButton}
            disabled={!search.trim() || search.length < 2}
            style={{ 
              padding: "8px 16px", 
              backgroundColor: search.trim() && search.length >= 2 ? "#2196F3" : "#ccc", 
              color: "white", 
              border: "none", 
              borderRadius: 4,
              cursor: search.trim() && search.length >= 2 ? "pointer" : "not-allowed"
            }}
          >
            Search
          </button>
        </div>
        {searchError && <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{searchError}</div>}
      </div>

      {/* Patient list */}
      {patientsList.length > 0 && (
        <ul style={{ border: "1px solid #ccc", borderRadius: 4, maxHeight: 150, overflowY: "auto", padding: 0, margin: "0 0 12px 0" }}>
          {patientsList.map((p) => (
            <li
              key={p._id}
              onClick={() => handleSelectPatient(p)}
              style={{ padding: 8, cursor: "pointer", borderBottom: "1px solid #eee", listStyle: "none" }}
            >
              {p.firstName} {p.lastName} ({p.gender}, {p.phone})
            </li>
          ))}
        </ul>
      )}

      {/* Patient ID validation error */}
      <ErrorMessage error={errors.patientId} />

      {/* Selected patient */}
      {selectedPatient && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f0f8ff", border: "1px solid #4CAF50", borderRadius: 6 }}>
          <strong>Selected Patient:</strong>
          <div>Patient ID: {selectedPatient.patientId || selectedPatient._id}</div>
          <div>Name: {selectedPatient.firstName} {selectedPatient.lastName}</div>
          <div>Gender: {selectedPatient.gender}</div>
          <div>Date of Birth: {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : "N/A"}</div>
          <div>Email: {selectedPatient.email}</div>
          <div>Phone: {selectedPatient.phone}</div>
          <div>Blood Group: {selectedPatient.bloodGroup || "N/A"}</div>
          {selectedPatient.allergies?.length > 0 && (
            <div style={{ color: "#d32f2f", fontWeight: "bold" }}>
              ⚠ Allergies: {selectedPatient.allergies.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Date</strong></label>
        <br />
        <input 
          type="date" 
          {...register("date")} 
          onFocus={() => setActiveField("date")} 
           max={new Date().toISOString().split('T')[0]}
           min={new Date().toISOString().split('T')[0]}
          style={{ 
            padding: 8, 
            borderRadius: 4, 
            border: errors.date ? "1px solid red" : "1px solid #ccc", 
            width: "200px" 
          }} 
        />
        <ErrorMessage error={errors.date} />
      </div>

      {/* Diagnosis */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Diagnosis / Symptoms</strong></label>
        <br />
        <textarea 
          {...register("diagnosis")} 
          rows={3} 
          onFocus={() => setActiveField("diagnosis")} 
          placeholder="Enter detailed diagnosis (minimum 3 characters)"
          maxLength={1000}
          style={{ 
            width: "100%", 
            padding: 8, 
            borderRadius: 4, 
            border: errors.diagnosis ? "1px solid red" : "1px solid #ccc" 
          }} 
        />
        <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
          {watchedDiagnosis?.length || 0}/1000 characters
        </div>
        <ErrorMessage error={errors.diagnosis} />
      </div>

      {/* Medicines */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Prescribed Medicines</strong></label>
        {fields.map((f, i) => (
          <div key={f.id} style={{ 
            border: errors.medicines?.[i] ? "1px solid red" : "1px solid #e0e0e0", 
            padding: 12, 
            marginBottom: 8, 
            borderRadius: 6, 
            backgroundColor: "#fafafa" 
          }}>
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: "bold" }}>Medicine #{i + 1}</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <div>
                <input 
                  placeholder="Medicine Name (letters only)" 
                  {...register(`medicines.${i}.name`)} 
                  onFocus={() => setActiveField(`medicines.${i}.name`)}
                  onChange={(e) => {
                    const value = validateNameInput(e.target.value);
                    setValue(`medicines.${i}.name`, value);
                    trigger(`medicines.${i}.name`);
                  }}
                  maxLength={100}
                  style={{ 
                    width: "100%",
                    padding: 6, 
                    borderRadius: 4, 
                    border: errors.medicines?.[i]?.name ? "1px solid red" : "1px solid #ccc" 
                  }} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.name} />
              </div>
              
              <div>
                <input 
                  placeholder="Dosage (e.g., 10mg)" 
                  {...register(`medicines.${i}.dosage`)} 
                  onFocus={() => setActiveField(`medicines.${i}.dosage`)}
                  maxLength={50}
                  style={{ 
                    width: "100%",
                    padding: 6, 
                    borderRadius: 4, 
                    border: errors.medicines?.[i]?.dosage ? "1px solid red" : "1px solid #ccc" 
                  }} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.dosage} />
              </div>
              
              <div>
                <input 
                  placeholder="Frequency (e.g., 3 times daily)" 
                  {...register(`medicines.${i}.frequency`)} 
                  onFocus={() => setActiveField(`medicines.${i}.frequency`)}
                  maxLength={100}
                  style={{ 
                    width: "100%",
                    padding: 6, 
                    borderRadius: 4, 
                    border: errors.medicines?.[i]?.frequency ? "1px solid red" : "1px solid #ccc" 
                  }} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.frequency} />
              </div>
              
              <div>
                <input 
                  placeholder="Duration (e.g., 7 days)" 
                  {...register(`medicines.${i}.duration`)} 
                  onFocus={() => setActiveField(`medicines.${i}.duration`)}
                  maxLength={50}
                  style={{ 
                    width: "100%",
                    padding: 6, 
                    borderRadius: 4, 
                    border: errors.medicines?.[i]?.duration ? "1px solid red" : "1px solid #ccc" 
                  }} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.duration} />
              </div>
              
              <button 
                type="button" 
                onClick={() => remove(i)} 
                disabled={fields.length === 1}
                style={{ 
                  padding: "6px 12px", 
                  backgroundColor: fields.length === 1 ? "#ccc" : "#f44336", 
                  color: "white", 
                  border: "none", 
                  borderRadius: 4, 
                  fontSize: 12,
                  cursor: fields.length === 1 ? "not-allowed" : "pointer"
                }}
              >
                Remove
              </button>
            </div>
            
            <div>
              <input 
                placeholder="Notes (optional)" 
                {...register(`medicines.${i}.notes`)} 
                onFocus={() => setActiveField(`medicines.${i}.notes`)}
                maxLength={500}
                style={{ 
                  width: "100%", 
                  padding: 6, 
                  borderRadius: 4, 
                  border: errors.medicines?.[i]?.notes ? "1px solid red" : "1px solid #ccc", 
                  fontSize: 13 
                }} 
              />
              <ErrorMessage error={errors.medicines?.[i]?.notes} />
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={addMedicine} 
          disabled={fields.length >= 10}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: fields.length >= 10 ? "#ccc" : "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: 4, 
            marginTop: 8,
            cursor: fields.length >= 10 ? "not-allowed" : "pointer"
          }}
        >
          + Add Medicine {fields.length >= 10 ? "(Maximum reached)" : `(${fields.length}/10)`}
        </button>
        <ErrorMessage error={errors.medicines} />
      </div>

      {/* Additional Notes */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Additional Notes & Instructions</strong></label>
        <br />
        <textarea 
          {...register("notes")} 
          rows={3} 
          onFocus={() => setActiveField("notes")} 
          placeholder="Additional instructions for patient (optional)"
          maxLength={1000}
          style={{ 
            width: "100%", 
            padding: 8, 
            borderRadius: 4, 
            border: errors.notes ? "1px solid red" : "1px solid #ccc" 
          }} 
        />
        <div style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
          {watch("notes")?.length || 0}/1000 characters
        </div>
        <ErrorMessage error={errors.notes} />
      </div>

      {/* Doctor Info */}
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 6, border: "1px solid #e0e0e0" }}>
        <label><strong>Prescribing Doctor</strong></label>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <input 
              {...register("doctor.name")} 
              placeholder="Doctor Name" 
              readOnly 
              style={{ 
                width: "100%",
                padding: 8, 
                borderRadius: 4, 
                border: errors.doctor?.name ? "1px solid red" : "1px solid #ccc", 
                backgroundColor: "#f9f9f9" 
              }} 
            />
            <ErrorMessage error={errors.doctor?.name} />
          </div>
          <div style={{ flex: 1 }}>
            <input 
              {...register("doctor.specialization")} 
              placeholder="Specialization" 
              readOnly 
              style={{ 
                width: "100%",
                padding: 8, 
                borderRadius: 4, 
                border: errors.doctor?.specialization ? "1px solid red" : "1px solid #ccc", 
                backgroundColor: "#f9f9f9" 
              }} 
            />
            <ErrorMessage error={errors.doctor?.specialization} />
          </div>
        </div>
      </div>

      {/* Form validation summary */}
      {Object.keys(errors).length > 0 && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          backgroundColor: "#ffebee", 
          border: "1px solid #f44336", 
          borderRadius: 6 
        }}>
          <strong style={{ color: "#d32f2f" }}>⚠ Please fix the following errors:</strong>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: "#d32f2f" }}>
            {Object.keys(errors).map(key => (
              <li key={key} style={{ marginBottom: 4 }}>
                {errors[key]?.message || `${key} field has an error`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button 
          type="submit" 
          disabled={isSubmitting || !isValid || !selectedPatient}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: (isSubmitting || !isValid || !selectedPatient) ? "#ccc" : "#2196F3", 
            color: "white", 
            border: "none", 
            borderRadius: 4, 
            fontSize: 16, 
            fontWeight: "bold",
            cursor: (isSubmitting || !isValid || !selectedPatient) ? "not-allowed" : "pointer"
          }}
        >
          {isSubmitting ? "Saving..." : editingPrescription ? "Update Prescription" : "Save Prescription"}
        </button>
        <button 
          type="button" 
          onClick={() => {
            reset(defaultValues(doctor, selectedPatient));
            setSearch("");
            setSelectedPatient(null);
            setSearchError("");
          }}
          disabled={isSubmitting}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: isSubmitting ? "#ccc" : "#757575", 
            color: "white", 
            border: "none", 
            borderRadius: 4, 
            fontSize: 16,
            cursor: isSubmitting ? "not-allowed" : "pointer"
          }}
        >
          Reset Form
        </button>
      </div>
      {/* PDF Button */}
<div style={{ marginTop: 20 }}>
  <button
    type="button"
    onClick={() => generateProfessionalPDF(
      selectedPatient,
      watchedDiagnosis,
      watchedMedicines,
      watch("notes"),
      doctor,
      watch("date")
    )}
    disabled={!selectedPatient}
    style={{
      padding: "12px 24px",
      backgroundColor: !selectedPatient ? "#ccc" : "#FF5722",
      color: "white",
      border: "none",
      borderRadius: 4,
      fontSize: 16,
      cursor: !selectedPatient ? "not-allowed" : "pointer",
      marginRight: 12,
    }}
  >
    Generate PDF
  </button>
</div>


      {/* Validation help text */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: "#f5f5f5", 
        borderRadius: 6, 
        border: "1px solid #e0e0e0",
        fontSize: 12,
        color: "#666"
      }}>
        <strong>Validation Guidelines:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li><strong>Medicine Names:</strong> Only letters, spaces, hyphens, apostrophes allowed. No numbers.</li>
          <li><strong>Dosage:</strong> Must include a number and unit (e.g., "10mg", "2 tablets", "5ml")</li>
          <li><strong>Frequency:</strong> Use formats like "3 times daily", "twice daily", "once per day"</li>
          <li><strong>Duration:</strong> Use formats like "7 days", "2 weeks", "1 month" (maximum 5 years)</li>
          <li><strong>Patient Search:</strong> Only letters, spaces, hyphens, apostrophes allowed</li>
          <li><strong>Date:</strong> Cannot be in future or more than 30 days in past</li>
          <li><strong>Maximum Limits:</strong> 10 medicines per prescription, 1000 characters for diagnosis/notes</li>
        </ul>
      </div>
    </form>
  );
};

export default PrescriptionForm;