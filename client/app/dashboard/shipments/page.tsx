'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handbag, MapPin, Package, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TrackOrdersPage() {
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrackParcel = () => {
    console.log('Tracking:', trackingNumber);
    // Navigation or tracking logic will go here
  };

  return (
    <DashboardLayout>
      <div className=' h-screen flex flex-col'>
        {/* Header */}
        <motion.div
          className='text-left'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className='text-2xl font-bold text-purple-900'>Track</h1>
        </motion.div>

        {/* Illustration Area */}
        <div className='flex-1 flex items-center justify-center mb-0 max-h-64 '>
          <div className='relative w-64 h-64'>
            {/* Decorative background circles */}
            <motion.div
              className='absolute top-8 left-4 w-24 h-24 bg-purple-100 rounded-full opacity-40'
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 10, 0],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className='absolute top-12 right-8 w-32 h-32 bg-purple-50 rounded-full opacity-40'
              animate={{
                scale: [1, 1.15, 1],
                x: [0, -10, 0],
                y: [0, 10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className='absolute bottom-12 left-12 w-20 h-20 bg-purple-100 rounded-full opacity-30'
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Main illustration elements */}
            <div className='absolute inset-0 flex items-center justify-center'>
              {/* Shopping bag icon */}
              <motion.div
                className='relative z-10'
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  type: 'spring',
                  stiffness: 200,
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Handbag
                    className='w-20 h-20 md:w-24 md:h-24 text-gray-800'
                    strokeWidth={1.1}
                  />
                </motion.div>
              </motion.div>

              {/* Starting location pin */}
              <motion.div
                className='absolute bottom-10 md:bottom-7 left-12 md:left-7'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.5,
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                >
                  <MapPin
                    className='w-12 h-12 md:w-14 md:h-16 text-gray-700 fill-gray-400'
                    strokeWidth={1.5}
                  />
                </motion.div>
              </motion.div>

              {/* Destination location pin */}
              <motion.div
                className='absolute top-12 right-8'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.7,
                }}
              >
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                >
                  <MapPin
                    className='w-12 h-12 text-gray-700 fill-gray-400'
                    strokeWidth={1.5}
                  />
                </motion.div>
              </motion.div>

              {/* Curved path line */}
              <svg
                className='absolute inset-0 w-full h-full'
                viewBox='0 0 256 256'
              >
                <motion.path
                  d='M 60 180 Q 128 100, 190 80'
                  stroke='#9CA3AF'
                  strokeWidth='3'
                  fill='none'
                  strokeDasharray='8 8'
                  opacity='0.5'
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{
                    pathLength: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                    opacity: { duration: 0.5, delay: 0.9 },
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <motion.div
          className='space-y-4 pb-8 px-56'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div>
            <label
              htmlFor='tracking-number'
              className='block text-sm text-gray-600 mb-2 font-space-grotesk'
            >
              Enter Tracking Number
            </label>
            <motion.input
              id='tracking-number'
              type='text'
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder='TC200234'
              className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 focus:border-transparent text-gray-900 placeholder-gray-400 placeholder:text-sm transition-all'
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            />
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleTrackParcel}
              className='w-full bg-purple-800 hover:bg-purple-900 text-white py-7 rounded-xl font-semibold text-base transition-all font-space-grotesk cursor-pointer'
            >
              Track Parcel
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
