import Payment from '../models/Payment.js';
import Tour from '../models/Tour.js';
import mongoose from 'mongoose';

// Submit tour payment
export const submitTourPayment = async (req, res) => {
  try {
    const { 
      amount, 
      cardDetails, 
      numberOfTickets, 
      specialRequirements, 
      eventId,
      customerInfo,
      tourDetails
    } = req.body;
    
    // Validate required fields
    if (!amount || !cardDetails || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Validate card details
    if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required card details'
      });
    }

    // Validate tour exists
    const tour = await Tour.findById(eventId);
    if (!tour) {
      return res.status(400).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Create payment object
    const payment = new Payment({
      user: req.user._id,
      type: 'tour',
      amount,
      cardDetails: {
        // Store only last 4 digits of card number for security
        cardNumber: `XXXX-XXXX-XXXX-${cardDetails.cardNumber.slice(-4)}`,
        cardHolder: cardDetails.cardHolder,
        expiryDate: cardDetails.expiryDate
      },
      status: 'pending', // All payments start as pending until approved by admin
      event: eventId,    // Reference to the tour
      numberOfTickets: numberOfTickets || 1,
      specialRequirements,
      // Store customer info
      customerInfo,
      // Store tour details snapshot
      tourDetails,
      // Additional tour-specific fields
      tourBookingDetails: {
        tourId: eventId,
        tourName: tour.name,
        bookingDate: new Date(),
        persons: numberOfTickets || 1,
      }
    });

    // Save the payment
    await payment.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Tour payment submitted successfully and awaiting approval',
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Tour payment submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process tour payment',
      error: error.message
    });
  }
};

// Get all tour bookings (admin only)
export const getAllTourBookings = async (req, res) => {
  try {
    // Only admins can view all bookings
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view all bookings'
      });
    }

    const bookings = await Payment.find({ type: 'tour' })
      .populate('user', 'username email')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour bookings',
      error: error.message
    });
  }
};

// Get tour bookings by tour ID (admin only)
export const getTourBookingsByTourId = async (req, res) => {
  try {
    const tourId = req.params.tourId;
    
    // Only admins can view bookings by tour
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tour bookings'
      });
    }

    const bookings = await Payment.find({ 
      type: 'tour',
      event: tourId 
    })
      .populate('user', 'username email')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour bookings',
      error: error.message
    });
  }
};

// Get user's tour bookings
export const getUserTourBookings = async (req, res) => {
  try {
    const bookings = await Payment.find({ 
      type: 'tour',
      user: req.user._id 
    })
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your tour bookings',
      error: error.message
    });
  }
};
