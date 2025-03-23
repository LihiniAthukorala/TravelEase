import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
  submitTourPayment,
  getAllTourBookings,
  getTourBookingsByTourId,
  getUserTourBookings
} from '../controllers/tourPaymentController.js';

const router = express.Router();

// User routes
router.post('/submit', protect, submitTourPayment);
router.get('/my-bookings', protect, getUserTourBookings);

// Admin routes
router.get('/all', protect, admin, getAllTourBookings);
router.get('/tour/:tourId', protect, admin, getTourBookingsByTourId);

export default router;
