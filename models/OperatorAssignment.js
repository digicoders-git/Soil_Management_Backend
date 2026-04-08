import mongoose from 'mongoose';

const operatorAssignmentSchema = new mongoose.Schema({
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operator',
    required: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  machineUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MachineUnit',
    default: null
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    default: null
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('OperatorAssignment', operatorAssignmentSchema);
