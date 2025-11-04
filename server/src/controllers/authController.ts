import { Request, Response } from 'express';
import { User, VALID_USER_ROLES } from '../models/User.js';
import { z } from 'zod';
import { verifyWebhook } from '@clerk/express/webhooks';

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
    console.log('🔍 Webhook received - starting verification...');

    // Use Clerk's verifyWebhook function for proper signature verification
    const evt = await verifyWebhook(req);

    console.log('✅ Webhook signature verified successfully');
    console.log(`🔍 Received webhook event: ${evt.type}`);
    console.log('🔍 Webhook data:', JSON.stringify(evt.data, null, 2));

    // Check event type
    if (evt.type !== 'user.created') {
      console.log(`Ignoring webhook event: ${evt.type}`);
      res.status(200).json({ message: 'Event ignored' });
      return;
    }

    // Extract and map data from Clerk's nested payload
    const clerkData = evt.data;
    const userData = {
      clerkId: clerkData.id,
      fullName:
        `${clerkData.first_name || ''} ${clerkData.last_name || ''}`.trim() ||
        'Unknown User', // Fallback if names are missing
      email: clerkData.email_addresses?.[0]?.email_address || '',
      role: 'shopper', // Default or derive based on your logic
      phone: clerkData.phone_numbers?.[0]?.phone_number || undefined,
      country: undefined, // Clerk doesn't provide this by default; set based on your needs
      profileImage: clerkData.image_url || undefined,
    };

    // Validate the mapped data
    const validatedData = registerUserSchema.parse(userData);

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
  _req: Request,
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

    // TODO: Allow superadmin to bypass this guard when implemented
    // Prevent admin from changing their own role
    if (req.user.id.toString() === userId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admins cannot modify their own role',
      });
      return;
    }

    // Fetch target user to check their current role
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Prevent regular admins from modifying other admins
    // TODO: Allow superadmin to bypass this guard when implemented
    if (targetUser.role === 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Regular admins cannot modify other admin roles',
      });
      return;
    }

    // Use centralized VALID_USER_ROLES constant for consistent validation
    // This ensures runtime validation matches the UserRole type definition
    if (!VALID_USER_ROLES.includes(role)) {
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
