import express from 'express';
import { getAllMachineTypes, createMachineType, updateMachineType, deleteMachineType } from '../controllers/machineTypeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware, checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router
    .route('/')
    .get(checkPermission('stock', 'view'), getAllMachineTypes)
    .post(checkPermission('stock', 'add'), createMachineType);

router
    .route('/:id')
    .put(checkPermission('stock', 'edit'), updateMachineType)
    .delete(checkPermission('stock', 'delete'), deleteMachineType);

export default router;
