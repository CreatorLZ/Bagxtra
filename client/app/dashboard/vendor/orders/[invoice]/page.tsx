'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatName } from '@/lib/utils';

// Mock data - replace with API call
const getOrderDetails = (invoice: string) => {
  return {
    invoice,
    travelerName: 'Daramola Oluwadara',
    logInDate: '15-11-2024',
    logInTime: '7:45 AM',
    shopperName: 'Daramola Oluwadara',
    pickupDate: '16-11-2024',
    pickupTime: '7:45 AM',
    status: 'completed',
    items: [
      { name: 'Product 1', quantity: 2, price: 50 },
      { name: 'Product 2', quantity: 1, price: 30 },
    ],
    total: 130,
  };
};

export default function OrderDetailsPage() {
  const params = useParams();
  const invoice = params.invoice as string;
  const order = getOrderDetails(invoice);

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center space-x-4'>
          <Link href='/dashboard/vendor/orders'>
            <Button variant='outline' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Orders
            </Button>
          </Link>
          <h2 className='text-2xl font-bold'>Order Details</h2>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order #{order.invoice}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Traveler</p>
                <p className='font-medium'>{formatName(order.travelerName)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Shopper</p>
                <p className='font-medium'>{formatName(order.shopperName)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Log In Date & Time</p>
                <p className='font-medium'>
                  {order.logInDate} at {order.logInTime}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Pick Up Date & Time</p>
                <p className='font-medium'>
                  {order.pickupDate} at {order.pickupTime}
                </p>
              </div>
            </div>
            <div>
              <Badge
                variant={order.status === 'completed' ? 'default' : 'secondary'}
              >
                {order.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {order.items.map((item, index) => (
                <div key={index} className='flex justify-between'>
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <span>${item.price * item.quantity}</span>
                </div>
              ))}
              <div className='border-t pt-2 flex justify-between font-bold'>
                <span>Total</span>
                <span>${order.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
