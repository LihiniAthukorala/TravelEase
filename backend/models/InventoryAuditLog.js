import mongoose from 'mongoose';

const inventoryAuditLogSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true
  },
  actionType: {
    type: String,
    enum: ['stock-in', 'stock-out', 'update', 'maintenance', 'transfer'],
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
  statusBefore: {
    type: String
  },
  statusAfter: {
    type: String
  },
  reference: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const InventoryAuditLog = mongoose.model('InventoryAuditLog', inventoryAuditLogSchema);

export default InventoryAuditLog;
