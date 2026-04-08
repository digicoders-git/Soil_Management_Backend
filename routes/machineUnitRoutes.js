import express from 'express';
import { getMachineUnits, createMachineUnit, getAvailableUnits, getUnitsBySite, getUnitsByIncharge, updateMachineUnit, deleteMachineUnit, purchaseMachineUnit } from '../controllers/machineUnitController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(authMiddleware);

router
    .route('/')
    .get(getMachineUnits)
    .post(roleMiddleware('superadmin', 'admin'), upload.single('amcDocument'), createMachineUnit);

router.post('/purchase', purchaseMachineUnit);
router.get('/available', getAvailableUnits);
router.get('/site/:siteId', getUnitsBySite);
router.get('/incharge/:userId', getUnitsByIncharge);
router.patch('/:id/operator', roleMiddleware('superadmin', 'admin', 'user'), async (req, res) => {
    try {
        const MachineUnit = (await import('../models/MachineUnit.js')).default;
        const OperatorAssignment = (await import('../models/OperatorAssignment.js')).default;

        const unit = await MachineUnit.findById(req.params.id);
        if (!unit) return res.status(404).json({ success: false, message: 'Machine not found' });

        const today = new Date();

        // Purane active assignment ka endDate set karo
        if (unit.operatorId) {
            await OperatorAssignment.findOneAndUpdate(
                { machineUnitId: req.params.id, operatorId: unit.operatorId, endDate: null },
                { endDate: today }
            );
        }

        // Machine par naya operator set karo
        const newOperatorId = req.body.operatorId || null;
        unit.operatorId = newOperatorId;
        await unit.save();

        // Naya assignment record banao agar operator assign ho raha hai
        if (newOperatorId && req.body.siteId) {
            await OperatorAssignment.create({
                operatorId: newOperatorId,
                siteId: req.body.siteId,
                machineUnitId: req.params.id,
                startDate: today,
                endDate: null,
                adminId: req.user.id
            });
        }

        await unit.populate('operatorId', 'name');
        await unit.populate('machineTypeId', 'name');
        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router
    .route('/:id')
    .put(roleMiddleware('superadmin', 'admin'), upload.single('amcDocument'), updateMachineUnit)
    .delete(roleMiddleware('superadmin', 'admin'), deleteMachineUnit);

export default router;
