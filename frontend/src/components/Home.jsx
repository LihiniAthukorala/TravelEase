import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [featuredTours, setFeaturedTours] = useState([]);
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

    // Fetch featured tours
    const fetchTours = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/tours');
        if (response.data && response.data.length > 0) {
          setFeaturedTours(response.data.slice(0, 3)); // Get first 3 tours
        } else {
          // Fallback data
          setFeaturedTours([
            {
              _id: '1',
              name: 'Mountains Exploration',
              location: 'Swiss Alps',
              price: 1200,
              duration: 7,
              image: 'https://via.placeholder.com/300x200?text=Mountain+Tour'
            },
            {
              _id: '2',
              name: 'Beach Paradise',
              location: 'Maldives',
              price: 1500,
              duration: 5,
              image: 'https://via.placeholder.com/300x200?text=Beach+Tour'
            },
            {
              _id: '3',
              name: 'City Adventure',
              location: 'Paris, France',
              price: 900,
              duration: 4,
              image: 'https://via.placeholder.com/300x200?text=City+Tour'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching tours:', error);
        // Set fallback data in case of error
        setFeaturedTours([
          {
            _id: '1',
            name: 'Mountains Exploration',
            location: 'Swiss Alps',
            price: 1200,
            duration: 7,
            image: 'https://via.placeholder.com/300x200?text=Mountain+Tour'
          },
          {
            _id: '2',
            name: 'Beach Paradise',
            location: 'Maldives',
            price: 1500,
            duration: 5,
            image: 'https://via.placeholder.com/300x200?text=Beach+Tour'
          },
          {
            _id: '3',
            name: 'City Adventure',
            location: 'Paris, France',
            price: 900,
            duration: 4,
            image: 'https://via.placeholder.com/300x200?text=City+Tour'
          }
        ]);
      }
    };

    // Execute both fetch functions
    fetchEvents();
    fetchTours();
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

  const getTourImageUrl = (imagePath) => {
    // If image path starts with 'http', it's already a full URL
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      return imagePath;
    }

    // If image is a path on server, prepend with backend URL
    if (imagePath) {
      return `http://localhost:5001/${imagePath}`;
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
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fHx8fHx8&auto=format&fit=crop&w=1920&q=80')" }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Discover Amazing Travel Planning</h1>
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
            <Link to="/tours" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition">Tour Plans</Link>
            <Link to="/camping-equipment" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition">Camping Equipment</Link>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Tours</h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : featuredTours.length === 0 ? (
            <p className="text-center text-gray-500">No tours available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredTours.map((tour) => (
                <div key={tour._id} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
                  <div className="relative h-48">
                    <img
                      src={getTourImageUrl(tour.image)}
                      alt={tour.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                    <div className="absolute top-0 right-0 p-2 bg-blue-600 text-white rounded-bl-lg">
                      ${tour.price}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                    <div className="flex items-center mb-4">
                      <div className="flex items-center text-gray-600">
                        <i className="fas fa-calendar-alt mr-2"></i>
                        <span>{tour.duration} days</span>
                      </div>
                      <div className="flex items-center text-gray-600 ml-6">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        <span>{tour.location}</span>
                      </div>
                    </div>
                    <Link
                      to={`/tours/${tour._id}`}
                      className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-10">
            <Link to="/tours" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition">
              View All Tours
            </Link>
          </div>
        </div>
      </section>

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
