'use client';

import { useShopperDashboardData } from '@/hooks/dashboard/useShopperDashboardData';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

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

  const avatarVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -180 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: 0.5 + i * 0.1,
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] as const,
      },
    }),
    hover: {
      scale: 1.15,
      rotate: 5,
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const,
      },
    },
  };

  const productCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
    hover: {
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const,
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
        {/* Hero Banner */}
        <motion.div variants={itemVariants}>
          <Card className='bg-purple-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border-0 relative overflow-hidden'>
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
            ></motion.div>
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
            ></motion.div>

            <div className='relative flex items-center justify-between'>
              <div className='flex-1'>
                <motion.div
                  className='flex items-center space-x-2 mb-3'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.span
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    🔥
                  </motion.span>
                  <span className='text-sm font-medium'>
                    Hot Travelers Alert!
                  </span>
                </motion.div>
                <motion.h2
                  className='text-xl md:text-2xl font-bold mb-2'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  6 of our top rated travelers
                </motion.h2>
                <motion.p
                  className='text-purple-100 mb-4'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  will be in Nigeria soon
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className='bg-linear-to-r font-space-grotesk from-white to-gray-100 text-purple-900 rounded-full shadow-lg hover:shadow-xl hover:from-gray-50 hover:to-white active:scale-95 transition-all duration-200 px-2 py-2.5 md:py-6 font-bold cursor-pointer group hover:px-2.5'>
                    Place an Order
                    <motion.span
                      className='ml-2 flex items-center justify-center h-7 w-7 bg-purple-900 rounded-full p-5 font-bold group-hover:bg-purple-800 group-active:scale-90 transition-all duration-200'
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <ChevronRight className='h-5 w-5 text-white' />
                    </motion.span>
                  </Button>
                </motion.div>
              </div>

              {/* Traveler Avatars */}
              <div className='hidden md:block relative w-48 h-64'>
                {/* Top Right */}
                <motion.div
                  className='absolute top-0 right-0 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white shadow-lg'
                  custom={0}
                  variants={avatarVariants}
                  initial='hidden'
                  animate='visible'
                  whileHover='hover'
                >
                  <img
                    src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
                    alt='Traveler 1'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                {/* Middle Left */}
                <motion.div
                  className='absolute top-12 left-0 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white shadow-lg'
                  custom={1}
                  variants={avatarVariants}
                  initial='hidden'
                  animate='visible'
                  whileHover='hover'
                >
                  <img
                    src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
                    alt='Traveler 2'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                {/* Middle Center */}
                <motion.div
                  className='absolute top-20 right-8 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white shadow-lg'
                  custom={2}
                  variants={avatarVariants}
                  initial='hidden'
                  animate='visible'
                  whileHover='hover'
                >
                  <img
                    src='https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop'
                    alt='Traveler 3'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                {/* Lower Left */}
                <motion.div
                  className='absolute bottom-18 left-4 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white shadow-lg'
                  custom={3}
                  variants={avatarVariants}
                  initial='hidden'
                  animate='visible'
                  whileHover='hover'
                >
                  <img
                    src='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop'
                    alt='Traveler 4'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                {/* Bottom Right */}
                <motion.div
                  className='absolute bottom-8 right-0 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white shadow-lg'
                  custom={4}
                  variants={avatarVariants}
                  initial='hidden'
                  animate='visible'
                  whileHover='hover'
                >
                  <img
                    src='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
                    alt='Traveler 5'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                {/* Bottom Center */}
                <motion.div
                  className='absolute bottom-0 left-8 w-16 h-16 rounded-2xl overflow-hidden border-3 border-white shadow-lg'
                  custom={5}
                  variants={avatarVariants}
                  initial='hidden'
                  animate='visible'
                  whileHover='hover'
                >
                  <img
                    src='https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop'
                    alt='Traveler 6'
                    className='w-full h-full object-cover'
                  />
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Incoming Order */}
        <motion.div variants={itemVariants}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 font-space-grotesk'>
              Incoming order
            </h3>
            <motion.button
              className='text-gray-400 hover:text-gray-600'
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className='h-5 w-5' />
            </motion.button>
          </div>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <motion.div
              className='flex items-center space-x-4 p-4 bg-white rounded-xl hover:bg-gray-100 transition-colors cursor-pointer'
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0'
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <ShoppingBag className='h-6 w-6 text-purple-900' />
              </motion.div>

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
                <p className='text-sm  font-semibold text-gray-700 font-space-grotesk'>
                  TK12010045
                </p>
              </div>
            </motion.div>

            <div className='w-full h-0.5 bg-gray-100'></div>

            <div className='flex justify-center mt-4'>
              <motion.button
                className='px-6 py-3 text-purple-900 font-semibold font-space-grotesk hover:bg-gray-100 cursor-pointer rounded-lg transition-colors'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Track Parcel
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* Top Orders This Week */}
        <motion.div variants={itemVariants}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 font-space-grotesk'>
              Top orders this week
            </h3>
            <motion.button
              className='text-gray-400 hover:text-gray-600'
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className='h-5 w-5' />
            </motion.button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Product Card 1 */}
            <motion.div
              custom={0}
              variants={productCardVariants}
              initial='hidden'
              animate='visible'
              whileHover='hover'
            >
              <Card className='overflow-hidden border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer p-2 h-fit '>
                <div className='aspect-square bg-gray-100 h-64 rounded-2xl overflow-hidden'>
                  <motion.img
                    src='https://images.unsplash.com/photo-1585298723682-7115561c51b7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=764'
                    alt='Noise Cancellation headsets'
                    className='w-full h-full object-cover rounded-2xl'
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className='p-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                        Noise Cancellation headsets
                      </h4>
                      <div className='flex items-center space-x-1'>
                        <span className='text-sm font-medium text-blue-600'>
                          Walmart
                        </span>
                        <img
                          src='/Vector.png'
                          alt='Vector image'
                          width='16'
                          height='16'
                        />
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <ChevronRight className='h-5 w-5 text-gray-400 shrink-0' />
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Product Card 2*/}
            <motion.div
              custom={1}
              variants={productCardVariants}
              initial='hidden'
              animate='visible'
              whileHover='hover'
            >
              <Card className='overflow-hidden border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer p-2 h-fit '>
                <div className='aspect-square bg-gray-100 h-64 rounded-2xl overflow-hidden'>
                  <motion.img
                    src='https://images.unsplash.com/photo-1640351677317-69fc40f320eb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170'
                    alt='Christmas cap'
                    className='w-full h-full object-cover rounded-2xl'
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className='p-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                        Christmas cap
                      </h4>
                      <div className='flex items-center space-x-1'>
                        <span className='text-sm font-medium text-blue-600'>
                          Walmart
                        </span>
                        <img
                          src='/Vector.png'
                          alt='Vector image'
                          width='16'
                          height='16'
                        />
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <ChevronRight className='h-5 w-5 text-gray-400 shrink-0' />
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Product Card 3*/}
            <motion.div
              custom={2}
              variants={productCardVariants}
              initial='hidden'
              animate='visible'
              whileHover='hover'
            >
              <Card className='overflow-hidden border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer p-2 h-fit '>
                <div className='aspect-square bg-gray-100 h-64 rounded-2xl overflow-hidden'>
                  <motion.img
                    src='https://images.unsplash.com/photo-1637848079119-933c7aed684a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170'
                    alt='Christmas gift set'
                    className='w-full h-full object-cover rounded-2xl'
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className='p-2'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                        Christmas gift set
                      </h4>
                      <div className='flex items-center space-x-1'>
                        <span className='text-sm font-medium text-blue-600'>
                          Walmart
                        </span>
                        <img
                          src='/Vector.png'
                          alt='Vector image'
                          width='16'
                          height='16'
                        />
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <ChevronRight className='h-5 w-5 text-gray-400 shrink-0' />
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
