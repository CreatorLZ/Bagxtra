import { Router } from 'express';
import {
  getTravelerDashboard,
  getShopperDashboard,
  getVendorDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController.js';
import { requireAuth, authorizeRoles } from '../middleware/auth.js';

const router = Router();

/**
 * @route GET /api/dashboard/traveler
 * @desc Get traveler dashboard data
 * @access Private (Traveler)
 */
router.get(
  '/traveler',
  requireAuth,
  authorizeRoles('traveler'),
  getTravelerDashboard
);

/**
 * @route GET /api/dashboard/shopper
 * @desc Get shopper dashboard data
 * @access Private (Shopper)
 */
router.get(
  '/shopper',
  requireAuth,
  authorizeRoles('shopper'),
  getShopperDashboard
);

/**
 * @route GET /api/dashboard/vendor
 * @desc Get vendor dashboard data
 * @access Private (Vendor)
 */
router.get(
  '/vendor',
  requireAuth,
  authorizeRoles('vendor'),
  getVendorDashboard
);

/**
 * @route GET /api/dashboard/admin
 * @desc Get admin dashboard data
 * @access Private (Admin)
 */
router.get(
  '/admin',
  requireAuth,
  authorizeRoles('admin'),
  getAdminDashboard
);

export default router;