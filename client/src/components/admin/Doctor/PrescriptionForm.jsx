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
import healXLogo from '../../../assets/heal-x-logo.png'; // Import your logo

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
  patientId: patient?._id || patient?.patientId || "",
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

const validateDosageInput = (value) => {
  return value.replace(/[^0-9.\smgmltabletcapsuledropstsp tbspunitunits]/gi, '');
};

const validateFrequencyInput = (value) => {
  return value.replace(/[^a-zA-Z0-9\s\/\-\.\(\)]/g, '');
};

const validateDurationInput = (value) => {
  return value.replace(/[^0-9\sdayweekmonthyear]/gi, '');
};

const validateNotesInput = (value) => {
  return value.replace(/[^a-zA-Z0-9\s\&-_.,;:!?'"()[\]{}]/g, '');
};

// Function to calculate age from date of birth
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

// PROFESSIONAL: Standard Medical Prescription PDF generation
const generatePDFBuffer = (selectedPatient, diagnosis, medicines, additionalNotes, doctor, date, signature, hospitalLogo) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const usableWidth = pageWidth - margin * 2;
      let y = 10;

      // Clean white background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Professional Header with Medical Practice Information
      // Top border in medical blue
      doc.setFillColor(0, 51, 102); // Medical blue
      doc.rect(0, 0, pageWidth, 3, 'F');

      // Logo and Practice Information - Fixed logo handling
      try {
        if (hospitalLogo) {
          // For imported images, we need to convert to data URL first
          const img = new Image();
          img.src = hospitalLogo;
          
          // Calculate appropriate logo size (30mm width, maintaining aspect ratio)
          const logoWidth = 30;
          const logoHeight = (img.height / img.width) * logoWidth;
          
          // Add logo to PDF
          doc.addImage(hospitalLogo, 'PNG', margin, y, logoWidth, logoHeight);
        }
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
        
        // Fallback: Add text-based logo if image fails
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(0, 51, 102);
        doc.text("HEAL X", margin, y + 10);
        doc.setFontSize(12);
        doc.text("Healthcare Center", margin, y + 18);
      }

      // Practice Name and Information - Adjusted position based on logo
      const logoWidth = 30; // Same as above
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text("HealX Healthcare Center", margin + logoWidth + 10, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text("123 Healthcare Avenue, Medical District, MD 12345", margin + logoWidth + 10, y + 14);
      doc.text("Tel: (555) 123-4567 | Fax: (555) 123-4568", margin + logoWidth + 10, y + 18);
      doc.text("Email: info@healxmedical.com | Web: www.healxmedical.com", margin + logoWidth + 10, y + 22);
      
      y += 28;

      // Prescription Header with Rx Symbol
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      
      // Rx Symbol in circle (standard medical prescription symbol)
      doc.setFillColor(0, 51, 102);
      doc.circle(margin + 8, y + 8, 6, 'FD');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Rx", margin + 8, y + 11, { align: 'center' });
      
      // Prescription Title
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(18);
      doc.text("PRESCRIPTION", margin + 20, y + 8);
      
      // Prescription Number and Date
      const prescriptionId = `RX-${Date.now().toString(36).toUpperCase()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Prescription #: ${prescriptionId}`, pageWidth - margin - 5, y + 8, { align: 'right' });
      
      const now = new Date();
      const dateStr = date || now.toISOString().slice(0, 10);
      const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Date: ${formattedDate}`, pageWidth - margin - 5, y + 14, { align: 'right' });
      
      // Add generation time
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      doc.text(`Generated: ${formattedTime}`, pageWidth - margin - 5, y + 20, { align: 'right' });
      
      y += 28; // Increased from 22 to 28 to accommodate the time line

      // Patient Information Section
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, usableWidth, 45); // Increased height from 40 to 45
      
      // Patient Information Header
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y, usableWidth, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 51, 102);
      doc.text("PATIENT INFORMATION", margin + 3, y + 5);
      
      // Patient Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const patientName = `${selectedPatient.firstName || ""} ${selectedPatient.lastName || ""}`.trim();
      const patientId = selectedPatient.patientId || selectedPatient._id || "N/A";
      const dob = selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : "N/A";
      const age = selectedPatient.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : "N/A";
      
      // Left column
      doc.text(`Name: ${patientName}`, margin + 3, y + 16);
      doc.text(`ID: ${patientId}`, margin + 3, y + 22);
      doc.text(`Gender: ${selectedPatient.gender || "N/A"}`, margin + 3, y + 28);
      doc.text(`DOB: ${dob}`, margin + 3, y + 34);
      doc.text(`Age: ${age} years`, margin + 3, y + 40);
      
      // Right column
      doc.text(`Phone: ${selectedPatient.phone || "N/A"}`, margin + 80, y + 16);
      doc.text(`Email: ${selectedPatient.email || "N/A"}`, margin + 80, y + 22);
      doc.text(`Blood Type: ${selectedPatient.bloodGroup || "N/A"}`, margin + 80, y + 28);
      
      // Allergies warning if present - moved to right column
      if (selectedPatient.allergies && selectedPatient.allergies.length > 0) {
        doc.setTextColor(200, 0, 0);
        doc.setFont("helvetica", "bold");
        const allergiesText = `ALLERGIES: ${selectedPatient.allergies.join(", ")}`;
        const splitText = doc.splitTextToSize(allergiesText, usableWidth - 85);
        doc.text(splitText, margin + 80, y + 34);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
      }
      
      y += 50; // Increased from 55 to 50 to accommodate the increased height

      // Prescribing Physician Information
      doc.setDrawColor(0, 51, 102);
      doc.rect(margin, y, usableWidth, 25);
      
      // Physician Header
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y, usableWidth, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 51, 102);
      doc.text("PRESCRIBING PHYSICIAN", margin + 3, y + 5);
      
      // Physician Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: Dr. ${doctor?.name || "N/A"}`, margin + 3, y + 16);
      doc.text(`Specialization: ${doctor?.specialization || "N/A"}`, margin + 3, y + 22);
      
      // Standard medical credentials
      doc.text(`License: MD-12345 | DEA: AB1234567 | NPI: 1234567890`, margin + 80, y + 16);
      doc.text(`Phone: (555) 987-6543`, margin + 80, y + 22);
      
      y += 30;

      // Diagnosis Section
      doc.setDrawColor(0, 51, 102);
      doc.rect(margin, y, usableWidth, 25);
      
      // Diagnosis Header
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y, usableWidth, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 51, 102);
      doc.text("DIAGNOSIS / CLINICAL INDICATIONS", margin + 3, y + 5);
      
      // Diagnosis Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const diagLines = doc.splitTextToSize(diagnosis || "N/A", usableWidth - 6);
      let diagY = y + 16;
      diagLines.forEach(line => {
        doc.text(line, margin + 3, diagY);
        diagY += 5;
      });
      
      y += 30;

      // Medications Section
      doc.setDrawColor(0, 51, 102);
      doc.rect(margin, y, usableWidth, 15);
      
      // Medications Header
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y, usableWidth, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 51, 102);
      doc.text("MEDICATION ORDERS", margin + 3, y + 5);
      
      y += 12;

      // Table Headers
      doc.setFontSize(9);
      const colWidths = [8, 35, 20, 30, 25, 40, 27];
      const headers = ["#", "Medication", "Strength", "Dosage", "Frequency", "Duration", "Instructions"];
      const headerHeight = 7;
      
      // Draw header background
      doc.setFillColor(0, 51, 102);
      doc.rect(margin, y, usableWidth, headerHeight, "F");
      
      // Draw header borders and text
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.2);
      let x = margin;
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      for (let i = 0; i < headers.length; i++) {
        doc.rect(x, y, colWidths[i], headerHeight);
        doc.text(headers[i], x + 1, y + 4.5);
        x += colWidths[i];
      }
      y += headerHeight;

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const rowPadding = 1;
      (medicines || []).forEach((med, idx) => {
        const rowTexts = [
          [(idx + 1).toString()],
          doc.splitTextToSize(med.name || "", colWidths[1] - rowPadding),
          [med.dosage?.match(/[0-9]+(\.[0-9]+)?\s*(mg|g|ml|l|tablet|tablets|capsule|capsules|drop|drops|tsp|tbsp|unit|units)?/i)?.[0] || ""],
          doc.splitTextToSize(med.dosage || "", colWidths[3] - rowPadding),
          doc.splitTextToSize(med.frequency || "", colWidths[4] - rowPadding),
          doc.splitTextToSize(med.duration || "", colWidths[5] - rowPadding),
          doc.splitTextToSize(med.notes || "Take as directed", colWidths[6] - rowPadding),
        ];

        const maxLines = Math.max(...rowTexts.map(c => c.length));
        const lineHeight = 4;
        const rowHeight = Math.max(7, maxLines * lineHeight + 3);

        // Check if we need a new page
        if (y + rowHeight > 260) {
          doc.addPage();
          y = 15;
          
          // Redraw header on new page
          doc.setFillColor(240, 248, 255);
          doc.rect(margin, y, usableWidth, 15, 'FD');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(0, 51, 102);
          doc.text("MEDICATION ORDERS (Continued)", margin + 3, y + 5);
          
          y += 12;
          
          // Redraw table header
          doc.setFillColor(0, 51, 102);
          doc.rect(margin, y, usableWidth, headerHeight, "F");
          x = margin;
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          for (let i = 0; i < headers.length; i++) {
            doc.rect(x, y, colWidths[i], headerHeight);
            doc.text(headers[i], x + 1, y + 4.5);
            x += colWidths[i];
          }
          y += headerHeight;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
        }

        // Draw row borders with alternating background
        x = margin;
        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(x, y, usableWidth, rowHeight, "F");
        }
        
        for (let c = 0; c < rowTexts.length; c++) {
          doc.rect(x, y, colWidths[c], rowHeight);
          x += colWidths[c];
        }

        // Fill row data
        x = margin;
        for (let c = 0; c < rowTexts.length; c++) {
          const lines = rowTexts[c];
          for (let li = 0; li < lines.length; li++) {
            const textY = y + 3 + li * lineHeight;
            doc.text(String(lines[li] || ""), x + 1, textY);
          }
          x += colWidths[c];
        }

        y += rowHeight;
      });

      y += 10;

      // Additional Instructions
      if (additionalNotes) {
        doc.setDrawColor(0, 51, 102);
        doc.rect(margin, y, usableWidth, 25);
        
        // Instructions Header
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, y, usableWidth, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 51, 102);
        doc.text("ADDITIONAL INSTRUCTIONS", margin + 3, y + 5);
        
        // Instructions Details
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const noteLines = doc.splitTextToSize(additionalNotes, usableWidth - 6);
        let noteY = y + 16;
        noteLines.forEach(line => {
          doc.text(line, margin + 3, noteY);
          noteY += 5;
        });
        
        y += 30;
      }

      // Signature and Authorization Section
      doc.setDrawColor(0, 51, 102);
      doc.rect(margin, y, usableWidth, 50);
      
      // Signature Header
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, y, usableWidth, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 51, 102);
      doc.text("PHYSICIAN SIGNATURE & AUTHORIZATION", margin + 3, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Signature line
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.line(margin + 3, y + 25, margin + 50, y + 25);
      
      // Physician information
      doc.text(`Dr. ${doctor?.name || "N/A"}`, margin + 3, y + 32);
      doc.text(`${doctor?.specialization || "N/A"}`, margin + 3, y + 37);
      doc.text(`License: MD-12345`, margin + 3, y + 42);
      
      // Add signature image if available
      if (signature) {
        try {
          doc.addImage(signature, 'PNG', margin + 3, y + 12, 35, 12);
        } catch (e) {
          console.error("Error adding signature to PDF:", e);
        }
      }
      
      // Date and Refill information
      const signatureDate = new Date().toLocaleDateString();
      doc.text(`Date: ${signatureDate}`, margin + 60, y + 25);
      doc.text("Refills: 0", margin + 60, y + 32);
      doc.text("Substitution: Permitted", margin + 60, y + 37);
      doc.text("DAW: ☐ Generic  ☐ Brand  ☐ Either", margin + 60, y + 42);
      
      y += 55;

      // Professional Footer
      doc.setDrawColor(0, 51, 102);
      doc.rect(margin, y, usableWidth, 20);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      
      const disclaimer1 = "This prescription is valid only when signed by a licensed physician. Medications should be taken exactly as prescribed.";
      const disclaimer2 = "For medical emergencies, call 911 or visit the nearest emergency room. Keep all medications out of reach of children.";
      const contact = "Heal X Medical Center | (555) 123-4567 | www.healxmedical.com";
      
      doc.text(disclaimer1, margin + 3, y + 6, { maxWidth: usableWidth - 6 });
      doc.text(disclaimer2, margin + 3, y + 12, { maxWidth: usableWidth - 6 });
      doc.text(contact, pageWidth / 2, y + 18, { align: 'center' });

      // Professional border around the entire page
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.rect(3, 3, pageWidth - 6, pageHeight - 6);

      // Return PDF as buffer
      const pdfBuffer = doc.output('arraybuffer');
      resolve(pdfBuffer);

    } catch (error) {
      reject(error);
    }
  });
};

