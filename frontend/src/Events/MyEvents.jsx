import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);
      
      // First check server health
      try {
        await axios.get('http://localhost:5001/api/health', { timeout: 5000 });
      } catch (healthError) {
        console.error('Server health check failed:', healthError);
        setError('Server appears to be offline. Please try again later.');
        enqueueSnackbar('Server connection error', { variant: 'error' });
        setLoading(false);
        return;
      }
      
      const response = await axios.get('http://localhost:5001/api/events/myevents', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 seconds timeout
      });

      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      
      if (error.response) {
        // The server responded with an error status
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          enqueueSnackbar('Session expired. Please login again.', { variant: 'warning' });
          navigate('/login');
          return;
        } else if (error.response.status === 500) {
          setError('Server error. The development team has been notified.');
        } else {
          setError(`Error: ${error.response.data.message || 'Unknown error occurred'}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        setError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request
        setError('Failed to load your events. Please try again later.');
      }
      
      enqueueSnackbar('Failed to load your events', { variant: 'error' });
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
    return '/images/default-event.jpg';
  };

  const handleImageError = (e) => {
    // If the current source is a server URL and it failed, try the local fallback
    if (e.target.src.includes('localhost:5001')) {
      e.target.src = '/images/default-event.jpg';
    } else {
      // If local fallback fails, use inline SVG
      e.target.onerror = () => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23cccccc%22%2F%3E%3Ctext%20x%3D%22150%22%20y%3D%22100%22%20font-family%3D%22Arial%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%23777777%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
      };
    }
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
          onClick={fetchMyEvents} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Events</h1>
        <Link 
          to="/create-event" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
          <Link
            to="/create-event"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event._id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="relative h-48">
                <img
                  src={getImageUrl(event.image)}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <span 
                  className={`absolute top-0 right-0 px-3 py-1 m-2 text-xs font-semibold rounded ${
                    event.isApproved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {event.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Date:</span> {formatDate(event.date)}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Time:</span> {event.time}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Location:</span> {event.location}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <Link
                    to={`/events/${event._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                  <div className="flex space-x-2">
                    <Link
                      to={`/events/${event._id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
