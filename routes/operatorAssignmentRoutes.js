import express from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../controllers/operatorAssignmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.route('/')
  .get(getAssignments)
  .post(roleMiddleware('superadmin', 'admin', 'user'), createAssignment);

router.route('/:id')
  .put(roleMiddleware('superadmin', 'admin', 'user'), updateAssignment)
  .delete(roleMiddleware('superadmin', 'admin', 'user'), deleteAssignment);

export default router;
