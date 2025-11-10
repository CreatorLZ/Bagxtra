import mongoose from 'mongoose';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { ShopperRequest } from '../models/ShopperRequest';
import { Match, MatchStatus } from '../models/Match';
import { IBagItem } from '../models/BagItem';
import { UserRepository } from './repositoryImpl';

export interface TravelerDashboardData {
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: { direction: 'up' | 'down'; percentage: number };
  }>;
  earnings: {
    total: number;
    monthly: Array<{ month: string; amount: number }>;
    trend: { direction: 'up' | 'down'; percentage: number };
  };
  tripAnalytics: Array<{ name: string; value: number }>;
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>;
  quickActions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

export interface ShopperDashboardData {
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: { direction: 'up' | 'down'; percentage: number };
  }>;
  earnings: {
    total: number;
    monthly: Array<{ month: string; amount: number }>;
    trend: { direction: 'up' | 'down'; percentage: number };
  };
  orderTracking: Array<{ name: string; value: number }>;
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>;
  quickActions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

export interface VendorDashboardData {
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: { direction: 'up' | 'down'; percentage: number };
  }>;
  earnings: {
    total: number;
    monthly: Array<{ month: string; amount: number }>;
    trend: { direction: 'up' | 'down'; percentage: number };
  };
  productAnalytics: Array<{ name: string; value: number }>;
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>;
  quickActions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

export interface AdminDashboardData {
  metrics: Array<{
    title: string;
    value: string | number;
    trend?: { direction: 'up' | 'down'; percentage: number };
  }>;
  platformStats: Array<{ name: string; value: number }>;
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>;
  quickActions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
}

export class DashboardService {
  private userRepository: UserRepository;

