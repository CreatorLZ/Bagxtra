import { UserRole } from './types';

/**
 * Role-Based Access Control (RBAC) utilities
 * Defines permissions and access control logic
 */

export interface Permission {
  resource: string;
  action: string;
}

// Define all available permissions
export const PERMISSIONS = {
  // User management
  USER_READ: { resource: 'user', action: 'read' },
  USER_UPDATE: { resource: 'user', action: 'update' },
  USER_DELETE: { resource: 'user', action: 'delete' },

  // Admin permissions
  ADMIN_USERS_READ: { resource: 'admin', action: 'users:read' },
  ADMIN_USERS_UPDATE: { resource: 'admin', action: 'users:update' },
  ADMIN_SYSTEM_CONFIG: { resource: 'admin', action: 'system:config' },

  // Vendor permissions
  VENDOR_SERVICES_MANAGE: { resource: 'vendor', action: 'services:manage' },
  VENDOR_ORDERS_MANAGE: { resource: 'vendor', action: 'orders:manage' },

  // Traveler permissions
  TRAVELER_TRIPS_MANAGE: { resource: 'traveler', action: 'trips:manage' },
  TRAVELER_OFFERS_MANAGE: { resource: 'traveler', action: 'offers:manage' },

  // Shopper permissions
  SHOPPER_ORDERS_MANAGE: { resource: 'shopper', action: 'orders:manage' },
  SHOPPER_REQUESTS_MANAGE: { resource: 'shopper', action: 'requests:manage' },
} as const;

// Role-based permission mappings
const shopperPermissions = [
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_UPDATE,
  PERMISSIONS.SHOPPER_ORDERS_MANAGE,
  PERMISSIONS.SHOPPER_REQUESTS_MANAGE,
];

const travelerPermissions = [
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_UPDATE,
  PERMISSIONS.TRAVELER_TRIPS_MANAGE,
  PERMISSIONS.TRAVELER_OFFERS_MANAGE,
];

const vendorPermissions = [
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_UPDATE,
  PERMISSIONS.VENDOR_SERVICES_MANAGE,
  PERMISSIONS.VENDOR_ORDERS_MANAGE,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  shopper: shopperPermissions,
  traveler: travelerPermissions,
  vendor: vendorPermissions,
  admin: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ADMIN_USERS_READ,
    PERMISSIONS.ADMIN_USERS_UPDATE,
    PERMISSIONS.ADMIN_SYSTEM_CONFIG,
    // Admin inherits all other permissions
    ...shopperPermissions,
    ...travelerPermissions,
    ...vendorPermissions,
  ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (
  role: UserRole,
  permission: Permission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.some(
    p => p.resource === permission.resource && p.action === permission.action
  );
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (
  role: UserRole,
  permissions: Permission[]
): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can access admin features
 */
export const canAccessAdmin = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if user can access vendor features
 */
export const canAccessVendor = (role: UserRole): boolean => {
  return role === 'vendor' || role === 'admin';
};

/**
 * Check if user can access traveler features
 */
export const canAccessTraveler = (role: UserRole): boolean => {
  return role === 'traveler' || role === 'admin';
};

/**
 * Check if user can access shopper features
 */
export const canAccessShopper = (role: UserRole): boolean => {
  return ['shopper', 'traveler', 'vendor', 'admin'].includes(role);
};

/**
 * Get accessible routes based on role
 */
export const getAccessibleRoutes = (role: UserRole): string[] => {
  const routes: string[] = [];

  if (canAccessShopper(role)) {
    routes.push('/dashboard', '/orders', '/requests');
  }

  if (canAccessTraveler(role)) {
    routes.push('/trips', '/offers');
  }

  if (canAccessVendor(role)) {
    routes.push('/services', '/vendor-orders');
  }

  if (canAccessAdmin(role)) {
    routes.push('/admin', '/admin/users', '/admin/system');
  }

  return routes;
};

/**
 * Check if a route is accessible for a given role
 */
export const canAccessRoute = (role: UserRole, route: string): boolean => {
  const accessibleRoutes = getAccessibleRoutes(role);
  return accessibleRoutes.some(accessibleRoute =>
    route.startsWith(accessibleRoute)
  );
};
