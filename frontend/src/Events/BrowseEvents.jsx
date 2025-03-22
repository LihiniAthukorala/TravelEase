import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let url = 'http://localhost:5001/api/events';
      let headers = {};
      
      // Use different endpoint based on authentication status
      if (token) {
        headers = { Authorization: `Bearer ${token}` };
      } else {
        url = 'http://localhost:5001/api/events/public';
      }

      const response = await axios.get(url, { headers });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('Failed to load events', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getImageUrl = (imagePath) => {
    // If image path starts with 'http', it's already a full URL
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      return imagePath;
    }
    
    // If image path starts with '/uploads', prepend with backend URL
    if (imagePath && imagePath.startsWith('/uploads')) {
      return `http://localhost:5001${imagePath}`;
    }
    
    // Return default image
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchEvents} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Events</h1>
        <div className="flex space-x-2">
          <Link to="/" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Back to Home
          </Link>
          {isAuthenticated && (
            <Link to="/create-event" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Create New Event
            </Link>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-xl">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map(event => (
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105" key={event._id}>
              <div className="relative">
                <img 
                  src={getImageUrl(event.image)} 
                  alt={event.title} 
                  className="w-full h-48 object-cover" 
                  onError={handleImageError}
                />
                <span className="absolute top-4 left-4 bg-blue-500 text-white text-sm py-1 px-3 rounded-full">{event.category}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-1"><span className="font-medium">Date:</span> {formatDate(event.date)}</p>
                <p className="text-gray-600 mb-1"><span className="font-medium">Time:</span> {event.time}</p>
                <p className="text-gray-600 mb-4"><span className="font-medium">Location:</span> {event.location}</p>
                <Link 
                  to={`/events/${event._id}`}
                  className="block text-center py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;
