import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TravelPackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [travelPackage, setTravelPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Assuming you will get the user details here

  useEffect(() => {
    // Fetch travel package details
    const fetchPackageDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/travel-packages/${id}`
        );
        setTravelPackage(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching travel package details:", error);
        setLoading(false);
      }
    };

    // Fetch user details (could be from API or context)
    const fetchUserDetails = async () => {
      // Example for fetching user details (replace this with your logic)
      const userData = await axios.get("http://localhost:3000/api/user/me"); // or use context
      setUser(userData.data);
    };

    fetchPackageDetails();
    fetchUserDetails();
  }, [id]);

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;
  if (!travelPackage)
    return (
      <p className="text-center text-red-500">Travel package not found.</p>
    );

  const handleBookNow = () => {
    navigate(`/bookings/${id}`, {});
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
        {travelPackage.name}
      </h1>
      <div className="flex justify-center mb-8">
        <img
          src={travelPackage.imageUrl || "https://via.placeholder.com/600"}
          alt={travelPackage.name}
          className="w-full h-80 object-cover rounded-xl shadow-md"
        />
      </div>
      <p className="text-lg text-gray-700 mb-8 text-center">
        {travelPackage.description}
      </p>

      <div className="space-y-6 mb-8">
        <p className="text-lg text-gray-800">
          <span className="font-semibold text-xl">Destination:</span>{" "}
          {travelPackage.destination}
        </p>
        <p className="text-lg text-gray-800">
          <span className="font-semibold text-xl">Price:</span> $
          {travelPackage.price}
        </p>
        <p className="text-lg text-gray-800">
          <span className="font-semibold text-xl">Duration:</span>{" "}
          {travelPackage.duration} days
        </p>
      </div>

      {/* Book Now Button */}
      <div className="flex justify-center">
        <button
          onClick={handleBookNow}
          className="w-full md:w-2/3 lg:w-1/2 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition duration-300 text-lg font-semibold"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default TravelPackageDetails;
