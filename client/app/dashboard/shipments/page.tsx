'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handbag, MapPin, Package, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

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
        <div className='text-left'>
          <h1 className='text-2xl font-bold text-gray-900'>Track</h1>
        </div>

        {/* Illustration Area */}
        <div className='flex-1 flex items-center justify-center mb-0 max-h-64 '>
          <div className='relative w-64 h-64'>
            {/* Decorative background circles */}
            <div className='absolute top-8 left-4 w-24 h-24 bg-purple-100 rounded-full opacity-40'></div>
            <div className='absolute top-12 right-8 w-32 h-32 bg-purple-50 rounded-full opacity-40'></div>
            <div className='absolute bottom-12 left-12 w-20 h-20 bg-purple-100 rounded-full opacity-30'></div>

            {/* Main illustration elements */}
            <div className='absolute inset-0 flex items-center justify-center'>
              {/* Shopping bag icon */}
              <div className='relative z-10'>
                <Handbag
                  className='w-20 h-20 text-gray-800'
                  strokeWidth={1.5}
                />
              </div>

              {/* Starting location pin */}
              <div className='absolute bottom-10 left-12'>
                <MapPin
                  className='w-12 h-12 text-gray-700 fill-gray-400'
                  strokeWidth={1.5}
                />
              </div>

              {/* Destination location pin */}
              <div className='absolute top-12 right-8'>
                <MapPin
                  className='w-12 h-12 text-gray-700 fill-gray-400'
                  strokeWidth={1.5}
                />
              </div>

              {/* Curved path line */}
              {/* <svg
                className='absolute inset-0 w-full h-full'
                viewBox='0 0 256 256'
              >
                <path
                  d='M 60 180 Q 128 100, 190 80'
                  stroke='#9CA3AF'
                  strokeWidth='3'
                  fill='none'
                  strokeDasharray='8 8'
                  opacity='0.5'
                />
              </svg> */}
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className='space-y-4 pb-8 px-48'>
          <div>
            <label
              htmlFor='tracking-number'
              className='block text-sm text-gray-600 mb-2'
            >
              Enter Tracking Number
            </label>
            <input
              id='tracking-number'
              type='text'
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder='e.g: TC200234'
              className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 focus:border-transparent text-gray-900 placeholder-gray-400'
            />
          </div>

          <Button
            onClick={handleTrackParcel}
            className='w-full bg-purple-800 hover:bg-purple-900 text-white py-7 rounded-xl font-semibold text-base'
          >
            Track Parcel
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
