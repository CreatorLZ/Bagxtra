import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Hook for traveler to accept a pending match
 */
export const useAcceptMatch = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/matches/${matchId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to accept match');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch orders data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Could add success toast notification here
    },
    onError: error => {
      console.error('Accept match error:', error);
      // Could add error toast notification here
    },
  });
};

/**
 * Hook for traveler to reject a pending match
 */
export const useRejectMatch = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      reason,
    }: {
      matchId: string;
      reason?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/matches/${matchId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Rejected by traveler' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject match');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch orders data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Could add success toast notification here
    },
    onError: error => {
      console.error('Reject match error:', error);
      // Could add error toast notification here
    },
  });
};
