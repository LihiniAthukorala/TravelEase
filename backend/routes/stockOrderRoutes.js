import express from 'express';
import { 
  createStockOrder, 
  getStockOrders, 
  getStockOrderById, 
  updateStockOrderStatus, 
  cancelStockOrder 
} from '../controllers/stockOrderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all orders and create new order
router.route('/')
  .get(getStockOrders)
  .post(createStockOrder);

// Get order by ID
router.get('/:id', getStockOrderById);

// Update order status
router.put('/:id/status', updateStockOrderStatus);

// Cancel order
router.put('/:id/cancel', cancelStockOrder);

export default router;
