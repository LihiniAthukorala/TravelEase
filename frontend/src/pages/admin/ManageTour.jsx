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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login'; // Direct URL redirect with refresh
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
             <p className="text-gray-400 text-sm">Online Tourism and Travel Management System</p>
           </div>
           <nav className="mt-5">
             <Link to="/admin-dashboard" className="flex items-center px-6 py-3 rounded-md mb-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
               </svg>
               <span className="ml-3 font-medium">Dashboard</span>
             </Link>
             <Link to="/admin/users" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
               </svg>
               <span className="ml-3 font-medium">Users</span>
             </Link>
   
             <Link to="/admin/stock-tracking" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
               </svg>
               <span className="ml-3 font-medium">Stock Tracking</span>
             </Link>
             <Link to="/admin/camping-equipment" className="flex items-center px-6 py-3 rounded-md mb-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
               </svg>
               <span className="ml-3 font-medium">Camping Equipment</span>
             </Link>
             <Link to="/admin/orders" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
               </svg>
               <span className="ml-3 font-medium">Orders</span>
             </Link>
              <Link to="/admin/all-bookings"  className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
               </svg>
               <span className="ml-3 font-medium">All Bookings</span>
             </Link>
                           
             <Link to="/admin/manage-tour" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
               </svg>
               <span className="ml-3 font-medium">Manage Tour</span>
             </Link>
             
             <div className="pt-2 mt-2 border-t border-gray-700">
               <button 
                 onClick={handleLogout} 
                 className="flex items-center w-full px-6 py-3 rounded-md text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm6.293 11.293a1 1 0 001.414 0L14 10l-3.293-3.293a1 1 0 00-1.414 1.414L11.586 10l-2.293 2.293a1 1 0 000 1.414z" clipRule="evenodd" />
                 </svg>
                 <span className="ml-3 font-medium">Logout</span>
               </button>
             </div>
           </nav>
         </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Tours</h1>
            <div className="flex gap-4">
              <Link
                to="/admin/all-bookings"
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
              >
                View All Bookings
              </Link>
              <Link
                to="/admin/create-tour"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
              >
                Create New Tour
              </Link>
            </div>
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
    </div>
  );
}

export default ManageTour;