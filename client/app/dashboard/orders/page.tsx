'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button'; // Not needed here anymore
import { Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { PlaceOrderModal } from '@/components/PlaceOrderModal'; // 1. Import the modal
import { useRole } from '@/hooks/useRole';
import { useOrders } from '@/hooks/dashboard/useOrders';

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

  // Fetch real orders data
  const { data: ordersData, isLoading, error } = useOrders();

  // Convert API response to the expected format
  const getOrdersByStatus = (): Record<OrderStatus, Order[]> => {
    if (!ordersData) {
      return {
        accepted: [],
        pending: [],
        incoming: [],
        outgoing: [],
        completed: [],
        disputed: []
      };
    }

    // Map API response to component format
    return {
      accepted: ordersData.accepted.map(order => ({
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      })),
      pending: ordersData.pending.map(order => ({
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      })),
      incoming: ordersData.incoming.map(order => ({
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      })),
      outgoing: ordersData.outgoing.map(order => ({
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      })),
      completed: ordersData.completed.map(order => ({
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      })),
      disputed: ordersData.disputed.map(order => ({
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      }))
    };
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className='space-y-6 pb-24'>
          <div className='flex items-center justify-between mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 font-space-grotesk'>Orders</h1>
          </div>
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900'></div>
            <span className='ml-2 text-gray-600'>Loading orders...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className='space-y-6 pb-24'>
          <div className='flex items-center justify-between mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 font-space-grotesk'>Orders</h1>
          </div>
          <div className='text-center py-12'>
            <p className='text-red-600 mb-2'>Failed to load orders</p>
            <p className='text-gray-500 text-sm'>Please try refreshing the page</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }


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

  // Group orders by a simple "Recent" category for now
  const groupedOrders = currentOrders.length > 0 ? {
    'Recent': currentOrders
  } : {};

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
          <h1 className='text-2xl font-bold text-gray-900 font-space-grotesk'>Orders</h1>
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
                {orders.map((order: Order, index: number) => (
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

