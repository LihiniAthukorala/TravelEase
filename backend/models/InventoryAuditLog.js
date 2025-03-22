import mongoose from 'mongoose';

const inventoryAuditLogSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true
  },
  actionType: {
    type: String,
    enum: ['create', 'update', 'delete', 'stock-in', 'stock-out', 'adjust', 'maintenance', 'damage'],
    required: true
  },
  quantityBefore: {
    type: Number,
    required: true
  },
  quantityAfter: {
    type: Number,
    required: true
  },
  statusBefore: String,
  statusAfter: String,
  reference: {
    type: String, // Can be order ID, maintenance ID, etc.
    required: false
  },
  reason: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups by equipment ID and timestamp
inventoryAuditLogSchema.index({ equipment: 1, timestamp: -1 });

const InventoryAuditLog = mongoose.model('InventoryAuditLog', inventoryAuditLogSchema);

export default InventoryAuditLog;
