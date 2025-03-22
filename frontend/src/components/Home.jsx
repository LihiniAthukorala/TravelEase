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
          <h1 className="text-5xl font-bold mb-4">Discover Amazing Events</h1>
          <p className="text-xl mb-8">Find and manage the perfect events for every occasion</p>
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
            <Link to="/events" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition">Browse Events</Link>
            <Link
              to={isAuthenticated ? "/create-event" : "/login"}
              className="px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-md hover:bg-white hover:bg-opacity-10 transition"
            >
              {isAuthenticated ? "Create Event" : "Login to Create Event"}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {searchTerm ? `Search Results: "${searchTerm}"` : "Featured Events"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p className="col-span-full text-center text-gray-500">Loading events...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="col-span-full text-center text-gray-500">
                {searchTerm ? `No events found matching "${searchTerm}"` : "No events available"}
              </p>
            ) : (
              filteredEvents.map(event => (
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105" key={event._id}>
                  <div className="relative">
                    <img
                      src={getImageUrl(event.image)}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                      onError={handleImageError}
                    />
                    <span className="absolute top-4 left-4 bg-blue-500 text-white text-sm py-1 px-3 rounded-full">{event.category}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-1"><span className="font-medium">Date:</span> {formatDate(event.date)}</p>
                    <p className="text-gray-600 mb-4"><span className="font-medium">Location:</span> {event.location}</p>
                    <Link
                      to={`/events/${event._id}`}
                      className="block text-center py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          {isAuthenticated && (
            <div className="text-center mt-10">
              <Link to="/my-events" className="text-blue-600 font-medium hover:underline">View My Events →</Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Event Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link
                to={isAuthenticated ? `/category/${category.toLowerCase()}` : "/login"}
                className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition"
                key={index}
              >
                <span className="font-medium text-gray-800">{category}</span>
              </Link>
            ))}
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
              <h3 className="text-xl font-semibold mb-2">Find Events</h3>
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

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to host your own event?</h2>
          <p className="text-xl mb-8">Create and manage events easily with our platform</p>
          <Link
            to={isAuthenticated ? "/create-event" : "/login"}
            className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-md hover:bg-gray-100 transition inline-block mr-4"
          >
            {isAuthenticated ? "Get Started" : "Login to Get Started"}
          </Link>
          <Link to="/feedbackview" className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-md hover:bg-gray-100 transition inline-block">Testimonial</Link>

        </div>
      </section>
    </div>
  );
};

export default Home;
