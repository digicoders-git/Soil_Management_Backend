import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  estimatedCost: {
    type: Number,
    required: [true, 'Estimated cost is required'],
    min: 0
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['created', 'machines_assigned', 'supervisor_assigned', 'active', 'in_progress', 'completed', 'cancelled', 'closed'],
    default: 'created'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Site', siteSchema);