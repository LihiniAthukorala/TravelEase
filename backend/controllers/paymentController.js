import Payment from '../models/Payment.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import CampingEquipment from '../models/CampingEquipment.js';
import mongoose from 'mongoose';

// Submit payment
export const submitPayment = async (req, res) => {
  try {
    const { type, amount, cardDetails, numberOfTickets, specialRequirements, eventId, items } = req.body;
    
    // Validate required fields
    if (!type || !amount || !cardDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Validate type-specific required fields
    if (type === 'event' && !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required for event payments'
      });
    }
    
    if (type === 'cart' && (!items || items.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Items are required for cart payments'
      });
    }

    // Validate card details
    if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required card details'
      });
    }

    // Create base payment object
    const payment = new Payment({
      user: req.user._id,
      type, // Add payment type
      amount,
      cardDetails: {
        // Store only last 4 digits of card number for security
        cardNumber: `XXXX-XXXX-XXXX-${cardDetails.cardNumber.slice(-4)}`,
        cardHolder: cardDetails.cardHolder,
        expiryDate: cardDetails.expiryDate
      },
      status: 'pending' // All payments start as pending until approved by admin
    });

    // Handle different payment types
    if (type === 'event' && eventId) {
      // Validate event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(400).json({
          success: false,
          message: 'Event not found'
        });
      }

      payment.event = eventId;
      payment.numberOfTickets = numberOfTickets || 1;
      payment.specialRequirements = specialRequirements;
      
      // Verify payment amount matches event price * number of tickets
      const expectedAmount = event.price * payment.numberOfTickets;
      if (Math.abs(amount - expectedAmount) > 0.01) { // Allow small difference for floating point
        return res.status(400).json({
          success: false,
          message: `Invalid payment amount. Expected: ${expectedAmount}, Received: ${amount}`
        });
      }
    } 
    else if (type === 'cart' && items && items.length > 0) {
      // Handle cart payment
      payment.items = items;
      
      // Optional: Verify cart items and amount
      // This would require fetching each item and comparing prices
    }

    // Save the payment
    await payment.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully and awaiting approval',
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Payment submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Get pending payments (admin only)
export const getPendingPayments = async (req, res) => {
  try {
    // Only admins can view pending payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view pending payments'
      });
    }

    const payments = await Payment.find({ status: 'pending' })
      .populate('user', 'username email')
      .populate('event', 'title date location price')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments',
      error: error.message
    });
  }
};

// Get all payments (admin only)
export const getAllPayments = async (req, res) => {
  try {
    // Only admins can view all payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view all payments'
      });
    }

    const payments = await Payment.find({})
      .populate('user', 'username email')
      .populate('event', 'title date location price')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Get payment by ID (admin only)
export const getPaymentById = async (req, res) => {
  try {
    // Only admins can view individual payment details
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view payment details'
      });
    }

    const paymentId = req.params.id;
    
    const payment = await Payment.findById(paymentId)
      .populate('user', 'username email')
      .populate('event', 'title date location price');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Approve payment (admin only)
export const approvePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Only admins can approve payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve payments'
      });
    }

    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Payment already ${payment.status}`
      });
    }

    // Handle different payment types
    if (payment.type === 'event') {
      // For event payments, check and update associated event
      const event = await Event.findById(payment.event).session(session);
      if (!event) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'Associated event not found'
        });
      }

      // Check if event is still at capacity
      if (event.attendees.length >= event.capacity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Event is now at full capacity'
        });
      }

      // Add user to event attendees
      if (!event.attendees.includes(payment.user)) {
        event.attendees.push(payment.user);
        await event.save({ session });
      }
    } 
    else if (payment.type === 'cart') {
      // For cart payments, no event to check - just approve the payment
      console.log('Processing cart payment approval');
      // Any cart-specific logic here
    }
    else {
      // For any other payment types
      console.log('Processing general payment approval');
      // Any other payment type specific logic here
    }

    // Update payment status
    payment.status = 'approved';
    await payment.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Payment approved successfully',
      payment: {
        id: payment._id,
        status: payment.status
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment',
      error: error.message
    });
  }
};

// Reject payment (admin only)
export const rejectPayment = async (req, res) => {
  try {
    // Only admins can reject payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject payments'
      });
    }

    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment already ${payment.status}`
      });
    }

    // Update payment status
    payment.status = 'rejected';
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment rejected',
      payment: {
        id: payment._id,
        status: payment.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment',
      error: error.message
    });
  }
};

// Get user's payment history
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('event', 'title date location price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// Update payment (user can edit their pending or rejected payment)
export const updatePayment = async (req, res) => {
  try {
    const { 
      cardNumber, 
      cardHolder, 
      expiryDate,
      numberOfTickets,
      specialRequirements 
    } = req.body;

    const paymentId = req.params.id;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Log for debugging
    console.log('Payment status:', payment.status);
    console.log('User making request:', req.user.id);
    console.log('Payment owner:', payment.user.toString());

    // Allow editing of both pending and rejected payments
    if (payment.status !== 'pending' && payment.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only pending or rejected payments can be edited'
      });
    }

    // Users can only edit their own payments, admins can edit any payment
    if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this payment'
      });
    }

    // Update payment details - only update fields that are provided
    if (cardNumber) payment.cardDetails.cardNumber = cardNumber;
    if (cardHolder) payment.cardDetails.cardHolder = cardHolder;
    if (expiryDate) payment.cardDetails.expiryDate = expiryDate;
    if (numberOfTickets) payment.numberOfTickets = numberOfTickets;
    if (specialRequirements !== undefined) payment.specialRequirements = specialRequirements;
    
    // If payment was rejected, set it back to pending for review
    if (payment.status === 'rejected') {
      payment.status = 'pending';
    }

    const updatedPayment = await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      payment: {
        id: updatedPayment._id,
        status: updatedPayment.status,
        numberOfTickets: updatedPayment.numberOfTickets
      }
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

// Delete payment
export const deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Only allow deletion of pending payments
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be deleted'
      });
    }

    // Users can only delete their own payments, admins can delete any payment
    if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this payment'
      });
    }

    await Payment.findByIdAndDelete(paymentId);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};
