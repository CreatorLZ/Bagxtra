'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronLeft,
  MoreVertical,
  Plane,
  Star,
  CheckCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { useOrderDetails } from '@/hooks/dashboard/useOrderDetails';
import { useRole } from '@/hooks/useRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import NextImage from 'next/image';

// --- Helper: Flight Path Visualization ---
const FlightPath = () => (
  <div className="flex items-center justify-between mt-6 px-2">
    {/* Origin */}
    <div className="text-left">
      <p className="text-xl font-bold text-gray-900">LA</p>
      <div className="text-xs text-gray-500 space-y-1 mt-1">
        <p>12/12/25</p>
        <p>10:30 am</p>
      </div>
    </div>

    {/* Path Graphic */}
    <div className="flex flex-col items-center flex-1 px-4 relative">
      <Plane className="h-5 w-5 text-gray-400 mb-2 transform rotate-45" />
      <div className="w-full flex items-center gap-1">
        <div className="h-[1px] w-full bg-gray-300" />
        <div className="h-[1px] w-full bg-gray-300 border-t border-dashed" />
        <div className="h-[1px] w-full bg-gray-300" />
      </div>
      <p className="text-xs text-gray-500 mt-2">2h10m</p>
    </div>

    {/* Destination */}
    <div className="text-right">
      <p className="text-xl font-bold text-gray-900">LAG</p>
      <div className="text-xs text-gray-500 space-y-1 mt-1">
        <p>12/12/25</p>
        <p>12:40 pm</p>
      </div>
    </div>
  </div>
);

// --- Props Interface ---
interface OrderSummaryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  orderId?: string; // Match ID to fetch detailed order information
}

