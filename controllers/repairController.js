import MachineUnit from '../models/MachineUnit.js';

// @desc    Mark machine for repair
// @route   POST /api/repairs/mark-repair
export const markAsRepair = async (req, res) => {
    try {
        const { machineUnitId, notes } = req.body;

        const unit = await MachineUnit.findById(machineUnitId);
        if (!unit) {
            return res.status(404).json({ success: false, message: 'Machine unit not found' });
        }

        unit.status = 'repair';
        unit.condition = 'damaged';
        unit.currentSiteId = null;
        unit.assignedUserId = null;
        unit.preAssignedUserId = null;
        unit.operatorId = null;
        await unit.save();

        res.status(200).json({ success: true, message: 'Machine marked for repair', data: unit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark machine as fixed
// @route   POST /api/repairs/mark-fixed
export const markAsFixed = async (req, res) => {
    try {
        const { machineUnitId, cost, notes } = req.body;

        const unit = await MachineUnit.findById(machineUnitId);
        if (!unit) {
            return res.status(404).json({ success: false, message: 'Machine unit not found' });
        }

        unit.status = 'available';
        unit.condition = 'good';
        unit.lastMaintenanceDate = new Date();
        await unit.save();

        res.status(200).json({ success: true, message: 'Machine marked as fixed', data: unit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
