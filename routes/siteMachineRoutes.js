import express from 'express';
import {
  getSitemachines,
  getSiteMachine,
  assignMachine,
  returnMachine,
  purchaseLocalMachine,
  transferMachine
} from '../controllers/siteMachineController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getSitemachines)
  .post(roleMiddleware('superadmin', 'admin'), assignMachine);

router
  .route('/:id')
  .get(getSiteMachine);

router
  .route('/purchase')
  .post(purchaseLocalMachine);

router
  .route('/transfer')
  .post(roleMiddleware('superadmin', 'admin'), transferMachine);

router
  .route('/:id/return')
  .put(returnMachine);

export default router;