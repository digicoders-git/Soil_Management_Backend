import Operator from '../models/Operator.js';

export const getOperators = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? { adminId: req.user._id } : {};
        const operators = await Operator.find(query).populate('adminId', 'name').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: operators });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createOperator = async (req, res) => {
    try {
        const adminId = req.body.adminId || req.user._id || req.user.id;
        const operator = await Operator.create({
            name: req.body.name,
            adminId
        });
        res.status(201).json({ success: true, data: operator });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOperator = async (req, res) => {
    try {
        const operator = await Operator.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name },
            { new: true, runValidators: true }
        );
        if (!operator) return res.status(404).json({ success: false, message: 'Operator not found' });
        res.status(200).json({ success: true, data: operator });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteOperator = async (req, res) => {
    try {
        const operator = await Operator.findByIdAndDelete(req.params.id);
        if (!operator) return res.status(404).json({ success: false, message: 'Operator not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
