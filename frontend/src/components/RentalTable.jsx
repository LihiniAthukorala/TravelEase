import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi";

const RentalTable = () => {
  const [rentals, setRentals] = useState([]);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    const response = await axios.get(
      "http://localhost:3000/api/rentals/getallrentals"
    );
    setRentals(response.data);
  };

  const deleteRental = async (id) => {
    await axios.post(`http://localhost:3000/api/rentals/delete/${id}`);
    fetchRentals();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full h-screen mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">
        Rental Management
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">User ID</th>
              <th className="py-3 px-6 text-left">Start Date</th>
              <th className="py-3 px-6 text-left">End Date</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {rentals.map((rental) => (
              <tr
                key={rental.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="py-3 px-6">{rental.id}</td>
                <td className="py-3 px-6">{rental.userId}</td>
                <td className="py-3 px-6">
                  {new Date(rental.startDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-6">
                  {new Date(rental.endDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-6">{rental.status}</td>
                <td className="py-3 px-6 flex justify-center gap-3">
                  <button
                    onClick={() => deleteRental(rental.id)}
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

export default RentalTable;
