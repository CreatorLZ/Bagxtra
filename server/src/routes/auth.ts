import { Router } from 'express';
import {
  registerUser,
  getCurrentUser,
  updateUserProfile,
  resetPassword,
  getAllUsers,
  updateUserRole,
  updateOwnRole,
} from '../controllers/authController.js';
import {
  requireAuth,
  requireAdmin,
  authorizeRoles,
  requireVendorOrAdmin,
  requireShopperOrAdmin,
  requireTravelerOrAdmin,
  requireVendorTravelerOrAdmin,
  requireShopperTravelerOrAdmin,
  requirePermissions,
} from '../middleware/auth.js';
import {
  validateBody,
  validateQuery,
  validateParams,
  sanitizeBody,
  commonSchemas,
} from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();


/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user information
 * @access Private
 */
router.get('/me', requireAuth, getCurrentUser);

/**
 * @route PUT /api/auth/update
 * @desc Update user profile information
 * @access Private
 */
router.put(
  '/update',
  requireAuth,
  sanitizeBody,
  validateBody(
    z.object({
      fullName: commonSchemas.fullName.optional(),
      phone: commonSchemas.phone,
      country: commonSchemas.country,
      profileImage: z.string().url().optional(),
    })
  ),
  updateUserProfile
);

/**
 * @route POST /api/auth/reset-password
 * @desc Handle password reset (deprecated - now handled by Clerk client-side)
 * @access Public
 * @deprecated Use Clerk's client-side password reset flow instead
 */
router.post(
  '/reset-password',
  sanitizeBody,
  validateBody(
    z.object({
      email: commonSchemas.email,
      token: z.string().min(1),
      newPassword: commonSchemas.password,
    })
  ),
  resetPassword
);

/**
 * @route GET /api/auth/users
 * @desc Get all users (admin only)
 * @access Private (Admin)
 */
router.get(
  '/users',
  requireAuth,
  requireAdmin,
  validateQuery(commonSchemas.pagination),
  getAllUsers
);

/**
 * @route PUT /api/auth/users/:userId/role
 * @desc Update user role (admin only)
 * @access Private (Admin)
 */
router.put(
  '/users/:userId/role',
  requireAuth,
  requireAdmin,
  validateParams(commonSchemas.userId),
  sanitizeBody,
  validateBody(
    z.object({
      role: commonSchemas.role,
    })
  ),
  updateUserRole
);

/**
 * @route PUT /api/auth/role
 * @desc Update own role
 * @access Private
 */
router.put(
  '/role',
  requireAuth,
  sanitizeBody,
  validateBody(
    z.object({
      role: commonSchemas.role,
    })
  ),
  updateOwnRole
);

/**
 * @route GET /api/auth/admin-only
 * @desc Example admin-only route
 * @access Private (Admin)
 */
router.get('/admin-only', requireAuth, requireAdmin, (req, res) => {
  res.json({
    message: 'Welcome to the admin area!',
    user: req.user,
  });
});

/**
 * @route GET /api/auth/vendor-area
 * @desc Example vendor or admin route
 * @access Private (Vendor/Admin)
 */
router.get('/vendor-area', requireAuth, requireVendorOrAdmin, (req, res) => {
  res.json({
    message: 'Welcome to the vendor area!',
    user: req.user,
  });
});

/**
 * @route GET /api/auth/shopper-area
 * @desc Example shopper or admin route
 * @access Private (Shopper/Admin)
 */
router.get('/shopper-area', requireAuth, requireShopperOrAdmin, (req, res) => {
  res.json({
    message: 'Welcome to the shopper area!',
    user: req.user,
  });
});

/**
 * @route GET /api/auth/traveler-area
 * @desc Example traveler or admin route
 * @access Private (Traveler/Admin)
 */
router.get(
  '/traveler-area',
  requireAuth,
  requireTravelerOrAdmin,
  (req, res) => {
    res.json({
      message: 'Welcome to the traveler area!',
      user: req.user,
    });
  }
);

/**
 * @route GET /api/auth/multi-role-area
 * @desc Example route requiring specific permissions
 * @access Private (Permission-based)
 */
router.get(
  '/multi-role-area',
  requireAuth,
  requirePermissions(['read:own_profile', 'create:trip'], { requireAll: true }),
  (req, res) => {
    res.json({
      message: 'Welcome to the multi-role area with specific permissions!',
      user: req.user,
      permissions: ['read:own_profile', 'create:trip'],
    });
  }
);

/**
 * @route GET /api/auth/protected
 * @desc Example protected route for any authenticated user
 * @access Private
 */
router.get('/protected', requireAuth, (req, res) => {
  res.json({
    message: 'This is a protected route accessible to all authenticated users',
    user: req.user,
  });
});

export default router;
