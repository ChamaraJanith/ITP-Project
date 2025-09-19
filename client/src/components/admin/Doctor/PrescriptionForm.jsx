// PrescriptionForm.js
import React, { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createPrescription, updatePrescription } from "../../../services/prescriptionService";
import { jsPDF } from "jspdf";
import SignaturePad from "./SignPad";
import PatientAutocomplete from "./PatientAutocomplete";
import MedicineAutocomplete from "./MedicineAutocomplete";
import LoadingSpinner from "./LoadingSpinner";
import "./PrescriptionForm.css";

// Medicine database with common medications
const medicineDatabase = [
  { name: "Paracetamol", dosage: "500mg", frequency: "3 times daily", duration: "5 days" },
  { name: "Ibuprofen", dosage: "400mg", frequency: "3 times daily", duration: "7 days" },
  { name: "Amoxicillin", dosage: "500mg", frequency: "3 times daily", duration: "10 days" },
  { name: "Omeprazole", dosage: "20mg", frequency: "once daily", duration: "14 days" },
  { name: "Metformin", dosage: "500mg", frequency: "twice daily", duration: "30 days" },
  { name: "Atorvastatin", dosage: "10mg", frequency: "once daily", duration: "30 days" },
  { name: "Lisinopril", dosage: "10mg", frequency: "once daily", duration: "30 days" },
  { name: "Salbutamol", dosage: "100mcg", frequency: "as needed", duration: "30 days" },
  { name: "Cetirizine", dosage: "10mg", frequency: "once daily", duration: "7 days" },
  { name: "Metronidazole", dosage: "400mg", frequency: "3 times daily", duration: "7 days" },
];

// Custom validation patterns
const namePattern = /^[a-zA-Z\s\-'.]+$/;
const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
      const allowedPattern = /^[a-zA-Z0-9\s\&-_.,;:!?'"()[\]{}]+$/;
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
  
  // Add doctor validation
  doctor: yup.object({
    name: yup.string().required("Doctor name is required"),
    specialization: yup.string().required("Doctor specialization is required"),
  }),
});

