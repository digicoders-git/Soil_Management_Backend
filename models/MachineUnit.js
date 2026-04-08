import mongoose from 'mongoose';

const machineUnitSchema = new mongoose.Schema({
    machineTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MachineType',
        required: true
    },
    serialNumber: {
        type: String,
        required: [true, 'Serial number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    purchaseCost: {
        type: Number,
        required: [true, 'Purchase cost is required'],
        min: 0
    },
    status: {
        type: String,
        enum: ['available', 'assigned', 'repair'],
        default: 'available'
    },
    currentSiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        default: null
    },
    assignedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    preAssignedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    condition: {
        type: String,
        enum: ['good', 'damaged', 'maintenance'],
        default: 'good'
    },
    lastMaintenanceDate: {
        type: Date
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    amcDocument: {
        type: String,
        default: null
    },
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        default: null
    },
    isNew: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('MachineUnit', machineUnitSchema);
