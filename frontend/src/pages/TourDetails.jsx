import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const TourDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/tours');
        
        if (id) {
          const specificTour = response.data.find(tour => tour._id === id);
          if (specificTour) {
            setTour(specificTour);
            setTours([specificTour]);
          } else {
            enqueueSnackbar('Tour not found. Please try another tour.', { 
              variant: 'warning',
              autoHideDuration: 3000
            });
            navigate('/tours');
          }
        } else {
          setTours(response.data);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Unable to load tours. Please try again later.';
        console.error('Error fetching tours:', errorMessage);
        enqueueSnackbar(errorMessage, { 
          variant: 'error',
          autoHideDuration: 4000
        });
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();

    // Fetch user bookings if authenticated and viewing specific tour
    const fetchUserBookings = async () => {
      if (isAuthenticated && id) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:5001/api/booking/bookings/tour/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUserBookings(response.data || []); // Handle empty response
        } catch (error) {
          console.error('Error fetching bookings:', error?.response?.data?.error || error.message);
          setUserBookings([]); // Set empty array on error
          enqueueSnackbar('Success', { 
            variant: 'success',
            autoHideDuration: 3000
          });
        }
      }
    };

    if (isAuthenticated && id) {
      fetchUserBookings();
    }
  }, [id, isAuthenticated, navigate, enqueueSnackbar]);

  // Improved filter function
  const filteredTours = tours.filter(tour => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tour?.name?.toLowerCase().includes(searchLower) ||
      tour?.location?.toLowerCase().includes(searchLower) ||
      tour?.description?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading tour information...</p>
      </div>
    );
  }

  // Get image URL with proper fallback
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300';
    
    if (imagePath.startsWith('http')) return imagePath;
    
    return `http://localhost:5001/${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {id ? 'Tour Details' : 'All Tours'}
          </h1>
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
              className="w-full px-4 py-3 rounded-lg shadow-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    src={getImageUrl(tour.image)}
                    alt={tour.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
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

                  {id ? (
                    <Link
                      to={isAuthenticated ? '/tour-payment' : '/login'}
                      state={{ 
                        tourData: tour,
                        type: 'tour',
                      }}
                      onClick={(e) => {
                        if (!isAuthenticated) {
                          e.preventDefault();
                          navigate('/login', { 
                            state: { returnUrl: `/tours/${tour._id}` }
                          });
                        }
                      }}
                      className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
                    >
                      {isAuthenticated ? 'Book Now' : 'Login to Book'}
                    </Link>
                  ) : (
                    <Link
                      to={`/tours/${tour._id}`}
                      className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
                    >
                      View Details
                    </Link>
                  )}
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
