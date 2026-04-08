import mongoose from 'mongoose';

const machineReportSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  machineUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineUnit',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issue: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true
  },

  repairCost: {
    type: Number,
    min: 0,
    default: 0
  },
  estimatedCost: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['reported', 'approved', 'rejected', 'repairing', 'fixed', 'dead'],
    default: 'reported'
  }
}, {
  timestamps: true
});

export default mongoose.model('MachineReport', machineReportSchema);