import mongoose from 'mongoose';

const sitemachineschema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
    default: 1
  },
  status: {
    type: String,
    enum: ['assigned', 'returned', 'damaged', 'transferred'],
    default: 'assigned'
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  returnedDate: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('SiteMachine', sitemachineschema);