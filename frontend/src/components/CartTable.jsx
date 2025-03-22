import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";

const CartTable = () => {
  const [carts, setCarts] = useState([]);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/cart/getallitems"
      );
      setCarts(response.data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const deleteCartItem = async (id) => {
    try {
      await axios.post(`http://localhost:3000/api/cart/deleteitems/${id}`);
      fetchCarts();
    } catch (error) {
      console.error("Error deleting cart item:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full h-screen mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">
        Cart Management
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">User ID</th>
              <th className="py-3 px-6 text-left">Product ID</th>
              <th className="py-3 px-6 text-left">Quantity</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {carts.map((cart) => (
              <tr
                key={cart.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="py-3 px-6">{cart.id}</td>
                <td className="py-3 px-6">{cart.userId}</td>
                <td className="py-3 px-6">{cart.productId}</td>
                <td className="py-3 px-6">{cart.quantity}</td>
                <td className="py-3 px-6 flex justify-center gap-3">
                  <button
                    onClick={() => deleteCartItem(cart.id)}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow"
                  >
                    <FiTrash2 className="text-lg" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CartTable;
