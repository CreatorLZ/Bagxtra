import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './User.js';

/**
 * Interface for role audit log entry
 */
export interface IRoleAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // The user whose role was changed
  changedBy: mongoose.Types.ObjectId; // The user who made the change (admin or self)
  oldRole: UserRole;
  newRole: UserRole;
  timestamp: Date;
  ip: string;
  userAgent: string;
  reason?: string; // Optional reason for the change
  metadata?: Record<string, any>; // Additional context
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model interface with static methods
 */
export interface IRoleAuditLogModel extends mongoose.Model<IRoleAuditLog> {
  findByUserId(userId: string, limit?: number): Promise<IRoleAuditLog[]>;
  findByChangedBy(changedBy: string, limit?: number): Promise<IRoleAuditLog[]>;
  findRecent(limit?: number): Promise<IRoleAuditLog[]>;
}

/**
 * Role audit log schema
 */
const roleAuditLogSchema = new Schema<IRoleAuditLog, IRoleAuditLogModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    oldRole: {
      type: String,
      enum: ['shopper', 'traveler', 'vendor', 'admin'],
      required: true,
    },
    newRole: {
      type: String,
      enum: ['shopper', 'traveler', 'vendor', 'admin'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound indexes for efficient queries
roleAuditLogSchema.index({ userId: 1, timestamp: -1 });
roleAuditLogSchema.index({ changedBy: 1, timestamp: -1 });
roleAuditLogSchema.index({ timestamp: -1 });

// TTL index for automatic deletion after 7 years (2555 days) for compliance
roleAuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2555 * 24 * 60 * 60 }
);

// Static method to find audit logs by user ID
roleAuditLogSchema.statics['findByUserId'] = function (
  userId: string,
  limit: number = 50
): Promise<IRoleAuditLog[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'fullName email')
    .populate('changedBy', 'fullName email');
};

// Static method to find audit logs by changer ID
roleAuditLogSchema.statics['findByChangedBy'] = function (
  changedBy: string,
  limit: number = 50
): Promise<IRoleAuditLog[]> {
  return this.find({ changedBy })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'fullName email')
    .populate('changedBy', 'fullName email');
};

// Static method to find recent audit logs
roleAuditLogSchema.statics['findRecent'] = function (
  limit: number = 100
): Promise<IRoleAuditLog[]> {
  return this.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'fullName email')
    .populate('changedBy', 'fullName email');
};

// Export the model
export const RoleAuditLog = mongoose.model<IRoleAuditLog, IRoleAuditLogModel>(
  'RoleAuditLog',
  roleAuditLogSchema
);
