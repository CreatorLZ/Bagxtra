import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { MatchData } from '../../shared/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useShopperRequestMatches = (requestId: string | null) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['shopper-request-matches', requestId],
    queryFn: async (): Promise<{ success: boolean; data: MatchData[] }> => {
      if (!requestId) throw new Error('Request ID is required');

      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_URL}/api/shopper-requests/${requestId}/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch matches');
      }

      return response.json();
    },
    enabled: !!requestId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication')) return false;
      return failureCount < 3;
    }
  });
};