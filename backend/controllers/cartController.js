import Cart from '../models/Cart.js';
import CampingEquipment from '../models/CampingEquipment.js';
import mongoose from 'mongoose';

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, equipmentId, quantity, price, isRental, startDate, endDate } = req.body;

    console.log('Add to cart request:', {
      authenticatedUserId: req.user._id,
      requestUserId: userId,
      equipmentId,
      quantity
    });

    // Make sure the user ID matches the authenticated user
    // Convert both to strings for comparison
    const authUserId = String(req.user._id);
    const requestUserId = String(userId);
    
    if (authUserId !== requestUserId) {
      console.log(`Auth mismatch: Token user ${authUserId} vs Request user ${requestUserId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only modify your own cart',
        tokenUserId: authUserId,
        requestUserId: requestUserId
      });
    }

    // Validate the equipment exists
    const equipment = await CampingEquipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Check if equipment is available and in stock
    if (!equipment.isAvailable || equipment.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Equipment ${equipment.isAvailable ? 'not available in requested quantity' : 'not available'}`
      });
    }

    // Find user's cart or create a new one
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if rental dates are provided when needed
    if (isRental && (!startDate || !endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required for rentals'
      });
    }

    // Check if equipment is already in the cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.equipment.toString() === equipmentId && 
      item.isRental === isRental &&
      (isRental ? 
        new Date(item.startDate).toISOString() === new Date(startDate).toISOString() && 
        new Date(item.endDate).toISOString() === new Date(endDate).toISOString() : 
        true)
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        equipment: equipmentId,
        quantity,
        price: price || equipment.price,
        isRental,
        ...(isRental && { startDate, endDate })
      });
    }

    await cart.save();

    // Fetch the updated cart with populated equipment data
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.equipment')
      .populate('user', 'username email');

    // Format cart items to include equipment details
    const formattedCart = {
      _id: updatedCart._id,
      user: updatedCart.user,
      totalPrice: updatedCart.totalPrice,
      cartItems: updatedCart.items.map(item => ({
        _id: item._id,
        equipmentId: item.equipment._id,
        name: item.equipment.name,
        price: item.price,
        quantity: item.quantity,
        image: item.equipment.image,
        category: item.equipment.category,
        isRental: item.isRental,
        startDate: item.startDate,
        endDate: item.endDate
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      cart: formattedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Get cart by user ID
export const getCartByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the requesting user matches the user ID
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only access your own cart'
      });
    }

    // Find user's cart and populate equipment details
    const cart = await Cart.findOne({ user: userId })
      .populate('items.equipment')
      .populate('user', 'username email');

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        cartItems: []
      });
    }

    // Format cart items for response
    const cartItems = cart.items.map(item => ({
      _id: item._id,
      equipmentId: item.equipment._id,
      name: item.equipment.name,
      price: item.price,
      quantity: item.quantity,
      image: item.equipment.image,
      category: item.equipment.category,
      isRental: item.isRental,
      startDate: item.startDate,
      endDate: item.endDate
    }));

    res.status(200).json({
      success: true,
      cartItems,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero'
      });
    }

    // Find the cart containing this item
    const cart = await Cart.findOne({ 'items._id': itemId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check if the requesting user owns the cart
    if (req.user._id.toString() !== cart.user.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only modify your own cart'
      });
    }

    // Find the item in the cart
    const cartItem = cart.items.find(item => item._id.toString() === itemId);
    
    // Get the equipment to check availability
    const equipment = await CampingEquipment.findById(cartItem.equipment);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Check if requested quantity is available
    if (equipment.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock'
      });
    }

    // Update the quantity
    cartItem.quantity = quantity;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find the cart containing this item
    const cart = await Cart.findOne({ 'items._id': itemId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check if the requesting user owns the cart
    if (req.user._id.toString() !== cart.user.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only modify your own cart'
      });
    }

    // Use MongoDB's $pull operator to remove the item directly
    await Cart.updateOne(
      { _id: cart._id },
      { $pull: { items: { _id: itemId } } }
    );

    res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the requesting user matches the user ID
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only clear your own cart'
      });
    }

    // Find and update the cart to empty items
    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};
