import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../appointments/styles/PaymentForm.css';

const PaymentForm = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: ''
  });
  const [billingDetails, setBillingDetails] = useState({
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [errors, setErrors] = useState({});
  const [saveCard, setSaveCard] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // **NEW: Calculate consultation fee based on specialty**
  const calculateConsultationFee = (specialty) => {
    let fee = 5000; // Default
    const specialtyLower = (specialty || '').toLowerCase();
    
    if (specialtyLower.includes('cardio')) fee = 6000;
    else if (specialtyLower.includes('orthopedic')) fee = 6000;
    else if (specialtyLower.includes('dermatologist')) fee = 5500;
    else if (specialtyLower.includes('general')) fee = 4000;
    else if (specialtyLower.includes('neurologist')) fee = 7000;
    else if (specialtyLower.includes('pediatrician')) fee = 4500;
    else if (specialtyLower.includes('gynecologist')) fee = 5500;
    else if (specialtyLower.includes('psychiatrist')) fee = 6500;
    else if (specialtyLower.includes('dentist')) fee = 3500;
    else if (specialtyLower.includes('eye') || specialtyLower.includes('ophthalmologist')) fee = 5000;
    else if (specialtyLower.includes('ent')) fee = 4800;
    
    return fee;
  };

  // **UPDATED: Fetch appointment to determine fee based on specialty**
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        // First try to get from localStorage (from appointment booking)
        const pendingAppointment = localStorage.getItem('pendingAppointment');
        if (pendingAppointment) {
          const appointmentData = JSON.parse(pendingAppointment);
          setAmount(appointmentData.fee || 5000);
          setAppointmentDetails({
            specialty: appointmentData.specialty,
            patientName: appointmentData.patientName,
            fee: appointmentData.fee
          });
          return;
        }

        // If not in localStorage, fetch from API
        const response = await axios.get(`http://localhost:7000/api/appointments/${appointmentId}`);
        if (response.data.success || response.data.appointment) {
          const appointment = response.data.appointment || response.data;
          const calculatedFee = calculateConsultationFee(appointment.doctorSpecialty);
          
          setAmount(calculatedFee);
          setAppointmentDetails({
            specialty: appointment.doctorSpecialty,
            patientName: appointment.name,
            fee: calculatedFee,
            doctorName: appointment.doctorName,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime
          });
        }
      } catch (error) {
        console.error('Error fetching appointment:', error);
        // Default fallback
        setAmount(5000);
        setAppointmentDetails({
          specialty: 'General Physician',
          fee: 5000
        });
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingDetails(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    if (code === 'HEALTH10') {
      setDiscount(amount * 0.1);
      setErrors(prev => ({ ...prev, promoCode: '' }));
    } else if (code === 'FIRST20') {
      setDiscount(amount * 0.2);
      setErrors(prev => ({ ...prev, promoCode: '' }));
    } else if (code === 'SAVE15') {
      setDiscount(amount * 0.15);
      setErrors(prev => ({ ...prev, promoCode: '' }));
    } else {
      setDiscount(0);
      setErrors({ promoCode: 'Invalid promo code' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentMethod === 'card') {
      if (!cardData.cardNumber) newErrors.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(cardData.cardNumber.replace(/\s/g, ''))) 
        newErrors.cardNumber = 'Invalid card number';
      
      if (!cardData.cardName) newErrors.cardName = 'Cardholder name is required';
      
      if (!cardData.expiryMonth) newErrors.expiryMonth = 'Month is required';
      else if (parseInt(cardData.expiryMonth) < 1 || parseInt(cardData.expiryMonth) > 12)
        newErrors.expiryMonth = 'Invalid month';
      
      if (!cardData.expiryYear) newErrors.expiryYear = 'Year is required';
      
      if (!cardData.cvc) newErrors.cvc = 'CVC is required';
      else if (!/^\d{3,4}$/.test(cardData.cvc)) newErrors.cvc = 'Invalid CVC';
      
      if (!billingDetails.email) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDetails.email))
        newErrors.email = 'Invalid email address';
      
      if (!billingDetails.phone) newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // **NEW: Process payment with appointment details**
      const paymentData = {
        appointmentId,
        amount: totalAmount,
        originalAmount: amount,
        discount,
        promoCode,
        paymentMethod,
        cardData: paymentMethod === 'card' ? cardData : null,
        billingDetails
      };

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear localStorage
      localStorage.removeItem('pendingAppointment');
      
      // Navigate to confirmation
      navigate(`/confirmation/${appointmentId}`, {
        state: {
          paymentData,
          appointmentDetails,
          totalAmount
        }
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrors({ general: 'Payment processing failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Add space every 4 digits
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  };

  const totalAmount = amount - discount;

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h2>Secure Payment</h2>
          
          {/* **NEW: Appointment Summary** */}
          {appointmentDetails && (
            <div className="appointment-summary">
              <h3>Appointment Summary</h3>
              <div className="summary-details">
                {appointmentDetails.patientName && (
                  <p><strong>Patient:</strong> {appointmentDetails.patientName}</p>
                )}
                <p><strong>Specialty:</strong> {appointmentDetails.specialty}</p>
                {appointmentDetails.doctorName && (
                  <p><strong>Doctor:</strong> {appointmentDetails.doctorName}</p>
                )}
                {appointmentDetails.appointmentDate && (
                  <p><strong>Date:</strong> {new Date(appointmentDetails.appointmentDate).toLocaleDateString()}</p>
                )}
                {appointmentDetails.appointmentTime && (
                  <p><strong>Time:</strong> {appointmentDetails.appointmentTime}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="payment-amount">
            <span>Total Amount</span>
            <strong>${totalAmount.toFixed(2)}</strong>
          </div>
        </div>
        
        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}
        
        <form onSubmit={handlePayment} className="payment-form">
          <div className="payment-methods">
            <button 
              type="button" 
              className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              💳 Credit/Debit Card
            </button>
            <button 
              type="button" 
              className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              💙 PayPal
            </button>
            <button 
              type="button" 
              className={`payment-method ${paymentMethod === 'wallet' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('wallet')}
            >
              📱 Digital Wallet
            </button>
          </div>
          
          {paymentMethod === 'card' && (
            <>
              <div className="form-section">
                <h3>💳 Card Information</h3>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formatCardNumber(cardData.cardNumber)}
                    onChange={handleCardChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                  {errors.cardNumber && <span className="error">{errors.cardNumber}</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiration Date</label>
                    <div className="expiry-inputs">
                      <select
                        name="expiryMonth"
                        value={cardData.expiryMonth}
                        onChange={handleCardChange}
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        name="expiryYear"
                        value={cardData.expiryYear}
                        onChange={handleCardChange}
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={String(year).slice(2)}>
                              {String(year).slice(2)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {(errors.expiryMonth || errors.expiryYear) && (
                      <span className="error">{errors.expiryMonth || errors.expiryYear}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>CVC</label>
                    <input
                      type="text"
                      name="cvc"
                      value={cardData.cvc}
                      onChange={handleCardChange}
                      placeholder="123"
                      maxLength="4"
                    />
                    {errors.cvc && <span className="error">{errors.cvc}</span>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    name="cardName"
                    value={cardData.cardName}
                    onChange={handleCardChange}
                    placeholder="John Doe"
                  />
                  {errors.cardName && <span className="error">{errors.cardName}</span>}
                </div>
              </div>
              
              <div className="form-section">
                <h3>📧 Billing Information</h3>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={billingDetails.email}
                    onChange={handleBillingChange}
                    placeholder="your@email.com"
                  />
                  {errors.email && <span className="error">{errors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={billingDetails.phone}
                    onChange={handleBillingChange}
                    placeholder="(123) 456-7890"
                  />
                  {errors.phone && <span className="error">{errors.phone}</span>}
                </div>
                
                <div className="form-group">
                  <label>Billing Address</label>
                  <input
                    type="text"
                    name="address"
                    value={billingDetails.address}
                    onChange={handleBillingChange}
                    placeholder="123 Main St"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={billingDetails.city}
                      onChange={handleBillingChange}
                      placeholder="New York"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={billingDetails.state}
                      onChange={handleBillingChange}
                      placeholder="NY"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      value={billingDetails.zip}
                      onChange={handleBillingChange}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
              
              <div className="promo-section">
                <div className="form-group">
                  <label>🎟️ Promo Code</label>
                  <div className="promo-input">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code (HEALTH10, FIRST20, SAVE15)"
                    />
                    <button type="button" onClick={applyPromoCode}>Apply</button>
                  </div>
                  {errors.promoCode && <span className="error">{errors.promoCode}</span>}
                  {discount > 0 && (
                    <span className="success">✅ Promo code applied! You saved ${discount.toFixed(2)}</span>
                  )}
                </div>
              </div>
              
              <div className="save-card-option">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                />
                <label htmlFor="saveCard">💾 Save card for future payments</label>
              </div>
            </>
          )}
          
          {paymentMethod === 'paypal' && (
            <div className="paypal-section">
              <div className="paypal-info">
                <div className="paypal-icon">💙</div>
                <h3>Pay with PayPal</h3>
                <p>You will be redirected to PayPal to complete your payment securely.</p>
                <div className="paypal-button">
                  <div className="paypal-logo">PayPal</div>
                  <div className="paypal-text">Pay ${totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
          
          {paymentMethod === 'wallet' && (
            <div className="wallet-section">
              <h3>📱 Digital Wallet</h3>
              <p>Choose your preferred digital wallet to complete the payment:</p>
              <div className="wallet-options">
                <button type="button" className="wallet-btn">
                  <span className="wallet-icon">🍎</span> 
                  <div>
                    <div>Apple Pay</div>
                    <small>Touch ID or Face ID</small>
                  </div>
                </button>
                <button type="button" className="wallet-btn">
                  <span className="wallet-icon">G</span> 
                  <div>
                    <div>Google Pay</div>
                    <small>One-tap payment</small>
                  </div>
                </button>
                <button type="button" className="wallet-btn">
                  <span className="wallet-icon">🅿️</span> 
                  <div>
                    <div>PayPal Wallet</div>
                    <small>Quick checkout</small>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          <div className="order-summary">
            <h3>📋 Order Summary</h3>
            <div className="summary-row">
              <span>{appointmentDetails?.specialty || 'Medical'} Consultation Fee</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>🎟️ Discount Applied</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row tax">
              <span>Processing Fee</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row total">
              <span><strong>Total Amount</strong></span>
              <span><strong>${totalAmount.toFixed(2)}</strong></span>
            </div>
          </div>
          
          <div className="security-notice">
            <div className="security-icon">🔒</div>
            <div>
              <strong>Your payment is secure</strong>
              <p>Your payment information is encrypted and secure. We never store your credit card details.</p>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="pay-button" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing Payment...
              </>
            ) : (
              <>
                🔒 Pay ${totalAmount.toFixed(2)} Securely
              </>
            )}
          </button>
          
          <div className="payment-footer">
            <div className="accepted-cards">
              <span>We accept:</span>
              <div className="card-icons">
                <span className="card-icon visa">VISA</span>
                <span className="card-icon mastercard">MC</span>
                <span className="card-icon amex">AMEX</span>
                <span className="card-icon discover">DISC</span>
              </div>
            </div>
            
            <div className="terms">
              <p>
                By completing this purchase you agree to our 
                <a href="/terms"> Terms of Service</a> and 
                <a href="/privacy"> Privacy Policy</a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
