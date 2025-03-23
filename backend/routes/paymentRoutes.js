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
  getAllPayments,
  getUserOrders
} from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes (regular user access)
router.post('/submit', protect, submitPayment);
router.get('/user-history', protect, getUserPayments);
router.put('/:id', protect, updatePayment);
router.delete('/:id', protect, deletePayment);
router.get('/user-orders', protect, getUserOrders); // Make sure this doesn't have the admin middleware

// Admin routes
router.get('/', protect, admin, getAllPayments);
router.get('/pending', protect, admin, getPendingPayments);
router.get('/:id', protect, admin, getPaymentById);
router.put('/approve/:id', protect, admin, approvePayment);
router.put('/reject/:id', protect, admin, rejectPayment);

// Add this new route
router.get('/tour-bookings/:tourId', protect, admin, async (req, res) => {
  try {
    const bookings = await Payment.find({
      'purchaseDetails.name': { $exists: true },
      'type': 'tour'
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add this new route for all tour bookings
router.get('/all-tour-bookings', protect, admin, async (req, res) => {
  try {
    const bookings = await Payment.find({ type: 'tour' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
