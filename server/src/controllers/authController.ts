import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { z } from 'zod';

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
    const validatedData = registerUserSchema.parse(req.body);

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
        details: error.errors,
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
        details: error.errors,
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-__v')
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
