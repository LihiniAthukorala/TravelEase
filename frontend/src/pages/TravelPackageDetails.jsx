import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const TravelPackageDetails = () => {
  const { id } = useParams(); // Get package ID from URL
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPackageDetails();
  }, []);

  const fetchPackageDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/travel-packages/${id}`);
      setPackageData(response.data);
    } catch (error) {
      console.error("Error fetching package details", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setPackageData({ ...packageData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:3000/api/travel-packages//update/${id}`, packageData);
      alert("Package updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating package", error);
      alert("Failed to update package");
    }
  };

  if (!packageData) return <p>Loading...</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      {isEditing ? (
        <div>
          <input
            type="text"
            name="name"
            value={packageData.name}
            onChange={handleChange}
            className="w-full mb-3 p-2 border rounded"
          />
          <input
            type="text"
            name="destination"
            value={packageData.destination}
            onChange={handleChange}
            className="w-full mb-3 p-2 border rounded"
          />
          <input
            type="number"
            name="price"
            value={packageData.price}
            onChange={handleChange}
            className="w-full mb-3 p-2 border rounded"
          />
          <input
            type="number"
            name="duration"
            value={packageData.duration}
            onChange={handleChange}
            className="w-full mb-3 p-2 border rounded"
          />
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            Save Changes
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">{packageData.name}</h2>
          <p className="text-gray-600">{packageData.destination}</p>
          <p className="text-gray-800 font-bold">${packageData.price}</p>
          <p className="text-sm text-gray-500">Duration: {packageData.duration} days</p>
          <button
            onClick={handleEdit}
            className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default TravelPackageDetails;
