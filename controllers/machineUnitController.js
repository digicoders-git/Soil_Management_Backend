import MachineUnit from '../models/MachineUnit.js';
import Site from '../models/Site.js';
import Expense from '../models/Expense.js';

// @desc    Get all units or by type/site/status
// @route   GET /api/machine-units
// @access  Private
export const getMachineUnits = async (req, res) => {
    try {
        const { machineTypeId, currentSiteId, status, assignedUserId } = req.query;
        let query = {};

        if (machineTypeId) query.machineTypeId = machineTypeId;
        if (currentSiteId) query.currentSiteId = currentSiteId;
        if (assignedUserId) query.assignedUserId = assignedUserId;
        if (status) query.status = status;

        const units = await MachineUnit.find(query)
            .populate('machineTypeId', 'name category description')
            .populate('currentSiteId', 'name address')
            .populate('assignedUserId', 'name')
            .populate('operatorId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: units.length,
            data: units
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create machine unit
// @route   POST /api/machine-units
// @access  Private (Admin only)
export const createMachineUnit = async (req, res) => {
    try {
        const { machineTypeId, serialNumber, purchaseCost, purchaseDate, condition, conditionRemarks, quantity } = req.body;
        const qty = parseInt(quantity) || 1;
        const amcDoc = req.file ? req.file.path.replace(/\\/g, '/') : null;

        if (qty === 1) {
            const existing = await MachineUnit.findOne({ serialNumber });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Machine with this serial number already exists' });
            }
            let initialStatus = 'available';
            if (condition === 'damaged' || condition === 'maintenance') initialStatus = 'repair';
            else if (condition === 'missing') initialStatus = 'missing';
            else if (condition === 'rejected') initialStatus = 'rejected';

            const unit = await MachineUnit.create({
                machineTypeId, serialNumber, purchaseCost, quantity: 1,
                purchaseDate: purchaseDate || Date.now(),
                condition: condition || 'good',
                conditionRemarks: conditionRemarks || null,
                status: initialStatus, currentSiteId: null, amcDocument: amcDoc
            });
            await unit.populate('machineTypeId', 'name category');
            return res.status(201).json({ success: true, data: unit });
        }

        // Bulk create: auto-generate serial numbers as SN-<base>-1, SN-<base>-2 ...
        const units = [];
        let initialStatus = 'available';
        if (condition === 'damaged' || condition === 'maintenance') initialStatus = 'repair';
        else if (condition === 'missing') initialStatus = 'missing';
        else if (condition === 'rejected') initialStatus = 'rejected';

        for (let i = 1; i <= qty; i++) {
            const sn = `${serialNumber}-${i}`;
            const existing = await MachineUnit.findOne({ serialNumber: sn });
            if (existing) continue;
            units.push({
                machineTypeId, serialNumber: sn, purchaseCost, quantity: 1,
                purchaseDate: purchaseDate || Date.now(),
                condition: condition || 'good',
                conditionRemarks: conditionRemarks || null,
                isNewMachine: req.body.isNewMachine !== undefined ? req.body.isNewMachine : true,
                status: initialStatus, currentSiteId: null, amcDocument: amcDoc
            });
        }
        const created = await MachineUnit.insertMany(units);
        return res.status(201).json({ success: true, count: created.length, data: created });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get available units
// @route   GET /api/machine-units/available
export const getAvailableUnits = async (req, res) => {
    try {
        const units = await MachineUnit.find({ status: 'available', assignedUserId: null })
            .populate('machineTypeId', 'name category');

        res.status(200).json({
            success: true,
            data: units
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get units by site
// @route   GET /api/machine-units/site/:siteId
export const getUnitsBySite = async (req, res) => {
    try {
        const SiteMachine = (await import('../models/SiteMachine.js')).default;
        const assignments = await SiteMachine.find({ siteId: req.params.siteId, status: 'assigned' })
            .populate('machineId', 'name code status description');

        const machines = assignments.map(a => ({
            _id: a._id,
            name: a.machineId?.name,
            serialNumber: a.machineId?.code,
            status: a.machineId?.status,
            quantity: a.quantity,
            assignedDate: a.assignedDate,
        }));

        res.status(200).json({ success: true, data: machines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get units by assigned incharge (user)
// @route   GET /api/machine-units/incharge/:userId
export const getUnitsByIncharge = async (req, res) => {
    try {
        const { availableOnly } = req.query;
        const query = { assignedUserId: req.params.userId };
        if (availableOnly === 'true') query.status = 'available';

        const units = await MachineUnit.find(query)
            .populate('machineTypeId', 'name category')
            .populate('operatorId', 'name')
            .populate('currentSiteId', 'name')
            .populate('assignedUserId', 'name');

        res.status(200).json({ success: true, data: units });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update machine unit
// @route   PUT /api/machine-units/:id
// @access  Private (Admin only)
export const updateMachineUnit = async (req, res) => {
    try {
        const { machineTypeId, serialNumber, purchaseCost, purchaseDate, condition, conditionRemarks, quantity } = req.body;
        const validConditions = ['good', 'damaged', 'maintenance', 'missing', 'rejected'];
        const updateData = {};
        if (machineTypeId) updateData.machineTypeId = machineTypeId;
        if (serialNumber) updateData.serialNumber = serialNumber;
        if (purchaseCost) updateData.purchaseCost = purchaseCost;
        if (purchaseDate) updateData.purchaseDate = purchaseDate;
        if (quantity) updateData.quantity = parseInt(quantity);
        if (condition && validConditions.includes(condition)) {
            updateData.condition = condition;
            if (condition === 'damaged' || condition === 'maintenance') {
                updateData.status = 'repair';
            } else if (condition === 'missing') {
                updateData.status = 'missing';
            } else if (condition === 'rejected') {
                updateData.status = 'rejected';
            } else if (condition === 'good' && ['repair', 'missing', 'rejected'].includes(req.body.status)) {
                // If they explicitly send status, let it override, otherwise leave it or set to available
                // To avoid overriding assigned status when repairing/updating, only do this if needed
            }
        }
        if (conditionRemarks !== undefined) updateData.conditionRemarks = conditionRemarks;
        if (req.file) updateData.amcDocument = req.file.path.replace(/\\/g, '/');

        // Fetch first to safely determine if we should revert status to available
        const currentUnit = await MachineUnit.findById(req.params.id);
        if (!currentUnit) {
            return res.status(404).json({ success: false, message: 'Machine unit not found' });
        }

        if (condition === 'good' && ['repair', 'missing', 'rejected'].includes(currentUnit.status)) {
            updateData.status = 'available';
        }

        const unit = await MachineUnit.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete machine unit
// @route   DELETE /api/machine-units/:id
// @access  Private (Admin only)
export const deleteMachineUnit = async (req, res) => {
    try {
        const unit = await MachineUnit.findById(req.params.id);

        if (!unit) {
            return res.status(404).json({ success: false, message: 'Machine unit not found' });
        }

        if (unit.status !== 'available' && unit.status !== 'maintenance') {
            return res.status(400).json({ success: false, message: 'Cannot delete unit that is currently assigned or in repair.' });
        }

        await unit.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Purchase machine from site
// @route   POST /api/machine-units/purchase
// @access  Private
export const purchaseMachineUnit = async (req, res) => {
    try {
        const { machineTypeId, serialNumber, cost, description, siteId } = req.body;

        // Verify the site exists
        const site = await Site.findById(siteId);
        if (!site) {
            return res.status(404).json({ success: false, message: 'Site not found' });
        }

        // Only assigned users or admin can purchase
        if (req.user.role === 'user' && site.userId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized for this site' });
        }

        // Check unique SN
        const existingSN = await MachineUnit.findOne({ serialNumber });
        if (existingSN) {
            return res.status(400).json({ success: false, message: 'Serial number already exists' });
        }

        // Create the unit directly assigned to the site
        const newUnit = await MachineUnit.create({
            machineTypeId,
            serialNumber,
            purchaseCost: Number(cost),
            status: 'assigned',
            currentSiteId: siteId,
            condition: 'good',
            purchaseDate: new Date(),
        });

        // Add as an expense for the site
        await Expense.create({
            siteId,
            userId: req.user.id,
            amount: Number(cost),
            category: 'other',
            description: `Purchased machine SN: ${serialNumber}. ${description || ''}`,
            date: new Date()
        });

        // Optional: Also update site status to active if still created/machines_assigned
        if (site.status === 'created' || site.status === 'machines_assigned' || site.status === 'supervisor_assigned') {
            site.status = 'active';
            await site.save();
        }

        res.status(201).json({ success: true, data: newUnit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
