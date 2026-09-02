import express from 'express';
import {
  getInstallments,
  getInstallment,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  getInstallmentSummary
} from '../controllers/installmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware, checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getInstallments)
  .post(checkPermission('installment', 'add'), createInstallment);

router
  .route('/summary/:siteId')
  .get(getInstallmentSummary);

router
  .route('/:id')
  .get(checkPermission('installment', 'view'), getInstallment)
  .put(checkPermission('installment', 'edit'), updateInstallment)
  .delete(checkPermission('installment', 'delete'), deleteInstallment);

export default router;