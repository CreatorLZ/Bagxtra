'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Package,
  MapPin,
  MessageSquare,
  Settings,
  CreditCard,
  Truck,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action {
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
  icon?: React.ComponentType<{ className?: string }>;
}

interface QuickActionsProps {
  title?: string;
  actions: Action[];
  className?: string;
}

const getIconForAction = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('trip') || lowerLabel.includes('create')) return Plus;
  if (lowerLabel.includes('package') || lowerLabel.includes('shipment'))
    return Package;
  if (lowerLabel.includes('location') || lowerLabel.includes('track'))
    return MapPin;
  if (lowerLabel.includes('message') || lowerLabel.includes('contact'))
    return MessageSquare;
  if (lowerLabel.includes('setting')) return Settings;
  if (lowerLabel.includes('payment') || lowerLabel.includes('wallet'))
    return CreditCard;
  if (lowerLabel.includes('delivery')) return Truck;
  return UserPlus; // default
};

export default function QuickActions({
  title = 'Quick Actions',
  actions,
  className,
}: QuickActionsProps) {
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
            <Settings className='h-4 w-4 text-white' />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {actions.map((action, index) => {
            const Icon = action.icon || getIconForAction(action.label);
            return (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'default'}
                disabled={action.disabled}
                className={cn(
                  'w-full justify-start gap-3 h-12 font-medium transition-all duration-200',
                  'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100',
                  'border border-blue-200/50 hover:border-blue-300/50',
                  'text-slate-700 hover:text-slate-800',
                  'shadow-sm hover:shadow-md hover:-translate-y-0.5'
                )}
              >
                <Icon className='h-4 w-4 text-blue-600' />
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
