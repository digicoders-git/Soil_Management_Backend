import express from 'express';
import {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  addSiteIncharge,
  removeSiteIncharge
} from '../controllers/siteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(getSites)
  .post(roleMiddleware('superadmin', 'admin'), createSite);

router
  .route('/:id')
  .get(getSite)
  .put(roleMiddleware('superadmin', 'admin', 'user'), updateSite)
  .delete(roleMiddleware('superadmin', 'admin'), deleteSite);

router.post('/:id/incharge', roleMiddleware('superadmin', 'admin'), addSiteIncharge);
router.delete('/:id/incharge/:userId', roleMiddleware('superadmin', 'admin'), removeSiteIncharge);

export default router;