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
router.get("/adminbookings", getAllBookings);
router.post("/delete/:bookingId", deleteBooking);

export default router;
