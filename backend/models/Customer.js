import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  company: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['individual', 'business', 'reseller'],
    default: 'individual'
  },
  notes: String,
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockOrder'
  }],
  totalSpent: {
    type: Number,
    default: 0
  },
  isSubscribedToAlerts: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
customerSchema.index({ email: 1 });

// Update the 'updatedAt' field on save
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
