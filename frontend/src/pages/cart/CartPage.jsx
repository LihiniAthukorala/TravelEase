import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const CartPage = () => {
  const { cartItems, loading, updateCartItem, removeFromCart, calculateTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (cartItemId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      await removeFromCart(cartItemId);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      enqueueSnackbar('Please login to checkout', { variant: 'info' });
      navigate('/login');
      return;
    }

    // For now, just navigate to checkout page (will be implemented later)
    navigate('/checkout');
  };

  // Check if there are any rental items in the cart
  const hasRentalItems = cartItems.some(item => item.isRental);
  
  // Split items into rental and standard purchase items
  const rentalItems = cartItems.filter(item => item.isRental);
  const regularItems = cartItems.filter(item => !item.isRental);

  // Calculate separate totals
  const calculateRentalTotal = () => {
    return rentalItems.reduce((total, item) => {
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate);
      const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
      return total + (item.price * item.quantity * days);
    }, 0);
  };

  const calculateRegularTotal = () => {
    return regularItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleRegularCheckout = () => {
    if (!isAuthenticated) {
      enqueueSnackbar('Please login to checkout', { variant: 'info' });
      navigate('/login');
      return;
    }
    navigate('/payment');
  };

  const handleRentalCheckout = () => {
    if (!isAuthenticated) {
      enqueueSnackbar('Please login to checkout', { variant: 'info' });
      navigate('/login');
      return;
    }
    navigate('/rental-checkout');
  };

  // Calculate rental days
  const calculateRentalDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-medium text-gray-700 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link 
              to="/camping-equipment" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Camping Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rental Items Section (if any) */}
            {hasRentalItems && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                  <h2 className="text-lg font-medium text-blue-900">Rental Items</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                  {rentalItems.map(item => (
                    <li key={item._id} className="flex py-6 px-6">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image ? `http://localhost:5001${item.image}` : '/images/default-equipment.jpg'}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => { e.target.src = '/images/default-equipment.jpg' }}
                        />
                      </div>

                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>
                              <Link to={`/camping-equipment/${item.equipmentId}`}>{item.name}</Link>
                            </h3>
                            <p className="ml-4">
                              LKR {(item.price * item.quantity * calculateRentalDays(item.startDate, item.endDate)).toFixed(2)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                          <p className="mt-1 text-sm text-blue-600">
                            Rental: {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                            <span className="ml-2 font-medium">
                              ({calculateRentalDays(item.startDate, item.endDate)} {calculateRentalDays(item.startDate, item.endDate) > 1 ? 'days' : 'day'})
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                              className="text-gray-500 px-2 py-1 border rounded-l-md"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 border-t border-b">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                              className="text-gray-500 px-2 py-1 border rounded-r-md"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="font-medium text-red-600 hover:text-red-500"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                  <div className="flex justify-between">
                    <span>Rental Subtotal:</span>
                    <span className="font-bold">LKR {calculateRentalTotal().toFixed(2)}</span>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleRentalCheckout}
                      className="w-full bg-blue-600 px-4 py-2 text-white font-medium rounded-md hover:bg-blue-700"
                    >
                      Proceed to Rental Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Purchase Items (if any) */}
            {regularItems.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Regular Purchase Items</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                  {regularItems.map(item => (
                    <li key={item._id} className="flex py-6 px-6">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image ? `http://localhost:5001${item.image}` : '/images/default-equipment.jpg'}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                          onError={(e) => { e.target.src = '/images/default-equipment.jpg' }}
                        />
                      </div>

                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>
                              <Link to={`/camping-equipment/${item.equipmentId}`}>{item.name}</Link>
                            </h3>
                            <p className="ml-4">LKR {(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                          {item.isRental && (
                            <p className="mt-1 text-sm text-gray-500">
                              Rental: {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                              className="text-gray-500 px-2 py-1 border rounded-l-md"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 border-t border-b">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                              className="text-gray-500 px-2 py-1 border rounded-r-md"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            className="font-medium text-red-600 hover:text-red-500"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Purchase Subtotal:</span>
                    <span className="font-bold">LKR {calculateRegularTotal().toFixed(2)}</span>
                  </div>
                  {regularItems.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={handleRegularCheckout}
                        className="w-full bg-green-600 px-4 py-2 text-white font-medium rounded-md hover:bg-green-700"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cart Summary */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
              </div>
              <div className="p-6">
                {hasRentalItems && (
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Rental Subtotal</p>
                    <p className="font-medium">LKR {calculateRentalTotal().toFixed(2)}</p>
                  </div>
                )}
                {regularItems.length > 0 && (
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Purchase Subtotal</p>
                    <p className="font-medium">LKR {calculateRegularTotal().toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                  <p className="text-lg font-medium">Total</p>
                  <p className="text-lg font-bold text-blue-600">LKR {calculateTotal().toFixed(2)}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Link
                    to="/camping-equipment"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
