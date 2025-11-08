import { Router } from 'express';
import { updateUserRole } from '../controllers/authController.js';
import {
  getRoleAuditLogs,
  getRoleAuditStats,
} from '../controllers/adminController.js';
import { requireAuth, requirePermissions } from '../middleware/auth.js';
import {
  validateBody,
  validateParams,
  sanitizeBody,
  commonSchemas,
} from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

/**
 * @route PUT /api/admin/users/:userId/role
 * @desc Update user role (admin only)
 * @access Private (Admin)
 */
router.put(
  '/users/:userId/role',
  requireAuth,
  requirePermissions(['*'], { requireAll: false }), // Admin wildcard permission
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
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 * @access Private (Admin)
 */
router.get(
  '/dashboard',
  requireAuth,
  requirePermissions(['*'], { requireAll: false }),
  (req, res) => {
    res.json({
      message: 'Admin dashboard data',
      user: req.user,
      stats: {
        totalUsers: 0, // Would be populated from database
        activeUsers: 0,
        totalTrips: 0,
        totalRevenue: 0,
      },
    });
  }
);

/**
 * @route GET /api/admin/security-logs
 * @desc Get security logs (admin only)
 * @access Private (Admin)
 */
router.get(
  '/security-logs',
  requireAuth,
  requirePermissions(['*'], { requireAll: false }),
  (req, res) => {
    // This would integrate with the security logger
    res.json({
      message: 'Security logs retrieved',
      logs: [], // Would be populated from security logger
    });
  }
);

/**
 * @route GET /api/admin/role-audit-logs
 * @desc Get role audit logs (admin only)
 * @access Private (Admin)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 50, max: 200)
 * @query {string} userId - Filter by user ID
 * @query {string} changedBy - Filter by changer ID
 * @query {string} startDate - Filter from date (ISO format)
 * @query {string} endDate - Filter to date (ISO format)
 */
router.get(
  '/role-audit-logs',
  requireAuth,
  requirePermissions(['*'], { requireAll: false }),
  getRoleAuditLogs
);

/**
 * @route GET /api/admin/role-audit-stats
 * @desc Get role audit statistics (admin only)
 * @access Private (Admin)
 */
router.get(
  '/role-audit-stats',
  requireAuth,
  requirePermissions(['*'], { requireAll: false }),
  getRoleAuditStats
);

export default router;
