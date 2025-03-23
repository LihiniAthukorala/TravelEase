import mongoose from 'mongoose';

const reorderConfigSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true,
    unique: true
  },
  threshold: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },
  reorderQuantity: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  },
  autoReorder: {
    type: Boolean,
    default: false
  },
  preferredSupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const ReorderConfig = mongoose.model('ReorderConfig', reorderConfigSchema);

export default ReorderConfig;
