import express from 'express';
import { getAllMachineTypes, createMachineType, updateMachineType, deleteMachineType } from '../controllers/machineTypeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router
    .route('/')
    .get(getAllMachineTypes)
    .post(roleMiddleware('superadmin', 'admin'), createMachineType);

router
    .route('/:id')
    .put(roleMiddleware('superadmin', 'admin'), updateMachineType)
    .delete(roleMiddleware('superadmin', 'admin'), deleteMachineType);

export default router;
