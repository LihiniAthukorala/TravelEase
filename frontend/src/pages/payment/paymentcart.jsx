import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentForm.css';

function PaymentForm() {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  // Get event registration data from location state if available
  const eventRegistrationData = location.state?.registrationData || {};
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    amount: location.state?.amount || ''
  });

  const [errors, setErrors] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    amount: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCardNumber = (cardNumber) => {
    const cardNumberRegex = /^[0-9]{16}$/;
    return cardNumberRegex.test(cardNumber.replace(/\s/g, '')) 
      ? '' 
      : 'Card number must be 16 digits';
  };

  const validateCardHolder = (cardHolder) => {
    const cardHolderRegex = /^[a-zA-Z\s]+$/;
    return cardHolderRegex.test(cardHolder) 
      ? '' 
      : 'Card holder name should contain only letters';
  };

  const validateExpiryDate = (expiryDate) => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      return 'Expiry date must be in MM/YY format';
    }
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return 'Card has expired';
    }
    
    return '';
  };

  const validateCVV = (cvv) => {
    const cvvRegex = /^[0-9]{3,4}$/;
    return cvvRegex.test(cvv) ? '' : 'CVV must be 3 or 4 digits';
  };

  const validateAmount = (amount) => {
    return amount > 0 ? '' : 'Amount must be greater than zero';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      const formattedValue = digitsOnly
        .substring(0, 16)
        .replace(/(\d{4})(?=\d)/g, '$1 ');
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'expiryDate') {
      const digitsOnly = value.replace(/\D/g, '');
      let formattedValue = digitsOnly;
      if (digitsOnly.length > 2) {
        formattedValue = `${digitsOnly.substring(0, 2)}/${digitsOnly.substring(2, 4)}`;
      }
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'cvv') {
      const digitsOnly = value.replace(/\D/g, '').substring(0, 4);
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    let errorMessage = '';
    switch (name) {
      case 'cardNumber':
        errorMessage = validateCardNumber(value);
        break;
      case 'cardHolder':
        errorMessage = validateCardHolder(value);
        break;
      case 'expiryDate':
        errorMessage = validateExpiryDate(value);
        break;
      case 'cvv':
        errorMessage = validateCVV(value);
        break;
      case 'amount':
        errorMessage = validateAmount(value);
        break;
      default:
        break;
    }
    
    setErrors({ ...errors, [name]: errorMessage });
  };

  const validateForm = () => {
    const newErrors = {
      cardNumber: validateCardNumber(formData.cardNumber),
      cardHolder: validateCardHolder(formData.cardHolder),
      expiryDate: validateExpiryDate(formData.expiryDate),
      cvv: validateCVV(formData.cvv),
      amount: validateAmount(formData.amount)
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          enqueueSnackbar('Please log in to continue', { variant: 'error' });
          navigate('/login');
          return;
        }

        // Prepare payment data for API
        const paymentData = {
          eventId: eventRegistrationData.eventId,
          amount: parseFloat(formData.amount),
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardHolder: formData.cardHolder,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          numberOfTickets: eventRegistrationData.numberOfTickets || 1,
          specialRequirements: eventRegistrationData.specialRequirements || ''
        };
        
        // Make the API call
        const response = await axios.post('http://localhost:5001/api/payments/submit', 
          paymentData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          enqueueSnackbar('Payment submitted successfully! Waiting for admin approval.', { 
            variant: 'success' 
          });
          
          navigate('/pending-approval', { 
            state: { 
              paymentId: response.data.payment.id 
            } 
          });
        }
      } catch (error) {
        console.error('Payment submission error:', error);
        let errorMessage = 'Failed to process payment';
        
        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        }
        
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      enqueueSnackbar('Please correct the errors in the form', { variant: 'error' });
    }
  };

  const getInputStyle = (fieldName) => ({
    width: '100%',
    padding: '8px',
    border: errors[fieldName] ? '1px solid red' : '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  });

  const errorStyle = {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px'
  };

  return (
    <div className="payment-page-container">
      <div className="payment-form-container">
        <div className="payment-header">
          <h2>Payment Details</h2>
          <div className="payment-secure-badge">
            <i className="fas fa-lock"></i> Secure Payment
          </div>
        </div>
        
        {eventRegistrationData.eventName && (
          <div className="event-info-card">
            <div className="event-info-header">Event Summary</div>
            <div className="event-info-content">
              <div className="event-info-row">
                <span className="event-info-label">Event:</span>
                <span className="event-info-value">{eventRegistrationData.eventName}</span>
              </div>
              <div className="event-info-row">
                <span className="event-info-label">Date:</span>
                <span className="event-info-value">{eventRegistrationData.eventDate}</span>
              </div>
              <div className="event-info-row">
                <span className="event-info-label">Tickets:</span>
                <span className="event-info-value">{eventRegistrationData.numberOfTickets}</span>
              </div>
              <div className="event-info-row total-row">
                <span className="event-info-label">Total:</span>
                <span className="event-info-value total-amount">LKR {eventRegistrationData.totalAmount}</span>
              </div>
            </div>
          </div>
        )}

        <form className="payment-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="section-title">Card Information</div>
            <div className="form-group">
              <label>Card Number</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
                <div className="card-icons">
                  <span className="card-icon visa"></span>
                  <span className="card-icon mastercard"></span>
                  <span className="card-icon amex"></span>
                </div>
              </div>
              {errors.cardNumber && <div className="error">{errors.cardNumber}</div>}
            </div>

            <div className="form-group">
              <label>Card Holder Name</label>
              <input
                type="text"
                name="cardHolder"
                value={formData.cardHolder}
                onChange={handleInputChange}
                placeholder="John Doe"
                maxLength={50}
                required
              />
              {errors.cardHolder && <div className="error">{errors.cardHolder}</div>}
            </div>

            <div className="card-details">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
                {errors.expiryDate && <div className="error">{errors.expiryDate}</div>}
              </div>

              <div className="form-group">
                <label>CVV</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                  <span className="cvv-tooltip" title="3-digit code on back of your card">?</span>
                </div>
                {errors.cvv && <div className="error">{errors.cvv}</div>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">Payment Amount</div>
            <div className="form-group amount-group">
              <label>Amount (LKR)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="1500.00"
                step="0.01"
                required
                readOnly={location.state?.amount}
              />
              {errors.amount && <div className="error">{errors.amount}</div>}
            </div>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
              style={{ backgroundColor: '#6c757d', color: 'white', border: 'none' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pay-btn"
              disabled={isSubmitting}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Submit Payment'
              )}
            </button>
          </div>
          
          <div className="payment-notes">
            <p className="note">
              <i className="fas fa-info-circle"></i>
              Your registration will be confirmed after payment approval by the administrator.
            </p>
            <div className="payment-security">
              <span className="security-icon encryption"></span>
              <span className="security-icon pci"></span>
              <span className="security-text">256-bit encryption | PCI DSS Compliant</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentForm;
