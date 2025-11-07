import { useState, useEffect } from 'react';

interface TravelerDashboardData {
  activeTrips: number;
  pendingRequests: number;
  earningsThisMonth: number;
  totalEarnings: number;
  upcomingTrips: Array<{
    id: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    status: 'upcoming' | 'active' | 'completed';
  }>;
  recentRequests: Array<{
    id: string;
    shopperName: string;
    item: string;
    destination: string;
    reward: number;
    status: 'pending' | 'accepted' | 'delivered';
  }>;
}

export const useTravelerDashboardData = () => {
  const [data, setData] = useState<TravelerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/traveler/dashboard');
        // const data = await response.json();

        // Mock data for now
        const mockData: TravelerDashboardData = {
          activeTrips: 2,
          pendingRequests: 5,
          earningsThisMonth: 1250.0,
          totalEarnings: 8750.0,
          upcomingTrips: [
            {
              id: '1',
              destination: 'London, UK',
              departureDate: '2024-12-15',
              returnDate: '2024-12-30',
              status: 'upcoming',
            },
            {
              id: '2',
              destination: 'New York, USA',
              departureDate: '2025-01-10',
              returnDate: '2025-01-25',
              status: 'upcoming',
            },
          ],
          recentRequests: [
            {
              id: '1',
              shopperName: 'John Doe',
              item: 'iPhone 15 Pro',
              destination: 'London, UK',
              reward: 150.0,
              status: 'pending',
            },
            {
              id: '2',
              shopperName: 'Jane Smith',
              item: 'MacBook Air',
              destination: 'New York, USA',
              reward: 200.0,
              status: 'accepted',
            },
          ],
        };

        setData(mockData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching traveler dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, isLoading, error };
};
