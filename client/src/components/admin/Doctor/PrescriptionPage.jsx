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

const PrescriptionPage = ({ patientFromParent }) => {
  const { doctor } = useContext(DoctorContext);
  const [patient, setPatient] = useState(patientFromParent || null);
  const canvasRef = useRef(null);
  const [ocrText, setOcrText] = useState("");
  const [processing, setProcessing] = useState(false);

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState([]);
  const [editingPrescription, setEditingPrescription] = useState(null);

  // Fetch all prescriptions and filter today's only
const fetchPrescriptions = async () => {
  try {
    const res = await getAllPrescriptions();
    const allPrescriptions = res.data?.data || [];

    const today = new Date();
    // Normalize today's date to midnight
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Filter prescriptions where date is >= todayStart and < todayEnd
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
      // Set patient from prescription
      setPatient({
        _id: pres.patientId,
        firstName: pres.patientName.split(" ")[0] || "",
        lastName: pres.patientName.split(" ")[1] || "",
        gender: pres.patientGender,
        email: pres.patientEmail,
        phone: pres.patientPhone,
      });
      // Set OCR text if available (optional)
      setOcrText("");
      // Scroll to form
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Failed to load prescription");
    }
  };

  // Handle save (create or update)
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
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      alert("Failed to save prescription");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 12 }}>
      <h1>{editingPrescription ? "Edit Prescription" : "Create Prescription"}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 20 }}>
        {/* Left side: Patient info + Canvas */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Patient</strong>
            <div style={{ padding: 8, background: "#f6f6f6", borderRadius: 6 }}>
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
                <div style={{ color: "#b00" }}>No patient selected. Use search first.</div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Write on Canvas</strong>
            <div style={{ margin: "8px 0" }}>
              <CanvasPad ref={canvasRef} width={380} height={220} lineWidth={3} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleConvert} disabled={processing}>
                {processing ? "Converting..." : "Convert to Text"}
              </button>
              <button onClick={handleClearCanvas}>Clear</button>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>OCR Output (editable preview)</label>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={6}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Right side: Prescription Form */}
        <div>
          <PrescriptionForm
            doctor={doctor}
            parentPatient={patient}
            ocrTextFromCanvas={ocrText}
            onSaved={handleSaved}
            editingPrescription={editingPrescription}
          />
        </div>
      </div>

      {/* Prescriptions list */}
      <div style={{ marginTop: 40 }}>
        <h2>Today Patient History</h2>
        {prescriptions.length === 0 ? (
          <div>No prescriptions found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Date</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Patient</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Diagnosis</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Doctor</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p._id}>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{p.patientName}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{p.diagnosis}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>
                    {p.doctorName} ({p.doctorSpecialization})
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>
                    <button
                      onClick={() => handleEdit(p._id)}
                      style={{ marginRight: 8, background: "#2196F3", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      style={{ background: "#f44336", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4 }}
                    >
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