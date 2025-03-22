import express from 'express';
import { 
  submitPayment, 
  getPendingPayments, 
  approvePayment, 
  rejectPayment,
  getUserPayments,
  updatePayment,
  deletePayment,
  getAllPayments,
  getPaymentById  // Add this import
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/submit', protect, submitPayment);
router.get('/user-history', protect, getUserPayments);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

// Admin routes
router.get('/', protect, admin, getAllPayments);
router.get('/pending', protect, admin, getPendingPayments);
router.get('/:id', protect, admin, getPaymentById);  // Add this route
router.put('/approve/:id', protect, admin, approvePayment);
router.put('/reject/:id', protect, admin, rejectPayment);

export default router;
