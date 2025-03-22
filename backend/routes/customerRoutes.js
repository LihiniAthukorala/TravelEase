import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  subscribeToAlerts
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all customers and create new customer
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

// Get, update, and delete specific customer
router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

// Get customer orders
router.get('/:id/orders', getCustomerOrders);

// Subscribe customer to alerts
router.put('/:id/subscribe', subscribeToAlerts);

export default router;
