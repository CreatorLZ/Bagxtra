import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
  UserRole,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
  ApiError,
} from '@/types/auth';
import { useUser } from './useUser';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Network status detection
const isOnline = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Assume online in SSR
};

// Exponential backoff delay
const getRetryDelay = (attempt: number) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Custom hook for role management operations
 * Provides functions to update user roles with proper error handling, retry logic, and offline detection
 */
export const useRoleManagement = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { user, refetch: refetchUser } = useUser();
  const [isOffline, setIsOffline] = useState(!isOnline());

  // Network status monitoring
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  /**
   * Enhanced mutation function with retry logic
   */
  const createRetryableMutationFn = useCallback(
    (endpoint: string, method: string = 'PUT') =>
      async (variables: { userId?: string; role: UserRole }) => {
        if (!isOnline()) {
          throw new Error(
            'You are currently offline. Please check your internet connection and try again.'
          );
        }

        let lastError: ApiError | null = null;

        for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
          try {
            const token = await getToken();
            if (!token) {
              throw new Error('Authentication required');
            }

            const url = variables.userId
              ? `${API_URL}${endpoint}/${variables.userId}/role`
              : `${API_URL}${endpoint}`;

            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                role: variables.role,
              } as UpdateUserRoleRequest),
            });

            if (!response.ok) {
              const errorData: ApiError = await response.json().catch(() => ({
                error: 'Request failed',
                message: 'An error occurred while updating the user role',
              }));

              // Don't retry on client errors (4xx), only server errors (5xx) or network issues
              if (response.status >= 400 && response.status < 500) {
                throw errorData;
              }

              lastError = errorData;

              // If this isn't the last attempt, wait before retrying
              if (attempt < RETRY_CONFIG.maxRetries) {
                await new Promise(resolve =>
                  setTimeout(resolve, getRetryDelay(attempt))
                );
                continue;
              }

              throw errorData;
            }

            return response.json();
          } catch (error) {
            lastError = error as ApiError;

            // If this is a network error and we have retries left, continue
            if (
              attempt < RETRY_CONFIG.maxRetries &&
              (error as Error).name === 'TypeError'
            ) {
              await new Promise(resolve =>
                setTimeout(resolve, getRetryDelay(attempt))
              );
              continue;
            }

            throw error;
          }
        }

        throw lastError || new Error('Request failed after all retries');
      },
    [getToken]
  );

  /**
   * Update user role mutation with enhanced error handling
   */
  const updateUserRoleMutation = useMutation<
    UpdateUserRoleResponse,
    ApiError,
    { userId: string; role: UserRole }
  >({
    mutationFn: createRetryableMutationFn('/api/admin/users'),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Also refetch the current user data if the updated user is the current user
      if (user?.id === variables.userId) {
        refetchUser();
      }

      console.log(
        `Role updated successfully for user ${variables.userId} to ${variables.role}`
      );
    },
    onError: (error, variables) => {
      console.error(
        `Failed to update role for user ${variables.userId}:`,
        error
      );
    },
  });

  /**
   * Update own role mutation with enhanced error handling
   */
  const updateOwnRoleMutation = useMutation<
    UpdateUserRoleResponse,
    ApiError,
    { role: UserRole }
  >({
    mutationFn: createRetryableMutationFn('/api/auth/role'),
    onSuccess: (data, variables) => {
      // Invalidate and refetch current user data
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Also refetch the current user data to ensure consistency
      refetchUser();

      console.log(`Own role updated successfully to ${variables.role}`);
    },
    onError: (error, variables) => {
      console.error(`Failed to update own role to ${variables.role}:`, error);
    },
  });

  /**
   * Update user role function (admin only)
   */
  const updateUserRole = async (userId: string, role: UserRole) => {
    return updateUserRoleMutation.mutateAsync({ userId, role });
  };

  /**
   * Update own role function
   */
  const updateOwnRole = async (role: UserRole) => {
    return updateOwnRoleMutation.mutateAsync({ role });
  };

  return {
    // Update user role (admin)
    updateUserRole,
    isUpdatingUserRole: updateUserRoleMutation.isPending,
    updateUserRoleError: updateUserRoleMutation.error,
    updateUserRoleSuccess: updateUserRoleMutation.isSuccess,

    // Update own role
    updateOwnRole,
    isUpdatingOwnRole: updateOwnRoleMutation.isPending,
    updateOwnRoleError: updateOwnRoleMutation.error,
    updateOwnRoleSuccess: updateOwnRoleMutation.isSuccess,

    // Combined loading state
    isLoading:
      updateUserRoleMutation.isPending || updateOwnRoleMutation.isPending,

    // Combined error state
    error: updateUserRoleMutation.error || updateOwnRoleMutation.error,

    // Network status
    isOffline,

    // Retry helpers
    retryUpdateUserRole: (userId: string, role: UserRole) =>
      updateUserRoleMutation.mutate({ userId, role }),
    retryUpdateOwnRole: (role: UserRole) =>
      updateOwnRoleMutation.mutate({ role }),
  };
};
