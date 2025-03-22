import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TravelPackages = () => {
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const response = await axios.get(
      "http://localhost:3000/api/travel-packages/"
    );
    setPackages(response.data);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gotorentalItems = async () => {
    navigate("/userproducts");
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-5">
      <h1 className="text-3xl font-semibold text-center text-gray-700 mb-8">
        Available Travel Packages
      </h1>
      {/* Search Bar */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search travel packages..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full max-w-lg px-4 py-2 border rounded-lg focus:outline-none"
        />

        <button
          onClick={() => gotorentalItems()}
          className="bg-blue-600 text-white px-6 py-3 ml-4 rounded-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Rental Items
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden transform transition hover:scale-105"
          >
            <img
              src={
                pkg.imageUrl || `https://picsum.photos/300/200?random=${pkg.id}`
              }
              alt={pkg.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold">{pkg.name}</h2>
              <p className="text-gray-600">{pkg.destination}</p>
              <p className="text-gray-800 font-bold">${pkg.price}</p>
              <p className="text-sm text-gray-500">
                Duration: {pkg.duration} days
              </p>

              <button
                onClick={() => navigate(`/travelPackagesview/${pkg.id}`)}
                className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelPackages;
