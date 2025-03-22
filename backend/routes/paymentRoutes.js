import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
  submitPayment,
  getPaymentById,
  getUserPayments,
  approvePayment,
  rejectPayment,
  getPendingPayments,
  updatePayment,
  deletePayment,
  getAllPayments
} from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes
router.post('/submit', protect, submitPayment);
router.get('/user-history', protect, getUserPayments);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);

// Admin routes
router.get('/', protect, admin, getAllPayments);
router.get('/pending', protect, admin, getPendingPayments);
router.get('/:id', protect, admin, getPaymentById);
router.put('/approve/:id', protect, admin, approvePayment);
router.put('/reject/:id', protect, admin, rejectPayment);

export default router;
