import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface OrderData {
  id: string;
  amount: string;
  item: string;
  details: string;
  timing: string | null;
  additionalInfo: string | null;
}

export interface OrdersResponse {
  accepted: OrderData[];
  pending: OrderData[];
  incoming: OrderData[];
  outgoing: OrderData[];
  completed: OrderData[];
  disputed: OrderData[];
}

export function useOrders() {
  const { getToken } = useAuth();

  return useQuery<OrdersResponse>({
    queryKey: ['orders'],
    queryFn: async (): Promise<OrdersResponse> => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds - orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('authentication')) return false;
      return failureCount < 3;
    },
  });
}