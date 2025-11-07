'use client';

import { useTravelerDashboardData } from '@/hooks/dashboard/useTravelerDashboardData';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import {
  Plane,
  MapPin,
  DollarSign,
  Package,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  return (
    <DashboardLayout>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Hero Banner */}
        <Card className='bg-gradient-to-r from-purple-900 to-purple-800 text-white p-6 md:p-8 rounded-2xl shadow-lg border-0 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24'></div>
          <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center space-x-2 mb-3'>
                ✈️
                <span className='text-sm font-medium'>Traveler Dashboard</span>
              </div>
              <h2 className='text-xl md:text-2xl font-bold mb-2'>
                Welcome back! Ready for your next trip?
              </h2>
              <p className='text-purple-100 mb-4'>
                Manage your trips and earn rewards
              </p>
              <Button className='bg-purple-800 text-white hover:bg-purple-700 cursor-pointer font-semibold px-6'>
                View Available Requests
              </Button>
            </div>

            <div className='hidden md:block'>
              <Plane className='h-24 w-24 text-purple-200 opacity-80' />
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <Plane className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Active Trips
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {data.activeTrips}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                <Package className='h-6 w-6 text-orange-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Pending Requests
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {data.pendingRequests}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>This Month</p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${data.earningsThisMonth.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <TrendingUp className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Earnings
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${data.totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Trips */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Upcoming Trips
            </h3>
            <button className='text-gray-400 hover:text-gray-600'>
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {data.upcomingTrips.map(trip => (
              <Card
                key={trip.id}
                className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-2'>
                    <MapPin className='h-5 w-5 text-purple-600' />
                    <h4 className='font-semibold text-gray-900'>
                      {trip.destination}
                    </h4>
                  </div>
                  <Badge variant='secondary' className='capitalize'>
                    {trip.status}
                  </Badge>
                </div>
                <div className='space-y-2 text-sm text-gray-600'>
                  <p>
                    Departure:{' '}
                    {new Date(trip.departureDate).toLocaleDateString()}
                  </p>
                  <p>
                    Return: {new Date(trip.returnDate).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Recent Requests
            </h3>
            <button className='text-gray-400 hover:text-gray-600'>
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>

          <div className='space-y-3'>
            {data.recentRequests.map(request => (
              <Card
                key={request.id}
                className='p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <h4 className='font-semibold text-gray-900'>
                        {request.item}
                      </h4>
                      <Badge
                        variant={
                          request.status === 'accepted'
                            ? 'default'
                            : 'secondary'
                        }
                        className='capitalize'
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className='flex items-center space-x-4 text-sm text-gray-600'>
                      <span>From: {request.shopperName}</span>
                      <span>To: {request.destination}</span>
                      <span className='font-medium text-green-600'>
                        ${request.reward.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400' />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
