import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function PaymentApproval() {
  const { enqueueSnackbar } = useSnackbar();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

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
        
        // Fetch payments after admin authentication
        fetchPayments(token);
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

  const fetchPayments = async (token) => {
    try {
      // Use the getAllPayments endpoint instead of just pending payments
      const response = await axios.get('http://localhost:5001/api/payments', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const allPayments = response.data.payments
          .filter(payment => payment !== null && payment !== undefined)
          .map(payment => ({
            id: payment._id,
            amount: payment.amount,
            cardHolder: payment.cardDetails.cardHolder,
            timestamp: payment.timestamp,
            status: payment.status,
            numberOfTickets: payment.numberOfTickets || 1,
            event: {
              id: payment.event?._id,
              name: payment.event?.title,
              date: payment.event?.date
            },
            user: {
              id: payment.user?._id,
              name: payment.user?.username,
              email: payment.user?.email
            }
          }));
        
        setPayments(allPayments);
        setFilteredPayments(allPayments);
      } else {
        enqueueSnackbar('Failed to load payments', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      enqueueSnackbar('Failed to load payments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filter) => {
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(payment => payment.status === filter));
    }
  };

  const handleApprove = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to approve payments', { variant: 'error' });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/approve/${paymentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the payment status in the local state
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: 'approved' } 
              : payment
          )
        );
        
        // Also update filtered payments
        setFilteredPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: 'approved' } 
              : payment
          )
        );
        
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

  const handleReject = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        enqueueSnackbar('Please log in to reject payments', { variant: 'error' });
        return;
      }

      const response = await axios.put(
        `http://localhost:5001/api/payments/reject/${paymentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the payment status in the local state
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: 'rejected' } 
              : payment
          )
        );
        
        // Also update filtered payments
        setFilteredPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.id === paymentId 
              ? { ...payment, status: 'rejected' } 
              : payment
          )
        );
        
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
          <p className="text-gray-400 text-sm">Event Management System</p>
        </div>
        <nav className="mt-5">
          <Link to="/admin-dashboard" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link to="/admin/users" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Users</span>
          </Link>
          <Link to="/admin/events" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Events</span>
          </Link>
         
          <Link to="/admin/payment-approvals" className="flex items-center px-6 py-3 bg-gray-800 text-gray-100">
            <span className="ml-3">Payment Approvals</span>
          </Link>
         
          <Link to="/managefeedback" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Feedback Manage</span>
          </Link>
          <button 
            onClick={handleLogout} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100 w-full text-left"
          >
            <span className="ml-3">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Payment Management</h1>
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

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer" 
               onClick={() => handleFilter('all')}
               style={{ borderBottom: activeFilter === 'all' ? '3px solid #3B82F6' : '3px solid transparent' }}>
            <h3 className="text-gray-500 text-sm font-medium">All Payments</h3>
            <p className="text-3xl font-bold">{payments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer" 
               onClick={() => handleFilter('pending')}
               style={{ borderBottom: activeFilter === 'pending' ? '3px solid #F59E0B' : '3px solid transparent' }}>
            <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
            <p className="text-3xl font-bold text-yellow-500">{payments.filter(p => p.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer" 
               onClick={() => handleFilter('approved')}
               style={{ borderBottom: activeFilter === 'approved' ? '3px solid #10B981' : '3px solid transparent' }}>
            <h3 className="text-gray-500 text-sm font-medium">Approved</h3>
            <p className="text-3xl font-bold text-green-500">{payments.filter(p => p.status === 'approved').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer" 
               onClick={() => handleFilter('rejected')}
               style={{ borderBottom: activeFilter === 'rejected' ? '3px solid #EF4444' : '3px solid transparent' }}>
            <h3 className="text-gray-500 text-sm font-medium">Rejected</h3>
            <p className="text-3xl font-bold text-red-500">{payments.filter(p => p.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Payment Records</h3>
            <div className="flex space-x-2">
              <input 
                type="search" 
                placeholder="Search payments..." 
                className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="p-6">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {payment.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{payment.user.name}</div>
                              <div className="text-sm text-gray-500">{payment.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.event.name}</div>
                          <div className="text-sm text-gray-500">{new Date(payment.event.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          LKR {payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {payment.numberOfTickets}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : payment.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payment.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApprove(payment.id)} 
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleReject(payment.id)} 
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <Link to={`/admin/payments/${payment.id}`} className="text-blue-600 hover:text-blue-900 ml-4">
                            View
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

export default PaymentApproval;
