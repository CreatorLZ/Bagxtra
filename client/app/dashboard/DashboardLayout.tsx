'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  Package,
  Users,
  Wallet,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Menu,
  HelpCircle,
  LogOut,
  HomeIcon,
  MapPinCheck,
  MapPin,
  User,
  ShoppingBag,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Skeleton } from '@/components/ui/loading-skeleton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Role-specific navigation items
const getNavigationItems = (role: string | null) => {
  const homeHref = role ? `/dashboard/${role}` : '/dashboard';
  const baseItems = [
    { name: 'Home', href: homeHref, icon: HomeIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  switch (role) {
    case 'traveler':
      return [
        { name: 'Home', href: `/dashboard/traveler`, icon: HomeIcon },
        { name: 'Orders', href: '/dashboard/orders', icon: Package },
        { name: 'Trips', href: '/dashboard/trips', icon: Plane },
        { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ];
    case 'shopper':
      return [
        { name: 'Home', href: `/dashboard/shopper`, icon: HomeIcon },
        { name: 'Track', href: '/dashboard/shipments', icon: MapPinCheck },
        { name: 'Orders', href: '/dashboard/orders', icon: Package },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ];
    case 'vendor':
      return [
        { name: 'Overview', href: `/dashboard/vendor`, icon: LayoutDashboard },
        { name: 'Orders', href: '/dashboard/orders', icon: Package },
        { name: 'Transactions', href: '/dashboard/transactions', icon: Wallet },
        { name: 'Disputes', href: '/dashboard/disputes', icon: MessageSquare },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ];
    case 'admin':
      return [
        { name: 'Home', href: `/dashboard/admin`, icon: HomeIcon },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'System', href: '/dashboard/system', icon: Settings },
        {
          name: 'Analytics',
          href: '/dashboard/analytics',
          icon: LayoutDashboard,
        },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ];
    default:
      return baseItems;
  }
};

const generalItems = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
  { name: 'Logout', href: '/logout', icon: LogOut },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { role } = useRole();
  const [bagCount] = useState(3); // Example count, replace with actual data
  const [notificationCount] = useState(5); // Example count, replace with actual data

  const navigationItems = getNavigationItems(role);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/20 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 h-screen z-50 w-64 shadow-xs border-r border-gray-100 transform transition-all duration-300 ease-in-out lg:translate-x-0',
          'bg-white',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex flex-col h-full '>
          {/* Logo/Brand */}
          <div className='flex items-center px-6 h-16 border-b border-gray-100 '>
            <div className='flex items-center space-x-2'>
              {/* <div className='w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center'>
                <span className='text-white text-lg font-bold'>B</span>
              </div> */}
              <h1 className='text-xl font-bold text-purple-900'>BagXtra</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className='flex flex-col h-full px-0 py-6'>
            {/* MENU Section */}
            <div className='flex-1 overflow-y-auto'>
              <div className='space-y-1'>
                <div className='px-3 mb-2 ml-3'>
                  <p className='text-xs font-bold  text-gray-800 uppercase tracking-widest'>
                    MENU
                  </p>
                </div>
                {navigationItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <div key={item.name} className='relative'>
                      {isActive && (
                        <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-purple-900 rounded-r-full' />
                      )}
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2.5 text-sm font-medium rounded-none transition-all duration-150 group',
                          isActive
                            ? ' text-purple-900 font-semibold bg-purple-50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className={cn(
                            'mr-3 ml-3 h-5 w-5',
                            isActive
                              ? 'text-purple-900'
                              : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        {item.name}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Separator */}
            <div className='px-3 my-4'>
              <div className='border-t border-gray-200'></div>
            </div>

            {/* General Section */}
            <div className='space-y-1'>
              <div className='px-3 mb-2 ml-3'>
                <p className='text-xs font-bold  text-gray-800 uppercase tracking-widest'>
                  GENERAL
                </p>
              </div>
              {generalItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <div key={item.name} className='relative'>
                    {isActive && (
                      <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-900 rounded-r-full' />
                    )}
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group',
                        isActive
                          ? 'bg-purple-900 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          'mr-3 ml-3 h-5 w-5',
                          isActive
                            ? 'text-purple-900'
                            : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      {item.name}
                    </Link>
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className='h-screen lg:ml-64 flex flex-col bg-white'>
        {/* Top navbar */}
        <div className='sticky top-0 z-40 bg-white border-b border-gray-200 '>
          <div className='flex items-center justify-between bg-gray-50 m-0 rounded-lg h-16 px-4 sm:px-6 lg:px-8'>
            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='sm'
              className='lg:hidden hover:bg-gray-100'
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className='h-5 w-5' />
            </Button>

            {/* Greeting and Location */}
            <div className='flex-1 max-w-md mx-4'>
              <div className='flex flex-col'>
                <div className='text-sm font-medium text-gray-900'>
                  {isLoaded ? (
                    `Hello, ${user?.firstName || 'User'}`
                  ) : (
                    <Skeleton className='h-4 w-24' />
                  )}
                </div>
                <div className='flex items-center text-xs text-purple-900 mt-1'>
                  <MapPin className='h-4 w-4 mr-1' />
                  Lagos, Nigeria
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className='flex items-center space-x-3'>
              {/* Bag */}

              <Button
                variant='ghost'
                size='sm'
                className='relative rounded-full bg-white shadow-md hover:bg-gray-100'
              >
                <ShoppingBag className='h-6 w-6 text-gray-600' />
                {bagCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-purple-900 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                    {bagCount > 9 ? '9+' : bagCount}
                  </span>
                )}
              </Button>
              {/* Notifications */}
              <Button
                variant='ghost'
                size='sm'
                className='relative bg-white rounded-full shadow-md hover:bg-gray-100 mr-7'
              >
                <Bell className='h-6 w-6 text-gray-600' />
                {notificationCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-purple-900 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>

              {/* User info and button */}
              <div className='flex items-center space-x-3'>
                <div className='flex items-center'>
                  {isLoaded ? (
                    <UserButton
                      afterSignOutUrl='/'
                      appearance={{
                        baseTheme: undefined,
                        variables: {
                          borderRadius: '8px',
                        },
                        elements: {
                          userButtonAvatarBox: 'h-12 w-12',
                          userButtonTrigger: 'h-12 w-12',
                          userButtonPopoverFooter: {
                            display: 'none',
                          },
                        },
                      }}
                    />
                  ) : (
                    <Skeleton className='h-12 w-12 rounded-full' />
                  )}
                </div>
                <div className='hidden md:flex flex-col '>
                  <span className='text-sm font-medium text-gray-900'>
                    {isLoaded ? (
                      user?.fullName ||
                      (user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.firstName || 'User')
                    ) : (
                      <Skeleton className='h-4 w-32' />
                    )}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {isLoaded ? (
                      user?.primaryEmailAddress?.emailAddress ||
                      user?.emailAddresses?.[0]?.emailAddress ||
                      ''
                    ) : (
                      <Skeleton className='h-3 w-40' />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1 overflow-y-auto bg-gray-50 m-0 rounded-lg'>
          <div className='py-8'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
