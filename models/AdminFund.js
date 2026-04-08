import mongoose from 'mongoose';

const adminFundSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 1
  },
  notes: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('AdminFund', adminFundSchema);
