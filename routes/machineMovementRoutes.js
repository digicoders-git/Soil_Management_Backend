import express from 'express';
import { getMovements, requestMovement, approveMovement, completeMovement, saveExitChallan, getExitChallans } from '../controllers/machineMovementController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router
  .route('/')
  .get(checkPermission('stock_movement', 'view'), getMovements)
  .post(checkPermission('stock_movement', 'add'), requestMovement);

// Specific routes PEHLE - dynamic /:id routes ke BAAD nahi
router.post('/exit-challan', checkPermission('stock_movement', 'add'), saveExitChallan);
router.get('/exit-challans', checkPermission('stock_movement', 'view'), getExitChallans);

// Dynamic routes BAAD mein
router.put('/:id/approve', checkPermission('stock_movement', 'edit'), approveMovement);
router.put('/:id/complete', checkPermission('stock_movement', 'edit'), completeMovement);
router.delete('/:id', checkPermission('stock_movement', 'delete'), async (req, res) => {
  try {
    const MachineMovement = (await import('../models/MachineMovement.js')).default;
    await MachineMovement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
