import { Router } from 'express';
import {
  registerUser,
  getCurrentUser,
  updateUserProfile,
  resetPassword,
  getAllUsers,
  updateUserRole,
} from '../controllers/authController.js';
import {
  requireAuth,
  requireAdmin,
  authorizeRoles,
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
 * @route POST /api/auth/register
 * @desc Register a new user from Clerk webhook
 * @access Public (called by Clerk webhooks)
 */
router.post(
  '/register',
  sanitizeBody,
  validateBody(
    z.object({
      clerkId: z.string().min(1), // Clerk ID is a string, not email
      fullName: commonSchemas.fullName,
      email: commonSchemas.email,
      role: commonSchemas.role.default('shopper'),
      phone: commonSchemas.phone,
      country: commonSchemas.country,
      profileImage: z.string().url().optional(),
    })
  ),
  registerUser
);

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
 * @desc Handle password reset (Clerk-managed)
 * @access Public
 */
router.post('/reset-password', resetPassword);

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
router.get(
  '/vendor-area',
  requireAuth,
  authorizeRoles('vendor', 'admin'),
  (req, res) => {
    res.json({
      message: 'Welcome to the vendor area!',
      user: req.user,
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
