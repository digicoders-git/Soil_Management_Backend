import mongoose from 'mongoose';

const dailyUpdateSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    workDescription: {
        type: String,
        required: [true, 'Work description is required'],
        trim: true
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.model('DailyUpdate', dailyUpdateSchema);
