import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-blue-900 text-white flex flex-col shadow-lg">
      <div className="p-5 text-2xl font-bold text-center bg-blue-900">
        Dashboard
      </div>
      <ul className="mt-10 space-y-4">
        {/* <li className="hover:bg-gray-700 p-3 rounded-md transition-all duration-200">
          <Link to="/dashboard" className="block">Dashboard</Link>
        </li> */}
        <li className="hover:bg-gray-700 p-3 rounded-md transition-all duration-200 text-center">
          <Link to="/users" className="block">
            Manage Users
          </Link>
        </li>
        <li className="hover:bg-gray-700 p-3 rounded-md transition-all duration-200 text-center">
          <Link to="/products" className="block">
            Manage Products
          </Link>
        </li>
        <li className="hover:bg-gray-700 p-3 rounded-md transition-all duration-200 text-center">
          <Link to="/rentals" className="block">
            Manage Rentals
          </Link>
        </li>
        {/* <li className="hover:bg-gray-700 p-3 rounded-md transition-all duration-200 text-center">
          <Link to="/carts" className="block">
            Manage Carts
          </Link>
        </li> */}
        <li className="hover:bg-gray-700 p-3 rounded-md transition-all duration-200 text-center">
          <Link to="/adminbooking" className="block">
            Manage Bookings
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
