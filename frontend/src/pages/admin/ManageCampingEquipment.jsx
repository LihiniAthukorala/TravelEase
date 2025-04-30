import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const ManageCampingEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin } = useAuth();

  // Form state for adding/editing equipment
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    category: 'Tents',
    image: null,
    isAvailable: true
  });
  const [currentId, setCurrentId] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const categories = ['Tents', 'Sleeping Bags', 'Cooking', 'Lighting', 'Hiking', 'Other'];

  useEffect(() => {
    // Check if user is admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchEquipment();
  }, [navigate, isAdmin]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/camping-equipment');
      
      if (response.data.success) {
        setEquipment(response.data.equipment);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      enqueueSnackbar('Failed to load camping equipment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login';
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ 
        ...formData, 
        [name]: type === 'checkbox' ? checked : value 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category: 'Tents',
      image: null,
      isAvailable: true
    });
    setCurrentImage(null);
    setCurrentId(null);
    setIsEditing(false);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
      isAvailable: item.isAvailable,
      image: null
    });
    setCurrentImage(item.image);
    setCurrentId(item._id);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    // Price validation
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || formData.price <= 0) {
      errors.price = 'Price must be a positive number';
    } else if (formData.price.toString().length > 6) {
      errors.price = 'Price cannot exceed 6 digits';
    }

    // Quantity validation
    if (!formData.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(formData.quantity) || formData.quantity < 0) {
      errors.quantity = 'Quantity must be a non-negative number';
    }

    // Category validation
    if (!formData.category) {
      errors.category = 'Category is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        enqueueSnackbar('Authentication required. Please log in.', { variant: 'error' });
        navigate('/login');
        return;
      }
      
      // Create FormData for file upload
      const equipmentData = new FormData();
      equipmentData.append('name', formData.name);
      equipmentData.append('description', formData.description);
      equipmentData.append('price', formData.price);
      equipmentData.append('quantity', formData.quantity);
      equipmentData.append('category', formData.category);
      equipmentData.append('isAvailable', formData.isAvailable);
      
      // Only append image if a new one was selected
      if (formData.image) {
        console.log('Appending image file:', formData.image.name);
        equipmentData.append('image', formData.image);
      }
      
      let response;
      
      // Test the API endpoint first
      try {
        const testResponse = await axios.get('http://localhost:5001/api/test-upload-path');
        console.log('Upload path test:', testResponse.data);
      } catch (testError) {
        console.error('Error testing upload path:', testError);
      }
      
      if (isEditing) {
        // Update existing equipment
        response = await axios.put(
          `http://localhost:5001/api/camping-equipment/${currentId}`,
          equipmentData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log('Update response:', response.data);
        enqueueSnackbar('Equipment updated successfully!', { variant: 'success' });
      } else {
        // Create new equipment
        response = await axios.post(
          'http://localhost:5001/api/camping-equipment',
          equipmentData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log('Create response:', response.data);
        enqueueSnackbar('Equipment created successfully!', { variant: 'success' });
      }
      
      // Close form and refresh list
      setIsFormOpen(false);
      fetchEquipment();
      
    } catch (error) {
      console.error('Error submitting equipment:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to save equipment';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`http://localhost:5001/api/camping-equipment/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEquipment(prevEquipment => prevEquipment.filter(item => item._id !== id));
      enqueueSnackbar('Equipment deleted successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      enqueueSnackbar('Failed to delete equipment', { variant: 'error' });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return '/images/default-equipment.jpg';
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:5001${imagePath}`;
    }
    
    return '/images/default-equipment.jpg';
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
                 <Link to="/admin/all-bookings" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
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
                 <Link to="/admin/manage-suppliers" className="flex items-center px-6 py-3 rounded-md mb-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                   </svg>
                   <span className="ml-3 font-medium">Suppliers</span>
                 </Link>
                 <Link to="/admin/inventory-reports" className="flex items-center px-6 py-3 rounded-md mb-1 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm14 2H3v10h14V5z" clipRule="evenodd" />
                   </svg>
                   <span className="ml-3 font-medium">Inventory Reports</span>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Camping Equipment</h1>
          <button 
            onClick={openAddForm} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add New Equipment
          </button>
        </div>

        {/* Equipment Form (Add/Edit) */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? 'Edit Equipment' : 'Add New Equipment'}
            </h2>
            
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full p-2 border ${formErrors.category ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (LKR)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full p-2 border ${formErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    required
                  />
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity in Stock
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    className={`w-full p-2 border ${formErrors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    required
                  />
                  {formErrors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className={`w-full p-2 border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    required
                  ></textarea>
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available for Purchase
                  </label>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full p-2"
                  />
                  {(isEditing && currentImage) && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Current image:</span>
                      <img 
                        src={getImageUrl(currentImage)} 
                        alt="Current" 
                        className="h-20 w-20 object-cover mt-1"
                        onError={(e) => e.target.src = '/images/default-equipment.jpg'}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isEditing ? 'Update' : 'Add'} Equipment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Equipment List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.log(`Image load error for ${item.name}`);
                              e.target.src = '/images/default-equipment.jpg';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">LKR {item.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.isAvailable && item.quantity > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable && item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => openEditForm(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)}
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
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No equipment found
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

export default ManageCampingEquipment;
