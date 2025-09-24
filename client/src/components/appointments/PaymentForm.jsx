import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../appointments/styles/PaymentForm.css';

const PaymentForm = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);
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

  // Fetch appointment to determine fee
  useEffect(() => {
    axios.get(`http://localhost:7000/api/appointments/${appointmentId}`)
      .then(res => {
        // Example: flat fee or based on specialty
        setAmount(100); 
      })
      .catch(() => setAmount(100));
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
    if (promoCode.toUpperCase() === 'HEALTH10') {
      setDiscount(amount * 0.1);
    } else {
      setDiscount(0);
      setErrors({ promoCode: 'Invalid promo code' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      navigate(`/confirmation/${appointmentId}`);
    }, 2000);
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
          <div className="payment-amount">
            <span>Total Amount</span>
            <strong>${totalAmount.toFixed(2)}</strong>
          </div>
        </div>
        
        <form onSubmit={handlePayment} className="payment-form">
          <div className="payment-methods">
            <button 
              type="button" 
              className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              Credit/Debit Card
            </button>
            <button 
              type="button" 
              className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              PayPal
            </button>
            <button 
              type="button" 
              className={`payment-method ${paymentMethod === 'wallet' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('wallet')}
            >
              Digital Wallet
            </button>
          </div>
          
          {paymentMethod === 'card' && (
            <>
              <div className="form-section">
                <h3>Card Information</h3>
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
                <h3>Billing Information</h3>
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
                  <label>Promo Code</label>
                  <div className="promo-input">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                    />
                    <button type="button" onClick={applyPromoCode}>Apply</button>
                  </div>
                  {errors.promoCode && <span className="error">{errors.promoCode}</span>}
                  {discount > 0 && (
                    <span className="success">Promo code applied! You saved ${discount.toFixed(2)}</span>
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
                <label htmlFor="saveCard">Save card for future payments</label>
              </div>
            </>
          )}
          
          {paymentMethod === 'paypal' && (
            <div className="paypal-section">
              <div className="paypal-info">
                <p>You will be redirected to PayPal to complete your payment.</p>
                <div className="paypal-button">
                  <div className="paypal-logo">PayPal</div>
                  <div className="paypal-text">Pay with PayPal</div>
                </div>
              </div>
            </div>
          )}
          
          {paymentMethod === 'wallet' && (
            <div className="wallet-section">
              <p>Pay with your preferred digital wallet:</p>
              <div className="wallet-options">
                <button type="button" className="wallet-btn">
                  <span className="wallet-icon">🍎</span> Apple Pay
                </button>
                <button type="button" className="wallet-btn">
                  <span className="wallet-icon">G</span> Google Pay
                </button>
                <button type="button" className="wallet-btn">
                  <span className="wallet-icon">🅿️</span> PayPal
                </button>
              </div>
            </div>
          )}
          
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Appointment Fee</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="security-notice">
            <div className="security-icon">🔒</div>
            <p>Your payment information is encrypted and secure. We never store your credit card details.</p>
          </div>
          
          <button 
            type="submit" 
            className="pay-button" 
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              `Pay $${totalAmount.toFixed(2)}`
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
                <a href="/terms">Terms of Service</a> and 
                <a href="/privacy">Privacy Policy</a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;