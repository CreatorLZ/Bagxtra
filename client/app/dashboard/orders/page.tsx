'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button'; // Not needed here anymore
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { PlaceOrderModal } from '@/components/PlaceOrderModal'; // 1. Import the modal

interface Order {
  id: string;
  item: string;
  details: string;
  timing: string | null;
  additionalInfo: string | null;
}

type OrderStatus =
  | 'accepted'
  | 'incoming'
  | 'pending'
  | 'completed'
  | 'disputed';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('accepted');
  // 2. Add state to control the modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Mock orders data organized by status
  const ordersByStatus: Record<OrderStatus, Order[]> = {
    accepted: [
      {
        id: 'TC1200045',
        item: "Zara's new shoe",
        details: 'Drop off in',
        timing: '25hrs 50mins',
        additionalInfo: null,
      },
    ],
    incoming: [
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Sent a delivery proposal',
        timing: null,
        additionalInfo: '? Tracking No',
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Traveller has accepted to deliver your item',
        timing: null,
        additionalInfo: '? Tracking No',
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Waiting for traveller',
        timing: null,
        additionalInfo: '? Tracking No',
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe",
        details: 'Accepted pending purchase',
        timing: null,
        additionalInfo: null,
      },
    ],
    pending: [
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Delivery by 12:45, Today',
        timing: null,
        additionalInfo: '2 items',
      },
    ],
    completed: [
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Delivered 11/02/2025',
        timing: null,
        additionalInfo: '? items',
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Delivered 11/02/2025',
        timing: null,
        additionalInfo: '3 items',
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe",
        details: 'Delivered 11/02/2025',
        timing: null,
        additionalInfo: null,
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe",
        details: 'Delivered 11/02/2025',
        timing: null,
        additionalInfo: null,
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe",
        details: 'Delivered 11/02/2025',
        timing: null,
        additionalInfo: null,
      },
      {
        id: 'TC1200045',
        item: "Zara's new shoe",
        details: 'Delivered 11/02/2025',
        timing: null,
        additionalInfo: null,
      },
    ],
    disputed: [
      {
        id: 'TC1200045',
        item: "Zara's new shoe, wed...",
        details: 'Dispute opened on 10/25/2025',
        timing: null,
        additionalInfo: 'Under review',
      },
    ],
  };

  const tabs = [
    { key: 'accepted' as OrderStatus, label: 'Accepted' },
    { key: 'incoming' as OrderStatus, label: 'Incoming' },
    { key: 'pending' as OrderStatus, label: 'Pending' },
    { key: 'completed' as OrderStatus, label: 'Completed' },
    { key: 'disputed' as OrderStatus, label: 'Disputed' },
  ];

  const currentOrders = ordersByStatus[activeTab] || [];

  // Group orders by month for display
  const groupedOrders = currentOrders.reduce(
    (acc: Record<string, Order[]>, order, index) => {
      // For demo purposes, group first items under "April 2025" and rest under other months
      let month = 'April 2025';
      if (activeTab === 'accepted' && index === 0) month = 'April 2025';
      else if (activeTab === 'incoming' && index < 3) month = 'April 2025';
      else if (activeTab === 'completed' && index === 0) month = 'April 2025';
      else if (activeTab === 'completed' && index > 0) month = 'January 2025';
      else if (activeTab === 'accepted' && index > 0) month = 'March 2025';

      if (!acc[month]) acc[month] = [];
      acc[month].push(order);
      return acc;
    },
    {}
  );

  const getIconColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-purple-300';
      case 'incoming':
        return 'bg-orange-600';
      case 'completed':
        return 'bg-green-600';
      case 'disputed':
        return 'bg-red-600';
      default:
        return 'bg-purple-600';
    }
  };

  return (
    <DashboardLayout>
      <div className='space-y-6 pb-24'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Orders</h1>
        </div>

        {/* Tabs */}
        <div className='flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide'>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-purple-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className='space-y-6'>
          {Object.entries(groupedOrders).map(([month, orders]) => (
            <div key={month}>
              {/* Month Header */}
              <div className='text-sm text-gray-500 mb-3 font-medium'>
                {month}
              </div>

              {/* Orders in this month */}
              <div className='space-y-3'>
                {orders.map((order, index) => (
                  <Card
                    key={`${order.id}-${index}`}
                    className='p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer'
                  >
                    <div className='flex items-center space-x-4'>
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 ${getIconColor(
                          activeTab
                        )} rounded-full flex items-center justify-center shrink-0`}
                      >
                        <ShoppingBag className='h-6 w-6 text-white' />
                      </div>

                      {/* Order Details */}
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-gray-900 mb-1 truncate'>
                          {order.item}
                        </h3>
                        <div className='flex items-center space-x-2'>
                          <p className='text-sm text-gray-600'>
                            {order.details}
                          </p>
                          {order.timing && (
                            <span className='text-sm text-green-600 font-medium'>
                              {order.timing}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Info */}
                      <div className='text-right shrink-0'>
                        {order.additionalInfo && (
                          <p className='text-sm text-gray-600 mb-1'>
                            {order.additionalInfo}
                          </p>
                        )}
                        <p className='text-xs font-mono text-gray-500'>
                          {order.id}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {currentOrders.length === 0 && (
            <div className='text-center py-12'>
              <ShoppingBag className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No orders in this category
              </h3>
              <p className='text-gray-600'>
                Orders will appear here when available
              </p>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          // 3. Update the onClick handler
          onClick={() => setIsOrderModalOpen(true)}
          className='fixed bottom-24 right-8 w-14 h-14 bg-purple-800 hover:bg-purple-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors'
        >
          <span className='text-2xl font-light'>+</span>
        </button>
      </div>

      {/* 4. Render the modal */}
      <PlaceOrderModal
        isOpen={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
      />
    </DashboardLayout>
  );
}
