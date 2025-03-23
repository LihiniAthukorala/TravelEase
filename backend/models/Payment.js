import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['event', 'cart', 'general', 'tour'], // Add 'tour' to the enum array
    required: [true, 'Payment type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount must be a positive number']
  },
  cardDetails: {
    cardNumber: {
      type: String,
      required: [true, 'Card number is required'],
      // Store only last 4 digits for security
      set: (cardNum) => cardNum.slice(-4).padStart(cardNum.length, '*')
    },
    cardHolder: {
      type: String,
      required: [true, 'Card holder name is required'],
      trim: true
    },
    expiryDate: {
      type: String,
      required: [true, 'Card expiry date is required'],
      match: [/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Invalid expiry date format (MM/YY)']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // For event registrations
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    // Only required for event-type payments
    required: function() {
      return this.type === 'event';
    }
  },
  numberOfTickets: {
    type: Number,
    default: 1,
    min: [1, 'Must purchase at least one ticket']
  },
  specialRequirements: {
    type: String,
    default: '',
    trim: true
  },
  // For cart purchases
  items: [{
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampingEquipment'
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);
