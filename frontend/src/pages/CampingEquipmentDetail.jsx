import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CampingEquipmentDetail = () => {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [rentalDuration, setRentalDuration] = useState(1); // Add rental duration state
  const [isRental, setIsRental] = useState(false); // Add rental toggle state
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipmentDetails();
  }, [id]);

  const fetchEquipmentDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/camping-equipment/${id}`);
      
      if (response.data.success) {
        setEquipment(response.data.equipment);
      } else {
        enqueueSnackbar('Failed to load equipment details', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching equipment details:', error);
      enqueueSnackbar('Error loading equipment details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log('No image path provided, using default');
      return '/images/default-equipment.jpg';
    }
    
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      console.log(`Using direct URL: ${imagePath}`);
      return imagePath;
    }
    
    if (imagePath && imagePath.startsWith('/uploads')) {
      const url = `http://localhost:5001${imagePath}`;
      console.log(`Loading image from backend: ${url}`);
      return url;
    }
    
    console.log(`Unrecognized image path format: ${imagePath}, using default`);
    return '/images/default-equipment.jpg';
  };

  const handleIncreaseQuantity = () => {
    if (equipment && quantity < equipment.quantity) {
      setQuantity(prevQuantity => prevQuantity + 1);
    } else {
      enqueueSnackbar('Maximum available quantity reached', { variant: 'warning' });
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prevQuantity => prevQuantity - 1);
    }
  };

  // Add functions to handle rental duration
  const handleIncreaseDuration = () => {
    setRentalDuration(prevDuration => prevDuration + 1);
  };

  const handleDecreaseDuration = () => {
    if (rentalDuration > 1) {
      setRentalDuration(prevDuration => prevDuration - 1);
    }
  };

  // Toggle between rental and purchase
  const handleRentalToggle = (e) => {
    setIsRental(e.target.checked);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      enqueueSnackbar('Please login to add items to cart', { variant: 'info' });
      navigate('/login');
      return;
    }

    if (!equipment) {
      enqueueSnackbar('Equipment information is missing', { variant: 'error' });
      return;
    }

    try {
      // Calculate rental dates if it's a rental
      let rentalDates = null;
      if (isRental) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + rentalDuration);
        rentalDates = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
      }
      
      const success = await addToCart(equipment, quantity, rentalDates);
      if (success) {
        // Offer to navigate to cart
        enqueueSnackbar(`${quantity} ${equipment.name} ${isRental ? 'rented' : 'added'} to cart successfully!`, { variant: 'success' });
        
        if (window.confirm('View your cart now?')) {
          navigate('/cart');
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      enqueueSnackbar(
        error.message || 'Failed to add item to cart. Please try again.', 
        { variant: 'error' }
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Equipment Not Found</h2>
          <p className="mb-4">The equipment you're looking for doesn't exist or has been removed.</p>
          <Link to="/camping-equipment" className="text-blue-600 hover:underline">
            Back to Camping Equipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <Link to="/camping-equipment" className="inline-flex items-center text-blue-600 hover:underline mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Equipment
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/2">
              <img 
                src={getImageUrl(equipment.image)} 
                alt={equipment.name}
                className="h-96 w-full object-cover object-center"
                onError={(e) => {
                  console.error(`Image load error for ${equipment.name}:`, e.target.src);
                  e.target.src = '/images/default-equipment.jpg';
                  e.target.onerror = null; // Prevent infinite error loops
                }}
              />
            </div>
            
            <div className="p-8 md:w-1/2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide">
                    {equipment.category}
                  </span>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">{equipment.name}</h2>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  LKR {equipment.price.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                <p className="mt-2 text-gray-600">{equipment.description}</p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Availability</h3>
                <p className="mt-2">
                  {equipment.isAvailable ? (
                    <span className="text-green-600">
                      In Stock ({equipment.quantity} available)
                    </span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </p>
              </div>
              
              {equipment.isAvailable && (
                <div className="mt-8">
                  {/* Rental toggle */}
                  <div className="flex items-center mb-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isRental}
                        onChange={handleRentalToggle}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-gray-700 font-medium">
                        {isRental ? 'Rent this item' : 'Purchase this item'} 
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button 
                        onClick={handleDecreaseQuantity} 
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-2">{quantity}</span>
                      <button 
                        onClick={handleIncreaseQuantity} 
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                        disabled={quantity >= equipment.quantity}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Rental duration selector (shown only when rental is selected) */}
                  {isRental && (
                    <div className="flex items-center space-x-4 mt-4">
                      <span className="text-gray-700">Rental Duration (days):</span>
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button 
                          onClick={handleDecreaseDuration} 
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                          disabled={rentalDuration <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-2">{rentalDuration}</span>
                        <button 
                          onClick={handleIncreaseDuration} 
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Display price calculation including duration for rentals */}
                  <div className="mt-4 text-lg font-semibold">
                    {isRental ? (
                      <div>
                        <span className="text-gray-700">Total Price: </span>
                        <span className="text-blue-600">
                          LKR {(equipment.price * quantity * rentalDuration).toFixed(2)}
                        </span>
                        <p className="text-sm text-gray-500">
                          (LKR {equipment.price.toFixed(2)} × {quantity} {quantity > 1 ? 'items' : 'item'} × {rentalDuration} {rentalDuration > 1 ? 'days' : 'day'})
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-700">Total Price: </span>
                        <span className="text-blue-600">
                          LKR {(equipment.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleAddToCart}
                    className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isRental ? 'Add Rental to Cart' : 'Add to Cart'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampingEquipmentDetail;
