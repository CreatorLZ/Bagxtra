'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardCard from './DashboardCard';
import AnalyticsChart from './AnalyticsChart';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarningsData {
  total: number;
  monthly: Array<{
    month: string;
    amount: number;
  }>;
  trend: {
    direction: 'up' | 'down';
    percentage: number;
  };
}

interface EarningsSummaryProps {
  data?: EarningsData;
  className?: string;
}

// Mock data
const defaultData: EarningsData = {
  total: 12500,
  trend: {
    direction: 'up',
    percentage: 12.5,
  },
  monthly: [
    { month: 'Jan', amount: 800 },
    { month: 'Feb', amount: 1200 },
    { month: 'Mar', amount: 950 },
    { month: 'Apr', amount: 1400 },
    { month: 'May', amount: 1600 },
    { month: 'Jun', amount: 1800 },
  ],
};

export default function EarningsSummary({
  data = defaultData,
  className,
}: EarningsSummaryProps) {
  const chartData = data.monthly.map(item => ({
    name: item.month,
    value: item.amount,
  }));

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
          <div className='p-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500'>
            <TrendingUp className='h-4 w-4 text-white' />
          </div>
          Earnings Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <DashboardCard
          title='Total Earnings'
          value={`$${data.total.toLocaleString()}`}
          trend={data.trend}
        />

        <div>
          <h4 className='text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2'>
            <div className='w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full'></div>
            Monthly Breakdown
          </h4>
          <AnalyticsChart data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
}
