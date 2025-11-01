'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { UserRole } from './types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Handles authentication and role-based access control
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallback,
  redirectTo = '/auth/login',
}) => {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoading: isUserLoading, isAuthenticated } = useUser();
  const {
    hasAnyRole,
    canAccessAdmin,
    canAccessVendor,
    canAccessShopper,
    canAccessTraveler,
  } = useRole();

  // Show loading state while checking authentication
  if (!isAuthLoaded || isUserLoading) {
    return (
      fallback || (
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
            <p className='text-gray-600'>Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn || !isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  // Check role-based access if required roles are specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(requiredRoles)) {
      return (
        fallback || (
          <div className='min-h-screen flex items-center justify-center'>
            <div className='text-center'>
              <h1 className='text-2xl font-bold text-red-600 mb-4'>
                Access Denied
              </h1>
              <p className='text-gray-600 mb-4'>
                You don't have permission to access this page.
              </p>
              <p className='text-sm text-gray-500'>
                Required roles: {requiredRoles.join(', ')}
              </p>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
};

/**
 * Admin-only route wrapper
 */
export const AdminRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute requiredRoles={['admin']} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

/**
 * Vendor or Admin route wrapper
 */
export const VendorRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute requiredRoles={['vendor', 'admin']} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

/**
 * Shopper route wrapper (includes all authenticated users)
 */
export const ShopperRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute fallback={fallback}>{children}</ProtectedRoute>
);

/**
 * Traveler route wrapper
 */
export const TravelerRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute requiredRoles={['traveler', 'admin']} fallback={fallback}>
    {children}
  </ProtectedRoute>
);
