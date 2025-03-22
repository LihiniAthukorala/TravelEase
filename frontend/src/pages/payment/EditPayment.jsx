import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import './PaymentForm.css';

function EditPayment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        // First get user's payment history
        const response = await axios.get('http://localhost:5001/api/payments/user-history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const foundPayment = response.data.payments.find(p => p._id === paymentId);
          
          if (!foundPayment) {
            enqueueSnackbar('Payment not found', { variant: 'error' });
            navigate('/payments/history');
            return;
          }
          
          if (foundPayment.status !== 'rejected') {
            enqueueSnackbar('Only rejected payments can be edited', { variant: 'warning' });
            navigate('/payments/history');
            return;
          }
          
          setPayment(foundPayment);
          // Pre-fill the form with existing payment data
          // Card number will be masked
          setFormData({
            cardNumber: '',  // Can't show full card number for security
            cardHolder: foundPayment.cardDetails.cardHolder,
            expiryDate: foundPayment.cardDetails.expiryDate,
            cvv: ''
          });
        } else {
          enqueueSnackbar('Failed to load payment details', { variant: 'error' });
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
        enqueueSnackbar('Failed to load payment details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayment();
  }, [paymentId, navigate, enqueueSnackbar]);

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
      // Make CVV optional when editing rejected payments
      cvv: formData.cvv ? validateCVV(formData.cvv) : ''
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
        const updatedPaymentData = {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          cardHolder: formData.cardHolder,
          expiryDate: formData.expiryDate
        };
        
        // Only include CVV if provided
        if (formData.cvv) {
          updatedPaymentData.cvv = formData.cvv;
        }
        
        // Make the API call to update the payment
        const response = await axios.put(
          `http://localhost:5001/api/payments/${paymentId}`,
          updatedPaymentData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          enqueueSnackbar('Payment details updated successfully! It is now pending approval.', { 
            variant: 'success' 
          });
          
          navigate('/payments/history');
        }
      } catch (error) {
        console.error('Payment update error:', error);
        let errorMessage = 'Failed to update payment';
        
        if (error.response) {
          console.log('Error response:', error.response.data);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="payment-not-found">
        <div className="not-found-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Payment Not Found</h2>
        <p>We couldn't find the payment you're looking for.</p>
        <button
          onClick={() => navigate('/payments/history')}
          className="back-btn"
        >
          Back to Payment History
        </button>
      </div>
    );
  }

  return (
    <div className="payment-page-container">
      <div className="payment-form-container">
        <div className="payment-header">
          <h2>Edit Payment</h2>
          <div className="rejected-badge">
            <i className="fas fa-exclamation-circle"></i> Payment Rejected
          </div>
        </div>
        
        {payment.event?.title && (
          <div className="event-info-card">
            <div className="event-info-header">Event Summary</div>
            <div className="event-info-content">
              <div className="event-info-row">
                <span className="event-info-label">Event:</span>
                <span className="event-info-value">{payment.event.title}</span>
              </div>
              <div className="event-info-row">
                <span className="event-info-label">Date:</span>
                <span className="event-info-value">{new Date(payment.event.date).toLocaleDateString()}</span>
              </div>
              <div className="event-info-row">
                <span className="event-info-label">Tickets:</span>
                <span className="event-info-value">{payment.numberOfTickets || 1}</span>
              </div>
              <div className="event-info-row total-row">
                <span className="event-info-label">Total:</span>
                <span className="event-info-value total-amount">LKR {payment.amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="rejection-reason">
              <p>Please update your payment details to resubmit your payment</p>
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
                    // Optional in edit mode
                  />
                  <span className="cvv-tooltip" title="3-digit code on back of your card">?</span>
                </div>
                {errors.cvv && <div className="error">{errors.cvv}</div>}
              </div>
            </div>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/payments/history')}
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
                'Update Payment'
              )}
            </button>
          </div>
          
          <div className="payment-notes">
            <p className="note">
              <i className="fas fa-info-circle"></i>
              Your updated payment will need to be approved again by the administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPayment;