// Updated defaultValues function to include doctor
const defaultValues = (patient, doctor) => ({
  date: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  medicines: [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }],
  notes: "",
  patientId: patient?._id || "",
  doctor: {
    name: doctor?.name || "Dr. Gayath Dahanayaka",
    specialization: doctor?.specialization || "General",
  },
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

// Dosage validation - allow numbers, decimal points, and units
const validateDosageInput = (value) => {
  return value.replace(/[^0-9.\smgmltabletcapsuledropstsp tbspunitunits]/gi, '');
};

// Frequency validation - allow numbers, spaces, and time-related words
const validateFrequencyInput = (value) => {
  return value.replace(/[^a-zA-Z0-9\s\/\-\.\(\)]/g, '');
};

// Duration validation - allow numbers and time units
const validateDurationInput = (value) => {
  return value.replace(/[^0-9\sdayweekmonthyear]/gi, '');
};

// Notes validation - allow alphanumeric and common punctuation
const validateNotesInput = (value) => {
  return value.replace(/[^a-zA-Z0-9\s\&-_.,;:!?'"()[\]{}]/g, '');
};

const PrescriptionForm = ({
  doctor: initialDoctor,
  parentPatient,
  ocrTextFromCanvas,
  onSaved,
  editingPrescription,
  prescriptions,
  scannedPatientId,
  hospitalLogo, // Added hospital logo prop
}) => {
  // State for doctor information with fallback values from controller
  const [doctor, setDoctor] = useState(initialDoctor || {
    id: "TEMP_DOCTOR_ID",
    name: "Dr. Gayath Dahanayaka",
    specialization: "General",
  });
  
  const [signature, setSignature] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const signatureRef = useRef(null);
  
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
    defaultValues: defaultValues(parentPatient, doctor),
    mode: "onChange",
  });

  // Set doctor values in form when doctor state changes
  useEffect(() => {
    if (doctor) {
      setValue("doctor.name", doctor.name);
      setValue("doctor.specialization", doctor.specialization);
      console.log("Setting doctor values in form:", doctor);
    }
  }, [doctor, setValue]);

  // Set doctor values when editing prescription
  useEffect(() => {
    if (editingPrescription) {
      const doctorName = editingPrescription.doctorName || doctor?.name || "Dr. Gayath Dahanayaka";
      const doctorSpecialization = editingPrescription.doctorSpecialization || doctor?.specialization || "General";
      
      setValue("doctor.name", doctorName);
      setValue("doctor.specialization", doctorSpecialization);
      
      console.log("Setting doctor values from editing prescription:", { doctorName, doctorSpecialization });
    }
  }, [editingPrescription, doctor, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: "medicines" });

  const [activeField, setActiveField] = useState(null);
  const [search, setSearch] = useState("");
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(parentPatient || null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
        setIsSearching(true);
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
      } finally {
        setIsSearching(false);
      }
    };

    fetchScannedPatient();
  }, [scannedPatientId, selectedPatient]);

  // Prefill form for editing
  useEffect(() => {
    if (!editingPrescription) return;

    // FIXED: Ensure patientId is properly set from multiple sources
    const patientId = editingPrescription.patientId || 
                      editingPrescription.patient?._id || 
                      editingPrescription.patient?.patientId || 
                      "";

    console.log("Editing prescription with patientId:", patientId);

    reset({
      date: editingPrescription.date?.slice(0, 10) || "",
      diagnosis: editingPrescription.diagnosis || "",
      medicines: editingPrescription.medicines?.length
        ? editingPrescription.medicines
        : [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }],
      notes: editingPrescription.notes || "",
      patientId: patientId,
      doctor: {
        name: editingPrescription.doctorName || doctor?.name || "Dr. Gayath Dahanayaka",
        specialization: editingPrescription.doctorSpecialization || doctor?.specialization || "General",
      },
    });

    // FIXED: Set selectedPatient immediately if available in prescription
    if (editingPrescription.patient) {
      const patient = editingPrescription.patient;
      setSelectedPatient(patient);
      setSearch(`${patient.firstName} ${patient.lastName} ${patient.patientId || patient._id}`);
    } else if (patientId) {
      // Fetch full patient info for dateOfBirth and other fields
      fetch(`http://localhost:7000/api/patients/${patientId}`)
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
    }
  }, [editingPrescription, reset, doctor]);

  // FIXED: Trigger validation after setting patient in editing mode
  useEffect(() => {
    if (editingPrescription && selectedPatient) {
      trigger("patientId");
      console.log("Triggered validation for patientId in editing mode");
    }
  }, [selectedPatient, editingPrescription, trigger]);

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

    try {
      setIsSearching(true);
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
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    if (!patient.patientId && !patient._id) {
      setSearchError("Invalid patient data");
      return;
    }

    const patientId = patient.patientId || patient._id;
    setSelectedPatient(patient);
    setValue("patientId", patientId);
    setSearch(`${patient.firstName} ${patient.lastName} (${patientId})`);
    setPatientsList([]);
    setSearchError("");
    trigger("patientId");
  };

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
      setValue("patientId", parentPatient.patientId || parentPatient._id);
      setSearch(`${parentPatient.firstName} ${parentPatient.lastName}`);
    }
  }, [parentPatient, setValue]);

  // OCR text integration with validation
  useEffect(() => {
    if (!ocrTextFromCanvas || !activeField) return;
    
    let processedValue = ocrTextFromCanvas;
    
    if (activeField.includes('name') && activeField.includes('medicines')) {
      processedValue = validateNameInput(ocrTextFromCanvas);
    } else if (activeField.includes('dosage')) {
      processedValue = ocrTextFromCanvas;
    }
    
    setValue(activeField, processedValue);
    trigger(activeField);
  }, [ocrTextFromCanvas, activeField, setValue, trigger]);

  // Enhanced form submission with final validation
  const onSubmit = async (data) => {
    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }

    const totalMedicines = data.medicines.length;
    if (totalMedicines > 10) {
      alert("Cannot prescribe more than 10 medicines at once.");
      return;
    }

    // Check for drug interactions
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
      setIsSaving(true);
      
      // Get signature if available
      const signatureData = signatureRef.current ? signatureRef.current.getSignature() : null;
      
      const payload = {
        date: data.date,
        diagnosis: data.diagnosis,
        medicines: data.medicines,
        notes: data.notes,
        patientId: selectedPatient.patientId || selectedPatient._id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientEmail: selectedPatient.email,
        patientPhone: selectedPatient.phone,
        patientGender: selectedPatient.gender,
        bloodGroup: selectedPatient.bloodGroup,
        patientAllergies: selectedPatient.allergies,
        doctorId: doctor.id,
        doctorName: data.doctor.name,
        doctorSpecialization: data.doctor.specialization,
        signature: signatureData
      };

      let res;
      if (editingPrescription) {
        // FIXED: Ensure we have the prescription ID
        const prescriptionId = editingPrescription._id || editingPrescription.id;
        if (!prescriptionId) {
          alert("Error: Prescription ID is missing for update.");
          return;
        }
        
        // FIXED: Use the correct ID for update
        res = await updatePrescription(prescriptionId, payload);
        alert("Prescription updated successfully.");
        
        // FIXED: Clear form after update
        reset(defaultValues(null, doctor));
        setSearch("");
        setSelectedPatient(null);
        setSignature(null);
      } else {
        res = await createPrescription(payload);
        alert("Prescription saved successfully.");
        
        // FIXED: Clear form after create
        reset(defaultValues(null, doctor));
        setSearch("");
        setSelectedPatient(null);
        setSignature(null);
      }

      if (onSaved) onSaved(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to save prescription.");
    } finally {
      setIsSaving(false);
    }
  };

  const addMedicine = () => {
    if (fields.length >= 10) {
      alert("Cannot add more than 10 medicines");
      return;
    }
    append({ name: "", dosage: "", frequency: "", duration: "", notes: "" });
  };

  // Handle medicine selection from autocomplete
  const handleMedicineSelect = (index, medicine) => {
    setValue(`medicines.${index}.name`, medicine.name);
    setValue(`medicines.${index}.dosage`, medicine.dosage);
    setValue(`medicines.${index}.frequency`, medicine.frequency);
    setValue(`medicines.${index}.duration`, medicine.duration);
    trigger(`medicines.${index}`);
  };

  // Enhanced PDF generation function
  const generateProfessionalPDF = (selectedPatient, diagnosis, medicines, additionalNotes, doctor, date) => {
    if (!selectedPatient) {
      alert("Please select a patient to generate PDF");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const usableWidth = pageWidth - margin * 2;
      let y = 15;

      // Add a light blue background for the entire page
      doc.setFillColor(245, 250, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Watermark
      doc.setFontSize(70);
      doc.setTextColor(220, 220, 220);
      doc.setFont("helvetica", "bold");
      doc.text('PRESCRIPTION', pageWidth/2, pageHeight/2, {align: 'center', angle: 45});
      doc.setTextColor(0,0,0);

      // Header with clinic information in a box
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(1);
      doc.rect(margin, y, usableWidth, 30, 'FD');
      
      // Add hospital logo if available
      if (hospitalLogo) {
        try {
          // Position logo on the right side of the header
          doc.addImage(hospitalLogo, 'PNG', pageWidth - margin - 40, y + 5, 30, 20);
        } catch (e) {
          console.error("Error adding hospital logo to PDF:", e);
        }
      }
      
      // Clinic name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(25, 25, 112);
      doc.text("HealIX Healthcare Center", margin + 5, y + 12);
      
      // Clinic details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("123 Medical Avenue, Health City, HC 12345", margin + 5, y + 20);
      doc.text("Phone: (123) 456-7890 | Fax: (123) 456-7891", margin + 5, y + 25);
      doc.text("Email: contact@healix.com | Web: www.healix.com", margin + 5, y + 30);
      
      y += 40;

      // Prescription title and ID in a box
      doc.setFillColor(70, 130, 180);
      doc.setDrawColor(70, 130, 180);
      doc.rect(margin, y, usableWidth, 12, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("PRESCRIPTION", margin + 5, y + 8);
      
      const prescriptionId = `RX-${Date.now().toString(36).toUpperCase()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`ID: ${prescriptionId}`, pageWidth - margin - 5, y + 8, {align: 'right'});
      
      y += 18;

      // Date and time
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date || now.toISOString().slice(0, 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date: ${dateStr} | Time: ${timeStr}`, margin, y);
      y += 8;

      // Patient information section
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, usableWidth, 35, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(25, 25, 112);
      doc.text("PATIENT INFORMATION", margin + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const patientName = `${selectedPatient.firstName || ""} ${selectedPatient.lastName || ""}`.trim();
      doc.text(`Name: ${patientName}`, margin + 5, y + 17);
      doc.text(`ID: ${selectedPatient._id || selectedPatient.patientId || "N/A"}`, margin + 70, y + 17);
      
      doc.text(`Gender: ${selectedPatient.gender || "N/A"}`, margin + 5, y + 24);
      doc.text(`DOB: ${selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : "N/A"}`, margin + 70, y + 24);
      
      doc.text(`Contact: ${selectedPatient.phone || "N/A"}`, margin + 5, y + 31);
      doc.text(`Email: ${selectedPatient.email || "N/A"}`, margin + 70, y + 31);
      
      // Allergies warning if present
      if (selectedPatient.allergies && selectedPatient.allergies.length > 0) {
        doc.setTextColor(160, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`⚠ ALLERGIES: ${selectedPatient.allergies.join(", ")}`, margin + 5, y + 38);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        y += 45;
      } else {
        y += 40;
      }

      // Doctor information section
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.rect(margin, y, usableWidth, 20, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(25, 25, 112);
      doc.text("PRESCRIBING DOCTOR", margin + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${doctor?.name || "N/A"}`, margin + 5, y + 17);
      doc.text(`Specialization: ${doctor?.specialization || "N/A"}`, margin + 70, y + 17);
      
      y += 25;

      // Diagnosis section
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.rect(margin, y, usableWidth, 25, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(25, 25, 112);
      doc.text("DIAGNOSIS", margin + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const diagLines = doc.splitTextToSize(diagnosis || "N/A", usableWidth - 10);
      let diagY = y + 17;
      diagLines.forEach(line => {
        doc.text(line, margin + 5, diagY);
        diagY += 5;
      });
      
      y += 30;

      // Medications table
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.rect(margin, y, usableWidth, 15, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(25, 25, 112);
      doc.text("MEDICATIONS", margin + 5, y + 10);
      
      y += 18;

      // Table headers
      doc.setFontSize(9);
      const colWidths = [8, 45, 25, 30, 25, 32]; // Adjusted column widths
      const headers = ["S/N", "Medicine", "Dosage", "Frequency", "Duration", "Notes"];
      const headerHeight = 8;
      
      // Draw header background
      doc.setFillColor(173, 216, 230);
      doc.rect(margin, y, usableWidth, headerHeight, "F");
      
      // Draw header borders and text
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(0.3);
      let x = margin;
      for (let i = 0; i < headers.length; i++) {
        doc.rect(x, y, colWidths[i], headerHeight);
        doc.text(headers[i], x + 2, y + 5);
        x += colWidths[i];
      }
      y += headerHeight;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const rowPadding = 2;
      (medicines || []).forEach((med, idx) => {
        const rowTexts = [
          [(idx + 1).toString()],
          doc.splitTextToSize(med.name || "", colWidths[1] - rowPadding),
          doc.splitTextToSize(med.dosage || "", colWidths[2] - rowPadding),
          doc.splitTextToSize(med.frequency || "", colWidths[3] - rowPadding),
          doc.splitTextToSize(med.duration || "", colWidths[4] - rowPadding),
          doc.splitTextToSize(med.notes || "", colWidths[5] - rowPadding),
        ];

        const maxLines = Math.max(...rowTexts.map(c => c.length));
        const lineHeight = 4.5;
        const rowHeight = Math.max(7, maxLines * lineHeight + 4);

        // Check if we need a new page
        if (y + rowHeight > 270) {
          doc.addPage();
          y = 15;
          
          // Redraw header on new page
          doc.setFillColor(240, 248, 255);
          doc.rect(margin, y, usableWidth, 15, 'FD');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(25, 25, 112);
          doc.text("MEDICATIONS (Continued)", margin + 5, y + 10);
          
          y += 18;
          
          // Redraw table header
          doc.setFillColor(173, 216, 230);
          doc.rect(margin, y, usableWidth, headerHeight, "F");
          x = margin;
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          for (let i = 0; i < headers.length; i++) {
            doc.rect(x, y, colWidths[i], headerHeight);
            doc.text(headers[i], x + 2, y + 5);
            x += colWidths[i];
          }
          y += headerHeight;
          doc.setFont("helvetica", "normal");
        }

        // Draw row borders
        x = margin;
        for (let c = 0; c < rowTexts.length; c++) {
          doc.rect(x, y, colWidths[c], rowHeight);
          x += colWidths[c];
        }

        // Fill row data
        x = margin;
        for (let c = 0; c < rowTexts.length; c++) {
          const lines = rowTexts[c];
          for (let li = 0; li < lines.length; li++) {
            const textY = y + 4 + li * lineHeight;
            doc.text(String(lines[li] || ""), x + 2, textY);
          }
          x += colWidths[c];
        }

        y += rowHeight;
      });

      y += 10;

      // Additional instructions
      if (additionalNotes) {
        doc.setFillColor(240, 248, 255);
        doc.setDrawColor(70, 130, 180);
        doc.rect(margin, y, usableWidth, 25, 'FD');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 25, 112);
        doc.text("ADDITIONAL INSTRUCTIONS", margin + 5, y + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const noteLines = doc.splitTextToSize(additionalNotes, usableWidth - 10);
        let noteY = y + 17;
        noteLines.forEach(line => {
          doc.text(line, margin + 5, noteY);
          noteY += 5;
        });
        
        y += 30;
      }

      // Signature section
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.rect(margin, y, usableWidth, 45, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(25, 25, 112);
      doc.text("DOCTOR'S SIGNATURE", margin + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Signature line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin + 5, y + 25, margin + 55, y + 25);
      
      // Doctor's name and specialization
      doc.text(`${doctor?.name || "Doctor"}`, margin + 5, y + 32);
      doc.text(`${doctor?.specialization || ""}`, margin + 5, y + 38);
      
      // Add signature image if available
      if (signature) {
        try {
          doc.addImage(signature, 'PNG', margin + 5, y + 12, 40, 15);
        } catch (e) {
          console.error("Error adding signature to PDF:", e);
        }
      }
      
      // Date of signature
      const signatureDate = new Date().toLocaleDateString();
      doc.text(`Date: ${signatureDate}`, margin + 70, y + 25);
      
      y += 55;

      // Footer with disclaimer
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.rect(margin, y, usableWidth, 15, 'FD');
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("This is a computer-generated prescription. Valid only with doctor's signature.", margin + 5, y + 6);
      doc.text("HealIX Healthcare Center - (123) 456-7890 - contact@healix.com", pageWidth/2, y + 12, {align: 'center'});

      // Add a border around the entire page
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      // Save file
      const safeFirst = (selectedPatient.firstName || "Patient").replace(/\s+/g, "_");
      const safeLast = (selectedPatient.lastName || "").replace(/\s+/g, "_");
      const fileDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
      doc.save(`Prescription_${safeFirst}_${safeLast}_${fileDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Error display component
  const ErrorMessage = ({ error }) => (
    error ? <div className="pf-error-message">{error.message}</div> : null
  );

  // Reset form handler
  const handleReset = () => {
    reset(defaultValues(null, doctor));
    setSearch("");
    setSelectedPatient(null);
    setSearchError("");
    setSignature(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pf-form">
      {/* Today's prescriptions count */}
      {prescriptions && (
        <div className="pf-stats-card">
          <div className="pf-stat-content">
            <div className="pf-stat-icon">📋</div>
            <div>
              <div className="pf-stat-title">Today's Prescriptions</div>
              <div className="pf-stat-value">{todaysPrescriptions.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Patient search with autocomplete */}
      <div className="pf-section">
        <label className="pf-label">Patient Search</label>
        <PatientAutocomplete
          search={search}
          onSearchChange={handleSearchChange}
          onSearch={handleSearchButton}
          patientsList={patientsList}
          onSelectPatient={handleSelectPatient}
          searchError={searchError}
          isSearching={isSearching}
        />
      </div>

      {/* Patient ID validation error */}
      <ErrorMessage error={errors.patientId} />

      {/* Selected patient */}
      {selectedPatient && (
        <div className="pf-selected-patient">
          <div className="pf-selected-patient-header">
            <div className="pf-selected-patient-title">Selected Patient</div>
            <div className="pf-selected-patient-id">
              ID: {selectedPatient.patientId || selectedPatient._id}
            </div>
          </div>
          <div className="pf-patient-info-grid">
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Name:</span>
              <span>{selectedPatient.firstName} {selectedPatient.lastName}</span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Gender:</span>
              <span>{selectedPatient.gender}</span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">DOB:</span>
              <span>
                {selectedPatient.dateOfBirth 
                  ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() 
                  : "N/A"}
              </span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Email:</span>
              <span>{selectedPatient.email}</span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Phone:</span>
              <span>{selectedPatient.phone}</span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Blood Group:</span>
              <span>{selectedPatient.bloodGroup || "N/A"}</span>
            </div>
          </div>
          {selectedPatient.allergies?.length > 0 && (
            <div className="pf-patient-allergies">
              <span className="pf-patient-info-label">Allergies:</span>
              <span>{selectedPatient.allergies.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div className="pf-section">
        <label className="pf-label">Date</label>
        <input 
          type="date" 
          {...register("date")} 
          onFocus={() => setActiveField("date")} 
          // max={new Date().toISOString().split('T')[0]}
          // min={new Date().toISOString().split('T')[0]}
          className={`pf-input ${errors.date ? 'pf-error' : ''}`} 
        />
        <ErrorMessage error={errors.date} />
      </div>

      {/* Diagnosis */}
      <div className="pf-section">
        <label className="pf-label">Diagnosis / Symptoms</label>
        <textarea 
          {...register("diagnosis")} 
          rows={3} 
          onFocus={() => setActiveField("diagnosis")} 
          placeholder="Enter detailed diagnosis (minimum 3 characters)"
          maxLength={1000}
          className={`pf-textarea ${errors.diagnosis ? 'pf-error' : ''}`} 
        />
        <div className="pf-character-count">
          {watchedDiagnosis?.length || 0}/1000 characters
        </div>
        <ErrorMessage error={errors.diagnosis} />
      </div>

      {/* Medicines */}
      <div className="pf-section">
        <label className="pf-label">Prescribed Medicines</label>
        {fields.map((f, i) => (
          <div key={f.id} className={`pf-medicine-card ${errors.medicines?.[i] ? 'pf-error' : ''}`}>
            <div className="pf-medicine-header">
              <div className="pf-medicine-title">Medicine #{i + 1}</div>
              <button 
                type="button" 
                onClick={() => remove(i)} 
                disabled={fields.length === 1}
                className="pf-button pf-remove-button"
              >
                Remove
              </button>
            </div>
            
            <div className="pf-medicine-grid">
              <div className="pf-medicine-field">
                <label className="pf-field-label">Medicine Name</label>
                <MedicineAutocomplete
                  value={watchedMedicines?.[i]?.name || ""}
                  onSelect={(medicine) => handleMedicineSelect(i, medicine)}
                  medicines={medicineDatabase}
                  onChange={(value) => {
                    setValue(`medicines.${i}.name`, value);
                    trigger(`medicines.${i}.name`);
                  }}
                  error={errors.medicines?.[i]?.name}
                />
              </div>
              
              <div className="pf-medicine-field">
                <label className="pf-field-label">Dosage</label>
                <input 
                  placeholder="Dosage (e.g., 10mg)" 
                  value={watchedMedicines?.[i]?.dosage || ""}
                  onChange={(e) => {
                    const validatedValue = validateDosageInput(e.target.value);
                    setValue(`medicines.${i}.dosage`, validatedValue);
                    trigger(`medicines.${i}.dosage`);
                  }}
                  onFocus={() => setActiveField(`medicines.${i}.dosage`)}
                  maxLength={50}
                  className={`pf-input ${errors.medicines?.[i]?.dosage ? 'pf-error' : ''}`} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.dosage} />
              </div>
              
              <div className="pf-medicine-field">
                <label className="pf-field-label">Frequency</label>
                <input 
                  placeholder="Frequency (e.g., 3 times daily)" 
                  value={watchedMedicines?.[i]?.frequency || ""}
                  onChange={(e) => {
                    const validatedValue = validateFrequencyInput(e.target.value);
                    setValue(`medicines.${i}.frequency`, validatedValue);
                    trigger(`medicines.${i}.frequency`);
                  }}
                  onFocus={() => setActiveField(`medicines.${i}.frequency`)}
                  maxLength={100}
                  className={`pf-input ${errors.medicines?.[i]?.frequency ? 'pf-error' : ''}`} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.frequency} />
              </div>
              
              <div className="pf-medicine-field">
                <label className="pf-field-label">Duration</label>
                <input 
                  placeholder="Duration (e.g., 7 days)" 
                  value={watchedMedicines?.[i]?.duration || ""}
                  onChange={(e) => {
                    const validatedValue = validateDurationInput(e.target.value);
                    setValue(`medicines.${i}.duration`, validatedValue);
                    trigger(`medicines.${i}.duration`);
                  }}
                  onFocus={() => setActiveField(`medicines.${i}.duration`)}
                  maxLength={50}
                  className={`pf-input ${errors.medicines?.[i]?.duration ? 'pf-error' : ''}`} 
                />
                <ErrorMessage error={errors.medicines?.[i]?.duration} />
              </div>
            </div>
            
            <div className="pf-medicine-field">
              <label className="pf-field-label">Notes (optional)</label>
              <input 
                placeholder="Additional notes" 
                value={watchedMedicines?.[i]?.notes || ""}
                onChange={(e) => {
                  const validatedValue = validateNotesInput(e.target.value);
                  setValue(`medicines.${i}.notes`, validatedValue);
                  trigger(`medicines.${i}.notes`);
                }}
                onFocus={() => setActiveField(`medicines.${i}.notes`)}
                maxLength={500}
                className={`pf-input ${errors.medicines?.[i]?.notes ? 'pf-error' : ''}`} 
              />
              <ErrorMessage error={errors.medicines?.[i]?.notes} />
            </div>
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={addMedicine} 
          disabled={fields.length >= 10}
          className="pf-button pf-add-button"
        >
          + Add Medicine {fields.length >= 10 ? "(Maximum reached)" : `(${fields.length}/10)`}
        </button>
        <ErrorMessage error={errors.medicines} />
      </div>

      {/* Additional Notes */}
      <div className="pf-section">
        <label className="pf-label">Additional Notes & Instructions</label>
        <textarea 
          value={watch("notes") || ""}
          onChange={(e) => {
            const validatedValue = validateNotesInput(e.target.value);
            setValue("notes", validatedValue);
            trigger("notes");
          }}
          rows={3} 
          onFocus={() => setActiveField("notes")} 
          placeholder="Additional instructions for patient (optional)"
          maxLength={1000}
          className={`pf-textarea ${errors.notes ? 'pf-error' : ''}`} 
        />
        <div className="pf-character-count">
          {watch("notes")?.length || 0}/1000 characters
        </div>
        <ErrorMessage error={errors.notes} />
      </div>

      {/* Doctor Info */}
      <div className="pf-doctor-info">
        <label className="pf-label">Prescribing Doctor</label>
        <div className="pf-doctor-grid">
          <div className="pf-doctor-field">
            <label className="pf-field-label">Name</label>
            <input 
              value={doctor.name}
              readOnly
              className="pf-input pf-readonly" 
            />
          </div>
          <div className="pf-doctor-field">
            <label className="pf-field-label">Specialization</label>
            <input 
              value={doctor.specialization}
              readOnly
              className="pf-input pf-readonly" 
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="pf-section">
        <label className="pf-label">Doctor's Signature</label>
        <div className="pf-signature-container">
          <SignaturePad 
            ref={signatureRef}
            onChange={setSignature}
            width="100%"
            height="150px"
          />
          <button 
            type="button" 
            onClick={() => {
              if (signatureRef.current) {
                signatureRef.current.clear();
                setSignature(null);
              }
            }}
            className="pf-button pf-clear-signature-button"
          >
            Clear Signature
          </button>
        </div>
      </div>

      {/* Form validation summary */}
      {Object.keys(errors).length > 0 && (
        <div className="pf-validation-summary">
          <div className="pf-validation-title">⚠ Please fix the following errors:</div>
          <ul className="pf-validation-list">
            {Object.keys(errors).map(key => (
              <li key={key} className="pf-validation-item">
                {errors[key]?.message || `${key} field has an error`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons */}
      <div className="pf-button-group">
        <button 
          type="submit" 
          disabled={isSubmitting || isSaving || (!isValid && !editingPrescription) || !selectedPatient}
          className="pf-button pf-primary-button"
        >
          {isSaving ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : editingPrescription ? "Update Prescription" : "Save Prescription"}
        </button>
        <button 
          type="button" 
          onClick={handleReset}
          disabled={isSubmitting || isSaving}
          className="pf-button pf-secondary-button"
        >
          Reset Form
        </button>
      </div>
      
      {/* PDF Button */}
      <div className="pf-pdf-section">
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
          disabled={!selectedPatient || isGeneratingPDF}
          className="pf-button pf-pdf-button"
        >
          {isGeneratingPDF ? (
            <>
              <LoadingSpinner />
              Generating PDF...
            </>
          ) : (
            <>
              📄 Generate PDF
            </>
          )}
        </button>
      </div>

      {/* Print Button */}
      <div className="pf-print-section">
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!selectedPatient}
          className="pf-button pf-print-button"
        >
          🖨️ Print Prescription
        </button>
      </div>

      {/* Validation help text */}
      <div className="pf-guidelines">
        <div className="pf-guidelines-title">Validation Guidelines:</div>
        <ul className="pf-guidelines-list">
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