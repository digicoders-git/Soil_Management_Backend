import MachineType from '../models/MachineType.js';

// @desc    Get all machine types
// @route   GET /api/machine-types
// @access  Private
export const getAllMachineTypes = async (req, res) => {
    try {
        const types = await MachineType.find()
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: types.length,
            data: types
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create machine type
// @route   POST /api/machine-types
// @access  Private (Admin only)
export const createMachineType = async (req, res) => {
    try {
        req.body.adminId = req.user.id;

        // Check if name already exists
        const existing = await MachineType.findOne({ name: req.body.name });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Machine type with this name already exists'
            });
        }

        const machineType = await MachineType.create(req.body);

        res.status(201).json({
            success: true,
            data: machineType
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update machine type
// @route   PUT /api/machine-types/:id
// @access  Private (Admin only)
export const updateMachineType = async (req, res) => {
    try {
        const type = await MachineType.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!type) {
            return res.status(404).json({ success: false, message: 'Machine type not found' });
        }

        res.status(200).json({ success: true, data: type });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete machine type
// @route   DELETE /api/machine-types/:id
// @access  Private (Admin only)
export const deleteMachineType = async (req, res) => {
    try {
        const type = await MachineType.findById(req.params.id);

        if (!type) {
            return res.status(404).json({ success: false, message: 'Machine type not found' });
        }

        await type.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
