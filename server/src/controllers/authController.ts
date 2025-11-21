import { Request, Response } from 'express';
import { User, IUser, VALID_USER_ROLES } from '../models/User';
import { RoleAuditLog } from '../models/RoleAuditLog';
import { z } from 'zod';
import { verifyWebhook } from '@clerk/express/webhooks';
import {
  logAuthEvent,
  SecurityEventType,
} from '../middleware/securityLogger';
import { createErrorResponse } from '../errors';

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
  role: z.enum(VALID_USER_ROLES),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  country: z.string().max(100).optional(),
  profileImage: z.string().url().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(VALID_USER_ROLES),
});

/**
 * Handle Clerk webhooks for user events
 */
export const handleWebhook = async (
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

    // Handle different event types
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data, req, res);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data, req, res);
        break;
      default:
        console.log(`Ignoring webhook event: ${evt.type}`);
        res.status(200).json({ message: 'Event ignored' });
        return;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json(
          createErrorResponse(
            'Validation Error',
            'Invalid input data',
            'VALIDATION_ERROR',
            error.issues
          )
        );
      return;
    }

    console.error('👤 Webhook handler error:', error);
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to process webhook',
          'INTERNAL_ERROR'
        )
      );
  }
};

/**
 * Handle user creation from Clerk webhook
 */
const handleUserCreated = async (
  clerkData: any,
  req: Request,
  res: Response
): Promise<void> => {
  // Extract role from Clerk's unsafeMetadata
  const roleFromMetadata = clerkData.unsafe_metadata?.['role'];
  let role: string;
  if (
    roleFromMetadata &&
    VALID_USER_ROLES.includes(roleFromMetadata as any)
  ) {
    role = roleFromMetadata as string;
  } else {
    console.warn(
      `Invalid or missing role in Clerk metadata for user ${clerkData.id}: ${roleFromMetadata}. Defaulting to 'shopper'.`
    );
    role = 'shopper';
    // Log this as a potential issue for monitoring
    logAuthEvent(SecurityEventType.ROLE_CHANGED)(req, res, () => {});
  }

  const userData = {
    clerkId: clerkData.id,
    fullName:
      `${clerkData.first_name || ''} ${clerkData.last_name || ''}`.trim() ||
      'Unknown User', // Fallback if names are missing
    email: clerkData.email_addresses?.[0]?.email_address || '',
    role,
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

  // Log security event
  logAuthEvent(SecurityEventType.USER_REGISTERED)(req, res, () => {});

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
};

/**
 * Handle user updates from Clerk webhook
 */
const handleUserUpdated = async (
  clerkData: any,
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Find existing user by Clerk ID
    const existingUser = await User.findByClerkId(clerkData.id);
    if (!existingUser) {
      console.warn(`User not found for Clerk ID: ${clerkData.id}`);
      res.status(404).json({
        error: 'Not Found',
        message: 'User does not exist in database',
      });
      return;
    }

    // Prepare update data - only update Clerk-managed fields
    const updateData: Partial<IUser> = {};

    // Update name if changed
    const newFullName = `${clerkData.first_name || ''} ${clerkData.last_name || ''}`.trim();
    if (newFullName && newFullName !== 'Unknown User' && newFullName !== existingUser.fullName) {
      updateData.fullName = newFullName;
    }

    // Update email if changed
    const newEmail = clerkData.email_addresses?.[0]?.email_address;
    if (newEmail && newEmail !== existingUser.email) {
      updateData.email = newEmail;
    }

    // Update phone if changed
    const newPhone = clerkData.phone_numbers?.[0]?.phone_number;
    if (newPhone !== undefined && newPhone !== existingUser.phone) {
      updateData.phone = newPhone || undefined;
    }

    // Update profile image if changed
    const newImageUrl = clerkData.image_url;
    if (newImageUrl !== undefined && newImageUrl !== existingUser.profileImage) {
      updateData.profileImage = newImageUrl || undefined;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        existingUser._id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      console.log(`👤 User profile updated for Clerk ID: ${clerkData.id}`);

      // Log security event
      logAuthEvent(SecurityEventType.USER_UPDATED)(req, res, () => {});

      res.status(200).json({
        message: 'User profile updated successfully',
        user: {
          id: updatedUser._id,
          clerkId: updatedUser.clerkId,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          country: updatedUser.country,
          profileImage: updatedUser.profileImage,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } else {
      console.log(`👤 No changes detected for user Clerk ID: ${clerkData.id}`);
      res.status(200).json({ message: 'No changes to update' });
    }
  } catch (error) {
    console.error('👤 Handle user updated error:', error);
    res.status(500).json(
      createErrorResponse(
        'Internal Server Error',
        'Failed to update user profile',
        'INTERNAL_ERROR'
      )
    );
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
      res
        .status(401)
        .json(
          createErrorResponse(
            'Unauthorized',
            'User not authenticated',
            'AUTH_REQUIRED'
          )
        );
      return;
    }

    const validatedData = updateUserSchema.parse(req.body);

    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      res
        .status(404)
        .json(
          createErrorResponse('Not Found', 'User not found', 'USER_NOT_FOUND')
        );
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
      res
        .status(400)
        .json(
          createErrorResponse(
            'Validation Error',
            'Invalid input data',
            'VALIDATION_ERROR',
            error.issues
          )
        );
      return;
    }

    console.error('👤 Update user profile error:', error);
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to update profile',
          'INTERNAL_ERROR'
        )
      );
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
      res
        .status(401)
        .json(
          createErrorResponse(
            'Unauthorized',
            'User not authenticated',
            'AUTH_REQUIRED'
          )
        );
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
        res
          .status(400)
          .json(
            createErrorResponse(
              'Bad Request',
              'Invalid page parameter',
              'INVALID_PARAMETER'
            )
          );
        return;
      }
      page = p;
    }

    if (limitStr) {
      const l = parseInt(limitStr, 10);
      if (isNaN(l) || l < 1 || l > 100) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'Bad Request',
              'Invalid limit parameter',
              'INVALID_PARAMETER'
            )
          );
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
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to get users',
          'INTERNAL_ERROR'
        )
      );
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
      res
        .status(401)
        .json(
          createErrorResponse(
            'Unauthorized',
            'User not authenticated',
            'AUTH_REQUIRED'
          )
        );
      return;
    }

    // Check admin role
    if (req.user.role !== 'admin') {
      res
        .status(403)
        .json(
          createErrorResponse(
            'Forbidden',
            'Admin access required',
            'INSUFFICIENT_PERMISSIONS'
          )
        );
      return;
    }

    const { userId } = req.params;
    const { role } = req.body;

    // TODO: Allow superadmin to bypass this guard when implemented
    // Prevent admin from changing their own role
    if (req.user.id.toString() === userId) {
      res
        .status(403)
        .json(
          createErrorResponse(
            'Forbidden',
            'Admins cannot modify their own role',
            'SELF_MODIFICATION_NOT_ALLOWED'
          )
        );
      return;
    }

    // Fetch target user to check their current role
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res
        .status(404)
        .json(
          createErrorResponse('Not Found', 'User not found', 'USER_NOT_FOUND')
        );
      return;
    }

    // Prevent regular admins from modifying other admins
    // TODO: Allow superadmin to bypass this guard when implemented
    if (targetUser.role === 'admin') {
      res
        .status(403)
        .json(
          createErrorResponse(
            'Forbidden',
            'Regular admins cannot modify other admin roles',
            'ADMIN_MODIFICATION_NOT_ALLOWED'
          )
        );
      return;
    }

    // Use centralized VALID_USER_ROLES constant for consistent validation
    // This ensures runtime validation matches the UserRole type definition
    if (!VALID_USER_ROLES.includes(role)) {
      res
        .status(400)
        .json(
          createErrorResponse(
            'Validation Error',
            'Invalid role',
            'INVALID_ROLE'
          )
        );
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      res
        .status(404)
        .json(
          createErrorResponse('Not Found', 'User not found', 'USER_NOT_FOUND')
        );
      return;
    }

    // Create audit log entry for role change
    try {
      await RoleAuditLog.create({
        userId: user._id,
        changedBy: req.user.id,
        oldRole: targetUser.role,
        newRole: role,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown',
        reason: 'Admin role update',
        metadata: {
          endpoint: req.path,
          method: req.method,
          adminEmail: req.user.email,
          targetUserEmail: user.email,
        },
      });
    } catch (auditError) {
      console.error('Failed to create role audit log:', auditError);
      // Don't fail the role update if audit logging fails
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
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to update user role',
          'INTERNAL_ERROR'
        )
      );
  }
};

