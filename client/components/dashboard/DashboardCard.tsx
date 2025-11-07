'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Package,
  MapPin,
  DollarSign,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const getIconForTitle = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('trip') || lowerTitle.includes('shipment'))
    return Package;
  if (
    lowerTitle.includes('earning') ||
    lowerTitle.includes('revenue') ||
    lowerTitle.includes('payment')
  )
    return DollarSign;
  if (lowerTitle.includes('user') || lowerTitle.includes('customer'))
    return Users;
  if (lowerTitle.includes('active') || lowerTitle.includes('status'))
    return Activity;
  if (lowerTitle.includes('analytics') || lowerTitle.includes('chart'))
    return BarChart3;
  return MapPin; // default
};

export default function DashboardCard({
  title,
  value,
  trend,
  className,
  icon: IconProp,
}: DashboardCardProps) {
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;
  const trendColor =
    trend?.direction === 'up' ? 'text-emerald-600' : 'text-red-600';

  const Icon = IconProp || getIconForTitle(title);

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

      <CardHeader className='pb-3 relative z-10'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors'>
            {title}
          </CardTitle>
          <div className='p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors'>
            <Icon className='h-4 w-4 text-blue-600' />
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative z-10'>
        <div className='flex items-center justify-between'>
          <div className='text-3xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors'>
            {value}
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center text-sm font-medium px-2 py-1 rounded-full bg-white/80 shadow-sm',
                trendColor
              )}
            >
              <TrendIcon className='h-4 w-4 mr-1' />
              <span>{trend.percentage}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
