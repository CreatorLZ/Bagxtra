import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';
import mongoose from 'mongoose';
import { User, UserRole, VALID_USER_ROLES, IUser } from '../models/User.js';
import {
  logAuthEvent,
  SecurityEventType,
  logUnauthorizedAccess,
  logForbiddenAccess,
} from './securityLogger.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        fullName: string;
        email: string;
        role: UserRole;
        phone?: string;
        country?: string;
        profileImage?: string;
      };
    }
  }
}

// Interface for Clerk JWT payload
interface ClerkJWTPayload {
  sub: string; // Clerk user ID
  email?: string;
  fullName?: string;
  // Add other Clerk JWT fields as needed
}

/**
 * Middleware to verify Clerk JWT token and attach user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected - rejecting auth request');
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Service temporarily unavailable - please try again later',
      });
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      console.warn('🔐 Auth middleware: No token provided');
      logAuthEvent(SecurityEventType.UNAUTHORIZED_ACCESS)(req, res, () => {});
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
      return;
    }

    // Verify the JWT token with Clerk
    const payload = (await verifyToken(token, {
      secretKey: process.env['CLERK_SECRET_KEY']!,
      issuer: process.env['CLERK_ISSUER'] || 'https://clerk.clerk.dev',
    })) as ClerkJWTPayload;

    if (!payload.sub) {
      logAuthEvent(SecurityEventType.INVALID_TOKEN_PAYLOAD)(req, res, () => {});
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      });
      return;
    }

    // Find user in database with timeout protection
    const user = await Promise.race([
      User.findByClerkId(payload.sub),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      ),
    ]);

    if (!user) {
      console.warn(
        `🔐 Auth middleware: User not found for Clerk ID: ${payload.sub}`
      );
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    // Attach user to request object
    const userData = user as IUser;
    req.user = {
      id: userData._id.toString(),
      clerkId: userData.clerkId,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      ...(userData.phone && { phone: userData.phone }),
      ...(userData.country && { country: userData.country }),
      ...(userData.profileImage && { profileImage: userData.profileImage }),
    };

    console.log(
      `🔐 Auth middleware: User authenticated - ${(user as IUser).email} (${
        (user as IUser).role
      })`
    );
    logAuthEvent(SecurityEventType.AUTH_SUCCESS)(req, res, () => {});
    next();
  } catch (error) {
    console.error('🔐 Auth middleware error:', error);

    // Handle database timeout specifically
    if (error instanceof Error && error.message === 'Database query timeout') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Service temporarily unavailable - please try again later',
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
};

/**
 * Middleware to authorize users based on roles with enhanced validation
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Validate that allowedRoles contains only valid roles
    const invalidRoles = allowedRoles.filter(
      role => !VALID_USER_ROLES.includes(role)
    );
    if (invalidRoles.length > 0) {
      console.error(
        `🔐 Role authorization: Invalid roles specified: ${invalidRoles.join(
          ', '
        )}`
      );
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Invalid role configuration',
      });
      return;
    }

    if (!req.user) {
      console.warn('🔐 Role authorization: No user attached to request');
      logUnauthorizedAccess(req, res, () => {});
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Validate user role is valid
    if (!VALID_USER_ROLES.includes(req.user.role)) {
      console.error(
        `🔐 Role authorization: User ${req.user.email} has invalid role: ${req.user.role}`
      );
      logAuthEvent(SecurityEventType.SUSPICIOUS_ACTIVITY)(req, res, () => {});
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid user role',
        code: 'INVALID_ROLE',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(
        `🔐 Role authorization: User ${req.user.email} with role ${
          req.user.role
        } denied access. Required: ${allowedRoles.join(', ')}`
      );
      logForbiddenAccess(req, res, () => {});
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    console.log(
      `🔐 Role authorization: Access granted to ${req.user.email} (${
        req.user.role
      }) for roles: ${allowedRoles.join(', ')}`
    );
    next();
  };
};

/**
 * Middleware for admin-only routes with enhanced validation
 */
export const requireAdmin = authorizeRoles('admin');

/**
 * Middleware for vendor or admin routes with enhanced validation
 */
export const requireVendorOrAdmin = authorizeRoles('vendor', 'admin');

/**
 * Middleware for shopper or admin routes
 */
export const requireShopperOrAdmin = authorizeRoles('shopper', 'admin');

