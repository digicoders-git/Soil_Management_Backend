import mongoose from 'mongoose';

const machineschema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Machine code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0,
    default: 1
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'repair', 'dead'],
    default: 'available'
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Machine', machineschema);