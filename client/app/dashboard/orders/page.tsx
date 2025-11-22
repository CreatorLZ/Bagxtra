'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Plus, ShoppingBag } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { PlaceOrderModal } from '@/components/PlaceOrderModal';
import { OrderSummaryModal } from '@/components/OrderSummaryModal';
import { useRole } from '@/hooks/useRole';
import { useOrders } from '@/hooks/dashboard/useOrders';
import { useQueryClient } from '@tanstack/react-query';

interface Order {
  id: string;
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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Track the last count of pending orders to detect when new server data arrives
  const [lastPendingCount, setLastPendingCount] = useState(0);
  
  // Optimistic updates
  const [optimisticOrders, setOptimisticOrders] = useState<Order[]>([]);

  // Fetch real orders data
  const { data: ordersData, isLoading, error, isFetching } = useOrders();

  // Query client
  const queryClient = useQueryClient();

  // Clear optimistic updates when fresh server data arrives with new orders
  useEffect(() => {
    if (ordersData?.pending && !isFetching) {
      const currentPendingCount = ordersData.pending.length;
      
      // console.log('Orders effect triggered:', {
      //   currentPendingCount,
      //   lastPendingCount,
      //   optimisticCount: optimisticOrders.length,
      //   isFetching,
      //   serverOrders: ordersData.pending
      // });
      
      // If we have optimistic orders and server now has data, clear optimistic
      // We check if count increased OR if we simply have optimistic orders and server data exists
      if (optimisticOrders.length > 0 && currentPendingCount > 0) {
        // Check if any optimistic order matches a server order (by item name)
        const hasMatchingServerOrder = optimisticOrders.some(opt =>
          ordersData.pending.some(server => server.item === opt.item)
        );
        
        if (hasMatchingServerOrder) {
          // console.log('Found matching server order, clearing optimistic updates');
          // setOptimisticOrders([]);
        }
      }
      
      setLastPendingCount(currentPendingCount);
    }
  }, [ordersData?.pending, isFetching, optimisticOrders.length]); // Monitor data, fetch status, and optimistic count

  // Convert API response to the expected format with deduplication
  const getOrdersByStatus = useMemo((): Record<OrderStatus, Order[]> => {
    // Helper to create unique key for deduplication
    const getOrderKey = (order: Order) => `${order.item}-${order.amount}-${order.details}`;
    
    const deduplicateOrders = (orders: Order[]) => {
      const seen = new Set<string>();
      return orders.filter(order => {
        const key = getOrderKey(order);
        if (seen.has(key)) {
          // console.warn('Duplicate order detected and removed:', order);
          return false;
        }
        seen.add(key);
        return true;
      });
    };

    const serverOrders = ordersData ? {
      accepted: deduplicateOrders(ordersData.accepted.map(order => ({
        id: order.id,
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      }))),
      pending: deduplicateOrders(ordersData.pending.map(order => ({
        id: order.id,
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      }))),
      incoming: deduplicateOrders(ordersData.incoming.map(order => ({
        id: order.id,
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      }))),
      outgoing: deduplicateOrders(ordersData.outgoing.map(order => ({
        id: order.id,
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      }))),
      completed: deduplicateOrders(ordersData.completed.map(order => ({
        id: order.id,
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      }))),
      disputed: deduplicateOrders(ordersData.disputed.map(order => ({
        id: order.id,
        amount: order.amount,
        item: order.item,
        details: order.details,
        timing: order.timing,
        additionalInfo: order.additionalInfo
      })))
    } : {
      accepted: [],
      pending: [],
      incoming: [],
      outgoing: [],
      completed: [],
      disputed: []
    };

    // Add optimistic orders to pending ONLY (they will be auto-cleared when server data arrives)
    const allPendingOrders = [...serverOrders.pending, ...optimisticOrders];
    
    return {
      ...serverOrders,
      pending: deduplicateOrders(allPendingOrders)
    };
  }, [ordersData, optimisticOrders]);

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

  const ordersByStatus = getOrdersByStatus;

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
                    key={`${order.amount}-${order.item}-${index}`}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsSummaryOpen(true);
                    }}
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
            <div className='text-center py-12 flex flex-col items-center font-space-grotesk'>
              {/* <ShoppingBag className='h-12 w-12 text-gray-400 mx-auto mb-4' /> */}
              <img src="/twobags.png" alt="twinbags" className='h-12 w-12 md:h-24 md:w-24'/>
              <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                You currently have no orders in this category
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
            onClick={() => setIsOrderModalOpen(true)}
            className='fixed bottom-24 right-8 w-14 h-14 bg-purple-800 hover:bg-purple-900 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors'
          >
            <Plus className='text-3xl font-light cursor-pointer' />
          </button>
        )}
      </div>

      <PlaceOrderModal
        isOpen={isOrderModalOpen}
        onOpenChange={setIsOrderModalOpen}
        onOrderPlaced={(newOrder: Order) => {
          // console.log('Order placed, adding optimistic update:', newOrder);

          // Add to optimistic state immediately
          setOptimisticOrders(prev => [...prev, { ...newOrder, id: `temp_${Date.now()}` }]);

          // Trigger a refetch in the background
          queryClient.invalidateQueries({
            queryKey: ['orders']
          });
        }}
      />

      <OrderSummaryModal
        isOpen={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        orderId={selectedOrder?.id}
      />
    </DashboardLayout>
  );
}