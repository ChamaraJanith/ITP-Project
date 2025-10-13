import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get('http://localhost:7000/api/appointments');

        // If localStorage doesn't have email yet, use last booked appointment
        let email = localStorage.getItem('userEmail');
        if (!email && res.data.length > 0) {
          // take the last appointment as the current user
          email = res.data[res.data.length - 1].email;
          localStorage.setItem('userEmail', email);
        }

        setUserEmail(email || '');

        const userAppointments = email
          ? res.data.filter(app => app.email === email)
          : [];
        setAppointments(userAppointments);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading appointments...</p>;

  return (
    <div className="appointment-container">
      <div className="appointment-card">
        <h2>My Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments found for {userEmail || 'your account'}.</p>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Specialty</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app._id}>
                  <td>{app.name}</td>
                  <td>{app.email}</td>
                  <td>{app.phone}</td>
                  <td>{app.doctorSpecialty}</td>
                  <td>{app.doctorName || '-'}</td>
                  <td>{app.appointmentDate}</td>
                  <td>{app.appointmentTime}</td>
                  <td>${app.fee.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Appointments;
