import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useReactToPrint } from 'react-to-print';
import { CSVLink } from 'react-csv';

// Add print styles
const printStyles = `
  @media print {
    @page {
      margin: 1.5cm;
      size: A4;
    }

    body {
      background: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #1a1a1a;
    }

    .no-print {
      display: none !important;
    }

    .print-only {
      display: block !important;
    }

    .page-break {
      page-break-after: always;
    }

    .page-break-before {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Modern Typography */
    h1, h2, h3, h4, h5, h6 {
      color: #1a1a1a;
      font-weight: 600;
      margin-bottom: 0.75em;
    }

    h1 {
      font-size: 2em;
      letter-spacing: -0.025em;
    }

    h2 {
      font-size: 1.5em;
      letter-spacing: -0.025em;
    }

    h3 {
      font-size: 1.25em;
    }

    /* Modern Card Styling */
    .bg-white {
      background-color: white !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 0.5rem !important;
      padding: 1.5rem !important;
      margin-bottom: 1.5rem !important;
    }

    .shadow {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    }

    /* Modern Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }

    th {
      background-color: #f8fafc !important;
      color: #1a1a1a !important;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 0.75rem 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:last-child td {
      border-bottom: none;
    }

    /* Modern Status Badges */
    .bg-red-100 {
      background-color: #fee2e2 !important;
      color: #991b1b !important;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .bg-yellow-100 {
      background-color: #fef3c7 !important;
      color: #92400e !important;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Modern Grid Layout */
    .grid {
      display: grid;
      gap: 1.5rem;
    }

    .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    /* Modern Stats Cards */
    .text-3xl {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 0.5rem;
    }

    .text-gray-500 {
      color: #64748b !important;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Modern Chart Containers */
    .h-64 {
      height: 16rem;
      margin-bottom: 1.5rem;
    }

    /* Print Header */
    .print-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .print-header h1 {
      margin-bottom: 0.5rem;
    }

    .print-header p {
      color: #64748b;
      font-size: 0.875rem;
    }

    /* Modern Colors */
    .text-blue-800 { color: #1e40af !important; }
    .text-red-800 { color: #991b1b !important; }
    .text-yellow-800 { color: #92400e !important; }
    .bg-blue-100 { background-color: #dbeafe !important; }
    .bg-red-100 { background-color: #fee2e2 !important; }
    .bg-yellow-100 { background-color: #fef3c7 !important; }
    .bg-gray-50 { background-color: #f8fafc !important; }
  }
`;

