import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const EditEvent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [eventOwner, setEventOwner] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
    capacity: 0,
    price: 0,
  });
  
  const [currentImage, setCurrentImage] = useState(null);
  const [newImage, setNewImage] = useState(null);
  
  // Categories for the select dropdown
  const categories = [
    'Technology', 'Business', 'Entertainment', 'Sports', 
    'Education', 'Culinary', 'Arts', 'Health'
  ];
  
  useEffect(() => {
    fetchEventDetails();
  }, [id]);
  
  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        enqueueSnackbar('Authentication required. Please log in.', { variant: 'error' });
        navigate('/login');
        return;
      }
      
      console.log(`Fetching event details for ID: ${id}`);
      const response = await axios.get(`http://localhost:5001/api/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Event details response:', response.data);
      
      if (response.data.success) {
        const event = response.data.event;
        
        // Store the event owner for authorization checks
        setEventOwner(event.organizer?._id || event.organizer);
        
        // Format date for input[type="date"] (YYYY-MM-DD)
        let formattedDate;
        try {
          formattedDate = new Date(event.date).toISOString().split('T')[0];
        } catch (error) {
          console.error('Error formatting date:', error);
          formattedDate = '';
        }
        
        setFormData({
          title: event.title || '',
          description: event.description || '',
          date: formattedDate || '',
          time: event.time || '',
          location: event.location || '',
          category: event.category || 'Technology',
          capacity: event.capacity || 50,
          price: event.price || 0,
        });
        
        setCurrentImage(event.image || null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch event details');
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details. Please try again.');
      enqueueSnackbar('Failed to load event details: ' + (error.response?.data?.message || error.message), { variant: 'error' });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/my-events');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };
  
  // Check if the user is authorized to edit this event
  const isAuthorized = () => {
    return user?.role === 'admin' || user?.id === eventOwner;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImage(e.target.files[0]);
    }
  };
  
  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.date) return 'Date is required';
    if (!formData.time) return 'Time is required';
    if (!formData.location.trim()) return 'Location is required';
    if (formData.capacity <= 0) return 'Capacity must be greater than 0';
    if (formData.price < 0) return 'Price cannot be negative';
    return null;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authorization
    if (!isAuthorized()) {
      enqueueSnackbar('You are not authorized to edit this event', { variant: 'error' });
      navigate('/my-events');
      return;
    }
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      enqueueSnackbar(validationError, { variant: 'error' });
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        enqueueSnackbar('Authentication required. Please log in.', { variant: 'error' });
        navigate('/login');
        return;
      }
      
      // Create FormData for file upload
      const eventData = new FormData();
      eventData.append('title', formData.title);
      eventData.append('description', formData.description);
      eventData.append('date', formData.date);
      eventData.append('time', formData.time);
      eventData.append('location', formData.location);
      eventData.append('category', formData.category);
      eventData.append('capacity', Number(formData.capacity));
      eventData.append('price', Number(formData.price));
      
      // Only append image if a new one was selected
      if (newImage) {
        eventData.append('image', newImage);
      }
      
      console.log('Sending update request for event:', id);
      const response = await axios.put(
        `http://localhost:5001/api/events/${id}`,
        eventData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        enqueueSnackbar(
          user?.role === 'admin' 
            ? 'Event updated successfully!' 
            : 'Event updated and submitted for approval!', 
          { variant: 'success' }
        );
        
        // Redirect based on user role after a short delay
        setTimeout(() => {
          if (user?.role === 'admin') {
            navigate('/admin/events');
          } else {
            navigate('/my-events');
          }
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update event. Please try again.';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
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
    
    return '/images/default-event.jpg';
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => navigate('/my-events')} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to My Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Event</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (LKR)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Image</label>
          {currentImage && (
            <div className="mt-2 relative">
              <img 
                src={getImageUrl(currentImage)} 
                alt="Current event"
                className="h-40 w-auto object-cover rounded-md" 
              />
            </div>
          )}
          
          <label className="block text-sm font-medium text-gray-700 mt-4">Update Image (Optional)</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {newImage && (
            <p className="mt-2 text-sm text-gray-500">
              Selected new file: {newImage.name}
            </p>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/my-events')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Updating...' : 'Update Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;
