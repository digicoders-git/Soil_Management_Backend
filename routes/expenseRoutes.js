import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from '../controllers/expenseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getExpenses)
  .post(checkPermission('expenses', 'add'), createExpense);

router
  .route('/summary/:siteId')
  .get(getExpenseSummary);

router
  .route('/:id')
  .get(checkPermission('expenses', 'view'), getExpense)
  .put(checkPermission('expenses', 'edit'), updateExpense)
  .delete(checkPermission('expenses', 'delete'), deleteExpense);

export default router;