function InventoryReports() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState([]);
  const [valueHistory, setValueHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6)));
  const [endDate, setEndDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [totalItems, setTotalItems] = useState(0);
  const [totalEquipment, setTotalEquipment] = useState(0);
  const [campingEquipment, setCampingEquipment] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const printRef = useRef();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
        
        // Fetch inventory stats data
        await fetchInventoryStats(token);
        await fetchTrendingProducts(token);
        await fetchSeasonalPatterns(token);
        await fetchValueHistory(token);
        await fetchTotalItems(token);
        await fetchCampingEquipment(token);
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

  // Update category and status data when statsData changes
  useEffect(() => {
    if (statsData?.categoryBreakdown) {
      const newCategoryData = Object.keys(statsData.categoryBreakdown).map((key, index) => ({
        name: key,
        value: statsData.categoryBreakdown[key].quantity,
        color: COLORS[index % COLORS.length]
      }));
      setCategoryData(newCategoryData);
    }

    if (statsData?.statusBreakdown) {
      const newStatusData = Object.keys(statsData.statusBreakdown).map((key, index) => ({
        name: key,
        value: statsData.statusBreakdown[key].count,
        color: COLORS[index % COLORS.length]
      }));
      setStatusData(newStatusData);
    }
  }, [statsData]);

  const fetchInventoryStats = async (token) => {
    try {
      setLoading(true); // Make sure loading state is set
      console.log('Fetching inventory stats...');
      
      const response = await axios.get('http://localhost:5001/api/inventory/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Stats response:', response.data);
      
      if (response.data.success) {
        setStatsData(response.data.stats);
      } else {
        enqueueSnackbar('Failed to fetch inventory statistics', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      enqueueSnackbar(`Error loading inventory data: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingProducts = async (token) => {
    try {
      console.log('Fetching trending products...');
      
      const response = await axios.get(`http://localhost:5001/api/inventory/trending?category=${selectedCategory}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Trending products response:', response.data);
      
      if (response.data.success) {
        setTrendingProducts(response.data.trendingProducts);
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      // Don't show a snackbar as this is not critical
    }
  };

  const fetchSeasonalPatterns = async (token) => {
    try {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        `http://localhost:5001/api/inventory/seasonal?category=${selectedCategory}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSeasonalPatterns(response.data.seasonalData);
      }
    } catch (error) {
      console.error('Error fetching seasonal patterns:', error);
    }
  };

  const fetchValueHistory = async (token) => {
    try {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const response = await axios.get(
        `http://localhost:5001/api/inventory/value-history?startDate=${formattedStartDate}&endDate=${formattedEndDate}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setValueHistory(response.data.inventoryHistory.map(item => ({
          ...item,
          value: parseFloat(item.value.toFixed(2))
        })));
      }
    } catch (error) {
      console.error('Error fetching inventory value history:', error);
    }
  };

  const fetchTotalItems = async (token) => {
    try {
      const response = await axios.get('http://localhost:5001/api/camping-equipment', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setCampingEquipment(response.data.equipment);
        
        // Calculate total equipment (number of unique items)
        setTotalEquipment(response.data.equipment.length);
        
        // Calculate total items in stock (sum of all quantities)
        const totalQuantity = response.data.equipment.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setTotalItems(totalQuantity);
      }
    } catch (error) {
      console.error('Error fetching camping equipment:', error);
      enqueueSnackbar('Failed to fetch camping equipment data', { variant: 'error' });
    }
  };

  const fetchCampingEquipment = async (token) => {
    try {
      const response = await axios.get('http://localhost:5001/api/camping-equipment', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setCampingEquipment(response.data.equipment);
        
        // Calculate total equipment (number of unique items)
        setTotalEquipment(response.data.equipment.length);
        
        // Calculate total items in stock (sum of all quantities)
        const totalQuantity = response.data.equipment.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setTotalItems(totalQuantity);

        // Calculate category and status distributions
        calculateDistributions(response.data.equipment);
      }
    } catch (error) {
      console.error('Error fetching camping equipment:', error);
      enqueueSnackbar('Failed to fetch camping equipment data', { variant: 'error' });
    }
  };

  const calculateDistributions = (equipment) => {
    // Calculate Category Distribution
    const categoryCounts = equipment.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categoryChartData = Object.entries(categoryCounts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

    setCategoryData(categoryChartData);

    // Calculate Status Distribution
    const statusCounts = equipment.reduce((acc, item) => {
      let status = 'In Stock';
      if (item.quantity === 0) {
        status = 'Out of Stock';
      } else if (item.quantity < 5) {
        status = 'Low Stock';
      }
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusCounts).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

    setStatusData(statusChartData);
  };

  // Update distributions when camping equipment changes
  useEffect(() => {
    if (campingEquipment.length > 0) {
      calculateDistributions(campingEquipment);
    }
  }, [campingEquipment]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleDateRangeChange = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSeasonalPatterns(token);
      fetchValueHistory(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login';
  };

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await Promise.all([
        fetchInventoryStats(token),
        fetchTrendingProducts(token),
        fetchSeasonalPatterns(token),
        fetchValueHistory(token)
      ]);
      
      enqueueSnackbar('Data refreshed successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      enqueueSnackbar('Failed to refresh data', { variant: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Inventory Report",
    onBeforeGetContent: () => {
      // Add print styles to the document
      const style = document.createElement('style');
      style.innerHTML = printStyles;
      document.head.appendChild(style);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      // Remove print styles after printing
      const style = document.querySelector('style[data-print-styles]');
      if (style) style.remove();
      enqueueSnackbar('PDF generated successfully', { variant: 'success' });
    },
    onPrintError: () => {
      enqueueSnackbar('Failed to generate PDF', { variant: 'error' });
    }
  });

  const generateCSVData = () => {
    if (activeTab === 'overview' && statsData?.lowStockItems) {
      return {
        filename: 'low-stock-items.csv',
        data: statsData.lowStockItems.map(item => ({
          Name: item.name,
          Category: item.category,
          Quantity: item.quantity,
          Status: item.quantity === 0 ? 'Out of Stock' : 'Low Stock',
          Value: (item.price * item.quantity).toFixed(2)
        }))
      };
    } else if (activeTab === 'trending') {
      return {
        filename: 'trending-products.csv',
        data: trendingProducts.map(product => ({
          Product: product.name,
          Category: product.category,
          'Rental Count': product.rentCount,
          'Revenue (LKR)': product.revenue.toFixed(2)
        }))
      };
    } else if (activeTab === 'seasonal') {
      return {
        filename: 'seasonal-patterns.csv',
        data: seasonalPatterns.map(month => ({
          Month: month.month,
          Tents: month.tents,
          'Sleeping Bags': month.sleepingBags,
          'Cooking Equipment': month.cookingEquipment,
          Lighting: month.lighting,
          Hiking: month.hiking
        }))
      };
    } else if (activeTab === 'value') {
      return {
        filename: 'inventory-value-history.csv',
        data: valueHistory.map(item => ({
          Date: item.date,
          'Total Value (LKR)': item.value.toFixed(2)
        }))
      };
    }
    
    return { filename: 'inventory-report.csv', data: [] };
  };

  const csvData = generateCSVData();

  const getExportButton = () => {
    return (
      <div className="flex items-center space-x-2">
        <CSVLink 
          data={csvData.data} 
          filename={csvData.filename}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          target="_blank"
        >
          <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export CSV
        </CSVLink>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Generate PDF
        </button>
      </div>
    );
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
      {/* Add print styles */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
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
        <div className="flex justify-between items-center mb-8 no-print">
          <h1 className="text-3xl font-bold">Inventory Reports</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefreshData}
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg flex items-center ${refreshing ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
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

        {/* Print Header */}
        <div className="print-only print-header">
          <h1>Inventory Report</h1>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg p-4 mb-8 no-print">
          <div className="flex border-b overflow-x-auto">
            <button 
              className={`px-4 py-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </div>
        </div>

        <div ref={printRef} className="print-container">
          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <>
              {/* Inventory Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 avoid-break">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-500 text-sm font-medium">Total Equipment</h3>
                  <p className="text-3xl font-bold">{totalEquipment}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-500 text-sm font-medium">Total Items in Stock</h3>
                  <p className="text-3xl font-bold">{totalItems}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-500 text-sm font-medium">Total Inventory Value</h3>
                  <p className="text-3xl font-bold">LKR {statsData?.totalValue?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 avoid-break">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Low Stock Warning */}
              {statsData?.lowStockItems && statsData.lowStockItems.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 mb-8 avoid-break">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Low Stock Items</h3>
                    <Link 
                      to="/admin/stock-tracking" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <span>Manage Stock</span>
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statsData.lowStockItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">LKR {(item.price * item.quantity).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link 
                                to="/admin/stock-tracking"
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Order
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'trending' && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Trending Products</h3>
                <div>
                  <select 
                    value={selectedCategory} 
                    onChange={handleCategoryChange}
                    className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Tents">Tents</option>
                    <option value="Sleeping Bags">Sleeping Bags</option>
                    <option value="Cooking">Cooking Equipment</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Hiking">Hiking Gear</option>
                  </select>
                </div>
              </div>
              
              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendingProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rentCount" name="Rental Count" fill="#8884d8" />
                    <Bar dataKey="revenue" name="Revenue (LKR)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rental Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trendingProducts.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{product.rentCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">LKR {product.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'seasonal' && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                <h3 className="text-lg font-medium">Seasonal Demand Patterns</h3>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <select 
                      value={selectedCategory} 
                      onChange={handleCategoryChange}
                      className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="Tents">Tents</option>
                      <option value="Sleeping Bags">Sleeping Bags</option>
                      <option value="Cooking">Cooking Equipment</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Hiking">Hiking Gear</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DatePicker
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                      className="border border-gray-300 rounded-md py-2 px-4 w-32"
                    />
                    <span>to</span>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      className="border border-gray-300 rounded-md py-2 px-4 w-32"
                    />
                    <button 
                      onClick={handleDateRangeChange}
                      className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seasonalPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tents" name="Tents" stroke="#8884d8" />
                    <Line type="monotone" dataKey="sleepingBags" name="Sleeping Bags" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="cookingEquipment" name="Cooking" stroke="#ffc658" />
                    <Line type="monotone" dataKey="lighting" name="Lighting" stroke="#ff8042" />
                    <Line type="monotone" dataKey="hiking" name="Hiking" stroke="#0088fe" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleeping Bags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lighting</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiking</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {seasonalPatterns.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{month.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{month.tents}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{month.sleepingBags}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{month.cookingEquipment}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{month.lighting}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{month.hiking}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'value' && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                <h3 className="text-lg font-medium">Inventory Value History</h3>
                <div className="flex items-center space-x-2">
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    className="border border-gray-300 rounded-md py-2 px-4 w-32"
                  />
                  <span>to</span>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    className="border border-gray-300 rounded-md py-2 px-4 w-32"
                  />
                  <button 
                    onClick={handleDateRangeChange}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={valueHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `LKR ${value.toFixed(2)}`} />
                    <Legend />
                    <Area type="monotone" dataKey="value" name="Total Value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value (LKR)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {valueHistory.map((item, index) => {
                      const prevValue = index > 0 ? valueHistory[index - 1].value : item.value;
                      const change = item.value - prevValue;
                      const percentChange = prevValue !== 0 ? (change / prevValue * 100) : 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">LKR {item.value.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {index > 0 && (
                              <span className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change >= 0 ? (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percentChange.toFixed(2)}%)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="flex justify-end mt-8 space-x-4 mb-8 no-print">
          {getExportButton()}
        </div>
      </div>
    </div>
  );
}

export default InventoryReports;
