import mongoose, { Document, Schema } from 'mongoose';

// User roles enum - Single source of truth for all user roles in the system
export type UserRole = 'shopper' | 'traveler' | 'vendor' | 'admin';

/**
 * Runtime constant for UserRole validation
 * Ensures compile-time and runtime type safety are aligned
 * Use this constant instead of hardcoded arrays to maintain consistency
 */
export const VALID_USER_ROLES: readonly UserRole[] = [
  'shopper',
  'traveler',
  'vendor',
  'admin',
] as const;

// User interface for TypeScript
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  clerkId: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  country?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Model interface with static methods
export interface IUserModel extends mongoose.Model<IUser> {
  findByClerkId(clerkId: string): Promise<IUser | null>;
}

// User schema with validation
const userSchema = new Schema<IUser, IUserModel>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['shopper', 'traveler', 'vendor', 'admin'],
      default: 'shopper',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number'],
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    profileImage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware for data sanitization
userSchema.pre('save', function (next) {
  // Sanitize string fields
  if (this.fullName) {
    this.fullName = this.fullName.trim();
  }
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.phone) {
    this.phone = this.phone.trim();
  }
  if (this.country) {
    this.country = this.country.trim();
  }
  if (this.profileImage) {
    this.profileImage = this.profileImage.trim();
  }
  next();
});

// Static method to find user by Clerk ID
userSchema.statics['findByClerkId'] = function (clerkId: string) {
  return this.findOne({ clerkId });
};

// Instance method to check role
userSchema.methods['hasRole'] = function (role: UserRole): boolean {
  return (this as IUser).role === role;
};

// Instance method to check if user has admin privileges
userSchema.methods['isAdmin'] = function (): boolean {
  return (this as IUser).role === 'admin';
};

// Export the model
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
