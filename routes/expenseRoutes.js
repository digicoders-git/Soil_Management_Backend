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

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getExpenses)
  .post(createExpense);

router
  .route('/summary/:siteId')
  .get(getExpenseSummary);

router
  .route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

export default router;