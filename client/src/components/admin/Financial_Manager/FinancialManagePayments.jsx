import React, { useEffect, useState } from "react";
import { MdInventory, MdAnalytics, MdHome, MdPayment, MdCheckCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../Financial_Manager/FinancialManagePayments.css";

const APPOINTMENTS_API_URL = "http://localhost:7000/api/appointments";

function PatientSuccessfulPayments() {
  const [successfulPayments, setSuccessfulPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const navigate = useNavigate();

  // calculate consultation fee by specialty
  const calculateConsultationFee = (specialtyRaw) => {
    const s = (specialtyRaw || "").toLowerCase();
    if (s.includes("cardio")) return 6000;
    if (s.includes("orthopedic")) return 6000;
    if (s.includes("dermatologist") || s.includes("dermatology") || s.includes("skin")) return 5500;
    if (s.includes("general") && s.includes("physician")) return 4000;
    if (s.includes("neurologist") || s.includes("brain") || s.includes("nerve")) return 7000;
    if (s.includes("pediatric") || s.includes("child")) return 4500;
    if (s.includes("gynecologist") || s.includes("women")) return 5500;
    if (s.includes("psychiatrist") || s.includes("mental")) return 6500;
    if (s.includes("dentist") || s.includes("dental")) return 3500;
    if (s.includes("eye") || s.includes("ophthalmologist")) return 5000;
    if (s.includes("ent") || s.includes("ear") || s.includes("nose") || s.includes("throat")) return 4800;
    return 5000;
  };

  // fetch accepted appointments
  const fetchSuccessfulPayments = async () => {
    try {
      setLoading(true);
      setMessage("Loading accepted appointments...");
      const res = await fetch(APPOINTMENTS_API_URL);
      const text = await res.text();
      let data = [];
      try {
        data = JSON.parse(text);
        if (!Array.isArray(data)) {
          if (data.success && data.data) data = Array.isArray(data.data) ? data.data : [data.data];
          else if (data.appointments) data = Array.isArray(data.appointments) ? data.appointments : [data.appointments];
          else if (data.appointment) data = [data.appointment];
          else data = [];
        }
      } catch {
        data = [];
      }
      const accepted = data.filter((apt) => apt.status === "accepted");
      const enriched = accepted.map((apt) => {
        const fee = calculateConsultationFee(apt.doctorSpecialty);
        const age = apt.age || (
          apt.dateOfBirth
            ? (() => {
                const d = new Date(apt.dateOfBirth), t = new Date();
                let a = t.getFullYear() - d.getFullYear();
                if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
                return a;
              })()
            : ""
        );
        return {
          ...apt,
          totalAmount: fee,
          amountPaid: fee,
          paymentMethod: apt.paymentMethod || "Credit Card",
          transactionId: apt.transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          paymentDate: apt.paymentDate || apt.acceptedAt || new Date().toISOString(),
          paymentStatus: "paid",
          age,
          patientName: apt.name,
          formattedAppointmentDate: apt.appointmentDate ? apt.appointmentDate.split("T")[0] : ""
        };
      });
      setSuccessfulPayments(enriched);
      if (enriched.length) {
        const totalRevenue = enriched.reduce((s, a) => s + a.totalAmount, 0);
        setMessage(`Found ${enriched.length} accepted appointments totaling $${totalRevenue.toLocaleString()}`);
      } else {
        setMessage("No accepted appointments found.");
      }
    } catch (err) {
      setMessage(`Error fetching appointments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuccessfulPayments();
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hh = parseInt(h, 10), pm = hh >= 12, display = hh % 12 || 12;
    return `${display}:${m || "00"} ${pm ? "PM" : "AM"}`;
  };

  const filtered = successfulPayments.filter(a => {
    const js = !searchTerm
      || a.name.toLowerCase().includes(searchTerm.toLowerCase())
      || a.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
      || a._id.toLowerCase().includes(searchTerm.toLowerCase());
    const jd = !filterDate || a.formattedAppointmentDate === filterDate;
    return js && jd;
  });

  const totalRevenue = filtered.reduce((s, a) => s + a.totalAmount, 0);

  const handleReturnHome = () => navigate("/admin/financial");
  
  // **FIXED: Updated handlePaymentAnalysis to pass the correct data structure**
  const handlePaymentAnalysis = () => {
    // Get the raw appointment data for conversion
    const appointmentData = successfulPayments.map(payment => ({
      ...payment,
      status: "accepted" // Ensure status is set
    }));

    navigate("/admin/financial/payments/total-view", { 
      state: { 
        appointments: appointmentData,
        type: 'successful-appointments',
        // Also include the converted payments as backup
        payments: filtered,
        stats: {
          totalPayments: filtered.length,
          totalAmountDue: filtered.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
          totalAmountPaid: filtered.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          totalPending: 0,
          collectionRate: 100,
          paymentMethods: filtered.reduce((acc, p) => {
            const method = p.paymentMethod || "Credit Card";
            acc[method] = (acc[method] || 0) + (p.amountPaid || 0);
            return acc;
          }, {}),
          hospitalBreakdown: filtered.reduce((acc, p) => {
            const hospital = p.doctorSpecialty || "General Medicine";
            if (!acc[hospital]) {
              acc[hospital] = { totalValue: 0, totalDue: 0, totalPaid: 0, count: 0 };
            }
            acc[hospital].totalDue += (p.totalAmount || 0);
            acc[hospital].totalPaid += (p.amountPaid || 0);
            acc[hospital].count += 1;
            return acc;
          }, {})
        }
      } 
    });
  };

  const handleInventoryAnalysis = () => {
    navigate("/admin/financial/payments/inventory-view", {
      state: {
        inventoryItems: successfulPayments,
        inventoryStats: {
          totalItems: successfulPayments.length,
          totalQuantity: successfulPayments.reduce((sum, a) => sum + (a.quantity||1), 0),
          totalValue: successfulPayments.reduce((sum, a) => sum + (a.totalAmount||0), 0),
          lowStockCount: successfulPayments.filter(a => (a.quantity||0) < (a.minStockLevel||1)).length,
          outOfStockCount: successfulPayments.filter(a => (a.quantity||0) === 0).length,
          categoryBreakdown: successfulPayments.reduce((acc, a) => {
            const c = a.doctorSpecialty || "General";
            if (!acc[c]) acc[c] = { totalValue: 0, count: 0, totalQuantity: 0, lowStockCount: 0 };
            acc[c].totalValue += a.totalAmount;
            acc[c].count++;
            acc[c].totalQuantity += a.quantity || 1;
            if (a.quantity && a.quantity < (a.minStockLevel || 1)) acc[c].lowStockCount++;
            return acc;
          }, {}),
          supplierBreakdown: {},
          lowStockItems: successfulPayments.filter(a => (a.quantity||0) < (a.minStockLevel||1)),
          outOfStockItems: successfulPayments.filter(a => (a.quantity||0) === 0)
        }
      }
    });
  };

  const renderDetails = (a) => (
    <div className="appointment-details successful-payment">
      <div className="success-header">
        <MdCheckCircle size={24} />
        <span> Payment Confirmed!</span>
      </div>
      <div className="fee-display">
        <span>${a.totalAmount.toLocaleString()}</span> <small>{a.doctorSpecialty}</small>
      </div>
      <div className="info-grid">
        <div><strong>Patient:</strong> {a.name}</div>
        <div><strong>Age:</strong> {a.age}</div>
        <div><strong>Doctor:</strong> {a.doctorName}</div>
        <div><strong>Date:</strong> {formatDate(a.appointmentDate)}</div>
        <div><strong>Time:</strong> {formatTime(a.appointmentTime)}</div>
      </div>
    </div>
  );

  // **ADDED: generatePatientReceipt function that was missing**
  const generatePatientReceipt = (appointment) => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Receipt - Heal-X</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .receipt-header { text-align: center; margin-bottom: 20px; }
          .receipt-details { margin: 20px 0; }
          .receipt-total { font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h2>🏥 Heal-X Healthcare</h2>
          <p>Official Payment Receipt</p>
        </div>
        <div class="receipt-details">
          <p><strong>Patient:</strong> ${appointment.name}</p>
          <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
          <p><strong>Specialty:</strong> ${appointment.doctorSpecialty}</p>
          <p><strong>Date:</strong> ${formatDate(appointment.appointmentDate)}</p>
          <p><strong>Time:</strong> ${formatTime(appointment.appointmentTime)}</p>
          <p><strong>Transaction ID:</strong> ${appointment.transactionId}</p>
          <p><strong>Payment Method:</strong> ${appointment.paymentMethod}</p>
        </div>
        <div class="receipt-total">
          <p>Amount Paid: $${appointment.totalAmount.toLocaleString()}</p>
          <p>Status: PAID ✅</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p><em>Thank you for choosing Heal-X Healthcare!</em></p>
        </div>
      </body>
      </html>
    `;

    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(receiptContent);
      newWindow.document.close();
      newWindow.print();
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="patient-payments-container">
      {/* Header */}
      <div className="patient-payments-header">
        <h2 className="patient-payments-title">Patient Successful Payments</h2>
        <div className="header-buttons">
          <button className="btn-base btn-home" onClick={handleReturnHome}>
            <MdHome size={18} />
            <span>Return Home</span>
          </button>
          <button className="btn-base btn-analysis" onClick={handlePaymentAnalysis}>
            <MdAnalytics size={18} />
            <span>Payment Analysis</span>
          </button>
          <button className="btn-base btn-inventory" onClick={handleInventoryAnalysis}>
            <MdInventory size={18} />
            <span>Inventory Analysis</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="success-summary">
        <div className="summary-card">
          <MdCheckCircle size={32} />
          <div><h3>{filtered.length}</h3><p>Accepted Appointments</p></div>
        </div>
        <div className="summary-card">
          <MdPayment size={32} />
          <div><h3>${totalRevenue.toLocaleString()}</h3><p>Total Revenue</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, doctor, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="date-filter">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      {message && <div className="status-message">{message}</div>}

      {/* Table */}
      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Details</th>
              <th>Fee</th>
              <th>Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((a) => (
                <tr key={a._id}>
                  <td>{renderDetails(a)}</td>
                  <td>${a.totalAmount.toLocaleString()}</td>
                  <td>${a.amountPaid.toLocaleString()}</td>
                  <td>
                    <button onClick={() => generatePatientReceipt(a)}>
                      <MdPayment /> Receipt
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No accepted appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PatientSuccessfulPayments;
