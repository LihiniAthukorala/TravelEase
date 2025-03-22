import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

function PaymentDetails() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5001/api/payments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setPayment(response.data.payment);
        } else {
          enqueueSnackbar('Failed to load payment details', { variant: 'error' });
          navigate('/admin/payment-approvals');
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

      // Create the appropriate payload based on payment type
      const payload = {};
      
      // For cart payments, we need to explicitly tell the backend this is a cart payment
      if (payment.type === 'cart') {
        payload.isCartPayment = true;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/approve/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the payment status in the local state
        setPayment(prevPayment => ({
          ...prevPayment,
          status: 'approved'
        }));
        
        enqueueSnackbar('Payment approved successfully!', { 
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

      // Fix the API endpoint URL format
      const response = await axios.put(
        `http://localhost:5001/api/payments/reject/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the payment status in the local state
        setPayment(prevPayment => ({
          ...prevPayment,
          status: 'rejected'
        }));
        
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

  // Format date for better display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total price for cart items
  const calculateItemTotal = (item) => {
    return item.price * item.quantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-700">Payment not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link 
            to="/admin/orders" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Orders
          </Link>
        </div>

        {/* Order Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${
          payment.status === 'approved' 
            ? 'bg-green-100 border-l-4 border-green-500' 
            : payment.status === 'rejected'
              ? 'bg-red-100 border-l-4 border-red-500'
              : 'bg-yellow-100 border-l-4 border-yellow-500'
        }`}>
          <div className="flex items-center">
            <div className="mr-3">
              {payment.status === 'approved' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : payment.status === 'rejected' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-bold">
                {payment.status === 'approved' 
                  ? 'Order Approved' 
                  : payment.status === 'rejected'
                    ? 'Order Rejected'
                    : 'Order Pending Approval'}
              </h3>
              <p className="text-sm">{formatDate(payment.timestamp)}</p>
            </div>
          </div>
        </div>

        {/* Order Overview */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium">Order Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Order ID</p>
                <p className="mt-1">{payment._id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Order Type</p>
                <p className="mt-1 capitalize">{payment.type || 'Standard'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="mt-1 font-semibold">LKR {payment.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Date</p>
                <p className="mt-1">{formatDate(payment.timestamp)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : payment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium">Customer Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1">{payment.user?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{payment.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="mt-1">Card ending in {payment.cardDetails?.cardNumber.slice(-4) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Card Holder</p>
                <p className="mt-1">{payment.cardDetails?.cardHolder || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        {payment.type === 'event' && payment.event && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium">Event Registration Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Event Name</p>
                  <p className="mt-1">{payment.event.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Event Date</p>
                  <p className="mt-1">{formatDate(payment.event.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="mt-1">{payment.event.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Number of Tickets</p>
                  <p className="mt-1">{payment.numberOfTickets}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium">Price per Ticket:</span>
                  <span>LKR {payment.event.price?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium">Tickets:</span>
                  <span>{payment.numberOfTickets}</span>
                </div>
                <div className="flex justify-between mt-1 text-lg font-semibold">
                  <span>Total:</span>
                  <span>LKR {payment.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Order Items */}
        {payment.type === 'cart' && payment.items && payment.items.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium">Order Items</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payment.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.equipmentId && (
                              <div className="text-sm font-medium text-gray-900">
                                {item.equipmentId.name || 'Equipment Item'}
                              </div>
                            )}
                            {!item.equipmentId && (
                              <div className="text-sm font-medium text-gray-900">
                                Item {index + 1}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          LKR {item.price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          LKR {calculateItemTotal(item).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right font-medium">Total:</td>
                      <td className="px-6 py-4 text-right font-bold">LKR {payment.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Special Requirements */}
        {payment.specialRequirements && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium">Special Requirements</h2>
            </div>
            <div className="p-6">
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
              Reject Order
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentDetails;
