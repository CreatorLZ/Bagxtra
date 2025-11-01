import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { User, UserRole } from '../models/User.js';
import { logAuthEvent, SecurityEventType } from './securityLogger.js';

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
      secretKey: process.env.CLERK_SECRET_KEY,
    })) as ClerkJWTPayload;

    if (!payload.sub) {
      logAuthEvent(SecurityEventType.INVALID_TOKEN_PAYLOAD)(req, res, () => {});
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
      });
      return;
    }

    // Find user in database
    const user = await User.findByClerkId(payload.sub);
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
    req.user = {
      id: user._id.toString(),
      clerkId: user.clerkId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      country: user.country,
      profileImage: user.profileImage,
    };

    console.log(
      `🔐 Auth middleware: User authenticated - ${user.email} (${user.role})`
    );
    logAuthEvent(SecurityEventType.AUTH_SUCCESS)(req, res, () => {});
    next();
  } catch (error) {
    console.error('🔐 Auth middleware error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
};

/**
 * Middleware to authorize users based on roles
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      console.warn('🔐 Role authorization: No user attached to request');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(
        `🔐 Role authorization: User ${req.user.email} with role ${
          req.user.role
        } denied access. Required: ${allowedRoles.join(', ')}`
      );
      logAuthEvent(SecurityEventType.FORBIDDEN_ACCESS)(req, res, () => {});
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    console.log(
      `🔐 Role authorization: Access granted to ${req.user.email} (${req.user.role})`
    );
    next();
  };
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = authorizeRoles('admin');

/**
 * Middleware for vendor or admin routes
 */
export const requireVendorOrAdmin = authorizeRoles('vendor', 'admin');

/**
 * Middleware for authenticated users (any role)
 */
export const requireAuth = authenticateToken;

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
        secretKey: process.env.CLERK_SECRET_KEY,
      })) as ClerkJWTPayload;

      if (payload.sub) {
        const user = await User.findByClerkId(payload.sub);
        if (user) {
          req.user = {
            id: user._id.toString(),
            clerkId: user.clerkId,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            country: user.country,
            profileImage: user.profileImage,
          };
          console.log(`🔐 Optional auth: User authenticated - ${user.email}`);
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
