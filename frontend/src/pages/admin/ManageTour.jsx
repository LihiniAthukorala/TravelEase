import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

function ManageTour() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState([]);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5001/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.user.role !== 'admin') {
          enqueueSnackbar('Access denied. Admin privileges required.', { variant: 'error' });
          navigate('/dashboard');
          return;
        }

        // Fetch tours after admin verification
        fetchTours();
      } catch (error) {
        console.error('Error:', error);
        enqueueSnackbar('Authentication failed', { variant: 'error' });
        navigate('/login');
      }
    };

    verifyAdmin();
  }, [navigate, enqueueSnackbar]);

  const fetchTours = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/tours');
      setTours(response.data);
      setLoading(false);
    } catch (error) {
      enqueueSnackbar('Error fetching tours', { variant: 'error' });
      setLoading(false);
    }
  };

  const handleDelete = async (tourId) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5001/api/tours/${tourId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        enqueueSnackbar('Tour deleted successfully', { variant: 'success' });
        // Refresh tours list after deletion
        fetchTours();
      } catch (error) {
        enqueueSnackbar(error.response?.data?.message || 'Error deleting tour', { variant: 'error' });
      }
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Tours</h1>
          <Link
            to="/admin/create-tour"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Create New Tour
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tours.map((tour) => (
                <tr key={tour._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img 
                      src={tour.image.startsWith('http') ? tour.image : `http://localhost:5001/${tour.image}`} 
                      alt={tour.name} 
                      className="h-16 w-16 object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{tour.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tour.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${tour.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tour.duration} days</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/edit-tour/${tour._id}`}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(tour._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageTour;
