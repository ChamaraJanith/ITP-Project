// PrescriptionPage.js (Updated QR Scanner Modal)
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
  const [cameraError, setCameraError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState("prompt");
  const [cameraReady, setCameraReady] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera function
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setTorchOn(false);
  };

  // Start camera function
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraReady(false);
      
      // Request camera access
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              setCameraReady(true);
              setCameraPermission("granted");
            })
            .catch(err => {
              console.error("Video play error:", err);
              setCameraError("Failed to start video playback");
            });
        };
      }
      
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission("denied");
        setCameraError("Camera permission denied. Please enable camera access in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("No camera found. Please ensure your device has a camera.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  };

  // Toggle torch/flashlight function
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      }
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

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

  // Handle patient selection from form
  const handlePatientSelected = (selectedPatient) => {
    console.log("Patient selected in form:", selectedPatient);
    setPatient(selectedPatient);
    setEditingPrescription(null); // Exit editing mode
    setOcrText("");
    setScannedPatientId(null);
  };

  // Handle form reset
  const handleFormReset = () => {
    setPatient(null);
    setEditingPrescription(null);
    setOcrText("");
    setScannedPatientId(null);
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
        setQrResult(result);
        setScanSuccess(true);
        
        // Auto close modal after success
        setTimeout(() => {
          stopCamera();
          setShowModal(false);
          setScanSuccess(false);
        }, 1500);
      }
    }
  };

  // Toggle scanning function
  const toggleScanning = async () => {
    if (scanning) {
      setScanning(false);
      stopCamera();
      setQrResult(null);
      setShowModal(false);
    } else {
      setScanning(true);
      setQrResult(null);
      setScanSuccess(false);
      setShowModal(true);
      await startCamera();
    }
  };

  // Close modal function
  const closeModal = () => {
    setScanning(false);
    stopCamera();
    setQrResult(null);
    setShowModal(false);
    setScanSuccess(false);
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
                  onClick={toggleScanning}
                  className={`pp-qr-button ${scanning ? "stop" : "start"}`}
                >
                  {scanning ? (
                    <>
                      <LoadingSpinner />
                      Stop Scanning
                    </>
                  ) : (
                    <>
                      <span className="pp-qr-icon">📷</span>
                      Start Scanning
                    </>
                  )}
                </button>

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
                        <span className="pp-patient-label">Age:</span>
                        <span className="pp-patient-value">
                          {patient.dateOfBirth ? 
                            `${calculateAge(patient.dateOfBirth)} years` : 
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
                onPatientSelected={handlePatientSelected}
                onReset={handleFormReset}
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

      {/* Professional QR Scanner Modal */}
      {showModal && (
        <div className="pp-modal-overlay" onClick={closeModal}>
          <div className="pp-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <div className="pp-modal-title-container">
                <h2 className="pp-modal-title">Scan Patient QR Code</h2>
                <p className="pp-modal-subtitle">Position the QR code within the frame to scan</p>
              </div>
              <button className="pp-modal-close" onClick={closeModal} aria-label="Close modal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="pp-modal-body">
              <div className="pp-qr-reader-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="pp-camera-video"
                />
                
                {!cameraReady && (
                  <div className="pp-camera-loading">
                    <div className="pp-loading-spinner">
                      <LoadingSpinner />
                    </div>
                    <div className="pp-loading-text">Initializing camera...</div>
                  </div>
                )}
                
                <div className="pp-qr-overlay">
                  <div className="pp-qr-scan-region">
                    <div className="pp-qr-scan-line"></div>
                    <div className="pp-qr-corner-tl"></div>
                    <div className="pp-qr-corner-tr"></div>
                    <div className="pp-qr-corner-bl"></div>
                    <div className="pp-qr-corner-br"></div>
                  </div>
                  <div className="pp-qr-hint">Position QR code within the frame</div>
                </div>
                
                {cameraReady && (
                  <div className="pp-qr-scanner">
                    <QrReader
                      onResult={handleScan}
                      constraints={{ 
                        facingMode: "environment"
                      }}
                      className="pp-qr-reader-component"
                    />
                  </div>
                )}
                
                {scanSuccess && (
                  <div className="pp-scan-success">
                    <div className="pp-success-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="pp-success-text">QR Code Scanned Successfully!</div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="pp-qr-error">
                  <div className="pp-error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="pp-error-text">{cameraError}</div>
                  <button 
                    onClick={() => {
                      setCameraError(null);
                      startCamera();
                    }} 
                    className="pp-retry-button"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            
            <div className="pp-modal-footer">
              <div className="pp-modal-controls">
                <button 
                  onClick={toggleTorch}
                  className={`pp-torch-button ${torchOn ? "active" : ""}`}
                  disabled={!cameraReady}
                  aria-label="Toggle flashlight"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 2L15 22M6 7L18 7M12 2V22M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {torchOn ? "Flash Off" : "Flash On"}
                </button>
              </div>
              <button 
                onClick={closeModal} 
                className="pp-modal-button pp-cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;