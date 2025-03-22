import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import CampingEquipmentCard from '../components/CampingEquipmentCard';

const CampingEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  
  const categories = ['All', 'Tents', 'Sleeping Bags', 'Cooking', 'Lighting', 'Hiking', 'Other'];

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/camping-equipment');
      
      if (response.data.success) {
        setEquipment(response.data.equipment);
      } else {
        enqueueSnackbar('Failed to load camping equipment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching camping equipment:', error);
      enqueueSnackbar('Error loading camping equipment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Filter equipment based on search term and category
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || selectedCategory === '' || 
                           item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Camping Equipment Store
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Discover high-quality camping gear for your next adventure
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search equipment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                category !== 'All' && <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Equipment Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-xl">
              No equipment found matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEquipment.map(item => (
              <CampingEquipmentCard key={item._id} equipment={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampingEquipment;
