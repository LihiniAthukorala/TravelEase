import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const UserBookings = () => {
  const [regularBookings, setRegularBookings] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, tours, regular
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch both types of bookings in parallel
        const [regularRes, tourRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/booking/bookings/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5001/api/tour-payments/my-bookings', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setRegularBookings(regularRes.data || []);
        
        // Make sure we handle both possible response structures
        const tourData = tourRes.data.bookings ? tourRes.data.bookings : tourRes.data;
        setTourBookings(tourData || []);
        
      } catch (error) {
        console.error('Error fetching bookings:', error);
        enqueueSnackbar('Failed to load your bookings', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [user, navigate, enqueueSnackbar]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };
  
  // Get filtered bookings based on active tab
  const getDisplayBookings = () => {
    switch (activeTab) {
      case 'tours':
        return tourBookings;
      case 'regular':
        return regularBookings;
      case 'all':
      default:
        return [...tourBookings, ...regularBookings];
    }
  };
  
  // Determine booking status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      'PENDING': { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'pending': { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'CONFIRMED': { class: 'bg-green-100 text-green-800', text: 'Confirmed' },
      'approved': { class: 'bg-green-100 text-green-800', text: 'Approved' },
      'CANCELLED': { class: 'bg-red-100 text-red-800', text: 'Cancelled' },
      'rejected': { class: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    
    const displayInfo = statusMap[status] || { class: 'bg-gray-100 text-gray-800', text: status || 'Unknown' };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${displayInfo.class}`}>
        {displayInfo.text}
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
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">View all your tour and activity bookings</p>
        </div>
        
        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'all' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('all')}
            >
              All Bookings
            </button>
            <button
              className={`${
                activeTab === 'tours' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('tours')}
            >
              Tour Bookings
            </button>
            <button
              className={`${
                activeTab === 'regular' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('regular')}
            >
              Regular Bookings
            </button>
          </nav>
        </div>
        
        {/* Bookings list */}
        {getDisplayBookings().length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {getDisplayBookings().map((booking) => {
                // Determine if it's a tour booking (has tourBookingDetails) or regular booking
                const isTourBooking = booking.tourBookingDetails || booking.type === 'tour';
                const bookingName = isTourBooking 
                  ? booking.tourDetails?.name || booking.tourBookingDetails?.tourName || 'Tour Booking'
                  : booking.tour?.name || 'Booking';
                
                const bookingDate = isTourBooking
                  ? booking.timestamp || booking.createdAt
                  : booking.travelDate;
                
                const bookingLocation = isTourBooking
                  ? booking.tourDetails?.location || 'Various Locations'
                  : booking.tour?.location || 'N/A';
                
                return (
                  <li key={booking._id}>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">{bookingName}</h3>
                            <div className="mt-1 flex items-center">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-gray-500">{bookingLocation}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div>{getStatusDisplay(booking.status)}</div>
                          <p className="mt-2 text-sm text-gray-500">{formatDate(bookingDate)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-500">
                          Booking ID: {booking._id.substring(0, 8)}...
                        </span>
                        {isTourBooking && (
                          <span className="ml-4 text-sm font-medium text-gray-500">
                            Persons: {booking.numberOfTickets || booking.tourBookingDetails?.persons || 1}
                          </span>
                        )}
                        {booking.amount && (
                          <span className="ml-4 text-sm font-medium text-gray-500">
                            Amount: LKR {booking.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {/* Additional actions */}
                      <div className="mt-4 flex">
                        {/* For tour bookings, we can potentially provide a view receipt option */}
                        {isTourBooking && booking.status === 'approved' && (
                          <Link 
                            to={`/bookings/${booking._id}/receipt`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Receipt
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any bookings yet.</p>
            <div className="mt-6">
              <Link to="/tours" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Browse Tours
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

export default UserBookings;
