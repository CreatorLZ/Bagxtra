import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const updateUserSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  country: z.string().max(100).optional(),
  profileImage: z.string().url().optional(),
});

const registerUserSchema = z.object({
  clerkId: z.string().min(1),
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['shopper', 'traveler', 'vendor', 'admin']).default('shopper'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  country: z.string().max(100).optional(),
  profileImage: z.string().url().optional(),
});

/**
 * Register a new user from Clerk webhook
 */
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Verify webhook signature
    const signature = req.headers['clerk-signature'] as string;
    const webhookSecret = process.env['CLERK_WEBHOOK_SECRET'];

    if (!signature || !webhookSecret) {
      console.error(
        '👤 Webhook signature verification failed: Missing signature or secret'
      );
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature',
      });
      return;
    }

    // Get raw body for signature verification
    const rawBody = req.body as Buffer;

    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Compare signatures
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    ) {
      console.error(
        '👤 Webhook signature verification failed: Signature mismatch'
      );
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature',
      });
      return;
    }

    // Parse JSON body after signature verification
    let payload;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch (error) {
      console.error('👤 Webhook payload parsing failed:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid JSON payload',
      });
      return;
    }

    const validatedData = registerUserSchema.parse(payload);

    // Check if user already exists
    const existingUser = await User.findByClerkId(validatedData.clerkId);
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'User already exists',
      });
      return;
    }

    // Create new user
    const user = new User(validatedData);
    await user.save();

    console.log(`👤 User registered: ${user.email} (${user.role})`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        country: user.country,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
      return;
    }

    console.error('👤 Register user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // User is already attached by auth middleware
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error('👤 Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information',
    });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const validatedData = updateUserSchema.parse(req.body);

    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Update fields
    Object.assign(user, validatedData);
    await user.save();

    console.log(`👤 User profile updated: ${user.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        country: user.country,
        profileImage: user.profileImage,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: error.issues,
      });
      return;
    }

    console.error('👤 Update user profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile',
    });
  }
};

/**
 * Handle password reset (placeholder - Clerk handles this)
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Clerk handles password reset through their dashboard
    // This endpoint can be used for any additional server-side logic
    res.json({
      message: 'Password reset handled by Clerk authentication service',
      note: "Please use Clerk's password reset flow",
    });
  } catch (error) {
    console.error('👤 Reset password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process password reset',
    });
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Check admin role
    if (req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }

    // Validate and parse pagination
    const pageStr = req.query['page'] as string;
    const limitStr = req.query['limit'] as string;
    let page = 1;
    let limit = 10;

    if (pageStr) {
      const p = parseInt(pageStr, 10);
      if (isNaN(p) || p < 1) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid page parameter',
        });
        return;
      }
      page = p;
    }

    if (limitStr) {
      const l = parseInt(limitStr, 10);
      if (isNaN(l) || l < 1 || l > 100) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid limit parameter',
        });
        return;
      }
      limit = l;
    }

    const skip = (page - 1) * limit;

    const users = await User.find()
      .select(
        'fullName email role phone country profileImage createdAt updatedAt _id'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('👤 Get all users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get users',
    });
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Check admin role
    if (req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['shopper', 'traveler', 'vendor', 'admin'].includes(role)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid role',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    console.log(`👤 User role updated: ${user.email} -> ${role}`);

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('👤 Update user role error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role',
    });
  }
};
