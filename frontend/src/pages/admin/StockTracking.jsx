import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';

function StockTracking() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reorderThreshold, setReorderThreshold] = useState(5);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState({});
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [reorderQuantity, setReorderQuantity] = useState(10);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
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
        
        // Fetch stock data after admin authentication
        fetchStockData(token);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        enqueueSnackbar('Failed to load admin data. Please login again.', { variant: 'error' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };
    
    fetchAdminData();
  }, [navigate, enqueueSnackbar]);

  const fetchStockData = async (token) => {
    try {
      // Fetch camping equipment data - this represents our stock items
      const response = await axios.get('http://localhost:5001/api/camping-equipment', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const equipmentData = response.data.equipment || [];
        setProducts(equipmentData);
        
        // Generate stock alerts for items with low quantity
        const alerts = equipmentData
          .filter(item => item.quantity < reorderThreshold) // Items below threshold
          .map(item => ({
            id: item._id,
            name: item.name,
            quantity: item.quantity,
            status: item.quantity === 0 ? 'Out of Stock' : 'Low Stock'
          }));
        
        setStockAlerts(alerts);
        
        // Show notifications for low stock if enabled
        if (notificationsEnabled && alerts.length > 0) {
          showStockNotifications(alerts);
        }
        
        // Check for auto-reordering if enabled
        if (autoReorderEnabled) {
          checkAndProcessAutoReorders(alerts);
        }
      } else {
        enqueueSnackbar('Failed to load stock data', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      enqueueSnackbar('Failed to load stock data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers from the backend
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setSupplierLoading(true);
      const response = await axios.get('http://localhost:5001/api/suppliers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuppliers(response.data.suppliers);
      } else {
        enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      enqueueSnackbar('Failed to load suppliers', { variant: 'error' });
    } finally {
      setSupplierLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSuppliers();
    }
  }, []);

  // Filter products based on selected supplier
  useEffect(() => {
    if (filterSupplier === 'all') {
      setFilteredProducts(products);
    } else {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Fetch products for selected supplier
      const fetchSupplierProducts = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/suppliers/${filterSupplier}/products`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            // Get the product IDs from supplier products
            const supplierProductIds = response.data.products.map(p => p._id);
            // Filter the main products array to only include these IDs
            const filtered = products.filter(product => supplierProductIds.includes(product._id));
            setFilteredProducts(filtered);
          } else {
            enqueueSnackbar('Failed to load supplier products', { variant: 'error' });
            setFilteredProducts([]);
          }
        } catch (error) {
          console.error('Error fetching supplier products:', error);
          enqueueSnackbar('Failed to load supplier products', { variant: 'error' });
          setFilteredProducts([]);
        }
      };
      
      fetchSupplierProducts();
    }
  }, [filterSupplier, products]);

  // Show browser notifications for low stock
  const showStockNotifications = (alerts) => {
    // Check if browser notifications are supported and enabled
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        alerts.forEach(alert => {
          new Notification(`Stock Alert: ${alert.name}`, {
            body: `${alert.status}: Only ${alert.quantity} units remaining`,
            icon: '/logo.png'
          });
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            showStockNotifications(alerts);
          }
        });
      }
    }
    
    // Also show in-app notifications
    alerts.forEach(alert => {
      enqueueSnackbar(`${alert.status}: ${alert.name} - ${alert.quantity} units remaining`, { 
        variant: alert.quantity === 0 ? 'error' : 'warning',
        autoHideDuration: 5000
      });
    });
  };

  // Enable browser notifications
  const enableNotifications = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
          enqueueSnackbar('Stock notifications enabled', { variant: 'success' });
        } else {
          enqueueSnackbar('Notification permission denied', { variant: 'error' });
        }
      });
    } else {
      enqueueSnackbar('Browser notifications not supported', { variant: 'error' });
    }
  };

  // Process automatic reordering
  const checkAndProcessAutoReorders = (alerts) => {
    alerts.forEach(alert => {
      // In a real application, you would check if this item is configured for auto-reorder
      // and has a designated supplier
      
      if (alert.quantity === 0) {
        // Auto reorder out-of-stock items
        placeAutomaticOrder(alert.id, alert.name);
      }
    });
  };

  // Place an automatic order with a supplier
  const placeAutomaticOrder = (productId, productName) => {
    // This is a mock function - in real implementation, you would call your API
    // to create an order with the supplier
    
    enqueueSnackbar(`Automatic reorder placed for ${productName}`, { 
      variant: 'info',
      autoHideDuration: 5000
    });
    
    // In a real app, you would make an API call:
    // axios.post('http://localhost:5001/api/supplier/order', {
    //   productId,
    //   supplierId: designatedSupplier,
    //   quantity: reorderQuantity
    // }, { headers: { Authorization: `Bearer ${token}` } })
  };

  // Handle showing the supplier modal for a product
  const openSupplierModal = (product) => {
    setSelectedProduct(product);
    setShowSupplierModal(true);
  };

  // Handle showing the reorder configuration modal
  const openReorderModal = (product) => {
    setSelectedProduct(product);
    setShowReorderModal(true);
  };

  // Handle saving a new supplier
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

      const response = await axios.post('http://localhost:5001/api/suppliers', newSupplier, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        enqueueSnackbar('Supplier added successfully', { variant: 'success' });
        setNewSupplier({ name: '', email: '', phone: '', address: '' });
        setFormErrors({});
        fetchSuppliers(); // Refresh the suppliers list
      } else {
        enqueueSnackbar(response.data.message || 'Failed to add supplier', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to add supplier', { variant: 'error' });
    }
  };

  // Handle deleting a supplier
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
        fetchSuppliers(); // Refresh the suppliers list
      } else {
        enqueueSnackbar(response.data.message || 'Failed to delete supplier', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete supplier', { variant: 'error' });
    }
  };

  // Place an order with a supplier
  const handlePlaceOrder = async (supplierId, supplierName) => {
    if (!selectedProduct) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const orderData = {
        supplierId,
        orderedItems: [{
          equipmentId: selectedProduct._id,
          quantity: reorderQuantity || 10,
        }],
        notes: `Reorder for ${selectedProduct.name}`
      };

      const response = await axios.post('http://localhost:5001/api/stock-orders', orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        enqueueSnackbar(`Order placed with ${supplierName}`, { variant: 'success' });
        setShowSupplierModal(false);
      } else {
        enqueueSnackbar(response.data.message || 'Failed to place order', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to place order', { variant: 'error' });
    }
  };

  // Handle saving reorder configuration
  const saveReorderConfig = async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Create config data
      const configData = {
        equipmentId: product._id,
        threshold: reorderThreshold,
        reorderQuantity: reorderQuantity,
        autoReorder: autoReorderEnabled,
        preferredSupplier: selectedSupplier || null
      };

      const response = await axios.post(
        'http://localhost:5001/api/inventory/reorder-config',
        configData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        enqueueSnackbar('Reorder configuration saved', { variant: 'success' });
        setShowReorderModal(false);
      } else {
        enqueueSnackbar(response.data.message || 'Failed to save configuration', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error saving reorder configuration:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save configuration', { variant: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login';
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

  // Send email alerts to suppliers about low stock
  const sendLowStockAlerts = async () => {
    if (stockAlerts.length === 0) {
      enqueueSnackbar('No low stock items to report', { variant: 'info' });
      return;
    }

    setShowEmailConfirmModal(true);
  };

  // Confirm and send emails to suppliers
  const confirmAndSendEmails = async () => {
    try {
      setSendingEmails(true);
      setShowEmailConfirmModal(false);
      
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get low stock products with their details
      const lowStockItems = stockAlerts.map(alert => {
        const product = products.find(p => p._id === alert.id);
        return {
          id: alert.id,
          name: alert.name,
          quantity: alert.quantity,
          status: alert.status,
          supplierInfo: product?.preferredSupplier || null
        };
      });

      const response = await axios.post(
        'http://localhost:5001/api/suppliers/send-low-stock-alerts', 
        { items: lowStockItems },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        enqueueSnackbar(`Successfully sent ${response.data.sentCount} stock alerts to suppliers`, { 
          variant: 'success',
          autoHideDuration: 5000
        });
      } else {
        enqueueSnackbar(response.data.message || 'Failed to send stock alerts', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error sending stock alerts:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to send stock alerts to suppliers', { variant: 'error' });
    } finally {
      setSendingEmails(false);
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
          <h1 className="text-3xl font-bold">Real-Time Stock Tracking</h1>
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

        {/* Notification and Auto-Reorder Controls */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium">Stock Management Controls</h3>
          </div>
          <div className="p-6 flex flex-wrap gap-4">
            <div>
              <button 
                onClick={enableNotifications}
                className={`px-4 py-2 rounded-lg ${notificationsEnabled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`} 
                disabled={notificationsEnabled}
              >
                {notificationsEnabled ? '✓ Notifications Enabled' : 'Enable Stock Notifications'}
              </button>
            </div>
            <div>
              <button 
                onClick={() => setAutoReorderEnabled(!autoReorderEnabled)}
                className={`px-4 py-2 rounded-lg ${autoReorderEnabled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {autoReorderEnabled ? '✓ Auto-Reorder Enabled' : 'Enable Auto-Reorder'}
              </button>
            </div>
            <div>
              <button 
                onClick={sendLowStockAlerts}
                disabled={sendingEmails || stockAlerts.length === 0}
                className={`px-4 py-2 rounded-lg ${
                  sendingEmails 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {sendingEmails ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Alerts...
                  </span>
                ) : `Send Low Stock Alerts (${stockAlerts.length})`}
              </button>
            </div>
            <div>
              <Link
                to="/admin/manage-suppliers"
                className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Manage Suppliers
              </Link>
            </div>
            <div className="flex items-center ml-auto">
              <label htmlFor="threshold" className="mr-2 text-gray-700">Reorder Threshold:</label>
              <input 
                id="threshold"
                type="number"
                min="1"
                max="100"
                value={reorderThreshold} 
                onChange={(e) => setReorderThreshold(parseInt(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center">
              <label htmlFor="supplierFilter" className="mr-2 text-gray-700">Filter by Supplier:</label>
              <select 
                id="supplierFilter"
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-red-600">Stock Alerts</h3>
          </div>
          <div className="p-6">
            {stockAlerts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No stock alerts. Inventory levels are good.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stockAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`border rounded-lg p-4 ${
                      alert.status === 'Out of Stock' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="font-semibold">{alert.name}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm ${alert.status === 'Out of Stock' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {alert.status}
                      </span>
                      <span className="font-bold">{alert.quantity} units</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-end space-x-2">
                      <button
                        onClick={() => openReorderModal(products.find(p => p._id === alert.id))}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        Set Reorder
                      </button>
                      <button
                        onClick={() => openSupplierModal(products.find(p => p._id === alert.id))}
                        className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Stock Levels */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Current Stock Inventory</h3>
            <Link to="/admin/camping-equipment" className="text-blue-500 hover:text-blue-700">
              Manage Equipment
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-sm object-cover" 
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            onError={(e) => e.target.src = '/images/default-equipment.jpg'} 
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"> 
                      <div className="text-sm text-gray-900">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">LKR {product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : product.quantity < reorderThreshold
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {product.quantity === 0 
                          ? 'Out of Stock' 
                          : product.quantity < reorderThreshold 
                            ? 'Low Stock' 
                            : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => openReorderModal(product)}
                        className="mr-2 text-blue-600 hover:text-blue-800"
                      >
                        Set Reorder
                      </button>
                      <button
                        onClick={() => openSupplierModal(product)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supplier Management Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {selectedProduct ? `Order ${selectedProduct.name}` : 'Manage Suppliers'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {selectedProduct ? (
                <div>
                  <h4 className="font-medium mb-4">Select a supplier to place an order</h4>
                  {supplierLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No suppliers available. Please add a supplier first.</div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Quantity</label>
                        <input 
                          type="number"
                          min="1"
                          value={reorderQuantity}
                          onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 1)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {suppliers.map(supplier => (
                          <div key={supplier._id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.email}</div>
                            <div className="text-sm text-gray-500">{supplier.phone}</div>
                            <div className="mt-2 flex justify-end">
                              <button 
                                onClick={() => handlePlaceOrder(supplier._id, supplier.name)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Place Order
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-medium mb-4">Add New Supplier</h4>
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
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <textarea 
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        rows="2"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={handleSaveSupplier}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add Supplier
                      </button>
                    </div>
                  </div>
                  <h4 className="font-medium mt-8 mb-4">Existing Suppliers</h4>
                  {supplierLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No suppliers available</div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {suppliers.map(supplier => (
                        <div key={supplier._id} className="border rounded-lg p-4 flex justify-between items-start">
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-gray-500">{supplier.email}</div>
                            <div className="text-sm text-gray-500">{supplier.phone}</div>
                            <div className="text-sm text-gray-500">{supplier.address}</div>
                          </div>
                          <button 
                            onClick={() => handleDeleteSupplier(supplier._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder Configuration Modal */}
      {showReorderModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Auto-Reorder Configuration</h3>
              <button onClick={() => setShowReorderModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium mb-2">Product: {selectedProduct.name}</h4>
                <p className="text-sm text-gray-500">Current quantity: {selectedProduct.quantity} units</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reorder Threshold</label>
                  <p className="text-xs text-gray-500 mb-1">Order will be placed automatically when stock falls below this level</p>
                  <input 
                    type="number" 
                    min="1"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(parseInt(e.target.value))} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={autoReorderEnabled}
                      onChange={(e) => setAutoReorderEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable automatic reordering</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Supplier</label>
                  <select 
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reorder Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    value={reorderQuantity}
                    onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 1)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
              <button 
                onClick={() => setShowReorderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => saveReorderConfig(selectedProduct)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {showEmailConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Confirm Email Alerts</h3>
              <button onClick={() => setShowEmailConfirmModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700">
                  You are about to send low stock email alerts to suppliers for {stockAlerts.length} items.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  This will notify suppliers about items that are running low or out of stock.
                </p>
              </div>
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Make sure all supplier contact information is up to date.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowEmailConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAndSendEmails}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockTracking;