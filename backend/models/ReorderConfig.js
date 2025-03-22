import mongoose from 'mongoose';

const reorderConfigSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true
  },
  threshold: {
    type: Number,
    required: true,
    default: 5,
    min: 1
  },
  preferredSupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },
  reorderQuantity: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  },
  autoReorderEnabled: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const ReorderConfig = mongoose.model('ReorderConfig', reorderConfigSchema);

export default ReorderConfig;
