import mongoose from 'mongoose';

const operatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Operator name is required'],
        trim: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, { timestamps: true });

export default mongoose.model('Operator', operatorSchema);
