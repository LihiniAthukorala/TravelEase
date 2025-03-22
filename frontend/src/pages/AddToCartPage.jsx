import React, { useEffect, useState } from "react";
import axios from "axios";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    const userId = 1; // You can dynamically get this from the logged-in user
    const response = await axios.get(
      `http://localhost:3000/api/cart/${userId}`
    );
    setCartItems(response.data);
    calculateTotal(response.data);
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`/api/cart/${productId}`);
      fetchCartItems(); // Refresh cart items after removal
    } catch (error) {
      alert("Failed to remove item from cart.");
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((acc, item) => acc + item.price, 0);
    setTotalPrice(total);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-5">
      <h1 className="text-3xl font-semibold text-center text-gray-700 mb-8">
        Your Cart
      </h1>
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6">
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-600">Your cart is empty</p>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105"
                >
                  <img
                    src={`https://picsum.photos/300/200?random=${item.productId}`}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {item.name}
                    </h2>
                    <p className="text-gray-600 mt-2">{item.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        ${item.price}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                Total: ${totalPrice}
              </h2>
              <button
                onClick={() => alert("Proceed to checkout")}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
