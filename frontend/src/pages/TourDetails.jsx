import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TourDetails = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/tours');
        setTours(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tours:', error);
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

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

        {/* {user?.role === 'admin' && (
          <div className="mb-8 text-right">
            <Link
              to="/admin/create-tour"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Tour
            </Link>
          </div>
        )} */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default TourDetails;
