import AdminFund from '../models/AdminFund.js';
import User from '../models/User.js';

// @desc    Get all admin funds
// @route   GET /api/admin-funds
// @access  Private (SuperAdmin, Admin)
export const getAdminFunds = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'admin') {
            query.adminId = req.user.id;
        }

        const funds = await AdminFund.find(query)
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: funds.length,
            data: funds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add funds to an admin
// @route   POST /api/admin-funds
// @access  Private (SuperAdmin)
export const addAdminFund = async (req, res) => {
    try {
        const { adminId, amount, notes } = req.body;

        const admin = await User.findById(adminId);
        if (!admin || admin.role !== 'admin') {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const fund = await AdminFund.create({
            adminId,
            amount,
            notes
        });

        res.status(201).json({
            success: true,
            data: fund
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
