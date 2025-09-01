import React, { useRef, useState, useContext } from "react";
import CanvasPad from "../Doctor/CanvasPad";
import PrescriptionForm from "./PrescriptionForm";
import { DoctorContext } from "../../../context/DoctorContext";
import Tesseract from "tesseract.js";

// patientFromParent: patient object (passed from parent selection/QR flow)
const PrescriptionPage = ({ patientFromParent }) => {
  const { doctor } = useContext(DoctorContext);
  const [patient, setPatient] = useState(patientFromParent || null);
  const canvasRef = useRef(null);
  const [ocrText, setOcrText] = useState("");
  const [processing, setProcessing] = useState(false);

  // ✅ Fixed OCR using v4 API (no createWorker needed)
  const handleConvert = async () => {
    try {
      const dataURL = canvasRef.current.toDataURL("image/png");
      setProcessing(true);

      const { data } = await Tesseract.recognize(dataURL, "eng", {
        logger: (m) => console.log(m), // shows progress updates
      });

      const text = data.text || "";
      setOcrText(text);
    } catch (error) {
      console.error("Error during OCR processing:", error);
      alert("OCR failed. Try writing neater or use manual entry.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClearCanvas = () => {
    canvasRef.current.clear();
    setOcrText("");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 12 }}>
      <h1>Create Prescription</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "400px 1fr",
          gap: 20,
        }}
      >
        {/* Left side: Patient info + Canvas */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Patient</strong>
            <div
              style={{ padding: 8, background: "#f6f6f6", borderRadius: 6 }}
            >
              {patient ? (
                <>
                  <div>
                    <b>Name:</b> {patient.name}
                  </div>
                  <div>
                    <b>Age:</b> {patient.age}
                  </div>
                  <div>
                    <b>Gender:</b> {patient.gender}
                  </div>
                </>
              ) : (
                <div style={{ color: "#b00" }}>
                  No patient selected. Use QR or patient search first.
                </div>
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
            patient={patient}
            doctor={doctor}
            ocrTextFromCanvas={ocrText}
            onSaved={(pres) => {
              console.log("Saved", pres);
              // you can show toast or redirect here
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;
