import { useQuery } from '@tanstack/react-query';
import { TravelerDashboardData } from '@/types/dashboard';

const mockTravelerData: TravelerDashboardData = {
  metrics: [
    {
      title: 'Total Trips',
      value: 47,
      trend: { direction: 'up', percentage: 15.2 },
    },
    {
      title: 'Earnings',
      value: '$2,850',
      trend: { direction: 'up', percentage: 8.7 },
    },
    {
      title: 'Shipments Delivered',
      value: 156,
      trend: { direction: 'up', percentage: 12.1 },
    },
  ],
  earnings: {
    total: 12850,
    trend: { direction: 'up', percentage: 8.7 },
    monthly: [
      { month: 'Jan', amount: 950 },
      { month: 'Feb', amount: 1100 },
      { month: 'Mar', amount: 1250 },
      { month: 'Apr', amount: 1400 },
      { month: 'May', amount: 1600 },
      { month: 'Jun', amount: 1800 },
      { month: 'Jul', amount: 1950 },
      { month: 'Aug', amount: 2100 },
      { month: 'Sep', amount: 1850 },
      { month: 'Oct', amount: 2200 },
      { month: 'Nov', amount: 2400 },
      { month: 'Dec', amount: 2550 },
    ],
  },
  tripAnalytics: [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 15 },
    { name: 'Wed', value: 8 },
    { name: 'Thu', value: 18 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 25 },
    { name: 'Sun', value: 20 },
  ],
  recentActivities: [
    {
      id: '1',
      description: 'Trip completed from Lagos to Abuja',
      timestamp: '2 hours ago',
      type: 'success',
    },
    {
      id: '2',
      description: 'Shipment delivered to customer in Port Harcourt',
      timestamp: '4 hours ago',
      type: 'info',
    },
    {
      id: '3',
      description: 'New trip request matched',
      timestamp: '6 hours ago',
      type: 'info',
    },
    {
      id: '4',
      description: 'Payment received for completed trip',
      timestamp: '1 day ago',
      type: 'success',
    },
    {
      id: '5',
      description: 'Trip rating received: 5 stars',
      timestamp: '2 days ago',
      type: 'success',
    },
  ],
  quickActions: [
    {
      label: 'Start New Trip',
      onClick: () => console.log('Start new trip'),
    },
    {
      label: 'View Available Requests',
      onClick: () => console.log('View requests'),
      variant: 'outline',
    },
    {
      label: 'Update Profile',
      onClick: () => console.log('Update profile'),
      variant: 'secondary',
    },
    {
      label: 'Contact Support',
      onClick: () => console.log('Contact support'),
      variant: 'ghost',
    },
  ],
};

export function useTravelerDashboardData() {
  return useQuery<TravelerDashboardData>({
    queryKey: ['traveler-dashboard'],
    queryFn: () => Promise.resolve(mockTravelerData),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
