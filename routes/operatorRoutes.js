import express from 'express';
import { getOperators, createOperator, updateOperator, deleteOperator } from '../controllers/operatorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware, checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.route('/')
    .get(checkPermission('manage_stock_operator', 'view'), getOperators)
    .post(checkPermission('manage_stock_operator', 'add'), createOperator);

router.route('/:id')
    .put(checkPermission('manage_stock_operator', 'edit'), updateOperator)
    .delete(checkPermission('manage_stock_operator', 'delete'), deleteOperator);

export default router;