export function OrderSummaryModal({ isOpen, onOpenChange, orderId }: OrderSummaryModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { role } = useRole();

  // Fetch order details
  const { data: orderDetails, isLoading, error } = useOrderDetails(orderId || '');

  // Show loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-[#F8F9FA] h-[90vh] max-h-[800px] flex flex-col overflow-hidden rounded-3xl font-space-grotesk border-0 focus:outline-none">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900"></div>
            <span className="ml-2 text-gray-600">Loading order details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-[#F8F9FA] h-[90vh] max-h-[800px] flex flex-col overflow-hidden rounded-3xl font-space-grotesk border-0 focus:outline-none">
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <p className="text-red-600 mb-2">Failed to load order details</p>
              <p className="text-gray-500 text-sm">Please try again later</p>
              <button
                onClick={() => onOpenChange(false)}
                className="mt-4 px-4 py-2 bg-purple-900 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Don't render if no order details
  if (!orderDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-[#F8F9FA] h-[90vh] max-h-[95vh] md:h-[95vh] flex flex-col overflow-hidden rounded-3xl font-space-grotesk border-0 focus:outline-none">

        {/* --- Sticky Header --- */}
        <div className="flex items-center justify-between p-6 bg-[#F8F9FA] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <DialogTitle className="text-xl font-semibold text-gray-900">Order Summary</DialogTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors focus:outline-none">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-1 mt-2">
              <DropdownMenuItem className="cursor-pointer py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium focus:bg-gray-50">
                Open Dispute
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2.5 px-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium focus:bg-gray-50">
                Download Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* --- Scrollable Body --- */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-4">

          {/* Image Preview */}
          <div className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200 bg-white">
            {orderDetails.products[selectedImageIndex]?.photos?.[0] ? (
              <NextImage
                src={orderDetails.products[selectedImageIndex].photos[0]}
                alt={orderDetails.products[selectedImageIndex].name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500 text-lg font-medium">
                  No image available
                </span>
              </div>
            )}
          </div>

          {/* 1. Images Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pt-2 px-2">
            {orderDetails.products.map((product, i) => (
              <div
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                onMouseEnter={() => setSelectedImageIndex(i)}
                className={`h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 bg-white relative cursor-pointer transition-all hover:scale-105 ${
                  selectedImageIndex === i ? 'border-purple-500 shadow-md' : 'border-gray-200'
                }`}
              >
                {product.photos?.[0] ? (
                  <NextImage
                    src={product.photos[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-600 font-medium">{i + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2. Product Title & Price Card */}
          <Card className="p-5 border-none shadow-sm rounded-2xl bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {orderDetails.products[selectedImageIndex]?.name || 'Product'}
            </h3>
            <p className="text-gray-600 font-medium mb-4">
              ${orderDetails.products[selectedImageIndex]?.price || 0} - ${orderDetails.products[selectedImageIndex]?.price || 0} x {orderDetails.products[selectedImageIndex]?.quantity || 1} {orderDetails.products[selectedImageIndex]?.quantity === 1 ? 'Unit' : 'Units'}
            </p>
            <div className="bg-gray-50 px-3 py-2.5 rounded-lg text-sm text-gray-500 truncate flex items-center gap-2 border border-gray-100">
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
              <span className="truncate text-blue-600 underline decoration-blue-200 underline-offset-2">
                {orderDetails.products[selectedImageIndex]?.link || '#'}
              </span>
            </div>
          </Card>

          {/* 3. Product Description Card */}
          <Card className="p-5 border-none shadow-sm rounded-2xl bg-white space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Product Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {orderDetails.products[selectedImageIndex]?.additionalInfo ||
               `Product: ${orderDetails.products[selectedImageIndex]?.name || 'N/A'}
               Colour: ${orderDetails.products[selectedImageIndex]?.colour || 'N/A'}
               Weight: ${orderDetails.products[selectedImageIndex]?.weight || 0}kg
               Quantity: ${orderDetails.products[selectedImageIndex]?.quantity || 1}`}
            </p>
          </Card>

          {/* 4. Traveler/Shopper Information Card */}
          <Card className="p-5 border-none shadow-sm rounded-2xl bg-white">
            <h4 className="text-sm font-medium text-gray-400 mb-4">
              {role === 'traveler' ? "Shopper's Information" : "Traveler's Information"}
            </h4>

            {/* Top Section: Profile */}
            <div className="flex flex-col items-left gap-3 border-b border-b-gray-200 pb-2.5 mb-4">
              <NextImage
                src={role === 'traveler' ? (orderDetails.shopper.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop') : (orderDetails.traveler.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop')}
                alt={role === 'traveler' ? orderDetails.shopper.name : orderDetails.traveler.name}
                width={80}
                height={80}
                className="rounded-lg bg-gray-200 h-20 w-20 object-cover"
              />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 flex items-center justify-start gap-1 font-sans">
                  {role === 'traveler' ? orderDetails.shopper.name : orderDetails.traveler.name}
                  <img src="/verified.png" alt="verified" className='h-4 w-4' />
                </h3>
                <div className="flex gap-0.5 justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor((role === 'traveler' ? orderDetails.shopper.rating : orderDetails.traveler.rating) || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Section: Flight Info (only for shoppers) or Order Info (for travelers) */}
            {role === 'shopper' ? (
              <div className="flex justify-between items-center text-sm">
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">
                    {orderDetails.trip.fromCountry}
                  </div>
                  <div className="text-gray-600 flex">{orderDetails.trip.departureDate} <span className='pl-3'>--------</span></div>
                  <div className="text-gray-600">{orderDetails.trip.departureTime}</div>
                </div>
                <div className="text-center text-gray-500">
                  <Plane className="mx-auto" />
                  <div className="mt-1">{orderDetails.trip.duration}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{orderDetails.trip.toCountry}</div>
                  <div className="text-gray-600 flex"><span className='pr-3'>--------</span>{orderDetails.trip.arrivalDate}</div>
                  <div className="text-gray-600">{orderDetails.trip.arrivalTime}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Order Status:</strong> {orderDetails.order.status}</div>
                <div><strong>Match Score:</strong> {orderDetails.order.matchScore}%</div>
                <div><strong>Delivery:</strong> {orderDetails.delivery.fromCountry} → {orderDetails.delivery.toCountry}</div>
                <div><strong>Pickup:</strong> {orderDetails.delivery.pickup ? 'Required' : 'Not required'}</div>
              </div>
            )}
          </Card>
        </div>

        {/* --- Bottom Fixed Action Button --- */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-white/0 pt-10">
          <Button className="w-full h-14 text-base font-medium bg-purple-900 hover:bg-purple-800 cursor-pointer text-white rounded-xl shadow-xl shadow-purple-900/10 transition-all active:scale-[0.98]">
            Make Payment (${orderDetails.order.priceSummary.totalItemCost + orderDetails.order.priceSummary.deliveryFee + orderDetails.order.priceSummary.serviceFee + orderDetails.order.priceSummary.tax})
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}