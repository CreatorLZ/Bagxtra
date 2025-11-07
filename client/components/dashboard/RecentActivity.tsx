'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Package,
  Truck,
  MessageSquare,
  DollarSign,
  User,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  description: string;
  timestamp: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface RecentActivityProps {
  title?: string;
  activities?: Activity[];
  className?: string;
}

// Mock data
const defaultActivities: Activity[] = [
  {
    id: '1',
    description: 'Trip completed successfully',
    timestamp: '2 hours ago',
    type: 'success',
  },
  {
    id: '2',
    description: 'Shipment delivered to customer',
    timestamp: '4 hours ago',
    type: 'info',
  },
  {
    id: '3',
    description: 'New match request received',
    timestamp: '6 hours ago',
    type: 'info',
  },
  {
    id: '4',
    description: 'Payment processed',
    timestamp: '1 day ago',
    type: 'success',
  },
  {
    id: '5',
    description: 'Trip cancelled by shopper',
    timestamp: '2 days ago',
    type: 'warning',
  },
];

const getBadgeVariant = (type?: string) => {
  switch (type) {
    case 'success':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getActivityIcon = (description: string, type?: string) => {
  const lowerDesc = description.toLowerCase();

  if (type === 'success') return CheckCircle;
  if (type === 'warning') return AlertTriangle;
  if (type === 'error') return XCircle;

  if (lowerDesc.includes('trip') || lowerDesc.includes('completed'))
    return MapPin;
  if (lowerDesc.includes('shipment') || lowerDesc.includes('delivered'))
    return Package;
  if (lowerDesc.includes('payment') || lowerDesc.includes('processed'))
    return DollarSign;
  if (lowerDesc.includes('message') || lowerDesc.includes('request'))
    return MessageSquare;
  if (lowerDesc.includes('user') || lowerDesc.includes('match')) return User;
  if (lowerDesc.includes('delivery')) return Truck;

  return Clock; // default
};

const getActivityColor = (type?: string) => {
  switch (type) {
    case 'success':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'warning':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export default function RecentActivity({
  title = 'Recent Activity',
  activities = defaultActivities,
  className,
}: RecentActivityProps) {
  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-white to-slate-50/50 border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
          <div className='p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500'>
            <Clock className='h-4 w-4 text-white' />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {activities.map(activity => {
            const Icon = getActivityIcon(activity.description, activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
                  colorClass
                )}
              >
                <div className='flex-shrink-0 mt-0.5'>
                  <div className='p-2 rounded-lg bg-white/80 shadow-sm'>
                    <Icon className='h-4 w-4' />
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-slate-800 leading-relaxed'>
                    {activity.description}
                  </p>
                </div>

                <div className='flex-shrink-0'>
                  <Badge
                    variant={getBadgeVariant(activity.type)}
                    className='text-xs font-medium px-2 py-1 bg-white/90 text-slate-700 border-slate-300/50'
                  >
                    <Clock className='h-3 w-3 mr-1' />
                    {activity.timestamp}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
