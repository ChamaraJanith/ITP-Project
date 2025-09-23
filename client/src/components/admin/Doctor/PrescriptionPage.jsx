// PrescriptionPage.js
import React, { useRef, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CanvasPad from "../Doctor/CanvasPad";
import PrescriptionForm from "./PrescriptionForm";
import { DoctorContext } from "../../../context/DoctorContext";
import Tesseract from "tesseract.js";
import {
  getAllPrescriptions,
  deletePrescription,
  getPrescriptionById,
  updatePrescription,
} from "../../../services/prescriptionService";
import { QrReader } from "react-qr-reader";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrBound";

import "./PrescriptionPage.css";

const PrescriptionPage = ({ patientFromParent }) => {
  const navigate = useNavigate();
  const { doctor } = useContext(DoctorContext);
  const [patient, setPatient] = useState(patientFromParent || null);
  const canvasRef = useRef(null);
  const [ocrText, setOcrText] = useState("");
  const [processing, setProcessing] = useState(false);

  const [prescriptions, setPrescriptions] = useState([]);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [scannedPatientId, setScannedPatientId] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Fetch all prescriptions and filter today's only
  const fetchPrescriptions = async () => {
    try {
      setIsLoading(true);
      const res = await getAllPrescriptions();
      const allPrescriptions = res.data?.data || [];
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const todaysPrescriptions = allPrescriptions.filter((p) => {
        if (!p.date) return false;
        const presDate = new Date(p.date);
        return presDate >= todayStart && presDate < todayEnd;
      });
      setPrescriptions(todaysPrescriptions);
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
      setPrescriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // OCR conversion
  const handleConvert = async () => {
    if (!canvasRef.current) return;
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      setProcessing(true);
      const { data } = await Tesseract.recognize(dataURL, "eng", {
        logger: (m) => console.log(m),
      });
      setOcrText(data.text || "");
    } catch (error) {
      console.error("OCR Error:", error);
      alert("OCR failed. Try writing neater or use manual entry.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCanvas = () => {
    if (canvasRef.current) canvasRef.current.clear();
    setOcrText("");
  };

  // Delete prescription
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;
    try {
      await deletePrescription(id);
      alert("Prescription deleted successfully");
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete prescription");
    }
  };

  // Enhanced function to fetch patient details
  const fetchPatientDetails = async (patientId) => {
    try {
      console.log("Fetching patient details for ID:", patientId);
      
      // Try direct patient fetch first
      const response = await fetch(`http://localhost:7000/api/patients/${patientId}`);
      
      if (response.ok) {
        const data = await response.json();
        const patientData = data.patient || data;
        
        console.log("Patient data from API:", patientData);
        
        return {
          _id: patientData._id || patientId,
          patientId: patientData.patientId || patientData._id,
          firstName: patientData.firstName || "",
          lastName: patientData.lastName || "",
          email: patientData.email || "",
          phone: patientData.phone || "",
          gender: patientData.gender || "",
          dateOfBirth: patientData.dateOfBirth || "",
          bloodGroup: patientData.bloodGroup || "",
          allergies: patientData.allergies || [],
          address: patientData.address || "",
          emergencyContact: patientData.emergencyContact || ""
        };
      } else {
        // If direct fetch fails, try search
        const searchResponse = await fetch(`http://localhost:7000/api/patients?search=${encodeURIComponent(patientId)}`);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          if (Array.isArray(searchData) && searchData.length > 0) {
            const exactMatch = searchData.find(p => 
              p._id === patientId || 
              p.patientId === patientId
            );
            
            const patientData = exactMatch || searchData[0];
            
            return {
              _id: patientData._id || patientId,
              patientId: patientData.patientId || patientData._id,
              firstName: patientData.firstName || "",
              lastName: patientData.lastName || "",
              email: patientData.email || "",
              phone: patientData.phone || "",
              gender: patientData.gender || "",
              dateOfBirth: patientData.dateOfBirth || "",
              bloodGroup: patientData.bloodGroup || "",
              allergies: patientData.allergies || [],
              address: patientData.address || "",
              emergencyContact: patientData.emergencyContact || ""
            };
          }
        }
      }
      
      return null;
    } catch (err) {
      console.error("Error fetching patient details:", err);
      return null;
    }
  };

  // Enhanced edit handler with better patient data handling
  const handleEdit = async (id) => {
    try {
      console.log("Editing prescription with ID:", id);
      
      const res = await getPrescriptionById(id);
      const pres = res.data?.data;
      
      if (!pres) {
        alert("Prescription not found");
        return;
      }
      
      console.log("Prescription data:", pres);
      
      // Set the editing prescription first
      setEditingPrescription(pres);
      
      // Try to get full patient details
      let patientData = null;
      
      // Check if prescription already has full patient data
      if (pres.patient && typeof pres.patient === 'object') {
        console.log("Using patient data from prescription:", pres.patient);
        patientData = {
          _id: pres.patient._id || pres.patientId,
          patientId: pres.patient.patientId || pres.patient._id,
          firstName: pres.patient.firstName || "",
          lastName: pres.patient.lastName || "",
          email: pres.patient.email || pres.patientEmail || "",
          phone: pres.patient.phone || pres.patientPhone || "",
          gender: pres.patient.gender || pres.patientGender || "",
          dateOfBirth: pres.patient.dateOfBirth || "",
          bloodGroup: pres.patient.bloodGroup || pres.bloodGroup || "",
          allergies: pres.patient.allergies || pres.patientAllergies || [],
          address: pres.patient.address || "",
          emergencyContact: pres.patient.emergencyContact || ""
        };
      } else {
        // Try to fetch patient details from API
        const patientId = pres.patientId || pres.patient;
        if (patientId) {
          patientData = await fetchPatientDetails(patientId);
        }
        
        // If API fetch fails, construct from prescription data
        if (!patientData) {
          console.log("Constructing patient data from prescription fields");
          
          // Parse patient name
          const nameParts = (pres.patientName || "").split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          
          patientData = {
            _id: pres.patientId || pres.patient || "",
            patientId: pres.patientId || pres.patient || "",
            firstName: firstName,
            lastName: lastName,
            email: pres.patientEmail || "",
            phone: pres.patientPhone || "",
            gender: pres.patientGender || "",
            dateOfBirth: pres.patientDateOfBirth || "",
            bloodGroup: pres.bloodGroup || "",
            allergies: pres.patientAllergies || [],
            address: pres.patientAddress || "",
            emergencyContact: pres.patientEmergencyContact || ""
          };
        }
      }
      
      console.log("Final patient data for editing:", patientData);
      
      // Set the patient data
      if (patientData) {
        setPatient(patientData);
      } else {
        console.warn("No patient data available for editing");
        setPatient(null);
      }
      
      // Clear other states
      setOcrText("");
      setScannedPatientId(null);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      
    } catch (err) {
      console.error("Error loading prescription for editing:", err);
      alert("Failed to load prescription for editing");
    }
  };

  // Handle save
  const handleSaved = async (presData) => {
    try {
      if (editingPrescription) {
        await updatePrescription(editingPrescription._id, presData);
        alert("Prescription updated successfully");
      } else {
        alert("Prescription created successfully");
      }
      
      // Reset states
      setEditingPrescription(null);
      setPatient(null);
      setOcrText("");
      setScannedPatientId(null);
      
      // Refresh the list
      fetchPrescriptions();
    } catch (err) {
      console.error("Error saving prescription:", err);
      alert("Failed to save prescription");
    }
  };

  // QR code scan handler
  const handleScan = (result, error) => {
    if (!!result) {
      let patientId = null;
      try {
        const parsed = JSON.parse(result?.text || result);
        patientId = parsed.patientId || parsed.id || parsed._id || null;
      } catch {
        patientId = result?.text || result;
      }
      if (patientId) {
        setScannedPatientId(patientId);
        setScanning(false);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  return (
    <div className="pp-wrapper">
      <div className="pp-container">
        {/* Header */}
        <div className="pp-header">
          <div className="pp-header-content">
            <div>
              <h1 className="pp-title">
                {editingPrescription ? "Edit Prescription" : "Create Prescription"}
              </h1>
              <p className="pp-subtitle">
                {editingPrescription ? "Update patient prescription details" : "Create a new prescription for your patient"}
              </p>
            </div>
            <div className="pp-header-actions">
              <button 
                onClick={() => navigate('/admin/doctor')} 
                className="pp-back-button"
              >
                ← Back to Dashboard
              </button>
              <div className="pp-header-icon">
                <div className="pp-icon-circle">
                  <span className="pp-icon">📋</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="pp-grid">
          {/* LEFT SIDE */}
          <div className="pp-left-panel">
            {/* QR section only if creating */}
            {!editingPrescription && (
              <div className="pp-qr-section">
                <h2 className="pp-section-title">Scan Patient QR Code</h2>
                <button
                  onClick={() => setScanning((prev) => !prev)}
                  className={`pp-qr-button ${scanning ? "stop" : "start"}`}
                >
                  {scanning ? (
                    <>
                      <LoadingSpinner />
                      Stop Scanning
                    </>
                  ) : (
                    "Start Scanning"
                  )}
                </button>

                {scanning && (
                  <div className="pp-qr-reader-container">
                    <QrReader
                      constraints={{ facingMode: "environment" }}
                      onResult={handleScan}
                      className="pp-qr-reader"
                    />
                  </div>
                )}

                {scannedPatientId && (
                  <div className="pp-qr-result">
                    <div className="pp-result-icon">✓</div>
                    <div className="pp-result-text">Scanned Patient ID: {scannedPatientId}</div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Patient Info Display */}
            <div className="pp-patient-info">
              <h2 className="pp-section-title">
                {editingPrescription ? "Editing Patient" : "Patient Information"}
              </h2>
              <div className="pp-patient-details">
                {patient ? (
                  <div className="pp-patient-data">
                    <div className="pp-patient-header">
                      <div className="pp-patient-name">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="pp-patient-id">
                        ID: {patient.patientId || patient._id}
                      </div>
                    </div>
                    
                    <div className="pp-patient-grid">
                      <div className="pp-patient-row">
                        <span className="pp-patient-label">Email:</span>
                        <span className="pp-patient-value">
                          {patient.email || "Not provided"}
                          {!patient.email && <span className="pp-warning-text"> ⚠️</span>}
                        </span>
                      </div>
                      <div className="pp-patient-row">
                        <span className="pp-patient-label">Phone:</span>
                        <span className="pp-patient-value">{patient.phone || "Not provided"}</span>
                      </div>
                      <div className="pp-patient-row">
                        <span className="pp-patient-label">Gender:</span>
                        <span className="pp-patient-value">{patient.gender || "Not specified"}</span>
                      </div>
                      <div className="pp-patient-row">
                        <span className="pp-patient-label">Date of Birth:</span>
                        <span className="pp-patient-value">
                          {patient.dateOfBirth ? 
                            new Date(patient.dateOfBirth).toLocaleDateString() : 
                            "Not provided"
                          }
                        </span>
                      </div>
                      <div className="pp-patient-row">
                        <span className="pp-patient-label">Blood Group:</span>
                        <span className="pp-patient-value">{patient.bloodGroup || "Not specified"}</span>
                      </div>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <div className="pp-patient-row">
                          <span className="pp-patient-label">Allergies:</span>
                          <span className="pp-patient-value pp-allergies-list">
                            {patient.allergies.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {editingPrescription && (
                      <div className="pp-editing-indicator">
                        <span className="pp-edit-icon">✏️</span>
                        Editing mode - Patient data loaded from prescription
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pp-no-patient">
                    <div className="pp-no-patient-icon">👤</div>
                    <div className="pp-no-patient-text">
                      {editingPrescription ? 
                        "Loading patient data..." : 
                        "No patient selected. Use search or scan QR."
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas + OCR */}
            <div className="pp-canvas-section">
              <h2 className="pp-section-title">Draw Prescription</h2>
              <div className="pp-canvas-container">
                <CanvasPad ref={canvasRef} height={300} lineWidth={3} />
              </div>
              <div className="pp-canvas-buttons">
                <button onClick={handleConvert} disabled={processing} className="pp-canvas-button pp-convert">
                  {processing ? (
                    <>
                      <LoadingSpinner />
                      Converting...
                    </>
                  ) : (
                    "Convert to Text"
                  )}
                </button>
                <button onClick={handleClearCanvas} className="pp-canvas-button pp-clear">
                  Clear Canvas
                </button>
              </div>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                className="pp-canvas-textarea"
                rows={4}
                placeholder="OCR Output (editable)"
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="pp-right-panel">
            {/* Wrap PrescriptionForm with ErrorBoundary */}
            <ErrorBoundary>
              <PrescriptionForm
                doctor={doctor}
                parentPatient={patient}
                ocrTextFromCanvas={ocrText}
                onSaved={handleSaved}
                editingPrescription={editingPrescription}
                prescriptions={prescriptions}
                scannedPatientId={scannedPatientId}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Prescriptions list */}
        <div className="pp-prescription-list">
          <div className="pp-list-header">
            <h2 className="pp-list-title">📋 Today's Prescriptions</h2>
            <div className="pp-list-count">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                `${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''}`
              )}
            </div>
          </div>
          {isLoading ? (
            <div className="pp-loading-container">
              <LoadingSpinner size="large" />
              <div className="pp-loading-text">Loading prescriptions...</div>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="pp-no-prescriptions">
              <div className="pp-no-data-icon">📋</div>
              <div className="pp-no-data-text">No prescriptions found for today.</div>
            </div>
          ) : (
            <div className="pp-table-container">
              <table className="pp-prescription-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PATIENT</th>
                    <th>DIAGNOSIS</th>
                    <th>DOCTOR</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((p) => (
                    <tr key={p._id}>
                      <td>{formatDate(p.date)}</td>
                      <td>{p.patientName}</td>
                      <td className="pp-diagnosis">{p.diagnosis}</td>
                      <td className="pp-doctor">
                        {p.doctorName} ({p.doctorSpecialization})
                      </td>
                      <td>
                        <div className="pp-prescription-actions">
                          <button className="pp-edit-btn" onClick={() => handleEdit(p._id)}>
                            Edit
                          </button>
                          <button className="pp-delete-btn" onClick={() => handleDelete(p._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;