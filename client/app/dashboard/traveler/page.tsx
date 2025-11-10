'use client';

import { useTravelerDashboardData } from '@/hooks/dashboard/useTravelerDashboardData';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { ChevronRight, MapPin, Bell, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function TravelerDashboardPage() {
  const { data, isLoading, error } = useTravelerDashboardData();

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
          <motion.div
            className='relative'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className='h-6 w-6 text-gray-600 cursor-pointer' />
            <span className='absolute -top-1 -right-1 h-3 w-3 bg-purple-600 rounded-full border-2 border-white'></span>
          </motion.div>
        </motion.div>

        {/* Purple Banner */}
        <motion.div variants={itemVariants}>
          <Card className='bg-purple-900 text-white p-6 md:p-8 rounded-2xl shadow-lg border-0 relative '>
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

            <div className='relative flex items-center justify-between h-56'>
              <div className='flex-1 pr-4'>
                <h1 className=' text-white/80 mb-1 text-sm font-medium font-space-grotesk lg:mb-3'>
                  Hello, Traveler 🤗👋
                </h1>
                <motion.p
                  className='text-purple-100 mb-3 text-sm md:text-base lg:mb-6'
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
                  <Button className='bg-white text-purple-900 hover:bg-gray-100 rounded-lg px-4 md:px-6 py-2 md:py-6 cursor-pointer text-sm md:text-base font-semibold shadow-md font-space-grotesk'>
                    Enter Travel Details
                  </Button>
                </motion.div>
              </div>

              {/* Traveler Image */}
              <motion.div
                className='w-28 h-44 md:w-72 md:h-80 z-10 absolute right-0 md:right-4 -top-14 shrink-0 rounded-t-xl overflow-hidden'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <img
                  src='/woman.png'
                  alt='Traveler'
                  className='w-fit h-80 object-cover object-top'
                />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* New Delivery Request */}
        <motion.div variants={itemVariants}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 font-space-grotesk'>
              New Delivery Request
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
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-start space-x-4 mb-4'>
                <motion.div
                  className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
                    alt='Daramola Oluwadara'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                    Daramola Oluwadara
                  </h4>
                  <p className='text-sm text-gray-500'>
                    Sent you a delivery request 2 mins ago
                  </p>
                </div>
              </div>

              <div className='w-full h-px bg-gray-100 my-4'></div>

              <div className='flex space-x-3'>
                <motion.button
                  className='flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold font-space-grotesk hover:bg-red-100 transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Decline
                </motion.button>
                <motion.button
                  className='flex-1 py-3 bg-purple-50 text-purple-900 rounded-xl text-sm font-semibold font-space-grotesk hover:bg-purple-100 transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Order
                </motion.button>
              </div>
            </Card>

            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-start space-x-4 mb-4'>
                <motion.div
                  className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
                    alt='Daramola Oluwadara'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                    Daramola Oluwadara
                  </h4>
                  <p className='text-sm text-gray-500'>
                    Sent you a delivery request 2 mins ago
                  </p>
                </div>
              </div>

              <div className='w-full h-px bg-gray-100 my-4'></div>

              <div className='flex space-x-3'>
                <motion.button
                  className='flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold font-space-grotesk hover:bg-red-100 transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Decline
                </motion.button>
                <motion.button
                  className='flex-1 py-3 bg-purple-50 text-purple-900 rounded-xl text-sm font-semibold font-space-grotesk hover:bg-purple-100 transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Order
                </motion.button>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Available Orders */}
        <motion.div variants={itemVariants}>
          <div className='flex items-center justify-between mb-4'>
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
            {/* First Available Order */}
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer'>
              <div className='flex items-center space-x-2 mb-3'>
                <span className='text-xs text-gray-400'>Posted 25mins ago</span>
              </div>

              <div className='flex items-start space-x-4 mb-4'>
                <motion.div
                  className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
                    alt='Daramola Oluwadara'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                    Daramola Oluwadara
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Zara's latest shoe, LV purse
                  </p>
                </div>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='flex items-start space-x-3'>
                  <MapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    Kingsway road, Port Harcourt, Nigeria
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Calendar className='h-4 w-4 text-gray-400 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    24th - 26th of July
                  </span>
                </div>
              </div>
            </Card>

            {/* Second Available Order - Desktop only */}
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer hidden lg:block'>
              <div className='flex items-center space-x-2 mb-3'>
                <span className='text-xs text-gray-400'>Posted 1 hour ago</span>
              </div>

              <div className='flex items-start space-x-4 mb-4'>
                <motion.div
                  className='w-14 h-14 rounded-full overflow-hidden shrink-0'
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
                    alt='Sarah Johnson'
                    className='w-full h-full object-cover'
                  />
                </motion.div>

                <div className='flex-1 min-w-0'>
                  <h4 className='font-semibold text-gray-900 mb-1 font-space-grotesk'>
                    Sarah Johnson
                  </h4>
                  <p className='text-sm text-gray-600'>
                    Designer handbag, Perfume set
                  </p>
                </div>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='flex items-start space-x-3'>
                  <MapPin className='h-4 w-4 text-gray-400 mt-0.5 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    Victoria Island, Lagos, Nigeria
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Calendar className='h-4 w-4 text-gray-400 shrink-0' />
                  <span className='text-gray-600 text-sm'>
                    15th - 18th of August
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* More Available Orders - Desktop only */}
        <motion.div variants={itemVariants} className='hidden lg:block'>
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
    </DashboardLayout>
  );
}
