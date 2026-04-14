import DailyUpdate from '../models/DailyUpdate.js';
import Site from '../models/Site.js';

// @desc    Get all daily updates for a site
// @route   GET /api/daily-updates
// @access  Private
export const getDailyUpdates = async (req, res) => {
    try {
        const { siteId } = req.query;
        let query = {};

        if (req.user.role === 'admin') {
            if (siteId) {
                query.siteId = siteId;
            } else {
                const sites = await Site.find({ adminId: req.user.id }).select('_id');
                query.siteId = { $in: sites.map(s => s._id) };
            }
        } else if (req.user.role === 'user') {
            query.userId = req.user.id;
            if (siteId) query.siteId = siteId;
        } else if (req.user.role === 'superadmin') {
            if (siteId) query.siteId = siteId;
        }

        const updates = await DailyUpdate.find(query)
            .populate('siteId', 'name address')
            .populate('userId', 'name email')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: updates.length,
            data: updates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create daily update
// @route   POST /api/daily-updates
// @access  Private (User/Admin)
export const createDailyUpdate = async (req, res) => {
    try {
        const { siteId, date, workDescription, progress, notes } = req.body;

        const site = await Site.findById(siteId);
        if (!site) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        // Check authorization
        if (req.user.role === 'user' && site.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add daily update to this site'
            });
        }

        const update = await DailyUpdate.create({
            siteId,
            userId: req.user.id,
            date: date || new Date(),
            workDescription,
            progress: progress || 0,
            notes
        });

        await update.populate('siteId', 'name address');
        await update.populate('userId', 'name email');

        res.status(201).json({
            success: true,
            data: update
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete daily update
// @route   DELETE /api/daily-updates/:id
// @access  Private (User/Admin)
export const deleteDailyUpdate = async (req, res) => {
    try {
        const update = await DailyUpdate.findById(req.params.id);

        if (!update) {
            return res.status(404).json({
                success: false,
                message: 'Daily update not found'
            });
        }

        // Check authorization
        if (update.userId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this daily update'
            });
        }

        await DailyUpdate.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Daily update deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
