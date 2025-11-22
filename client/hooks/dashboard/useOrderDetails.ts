import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface OrderDetailsResponse {
  order: {
    id: string;
    status: string;
    matchScore: number;
    createdAt: string;
    priceSummary?: any; // Optional for now, will be properly defined later
  };
  shopper: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    phone?: string;
    country?: string;
  };
  traveler: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    phone?: string;
    country?: string;
  };
  trip: {
    fromCountry: string;
    toCountry: string;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    timezone: string;
    availableCarryOnKg: number;
    availableCheckedKg: number;
    duration: string;
  };
  products: Array<{
    name: string;
    link: string;
    price: number;
    currency: string;
    weight: number;
    quantity: number;
    isFragile: boolean;
    photos: string[];
    colour?: string;
    additionalInfo?: string;
  }>;
  delivery: {
    fromCountry: string;
    toCountry: string;
    startDate?: string;
    endDate?: string;
    pickup: boolean;
    carryOn: boolean;
    storePickup: boolean;
    phone?: string;
    phoneCountry?: string;
  };
}

export function useOrderDetails(orderId: string) {
  const { getToken } = useAuth();

  return useQuery<OrderDetailsResponse>({
    queryKey: ['order-details', orderId],
    queryFn: async (): Promise<OrderDetailsResponse> => {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('authentication')) return false;
      return failureCount < 3;
    },
  });
}