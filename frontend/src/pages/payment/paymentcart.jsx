import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentForm.css';
import { useCart } from '../../context/CartContext';

function PaymentForm() {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, updateCartItem, removeFromCart, calculateTotal, clearCart } = useCart();
  
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
  const [displayCartItems, setDisplayCartItems] = useState([]);

  // Fetch cart items when component loads
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      setDisplayCartItems(cartItems);
      // Update amount based on cart total if not pre-set
      if (!location.state?.amount) {
        setFormData(prev => ({...prev, amount: calculateTotal().toFixed(2)}));
      }
    }
  }, [cartItems, calculateTotal]);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const success = await updateCartItem(cartItemId, newQuantity);
    if (success) {
      // Update local state to reflect changes
      setDisplayCartItems(prev => 
        prev.map(item => 
          item._id === cartItemId ? {...item, quantity: newQuantity} : item
        )
      );
      
      // Update the amount field
      setFormData(prev => ({...prev, amount: calculateTotal().toFixed(2)}));
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      const success = await removeFromCart(cartItemId);
      if (success) {
        setDisplayCartItems(prev => prev.filter(item => item._id !== cartItemId));
        setFormData(prev => ({...prev, amount: calculateTotal().toFixed(2)}));
      }
    }
  };

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
    const cvvRegex = /^[0-9]{3}$/;
    return cvvRegex.test(cvv) ? '' : 'CVV must be exactly 3 digits';
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
      const digitsOnly = value.replace(/\D/g, '').substring(0, 3);
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

        // Construct payment data based on what we're paying for
        let paymentData;
        
        if (eventRegistrationData.eventId) {
          // Event registration payment
          paymentData = {
            type: 'event',
            eventId: eventRegistrationData.eventId,
            amount: parseFloat(formData.amount),
            cardDetails: {
              cardNumber: formData.cardNumber.replace(/\s/g, ''),
              cardHolder: formData.cardHolder,
              expiryDate: formData.expiryDate,
              cvv: formData.cvv
            },
            numberOfTickets: eventRegistrationData.numberOfTickets || 1,
            specialRequirements: eventRegistrationData.specialRequirements || ''
          };
        } else if (displayCartItems.length > 0) {
          // Cart purchase payment
          paymentData = {
            type: 'cart',
            amount: parseFloat(formData.amount),
            cardDetails: {
              cardNumber: formData.cardNumber.replace(/\s/g, ''),
              cardHolder: formData.cardHolder,
              expiryDate: formData.expiryDate,
              cvv: formData.cvv
            },
            items: displayCartItems.map(item => ({
              equipmentId: item.equipmentId,
              quantity: item.quantity,
              price: item.price
            }))
          };
        } else {
          // Generic payment (fallback)
          paymentData = {
            type: 'general',
            amount: parseFloat(formData.amount),
            cardDetails: {
              cardNumber: formData.cardNumber.replace(/\s/g, ''),
              cardHolder: formData.cardHolder,
              expiryDate: formData.expiryDate,
              cvv: formData.cvv
            }
          };
        }
        
        console.log('Submitting payment data:', {
          ...paymentData,
          cardDetails: { 
            ...paymentData.cardDetails,
            cardNumber: 'XXXX-XXXX-XXXX-' + paymentData.cardDetails.cardNumber.slice(-4),
            cvv: '***'
          }
        });
        
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
          // For cart purchases, clear the cart after successful payment
          if (displayCartItems.length > 0) {
            // This assumes you have a clearCart function in your cart context
            await clearCart();
          }
          
          enqueueSnackbar('Payment submitted successfully! Waiting for admin approval.', { 
            variant: 'success' 
          });
          
          navigate('/pending-approval', { 
            state: { 
              paymentId: response.data.payment.id 
            } 
          });
        } else {
          throw new Error(response.data.message || 'Payment submission failed');
        }
      } catch (error) {
        console.error('Payment submission error:', error);
        
        // Enhanced error logging
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
        }
        
        let errorMessage = 'Failed to process payment';
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        enqueueSnackbar(errorMessage, { variant: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      enqueueSnackbar('Please correct the errors in the form', { variant: 'error' });
    }
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
        
        {/* Cart Items Section (New) */}
        {displayCartItems && displayCartItems.length > 0 && (
          <div className="cart-items-section">
            <div className="section-title">Cart Items</div>
            <div className="cart-items-list">
              {displayCartItems.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-image">
                      <img 
                        src={item.image ? `http://localhost:5001${item.image}` : '/images/default-equipment.jpg'}
                        alt={item.name}
                        onError={(e) => { e.target.src = '/images/default-equipment.jpg' }}
                      />
                    </div>
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <p>LKR {item.price.toFixed(2)} × {item.quantity}</p>
                      {item.isRental && (
                        <p className="rental-dates">
                          Rental: {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button 
                        type="button"
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      type="button"
                      className="remove-item"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <span>Total:</span>
                <span>LKR {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
        
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
                    maxLength={3}
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
                readOnly={location.state?.amount || displayCartItems.length > 0}
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
