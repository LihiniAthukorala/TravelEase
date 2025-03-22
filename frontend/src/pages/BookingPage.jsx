import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [travelDate, setTravelDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBooking = async () => {
    if (!travelDate) {
      setError("Please select a travel date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/booking/bookings",
        {
          userId,
          packageId: id,
          travelDate: new Date(travelDate).toISOString(),
        }
      );

      alert("Booking successful!");
      // navigate("/my-bookings");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
      navigate("/travelPackages");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Book Your Trip</h2>
      <label className="block mb-2">Select Travel Date:</label>
      <input
        type="date"
        className="w-full p-2 border rounded mb-4"
        value={travelDate}
        onChange={(e) => setTravelDate(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={handleBooking}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? "Booking..." : "Create Booking"}
      </button>
    </div>
  );
};

export default BookingPage;
