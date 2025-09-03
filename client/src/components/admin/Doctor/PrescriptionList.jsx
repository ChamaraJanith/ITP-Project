import React, { useEffect, useState } from "react";
import {
  getAllPrescriptions,
  deletePrescription,
  updatePrescription,
} from "../../../services/prescriptionService";

const PrescriptionList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all prescriptions
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await getAllPrescriptions();
      // API returns { success: true, data: [...] }
      setPrescriptions(res.data?.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setError("Failed to fetch prescriptions");
      setPrescriptions([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Delete prescription
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prescription?"))
      return;
    try {
      await deletePrescription(id);
      alert("Prescription deleted successfully");
      // Refresh list
      fetchPrescriptions();
    } catch (err) {
      console.error("Failed to delete prescription:", err);
      alert("Failed to delete prescription");
    }
  };

  // Update prescription: navigate to edit page or open modal (example)
  const handleUpdate = (id) => {
    // You can implement routing to an edit page like:
    // navigate(`/prescriptions/edit/${id}`)
    alert(`Implement update functionality for prescription ID: ${id}`);
  };

  if (loading) return <div>Loading prescriptions...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!Array.isArray(prescriptions) || prescriptions.length === 0)
    return <div>No prescriptions found.</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "20px auto", padding: 12 }}>
      <h2>All Prescriptions</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 12,
        }}
      >
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
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {p.patientName || "N/A"}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {p.diagnosis}
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                {p.doctorName} ({p.doctorSpecialization})
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <button
                  onClick={() => handleUpdate(p._id)}
                  style={{
                    padding: "4px 8px",
                    marginRight: 8,
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                  }}
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionList;
