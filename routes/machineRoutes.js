import express from 'express';
import {
  getmachines,
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine
} from '../controllers/machineController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getmachines)
  .post(roleMiddleware('superadmin', 'admin'), createMachine);

router
  .route('/:id')
  .get(getMachine)
  .put(roleMiddleware('superadmin', 'admin'), updateMachine)
  .delete(roleMiddleware('superadmin', 'admin'), deleteMachine);

export default router;