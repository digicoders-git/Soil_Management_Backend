import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Installment', installmentSchema);