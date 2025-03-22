import express from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getUserBookings,
} from "../controllers/bookingController.js";
const router = express.Router();

router.post("/bookings", createBooking);
router.get("/bookings/user/:userId", getUserBookings);
router.get("/all", getAllBookings); // Changed from adminbookings to all
router.delete("/bookings/:bookingId", deleteBooking); // Changed from post to delete

export default router;
