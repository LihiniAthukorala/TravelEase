import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const EventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    specialRequirements: '',
    agreeToTerms: false
  });

  useEffect(() => {
    fetchEventDetails();
    // Pre-fill form with user data if available
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.username || '',
        email: user.email || '',
        contactNumber: user.contactNumber || ''
      }));
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event details:', error);
      enqueueSnackbar('Failed to load event details', { variant: 'error' });
      navigate(`/events/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      enqueueSnackbar('You must agree to the terms and conditions', { variant: 'warning' });
      return;
    }

    // Collect registration data to pass to payment page
    const registrationData = {
      eventId: id,
      eventName: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      ticketPrice: event.price,
      numberOfTickets: 1, // Fixed to 1 ticket
      totalAmount: event.price, // Calculating for 1 ticket
      fullName: formData.fullName,
      email: formData.email,
      contactNumber: formData.contactNumber,
      specialRequirements: formData.specialRequirements
    };

    // Navigate to payment page with registration data
    navigate('/payment', { 
      state: { 
        registrationData: registrationData,
        amount: registrationData.totalAmount
      } 
    });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
        <Link to="/events" className="mt-4 inline-block text-blue-600 hover:underline">
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Register for Event</h1>
            <Link 
              to={`/events/${id}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              &larr; Back to event details
            </Link>
          </div>
        </div>

        <div className="p-6">
          {/* Event Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <div className="flex flex-wrap text-sm text-gray-600">
              <div className="flex items-center mr-4 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.date)}, {event.time}</span>
              </div>
              <div className="flex items-center mr-4 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{event.price > 0 ? `LKR ${event.price}` : 'Free'}</span>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">Available Spots: </span>
              <span>{event.capacity - (event.attendees?.length || 0)} of {event.capacity}</span>
            </div>
            
            {/* Enhanced Price Display */}
            <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
              <div className="text-center">
                <span className="text-lg font-bold text-blue-700">
                  {event.price > 0 ? `Registration Fee: LKR ${event.price.toFixed(2)}` : 'Free Registration'}
                </span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700">Special Requirements</label>
              <textarea
                id="specialRequirements"
                name="specialRequirements"
                rows="3"
                value={formData.specialRequirements}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Any dietary restrictions, accessibility needs, or other requirements..."
              ></textarea>
            </div>

            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                I agree to the <a href="#" className="text-blue-600 hover:underline">terms and conditions</a> and 
                understand the event's attendance policies.
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                to={`/events/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Processing...' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventRegistration;
