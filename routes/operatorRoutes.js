import express from 'express';
import { getOperators, createOperator, updateOperator, deleteOperator } from '../controllers/operatorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.route('/')
    .get(roleMiddleware('superadmin', 'admin', 'user'), getOperators)
    .post(roleMiddleware('superadmin', 'admin', 'user'), createOperator);

router.route('/:id')
    .put(roleMiddleware('superadmin', 'admin'), updateOperator)
    .delete(roleMiddleware('superadmin', 'admin'), deleteOperator);

export default router;