/**
 * Middleware for traveler or admin routes
 */
export const requireTravelerOrAdmin = authorizeRoles('traveler', 'admin');

/**
 * Middleware for vendor, traveler, or admin routes
 */
export const requireVendorTravelerOrAdmin = authorizeRoles(
  'vendor',
  'traveler',
  'admin'
);

/**
 * Middleware for shopper, traveler, or admin routes
 */
export const requireShopperTravelerOrAdmin = authorizeRoles(
  'shopper',
  'traveler',
  'admin'
);

/**
 * Middleware for authenticated users (any role) with enhanced validation
 */
export const requireAuth = authenticateToken;

/**
 * Enhanced middleware for role-based permissions with detailed logging
 * @param requiredPermissions Array of permission strings or role-based permissions
 * @param options Additional options for permission checking
 */
export const requirePermissions = (
  requiredPermissions: string[],
  options: {
    requireAll?: boolean;
    logAccess?: boolean;
  } = {}
) => {
  const { requireAll = false, logAccess = true } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      console.warn('🔐 Permission check: No user attached to request');
      logAuthEvent(SecurityEventType.UNAUTHORIZED_ACCESS)(req, res, () => {});
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // Validate user role is valid
    if (!VALID_USER_ROLES.includes(req.user.role)) {
      console.error(
        `🔐 Permission check: User ${req.user.email} has invalid role: ${req.user.role}`
      );
      logAuthEvent(SecurityEventType.SUSPICIOUS_ACTIVITY)(req, res, () => {});
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid user role',
        code: 'INVALID_ROLE',
      });
      return;
    }

    // For now, implement basic role-based permissions
    // In a more complex system, this could check specific permissions
    const userPermissions = getRolePermissions(req.user.role);

    const hasPermission = requireAll
      ? requiredPermissions.every(perm => userPermissions.includes(perm))
      : requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      const message = requireAll
        ? `Missing one or more required permissions: ${requiredPermissions.join(
            ', '
          )}`
        : `Missing required permission (any of): ${requiredPermissions.join(
            ', '
          )}`;

      console.warn(
        `🔐 Permission check: User ${req.user.email} (${req.user.role}) denied access. ${message}`
      );

      if (logAccess) {
        logForbiddenAccess(req, res, () => {});
      }

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions,
        userPermissions,
        userRole: req.user.role,
      });
      return;
    }

    if (logAccess) {
      console.log(
        `🔐 Permission check: Access granted to ${req.user.email} (${
          req.user.role
        }) for permissions: ${requiredPermissions.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Get permissions for a given role
 * This is a basic implementation - in production, this could be more sophisticated
 */
function getRolePermissions(role: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    shopper: [
      'read:own_profile',
      'update:own_profile',
      'create:shopper_request',
      'read:trips',
    ],
    traveler: [
      'read:own_profile',
      'update:own_profile',
      'create:trip',
      'update:own_trip',
      'read:shopper_requests',
    ],
    vendor: [
      'read:own_profile',
      'update:own_profile',
      'create:product',
      'update:own_product',
      'read:orders',
    ],
    admin: ['*'], // Admin has all permissions
  };

  return rolePermissions[role] || [];
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      next();
      return;
    }

    try {
      const payload = (await verifyToken(token, {
        secretKey: process.env['CLERK_SECRET_KEY']!,
        issuer: process.env['CLERK_ISSUER'] || 'https://clerk.clerk.dev',
      })) as ClerkJWTPayload;

      if (payload.sub) {
        const user = await User.findByClerkId(payload.sub);
        if (user) {
          const userData = user as IUser;
          req.user = {
            id: userData._id.toString(),
            clerkId: userData.clerkId,
            fullName: userData.fullName,
            email: userData.email,
            role: userData.role,
            ...(userData.phone && { phone: userData.phone }),
            ...(userData.country && { country: userData.country }),
            ...(userData.profileImage && {
              profileImage: userData.profileImage,
            }),
          };
          console.log(
            `🔐 Optional auth: User authenticated - ${(user as IUser).email}`
          );
        }
      }
    } catch (error) {
      console.warn(
        '🔐 Optional auth: Token verification failed, proceeding without auth'
      );
    }

    next();
  } catch (error) {
    console.warn('🔐 Optional auth: Unexpected error, proceeding without auth');
    next();
  }
};
