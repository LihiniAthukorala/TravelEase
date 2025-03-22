import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/cart/cart/${userId}`
      );
      setCartItems(response.data);
      calculateTotal(response.data);

      console.log(response.data);
    } catch (error) {
      console.error("Error fetching cart items", error);
    }
  };

  const calculateTotal = (items) => {
    let totalAmount = 0;
    items.forEach((item) => {
      totalAmount += item.quantity * item.Product.price;
    });
    setTotal(totalAmount.toFixed(2));
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await axios.delete(`http://localhost:3000/api/cart/cart/${itemId}`);
      fetchCartItems(); // Refresh cart after removing item
    } catch (error) {
      console.error("Error removing item", error);
    }
  };

  const handleCheckout = () => {
    const cartItemIds = cartItems.map((item) => item.id);
    navigate("/payment", { state: { cartItemIds } });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-5">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-center text-gray-700 mb-8">
          Your Shopping Cart
        </h1>
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Your cart is empty.
            </p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <div className="flex items-center space-x-4">
                        <img
                          src={`${item.Product.image}`}
                          alt={item.Product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <h3 className="text-md font-semibold">
                            {item.Product.name}
                          </h3>
                          <p className="text-gray-600 text-xs">
                            {item.Product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      ${item.Product.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      ${item.quantity * item.Product.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-gray-800">Total:</span>
              <span className="text-2xl font-bold text-gray-900">${total}</span>
            </div>

            <div className="mt-6 flex justify-between gap-4">
              <button
                onClick={() => navigate("/userproducts")}
                className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Continue Shopping
              </button>
              <button
                onClick={handleCheckout}
                className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200"
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
