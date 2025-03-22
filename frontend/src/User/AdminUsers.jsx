import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
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

    fetchUsers();
  }, [navigate, isAdmin]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Failed to load users', { variant: 'error' });
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
          <Link to="/admin/users" className="flex items-center px-6 py-3 bg-gray-800 text-gray-100">
            <span className="ml-3">Users</span>
          </Link>
          <Link to="/admin/events" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
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
          <h1 className="text-3xl font-bold">Customer </h1>
          <div className="flex space-x-2">
            <Link to="/admin/add-user" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add New User
            </Link>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.contactNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/admin/users/${user._id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
