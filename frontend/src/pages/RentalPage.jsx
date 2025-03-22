import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RentalPage = () => {
  const [rentals, setRentals] = useState([]);
  const [durations, setDurations] = useState({}); // Track rental duration for each item

  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/rentals/getallrentals"
      );
      setRentals(response.data);
    } catch (error) {
      console.error("Error fetching rentals:", error);
    }
  };

  const addToCart = async (rentalId) => {
    const duration = durations[rentalId] || 1; // Use the selected rental duration
    if (!userId) {
      alert("Please log in to add items to your cart.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/cart/rentals", {
        userId,
        rentalId,
        duration,
      });
      alert("Rental added to cart!");
    } catch (error) {
      console.log(error);
      alert("Failed to add rental to cart.");
    }
  };

  // Increment and decrement rental duration for a specific item
  const incrementDuration = (rentalId) => {
    setDurations((prevDurations) => ({
      ...prevDurations,
      [rentalId]: (prevDurations[rentalId] || 1) + 1,
    }));
  };

  const decrementDuration = (rentalId) => {
    setDurations((prevDurations) => {
      const currentDuration = prevDurations[rentalId] || 1;
      if (currentDuration > 1) {
        return {
          ...prevDurations,
          [rentalId]: currentDuration - 1,
        };
      }
      return prevDurations;
    });
  };

  const getCartItems = async () => {
    navigate("/usercart");
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-5 relative">
      {/* Add to Cart Button (Positioned at the top right) */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={getCartItems}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Go to Cart
        </button>
      </div>

      <div className="flex items-center justify-center">
        <h1 className="text-3xl font-semibold text-center text-gray-700 mb-8">
          All Available Rentals
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rentals.map((rental) => (
          <div
            key={rental.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105"
          >
            <img
              src={`https://picsum.photos/300/200?random=${rental.id}`}
              alt={rental.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {rental.name}
              </h2>
              <p className="text-gray-600 mt-2">{rental.description}</p>
              <div className="mt-4 flex flex-col items-start gap-3">
                <span className="text-lg font-bold text-gray-900">
                  ${rental.price} / day
                </span>

                {/* Duration control with increment/decrement buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => decrementDuration(rental.id)}
                    className="text-md font-semibold cursor-pointer select-none px-4"
                  >
                    -
                  </button>
                  <span className="text-md font-semibold border-x-2 border-gray-300 px-8 py-2">
                    {durations[rental.id] < 10
                      ? `0${durations[rental.id] || 1}`
                      : durations[rental.id] || 1}
                  </span>
                  <button
                    onClick={() => incrementDuration(rental.id)}
                    className="text-md font-semibold cursor-pointer select-none px-4"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(rental.id)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalPage;
