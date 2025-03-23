import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import axios from 'axios';

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5001/api/booking/booking/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setBooking(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        enqueueSnackbar('Failed to load booking details', { variant: 'error' });
        navigate('/admin/all-bookings');
      }
    };

    fetchBookingDetails();
  }, [id, navigate, enqueueSnackbar]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <Link
            to="/admin/all-bookings"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Bookings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium">Booking Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Booking ID</p>
                <p className="mt-1">{booking._id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    booking.status === 'CONFIRMED' 
                      ? 'bg-green-100 text-green-800' 
                      : booking.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status || 'PENDING'}
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
                <p className="text-sm font-medium text-gray-500">Customer Name</p>
                <p className="mt-1">{booking.user?.name || booking.user?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{booking.user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tour/Package Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium">Tour/Package Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1">{booking.tour?.name || booking.package?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="mt-1">{booking.tour?.location || booking.package?.destination || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Travel Date</p>
                <p className="mt-1">{formatDate(booking.travelDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="mt-1">LKR {booking.tour?.price || booking.package?.price || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDetails;
