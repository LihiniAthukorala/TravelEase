import mongoose from 'mongoose';

// Schema for individual rental items
const rentalItemSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
});

// Rental order schema
const rentalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerDetails: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    idNumber: {
      type: String,
      required: true
    }
  },
  items: [rentalItemSchema],
  pickupTime: {
    type: String,
    default: '10:00'
  },
  specialRequirements: {
    type: String
  },
  paymentDetails: {
    lastFourDigits: String,
    cardHolder: String,
    totalAmount: Number,
    paymentMethod: {
      type: String,
      default: 'Credit Card'
    }
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Virtual for total rental days
rentalSchema.virtual('totalDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for total price
rentalSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => {
    const days = Math.ceil((item.endDate - item.startDate) / (1000 * 60 * 60 * 24));
    return total + (item.pricePerDay * item.quantity * Math.max(1, days));
  }, 0);
});

const Rental = mongoose.model('Rental', rentalSchema);
export default Rental;
