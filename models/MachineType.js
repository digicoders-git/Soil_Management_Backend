import mongoose from 'mongoose';

const machineTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Machine type name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('MachineType', machineTypeSchema);
