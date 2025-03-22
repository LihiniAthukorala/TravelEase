import Tour from '../models/Tour.js';
import mongoose from 'mongoose';

// Define your booking schema or import if it exists elsewhere
const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  travelDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the Booking model if it doesn't exist
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

// Get all bookings (admin only)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('tour', 'name location price')
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      error: "Something went wrong while fetching bookings."
    });
  }
};

// Create a booking
export const createBooking = async (req, res) => {
  try {
    const { tourId, travelDate } = req.body;

    const booking = await Booking.create({
      user: req.user._id,
      tour: tourId,
      travelDate
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      error: "Something went wrong while creating the booking."
    });
  }
};

// Get bookings for a specific user
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.params.userId
    })
    .populate('tour', 'name location price image')
    .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      error: "Something went wrong while fetching user bookings."
    });
  }
};

// Get bookings for a specific tour
export const getBookingsByTour = async (req, res) => {
  try {
    const bookings = await Booking.find({
      tour: req.params.tourId
    })
    .populate('user', 'name email')
    .populate('tour', 'name location price')
    .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching tour bookings:', error);
    res.status(500).json({ 
      error: "Something went wrong while fetching tour bookings."
    });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    
    res.status(200).json({ message: "Booking deleted successfully." });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ 
      error: "Something went wrong while deleting the booking."
    });
  }
};

export default {
  getAllBookings,
  createBooking,
  getUserBookings,
  getBookingsByTour,
  deleteBooking
};
