import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  addToCart,
  getCartByUser,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cartController.js';

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Cart routes
router.post('/add', addToCart);
router.get('/user/:userId', getCartByUser);
router.put('/update/:itemId', updateCartItem);
router.delete('/remove/:itemId', removeCartItem);
router.delete('/clear/:userId', clearCart);

export default router;
