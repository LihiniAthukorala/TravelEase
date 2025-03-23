import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        console.log('Fetching user orders...');
        
        // Fetch user's equipment rental orders
        const response = await axios.get(`http://localhost:5001/api/payments/user-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Orders response:', response.data);
        
        if (Array.isArray(response.data)) {
          // Filter to make sure we only include orders with items
          const equipmentOrders = response.data.filter(order => 
            order.type === 'cart' && order.items && order.items.length > 0
          );
          setOrders(equipmentOrders);
          console.log(`Loaded ${equipmentOrders.length} equipment orders`);
        } else {
          console.error('Unexpected response format:', response.data);
          enqueueSnackbar('Received unexpected data format from server', { variant: 'error' });
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
        enqueueSnackbar('Failed to load your orders', { variant: 'error' });
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, navigate, enqueueSnackbar]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };
  
  const getStatusDisplay = (status) => {
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Equipment Orders</h1>
          <p className="mt-2 text-gray-600">View your camping equipment rental history</p>
        </div>
        
        {orders.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {orders.map(order => (
                <li key={order._id}>
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Order #{order._id.substring(0, 8)}</h3>
                        <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(order.timestamp || order.createdAt)}</p>
                      </div>
                      <div>
                        {getStatusDisplay(order.status)}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900">Items:</p>
                      <ul className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="py-3 flex justify-between">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{item.equipmentName || `Item #${idx + 1}`}</span>
                              <span className="ml-2 text-sm text-gray-500">x{item.quantity}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">LKR {(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Payment Method: Card ending in {order.cardDetails?.cardNumber?.slice(-4) || 'XXXX'}
                      </span>
                      <span className="text-base font-medium text-gray-900">
                        Total: LKR {order.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Receipt link for approved orders */}
                    {order.status === 'approved' && (
                      <div className="mt-4">
                        <Link
                          to={`/orders/${order._id}/receipt`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          View Receipt
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't placed any equipment rental orders yet.</p>
            <div className="mt-6">
              <Link to="/camping-equipment" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Browse Equipment
              </Link>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserOrders;
