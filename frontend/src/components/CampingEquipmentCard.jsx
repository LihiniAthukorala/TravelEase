import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl, handleImageError } from '../utils/imageUtils';

const CampingEquipmentCard = ({ equipment }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105">
      <div className="relative">
        <img
          src={getImageUrl(equipment.image)}
          alt={equipment.name}
          className="w-full h-48 object-cover"
          onError={(e) => handleImageError(e)}
        />
        <span className="absolute top-4 left-4 bg-blue-500 text-white text-sm py-1 px-3 rounded-full">
          {equipment.category}
        </span>
        {!equipment.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-md font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{equipment.name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{equipment.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">LKR {equipment.price.toFixed(2)}</span>
          <Link
            to={`/camping-equipment/${equipment._id}`}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CampingEquipmentCard;
