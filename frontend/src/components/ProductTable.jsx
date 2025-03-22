import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";

const ProductTable = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    image: "", // Image as a string URL
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await axios.get("http://localhost:3000/api/products");
    setProducts(response.data);
  };

  const deleteProduct = async (id) => {
    try {
      await axios.post(`http://localhost:3000/api/products/delete/${id}`);
    } catch (error) {
      console.log(error);
    }
    fetchProducts();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/api/products/create",
        newProduct
      );
      if (response.status === 201) {
        fetchProducts(); // Refresh product list
        setIsModalOpen(false); // Close the modal
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full h-screen mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-3">
        Product Management
      </h2>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1 mb-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow cursor-pointer"
      >
        Add Product
      </button>

      {/* Modal for adding a product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">
              Add Product
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={newProduct.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700">Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={newProduct.image}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Price</th>
              <th className="py-3 px-6 text-left">Stock</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="py-3 px-6">{product.id}</td>
                <td className="py-3 px-6">{product.name}</td>
                <td className="py-3 px-6">${product.price}</td>
                <td className="py-3 px-6">{product.stock}</td>
                <td className="py-3 px-6 flex justify-center gap-3">
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow cursor-pointer"
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

export default ProductTable;
