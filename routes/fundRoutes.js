import express from 'express';
import { getAdminFunds, addAdminFund } from '../controllers/adminFundController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router
    .route('/')
    .get(roleMiddleware('superadmin', 'admin'), getAdminFunds)
    .post(roleMiddleware('superadmin'), addAdminFund);

export default router;
