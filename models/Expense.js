import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  category: {
    type: String,
    enum: ['labour', 'transport', 'food', 'repair', 'refund', 'machine_purchase', 'other'],
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Expense', expenseSchema);