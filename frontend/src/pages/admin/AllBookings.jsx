import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';

function AllBookings() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [bookings, setBookings] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, regular, tour

  useEffect(() => {
    const verifyAdminAndFetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Check if user is admin
        const authResponse = await axios.get('http://localhost:5001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (authResponse.data.user.role !== 'admin') {
          enqueueSnackbar('Access denied. Admin privileges required.', { variant: 'error' });
          navigate('/dashboard');
          return;
        }

        // Fetch both regular bookings and tour bookings in parallel
        const [bookingsResponse, tourBookingsResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/booking/all', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5001/api/tour-payments/all', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Process regular bookings
        const regularBookings = bookingsResponse.data.map(booking => ({
          ...booking,
          bookingType: 'regular'
        }));
        
        // Process tour bookings from payments
        const processedTourBookings = tourBookingsResponse.data.bookings ? 
          tourBookingsResponse.data.bookings.map(booking => ({
            ...booking,
            bookingType: 'tour',
            tourName: booking.tourDetails?.name || booking.event?.name || 'N/A',
            travelDate: booking.tourDetails?.date || new Date().toISOString()
          })) : [];
        
        setBookings(regularBookings);
        setTourBookings(processedTourBookings);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        enqueueSnackbar('Error fetching bookings data', { variant: 'error' });
        setLoading(false);
      }
    };

    verifyAdminAndFetchBookings();
  }, [navigate, enqueueSnackbar]);

  const handleDeleteBooking = async (bookingId, bookingType) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (bookingType === 'regular') {
        await axios.delete(`http://localhost:5001/api/booking/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(bookings.filter(booking => booking._id !== bookingId));
      } else {
        // For tour bookings, use the appropriate endpoint
        await axios.delete(`http://localhost:5001/api/payments/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTourBookings(tourBookings.filter(booking => booking._id !== bookingId));
      }
      
      enqueueSnackbar('Booking deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error deleting booking', { variant: 'error' });
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login'; // Direct URL redirect with refresh
  };

  // Get filtered bookings based on active tab
  const getFilteredBookings = () => {
    switch(activeTab) {
      case 'regular':
        return bookings;
      case 'tour':
        return tourBookings;
      case 'all':
      default:
        return [...bookings, ...tourBookings];
    }
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status display with color
  const getStatusDisplay = (status) => {
    let color, text;
    
    switch(status?.toUpperCase()) {
      case 'CONFIRMED':
      case 'APPROVED':
        color = 'bg-green-100 text-green-800';
        text = 'Confirmed';
        break;
      case 'CANCELLED':
      case 'REJECTED':
        color = 'bg-red-100 text-red-800';
        text = 'Cancelled';
        break;
      case 'PENDING':
      default:
        color = 'bg-yellow-100 text-yellow-800';
        text = 'Pending';
        break;
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${color}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
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
        <h1 className="text-3xl font-bold mb-6">All Bookings</h1>

        {/* Booking type tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('all')}
            >
              All Bookings
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'regular' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('regular')}
            >
              Regular Bookings
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'tour' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('tour')}
            >
              Tour Bookings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour/Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredBookings().length > 0 ? (
                getFilteredBookings().map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {booking._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.user?.name || booking.user?.username || booking.user?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.bookingType === 'tour' ? booking.tourName : booking.tour?.name || booking.package?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(booking.bookingType === 'tour' ? booking.timestamp : booking.travelDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${booking.bookingType === 'tour' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {booking.bookingType === 'tour' ? 'Tour' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusDisplay(booking.bookingType === 'tour' ? booking.status : booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteBooking(booking._id, booking.bookingType)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <Link
                          to={booking.bookingType === 'tour' 
                            ? `/admin/payments/${booking._id}`
                            : `/admin/bookings/${booking._id}`
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AllBookings;
