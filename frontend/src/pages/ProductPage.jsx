import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({}); // Track quantity for each product

  const [IsOrderProcessed, setIsOrderProcessed] = useState([]);

  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await axios.get("http://localhost:3000/api/products/");
    setProducts(response.data);
  };

  const gototravelpakages = async () => {
    navigate("/travelPackages");
  };

  const addToCart = async (productId) => {
    const quantity = quantities[productId] || 1; // Use the specific quantity for the product
    const IsOrderProcessed = true;
    if (!userId) {
      alert("Please log in to add items to your cart.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/cart/cart", {
        userId,
        productId,
        quantity,
        IsOrderProcessed,
      });
      alert("Product added to cart!");
    } catch (error) {
      console.log(error);
      alert("Failed to add product to cart.");
    }
  };

  const rentProduct = (productId) => {
    if (!userId) {
      alert("Please log in to rent items.");
      return;
    }
    navigate(`/rentform?userId=${userId}&productId=${productId}`);
  };

  // Increment and decrement quantity for a specific product
  const incrementQuantity = (productId) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: (prevQuantities[productId] || 1) + 1,
    }));
  };

  const decrementQuantity = (productId) => {
    setQuantities((prevQuantities) => {
      const currentQuantity = prevQuantities[productId] || 1;
      if (currentQuantity > 1) {
        return {
          ...prevQuantities,
          [productId]: currentQuantity - 1,
        };
      }
      return prevQuantities;
    });
  };

  const getCartItems = async () => {
    navigate("/usercart");
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-5 relative">
      {/* Add to Cart Button (Positioned at the top right) */}
      <div className="absolute top-5 right-5 z-10">
        {/* <button
          onClick={() => gototravelpakages()}
          className="bg-blue-600 text-white px-6 py-3 mr-4 rounded-md hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Travel Packages
        </button> */}
        <button
          onClick={getCartItems}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Go to Cart
        </button>
      </div>

      <div className="flex items-center justify-center">
        <h1 className="text-3xl font-semibold text-center text-gray-700 mb-8">
          All Available Products
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover"
            />

            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {product.name}
              </h2>
              <p className="text-gray-600 mt-2">{product.description}</p>
              <div className="mt-4 flex flex-col items-start gap-3">
                <span className="text-lg font-bold text-gray-900">
                  ${product.price}
                </span>

                {/* Quantity control with increment/decrement buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => decrementQuantity(product.id)}
                    className="text-md font-semibold cursor-pointer select-none px-4"
                  >
                    -
                  </button>
                  <span className="text-md font-semibold border-x-2 border-gray-300 px-8 py-2">
                    {quantities[product.id] < 10
                      ? `0${quantities[product.id] || 1}`
                      : quantities[product.id] || 1}
                  </span>
                  <button
                    onClick={() => incrementQuantity(product.id)}
                    className="text-md font-semibold cursor-pointer select-none px-4"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-3 mt-4">
                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(product.id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Add to Cart
                  </button>

                  {/* Rent Button */}
                  <button
                    onClick={() => rentProduct(product.id)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    Rent
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPage;
