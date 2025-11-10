import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { ShopperDashboardData } from '@/types/dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useShopperDashboardData() {
  const { getToken } = useAuth();

  return useQuery<ShopperDashboardData>({
    queryKey: ['shopper-dashboard'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/dashboard/shopper`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch shopper dashboard data');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
