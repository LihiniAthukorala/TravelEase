import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Added search term state
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('http://localhost:5001/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.user.role !== 'admin') {
          enqueueSnackbar('Access denied. Admin privileges required.', { variant: 'error' });
          navigate('/dashboard');
          return;
        }
        
        setAdmin(response.data.user);
        
        // Fetch orders after admin authentication
        fetchOrders(token);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        enqueueSnackbar('Failed to load admin data. Please login again.', { variant: 'error' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };
    
    fetchAdminData();
  }, [navigate, enqueueSnackbar]);

  const fetchOrders = async (token) => {
    try {
      // Using payments endpoint for now, as it contains order data
      // In a real application, you might have a dedicated orders endpoint
      const response = await axios.get('http://localhost:5001/api/payments', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Format payments as orders
        const allOrders = response.data.payments
          .filter(payment => payment !== null && payment !== undefined)
          .map(payment => ({
            id: payment._id,
            type: payment.type || 'event',
            amount: payment.amount,
            status: payment.status,
            timestamp: payment.timestamp,
            customerName: payment.user?.username || 'N/A',
            customerEmail: payment.user?.email || 'N/A',
            items: payment.items || [],
            eventDetails: payment.event ? {
              name: payment.event.title,
              date: payment.event.date
            } : null,
            numberOfTickets: payment.numberOfTickets || 1
          }));
        
        setOrders(allOrders);
      } else {
        enqueueSnackbar('Failed to load orders', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      enqueueSnackbar('Failed to load orders', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.customerEmail.toLowerCase().includes(searchLower) ||
      order.type.toLowerCase().includes(searchLower) ||
      (order.eventDetails?.name?.toLowerCase().includes(searchLower) || false)
    );
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
            <div className="p-6">
              <h2 className="text-2xl font-bold">Admin Panel</h2>
              <p className="text-gray-400 text-sm">Online Tourism and Travel Management System</p>
            </div>
            <nav className="mt-5">
              <Link to="/admin-dashboard" className="flex items-center px-6 py-3 rounded-md mb-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span className="ml-3 font-medium">Dashboard</span>
              </Link>
              <Link to="/admin/users" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="ml-3 font-medium">Users</span>
              </Link>
    
              <Link to="/admin/stock-tracking" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 font-medium">Stock Tracking</span>
              </Link>
              <Link to="/admin/camping-equipment" className="flex items-center px-6 py-3 rounded-md mb-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                <span className="ml-3 font-medium">Camping Equipment</span>
              </Link>
              <Link to="/admin/orders" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 font-medium">Orders</span>
              </Link>
              <Link to="/admin/all-bookings" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 font-medium">All Bookings</span>
              </Link>
    
              <Link to="/admin/manage-tour" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 font-medium">Manage Tour</span>
              </Link>
              <Link to="/admin/manage-suppliers" className="flex items-center px-6 py-3 rounded-md mb-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                </svg>
                <span className="ml-3 font-medium">Suppliers</span>
              </Link>
              <Link to="/admin/inventory-reports" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
                </svg>
                <span className="ml-3 font-medium">Inventory Reports</span>
              </Link>
              
              
    
              <div className="pt-2 mt-2 border-t border-gray-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-6 py-3 rounded-md text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm6.293 11.293a1 1 0 001.414 0L14 10l-3.293-3.293a1 1 0 00-1.414 1.414L11.586 10l-2.293 2.293a1 1 0 000 1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <div className="flex items-center space-x-4">
            {admin && (
              <>
                <span className="text-gray-600">Welcome, {admin.username}</span>
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {admin.username.charAt(0).toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Orders Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">All Orders</h3>
            <p className="text-3xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
            <p className="text-3xl font-bold text-green-500">{orders.filter(order => order.status === 'approved').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
            <p className="text-3xl font-bold text-yellow-500">{orders.filter(order => order.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Cancelled</h3>
            <p className="text-3xl font-bold text-red-500">{orders.filter(order => order.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Order Records</h3>
            <div className="flex space-x-2">
              <input 
                type="search" 
                placeholder="Search orders..." 
                className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? "No orders match your search" : "No orders found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                              <div className="text-sm text-gray-500">{order.customerEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {order.type}
                          {order.type === 'event' && order.eventDetails && (
                            <div className="text-xs text-gray-400 mt-1">
                              {order.eventDetails.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          LKR {order.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(order.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : order.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link 
                            to={`/admin/payments/${order.id}`} 
                            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
