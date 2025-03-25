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
  const [searchTerm, setSearchTerm] = useState(''); // Added search term state
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
    applyFiltersAndSearch(filter, searchTerm);
  };

  // New function to apply both filters and search
  const applyFiltersAndSearch = (filter, search) => {
    let filtered = payments;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(payment => payment.status === filter);
    }
    
    // Apply search filter if there's a search term
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.id.toString().toLowerCase().includes(searchLower) ||
        payment.user.name.toLowerCase().includes(searchLower) ||
        payment.user.email.toLowerCase().includes(searchLower) ||
        payment.event.name?.toLowerCase().includes(searchLower) ||
        payment.amount.toString().includes(searchLower)
      );
    }
    
    setFilteredPayments(filtered);
  };

  // Handle search input changes
  const handleSearch = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    applyFiltersAndSearch(activeFilter, newSearchTerm);
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
                     <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
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
                     <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V7.414l-4-4H3zm6.293 11.293a1 1 0 001.414 0L14 10l-3.293-3.293a1 1 0 00-1.414 1.414L11.586 10l-2.293 2.293a1 1 0 000 1.414z" clipRule="evenodd" />
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
                     <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
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
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="p-6">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? "No payments match your search" : "No payments found"}
              </div>
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
