import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';

function PaymentDetails() {
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        // First verify admin access
        const adminResponse = await axios.get('http://localhost:5001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (adminResponse.data.user.role !== 'admin') {
          enqueueSnackbar('Access denied. Admin privileges required.', { variant: 'error' });
          navigate('/dashboard');
          return;
        }
        
        // Fetch payment details
        const response = await axios.get(`http://localhost:5001/api/payments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const paymentData = response.data.payment;
          setPayment({
            id: paymentData._id,
            amount: paymentData.amount,
            cardDetails: {
              cardNumber: paymentData.cardDetails.cardNumber,
              cardHolder: paymentData.cardDetails.cardHolder,
              expiryDate: paymentData.cardDetails.expiryDate
            },
            timestamp: paymentData.timestamp,
            status: paymentData.status,
            numberOfTickets: paymentData.numberOfTickets || 1,
            specialRequirements: paymentData.specialRequirements || '',
            event: {
              id: paymentData.event._id,
              name: paymentData.event.title,
              date: paymentData.event.date,
              location: paymentData.event.location,
              price: paymentData.event.price
            },
            user: {
              id: paymentData.user._id,
              name: paymentData.user.username,
              email: paymentData.user.email
            }
          });
        } else {
          enqueueSnackbar('Failed to load payment details', { variant: 'error' });
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        enqueueSnackbar(error.response?.data?.message || 'Failed to load payment details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentDetails();
  }, [id, navigate, enqueueSnackbar]);

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to approve payments', { variant: 'error' });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/approve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPayment(prev => ({ ...prev, status: 'approved' }));
        enqueueSnackbar('Payment approved successfully! User registered for event.', { 
          variant: 'success' 
        });
      } else {
        enqueueSnackbar(response.data.message || 'Failed to approve payment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve payment', { variant: 'error' });
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to reject payments', { variant: 'error' });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPayment(prev => ({ ...prev, status: 'rejected' }));
        enqueueSnackbar('Payment rejected successfully.', { 
          variant: 'warning' 
        });
      } else {
        enqueueSnackbar(response.data.message || 'Failed to reject payment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject payment', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-600">Payment not found</h2>
        <Link to="/admin/payment-approvals" className="mt-4 text-blue-600 hover:underline">
          Return to Payment List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link 
            to="/admin/payment-approvals" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Payment List
          </Link>
        </div>

        {/* Payment Status Badge */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Payment Details</h1>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            payment.status === 'approved' 
              ? 'bg-green-100 text-green-800' 
              : payment.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>

        {/* Payment Info Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Payment ID</p>
                <p className="font-medium">{payment.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">LKR {payment.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(payment.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Tickets</p>
                <p className="font-medium">{payment.numberOfTickets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Card Holder</p>
                <p className="font-medium">{payment.cardDetails.cardHolder}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Card Number</p>
                <p className="font-medium">{payment.cardDetails.cardNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-medium">{payment.cardDetails.expiryDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Info Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Event Name</p>
                <p className="font-medium">{payment.event.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(payment.event.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{payment.event.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price per Ticket</p>
                <p className="font-medium">LKR {payment.event.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{payment.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{payment.user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Requirements */}
        {payment.specialRequirements && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Special Requirements</h2>
              <p className="text-gray-700">{payment.specialRequirements}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {payment.status === 'pending' && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleReject}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject Payment
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentDetails;
