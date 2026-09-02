import express from 'express';
import {
  getMachineReports,
  getMachineReport,
  createMachineReport,
  updateMachineReport,
  deleteMachineReport
} from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware, checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getMachineReports)
  .post(checkPermission('report', 'add'), createMachineReport);

router
  .route('/:id')
  .get(checkPermission('report', 'view'), getMachineReport)
  .put(checkPermission('report', 'edit'), updateMachineReport)
  .delete(checkPermission('report', 'delete'), deleteMachineReport);

export default router;