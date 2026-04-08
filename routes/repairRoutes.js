import express from 'express';
import { markAsRepair, markAsFixed } from '../controllers/repairController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/mark-repair', markAsRepair);
router.post('/mark-fixed', markAsFixed);

export default router;