// Function to send email with PDF attachment
const sendPrescriptionEmail = async (prescriptionData, pdfBuffer, isUpdate = false) => {
  try {
    console.log('📧 Preparing to send prescription email...');
    
    const response = await fetch('http://localhost:7000/api/prescription-notifications/send-prescription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prescriptionData: prescriptionData,
        pdfBuffer: Array.from(new Uint8Array(pdfBuffer)),
        isUpdate: isUpdate
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('✅ Prescription email sent successfully!', result);
    return result;

  } catch (error) {
    console.error('❌ Error sending prescription email:', error);
    throw error;
  }
};

const PrescriptionForm = ({
  doctor: initialDoctor,
  parentPatient,
  ocrTextFromCanvas,
  onSaved,
  editingPrescription,
  prescriptions,
  scannedPatientId,
  hospitalLogo,
  onPatientSelected,
  onReset,
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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

  // Enhanced effect to handle editing prescription with better patient data
  useEffect(() => {
    if (editingPrescription) {
      console.log("🔄 Setting form data for editing prescription:", editingPrescription);
      
      const doctorName = editingPrescription.doctorName || doctor?.name || "Dr. Gayath Dahanayaka";
      const doctorSpecialization = editingPrescription.doctorSpecialization || doctor?.specialization || "General";
      
      // Determine patient ID for the form
      let patientId = "";
      if (editingPrescription.patient && typeof editingPrescription.patient === 'object') {
        patientId = editingPrescription.patient._id || editingPrescription.patient.patientId || "";
      } else {
        patientId = editingPrescription.patientId || editingPrescription.patient || "";
      }
      
      console.log("📝 Form reset with data:", {
        patientId,
        doctorName,
        doctorSpecialization,
        diagnosis: editingPrescription.diagnosis,
        medicines: editingPrescription.medicines?.length ? editingPrescription.medicines : [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]
      });
      
      setValue("doctor.name", doctorName);
      setValue("doctor.specialization", doctorSpecialization);
      setValue("patientId", patientId);
      setValue("date", editingPrescription.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
      setValue("diagnosis", editingPrescription.diagnosis || "");
      setValue("medicines", editingPrescription.medicines?.length ? editingPrescription.medicines : [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }]);
      setValue("notes", editingPrescription.notes || "");
      
      // Trigger validation after setting values
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [editingPrescription, doctor, setValue, trigger]);

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

  // Enhanced effect to handle parent patient changes
  useEffect(() => {
    if (parentPatient) {
      console.log("👤 Setting parent patient:", parentPatient);
      setSelectedPatient(parentPatient);
      setValue("patientId", parentPatient.patientId || parentPatient._id);
      
      const displayName = `${parentPatient.firstName || ""} ${parentPatient.lastName || ""}`.trim();
      const patientId = parentPatient.patientId || parentPatient._id || "";
      setSearch(`${displayName} (${patientId})`);
      
      trigger("patientId");
    }
  }, [parentPatient, setValue, trigger]);

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
              _id: patient._id,
              patientId: patient.patientId || patient._id,
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

    console.log("🔍 Selecting patient:", patient);
    
    const patientId = patient.patientId || patient._id;
    const displayName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    
    // Create standardized patient object
    const standardizedPatient = {
      _id: patient._id || patientId,
      patientId: patientId,
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      email: patient.email || "",
      phone: patient.phone || "",
      gender: patient.gender || "",
      dateOfBirth: patient.dateOfBirth || "",
      bloodGroup: patient.bloodGroup || "",
      allergies: patient.allergies || [],
      address: patient.address || "",
      emergencyContact: patient.emergencyContact || ""
    };
    
    setSelectedPatient(standardizedPatient);
    setValue("patientId", patientId);
    setSearch(`${displayName} (${patientId})`);
    setPatientsList([]);
    setSearchError("");
    trigger("patientId");
    
    // Notify parent component about patient selection
    if (onPatientSelected) {
      onPatientSelected(standardizedPatient);
    }
    
    console.log("✅ Patient selected and form updated");
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

  // Enhanced form submission with PDF generation and email sending
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

    // Validate patient email for sending
    if (!selectedPatient.email) {
      const confirmWithoutEmail = window.confirm(
        "This patient doesn't have an email address. The prescription will be saved but cannot be emailed. Do you want to continue?"
      );
      if (!confirmWithoutEmail) return;
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
      const isUpdate = !!editingPrescription;
      
      if (editingPrescription) {
        const prescriptionId = editingPrescription._id || editingPrescription.id;
        if (!prescriptionId) {
          alert("Error: Prescription ID is missing for update.");
          return;
        }
        
        res = await updatePrescription(prescriptionId, payload);
        console.log("✅ Prescription updated successfully in database");
      } else {
        res = await createPrescription(payload);
        console.log("✅ Prescription created successfully in database");
      }

      const savedPrescription = res.data?.data || res.data;

      // Generate PDF and send email if patient has email
      if (selectedPatient.email) {
        try {
          console.log("📧 Starting PDF generation and email process...");
          setIsSendingEmail(true);

          // Generate PDF buffer
          const pdfBuffer = await generatePDFBuffer(
            selectedPatient,
            data.diagnosis,
            data.medicines,
            data.notes,
            doctor,
            data.date,
            signatureData,
            hospitalLogo
          );

          console.log("✅ PDF buffer generated successfully");

          // Prepare prescription data for email
          const emailPrescriptionData = {
            _id: savedPrescription._id || savedPrescription.id,
            patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
            patientEmail: selectedPatient.email,
            date: data.date,
            diagnosis: data.diagnosis,
            medicines: data.medicines,
            notes: data.notes,
            doctorName: data.doctor.name,
            doctorSpecialization: data.doctor.specialization,
            patient: selectedPatient
          };

          // Send email with PDF attachment
          await sendPrescriptionEmail(emailPrescriptionData, pdfBuffer, isUpdate);
          
          console.log("✅ Email sent successfully to patient");
          alert(
            isUpdate 
              ? `Prescription updated successfully and emailed to ${selectedPatient.email}!`
              : `Prescription saved successfully and emailed to ${selectedPatient.email}!`
          );

        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError);
          alert(
            `Prescription ${isUpdate ? 'updated' : 'saved'} successfully, but failed to send email: ${emailError.message}`
          );
        } finally {
          setIsSendingEmail(false);
        }
      } else {
        alert(
          `Prescription ${isUpdate ? 'updated' : 'saved'} successfully. No email sent (patient email not available).`
        );
      }

      // Clear form after successful save/update
      reset(defaultValues(null, doctor));
      setSearch("");
      setSelectedPatient(null);
      setSignature(null);

      if (onSaved) onSaved(savedPrescription);

    } catch (err) {
      console.error("❌ Prescription save/update failed:", err);
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
  const generateProfessionalPDF = async (selectedPatient, diagnosis, medicines, additionalNotes, doctor, date) => {
    if (!selectedPatient) {
      alert("Please select a patient to generate PDF");
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const signatureData = signatureRef.current ? signatureRef.current.getSignature() : null;
      const pdfBuffer = await generatePDFBuffer(
        selectedPatient,
        diagnosis,
        medicines,
        additionalNotes,
        doctor,
        date,
        signatureData,
        hospitalLogo
      );

      // Convert buffer to blob and download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeFirst = (selectedPatient.firstName || "Patient").replace(/\s+/g, "_");
      const safeLast = (selectedPatient.lastName || "").replace(/\s+/g, "_");
      const fileDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
      link.download = `Prescription_${safeFirst}_${safeLast}_${fileDate}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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
    
    // Notify parent component about form reset
    if (onReset) {
      onReset();
    }
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

      {/* Enhanced selected patient display */}
      {selectedPatient && (
        <div className="pf-selected-patient">
          <div className="pf-selected-patient-header">
            <div className="pf-selected-patient-title">
              {editingPrescription ? "Editing Patient" : "Selected Patient"}
            </div>
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
              <span>{selectedPatient.gender || "Not specified"}</span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Date of Birth:</span>
              <span>
                {selectedPatient.dateOfBirth ? 
                  new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 
                  "Not provided"
                }
              </span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Age:</span>
              <span>
                {selectedPatient.dateOfBirth ? 
                  `${calculateAge(selectedPatient.dateOfBirth)} years` : 
                  "Not provided"
                }
              </span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Email:</span>
              <span>
                {selectedPatient.email || "❌ No Email"}
                {!selectedPatient.email && <span className="pf-warning-text"> (Cannot send email)</span>}
              </span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Phone:</span>
              <span>{selectedPatient.phone || "Not provided"}</span>
            </div>
            <div className="pf-patient-info-item">
              <span className="pf-patient-info-label">Blood Group:</span>
              <span>{selectedPatient.bloodGroup || "Not specified"}</span>
            </div>
          </div>
          
          {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
            <div className="pf-patient-allergies">
              <span className="pf-patient-info-label">Allergies:</span>
              <span className="pf-allergies-warning">{selectedPatient.allergies.join(", ")}</span>
            </div>
          )}
          {editingPrescription && (
            <div className="pf-editing-indicator">
              <span className="pf-edit-icon">✏️</span>
              Editing mode - Patient data loaded from prescription
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
          max={new Date().toISOString().split('T')[0]}
          min={new Date().toISOString().split('T')[0]}
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

      {/* Enhanced buttons with email status */}
      <div className="pf-button-group">
        <button 
          type="submit" 
          disabled={isSubmitting || isSaving || isSendingEmail || (!isValid && !editingPrescription) || !selectedPatient}
          className="pf-button pf-primary-button"
        >
          {isSaving ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : isSendingEmail ? (
            <>
              <LoadingSpinner />
              Sending Email...
            </>
          ) : editingPrescription ? "Update & Email Prescription" : "Save & Email Prescription"}
        </button>
        <button 
          type="button" 
          onClick={handleReset}
          disabled={isSubmitting || isSaving || isSendingEmail}
          className="pf-button pf-secondary-button"
        >
          Reset Form
        </button>
      </div>

      {/* Enhanced email status indicator */}
      {selectedPatient && (
        <div className={`pf-email-status ${selectedPatient.email ? 'has-email' : 'no-email'}`}>
          {selectedPatient.email ? (
            <div className="pf-email-info">
              ✅ Email will be sent to: {selectedPatient.email}
            </div>
          ) : (
            <div className="pf-no-email-warning">
              ⚠ No email address - prescription will be saved but not emailed
            </div>
          )}
        </div>
      )}
      
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
              📄 Download PDF
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