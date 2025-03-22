import mongoose from 'mongoose';

// Schema for individual cart items
const cartItemSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true
  },
  isRental: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    // Only required if isRental is true
  },
  endDate: {
    type: Date,
    // Only required if isRental is true
  }
});

// Main cart schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to update timestamps
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating total price
cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => {
    if (item.isRental && item.startDate && item.endDate) {
      const days = Math.ceil((item.endDate - item.startDate) / (1000 * 60 * 60 * 24));
      return total + (item.price * item.quantity * Math.max(1, days));
    }
    return total + (item.price * item.quantity);
  }, 0);
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
