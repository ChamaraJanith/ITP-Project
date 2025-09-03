import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createPrescription } from "../../../services/prescriptionService";

// Medicine validation schema
const MedicineSchema = yup.object({
  name: yup.string().required("Medicine name is required"),
  dosage: yup.string().required("Dosage is required"),
  frequency: yup.string().required("Frequency is required"),
  duration: yup.string().required("Duration is required"),
  notes: yup.string().optional(),
});

// Prescription validation schema
const PrescriptionSchema = yup.object({
  date: yup.date().required("Date is required"),
  diagnosis: yup.string().required("Diagnosis is required"),
  medicines: yup.array().of(MedicineSchema).min(1, "At least one medicine is required"),
  notes: yup.string().optional(),
  patientId: yup.string().required("Patient is required"),
});

// Default form values
const defaultValues = (doctor, patient) => ({
  date: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  medicines: [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }],
  notes: "",
  patientId: patient?._id || "",
  doctor: {
    id: doctor?._id || "",
    name: doctor?.name || "",
    specialization: doctor?.specialization || "",
  },
});

const PrescriptionForm = ({ doctor, parentPatient, ocrTextFromCanvas, onSaved }) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(PrescriptionSchema),
    defaultValues: defaultValues(doctor, parentPatient),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "medicines" });

  const [activeField, setActiveField] = useState(null);
  const [search, setSearch] = useState("");
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(parentPatient || null);

  // 🔹 Search patients
  const handleSearchButton = async () => {
  if (!search.trim()) return alert("Enter a patient name to search");

  try {
    const res = await fetch(
      `http://localhost:7000/api/patients?search=${encodeURIComponent(search)}`
    );

    // ✅ Log HTTP status
    console.log("HTTP status:", res.status);

    // Check if response is OK (status 200–299)
    if (!res.ok) {
      const text = await res.text();
      console.error("HTTP error response:", text);
      throw new Error(`Server responded with status ${res.status}`);
    }

    const data = await res.json();
    console.log("Search response data:", data);

    if (!Array.isArray(data) || data.length === 0) {
      alert("No patient found");
      setPatientsList([]);
      setSelectedPatient(null);
      setValue("patientId", "");
      return;
    }

    setPatientsList(data);

  } catch (err) {
    // 🔹 Full error logging
    console.error("Patient search failed! Full error object:", err);
    if (err.message) console.error("Error message:", err.message);

    alert("Failed to search patients. Check console for full details.");
  }

};

  // 🔹 Select patient
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setValue("patientId", patient._id || patient.patientId);
    setSearch(`${patient.firstName} ${patient.lastName}`);
    setPatientsList([]);
  };

  // 🔹 Update form when parentPatient changes
  useEffect(() => {
    if (parentPatient) {
      setSelectedPatient(parentPatient);
      setValue("patientId", parentPatient._id || parentPatient.patientId);
      setSearch(`${parentPatient.firstName} ${parentPatient.lastName}`);
    }
  }, [parentPatient, setValue]);

  // 🔹 OCR text integration
  useEffect(() => {
    if (!ocrTextFromCanvas || !activeField) return;
    setValue(activeField, ocrTextFromCanvas);
  }, [ocrTextFromCanvas, activeField, setValue]);

  // 🔹 Form submission
  const onSubmit = async (data) => {
    if (!selectedPatient) return alert("Please select a patient.");

    try {
      const payload = {
        date: data.date,
        diagnosis: data.diagnosis,
        medicines: data.medicines,
        notes: data.notes,
        patientId: selectedPatient._id || selectedPatient.patientId,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientEmail: selectedPatient.email,
        patientPhone: selectedPatient.phone,
        patientGender: selectedPatient.gender,
        patientBloodGroup: selectedPatient.bloodGroup,
        patientAllergies: selectedPatient.allergies,
        doctorId: data.doctor.id,
        doctorName: data.doctor.name,
        doctorSpecialization: data.doctor.specialization,
      };

      const res = await createPrescription(payload);
      alert("Prescription saved successfully.");
      if (onSaved) onSaved(res.data?.data || res.data);
      reset(defaultValues(doctor, selectedPatient));
      setSearch("");
      setSelectedPatient(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to save prescription.");
    }
  };

  const addMedicine = () => append({ name: "", dosage: "", frequency: "", duration: "", notes: "" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 12 }}>
      {/* 🔹 Patient Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Enter patient name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button
          type="button"
          onClick={handleSearchButton}
          style={{ padding: "8px 16px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: 4 }}
        >
          Search
        </button>
      </div>

      {/* 🔹 Patient List */}
      {patientsList.length > 0 && (
        <ul style={{ border: "1px solid #ccc", borderRadius: 4, maxHeight: 150, overflowY: "auto", padding: 0, margin: 0 }}>
          {patientsList.map((p) => (
            <li
              key={p._id}
              onClick={() => handleSelectPatient(p)}
              style={{ padding: 8, cursor: "pointer", borderBottom: "1px solid #eee" }}
            >
              {p.firstName} {p.lastName} ({p.gender}, {p.phone})
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 Selected Patient */}
      {selectedPatient && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#f0f8ff",
            border: "1px solid #4CAF50",
            borderRadius: 6,
          }}
        >
          <strong>Selected Patient:</strong>
          <div>Patient ID: {selectedPatient.patientId || selectedPatient._id}</div>
          <div>Name: {selectedPatient.firstName} {selectedPatient.lastName}</div>
          <div>Gender: {selectedPatient.gender}</div>
          <div>Date of Birth: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</div>
          <div>Email: {selectedPatient.email}</div>
          <div>Phone: {selectedPatient.phone}</div>
          <div>Blood Group: {selectedPatient.bloodGroup || "N/A"}</div>
          {selectedPatient.allergies?.length > 0 && (
            <div style={{ color: "#d32f2f" }}>⚠ Allergies: {selectedPatient.allergies.join(", ")}</div>
          )}
          {selectedPatient.medicalHistory?.length > 0 && (
            <div>Medical History: {selectedPatient.medicalHistory.join(", ")}</div>
          )}
        </div>
      )}

      {/* 🔹 Date */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Date</strong></label>
        <br />
        <input
          type="date"
          {...register("date")}
          onFocus={() => setActiveField("date")}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", width: "200px" }}
        />
        {errors.date && <div style={{ color: "red", fontSize: 12 }}>{errors.date.message}</div>}
      </div>

      {/* 🔹 Diagnosis */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Diagnosis / Symptoms</strong></label>
        <br />
        <textarea
          {...register("diagnosis")}
          rows={3}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          onFocus={() => setActiveField("diagnosis")}
          placeholder="Enter diagnosis, symptoms, or clinical findings..."
        />
        {errors.diagnosis && <div style={{ color: "red", fontSize: 12 }}>{errors.diagnosis.message}</div>}
      </div>

      {/* 🔹 Medicines */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Prescribed Medicines</strong></label>
        {fields.map((f, i) => (
          <div
            key={f.id}
            style={{
              border: "1px solid #e0e0e0",
              padding: 12,
              marginBottom: 8,
              borderRadius: 6,
              backgroundColor: "#fafafa",
            }}
          >
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: "bold" }}>Medicine #{i + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="Medicine Name"
                {...register(`medicines.${i}.name`)}
                onFocus={() => setActiveField(`medicines.${i}.name`)}
                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
              />
              <input
                placeholder="Dosage"
                {...register(`medicines.${i}.dosage`)}
                onFocus={() => setActiveField(`medicines.${i}.dosage`)}
                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
              />
              <input
                placeholder="Frequency"
                {...register(`medicines.${i}.frequency`)}
                onFocus={() => setActiveField(`medicines.${i}.frequency`)}
                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
              />
              <input
                placeholder="Duration"
                {...register(`medicines.${i}.duration`)}
                onFocus={() => setActiveField(`medicines.${i}.duration`)}
                style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                Remove
              </button>
            </div>
            <div>
              <input
                placeholder="Notes"
                {...register(`medicines.${i}.notes`)}
                style={{ width: "100%", padding: 6, borderRadius: 4, border: "1px solid #ccc", fontSize: 13 }}
                onFocus={() => setActiveField(`medicines.${i}.notes`)}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addMedicine}
          style={{ padding: "8px 16px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: 4, marginTop: 8 }}
        >
          + Add Medicine
        </button>
      </div>

      {/* 🔹 Additional Notes */}
      <div style={{ marginBottom: 12 }}>
        <label><strong>Additional Notes & Instructions</strong></label>
        <br />
        <textarea
          {...register("notes")}
          rows={3}
          style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          onFocus={() => setActiveField("notes")}
          placeholder="Any additional instructions..."
        />
      </div>

      {/* 🔹 Doctor Info */}
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 6, border: "1px solid #e0e0e0" }}>
        <label><strong>Prescribing Doctor</strong></label>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <input
            {...register("doctor.name")}
            placeholder="Doctor Name"
            readOnly
            style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc", backgroundColor: "#f9f9f9" }}
          />
          <input
            {...register("doctor.specialization")}
            placeholder="Specialization"
            readOnly
            style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc", backgroundColor: "#f9f9f9" }}
          />
        </div>
      </div>

      {/* 🔹 Buttons */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ padding: "12px 24px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: 4, fontSize: 16, fontWeight: "bold" }}
        >
          {isSubmitting ? "Saving..." : "Save Prescription"}
        </button>
        <button
          type="button"
          onClick={() => reset(defaultValues(doctor, selectedPatient))}
          style={{ padding: "12px 24px", backgroundColor: "#757575", color: "white", border: "none", borderRadius: 4, fontSize: 16 }}
        >
          Reset Form
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
