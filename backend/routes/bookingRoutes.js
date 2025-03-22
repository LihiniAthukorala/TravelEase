import express from "express";
import { protect, admin } from '../middleware/authMiddleware.js';

// Import the controller
// Note: Adjust the import path if your controller is in a different location
import {
  createBooking,
  getAllBookings,
  getUserBookings,
  getBookingsByTour,
  deleteBooking
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/bookings", protect, createBooking);
router.get("/bookings/user/:userId", protect, getUserBookings);
router.get("/bookings/tour/:tourId", protect, getBookingsByTour);
router.get("/all", protect, admin, getAllBookings);
router.delete("/bookings/:bookingId", protect, admin, deleteBooking);

export default router;
