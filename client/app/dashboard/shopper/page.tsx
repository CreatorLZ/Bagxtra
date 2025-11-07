'use client';

import { useShopperDashboardData } from '@/hooks/dashboard/useShopperDashboardData';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Package, ChevronRight, MapPin, ShoppingBagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export default function ShopperDashboardPage() {
  const { data, isLoading, error } = useShopperDashboardData();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900'></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <h2 className='text-lg font-semibold text-red-600'>
              {error ? 'Error loading dashboard' : 'No data available'}
            </h2>
            <p className='text-gray-600'>Please try again later</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Hero Banner */}
        <Card className='bg-purple-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border-0 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24'></div>
          <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center space-x-2 mb-3'>
                🔥
                <span className='text-sm font-medium'>
                  Hot Travelers Alert!
                </span>
              </div>
              <h2 className='text-xl md:text-2xl font-bold mb-2'>
                6 of our top rated travelers
              </h2>
              <p className='text-purple-100 mb-4'>will be in Nigeria soon</p>
              <Button className='bg-purple-800 text-white hover:bg-purple-800 cursor-pointer font-semibold px-6'>
                Place an Order
              </Button>
            </div>

            {/* Traveler Avatars */}
            <div className='hidden md:flex flex-col space-y-2'>
              <div className='flex -space-x-2'>
                {[1, 2].map(i => (
                  <div
                    key={i}
                    className='w-12 h-12 rounded-lg bg-white/20 border-2 border-white flex items-center justify-center text-xs font-semibold'
                  >
                    T{i}
                  </div>
                ))}
              </div>
              <div className='flex -space-x-2'>
                {[3, 4].map(i => (
                  <div
                    key={i}
                    className='w-12 h-12 rounded-lg bg-white/20 border-2 border-white flex items-center justify-center text-xs font-semibold'
                  >
                    T{i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Incoming Order */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Incoming order
            </h3>
            <button className='text-gray-400 hover:text-gray-600'>
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4 p-4 bg-white rounded-xl hover:bg-gray-100 transition-colors cursor-pointer'>
              <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0'>
                <ShoppingBagIcon className='h-6 w-6 text-purple-900' />
              </div>

              <div className='flex-1 min-w-0'>
                <h4 className='font-semibold text-gray-900 mb-1'>
                  Zara's new shoe
                </h4>
                <p className='text-sm text-gray-500'>
                  Delivery by 12:45, Today
                </p>
              </div>

              <div className='text-right bg-gray-100 rounded-lg flex items-center justify-center shrink-0 flex-col p-2'>
                <p className='text-xs text-gray-400 mb-1'>Tracking ID</p>
                <p className='text-sm font-mono font-semibold text-gray-700'>
                  TK12010045
                </p>
              </div>
            </div>

            <div className='w-full h-0.5 bg-gray-100'></div>

            <button className='w-full mt-4 py-3 text-purple-900 font-semibold hover:bg-gray-100 cursor-pointer rounded-lg transition-colors'>
              Track Parcel
            </button>
          </Card>
        </div>

        {/* Top Orders This Week */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Top orders this week
            </h3>
            <button className='text-gray-400 hover:text-gray-600'>
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Product Card 1 */}
            <Card className='overflow-hidden border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer p-2 h-fit '>
              <div className='aspect-square bg-gray-100 h-64 rounded-2xl'>
                <img
                  src='https://images.unsplash.com/photo-1585298723682-7115561c51b7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=764'
                  alt='Noise Cancellation headsets'
                  className='w-full h-full object-cover rounded-2xl'
                />
              </div>
              <div className='p-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>
                      Noise Cancellation headsets
                    </h4>
                    <div className='flex items-center space-x-1'>
                      <span className='text-sm font-medium text-blue-600'>
                        Walmart
                      </span>
                      {/* vendor icon */}
                      <img
                        src='/Vector.png'
                        alt='Vector image'
                        width='16'
                        height='16'
                      />
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400 shrink-0' />
                </div>
              </div>
            </Card>

            {/* Product Card 2*/}
            <Card className='overflow-hidden border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer p-2 h-fit '>
              <div className='aspect-square bg-gray-100 h-64 rounded-2xl'>
                <img
                  src='https://images.unsplash.com/photo-1640351677317-69fc40f320eb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170'
                  alt='Noise Cancellation headsets'
                  className='w-full h-full object-cover rounded-2xl'
                />
              </div>
              <div className='p-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>
                      Christmas cap
                    </h4>
                    <div className='flex items-center space-x-1'>
                      <span className='text-sm font-medium text-blue-600'>
                        Walmart
                      </span>
                      {/* vendor icon */}
                      <img
                        src='/Vector.png'
                        alt='Vector image'
                        width='16'
                        height='16'
                      />
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400 shrink-0' />
                </div>
              </div>
            </Card>

            <Card className='overflow-hidden border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer p-2 h-fit '>
              <div className='aspect-square bg-gray-100 h-64 rounded-2xl'>
                <img
                  src='https://images.unsplash.com/photo-1637848079119-933c7aed684a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170'
                  alt='Noise Cancellation headsets'
                  className='w-full h-full object-cover rounded-2xl'
                />
              </div>
              <div className='p-2'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>
                      Christmas gift set
                    </h4>
                    <div className='flex items-center space-x-1'>
                      <span className='text-sm font-medium text-blue-600'>
                        Walmart
                      </span>
                      {/* vendor icon */}
                      <img
                        src='/Vector.png'
                        alt='Vector image'
                        width='16'
                        height='16'
                      />
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400 shrink-0' />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
