import { useEffect, useState } from "react";

function AppointmentsDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/bookings");
        const data = await res.json();
        setAppointments(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) {
    return <p className="p-4">Loading appointments...</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📋 Appointments Dashboard</h2>
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Patient</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Doctor</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Date</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt._id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {appt.patientName}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {appt.doctor?.name || appt.doctor}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {new Date(appt.date).toLocaleDateString()}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {appt.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AppointmentsDashboard;
