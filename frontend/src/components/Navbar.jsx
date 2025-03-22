import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate(); // Hook for navigation
  const userId = localStorage.getItem("userId");

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Remove authentication token (if used)
    setDropdownOpen(false); // Close dropdown
    navigate("/"); // Redirect to login page
  };

  const goToProfile = () => {
    setDropdownOpen(false); // Close dropdown
    navigate(`/profile?userId=${userId}`); // Redirect to login page
  };

  return (
    <nav className="bg-blue-900 text-white shadow-lg p-4 flex justify-between items-center relative">
      {/* Left Side - Navigation Links */}
      <div className="flex space-x-6">
        <Link to="/travelPackages" className="hover:text-gray-300">
          Travel Packages
        </Link>
        <Link to="/userproducts" className="hover:text-gray-300">
          Rental Packages
        </Link>
      </div>

      {/* Right Side - Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="focus:outline-none"
        >
          <FaUserCircle size={30} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-black shadow-md rounded-md z-50">
            <button
              onClick={goToProfile}
              className="block w-full text-left px-4 py-2 hover:bg-gray-200 hover:text-white"
            >
              Profile
            </button>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 hover:bg-gray-200 hover:text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
