'use client';

import { useVendorDashboardData } from '@/hooks/dashboard/useVendorDashboardData';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import EarningsSummary from '@/components/dashboard/EarningsSummary';

export default function VendorDashboardPage() {
  const { data, isLoading, error } = useVendorDashboardData();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <h2 className='text-lg font-semibold text-red-600'>
              Error loading dashboard
            </h2>
            <p className='text-muted-foreground'>Please try again later</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <h2 className='text-lg font-semibold'>No data available</h2>
            <p className='text-muted-foreground'>
              Unable to load dashboard data
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Vendor Dashboard</h1>
          <p className='text-gray-600'>Manage your products and revenue</p>
        </div>

        {/* Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {data.metrics.map((metric, index) => (
            <DashboardCard
              key={index}
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Analytics and Earnings */}
          <div className='lg:col-span-2 space-y-6'>
            <EarningsSummary data={data.earnings} />

            <div className='bg-white rounded-lg border p-6'>
              <h3 className='text-lg font-semibold mb-4'>Product Analytics</h3>
              <AnalyticsChart data={data.productAnalytics} />
            </div>
          </div>

          {/* Right Column - Actions and Activity */}
          <div className='space-y-6'>
            <QuickActions actions={data.quickActions} />

            <RecentActivity activities={data.recentActivities} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
