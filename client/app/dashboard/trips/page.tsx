'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Filter,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Trip {
  id: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  status: 'upcoming' | 'active' | 'completed';
  earnings: number;
  requests: number;
}

export default function TripsPage() {
  const [filter, setFilter] = useState<
    'all' | 'upcoming' | 'active' | 'completed'
  >('all');

  // Mock data - replace with actual API call
  const trips: Trip[] = [
    {
      id: '1',
      destination: 'London, UK',
      departureDate: '2024-12-15',
      returnDate: '2024-12-30',
      status: 'upcoming',
      earnings: 450.0,
      requests: 3,
    },
    {
      id: '2',
      destination: 'New York, USA',
      departureDate: '2024-11-20',
      returnDate: '2024-12-05',
      status: 'active',
      earnings: 320.0,
      requests: 2,
    },
    {
      id: '3',
      destination: 'Paris, France',
      departureDate: '2024-10-10',
      returnDate: '2024-10-25',
      status: 'completed',
      earnings: 680.0,
      requests: 4,
    },
    {
      id: '4',
      destination: 'Tokyo, Japan',
      departureDate: '2025-01-15',
      returnDate: '2025-01-30',
      status: 'upcoming',
      earnings: 0,
      requests: 0,
    },
  ];

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>My Trips</h1>
            <p className='text-gray-600'>
              Manage your travel plans and earnings
            </p>
          </div>
          <Button className='bg-purple-900 hover:bg-purple-800'>
            <Plus className='h-4 w-4 mr-2' />
            Add New Trip
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className='flex space-x-2'>
          {[
            { key: 'all', label: 'All Trips' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter(key as any)}
              className={
                filter === key ? 'bg-purple-900 hover:bg-purple-800' : ''
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Trips Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredTrips.map(trip => (
            <Card
              key={trip.id}
              className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-2'>
                  <Plane className='h-5 w-5 text-purple-600' />
                  <h3 className='font-semibold text-gray-900'>
                    {trip.destination}
                  </h3>
                </div>
                <Badge className={`${getStatusColor(trip.status)} capitalize`}>
                  {trip.status}
                </Badge>
              </div>

              <div className='space-y-3 mb-4'>
                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <Calendar className='h-4 w-4' />
                  <span>
                    {new Date(trip.departureDate).toLocaleDateString()} -{' '}
                    {new Date(trip.returnDate).toLocaleDateString()}
                  </span>
                </div>

                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                  <Package className='h-4 w-4' />
                  <span>{trip.requests} requests</span>
                </div>

                <div className='flex items-center space-x-2 text-sm font-medium text-green-600'>
                  <DollarSign className='h-4 w-4' />
                  <span>${trip.earnings.toFixed(2)} earned</span>
                </div>
              </div>

              <Button variant='outline' size='sm' className='w-full'>
                View Details
              </Button>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTrips.length === 0 && (
          <Card className='p-12 text-center rounded-2xl border border-gray-100'>
            <Plane className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              No trips found
            </h3>
            <p className='text-gray-600 mb-4'>
              You don't have any {filter !== 'all' ? filter : ''} trips yet.
            </p>
            <Button className='bg-purple-900 hover:bg-purple-800'>
              <Plus className='h-4 w-4 mr-2' />
              Plan Your First Trip
            </Button>
          </Card>
        )}

        {/* Summary Stats */}
        <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Trip Summary
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-purple-900'>
                {trips.filter(t => t.status === 'upcoming').length}
              </p>
              <p className='text-sm text-gray-600'>Upcoming</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {trips.filter(t => t.status === 'active').length}
              </p>
              <p className='text-sm text-gray-600'>Active</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-600'>
                {trips.filter(t => t.status === 'completed').length}
              </p>
              <p className='text-sm text-gray-600'>Completed</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                $
                {trips.reduce((sum, trip) => sum + trip.earnings, 0).toFixed(2)}
              </p>
              <p className='text-sm text-gray-600'>Total Earnings</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
