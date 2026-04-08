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
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getInstallments)
  .post(roleMiddleware('superadmin', 'admin'), createInstallment);

router
  .route('/summary/:siteId')
  .get(getInstallmentSummary);

router
  .route('/:id')
  .get(getInstallment)
  .put(roleMiddleware('superadmin', 'admin'), updateInstallment)
  .delete(roleMiddleware('superadmin', 'admin'), deleteInstallment);

export default router;