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
        console.log('Fetched appointment data:', response.data); // Debug log
        setAppointment(response.data.appointment || response.data);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    try {
      // Handle time format like "14:30"
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = minutes || '00';
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minute} ${period}`;
    } catch (error) {
      return timeString; // Return original if formatting fails
    }
  };

  const generateReceiptHTML = () => {
    if (!appointment) return '';

    const currentDate = new Date();
    const transactionId = `TXN${Math.floor(Math.random() * 1000000000)}`;
    const appointmentFee = parseFloat(appointment.fee || 100);
    const processingFee = 0;
    const taxAmount = 0;
    const totalAmount = appointmentFee + processingFee + taxAmount;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HealX Healthcare Receipt - ${appointmentId}</title>
    <style>
        * {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: rgb(31, 41, 55);
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @media print {
            @page {
                margin: 0.5in;
                size: A4;
            }
            
            .no-print {
                display: none !important;
            }
            
            body {
                background: white !important;
            }
        }

        body {
            background: white;
            line-height: 1.4;
        }

        .receipt-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }

        .company-info h1 {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .company-tagline {
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
        }

        .receipt-info {
            text-align: right;
        }

        .receipt-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }

        .receipt-number {
            font-size: 12px;
            color: #6b7280;
        }

        .company-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .company-address {
            flex: 1;
        }

        .company-address div {
            font-size: 11px;
            color: #4b5563;
            margin-bottom: 3px;
        }

        .receipt-details {
            text-align: right;
            flex: 1;
        }

        .receipt-details div {
            font-size: 11px;
            color: #1f2937;
            font-weight: bold;
            margin-bottom: 3px;
        }

        .section {
            margin-bottom: 25px;
        }

        .section-header {
            background: #f3f4f6;
            padding: 10px 15px;
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
            border: 1px solid #d1d5db;
            margin-bottom: 10px;
        }

        .payment-header {
            background: #2563eb;
            color: white;
            text-align: center;
            font-size: 16px;
        }

        .instructions-header {
            background: #fef2f2;
            color: #dc2626;
            border-color: #fecaca;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .info-grid-four {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 15px;
        }

        .info-item {
            display: flex;
            flex-direction: column;
        }

        .info-label {
            font-size: 10px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 11px;
            color: #1f2937;
        }

        .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .payment-table th {
            background: #374151;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
        }

        .payment-table th:last-child {
            text-align: right;
        }

        .payment-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
        }

        .payment-table td:last-child {
            text-align: right;
        }

        .payment-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        .total-row {
            background: #f9fafb !important;
            border-top: 2px solid #2563eb;
        }

        .total-row td {
            font-weight: bold;
            font-size: 12px;
        }

        .total-amount {
            color: #2563eb;
            font-size: 14px;
        }

        .payment-status-paid {
            color: #059669;
            font-weight: bold;
            background: #ecfdf5;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
        }

        .instructions {
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 5px;
            padding: 15px;
        }

        .instruction-list {
            list-style: none;
            padding-left: 0;
        }

        .instruction-list li {
            font-size: 10px;
            color: #4b5563;
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
        }

        .instruction-list li:before {
            content: "•";
            color: #dc2626;
            font-weight: bold;
            position: absolute;
            left: 0;
        }

        .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }

        .contact-item {
            text-align: center;
        }

        .contact-header {
            font-size: 11px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .contact-info {
            font-size: 10px;
            color: #1f2937;
            margin-bottom: 2px;
        }

        .contact-sub {
            font-size: 9px;
            color: #6b7280;
            font-style: italic;
        }

        .footer {
            margin-top: 40px;
            border-top: 1px solid #d1d5db;
            padding-top: 20px;
            text-align: center;
        }

        .footer-title {
            font-size: 14px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .footer-subtitle {
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
            margin-bottom: 15px;
        }

        .generated-info {
            font-size: 8px;
            color: #9ca3af;
        }

        .print-button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
        }

        .print-button:hover {
            background: #1d4ed8;
        }

        @media screen and (max-width: 768px) {
            .receipt-container {
                margin: 10px;
                padding: 20px;
            }
            
            .header {
                flex-direction: column;
                gap: 15px;
            }
            
            .company-details {
                flex-direction: column;
                gap: 15px;
            }
            
            .info-grid, .info-grid-four {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .contact-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header Section -->
        <div class="header">
            <div class="company-info">
                <h1>HealX Healthcare</h1>
                <div class="company-tagline">Complete Healthcare Solutions</div>
            </div>
            <div class="receipt-info">
                <div class="receipt-title">PAYMENT RECEIPT</div>
                <div class="receipt-number">Receipt #: ${transactionId}</div>
            </div>
        </div>

        <!-- Company Details Section -->
        <div class="company-details">
            <div class="company-address">
                <div>HealX Healthcare System</div>
                <div>123 Medical Center Drive</div>
                <div>Healthcare City, HC 12345</div>
                <div>Phone: (555) 123-4567</div>
                <div>Email: billing@healx.com</div>
                <div>Website: www.healx.com</div>
            </div>
            <div class="receipt-details">
                <div>Date: ${currentDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
                <div>Time: ${currentDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}</div>
                <div>Appointment ID: ${appointmentId}</div>
            </div>
        </div>

        <!-- Patient Information Section -->
        <div class="section">
            <div class="section-header">PATIENT INFORMATION</div>
            <div class="info-grid-four">
                <div class="info-item">
                    <div class="info-label">Patient Name:</div>
                    <div class="info-value">${appointment.name || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Patient ID:</div>
                    <div class="info-value">${appointment._id?.slice(-8) || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Contact Number:</div>
                    <div class="info-value">${appointment.phone || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${appointment.email || 'Not specified'}</div>
                </div>
            </div>
        </div>

        <!-- Appointment Details Section -->
        <div class="section">
            <div class="section-header">APPOINTMENT DETAILS</div>
            <div class="info-grid-four">
                <div class="info-item">
                    <div class="info-label">Doctor:</div>
                    <div class="info-value">Dr. ${appointment.doctorName || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Department:</div>
                    <div class="info-value">${appointment.doctorSpecialty || 'General Medicine'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date:</div>
                    <div class="info-value">${formatDate(appointment.appointmentDate)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Time:</div>
                    <div class="info-value">${formatTime(appointment.appointmentTime)}</div>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <div class="info-item">
                    <div class="info-label">Location:</div>
                    <div class="info-value">${appointment.location || 'Main Hospital'}</div>
                </div>
            </div>
        </div>

        <!-- Payment Summary Section -->
        <div class="section">
            <div class="section-header payment-header">PAYMENT SUMMARY</div>
            <table class="payment-table">
                <thead>
                    <tr>
                        <th>DESCRIPTION</th>
                        <th style="text-align: center;">QTY</th>
                        <th style="text-align: right;">AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Medical Consultation Fee</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">$${appointmentFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Processing Fee</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">$${processingFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Tax (0%)</td>
                        <td style="text-align: center;">-</td>
                        <td style="text-align: right;">$${taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>TOTAL AMOUNT PAID</strong></td>
                        <td></td>
                        <td class="total-amount"><strong>$${totalAmount.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Payment Information Section -->
        <div class="section">
            <div class="section-header">PAYMENT INFORMATION</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Payment Method:</div>
                    <div class="info-value">Credit Card ending in •••• 4242</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Payment Status:</div>
                    <div class="info-value"><span class="payment-status-paid">PAID</span></div>
                </div>
                <div class="info-item">
                    <div class="info-label">Transaction ID:</div>
                    <div class="info-value">${transactionId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Payment Date:</div>
                    <div class="info-value">${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</div>
                </div>
            </div>
        </div>

        <!-- Important Instructions Section -->
        <div class="section">
            <div class="section-header instructions-header">IMPORTANT INSTRUCTIONS</div>
            <div class="instructions">
                <ul class="instruction-list">
                    <li>Please arrive 15 minutes before your scheduled appointment time</li>
                    <li>Bring a valid photo ID, insurance card, and current medication list</li>
                    <li>This receipt serves as proof of payment for insurance purposes</li>
                    <li>Keep this receipt for your medical records and tax purposes</li>
                    <li>If you need to reschedule, please call us at least 24 hours in advance</li>
                </ul>
            </div>
        </div>

        <!-- Contact Information Section -->
        <div class="section">
            <div class="section-header">CONTACT INFORMATION</div>
            <div class="contact-grid">
                <div class="contact-item">
                    <div class="contact-header">📞 PHONE</div>
                    <div class="contact-info">(555) 123-4567</div>
                    <div class="contact-sub">Available 24/7</div>
                </div>
                <div class="contact-item">
                    <div class="contact-header">✉️ EMAIL</div>
                    <div class="contact-info">support@healx.com</div>
                    <div class="contact-sub">Response within 24hrs</div>
                </div>
                <div class="contact-item">
                    <div class="contact-header">🕒 HOURS</div>
                    <div class="contact-info">Mon-Fri: 8AM-6PM</div>
                    <div class="contact-sub">Sat-Sun: 9AM-2PM</div>
                </div>
            </div>
        </div>

        <!-- Footer Section -->
        <div class="footer">
            <div class="footer-title">Thank you for choosing HealX Healthcare!</div>
            <div class="footer-subtitle">Your health is our priority. We are committed to providing you with the best healthcare experience.</div>
            <div class="generated-info">Generated on ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</div>
        </div>

        <!-- Print Button (Hidden in print) -->
        <button class="print-button no-print" onclick="window.print()">📄 Generate PDF Receipt</button>
    </div>

    <script>
        // Auto-focus for immediate print capability
        document.addEventListener('DOMContentLoaded', function() {
            // Optional: Auto-print when page loads (uncomment if needed)
            // window.print();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
    </script>
</body>
</html>`;
  };

  const handleDownloadReceipt = () => {
    if (!appointment) return;

    const receiptHTML = generateReceiptHTML();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Focus the new window and trigger print dialog
      printWindow.focus();
      
      // Small delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      // Fallback: Create blob and download as HTML (can be printed later)
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealX-Receipt-${appointmentId}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Receipt HTML downloaded. Open the file and use Ctrl+P to save as PDF.');
    }
  };

  const handleAddToCalendar = () => {
    if (!appointment || !appointment.appointmentDate) return;
    
    const eventDate = new Date(appointment.appointmentDate);
    if (appointment.appointmentTime) {
      const [hours, minutes] = appointment.appointmentTime.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const endDate = new Date(eventDate);
    endDate.setHours(endDate.getHours() + 1);
    
    const calendarEvent = {
      title: `Medical Appointment with Dr. ${appointment.doctorName || 'Doctor'}`,
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      description: `Appointment at ${appointment.location || 'Main Hospital'}. Specialty: ${appointment.doctorSpecialty || 'General'}`,
      location: appointment.location || 'Main Hospital'
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEvent.title)}&dates=${calendarEvent.start.replace(/[-:]/g, '').split('.')[0]}Z/${calendarEvent.end.replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(calendarEvent.description)}&location=${encodeURIComponent(calendarEvent.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const handleSendReceipt = async () => {
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
                  <span className="detail-label">Patient Name</span>
                  <span className="detail-value">{appointment.name || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Doctor</span>
                  <span className="detail-value">Dr. {appointment.doctorName || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Specialty</span>
                  <span className="detail-value">{appointment.doctorSpecialty || 'General Medicine'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {formatDate(appointment.appointmentDate)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{formatTime(appointment.appointmentTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact</span>
                  <span className="detail-value">{appointment.phone || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{appointment.email || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Appointment Type</span>
                  <span className="detail-value">{appointment.appointmentType || 'consultation'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Urgency</span>
                  <span className="detail-value">{appointment.urgency || 'normal'}</span>
                </div>
              </div>
              
              {appointment.symptoms && (
                <div className="symptoms-section">
                  <h3>Symptoms/Reason for Visit</h3>
                  <p>{appointment.symptoms}</p>
                </div>
              )}
            </div>

            <div className="payment-summary">
              <h2>Payment Summary</h2>
              <div className="payment-row">
                <span>Appointment Fee</span>
                <span>${appointment.fee || '5000.00'}</span>
              </div>
              <div className="payment-row">
                <span>Processing Fee</span>
                <span>$0.00</span>
              </div>
              <div className="payment-row total">
                <span>Total Paid</span>
                <span>${appointment.fee || '5000.00'}</span>
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
                    <p>Please arrive 15 minutes before your scheduled appointment time: {formatTime(appointment.appointmentTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="action-buttons">
          <button className="btn-primary" onClick={handleDownloadReceipt}>
            <span className="btn-icon">📄</span>
            Generate PDF Receipt
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
              <span>appointments@healx.com</span>
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
