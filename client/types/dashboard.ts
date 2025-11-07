// Dashboard data types for different user roles

export interface Trend {
  direction: 'up' | 'down';
  percentage: number;
}

export interface Metric {
  title: string;
  value: string | number;
  trend?: Trend;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface Activity {
  id: string;
  description: string;
  timestamp: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface EarningsData {
  total: number;
  monthly: Array<{
    month: string;
    amount: number;
  }>;
  trend: Trend;
}

export interface QuickAction {
  label: string;
  onClick: () => void;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  disabled?: boolean;
}

// Traveler Dashboard Data
export interface TravelerDashboardData {
  metrics: Metric[];
  earnings: EarningsData;
  tripAnalytics: ChartDataPoint[];
  recentActivities: Activity[];
  quickActions: QuickAction[];
}

// Shopper Dashboard Data
export interface ShopperDashboardData {
  metrics: Metric[];
  earnings: EarningsData;
  orderTracking: ChartDataPoint[];
  recentActivities: Activity[];
  quickActions: QuickAction[];
}

// Vendor Dashboard Data
export interface VendorDashboardData {
  metrics: Metric[];
  earnings: EarningsData;
  productAnalytics: ChartDataPoint[];
  recentActivities: Activity[];
  quickActions: QuickAction[];
}

// Admin Dashboard Data
export interface AdminDashboardData {
  metrics: Metric[];
  platformStats: ChartDataPoint[];
  recentActivities: Activity[];
  quickActions: QuickAction[];
}
