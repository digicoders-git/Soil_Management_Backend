import express from 'express';
import {
    getDailyUpdates,
    createDailyUpdate,
    deleteDailyUpdate
} from '../controllers/dailyUpdateController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getDailyUpdates)
    .post(createDailyUpdate);

router
    .route('/:id')
    .delete(deleteDailyUpdate);

export default router;
