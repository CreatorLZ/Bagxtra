'use client';

import { useTravelerDashboardData } from '@/hooks/dashboard/useTravelerDashboardData';
import { useOrders, useMarketplaceOrders } from '@/hooks/dashboard/useOrders';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { ChevronRight, MapPin, Bell, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OrderSummaryModal } from '@/components/OrderSummaryModal';
import { DeclineModal } from '@/components/DeclineModal';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { formatName } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TravelerDashboardPage() {
  const { data, isLoading, error } = useTravelerDashboardData();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: marketplaceOrders, isLoading: marketplaceLoading } =
    useMarketplaceOrders();
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(
    undefined
  );
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isMarketplaceOrder, setIsMarketplaceOrder] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedOrderIdForDecline, setSelectedOrderIdForDecline] = useState<
    string | undefined
  >(undefined);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <DashboardLayout>
      <motion.div
        className='max-w-6xl mx-auto space-y-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header - Hidden on desktop since DashboardLayout has it */}
        <motion.div
          className='md:hidden flex items-start justify-between mb-4'
          variants={itemVariants}
        >
          <div>
            <h1 className='text-xl font-bold text-gray-900 mb-1 font-space-grotesk'>
              Hello, Traveler
            </h1>
            <div className='flex items-center text-gray-600'>
              <MapPin className='h-4 w-4 mr-1' />
              <span className='text-sm'>Los Angeles, USA</span>
            </div>
          </div>
        </motion.div>

        {/* Purple Banner */}
        <motion.div variants={itemVariants}>
          <Card className='bg-purple-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border-0 relative'>
            <div className='absolute inset-0 overflow-hidden'>
              <motion.div
                className='absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24'
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <div className='relative flex items-center justify-between h-56'>
              <div className='flex-1 pr-4'>
                <h1 className=' text-white/90 mb-1 md:text-sm text-sm font-medium font-space-grotesk lg:mb-3'>
                  Hello, Traveler 👋
                </h1>
                <motion.p
                  className='text-white text-xl md:text-xl font-semibold mb-3 lg:mb-6'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Traveling and want extra bucks? Deliver a parcel and get paid!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className='bg-purple-800 text-white hover:shadow-lg hover:bg-purple-800 rounded-lg px-4 md:px-6 py-2 md:py-6 cursor-pointer text-sm md:text-base font-semibold shadow-md font-space-grotesk'>
                    Enter Travel Details
                  </Button>
                </motion.div>
              </div>

              {/* Traveler Image */}
              <motion.div
                className='w-28 h-44 md:w-64 md:h-80 z-10 absolute right-0 md:right-4 -top-14 shrink-0 rounded-t-xl overflow-hidden'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <img
                  src='/woman.png'
                  alt='Traveler'
                  className='w-full h-80 object-cover object-top'
                />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* New Delivery Request */}
        <motion.div variants={itemVariants}>
          <div
            className='flex items-center justify-between mb-4 cursor-pointer'
            onClick={() => router.push('/dashboard/orders?tab=pending')}
          >
            <h3 className='text-lg font-semibold text-gray-900 font-space-grotesk'>
              New Delivery Request
            </h3>
            <motion.button
              className='text-gray-400 hover:text-gray-600 cursor-pointer'
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
              onClick={() => router.push('/dashboard/orders?tab=pending')}
            >
              <ChevronRight className='h-5 w-5' />
            </motion.button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {ordersData?.pending.slice(0, 2).map(order => (
              <Card
                key={order.id}
                className='p-6 rounded-2xl shadow-sm border border-gray-100'
              >
                <div className='flex items-start space-x-4 mb-4'>
                  <motion.div
                    className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img
                      src={
                        order.shopperAvatar ||
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
                      }
                      alt={order.shopperName || 'Shopper'}
                      className='w-full h-full object-cover'
                    />
                  </motion.div>

                  <div className='flex-1 min-w-0'>
                    <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                      {formatName(order.shopperName) || 'Unknown Shopper'}
                    </h4>
                    <p className='text-sm text-gray-500'>
                      {order.timing || 'Recently sent delivery request'}
                    </p>
                  </div>
                </div>

                <div className='w-full h-px bg-gray-100 my-4'></div>

                <div className='flex space-x-3'>
                  <motion.button
                    className='flex-1 py-3 bg-red-50 text-red-500 border-red-100 border-2 rounded-md text-sm cursor-pointer font-semibold font-space-grotesk hover:bg-red-100 transition-colors'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedOrderIdForDecline(order.id);
                      setDeclineModalOpen(true);
                    }}
                  >
                    Decline
                  </motion.button>
                  <motion.button
                    className='flex-1 py-3 bg-purple-50 border-2 border-purple-100 text-purple-900  rounded-md cursor-pointer text-sm font-semibold font-space-grotesk hover:bg-purple-100 transition-colors'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsMarketplaceOrder(false);
                      setIsSummaryOpen(true);
                    }}
                  >
                    View Order
                  </motion.button>
                </div>
              </Card>
            ))}

            {/* Show empty state if no pending orders */}
            {(!ordersData?.pending || ordersData.pending.length === 0) &&
              !ordersLoading && (
                <div className='col-span-full text-center py-12 flex flex-col items-center font-space-grotesk'>
                  <img
                    src='/twobags.png'
                    alt='twinbags'
                    className='h-12 w-12 md:h-20 md:w-20 mb-4'
                  />
                  <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                    No new delivery requests available
                  </h3>
                  <p className='text-gray-600'>
                    New requests will appear here when shoppers need your help
                  </p>
                </div>
              )}
          </div>
        </motion.div>

        {/* Available Orders */}
        <motion.div variants={itemVariants}>
          <div
            className='flex items-center justify-between mb-4 cursor-pointer'
            onClick={() => router.push('/dashboard/orders?tab=pending')}
          >
            <h3 className='text-lg font-semibold text-gray-900 font-space-grotesk'>
              Available Orders
            </h3>
            <motion.button
              className='text-gray-400 hover:text-gray-600'
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className='h-5 w-5' />
            </motion.button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {marketplaceOrders?.slice(0, 4).map(order => (
              <Card
                key={order.id}
                className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer'
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setIsMarketplaceOrder(true);
                  setIsSummaryOpen(true);
                }}
              >
                <div className='flex items-center space-x-2 mb-3'>
                  <span className='text-xs text-gray-400'>
                    {'Posted ' + order.postedTime}
                  </span>
                </div>

                <div className='flex items-start space-x-4 mb-4'>
                  <motion.div
                    className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img
                      src={
                        order.shopperAvatar ||
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
                      }
                      alt={order.shopperName}
                      className='w-full h-full object-cover'
                    />
                  </motion.div>

                  <div className='flex-1 min-w-0'>
                    <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                      {formatName(order.shopperName)}
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {order.item}
                      {order.itemCount > 1
                        ? ` + ${order.itemCount - 1} more`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className='space-y-3 text-sm'>
                  <div className='flex items-start space-x-3'>
                    <MapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                    <span className='text-gray-600 text-sm'>
                      {order.fromCountry} to {order.toCountry}
                    </span>
                  </div>
                  {(order.deliveryStartDate || order.deliveryEndDate) && (
                    <div className='flex items-center space-x-3'>
                      <Calendar className='h-4 w-4 text-gray-400 shrink-0' />
                      <span className='text-gray-600 text-sm'>
                        {order.deliveryStartDate && order.deliveryEndDate
                          ? `${order.deliveryStartDate} - ${order.deliveryEndDate}`
                          : order.deliveryStartDate || order.deliveryEndDate}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {/* Show empty state if no marketplace orders */}
            {(!marketplaceOrders || marketplaceOrders.length === 0) &&
              !marketplaceLoading && (
                <div className='col-span-full text-center py-12 flex flex-col items-center font-space-grotesk'>
                  <img
                    src='/twobags.png'
                    alt='twinbags'
                    className='h-12 w-12 md:h-20 md:w-20 mb-4'
                  />
                  <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                    No marketplace orders available
                  </h3>
                  <p className='text-gray-600'>
                    New marketplace orders will appear here when shoppers post
                    them
                  </p>
                </div>
              )}
          </div>
        </motion.div>

        {/* More Available Orders - Desktop only */}
        <motion.div variants={itemVariants} className='hidden lg:hidden'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Order Card 3 */}
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-center space-x-2 mb-3'>
                <span className='text-xs text-gray-400'>
                  Posted 2 hours ago
                </span>
              </div>

              <div className='flex items-start space-x-4 mb-4'>
                <motion.div
                  className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src='https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop'
                    alt='Michael Chen'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                    Michael Chen
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Electronics bundle, Gadgets
                  </p>
                </div>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='flex items-start space-x-3'>
                  <MapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    Lekki Phase 1, Lagos, Nigeria
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Calendar className='h-4 w-4 text-gray-400 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    20th - 22nd of August
                  </span>
                </div>
              </div>
            </Card>

            {/* Order Card 4 */}
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-center space-x-2 mb-3'>
                <span className='text-xs text-gray-400'>
                  Posted 3 hours ago
                </span>
              </div>

              <div className='flex items-start space-x-4 mb-4'>
                <motion.div
                  className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
                    alt='James Wilson'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                    James Wilson
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Sports equipment, Clothing
                  </p>
                </div>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='flex items-start space-x-3'>
                  <MapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    Ikeja GRA, Lagos, Nigeria
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Calendar className='h-4 w-4 text-gray-400 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    25th - 28th of August
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      <OrderSummaryModal
        isOpen={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        orderId={selectedOrderId}
      />

      <DeclineModal
        isOpen={declineModalOpen}
        onOpenChange={setDeclineModalOpen}
        orderId={selectedOrderIdForDecline!}
        onDeclineSuccess={() => {
          // Refresh the data after successful decline
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['traveler-dashboard'] });
        }}
      />
    </DashboardLayout>
  );
}
