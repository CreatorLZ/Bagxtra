import { useQuery } from '@tanstack/react-query';
import { ShopperDashboardData } from '@/types/dashboard';

const mockShopperData: ShopperDashboardData = {
  metrics: [
    {
      title: 'Orders Pending',
      value: 3,
      trend: { direction: 'down', percentage: 25.0 },
    },
    {
      title: 'Orders Shipped',
      value: 12,
      trend: { direction: 'up', percentage: 20.0 },
    },
    {
      title: 'Orders Delivered',
      value: 89,
      trend: { direction: 'up', percentage: 15.3 },
    },
    {
      title: 'Active Shipments',
      value: 5,
      trend: { direction: 'up', percentage: 10.0 },
    },
  ],
  earnings: {
    total: 15400,
    trend: { direction: 'up', percentage: 12.5 },
    monthly: [
      { month: 'Jan', amount: 1200 },
      { month: 'Feb', amount: 1350 },
      { month: 'Mar', amount: 1100 },
      { month: 'Apr', amount: 1600 },
      { month: 'May', amount: 1800 },
      { month: 'Jun', amount: 1950 },
      { month: 'Jul', amount: 2100 },
      { month: 'Aug', amount: 1850 },
      { month: 'Sep', amount: 2200 },
      { month: 'Oct', amount: 2400 },
      { month: 'Nov', amount: 2600 },
      { month: 'Dec', amount: 2850 },
    ],
  },
  orderTracking: [
    { name: 'Week 1', value: 15 },
    { name: 'Week 2', value: 22 },
    { name: 'Week 3', value: 18 },
    { name: 'Week 4', value: 25 },
    { name: 'Week 5', value: 20 },
    { name: 'Week 6', value: 28 },
    { name: 'Week 7', value: 32 },
  ],
  recentActivities: [
    {
      id: '1',
      description: 'Order #1234 shipped to Lagos',
      timestamp: '1 hour ago',
      type: 'info',
    },
    {
      id: '2',
      description: 'Payment received for order #1233',
      timestamp: '3 hours ago',
      type: 'success',
    },
    {
      id: '3',
      description: 'New order request from Abuja',
      timestamp: '5 hours ago',
      type: 'info',
    },
    {
      id: '4',
      description: 'Order #1232 delivered successfully',
      timestamp: '1 day ago',
      type: 'success',
    },
    {
      id: '5',
      description: 'Refund processed for cancelled order',
      timestamp: '2 days ago',
      type: 'warning',
    },
  ],
  quickActions: [
    {
      label: 'Create New Order',
      onClick: () => console.log('Create new order'),
    },
    {
      label: 'Track Shipments',
      onClick: () => console.log('Track shipments'),
      variant: 'outline',
    },
    {
      label: 'View Order History',
      onClick: () => console.log('View order history'),
      variant: 'secondary',
    },
    {
      label: 'Contact Traveler',
      onClick: () => console.log('Contact traveler'),
      variant: 'ghost',
    },
  ],
};

export function useShopperDashboardData() {
  return useQuery<ShopperDashboardData>({
    queryKey: ['shopper-dashboard'],
    queryFn: () => Promise.resolve(mockShopperData),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
