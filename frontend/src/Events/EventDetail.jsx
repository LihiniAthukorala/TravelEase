import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      // Remove token requirement check
      const response = await axios.get(`http://localhost:5001/api/events/${id}`);
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
      enqueueSnackbar('Failed to load event details', { variant: 'error' });
      navigate('/events');
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
    return 'https://via.placeholder.com/800x400?text=Event+Image';
  };

  const handleRegisterForEvent = () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      enqueueSnackbar('Please log in to register for this event', { variant: 'info' });
      navigate('/login');
      return;
    }

    // If authenticated, proceed to registration page
    navigate(`/events/${id}/register`);
  };

  const isUserRegistered = () => {
    if (!isAuthenticated || !event || !event.attendees) {
      return false;
    }
    
    return event.attendees.some(attendee => attendee._id === user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-xl text-red-500">Event not found.</p>
        <Link to="/my-events" className="mt-4 inline-block text-blue-600 hover:underline">
          Return to My Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Event Image */}
        <div className="relative h-64 md:h-80">
          <img 
            src={getImageUrl(event.image)} 
            alt={event.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x400?text=No+Image+Available';
            }}
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
              event.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {event.isApproved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
        </div>
        
        {/* Event Content */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-600 mb-6">
            <div className="flex items-center mr-4 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(event.date)}</span>
            </div>
            
            <div className="flex items-center mr-4 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{event.time}</span>
            </div>
            
            <div className="flex items-center mr-4 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
            
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{event.category}</span>
            </div>
          </div>
          
          <div className="prose max-w-none mb-6">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{event.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Event Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Organizer</p>
                <p className="font-medium">{event.organizer?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">{event.price > 0 ? `LKR ${event.price}` : 'Free'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium">{event.capacity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Attendees</p>
                <p className="font-medium">{event.attendees?.length || 0} / {event.capacity}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-between items-center">
            <Link to="/events" className="text-blue-600 hover:underline mb-2">
              &larr; Back to Events
            </Link>
            <div className="space-x-2">
              {isAuthenticated ? (
                <>
                  {event?.isApproved && !isUserRegistered() && (
                    <button 
                      onClick={handleRegisterForEvent} 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                      disabled={event.attendees?.length >= event.capacity}
                    >
                      {event.attendees?.length >= event.capacity ? 'Event Full' : 'Register'}
                    </button>
                  )}
                  {isUserRegistered() && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded">
                      Registered
                    </span>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleRegisterForEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Login to Register
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
