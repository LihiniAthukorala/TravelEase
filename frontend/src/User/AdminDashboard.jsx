import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchAdminData = async () => {
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
        
        setAdmin(response.data.user);
        
        // Fetch users and events after admin authentication
        await fetchUsers(token);
        await fetchEvents(token);
        await fetchPendingPayments(token);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        enqueueSnackbar('Failed to load admin data. Please login again.', { variant: 'error' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [navigate, enqueueSnackbar]);

  const fetchUsers = async (token) => {
    setLoadingUsers(true);
    try {
      const response = await axios.get('http://localhost:5001/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);
      
      // Update stats with actual user count
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: fetchedUsers.length
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Failed to load users', { variant: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const fetchEvents = async (token) => {
    try {
      const response = await axios.get('http://localhost:5001/api/events', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          totalEvents: response.data.events.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Keep default value for totalEvents
    }
  };

  const fetchPendingPayments = async (token) => {
    try {
      const response = await axios.get('http://localhost:5001/api/payments/pending', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          pendingApprovals: response.data.count || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      // Keep default value for pendingApprovals
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
          <p className="text-gray-400 text-sm">Event Management System</p>
        </div>
        <nav className="mt-5">
          <Link to="/admin-dashboard" className="flex items-center px-6 py-3 bg-gray-800 text-gray-100">
            <span className="ml-3">Dashboard</span>
          </Link>
          <Link to="/admin/users" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            {admin && (
              <>
                <span className="text-gray-600">Welcome, {admin.username}</span>
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {admin.username.charAt(0).toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <div className="mt-2">
              <Link to="/admin/users" className="text-blue-500 text-sm">View all users →</Link>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Events</h3>
            <p className="text-3xl font-bold">{stats.totalEvents}</p>
            <div className="mt-2">
              <Link to="/admin/events" className="text-blue-500 text-sm">View all events →</Link>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Pending Approvals</h3>
            <p className="text-3xl font-bold">{stats.pendingApprovals}</p>
            <div className="mt-2">
              <Link to="/admin/payment-approvals" className="text-blue-500 text-sm">View payment approvals →</Link>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium">Admin Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Admin ID</p>
                <p className="mt-1">{admin?.adminId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="mt-1">{admin?.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{admin?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Permissions</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {admin?.permissions && admin.permissions.length > 0 ? (
                    admin.permissions.map((permission, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {permission}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No specific permissions</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/admin/profile" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/create-event" className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 text-center">
                <div className="text-lg mb-1">+</div>
                <div className="text-sm">Create Event</div>
              </Link>
              <Link to="/admin/users" className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 text-center">
                <div className="text-lg mb-1">👥</div>
                <div className="text-sm">Manage Users</div>
              </Link>
              <Link to="/admin/payment-approvals" className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 text-center">
                <div className="text-lg mb-1">💳</div>
                <div className="text-sm">Payment Approvals</div>
              </Link>
              <Link to="/managefeedback" className="bg-gray-100 p-4 rounded-lg hover:bg-gray-200 text-center">
                <div className="text-lg mb-1">📝</div>
                <div className="text-sm">Manage Feedback</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Registered Users</h3>
            <Link to="/admin/users" className="text-blue-500 text-sm">View All</Link>
          </div>
          <div className="p-6">
            {loadingUsers ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-solid"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.slice(0, 5).map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                              {user.username?.charAt(0).toUpperCase() || '?'}
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link to={`/admin/users/${user._id}`} className="text-blue-500 hover:text-blue-700 mr-4">View</Link>
                          <Link to={`/admin/users/${user._id}/edit`} className="text-indigo-500 hover:text-indigo-700">Edit</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No users found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
