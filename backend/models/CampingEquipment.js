import mongoose from 'mongoose';

const campingEquipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Tents', 'Sleeping Bags', 'Cooking', 'Lighting', 'Hiking', 'Other']
  },
  image: {
    type: String,
    default: 'default-equipment.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'damaged', 'maintenance', 'retired', 'lost'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair', 'poor'],
    default: 'new'
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenanceScheduled: {
    type: Date
  },
  maintenanceFrequency: {
    type: Number, // in days
    default: 90
  },
  serialNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  barcodeId: {
    type: String,
    sparse: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number
  },
  warrantyExpiryDate: {
    type: Date
  },
  notes: {
    type: String
  }
});

const CampingEquipment = mongoose.model('CampingEquipment', campingEquipmentSchema);
export default CampingEquipment;
