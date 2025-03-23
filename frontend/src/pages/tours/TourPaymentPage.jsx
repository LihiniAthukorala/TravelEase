import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const TourPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [tourData, setTourData] = useState(null);
  
  // State for user details and booking information
  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    email: user?.email || '',
    phone: user?.contactNumber || '',
    numberOfPersons: 1,
    specialRequirements: ''
  });
  
  // State for payment information
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    // Get tour data from location state (passed from the Book Now button)
    if (location.state && location.state.tourData) {
      setTourData(location.state.tourData);
    } else {
      enqueueSnackbar('Tour information not found', { variant: 'error' });
      navigate('/tours');
    }
  }, [location, navigate, enqueueSnackbar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      const formattedValue = digitsOnly
        .substring(0, 16)
        .replace(/(\d{4})(?=\d)/g, '$1 ');
      setPaymentData({ ...paymentData, [name]: formattedValue });
    } else if (name === 'expiryDate') {
      const digitsOnly = value.replace(/\D/g, '');
      let formattedValue = digitsOnly;
      if (digitsOnly.length > 2) {
        formattedValue = `${digitsOnly.substring(0, 2)}/${digitsOnly.substring(2, 4)}`;
      }
      setPaymentData({ ...paymentData, [name]: formattedValue });
    } else if (name === 'cvv') {
      const digitsOnly = value.replace(/\D/g, '').substring(0, 4);
      setPaymentData({ ...paymentData, [name]: digitsOnly });
    } else {
      setPaymentData({ ...paymentData, [name]: value });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate user details
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    // Validate payment details
    const cardNumberRegex = /^[0-9]{16}$/;
    if (!cardNumberRegex.test(paymentData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    
    const cardHolderRegex = /^[a-zA-Z\s]+$/;
    if (!cardHolderRegex.test(paymentData.cardHolder)) {
      newErrors.cardHolder = 'Card holder name should contain only letters';
    }
    
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Expiry date must be in MM/YY format';
    } else {
      const [month, year] = paymentData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }
    
    const cvvRegex = /^[0-9]{3,4}$/;
    if (!cvvRegex.test(paymentData.cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalAmount = () => {
    if (!tourData) return 0;
    return tourData.price * formData.numberOfPersons;
  };

  const generateReceiptNumber = () => {
    return `TOUR-${Math.floor(100000 + Math.random() * 900000)}-${new Date().getFullYear()}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Please correct the errors in the form', { variant: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to book a tour', { variant: 'error' });
        navigate('/login');
        return;
      }
      
      // Create booking data for API - Fixed structure to match API requirements
      const bookingData = {
        eventId: tourData._id,
        amount: parseFloat(calculateTotalAmount()), // Ensure amount is parsed as float
        cardDetails: {
          cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
          cardHolder: paymentData.cardHolder,
          expiryDate: paymentData.expiryDate,
          cvv: paymentData.cvv
        },
        numberOfTickets: parseInt(formData.numberOfPersons), // Ensure this is parsed as integer
        specialRequirements: formData.specialRequirements || '',
        customerInfo: { // Add customer information
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone
        },
        tourDetails: { // Include tour details for reference
          name: tourData.name,
          date: tourData.date,
          location: tourData.location
        }
      };
      
      console.log('Sending payment request:', {
        ...bookingData,
        cardDetails: {
          ...bookingData.cardDetails,
          cardNumber: 'XXXX-XXXX-XXXX-' + bookingData.cardDetails.cardNumber.slice(-4),
          cvv: '***'
        }
      });
      
      // Use the new dedicated tour payment endpoint
      const response = await axios.post(
        'http://localhost:5001/api/tour-payments/submit',
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Generate receipt data
        const receipt = {
          receiptNumber: generateReceiptNumber(),
          bookingId: response.data.payment.id,
          orderDate: new Date().toISOString(),
          customerName: formData.fullName,
          customerEmail: formData.email,
          phone: formData.phone,
          tourName: tourData.name,
          tourDate: tourData.date,
          tourLocation: tourData.location,
          numberOfPersons: formData.numberOfPersons,
          pricePerPerson: tourData.price,
          totalAmount: calculateTotalAmount(),
          paymentMethod: `Card ending in ${paymentData.cardNumber.replace(/\s/g, '').slice(-4)}`,
          status: response.data.payment.status
        };
        
        setReceiptData(receipt);
        setOrderComplete(true);
        
        enqueueSnackbar('Tour booking successful! Your booking is pending approval.', { variant: 'success' });
      } else {
        throw new Error(response.data.message || 'Failed to process booking');
      }
    } catch (error) {
      console.error('Error processing tour booking:', error);
      // Improve error handling with more specific messages
      let errorMessage = 'Failed to process your booking';
      
      if (error.response) {
        console.error('Error details:', error.response.data);
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (orderComplete && receiptData) {
    return (
      <div className="bg-gray-50 min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="printable-receipt">
            {/* Receipt Header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">Tour Booking Confirmation</h2>
              <p>Receipt #{receiptData.receiptNumber}</p>
            </div>
            
            {/* Receipt Content */}
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-700">Customer Details</h3>
                  <p className="text-gray-600">{receiptData.customerName}</p>
                  <p className="text-gray-600">{receiptData.customerEmail}</p>
                  <p className="text-gray-600">{receiptData.phone}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-700">Order Information</h3>
                  <p className="text-gray-600">Date: {formatDate(receiptData.orderDate)}</p>
                  <p className="text-gray-600">Payment: {receiptData.paymentMethod}</p>
                  <p className="text-gray-600">Status: <span className="font-semibold text-yellow-600">{receiptData.status}</span></p>
                </div>
              </div>
              
              {/* Tour Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-gray-700 mb-3">Tour Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Tour Name</p>
                    <p className="font-medium">{receiptData.tourName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Tour Date</p>
                    <p className="font-medium">{formatDate(receiptData.tourDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Location</p>
                    <p className="font-medium">{receiptData.tourLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Number of Persons</p>
                    <p className="font-medium">{receiptData.numberOfPersons}</p>
                  </div>
                </div>
              </div>
              
              {/* Pricing Summary */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Persons</th>
                    <th className="text-right py-2">Price per Person</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2">{receiptData.tourName}</td>
                    <td className="py-2 text-center">{receiptData.numberOfPersons}</td>
                    <td className="py-2 text-right">LKR {receiptData.pricePerPerson.toFixed(2)}</td>
                    <td className="py-2 text-right">LKR {receiptData.totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan="3" className="py-3">Total</td>
                    <td className="py-3 text-right">LKR {receiptData.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              {/* Special Requirements */}
              {formData.specialRequirements && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-bold text-gray-700 mb-2">Special Requirements</h3>
                  <p className="text-gray-600">{formData.specialRequirements}</p>
                </div>
              )}
              
              {/* Booking Terms */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="font-bold text-gray-700 mb-2">Booking Terms & Conditions</h3>
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  <li>Your booking is currently pending approval by the administrator.</li>
                  <li>Once approved, you will receive a confirmation email.</li>
                  <li>Please arrive at least 30 minutes before the tour start time.</li>
                  <li>Bring a valid ID that matches the booking name.</li>
                </ul>
              </div>
              
              <div className="mt-8 text-center text-gray-500 text-sm">
                Thank you for your booking! If you have any questions, please contact our support team.
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Print Receipt
            </button>
            <button
              onClick={() => navigate('/tours')}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Back to Tours
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tourData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tour Booking</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Tour Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Tour Summary</h2>
              </div>
              <div className="p-6">
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={tourData.image ? `http://localhost:5001/${tourData.image}` : 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={tourData.name}
                    className="object-cover rounded-lg w-full h-48"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image' }}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tourData.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{tourData.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(tourData.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{tourData.duration} days</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Price per person</span>
                    <span className="font-medium">LKR {tourData.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Number of persons</span>
                    <span className="font-medium">{formData.numberOfPersons}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">LKR {calculateTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Checkout Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow overflow-hidden">
              {/* User Details Section */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.fullName ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Persons</label>
                    <select
                      name="numberOfPersons"
                      value={formData.numberOfPersons}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Requirements (Optional)</label>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Any special requirements for your tour"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="px-6 py-4 bg-gray-50 border-b border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentInputChange}
                    placeholder="1234 5678 9012 3456"
                    className={`mt-1 block w-full rounded-md border ${
                      errors.cardNumber ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Card Holder Name</label>
                    <input
                      type="text"
                      name="cardHolder"
                      value={paymentData.cardHolder}
                      onChange={handlePaymentInputChange}
                      placeholder="John Doe"
                      className={`mt-1 block w-full rounded-md border ${
                        errors.cardHolder ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {errors.cardHolder && <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={handlePaymentInputChange}
                        placeholder="MM/YY"
                        className={`mt-1 block w-full rounded-md border ${
                          errors.expiryDate ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handlePaymentInputChange}
                        placeholder="123"
                        className={`mt-1 block w-full rounded-md border ${
                          errors.cvv ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                      {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm text-gray-500 mb-4">
                    By completing this booking, you agree to our tour reservation terms and conditions.
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate('/tours')}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Back to Tours
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Complete Booking'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourPaymentPage;
