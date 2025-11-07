import { useQuery } from '@tanstack/react-query';
import { AdminDashboardData } from '@/types/dashboard';

const mockAdminData: AdminDashboardData = {
  metrics: [
    {
      title: 'Total Users',
      value: 1247,
      trend: { direction: 'up', percentage: 18.5 },
    },
    {
      title: 'Total Transactions',
      value: 5689,
      trend: { direction: 'up', percentage: 24.7 },
    },
    {
      title: 'Platform Revenue',
      value: '$156,890',
      trend: { direction: 'up', percentage: 31.2 },
    },
  ],
  platformStats: [
    { name: 'Users', value: 1247 },
    { name: 'Trips', value: 3421 },
    { name: 'Orders', value: 5689 },
    { name: 'Revenue', value: 156890 },
    { name: 'Active Trips', value: 156 },
    { name: 'Completed', value: 3265 },
  ],
  recentActivities: [
    {
      id: '1',
      description: 'New user registration: John Doe (Traveler)',
      timestamp: '15 min ago',
      type: 'info',
    },
    {
      id: '2',
      description: 'System maintenance completed successfully',
      timestamp: '2 hours ago',
      type: 'success',
    },
    {
      id: '3',
      description: 'Payment dispute resolved for order #7890',
      timestamp: '4 hours ago',
      type: 'warning',
    },
    {
      id: '4',
      description: 'Monthly revenue report generated',
      timestamp: '6 hours ago',
      type: 'info',
    },
    {
      id: '5',
      description: 'New vendor partnership established',
      timestamp: '1 day ago',
      type: 'success',
    },
  ],
  quickActions: [
    {
      label: 'User Management',
      onClick: () => console.log('User management'),
    },
    {
      label: 'System Settings',
      onClick: () => console.log('System settings'),
      variant: 'outline',
    },
    {
      label: 'Generate Reports',
      onClick: () => console.log('Generate reports'),
      variant: 'secondary',
    },
    {
      label: 'View Analytics',
      onClick: () => console.log('View analytics'),
      variant: 'ghost',
    },
  ],
};

export function useAdminDashboardData() {
  return useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: () => Promise.resolve(mockAdminData),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
