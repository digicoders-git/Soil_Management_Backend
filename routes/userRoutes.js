import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(roleMiddleware('superadmin', 'admin'), getUsers)
  .post(roleMiddleware('superadmin', 'admin'), createUser);

router
  .route('/:id')
  .get(getUser)
  .put(roleMiddleware('superadmin', 'admin'), updateUser)
  .delete(roleMiddleware('superadmin', 'admin'), deleteUser);

export default router;