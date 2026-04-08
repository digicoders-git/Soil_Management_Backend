import express from 'express';
import {
  getMachineReports,
  getMachineReport,
  createMachineReport,
  updateMachineReport,
  deleteMachineReport
} from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getMachineReports)
  .post(createMachineReport);

router
  .route('/:id')
  .get(getMachineReport)
  .put(roleMiddleware('superadmin', 'admin', 'user'), updateMachineReport)
  .delete(roleMiddleware('superadmin', 'admin'), deleteMachineReport);

export default router;