import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const UpdateProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    contactNumber: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUserData = async () => {
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
        
        // Destructure to exclude password field
        const { username, email, contactNumber, address } = response.data.user;
        
        setFormData({
          username,
          email,
          contactNumber: contactNumber || '',
          address: address || '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        enqueueSnackbar('Failed to load user data. Please try again.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, enqueueSnackbar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Validate password match if changing password
      if (changePassword) {
        if (formData.newPassword !== formData.confirmNewPassword) {
          enqueueSnackbar('New passwords do not match', { variant: 'error' });
          setSubmitting(false);
          return;
        }
        
        if (formData.newPassword.length < 6) {
          enqueueSnackbar('Password must be at least 6 characters long', { variant: 'error' });
          setSubmitting(false);
          return;
        }
      }
      
      // Create update data object - only include password fields if changing password
      const updateData = {
        username: formData.username,
        email: formData.email,
        contactNumber: formData.contactNumber,
        address: formData.address
      };
      
      if (changePassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await axios.put(
        'http://localhost:5001/api/auth/update-profile',
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
        
        // Update user in local storage if needed
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const updatedUser = {
            ...user,
            username: formData.username,
            email: formData.email,
            contactNumber: formData.contactNumber,
            address: formData.address
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Update Your Profile</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Edit your personal information
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 shadow rounded-lg" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.contactNumber}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex items-center my-4">
              <input
                id="changePassword"
                name="changePassword"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={changePassword}
                onChange={() => setChangePassword(!changePassword)}
              />
              <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-900">
                Change Password
              </label>
            </div>
            
            {changePassword && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required={changePassword}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required={changePassword}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required={changePassword}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="group relative w-1/3 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
