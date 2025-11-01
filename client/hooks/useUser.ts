import { useUser as useClerkUser, useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/auth/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Custom hook to get current user from backend API
 * Combines Clerk authentication with our backend user data
 */
export const useUser = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const { getToken } = useAuth();

  // Fetch user data from our backend
  const {
    data: backendUser,
    isLoading: isBackendLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: async (): Promise<User | null> => {
      if (!clerkUser?.id) return null;

      // Get JWT token from Clerk
      const token = await getToken();
      if (!token) return null;

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      return data.user;
    },
    enabled: !!clerkUser?.id && isClerkLoaded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in v5)
  });

  return {
    user: backendUser || null,
    clerkUser,
    isLoading: !isClerkLoaded || isBackendLoading,
    isAuthenticated: !!clerkUser && !!backendUser,
    error,
    refetch,
  };
};
