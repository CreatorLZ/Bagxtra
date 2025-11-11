'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button'; // Not needed here anymore
import { Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { PlaceOrderModal } from '@/components/PlaceOrderModal'; // 1. Import the modal
import { useRole } from '@/hooks/useRole';

interface Order {
  amount: string;
  item: string;
  details: string;
  timing: string | null;
  additionalInfo: string | null;
}

type OrderStatus =
  | 'accepted'
  | 'incoming'
  | 'outgoing'
  | 'pending'
  | 'completed'
  | 'disputed';

export default function OrdersPage() {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<OrderStatus>('accepted');
  // 2. Add state to control the modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Role-specific mock orders data
  const getOrdersByStatus = (): Record<OrderStatus, Order[]> => {
    if (role === 'traveler') {
      return {
        accepted: [
          {
            amount: '$300.00',
            item: "Zara's new shoe",
            details: 'Waiting for Shoppers payment',
            timing: null,
            additionalInfo: null,
          },
        ],
        outgoing: [
          {
            amount: '$120.50',
            item: "Zara's new shoe, wed...",
            details: 'Delivery by 12:45 Today',
            timing: null,
            additionalInfo: 'Tracking: TRK123456',
          },
          {
            amount: '$75.25',
            item: "Zara's new shoe",
            details: 'Delivery by 12:45 Today',
            timing: null,
            additionalInfo: 'Tracking: TRK789012',
          },
          {
            amount: '$30.00',
            item: "Zara's new shoe, wed...",
            details: 'En route to destination country',
            timing: null,
            additionalInfo: 'Tracking: TRK345678',
          },
          {
            amount: '$95.75',
            item: "Zara's new shoe",
            details: 'Delivery by 12:45 Today',
            timing: null,
            additionalInfo: null,
          },
        ],
        pending: [
          {
            amount: '$60.99',
            item: "Zara's new shoe, wed...",
            details: 'Accepted pending purchase',
            timing: null,
            additionalInfo: '1 item',
          },
        ],
        completed: [
          {
            amount: '$150.00',
            item: "Zara's new shoe, wed...",
            details: 'Delivered 11/02/2025',
            timing: null,
            additionalInfo: 'Payment received',
          },
          {
            amount: '$85.50',
            item: "Zara's new shoe, wed...",
            details: 'Delivered 11/02/2025',
            timing: null,
            additionalInfo: 'Payment processed',
          },
          {
            amount: '$25.99',
            item: "Zara's new shoe",
            details: 'Delivered 11/02/2025',
            timing: null,
            additionalInfo: null,
          },
          {
            amount: '$110.25',
            item: "Zara's new shoe",
            details: 'Delivered 11/02/2025',
            timing: null,
            additionalInfo: null,
          },
          {
            amount: '$40.75',
            item: "Zara's new shoe",
            details: 'Delivered 11/02/2025',
            timing: null,
            additionalInfo: null,
          },
          {
            amount: '$200.00',
            item: "Zara's new shoe",
            details: 'Delivered 11/02/2025',
            timing: null,
            additionalInfo: null,
          },
        ],
        disputed: [
          {
            amount: '$55.49',
            item: "Zara's new shoe, wed...",
            details: 'Dispute opened on 10/25/2025',
            timing: null,
            additionalInfo: 'Under review',
          },
        ],
        incoming: [], // Not used for travelers
      };
    }

    // Default shopper orders
    return {
      accepted: [
        {
          amount: '$300.00',
          item: "Zara's new shoe",
          details: 'Waiting for Shoppers Payment',
          timing: null,
          additionalInfo: null,
        },
      ],
      incoming: [
        {
          amount: '$120.50',
          item: "Zara's new shoe",
          details: 'Drop off in 23hrs 50mins',
          timing: null,
          additionalInfo: '? Tracking No',
        },
        {
          amount: '$75.25',
          item: "Zara's new shoe, wed...",
          details: 'Delivery by 12:45 Today',
          timing: null,
          additionalInfo: '? Tracking No',
        },
        {
          amount: '$30.00',
          item: "Zara's new shoe, wed...",
          details: 'Delivery by 12:45 Today',
          timing: null,
          additionalInfo: '? Tracking No',
        },
        {
          amount: '$95.75',
          item: "Zara's new shoe",
          details: 'Delivery by 12:45 Today',
          timing: null,
          additionalInfo: null,
        },
      ],
      pending: [
        {
          amount: '$60.99',
          item: "Zara's new shoe, wed...",
          details: 'Sent a delivery proposal',
          timing: null,
          additionalInfo: '2 items',
        },
      ],
      completed: [
        {
          amount: '$150.00',
          item: "Zara's new shoe, wed...",
          details: 'Delivered 11/02/2025',
          timing: null,
          additionalInfo: '? items',
        },
        {
          amount: '$85.50',
          item: "Zara's new shoe, wed...",
          details: 'Delivered 11/02/2025',
          timing: null,
          additionalInfo: '3 items',
        },
        {
          amount: '$25.99',
          item: "Zara's new shoe",
          details: 'Delivered 11/02/2025',
          timing: null,
          additionalInfo: null,
        },
        {
          amount: '$110.25',
          item: "Zara's new shoe",
          details: 'Delivered 11/02/2025',
          timing: null,
          additionalInfo: null,
        },
        {
          amount: '$40.75',
          item: "Zara's new shoe",
          details: 'Delivered 11/02/2025',
          timing: null,
          additionalInfo: null,
        },
        {
          amount: '$200.00',
          item: "Zara's new shoe",
          details: 'Delivered 11/02/2025',
          timing: null,
          additionalInfo: null,
        },
      ],
      disputed: [
        {
          amount: '$55.49',
          item: "Zara's new shoe, wed...",
          details: 'Dispute opened on 10/25/2025',
          timing: null,
          additionalInfo: 'Under review',
        },
      ],
      outgoing: [], // Not used for shoppers
    };
  };

  const ordersByStatus = getOrdersByStatus();

  // Role-specific tabs
  const getTabs = () => {
    if (role === 'traveler') {
      return [
        { key: 'accepted' as OrderStatus, label: 'Accepted' },
        { key: 'pending' as OrderStatus, label: 'Pending' },
        { key: 'outgoing' as OrderStatus, label: 'Outgoing' },
        { key: 'completed' as OrderStatus, label: 'Completed' },
        { key: 'disputed' as OrderStatus, label: 'Disputed' },
      ];
    }
    // Default to shopper tabs
    return [
      { key: 'accepted' as OrderStatus, label: 'Accepted' },
      { key: 'incoming' as OrderStatus, label: 'Incoming' },
      { key: 'pending' as OrderStatus, label: 'Pending' },
      { key: 'completed' as OrderStatus, label: 'Completed' },
      { key: 'disputed' as OrderStatus, label: 'Disputed' },
    ];
  };

  const tabs = getTabs();

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
        return 'bg-gray-300';
      case 'pending':
        return 'bg-orange-100';
      case 'outgoing':
        return 'bg-purple-100';
      case 'incoming':
        return 'bg-purple-100';
      case 'completed':
        return 'bg-green-100';
      case 'disputed':
        return 'bg-red-200';
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
              className={`px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-purple-50 text-purple-900 border-purple-900 border'
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
                    key={`${order.amount}-${index}`}
                    className='p-4 shadow-none border-0 border-b border-gray-300 rounded-none cursor-pointer hover:shadow-sm hover:scale-105'
                  >
                    <div className='flex items-center space-x-4'>
                      {/* Icon */}
                      <div
                        className={`w-14 h-14 ${getIconColor(
                          activeTab
                        )} rounded-full flex items-center justify-center shrink-0`}
                      >
                        <img src='/totebag.png' alt='bag' />
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
                        {/* {order.additionalInfo && (
                          <p className='text-sm text-gray-600 mb-1'>
                            {order.additionalInfo}
                          </p>
                        )} */}
                        <p className='text-sm font-space-grotesk bg-gray-100 rounded-lg p-2 text-gray-500'>
                          {order.amount}
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

        {/* Floating Action Button - Only show for shoppers */}
        {role === 'shopper' && (
          <button
            // 3. Update the onClick handler
            onClick={() => setIsOrderModalOpen(true)}
            className='fixed bottom-24 right-8 w-14 h-14 bg-purple-800 hover:bg-purple-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors'
          >
            <Plus className='text-3xl font-light cursor-pointer' />
          </button>
        )}
      </div>

      {/* 4. Render the modal */}
      <PlaceOrderModal
        isOpen={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
      />
    </DashboardLayout>
  );
}
