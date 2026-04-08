import express from 'express';
import { getMovements, requestMovement, approveMovement, completeMovement, saveExitChallan, getExitChallans } from '../controllers/machineMovementController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router
  .route('/')
  .get(getMovements)
  .post(requestMovement);

// Specific routes PEHLE - dynamic /:id routes ke BAAD nahi
router.post('/exit-challan', saveExitChallan);
router.get('/exit-challans', getExitChallans);

// Dynamic routes BAAD mein
router.put('/:id/approve', approveMovement);
router.put('/:id/complete', completeMovement);
router.delete('/:id', async (req, res) => {
  try {
    const MachineMovement = (await import('../models/MachineMovement.js')).default;
    await MachineMovement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
