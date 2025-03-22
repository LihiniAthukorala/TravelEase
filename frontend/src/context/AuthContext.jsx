import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

// Export the context so it can be imported elsewhere
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data on initial render or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('http://localhost:5001/api/auth/me');
        setUser(res.data.user);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      enqueueSnackbar('Login successful!', { variant: 'success' });
      
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      enqueueSnackbar(message, { variant: 'error' });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/register', userData);
      enqueueSnackbar('Registration successful! Please login.', { variant: 'success' });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      enqueueSnackbar(message, { variant: 'error' });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    // Add page refresh
    window.location.reload();
    navigate('/login');
  };

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user;

  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
