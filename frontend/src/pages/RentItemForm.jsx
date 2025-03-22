import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const RentItemForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const userId = queryParams.get("userId");
  const productId = queryParams.get("productId");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !quantity) {
      setError("All fields are required");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/rentals/addrental", {
        userId,
        productId,
        startDate,
        endDate,
        quantity: Number(quantity),
      });

      setSuccessMessage("Item rented successfully!");
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Error renting the item";
      setError(errorMessage);
      setSuccessMessage(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
        Rent an Item
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {successMessage && (
        <p className="text-green-500 text-center mb-4">{successMessage}</p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Hidden Inputs */}
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="productId" value={productId} />

        <div className="mb-4">
          <label htmlFor="startDate" className="block text-gray-600 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="endDate" className="block text-gray-600 mb-2">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="quantity" className="block text-gray-600 mb-2">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
        >
          Rent Item
        </button>
        <button
          type="button"
          onClick={() => navigate(`/rentcheckout?userId=${userId}`)}
          className="w-full mt-4 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-300"
        >
          Proceed to Checkout
        </button>
      </form>
    </div>
  );
};

// Rent Product Function
export const rentProduct = (userId, productId, navigate) => {
  if (!userId) {
    alert("Please log in to rent items.");
    return;
  }
  navigate(`/rentform?userId=${userId}&productId=${productId}`);
};

export default RentItemForm;
