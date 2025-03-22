import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TourDetails = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchTourAndBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const [tourResponse, bookingsResponse] = await Promise.all([
          axios.get(`http://localhost:5001/api/tours/${id}`),
          axios.get(`http://localhost:5001/api/bookings/tour/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setTour(tourResponse.data);
        setUserBookings(bookingsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        enqueueSnackbar('Error fetching tour details', { variant: 'error' });
        setLoading(false);
      }
    };

    fetchTourAndBookings();
  }, [id, enqueueSnackbar]);

  // Filter tours based on search term
  const filteredTours = tour ? [tour].filter(tour =>
    tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tour.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tour Plans</h1>
          <p className="text-lg text-gray-600">Discover amazing travel experiences</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tours by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTours.length > 0 ? (
            filteredTours.map((tour) => (
              <div
                key={tour._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105"
              >
                <div className="relative h-48">
                  <img
                    src={tour.image || 'https://via.placeholder.com/400x300'}
                    alt={tour.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 p-2 bg-blue-600 text-white rounded-bl-lg">
                    ${tour.price}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      <span>{tour.duration} days</span>
                    </div>
                    <div className="flex items-center text-gray-600 ml-6">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      <span>{tour.location}</span>
                    </div>
                  </div>

                  <Link
                    to={isAuthenticated ? '/payment' : '/login'}
                    state={{ 
                      tourData: tour,
                      type: 'tour',
                      amount: tour.price,
                      purchaseDetails: {
                        name: tour.name,
                        duration: tour.duration,
                        location: tour.location,
                        date: tour.date
                      }
                    }}
                    className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
                  >
                    {isAuthenticated ? 'Book Now' : 'Login to Book'}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-lg">No tours found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourDetails;
