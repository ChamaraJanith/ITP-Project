import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([
    '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'
  ]);

  // Fetch doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('/api/doctors'); // API to get doctors
        setDoctors(response.data);
      } catch (error) {
        console.error('Error fetching doctors', error);
      }
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bookingData = {
      doctorId: selectedDoctor,
      date,
      time: timeSlot
    };

    try {
      const response = await axios.post('/api/appointments', bookingData);
      alert('Appointment booked successfully!');
      console.log(response.data);
    } catch (error) {
      console.error('Error booking appointment', error);
      alert('Failed to book appointment');
    }
  };

  return (
    <div className="booking-form" style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>Book an Appointment</h2>
      <form onSubmit={handleSubmit}>
        {/* Select Doctor */}
        <div style={{ marginBottom: '10px' }}>
          <label>Doctor:</label>
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required>
            <option value="">Select Doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name} - {doc.specialization}
              </option>
            ))}
          </select>
        </div>

        {/* Select Date */}
        <div style={{ marginBottom: '10px' }}>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Select Time Slot */}
        <div style={{ marginBottom: '10px' }}>
          <label>Time Slot:</label>
          <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required>
            <option value="">Select Time Slot</option>
            {availableSlots.map((slot, index) => (
              <option key={index} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Book Appointment
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
