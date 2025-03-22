import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true
  },
  maintenanceType: {
    type: String,
    enum: ['preventive', 'corrective', 'calibration', 'inspection', 'cleaning', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startDate: Date,
  completionDate: Date,
  estimatedCost: Number,
  actualCost: Number,
  performedBy: String,
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  notes: String,
  attachments: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
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

// Update timestamps on save
maintenanceRecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);

export default MaintenanceRecord;
