import mongoose from 'mongoose';

const machineMovementSchema = new mongoose.Schema({
  machineUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineUnit',
    required: true
  },
  fromLocationType: {
    type: String,
    enum: ['store', 'site', 'repair', 'supervisor'],
    required: true
  },
  fromLocationId: {
    type: mongoose.Schema.Types.ObjectId, // siteId or null for store/repair
    default: null
  },
  toLocationType: {
    type: String,
    enum: ['store', 'site', 'repair', 'supervisor'],
    required: true
  },
  toLocationId: {
    type: mongoose.Schema.Types.ObjectId, // siteId or null for store/repair
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    default: null
  },
  assignedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  movementDate: {
    type: Date
  },
  exitChallan: {
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    machines: [{
      machineUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'MachineUnit' },
      machineTypeName: String,
      serialNumber: String,
      status: { type: String, enum: ['returned', 'missing'], default: 'returned' },
      remark: { type: String, default: '' }
    }],
    challanNo: String,
    generatedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

export default mongoose.model('MachineMovement', machineMovementSchema);
