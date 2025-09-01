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
  patient: yup.object({
    id: yup.string().required("Patient ID is required"),
    name: yup.string().required("Patient name is required"),
    age: yup.number().nullable(),
    gender: yup.string().nullable(),
  }),
  date: yup.date().required("Date is required"),
  diagnosis: yup.string().required("Diagnosis is required"),
  medicines: yup
    .array()
    .of(MedicineSchema)
    .min(1, "At least one medicine is required"),
  notes: yup.string().optional(),
});

// Default form values
const defaultValues = (Patient, doctor) => ({
  patient: {
    id: Patient?._id || "",
    name: Patient?.name || "",
    age: Patient?.age || null,
    gender: Patient?.gender || "",
  },
  date: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  medicines: [
    { name: "", dosage: "", frequency: "", duration: "", notes: "" },
  ],
  notes: "",
  doctor: {
    id: doctor?._id || "",
    name: doctor?.name || "",
    specialization: doctor?.specialization || "",
  },
});

const PrescriptionForm = ({ Patient, doctor, ocrTextFromCanvas, onSaved }) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(PrescriptionSchema),
    defaultValues: defaultValues(Patient, doctor),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicines",
  });

  // Track currently selected field
  const [activeField, setActiveField] = useState(null);

  // Update patient info when prop changes
  useEffect(() => {
    if (Patient) {
      setValue("patient.id", Patient._id);
      setValue("patient.name", Patient.name);
      setValue("patient.age", Patient.age);
      setValue("patient.gender", Patient.gender);
    }
  }, [Patient, setValue]);

  // Update doctor info when prop changes
  useEffect(() => {
    if (doctor) {
      setValue("doctor.id", doctor._id);
      setValue("doctor.name", doctor.name);
      setValue("doctor.specialization", doctor.specialization || "");
    }
  }, [doctor, setValue]);

  // Insert OCR text directly into the active field
  useEffect(() => {
    if (!ocrTextFromCanvas || !activeField) return;

    setValue(activeField, ocrTextFromCanvas); // put text only in selected field
    // keep activeField so more canvas writes continue in same field
  }, [ocrTextFromCanvas, activeField, setValue]);

  // Submit form
  const onSubmit = async (data) => {
    try {
      if (!data.patient.id) return alert("Please select a patient.");
      const payload = {
        patient: data.patient,
        date: data.date,
        diagnosis: data.diagnosis,
        medicines: data.medicines,
        notes: data.notes,
      };

      const res = await createPrescription(payload);
      alert("Prescription saved successfully.");

      if (onSaved) onSaved(res.data.Prescription || res.data);
      reset(defaultValues(Patient, doctor));
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || "Failed to save prescription.";
      alert(msg);
    }
  };

  // Add new medicine row
  const addMedicine = () =>
    append({ name: "", dosage: "", frequency: "", duration: "", notes: "" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <label>Date</label>
        <br />
        <input
          type="date"
          {...register("date")}
          onFocus={() => setActiveField("date")}
        />
        {errors.date && (
          <div style={{ color: "red" }}>{errors.date.message}</div>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Diagnosis / Symptoms</label>
        <br />
        <textarea
          {...register("diagnosis")}
          rows={2}
          style={{ width: "100%" }}
          onFocus={() => setActiveField("diagnosis")}
        />
        {errors.diagnosis && (
          <div style={{ color: "red" }}>{errors.diagnosis.message}</div>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Medicines</label>
        {fields.map((f, i) => (
          <div
            key={f.id}
            style={{ border: "1px solid #eee", padding: 8, marginBottom: 8 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                gap: 8,
              }}
            >
              <input
                placeholder="Name"
                {...register(`medicines.${i}.name`)}
                onFocus={() => setActiveField(`medicines.${i}.name`)}
              />
              <input
                placeholder="Dosage"
                {...register(`medicines.${i}.dosage`)}
                onFocus={() => setActiveField(`medicines.${i}.dosage`)}
              />
              <input
                placeholder="Frequency"
                {...register(`medicines.${i}.frequency`)}
                onFocus={() => setActiveField(`medicines.${i}.frequency`)}
              />
              <input
                placeholder="Duration"
                {...register(`medicines.${i}.duration`)}
                onFocus={() => setActiveField(`medicines.${i}.duration`)}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
              >
                Remove
              </button>
            </div>
            <div style={{ marginTop: 6 }}>
              <input
                placeholder="Notes"
                {...register(`medicines.${i}.notes`)}
                style={{ width: "100%" }}
                onFocus={() => setActiveField(`medicines.${i}.notes`)}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addMedicine}>
          + Add medicine
        </button>
        {errors.medicines && (
          <div style={{ color: "red" }}>{errors.medicines.message}</div>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Additional Notes</label>
        <br />
        <textarea
          {...register("notes")}
          rows={2}
          style={{ width: "100%" }}
          onFocus={() => setActiveField("notes")}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>Doctor (auto)</label>
        <div>
          <input value={doctor?.name || ""} readOnly />
          <input value={doctor?.specialization || ""} readOnly />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={isSubmitting}>
          Save Prescription
        </button>
        <button
          type="button"
          onClick={() => reset(defaultValues(Patient, doctor))}
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