  // Configurable vendor commission rate (percentage)
  private readonly VENDOR_COMMISSION_RATE = 0.05; // 5% commission per item

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getTravelerDashboard(userId: mongoose.Types.ObjectId): Promise<TravelerDashboardData> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== 'traveler') {
      throw new Error('User not found or not a traveler');
    }

    // Get traveler's trips
    const trips = await Trip.find({ travelerId: userId });

    // Get completed matches for earnings calculation
    const completedMatches = await Match.find({
      travelerId: userId,
      status: MatchStatus.Completed
    }).populate('requestId');

    // Calculate earnings from completed orders
    const totalEarnings = completedMatches.reduce((sum, _match) => {
      // const request = match.requestId as unknown as IShopperRequest;
      // Assuming traveler gets a fixed reward per completed delivery
      // This could be configurable or calculated based on item values
      return sum + 50; // Placeholder: $50 per completed delivery
    }, 0);

    // Calculate monthly earnings for the last 12 months
    const monthlyEarnings = await this.calculateMonthlyEarnings(userId, 'traveler');

    // Get active trips count
    const activeTrips = trips.filter(trip => trip.status === 'open').length;

    // Get pending requests (matches that are pending approval)
    const pendingRequests = await Match.countDocuments({
      travelerId: userId,
      status: MatchStatus.Pending
    });

    // Trip analytics (completed trips over time)
    const tripAnalytics = await this.getTripAnalytics(userId);

    // Recent activities
    const recentActivities = await this.getTravelerRecentActivities(userId);

    return {
      metrics: [
        {
          title: 'Active Trips',
          value: activeTrips,
          trend: { direction: 'up', percentage: 10.5 }, // Placeholder trend
        },
        {
          title: 'Pending Requests',
          value: pendingRequests,
          trend: { direction: 'down', percentage: 5.2 },
        },
        {
          title: 'Total Earnings',
          value: `$${totalEarnings.toFixed(2)}`,
          trend: { direction: 'up', percentage: 15.3 },
        },
        {
          title: 'Completed Deliveries',
          value: completedMatches.length,
          trend: { direction: 'up', percentage: 8.7 },
        },
      ],
      earnings: {
        total: totalEarnings,
        monthly: monthlyEarnings,
        trend: { direction: 'up', percentage: 12.5 },
      },
      tripAnalytics,
      recentActivities,
      quickActions: [
        {
          label: 'Create New Trip',
          onClick: () => console.log('Create new trip'),
        },
        {
          label: 'View Pending Requests',
          onClick: () => console.log('View pending requests'),
          variant: 'outline',
        },
        {
          label: 'Track Deliveries',
          onClick: () => console.log('Track deliveries'),
          variant: 'secondary',
        },
      ],
    };
  }

  async getShopperDashboard(userId: mongoose.Types.ObjectId): Promise<ShopperDashboardData> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== 'shopper') {
      throw new Error('User not found or not a shopper');
    }

    // Get shopper's requests
    const requests = await ShopperRequest.find({ shopperId: userId });

    // Calculate earnings from refunds
    const refundedRequests = requests.filter(req => req.refundAmount && req.refundAmount > 0);
    const totalEarnings = refundedRequests.reduce((sum, req) => sum + (req.refundAmount || 0), 0);

    // Monthly earnings
    const monthlyEarnings = await this.calculateMonthlyEarnings(userId, 'shopper');

    // Order status counts
    const ordersPending = requests.filter(req => req.status === 'open').length;
    const ordersShipped = requests.filter(req => ['matched', 'pending_purchase', 'purchased', 'in_transit'].includes(req.status)).length;
    const ordersDelivered = requests.filter(req => req.status === 'delivered').length;

    // Order tracking analytics
    const orderTracking = await this.getOrderTrackingAnalytics(userId);

    // Recent activities
    const recentActivities = await this.getShopperRecentActivities(userId);

    return {
      metrics: [
        {
          title: 'Orders Pending',
          value: ordersPending,
          trend: { direction: 'down', percentage: 25.0 },
        },
        {
          title: 'Orders Shipped',
          value: ordersShipped,
          trend: { direction: 'up', percentage: 20.0 },
        },
        {
          title: 'Orders Delivered',
          value: ordersDelivered,
          trend: { direction: 'up', percentage: 15.3 },
        },
        {
          title: 'Total Earnings',
          value: `$${totalEarnings.toFixed(2)}`,
          trend: { direction: 'up', percentage: 12.5 },
        },
      ],
      earnings: {
        total: totalEarnings,
        monthly: monthlyEarnings,
        trend: { direction: 'up', percentage: 12.5 },
      },
      orderTracking,
      recentActivities,
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
      ],
    };
  }

  async getVendorDashboard(userId: mongoose.Types.ObjectId): Promise<VendorDashboardData> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== 'vendor') {
      throw new Error('User not found or not a vendor');
    }

    // For vendors, we need to track items they've "sold" through the platform
    // This is a simplified implementation - in reality, vendors would have their own products
    const allRequests = await ShopperRequest.find({}).populate('bagItems');
    const vendorItems = allRequests.flatMap(req =>
      (req.bagItems as IBagItem[]).filter(item =>
        // Placeholder: assume vendor owns items based on some criteria
        // In real implementation, items would have a vendorId field
        item.price > 100 // Simple filter for demo
      )
    );

    // Calculate revenue from commission on items
    const totalRevenue = vendorItems.reduce((sum, item) =>
      sum + (item.price * item.quantity * this.VENDOR_COMMISSION_RATE), 0
    );

    // Monthly revenue
    const monthlyEarnings = await this.calculateMonthlyEarnings(userId, 'vendor');

    // Product analytics
    const productAnalytics = await this.getProductAnalytics(userId);

    // Recent activities
    const recentActivities = await this.getVendorRecentActivities(userId);

    return {
      metrics: [
        {
          title: 'Total Products',
          value: vendorItems.length,
          trend: { direction: 'up', percentage: 8.2 },
        },
        {
          title: 'Orders This Month',
          value: Math.floor(vendorItems.length * 0.3), // Placeholder
          trend: { direction: 'up', percentage: 15.7 },
        },
        {
          title: 'Revenue',
          value: `$${totalRevenue.toFixed(2)}`,
          trend: { direction: 'up', percentage: 22.3 },
        },
      ],
      earnings: {
        total: totalRevenue,
        monthly: monthlyEarnings,
        trend: { direction: 'up', percentage: 22.3 },
      },
      productAnalytics,
      recentActivities,
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
      ],
    };
  }

  async getAdminDashboard(userId: mongoose.Types.ObjectId): Promise<AdminDashboardData> {
    const user = await this.userRepository.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('User not found or not an admin');
    }

    // Platform-wide statistics
    const totalUsers = await User.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const totalOrders = await ShopperRequest.countDocuments();
    const activeTrips = await Trip.countDocuments({ status: 'open' });
    const completedTrips = await Trip.countDocuments({ status: 'completed' });

    // Calculate platform revenue (sum of all commissions)
    const allRequests = await ShopperRequest.find({}).populate('bagItems');
    const platformRevenue = allRequests.reduce((sum, req) => {
      const items = req.bagItems as IBagItem[];
      const itemRevenue = items.reduce((itemSum, item) =>
        itemSum + (item.price * item.quantity * this.VENDOR_COMMISSION_RATE), 0
      );
      return sum + itemRevenue;
    }, 0);

    // Recent activities
    const recentActivities = await this.getAdminRecentActivities();

    return {
      metrics: [
        {
          title: 'Total Users',
          value: totalUsers,
          trend: { direction: 'up', percentage: 18.5 },
        },
        {
          title: 'Total Transactions',
          value: totalOrders,
          trend: { direction: 'up', percentage: 24.7 },
        },
        {
          title: 'Platform Revenue',
          value: `$${platformRevenue.toFixed(2)}`,
          trend: { direction: 'up', percentage: 31.2 },
        },
      ],
      platformStats: [
        { name: 'Users', value: totalUsers },
        { name: 'Trips', value: totalTrips },
        { name: 'Orders', value: totalOrders },
        { name: 'Revenue', value: Math.round(platformRevenue) },
        { name: 'Active Trips', value: activeTrips },
        { name: 'Completed', value: completedTrips },
      ],
      recentActivities,
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
      ],
    };
  }

  private async calculateMonthlyEarnings(
    _userId: mongoose.Types.ObjectId,
    _role: 'traveler' | 'shopper' | 'vendor'
  ): Promise<Array<{ month: string; amount: number }>> {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });

      // Placeholder monthly data - in real implementation, this would query the database
      // for actual earnings in each month
      const amount = Math.floor(Math.random() * 1000) + 500; // Random data for demo
      months.push({ month: monthName, amount });
    }

    return months;
  }

  private async getTripAnalytics(_userId: mongoose.Types.ObjectId): Promise<Array<{ name: string; value: number }>> {
    // Placeholder - would calculate completed trips per week/month
    return [
      { name: 'Week 1', value: 2 },
      { name: 'Week 2', value: 3 },
      { name: 'Week 3', value: 1 },
      { name: 'Week 4', value: 4 },
      { name: 'Week 5', value: 2 },
      { name: 'Week 6', value: 3 },
      { name: 'Week 7', value: 5 },
    ];
  }

  private async getOrderTrackingAnalytics(_userId: mongoose.Types.ObjectId): Promise<Array<{ name: string; value: number }>> {
    // Placeholder - would calculate orders per week
    return [
      { name: 'Week 1', value: 3 },
      { name: 'Week 2', value: 5 },
      { name: 'Week 3', value: 2 },
      { name: 'Week 4', value: 4 },
      { name: 'Week 5', value: 6 },
      { name: 'Week 6', value: 3 },
      { name: 'Week 7', value: 7 },
    ];
  }

  private async getProductAnalytics(_userId: mongoose.Types.ObjectId): Promise<Array<{ name: string; value: number }>> {
    // Placeholder - would analyze product categories
    return [
      { name: 'Electronics', value: 45 },
      { name: 'Clothing', value: 32 },
      { name: 'Books', value: 28 },
      { name: 'Home Goods', value: 22 },
      { name: 'Sports', value: 18 },
      { name: 'Beauty', value: 11 },
    ];
  }

  private async getTravelerRecentActivities(_userId: mongoose.Types.ObjectId): Promise<Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>> {
    // Placeholder - would fetch recent matches, trip updates, etc.
    return [
      {
        id: '1',
        description: 'New delivery request matched for London trip',
        timestamp: '2 hours ago',
        type: 'info',
      },
      {
        id: '2',
        description: 'Payment received for completed delivery',
        timestamp: '1 day ago',
        type: 'success',
      },
      {
        id: '3',
        description: 'Trip to New York completed successfully',
        timestamp: '3 days ago',
        type: 'success',
      },
    ];
  }

  private async getShopperRecentActivities(_userId: mongoose.Types.ObjectId): Promise<Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>> {
    // Placeholder - would fetch recent order updates, refunds, etc.
    return [
      {
        id: '1',
        description: 'Order #1234 shipped to Lagos',
        timestamp: '1 hour ago',
        type: 'info',
      },
      {
        id: '2',
        description: 'Refund processed for cancelled order',
        timestamp: '2 days ago',
        type: 'warning',
      },
      {
        id: '3',
        description: 'New order request submitted',
        timestamp: '1 week ago',
        type: 'info',
      },
    ];
  }

  private async getVendorRecentActivities(_userId: mongoose.Types.ObjectId): Promise<Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>> {
    // Placeholder - would fetch recent orders, product updates, etc.
    return [
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
        description: 'Monthly revenue target achieved',
        timestamp: '1 day ago',
        type: 'success',
      },
    ];
  }

  private async getAdminRecentActivities(): Promise<Array<{
    id: string;
    description: string;
    timestamp: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>> {
    // Placeholder - would fetch recent system events, user registrations, etc.
    return [
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
        description: 'Monthly revenue report generated',
        timestamp: '6 hours ago',
        type: 'info',
      },
    ];
  }
}