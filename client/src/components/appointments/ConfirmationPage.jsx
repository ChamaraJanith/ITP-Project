// src/pages/ConfirmationPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../appointments/styles/ConfirmationPage.css';

const ConfirmationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptSent, setReceiptSent] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await axios.get(`http://localhost:7000/api/appointments/${appointmentId}`);
        setAppointment(response.data.appointment);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const handleDownloadReceipt = () => {
    // In a real app, this would generate and download a PDF receipt
    const receiptData = {
      appointmentId,
      amount: appointment?.fee || 100,
      date: new Date().toLocaleDateString(),
      transactionId: `TXN${Math.floor(Math.random() * 1000000000)}`
    };
    
    // Create a simple text receipt for demonstration
    const receiptContent = `
HEALTHCARE APPOINTMENT PAYMENT RECEIPT
=======================================
Appointment ID: ${receiptData.appointmentId}
Date: ${receiptData.date}
Transaction ID: ${receiptData.transactionId}
Amount Paid: $${receiptData.amount.toFixed(2)}
Payment Method: Credit Card
Status: Paid

Thank you for your payment!
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${appointmentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddToCalendar = () => {
    if (!appointment) return;
    
    const eventDate = new Date(appointment.date);
    const endDate = new Date(eventDate);
    endDate.setHours(endDate.getHours() + 1); // Assume 1-hour appointment
    
    const calendarEvent = {
      title: `Medical Appointment with Dr. ${appointment.doctorName || 'Doctor'}`,
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      description: `Appointment at ${appointment.location || 'Main Hospital'}`,
      location: appointment.location || 'Main Hospital'
    };
    
    // Create Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEvent.title)}&dates=${calendarEvent.start.replace(/[-:]/g, '').split('.')[0]}Z/${calendarEvent.end.replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(calendarEvent.description)}&location=${encodeURIComponent(calendarEvent.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleSendReceipt = async () => {
    // In a real app, this would send an email receipt
    setReceiptSent(true);
    setTimeout(() => setReceiptSent(false), 3000);
  };

  const handleReschedule = () => {
    navigate(`/book-appointment?reschedule=${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading-spinner"></div>
        <p>Loading confirmation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="confirmation-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="success-animation">
          <div className="success-icon">✓</div>
          <div className="success-ring"></div>
        </div>
        
        <h1>Payment Confirmed!</h1>
        <p className="confirmation-message">
          Your appointment has been successfully booked and payment has been processed.
        </p>

        {appointment && (
          <>
            <div className="appointment-details">
              <h2>Appointment Details</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Appointment ID</span>
                  <span className="detail-value">{appointment._id || appointmentId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Doctor</span>
                  <span className="detail-value">Dr. {appointment.doctorName || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {appointment.date ? new Date(appointment.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not specified'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{appointment.time || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{appointment.location || 'Main Hospital'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{appointment.department || 'General Medicine'}</span>
                </div>
              </div>
            </div>

            <div className="payment-summary">
              <h2>Payment Summary</h2>
              <div className="payment-row">
                <span>Appointment Fee</span>
                <span>${appointment.fee || '100.00'}</span>
              </div>
              <div className="payment-row">
                <span>Processing Fee</span>
                <span>$0.00</span>
              </div>
              <div className="payment-row total">
                <span>Total Paid</span>
                <span>${appointment.fee || '100.00'}</span>
              </div>
              <div className="payment-info">
                <div className="info-item">
                  <span className="info-label">Payment Method</span>
                  <span className="info-value">Credit Card ending in •••• 4242</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Transaction ID</span>
                  <span className="info-value">TXN{Math.floor(Math.random() * 1000000000)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Payment Date</span>
                  <span className="info-value">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="next-steps">
              <h2>What's Next?</h2>
              <div className="steps-container">
                <div className="step">
                  <div className="step-icon">1</div>
                  <div className="step-content">
                    <h3>Check Your Email</h3>
                    <p>We've sent a confirmation email with all the details of your appointment.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-icon">2</div>
                  <div className="step-content">
                    <h3>Prepare for Your Visit</h3>
                    <p>Bring your ID, insurance card, and a list of current medications.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-icon">3</div>
                  <div className="step-content">
                    <h3>Arrive on Time</h3>
                    <p>Please arrive 15 minutes before your scheduled appointment time.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="action-buttons">
          <button className="btn-primary" onClick={handleDownloadReceipt}>
            <span className="btn-icon">📄</span>
            Download Receipt
          </button>
          <button className="btn-secondary" onClick={handleAddToCalendar}>
            <span className="btn-icon">📅</span>
            Add to Calendar
          </button>
          <button className="btn-secondary" onClick={handleSendReceipt} disabled={receiptSent}>
            <span className="btn-icon">✉️</span>
            {receiptSent ? 'Sent!' : 'Email Receipt'}
          </button>
          <button className="btn-outline" onClick={handleReschedule}>
            <span className="btn-icon">🔄</span>
            Reschedule
          </button>
        </div>

        <div className="contact-section">
          <h3>Need Help?</h3>
          <p>If you have any questions about your appointment or need to make changes, please contact us:</p>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span>(555) 123-4567</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <span>appointments@healthcare.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">🕒</span>
              <span>Mon-Fri: 8AM-6PM, Sat: 9AM-2PM</span>
            </div>
          </div>
        </div>

        <div className="return-home">
          <button className="btn-link" onClick={() => navigate('/')}>
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;