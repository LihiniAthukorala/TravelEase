import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function InventoryReports() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 6)));
  const [endDate, setEndDate] = useState(new Date());
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

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

  const fetchInventoryStats = async (token) => {
    try {
      const response = await axios.get('http://localhost:5001/api/inventory/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStatsData(response.data.stats);
      } else {
        enqueueSnackbar('Failed to fetch inventory statistics', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      enqueueSnackbar('Error loading inventory data', { variant: 'error' });
    }
  };

  const fetchTrendingProducts = async (token) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/inventory/trending?category=${selectedCategory}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTrendingProducts(response.data.trendingProducts);
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleDateRangeChange = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSeasonalPatterns(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // Prepare data for category distribution chart
  const categoryData = statsData?.categoryBreakdown ? 
    Object.keys(statsData.categoryBreakdown).map((key, index) => ({
      name: key,
      value: statsData.categoryBreakdown[key].quantity,
      color: COLORS[index % COLORS.length]
    })) : [];

  // Prepare data for status distribution chart
  const statusData = statsData?.statusBreakdown ?
    Object.keys(statsData.statusBreakdown).map((key, index) => ({
      name: key,
      value: statsData.statusBreakdown[key].count,
      color: COLORS[index % COLORS.length]
    })) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-gray-400 text-sm">Online Tourism and Travel Management System</p>
        </div>
        <nav className="mt-5">
          <Link to="/admin-dashboard" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
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
          <Link to="/admin/stock-tracking" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Stock Tracking</span>
          </Link>
          <Link to="/admin/camping-equipment" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-gray-100">
            <span className="ml-3">Camping Equipment</span>
          </Link>
          <Link to="/admin/inventory-reports" className="flex items-center px-6 py-3 bg-gray-800 text-gray-100">
            <span className="ml-3">Inventory Reports</span>
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
          <h1 className="text-3xl font-bold">Inventory Reports</h1>
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg p-4 mb-8">
          <div className="flex border-b">
            <button 
              className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'trending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('trending')}
            >
              Trending Products
            </button>
            <button 
              className={`px-4 py-2 ${activeTab === 'seasonal' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('seasonal')}
            >
              Seasonal Patterns
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Inventory Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Equipment</h3>
                <p className="text-3xl font-bold">{statsData?.totalEquipment || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Items in Stock</h3>
                <p className="text-3xl font-bold">{statsData?.totalQuantity || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Inventory Value</h3>
                <p className="text-3xl font-bold">LKR {statsData?.totalValue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-medium mb-4">Low Stock Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
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

        {/* Generate Report Button */}
        <div className="flex justify-end mt-8">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Generate PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryReports;
