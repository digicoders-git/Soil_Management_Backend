import express from 'express';
import {
    getSiteSettlements,
    createSiteSettlement,
    updateSiteSettlement
} from '../controllers/siteSettlementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getSiteSettlements)
    .post(createSiteSettlement);

router
    .route('/:id')
    .put(updateSiteSettlement);

export default router;