/**
 * Update own role
 */
export const updateOwnRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res
        .status(401)
        .json(
          createErrorResponse(
            'Unauthorized',
            'User not authenticated',
            'AUTH_REQUIRED'
          )
        );
      return;
    }

    // Validate request body
    const validatedData = updateRoleSchema.parse(req.body);
    const { role } = validatedData;

    // Find the current user
    const user = await User.findById(req.user.id);
    if (!user) {
      res
        .status(404)
        .json(
          createErrorResponse('Not Found', 'User not found', 'USER_NOT_FOUND')
        );
      return;
    }

    // Prevent users from changing to admin role
    if (role === 'admin' && user.role !== 'admin') {
      res
        .status(403)
        .json(
          createErrorResponse(
            'Forbidden',
            'Users cannot assign themselves admin role',
            'ADMIN_ROLE_NOT_ALLOWED'
          )
        );
      return;
    }

    // Prevent admins from changing their own role to non-admin
    if (user.role === 'admin' && role !== 'admin') {
      res
        .status(403)
        .json(
          createErrorResponse(
            'Forbidden',
            'Admins cannot change their own role',
            'ADMIN_ROLE_CHANGE_NOT_ALLOWED'
          )
        );
      return;
    }

    // Check if role is actually changing
    if (user.role === role) {
      res
        .status(400)
        .json(
          createErrorResponse(
            'Bad Request',
            'Role is already set to the requested value',
            'ROLE_ALREADY_SET'
          )
        );
      return;
    }

    // Store old role for logging
    const oldRole = user.role;

    // Update the role
    user.role = role;
    await user.save();

    // Create audit log entry for self role change
    try {
      await RoleAuditLog.create({
        userId: user._id,
        changedBy: req.user.id, // Same as userId for self-change
        oldRole,
        newRole: role,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown',
        reason: 'Self role update',
        metadata: {
          endpoint: req.path,
          method: req.method,
          userEmail: user.email,
          isSelfChange: true,
        },
      });
    } catch (auditError) {
      console.error('Failed to create role audit log:', auditError);
      // Don't fail the role update if audit logging fails
    }

    console.log(
      `👤 User updated own role: ${user.email} (${oldRole} -> ${role})`
    );

    // Log the role change event
    logAuthEvent(SecurityEventType.ROLE_CHANGED)(req, res, () => {});

    res.json({
      message: 'Role updated successfully',
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
      res
        .status(400)
        .json(
          createErrorResponse(
            'Validation Error',
            'Invalid input data',
            'VALIDATION_ERROR',
            error.issues
          )
        );
      return;
    }

    console.error('👤 Update own role error:', error);
    res
      .status(500)
      .json(
        createErrorResponse(
          'Internal Server Error',
          'Failed to update role',
          'INTERNAL_ERROR'
        )
      );
  }
};
