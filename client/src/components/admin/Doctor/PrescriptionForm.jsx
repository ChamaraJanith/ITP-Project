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
  medicines: yup
    .array()
    .of(MedicineSchema)
    .min(1, "At least one medicine is required"),
  notes: yup.string().optional(),
});

// Default form values
const defaultValues = (doctor) => ({
  date: new Date().toISOString().slice(0, 10),
  diagnosis: "",
  medicines: [{ name: "", dosage: "", frequency: "", duration: "", notes: "" }],
  notes: "",
  doctor: {
    id: doctor?._id || "",
    name: doctor?.name || "",
    specialization: doctor?.specialization || "",
  },
});

const PrescriptionForm = ({ doctor, ocrTextFromCanvas, onSaved }) => {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(PrescriptionSchema),
    defaultValues: defaultValues(doctor),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicines",
  });

  const [activeField, setActiveField] = useState(null);

  // Insert OCR text into the active field
  useEffect(() => {
    if (!ocrTextFromCanvas || !activeField) return;
    setValue(activeField, ocrTextFromCanvas);
  }, [ocrTextFromCanvas, activeField, setValue]);

  // Submit form
  const onSubmit = async (data) => {
    try {
      const payload = {
        date: data.date,
        diagnosis: data.diagnosis,
        medicines: data.medicines,
        notes: data.notes,
        doctorId: data.doctor.id,
        doctorName: data.doctor.name,
        doctorSpecialization: data.doctor.specialization,
      };

      const res = await createPrescription(payload);
      alert("Prescription saved successfully.");
      if (onSaved) onSaved(res.data?.data || res.data);
      reset(defaultValues(doctor));
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to save prescription.";
      alert(msg);
    }
  };

  // Add new medicine row
  const addMedicine = () =>
    append({ name: "", dosage: "", frequency: "", duration: "", notes: "" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: 12 }}>
      {/* Date */}
      <div style={{ marginBottom: 8 }}>
        <label>Date</label>
        <br />
        <input
          type="date"
          {...register("date")}
          onFocus={() => setActiveField("date")}
        />
        {errors.date && <div style={{ color: "red" }}>{errors.date.message}</div>}
      </div>

      {/* Diagnosis */}
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

      {/* Medicines */}
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

      {/* Additional Notes */}
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

      {/* Doctor Info */}
      <div style={{ marginBottom: 8 }}>
        <label>Doctor Info</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            {...register("doctor.name")}
            placeholder="Doctor Name"
            readOnly
          />
          <input
            {...register("doctor.specialization")}
            placeholder="Specialization"
            readOnly
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={isSubmitting}>
          Save Prescription
        </button>
        <button type="button" onClick={() => reset(defaultValues(doctor))}>
          Reset
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
