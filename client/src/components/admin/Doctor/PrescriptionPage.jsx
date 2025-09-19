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

  const [scannedPatientId, setScannedPatientId] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Fetch all prescriptions and filter today's only
  const fetchPrescriptions = async () => {
    try {
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

  // Start editing prescription
  const handleEdit = async (id) => {
    try {
      const res = await getPrescriptionById(id);
      const pres = res.data?.data;
      if (!pres) return alert("Prescription not found");
      setEditingPrescription(pres);
      setPatient({
        _id: pres.patientId,
        firstName: pres.patientName.split(" ")[0] || "",
        lastName: pres.patientName.split(" ")[1] || "",
        gender: pres.patientGender,
        email: pres.patientEmail,
        phone: pres.patientPhone,
      });
      setOcrText("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Failed to load prescription");
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
      setEditingPrescription(null);
      setPatient(null);
      setOcrText("");
      setScannedPatientId(null);
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
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
                onClick={() => navigate('/dashboard')} 
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
                      <span className="pp-loading"></span>
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

            {/* Patient Info */}
            <div className="pp-patient-info">
              <h2 className="pp-section-title">Patient Information</h2>
              <div className="pp-patient-details">
                {patient ? (
                  <div className="pp-patient-data">
                    <div className="pp-patient-row">
                      <span className="pp-patient-label">Name:</span>
                      <span className="pp-patient-value">{patient.firstName} {patient.lastName}</span>
                    </div>
                    <div className="pp-patient-row">
                      <span className="pp-patient-label">Email:</span>
                      <span className="pp-patient-value">{patient.email || "N/A"}</span>
                    </div>
                    <div className="pp-patient-row">
                      <span className="pp-patient-label">Gender:</span>
                      <span className="pp-patient-value">{patient.gender}</span>
                    </div>
                    <div className="pp-patient-row">
                      <span className="pp-patient-label">Phone:</span>
                      <span className="pp-patient-value">{patient.phone || "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pp-no-patient">
                    <div className="pp-no-patient-icon">👤</div>
                    <div className="pp-no-patient-text">No patient selected. Use search or scan QR.</div>
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
                      <span className="pp-loading"></span>
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
            <PrescriptionForm
              doctor={doctor}
              parentPatient={patient}
              ocrTextFromCanvas={ocrText}
              onSaved={handleSaved}
              editingPrescription={editingPrescription}
              scannedPatientId={scannedPatientId}
            />
          </div>
        </div>

        {/* Prescriptions list */}
        <div className="pp-prescription-list">
          <div className="pp-list-header">
            <h2 className="pp-list-title">Today's Prescriptions</h2>
            <div className="pp-list-count">{prescriptions.length} prescriptions</div>
          </div>
          {prescriptions.length === 0 ? (
            <div className="pp-no-prescriptions">
              <div className="pp-no-data-icon">📋</div>
              <div className="pp-no-data-text">No prescriptions found for today.</div>
            </div>
          ) : (
            <div className="pp-table-container">
              <table className="pp-prescription-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Diagnosis</th>
                    <th>Doctor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
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