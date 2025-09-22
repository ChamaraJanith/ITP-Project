import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BookAppointment = () => {
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [availableSlots] = useState(['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']);

  // Fetch patient details after login
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const token = localStorage.getItem('token'); // JWT stored after login
        const response = await axios.get('http://localhost:5000/api/patients/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatient(response.data);
      } catch (error) {
        console.error('Error fetching patient details', error);
      }
    };

    fetchPatientDetails();
  }, []);

  // Fetch all doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/doctors');
        setDoctors(response.data);
      } catch (error) {
        console.error('Error fetching doctors', error);
      }
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const bookingData = {
      patientId: patient._id,
      doctorId: selectedDoctor,
      date,
      time: timeSlot
    };

    try {
      const response = await axios.post('http://localhost:5000/api/appointments', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Appointment booked successfully!');
      console.log(response.data);
    } catch (error) {
      console.error('Error booking appointment', error);
      alert('Failed to book appointment');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: 'auto', padding: '20px', color: '#fff' }}>
      <h2>Book Appointment</h2>
      <p>Schedule your medical appointment online</p>

      {/* Patient Details */}
      {patient ? (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
          <h3>Patient Details</h3>
          <p><strong>Name:</strong> {patient.name}</p>
          <p><strong>Email:</strong> {patient.email}</p>
          <p><strong>Phone:</strong> {patient.phone}</p>
        </div>
      ) : (
        <p>Loading patient details...</p>
      )}

      {/* Booking Form */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Doctor:</label>
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name} - {doc.specialization}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Date:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Time Slot:</label>
          <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
            <option value="">Select Time Slot</option>
            {availableSlots.map((slot, index) => (
              <option key={index} value={slot}>{slot}</option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ padding: '10px', width: '100%', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Book Appointment
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;
