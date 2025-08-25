import React, { useEffect, useState } from "react";
import '../Financial_Manager/financialManagePayments.css';

const API_URL = "http://localhost:7000/api/payments";

function FinancialManagePayments() {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({
    hospitalName: "",
    branchName: "",
    invoiceNumber: "",
    patientName: "",
    doctorName: "",
    totalAmount: "",
    amountPaid: "",
    paymentMethod: "Cash",
    note: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const fetchPayments = () => {
    setMessage("");
    fetch(API_URL)
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          console.error("Raw response (should be JSON):", text);
          throw new Error(
            "Not valid JSON. Check console for raw response. Are you hitting the right endpoint? (Did the server respond with an error page?)"
          );
        }
      })
      .then(setPayments)
      .catch((err) => setMessage("Error fetching payments: " + err.message));
  };

  useEffect(fetchPayments, []);

  const buildPayload = (src) => ({
    hospitalName: src.hospitalName.trim(),
    branchName: src.branchName?.trim() || "",
    invoiceNumber: src.invoiceNumber.trim(),
    patientName: src.patientName.trim(),
    doctorName: src.doctorName?.trim() || "",
    totalAmount: Number(src.totalAmount),
    amountPaid: Number(src.amountPaid),
    paymentMethod: src.paymentMethod,
    note: src.note?.trim() || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    if (
      !form.hospitalName.trim() ||
      !form.invoiceNumber.trim() ||
      !form.patientName.trim() ||
      !form.totalAmount ||
      !form.amountPaid
    ) {
      setMessage("Please fill all required fields.");
      return;
    }
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const payload = buildPayload(form);

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Raw response (should be JSON):", text);
          throw new Error(
            "Not valid JSON response. Check console for raw response."
          );
        }
        if (!res.ok) throw new Error(data.message || "Server error");
        return data;
      })
      .then((data) => {
        setMessage(data.message || (editingId ? "Updated" : "Created"));
        fetchPayments();
      })
      .catch((err) => setMessage("Error: " + err.message))
      .finally(() => {
        setEditingId(null);
        setForm({
          hospitalName: "",
          branchName: "",
          invoiceNumber: "",
          patientName: "",
          doctorName: "",
          totalAmount: "",
          amountPaid: "",
          paymentMethod: "Cash",
          note: "",
        });
      });
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      hospitalName: p.hospitalName || "",
      branchName: p.branchName || "",
      invoiceNumber: p.invoiceNumber || "",
      patientName: p.patientName || "",
      doctorName: p.doctorName || "",
      totalAmount: p.totalAmount || "",
      amountPaid: p.amountPaid || "",
      paymentMethod: p.paymentMethod || "Cash",
      note: p.note || "",
    });
    setMessage("");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this payment?")) return;
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Raw response (should be JSON):", text);
          throw new Error(
            "Not valid JSON response. Check console for raw response."
          );
        }
        if (!res.ok) throw new Error(data.message || "Server error");
        setMessage(data.message || "Deleted");
        setPayments((prev) => prev.filter((p) => p._id !== id));
      })
      .catch((err) => setMessage("Error: " + err.message));
  };

  return (
    <div className="financial-container">
      <h2 className="financial-title">Payment Management</h2>
      {message && (
        <div className={`financial-message ${/error|fail|not /i.test(message) ? "error" : "success"}`}>
          {message}
        </div>
      )}
      <table className="financial-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Hospital</th>
            <th>Branch</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Method</th>
            <th>Date</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p._id}>
              <td>{p.invoiceNumber}</td>
              <td>{p.hospitalName}</td>
              <td>{p.branchName}</td>
              <td>{p.patientName}</td>
              <td>{p.doctorName}</td>
              <td>{p.totalAmount}</td>
              <td>{p.amountPaid}</td>
              <td>{p.paymentMethod}</td>
              <td>{p.date}</td>
              <td>{p.note}</td>
              <td className="financial-actions">
                <button onClick={() => handleEdit(p)}>Edit</button>{" "}
                <button className="delete-btn" onClick={() => handleDelete(p._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={handleSubmit} className="financial-form">
        <h3>{editingId ? "Edit Payment" : "New Payment"}</h3>
        <input name="hospitalName" placeholder="Hospital Name*" value={form.hospitalName} onChange={handleChange} required /><br />
        <input name="branchName" placeholder="Branch Name" value={form.branchName} onChange={handleChange} /><br />
        <input name="invoiceNumber" placeholder="Invoice #*" value={form.invoiceNumber} onChange={handleChange} required /><br />
        <input name="patientName" placeholder="Patient Name*" value={form.patientName} onChange={handleChange} required /><br />
        <input name="doctorName" placeholder="Doctor Name" value={form.doctorName} onChange={handleChange} /><br />
        <input name="totalAmount" type="number" placeholder="Total Amount*" value={form.totalAmount} onChange={handleChange} required /><br />
        <input name="amountPaid" type="number" placeholder="Amount Paid*" value={form.amountPaid} onChange={handleChange} required /><br />
        <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Insurance">Insurance</option>
          <option value="Online">Online</option>
          <option value="Wallet">Wallet</option>
        </select><br />
        <input name="note" placeholder="Note" value={form.note} onChange={handleChange} /><br />
        <button type="submit">{editingId ? "Update" : "Create"}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({
                hospitalName: "",
                branchName: "",
                invoiceNumber: "",
                patientName: "",
                doctorName: "",
                totalAmount: "",
                amountPaid: "",
                paymentMethod: "Cash",
                note: "",
              });
            }}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default FinancialManagePayments;
