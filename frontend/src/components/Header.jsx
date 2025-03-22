import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-500 via-blue-500 to-blue-600 text-white p-6 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <Link 
          to="/" 
          className={`text-3xl font-bold tracking-tight mb-4 md:mb-0 transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="text-white">Bloomz</span>
        </Link>
        
        <nav className="w-full md:w-auto">
          <ul className="flex flex-wrap justify-center md:justify-end space-x-2 md:space-x-4">
            <li>
              <Link to="/" className="px-4 py-2 rounded-full hover:bg-white hover:text-yellow-600 transition-all duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </Link>
            </li>
            {!user ? (
              <>
                <li>
                  <Link to="/login" className="px-4 py-2 rounded-full hover:bg-white hover:text-yellow-600 transition-all duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="bg-white text-yellow-600 font-medium px-4 py-2 rounded-full hover:bg-gray-800 hover:text-white transition-all duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Register
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    to={user.isAdmin ? "/admin-dashboard" : "/dashboard"} 
                    className="px-4 py-2 rounded-full hover:bg-white hover:text-yellow-600 transition-all duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={logout} 
                    className="bg-white text-yellow-600 font-medium px-4 py-2 rounded-full hover:bg-gray-800 hover:text-white transition-all duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm6 9a1 1 0 100-2H4.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H9a1 1 0 100-2H4.5A2.5 2.5 0 002 8.5v1A2.5 2.5 0 004.5 12H9z" clipRule="evenodd" />
                      <path d="M13 11.293V4.707l5.5 5.5-5.5 5.5v-4.414z" />
                    </svg>
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
