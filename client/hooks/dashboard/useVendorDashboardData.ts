import { useQuery } from '@tanstack/react-query';
import { VendorDashboardData } from '@/types/dashboard';

const mockVendorData: VendorDashboardData = {
  metrics: [
    {
      title: 'Total Products',
      value: 156,
      trend: { direction: 'up', percentage: 8.2 },
    },
    {
      title: 'Orders This Month',
      value: 89,
      trend: { direction: 'up', percentage: 15.7 },
    },
    {
      title: 'Revenue',
      value: '$12,450',
      trend: { direction: 'up', percentage: 22.3 },
    },
  ],
  earnings: {
    total: 78450,
    trend: { direction: 'up', percentage: 22.3 },
    monthly: [
      { month: 'Jan', amount: 5200 },
      { month: 'Feb', amount: 5800 },
      { month: 'Mar', amount: 6200 },
      { month: 'Apr', amount: 7100 },
      { month: 'May', amount: 7800 },
      { month: 'Jun', amount: 8500 },
      { month: 'Jul', amount: 9200 },
      { month: 'Aug', amount: 8800 },
      { month: 'Sep', amount: 10100 },
      { month: 'Oct', amount: 11200 },
      { month: 'Nov', amount: 12400 },
      { month: 'Dec', amount: 13950 },
    ],
  },
  productAnalytics: [
    { name: 'Electronics', value: 45 },
    { name: 'Clothing', value: 32 },
    { name: 'Books', value: 28 },
    { name: 'Home Goods', value: 22 },
    { name: 'Sports', value: 18 },
    { name: 'Beauty', value: 11 },
  ],
  recentActivities: [
    {
      id: '1',
      description: 'New order received for electronics package',
      timestamp: '30 min ago',
      type: 'info',
    },
    {
      id: '2',
      description: 'Payment confirmed for order #5678',
      timestamp: '2 hours ago',
      type: 'success',
    },
    {
      id: '3',
      description: 'Product listing updated successfully',
      timestamp: '4 hours ago',
      type: 'success',
    },
    {
      id: '4',
      description: 'New shopper request matched',
      timestamp: '6 hours ago',
      type: 'info',
    },
    {
      id: '5',
      description: 'Monthly revenue target achieved',
      timestamp: '1 day ago',
      type: 'success',
    },
  ],
  quickActions: [
    {
      label: 'Add New Product',
      onClick: () => console.log('Add new product'),
    },
    {
      label: 'Manage Inventory',
      onClick: () => console.log('Manage inventory'),
      variant: 'outline',
    },
    {
      label: 'View Orders',
      onClick: () => console.log('View orders'),
      variant: 'secondary',
    },
    {
      label: 'Generate Report',
      onClick: () => console.log('Generate report'),
      variant: 'ghost',
    },
  ],
};

export function useVendorDashboardData() {
  return useQuery<VendorDashboardData>({
    queryKey: ['vendor-dashboard'],
    queryFn: () => Promise.resolve(mockVendorData),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
