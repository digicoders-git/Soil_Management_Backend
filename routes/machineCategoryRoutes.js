import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/machineCategoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.route('/')
  .get(getCategories)
  .post(roleMiddleware('superadmin', 'admin'), createCategory);

router.route('/:id')
  .put(roleMiddleware('superadmin', 'admin'), updateCategory)
  .delete(roleMiddleware('superadmin', 'admin'), deleteCategory);

export default router;
