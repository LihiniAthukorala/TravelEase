import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSnackbar } from 'notistack';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch cart items when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && (user._id || user.id)) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    // Get userId from either _id or id
    const userId = user._id || user.id;
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/cart/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCartItems(response.data.cartItems || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      enqueueSnackbar('Failed to load your cart', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item, quantity = 1, rentalDates = null) => {
    if (!isAuthenticated) {
      enqueueSnackbar('Please login to add items to cart', { variant: 'info' });
      return false;
    }

    if (!user) {
      console.error('User object is undefined');
      enqueueSnackbar('Authentication error. Please login again.', { variant: 'error' });
      return false;
    }

    // Check for either _id or id property
    if (!user._id && !user.id) {
      console.error('User ID is missing from user object:', user);
      enqueueSnackbar('User ID not found. Please login again.', { variant: 'error' });
      return false;
    }

    console.log('Current user:', user);
    
    setLoading(true);
    try {
      // Get userId from either _id or id property
      const userId = user._id ? 
        (typeof user._id === 'object' ? user._id.toString() : String(user._id)) : 
        String(user.id);
      
      const payload = {
        userId,
        equipmentId: item._id,
        quantity: quantity,
        price: item.price,
        isRental: !!rentalDates,
        ...(rentalDates && { 
          startDate: rentalDates.startDate, 
          endDate: rentalDates.endDate 
        })
      };

      console.log('Sending payload:', payload);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Using auth token:', token ? 'Token exists' : 'No token found');
      
      const response = await axios.post('http://localhost:5001/api/cart/add', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        await fetchCartItems(); // Refresh cart
        enqueueSnackbar(`${quantity} ${item.name} added to cart`, { variant: 'success' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to cart:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to add item to cart';
      enqueueSnackbar(errorMsg, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    if (!quantity || quantity <= 0) {
      enqueueSnackbar('Quantity must be at least 1', { variant: 'warning' });
      return false;
    }
    
    setLoading(true);
    try {
      console.log(`Updating cart item ${cartItemId} to quantity ${quantity}`);
      
      const response = await axios.put(
        `http://localhost:5001/api/cart/update/${cartItemId}`, 
        { quantity }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // Update local state
        setCartItems(prevItems =>
          prevItems.map(item =>
            item._id === cartItemId ? { ...item, quantity } : item
          )
        );
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update cart';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/cart/remove/${cartItemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      setCartItems(prevItems => prevItems.filter(item => item._id !== cartItemId));
      enqueueSnackbar('Item removed from cart', { variant: 'success' });
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      enqueueSnackbar('Failed to remove item from cart', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    // Get userId from either _id or id
    const userId = user?._id || user?.id;
    if (!userId) return;
    
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/cart/clear/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCartItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      enqueueSnackbar('Failed to clear cart', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.price * item.quantity;
      
      // If it's a rental, calculate based on rental days
      if (item.isRental && item.startDate && item.endDate) {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        return total + (itemPrice * days);
      }
      
      return total + itemPrice;
    }, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    calculateTotal,
    refreshCart: fetchCartItems
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;