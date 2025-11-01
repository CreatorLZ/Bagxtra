import { useUser } from './useUser';
import { UserRole } from '@/lib/auth/types';

/**
 * Custom hook to get and manage user role
 * Provides role-based utilities and checks
 */
export const useRole = () => {
  const { user, isLoading, isAuthenticated } = useUser();

  const role = user?.role || null;

  /**
   * Check if user has a specific role
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    return role === requiredRole;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.includes(role as UserRole);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return role === 'admin';
  };

  /**
   * Check if user is vendor or admin
   */
  const isVendorOrAdmin = (): boolean => {
    return role === 'vendor' || role === 'admin';
  };

  /**
   * Check if user can access admin features
   */
  const canAccessAdmin = (): boolean => {
    return isAdmin();
  };

  /**
   * Check if user can access vendor features
   */
  const canAccessVendor = (): boolean => {
    return isVendorOrAdmin();
  };

  /**
   * Check if user can access shopper features
   */
  const canAccessShopper = (): boolean => {
    return (
      isAuthenticated &&
      (role === 'shopper' || role === 'traveler' || isVendorOrAdmin())
    );
  };

  /**
   * Check if user can access traveler features
   */
  const canAccessTraveler = (): boolean => {
    return isAuthenticated && (role === 'traveler' || isVendorOrAdmin());
  };

  return {
    role,
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isAdmin,
    isVendorOrAdmin,
    canAccessAdmin,
    canAccessVendor,
    canAccessShopper,
    canAccessTraveler,
  };
};
