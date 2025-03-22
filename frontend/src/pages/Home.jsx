import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch events
    setTimeout(() => {
      setFeaturedEvents([
        {
          id: 1,
          title: 'Tech Conference 2023',
          date: 'Oct 15, 2023',
          location: 'San Francisco, CA',
          image: 'https://via.placeholder.com/300x200?text=Tech+Conference',
          category: 'Technology'
        },
        {
          id: 2,
          title: 'Music Festival',
          date: 'Nov 5, 2023',
          location: 'Austin, TX',
          image: 'https://via.placeholder.com/300x200?text=Music+Festival',
          category: 'Entertainment'
        },
        {
          id: 3,
          title: 'Business Summit',
          date: 'Dec 10, 2023',
          location: 'New York, NY',
          image: 'https://via.placeholder.com/300x200?text=Business+Summit',
          category: 'Business'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    'Technology', 'Business', 'Entertainment', 'Sports', 
    'Education', 'Culinary', 'Arts', 'Health'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Discover Amazing Events</h1>
          <p className="text-xl mb-8">Find and manage the perfect events for every occasion</p>
          <div className="max-w-md mx-auto mb-8 flex">
            <input type="text" placeholder="Search events..." className="flex-1 p-3 rounded-l-md focus:outline-none" />
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-r-md">Search</button>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/events" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition">Browse Events</Link>
            <Link to="/create-event" className="px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-md hover:bg-white hover:bg-opacity-10 transition">Create Event</Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p className="col-span-full text-center text-gray-500">Loading events...</p>
            ) : (
              featuredEvents.map(event => (
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105" key={event.id}>
                  <div className="relative">
                    <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
                    <span className="absolute top-4 left-4 bg-blue-500 text-white text-sm py-1 px-3 rounded-full">{event.category}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-1"><span className="font-medium">Date:</span> {event.date}</p>
                    <p className="text-gray-600 mb-4"><span className="font-medium">Location:</span> {event.location}</p>
                    <Link to={`/event/${event.id}`} className="block text-center py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition">
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-10">
            <Link to="/events" className="text-blue-600 font-medium hover:underline">View All Events →</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Event Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link to={`/category/${category.toLowerCase()}`} className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition" key={index}>
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
          <Link to="/create-event" className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-md hover:bg-gray-100 transition inline-block">Get Started</Link>

        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-8">Subscribe to get notified about upcoming events</p>
          <div className="flex max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 p-3 rounded-l-md focus:outline-none" />
            <button className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-md px-6">Subscribe</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
