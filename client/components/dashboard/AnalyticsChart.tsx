'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface AnalyticsChartProps {
  data?: Array<{
    name: string;
    value: number;
  }>;
  className?: string;
}

// Mock data
const defaultData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
];

export default function AnalyticsChart({
  data = defaultData,
  className,
}: AnalyticsChartProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-white to-slate-50/50 rounded-xl border border-slate-200/60 shadow-sm p-6',
        className
      )}
    >
      <ResponsiveContainer width='100%' height={350}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id='colorValue' x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='5%'
                stopColor='hsl(var(--primary))'
                stopOpacity={0.3}
              />
              <stop
                offset='95%'
                stopColor='hsl(var(--primary))'
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            className='stroke-slate-200/60'
          />
          <XAxis
            dataKey='name'
            className='text-slate-600'
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            className='text-slate-600'
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              fontSize: '14px',
            }}
          />
          <Area
            type='monotone'
            dataKey='value'
            stroke='hsl(var(--primary))'
            strokeWidth={3}
            fill='url(#colorValue)'
            dot={{
              fill: 'hsl(var(--primary))',
              strokeWidth: 2,
              r: 6,
              stroke: 'white',
            }}
            activeDot={{
              r: 8,
              stroke: 'hsl(var(--primary))',
              strokeWidth: 2,
              fill: 'white',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
