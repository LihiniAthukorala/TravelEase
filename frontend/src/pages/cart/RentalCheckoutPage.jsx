import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { formatDate, calculateDays } from '../../utils/dateUtils';

const RentalCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const { cartItems, removeFromCart, calculateTotal, clearCart } = useCart();
  
  // Get only rental items from cart
  const rentalItems = cartItems.filter(item => item.isRental);
  
  // State for user details and rental information
  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    email: user?.email || '',
    phone: user?.contactNumber || '',
    address: '',
    idNumber: '', // ID card or driver's license
    pickupTime: '10:00', // Default pickup time
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
    // If no rental items, redirect back to cart
    if (rentalItems.length === 0) {
      enqueueSnackbar('No rental items found in cart', { variant: 'warning' });
      navigate('/cart');
    }
  }, [rentalItems, navigate, enqueueSnackbar]);

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
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
    
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

  const generateReceiptNumber = () => {
    return `RNT-${Math.floor(100000 + Math.random() * 900000)}-${new Date().getFullYear()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Please correct the errors in the form', { variant: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create an order object with all necessary information
      const rentalOrder = {
        user: user._id,
        customerDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          idNumber: formData.idNumber
        },
        rentalItems: rentalItems.map(item => ({
          equipmentId: item.equipmentId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          startDate: item.startDate,
          endDate: item.endDate,
          totalDays: calculateDays(item.startDate, item.endDate)
        })),
        pickupTime: formData.pickupTime,
        specialRequirements: formData.specialRequirements,
        paymentDetails: {
          cardNumber: paymentData.cardNumber.replace(/\s/g, '').slice(-4), // Only store last 4 digits
          cardHolder: paymentData.cardHolder,
          totalAmount: calculateTotal()
        }
      };
      
      // In a real application, you would send this to your backend
      // For demo purposes we'll simulate a successful order
      
      // Simulate API call with a timeout
      setTimeout(() => {
        // Generate receipt data
        const receipt = {
          receiptNumber: generateReceiptNumber(),
          orderDate: new Date().toISOString(),
          customerName: formData.fullName,
          customerEmail: formData.email,
          items: rentalItems,
          totalAmount: calculateTotal(),
          paymentMethod: `Card ending in ${paymentData.cardNumber.replace(/\s/g, '').slice(-4)}`
        };
        
        setReceiptData(receipt);
        setOrderComplete(true);
        
        // REMOVED: The following code was removing items from cart automatically
        // rentalItems.forEach(item => {
        //   removeFromCart(item._id);
        // });
        
        enqueueSnackbar('Rental order placed successfully!', { variant: 'success' });
      }, 1500);
      
    } catch (error) {
      console.error('Error processing rental order:', error);
      enqueueSnackbar('Failed to process your rental order. Please try again.', { variant: 'error' });
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
              <h2 className="text-2xl font-bold">Rental Confirmation</h2>
              <p>Receipt #{receiptData.receiptNumber}</p>
            </div>
            
            {/* Receipt Content */}
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-700">Customer Details</h3>
                  <p className="text-gray-600">{receiptData.customerName}</p>
                  <p className="text-gray-600">{receiptData.customerEmail}</p>
                  <p className="text-gray-600">{formData.phone}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-700">Order Information</h3>
                  <p className="text-gray-600">Date: {formatDate(receiptData.orderDate)}</p>
                  <p className="text-gray-600">Payment: {receiptData.paymentMethod}</p>
                </div>
              </div>
              
              {/* Rental Items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2">Item</th>
                    <th className="text-left py-2">Rental Period</th>
                    <th className="text-left py-2">Days</th>
                    <th className="text-left py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </td>
                      <td className="py-2">
                        {calculateDays(item.startDate, item.endDate)}
                      </td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2 text-right">
                        LKR {(item.price * item.quantity * calculateDays(item.startDate, item.endDate)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan="3" className="py-3">Total</td>
                    <td className="py-3 text-right">LKR {receiptData.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              {/* Rental Terms */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="font-bold text-gray-700 mb-2">Rental Terms & Conditions</h3>
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  <li>Equipment must be returned in the condition it was rented.</li>
                  <li>Late returns are subject to additional daily charges.</li>
                  <li>Damage to equipment will result in repair or replacement fees.</li>
                  <li>Pickup time: {formData.pickupTime}</li>
                  {formData.specialRequirements && (
                    <li>Special Requirements: {formData.specialRequirements}</li>
                  )}
                </ul>
              </div>
              
              <div className="mt-8 text-center text-gray-500 text-sm">
                Thank you for your rental! If you have any questions, please contact our support team.
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
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rental Checkout</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Rental Items */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Rental Summary</h2>
              </div>
              <div className="p-6">
                <ul className="divide-y divide-gray-200">
                  {rentalItems.map(item => (
                    <li key={item._id} className="py-4">
                      <div className="flex items-start">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={item.image ? `http://localhost:5001${item.image}` : '/images/default-equipment.jpg'}
                            alt={item.name}
                            className="h-full w-full object-cover object-center"
                            onError={(e) => { e.target.src = '/images/default-equipment.jpg' }}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatDate(item.startDate)} - {formatDate(item.endDate)}
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            LKR {(item.price * item.quantity * calculateDays(item.startDate, item.endDate)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-bold text-blue-600">LKR {calculateTotal().toFixed(2)}</span>
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
                    <label className="block text-sm font-medium text-gray-700">ID Card / Driver's License</label>
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      placeholder="ID Card or Driver's License Number"
                      className={`mt-1 block w-full rounded-md border ${
                        errors.idNumber ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {errors.idNumber && <p className="mt-1 text-sm text-red-600">{errors.idNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className={`mt-1 block w-full rounded-md border ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pickup Time</label>
                    <select
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
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
                    placeholder="Any special requirements for your rental"
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
                    By completing this order, you agree to our rental terms and conditions.
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate('/cart')}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Back to Cart
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
                        'Complete Rental Order'
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

export default RentalCheckoutPage;
