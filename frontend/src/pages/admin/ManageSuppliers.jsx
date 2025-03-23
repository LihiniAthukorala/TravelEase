import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

function ManageSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '', contactPerson: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
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
        
        // Fetch suppliers after admin authentication
        fetchSuppliers(token);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        enqueueSnackbar('Failed to load admin data. Please login again.', { variant: 'error' });
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    
    fetchAdminData();
  }, [navigate, enqueueSnackbar]);

  const fetchSuppliers = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/suppliers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuppliers(response.data.suppliers || []);
      } else {
        enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async () => {
    // Form validation
    const errors = {};
    if (!newSupplier.name.trim()) errors.name = 'Name is required';
    if (!newSupplier.email.trim()) errors.email = 'Email is required';
    if (newSupplier.email.trim() && !/^\S+@\S+\.\S+$/.test(newSupplier.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const isEditing = !!selectedSupplier;
      const url = isEditing 
        ? `http://localhost:5001/api/suppliers/${selectedSupplier._id}` 
        : 'http://localhost:5001/api/suppliers';
      
      const method = isEditing ? axios.put : axios.post;
      
      const response = await method(url, newSupplier, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        enqueueSnackbar(`Supplier ${isEditing ? 'updated' : 'added'} successfully`, { variant: 'success' });
        setNewSupplier({ name: '', email: '', phone: '', address: '', contactPerson: '', notes: '' });
        setFormErrors({});
        setShowAddModal(false);
        fetchSuppliers(token);
      } else {
        enqueueSnackbar(response.data.message || `Failed to ${isEditing ? 'update' : 'add'} supplier`, { variant: 'error' });
      }
    } catch (error) {
      console.error(`Error ${selectedSupplier ? 'updating' : 'adding'} supplier:`, error);
      enqueueSnackbar(error.response?.data?.message || `Failed to ${selectedSupplier ? 'update' : 'add'} supplier`, { variant: 'error' });
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.delete(`http://localhost:5001/api/suppliers/${supplierId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        enqueueSnackbar('Supplier deleted successfully', { variant: 'success' });
        fetchSuppliers(token);
        if (showDetailModal && selectedSupplier && selectedSupplier._id === supplierId) {
          setShowDetailModal(false);
        }
      } else {
        enqueueSnackbar(response.data.message || 'Failed to delete supplier', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete supplier', { variant: 'error' });
    }
  };

  const openAddModal = (supplier = null) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setNewSupplier({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contactPerson: supplier.contactPerson || '',
        notes: supplier.notes || ''
      });
    } else {
      setSelectedSupplier(null);
      setNewSupplier({ name: '', email: '', phone: '', address: '', contactPerson: '', notes: '' });
    }
    setFormErrors({});
    setShowAddModal(true);
  };

  const openDetailModal = async (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
    
    // Fetch products for this supplier
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`http://localhost:5001/api/suppliers/${supplier._id}/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSupplierProducts(response.data.products || []);
      } else {
        enqueueSnackbar('Failed to load supplier products', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching supplier products:', error);
      enqueueSnackbar('Failed to load supplier products', { variant: 'error' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login';
  };

  const filteredSuppliers = suppliers
    .filter(supplier => 
      supplier.name.toLowerCase().includes(filterText.toLowerCase()) ||
      supplier.email.toLowerCase().includes(filterText.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'email') {
        return sortOrder === 'asc' 
          ? a.email.localeCompare(b.email) 
          : b.email.localeCompare(a.email);
      } else if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt) 
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

  const activeSuppliers = suppliers.filter(s => s.active).length;

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
          <h1 className="text-3xl font-bold">Supplier Management</h1>
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

        {/* Supplier Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Suppliers</h3>
            <p className="text-3xl font-bold">{suppliers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Active Suppliers</h3>
            <p className="text-3xl font-bold text-green-500">{activeSuppliers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Inactive Suppliers</h3>
            <p className="text-3xl font-bold text-yellow-500">{suppliers.length - activeSuppliers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <button 
              onClick={() => openAddModal()}
              className="w-full h-full flex flex-col items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="mt-2 font-medium">Add New Supplier</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="w-full md:w-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10 p-3 w-full md:w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-gray-700">Sort by:</span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  onClick={() => {setSortBy('name'); setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')}}
                  className={`px-3 py-2 ${sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  onClick={() => {setSortBy('email'); setSortOrder(sortBy === 'email' && sortOrder === 'asc' ? 'desc' : 'asc')}}
                  className={`px-3 py-2 ${sortBy === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                >
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button 
                  onClick={() => {setSortBy('date'); setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc')}}
                  className={`px-3 py-2 ${sortBy === 'date' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                >
                  Date Added {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow">
              {filterText ? (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.5 15.5l5 5" />
                    <circle cx="10" cy="10" r="7.5" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No suppliers found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
                </>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No suppliers added yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first supplier.</p>
                  <button
                    onClick={() => openAddModal()}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Supplier
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredSuppliers.map(supplier => (
              <div key={supplier._id} className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${supplier.active ? 'border-green-500' : 'border-yellow-500'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <div className="relative group">
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                        <div className="py-1">
                          <button
                            onClick={() => openAddModal(supplier)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDetailModal(supplier)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier._id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <div className="flex items-center mb-1">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {supplier.email}
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center mb-1">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.contactPerson && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {supplier.contactPerson}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${supplier.active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {supplier.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button
                      onClick={() => openDetailModal(supplier)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Name*</label>
                  <input 
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    className={`mt-1 block w-full border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email*</label>
                  <input 
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                    className={`mt-1 block w-full border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input 
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                  <input 
                    type="text"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea 
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea 
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                
                {selectedSupplier && (
                  <div>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={newSupplier.active !== false}
                        onChange={(e) => setNewSupplier({...newSupplier, active: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active Supplier</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSupplier}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${selectedSupplier.active !== false ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {selectedSupplier.name}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500 text-sm">Email:</span>
                      <p className="font-medium">{selectedSupplier.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Phone:</span>
                      <p className="font-medium">{selectedSupplier.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Contact Person:</span>
                      <p className="font-medium">{selectedSupplier.contactPerson || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Address</h4>
                  <p className="font-medium">
                    {selectedSupplier.address || 'No address provided'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Account Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500 text-sm">Status:</span>
                      <p className={`font-medium ${selectedSupplier.active !== false ? 'text-green-600' : 'text-yellow-600'}`}>
                        {selectedSupplier.active !== false ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Created:</span>
                      <p className="font-medium">
                        {new Date(selectedSupplier.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedSupplier.notes && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSupplier.notes}</p>
                  </div>
                </div>
              )}
              
              <h4 className="text-sm font-medium text-gray-700 mb-2">Products Supplied</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {loadingProducts ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                  </div>
                ) : supplierProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No products associated with this supplier.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {supplierProducts.map((product) => (
                          <tr key={product._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">{product.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{product.category}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{product.quantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.quantity === 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : product.quantity <= product.reorderThreshold
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {product.quantity === 0 
                                  ? 'Out of Stock' 
                                  : product.quantity <= product.reorderThreshold 
                                    ? 'Low Stock' 
                                    : 'In Stock'}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <Link to={`/admin/camping-equipment`} className="text-blue-600 hover:text-blue-900">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  openAddModal(selectedSupplier);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Supplier
              </button>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSuppliers;
