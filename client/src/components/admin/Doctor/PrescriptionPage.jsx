import React, { useRef, useState, useContext, useEffect } from "react";
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
    <div className="prescription-page">
      <h1>{editingPrescription ? "Edit Prescription" : "Create Prescription"}</h1>

      <div className="prescription-grid">
        {/* LEFT SIDE */}
        <div className="left-panel">
          {/* QR section only if creating */}
          {!editingPrescription && (
            <div className="qr-section">
              <h2>Scan Patient QR Code</h2>
              <button
                onClick={() => setScanning((prev) => !prev)}
                className={`qr-button ${scanning ? "stop" : "start"}`}
              >
                {scanning ? "Stop Scanning" : "Start Scanning"}
              </button>

              {scanning && (
                <div className="qr-reader-container">
                  <QrReader
                    constraints={{ facingMode: "environment" }}
                    onResult={handleScan}
                    className="qr-reader"
                  />
                </div>
              )}

              {scannedPatientId && (
                <div className="qr-result">✅ Scanned Patient ID: {scannedPatientId}</div>
              )}
            </div>
          )}

          {/* Patient Info */}
          <div className="patient-info">
            <strong>Patient</strong>
            <div className="patient-details">
              {patient ? (
                <>
                  <div>
                    <b>Name:</b> {patient.firstName} {patient.lastName}
                  </div>
                  <div>
                    <b>Email:</b> {patient.email || "N/A"}
                  </div>
                  <div>
                    <b>Gender:</b> {patient.gender}
                  </div>
                  <div>
                    <b>Phone:</b> {patient.phone || "N/A"}
                  </div>
                </>
              ) : (
                <div className="no-patient">No patient selected. Use search or scan QR.</div>
              )}
            </div>
          </div>

          {/* Canvas + OCR */}
          <div className="canvas-section">
            <strong>Write on Canvas</strong>
            <CanvasPad ref={canvasRef} width={380} height={220} lineWidth={3} />
            <div className="canvas-buttons">
              <button onClick={handleConvert} disabled={processing}>
                {processing ? "Converting..." : "Convert to Text"}
              </button>
              <button onClick={handleClearCanvas}>Clear</button>
            </div>
            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              rows={6}
              placeholder="OCR Output (editable)"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="right-panel">
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
      <div className="prescription-list">
        <h2>Today Patient History</h2>
        {prescriptions.length === 0 ? (
          <div>No prescriptions found.</div>
        ) : (
          <table>
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
                  <td>{p.diagnosis}</td>
                  <td>
                    {p.doctorName} ({p.doctorSpecialization})
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(p._id)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(p._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPage;
