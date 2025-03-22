import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Fetch public events from the API
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/events/public');
        if (response.data.success && response.data.events) {
          setFeaturedEvents(response.data.events);
        } else {
          // Fallback to sample data if API returns no events
          setFeaturedEvents([
            {
              _id: 1,
              title: 'Tech Conference 2023',
              date: new Date('2023-10-15'),
              location: 'San Francisco, CA',
              image: 'https://via.placeholder.com/300x200?text=Tech+Conference',
              category: 'Technology',
              isApproved: true
            },
            {
              _id: 2,
              title: 'Music Festival',
              date: new Date('2023-11-05'),
              location: 'Austin, TX',
              image: 'https://via.placeholder.com/300x200?text=Music+Festival',
              category: 'Entertainment',
              isApproved: true
            },
            {
              _id: 3,
              title: 'Business Summit',
              date: new Date('2023-12-10'),
              location: 'New York, NY',
              image: 'https://via.placeholder.com/300x200?text=Business+Summit',
              category: 'Business',
              isApproved: true
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // Set fallback data
        setFeaturedEvents([
          {
            _id: 1,
            title: 'Tech Conference 2023',
            date: new Date('2023-10-15'),
            location: 'San Francisco, CA',
            image: 'https://via.placeholder.com/300x200?text=Tech+Conference',
            category: 'Technology',
            isApproved: true
          },
          {
            _id: 2,
            title: 'Music Festival',
            date: new Date('2023-11-05'),
            location: 'Austin, TX',
            image: 'https://via.placeholder.com/300x200?text=Music+Festival',
            category: 'Entertainment',
            isApproved: true
          },
          {
            _id: 3,
            title: 'Business Summit',
            date: new Date('2023-12-10'),
            location: 'New York, NY',
            image: 'https://via.placeholder.com/300x200?text=Business+Summit',
            category: 'Business',
            isApproved: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // When featuredEvents or searchTerm changes, update the filtered events
    if (searchTerm.trim() === '') {
      setFilteredEvents(featuredEvents);
    } else {
      const filtered = featuredEvents.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [featuredEvents, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The filtering happens automatically in the useEffect above
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getImageUrl = (imagePath) => {
    // If image path starts with 'http', it's already a full URL
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      return imagePath;
    }

    // If image path starts with '/uploads', prepend with backend URL
    if (imagePath && imagePath.startsWith('/uploads')) {
      return `http://localhost:5001${imagePath}`;
    }

    // Return default image
    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
  };

  const categories = [
    'Technology', 'Business', 'Entertainment', 'Sports',
    'Education', 'Culinary', 'Arts', 'Health'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center text-white py-20 px-4"
        style={{ backgroundImage: "url('img2.jpeg')" }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Discover Amazing Events & Gear</h1>
          <p className="text-xl mb-8">Find and book travel experiences and get the equipment you need</p>
          <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto mb-8 flex">
            <input
              type="text"
              placeholder="Search events..."
              className="flex-1 p-3 rounded-l-md focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-r-md"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/tour-details" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition">Tour Plans</Link>
            <Link to="/camping-equipment" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition">Camping Equipment</Link>
           
          </div>
        </div>
      </section>

      {/* Featured Events */}
     


      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Find Tour</h3>
              <p className="text-gray-600">Discover events matching your interests</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Register</h3>
              <p className="text-gray-600">Quick registration with few clicks</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Attend</h3>
              <p className="text-gray-600">Get tickets and enjoy the event</p>
            </div>
          </div>
        </div>
      </section>

     

      {/* New Camping Equipment Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Shop Camping Equipment</h2>
          <p className="text-xl mb-8">Find all the gear you need for your next adventure</p>
          <Link to="/camping-equipment" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition inline-block">
            View Equipment
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
