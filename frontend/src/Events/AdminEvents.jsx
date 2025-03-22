import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchEvents();
  }, [navigate, isAdmin]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/events', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('Failed to load events', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login'; // Replace navigate with direct URL redirect with refresh
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleApproveReject = async (eventId, isApproved) => {
    try {
      const token = localStorage.getItem('token');

      await axios.put(`http://localhost:5001/api/events/${eventId}/approve`, 
        { isApproved },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update local state to reflect the change
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === eventId ? { ...event, isApproved } : event
        )
      );

      enqueueSnackbar(
        isApproved ? 'Event approved successfully!' : 'Event rejected successfully!', 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error updating event:', error);
      enqueueSnackbar('Failed to update event status', { variant: 'error' });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`http://localhost:5001/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove deleted event from local state
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      enqueueSnackbar('Event deleted successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('Failed to delete event', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-gray-400 text-sm">Event Management System</p>
        </div>
        <nav className="mt-5">
          <Link to="/admin-dashboard" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link to="/admin/users" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Users</span>
          </Link>
          <Link to="/admin/events" className="flex items-center px-6 py-3 bg-gray-800 text-gray-100">
            <span className="ml-3">Events</span>
          </Link>
          <Link to="/admin/payment-approvals" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
                      <span className="ml-3">Payment Approvals</span>
                    </Link>
           <Link to="/managefeedback" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
                      <span className="ml-3">Feedback Manage</span>
                    </Link>
          
         
          <button 
            onClick={handleLogout} 
            className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100 w-full text-left"
          >
            <span className="ml-3">Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Events</h1>
          <div className="flex space-x-2">
            <Link to="/create-event" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Create New Event
            </Link>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length > 0 ? (
                events.map((event) => (
                  <tr key={event._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <img 
                            src={event.image || 'https://via.placeholder.com/40?text=Event'} 
                            alt={event.title} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                      <div className="text-sm text-gray-500">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.organizer?.username || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{event.organizer?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        event.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        <Link 
                          to={`/admin/events/${event._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {!event.isApproved && (
                          <button 
                            onClick={() => handleApproveReject(event._id, true)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        {event.isApproved && (
                          <button 
                            onClick={() => handleApproveReject(event._id, false)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Reject
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteEvent(event._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
