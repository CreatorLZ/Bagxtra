'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Types ---
type NotificationType = 'offer_accepted' | 'bag_arrived' | 'added_to_bag';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  actionText: string;
  userAvatar?: string; // Only for 'offer_accepted'
}

// --- Mock Data (Matching Screenshot) ---
const notifications: NotificationItem[] = [
  {
    id: 1,
    type: 'offer_accepted',
    title: 'Adeshina Adewale has accepted your offer',
    actionText: 'View order summary and make payment',
    userAvatar: '/avatar-placeholder.png', // Replace with actual image path
  },
  {
    id: 2,
    type: 'bag_arrived',
    title: 'BAG has arrived!',
    actionText: 'Input Verification code',
  },
  {
    id: 3,
    type: 'added_to_bag',
    title: 'You have added to bag',
    actionText: 'Make Payment',
  },
  {
    id: 4,
    type: 'bag_arrived',
    title: 'BAG has arrived!',
    actionText: 'Input Verification code',
  },
  {
    id: 5,
    type: 'bag_arrived',
    title: 'BAG has arrived!',
    actionText: 'Input Verification code',
  },
];

// --- Helper: Notification Icon/Avatar ---
const NotificationIcon = ({ item }: { item: NotificationItem }) => {
  if (item.type === 'offer_accepted') {
    return (
      <Avatar className='h-12 w-12 rounded-full border border-gray-100'>
        <AvatarImage
          src={item.userAvatar}
          alt='User'
          className='object-cover'
        />
        <AvatarFallback className='rounded-full bg-gray-900 text-white'>
          AA
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className='h-12 w-12 rounded-full bg-[#F3E5F5] flex items-center justify-center'>
      <ShoppingBag className='h-6 w-6 text-[#5B2C6F]' />
    </div>
  );
};

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className='w-full bg-[#F8F9FA] min-h-[80vh] px-6 lg:pr-52 rounded-3xl font-space-grotesk'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <button
            onClick={() => router.back()}
            className='p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors'
          >
            <ChevronLeft className='h-6 w-6 text-gray-700' />
          </button>
          <h1 className='text-xl font-bold text-gray-900'>Notifications</h1>
        </div>

        {/* Notifications List */}
        <div className='space-y-4'>
          {notifications.map(item => (
            <Card
              key={item.id}
              className='p-4 border-none shadow-sm rounded-md bg-white hover:shadow-md transition-shadow cursor-pointer'
            >
              <div className='flex items-start gap-4'>
                {/* Icon or Avatar */}
                <div className='flex-shrink-0 mt-1'>
                  <NotificationIcon item={item} />
                </div>

                {/* Content */}
                <div className='flex-1 space-y-1'>
                  <p className='text-base font-medium text-slate-700 leading-snug'>
                    {item.title}
                  </p>
                  <p className='text-sm font-medium text-[#8E44AD] hover:text-[#7D3C98] transition-colors'>
                    {item.actionText}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
