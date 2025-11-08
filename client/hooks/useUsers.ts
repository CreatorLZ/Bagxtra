import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { UserRole } from '@/types/auth';
import { useCallback, useState, useEffect } from 'react';

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

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  country?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Custom hook for fetching users (admin only) with enhanced error handling and offline support
 */
export const useUsers = (page = 1, limit = 10) => {
  const { getToken } = useAuth();
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [cachedData, setCachedData] = useState<UsersResponse | null>(null);

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
   * Enhanced query function with retry logic
   */
  const queryFn = useCallback(async () => {
    if (isOffline) {
      throw new Error(
        'You are currently offline. Please check your internet connection.'
      );
    }

    let lastError: any = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(
          `${API_URL}/api/auth/users?page=${page}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: 'Request failed',
            message: 'Failed to fetch users',
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
        lastError = error;

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
  }, [getToken, page, limit, isOffline]);

  const query = useQuery<UsersResponse>({
    queryKey: ['users', page, limit],
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // We handle retries manually
    enabled: !isOffline, // Disable query when offline
  });

  // Cache successful responses for offline fallback
  useEffect(() => {
    if (query.data && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `users_cache_${page}_${limit}`,
          JSON.stringify({
            data: query.data,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.warn('Failed to cache users data:', error);
      }
    }
  }, [query.data, page, limit]);

  // Load cached data when offline
  useEffect(() => {
    if (isOffline && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`users_cache_${page}_${limit}`);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Only use cache if it's less than 24 hours old
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setCachedData(data);
          }
        }
      } catch (error) {
        console.warn('Failed to load cached users data:', error);
      }
    }
  }, [isOffline, page, limit]);

  return {
    ...query,
    isOffline,
    // Provide cached data when offline and no fresh data available
    data: query.data || (isOffline ? cachedData : undefined),
    cachedData,
  };
};
