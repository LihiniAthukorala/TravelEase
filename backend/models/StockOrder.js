import mongoose from 'mongoose';

const stockOrderSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  orderedItems: [{
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampingEquipment',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: false
    },
    notes: String
  }],
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  deliveryDate: {
    type: Date
  },
  isAutoOrder: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  trackingInfo: {
    trackingNumber: String,
    carrier: String,
    trackingUrl: String
  },
  notes: String
});

stockOrderSchema.pre('save', function(next) {
  // Calculate total amount if it's not set
  if (this.orderedItems && this.orderedItems.length > 0) {
    this.totalAmount = this.orderedItems.reduce((total, item) => {
      return total + (item.unitPrice || 0) * item.quantity;
    }, 0);
  }
  next();
});

const StockOrder = mongoose.model('StockOrder', stockOrderSchema);

export default StockOrder;
