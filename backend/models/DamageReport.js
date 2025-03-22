import mongoose from 'mongoose';

const damageReportSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampingEquipment',
    required: true
  },
  damageType: {
    type: String,
    enum: ['physical', 'water', 'wear-and-tear', 'electrical', 'missing-parts', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  location: String,
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [String],
  status: {
    type: String,
    enum: ['reported', 'inspected', 'repairable', 'unrepairable', 'repaired', 'replaced', 'written-off'],
    default: 'reported'
  },
  maintenanceRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRecord'
  },
  estimatedRepairCost: Number,
  actualRepairCost: Number,
  resolutionNotes: String,
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
damageReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const DamageReport = mongoose.model('DamageReport', damageReportSchema);

export default DamageReport;
