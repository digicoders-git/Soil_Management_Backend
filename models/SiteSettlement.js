import mongoose from 'mongoose';

const siteSettlementSchema = new mongoose.Schema({
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
    returnAmount: {
        type: Number,
        required: true,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    },
    machineConditions: {
        type: Map,
        of: String, // e.g., 'good', 'damaged', 'missing'
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

export default mongoose.model('SiteSettlement', siteSettlementSchema);
