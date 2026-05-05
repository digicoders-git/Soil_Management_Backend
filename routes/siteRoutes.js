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
import { roleMiddleware, checkPermission } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router
  .route('/')
  .get(checkPermission('view_all_site', 'view'), getSites)
  .post(checkPermission('create_site', 'add'), createSite);

router
  .route('/:id')
  .get(checkPermission('view_all_site', 'view'), getSite)
  .put(checkPermission('view_all_site', 'edit'), updateSite)
  .delete(checkPermission('view_all_site', 'delete'), deleteSite);

router.post('/:id/incharge', checkPermission('manage_site_incharge', 'add'), addSiteIncharge);
router.delete('/:id/incharge/:userId', checkPermission('manage_site_incharge', 'delete'), removeSiteIncharge);

export default router;