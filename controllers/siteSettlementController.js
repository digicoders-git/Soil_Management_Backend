import mongoose from 'mongoose';
import SiteSettlement from '../models/SiteSettlement.js';
import Site from '../models/Site.js';

// @desc    Get all site settlements
// @route   GET /api/site-settlements
// @access  Private
export const getSiteSettlements = async (req, res) => {
    try {
        const { siteId } = req.query;
        let query = {};

        if (siteId) {
            query.siteId = siteId;
        }

        if (req.user.role === 'user') {
            query.userId = req.user.id;
        }

        const settlements = await SiteSettlement.find(query)
            .populate('siteId', 'name address')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const MachineUnit = mongoose.model('MachineUnit');

        for (let i = 0; i < settlements.length; i++) {
            const settlement = settlements[i];
            if (settlement.machineConditions && Object.keys(settlement.machineConditions).length > 0) {
                const machineIds = Object.keys(settlement.machineConditions);
                const machines = await MachineUnit.find({ _id: { $in: machineIds } }).populate('machineTypeId', 'name');

                settlement.returnedmachines = machines.map(m => ({
                    _id: m._id,
                    machineTypeId: m.machineTypeId,
                    serialNumber: m.serialNumber,
                    condition: settlement.machineConditions[m._id.toString()] || 'good'
                }));
            } else {
                settlement.returnedmachines = [];
            }
        }

        res.status(200).json({
            success: true,
            count: settlements.length,
            data: settlements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create a site settlement
// @route   POST /api/site-settlements
// @access  Private (User/Admin)
export const createSiteSettlement = async (req, res) => {
    try {
        const { siteId, returnAmount, notes, machineConditions } = req.body;

        const site = await Site.findById(siteId);
        if (!site) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        if (req.user.role === 'user' && (!site.userId || site.userId.toString() !== req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to submit a settlement for this site'
            });
        }

        // Check if one already exists
        const existing = await SiteSettlement.findOne({ siteId, userId: req.user.id });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A settlement has already been submitted for this site'
            });
        }

        const settlement = await SiteSettlement.create({
            siteId,
            userId: req.user.id,
            returnAmount: returnAmount || 0,
            notes,
            machineConditions
        });

        // The actual return processing and refund will occur ONLY when Admin approves 
        // this settlement in updateSiteSettlement.

        await settlement.populate('siteId', 'name address');
        await settlement.populate('userId', 'name email');

        res.status(201).json({
            success: true,
            data: settlement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update settlement status
// @route   PUT /api/site-settlements/:id
// @access  Private (Admin only)
export const updateSiteSettlement = async (req, res) => {
    try {
        const { status, machineConditions } = req.body;

        let settlement = await SiteSettlement.findById(req.params.id);

        if (!settlement) {
            return res.status(404).json({
                success: false,
                message: 'Settlement not found'
            });
        }

        // Apply admin's updated machine conditions if provided
        let finalConditions = machineConditions || settlement.machineConditions;

        // If transitioning to 'approved', process the returns and refunds
        if (status === 'approved' && settlement.status !== 'approved') {
            const siteId = settlement.siteId;
            const returnAmount = settlement.returnAmount;
            const notes = settlement.notes;

            // --- 1. Return all remaining assigned Machine units ---
            const assignedUnits = await mongoose.model('MachineUnit').find({ currentSiteId: siteId, status: 'assigned' });
            for (const unit of assignedUnits) {
                const condition = finalConditions[unit._id] || 'good';

                // Mark unit as returned/available or sent to repair if damaged
                unit.condition = condition === 'good' ? 'good' : 'damaged';
                unit.status = condition === 'good' ? 'available' : 'repair';
                unit.currentSiteId = null;
                unit.assignedUserId = null;
                unit.preAssignedUserId = null;
                unit.operatorId = null;

                await unit.save();
            }



            // --- 3. Close the site ---
            const site = await Site.findById(siteId);
            if (site) {
                site.status = 'closed';
                await site.save();
            }
        }

        settlement = await SiteSettlement.findByIdAndUpdate(
            req.params.id,
            { status, machineConditions: finalConditions },
            { new: true, runValidators: true }
        ).populate('siteId', 'name address')
            .populate('userId', 'name email');

        res.status(200).json({
            success: true,
            data: settlement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
