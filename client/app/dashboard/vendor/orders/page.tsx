'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  MoreHorizontal,
  Bell,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OpenDisputeModal } from '@/components/OpenDisputeModal';

// --- Types ---
type OrderStatusTab = 'completed' | 'incoming' | 'awaiting';

interface VendorOrder {
  invoice: string;
  travelerName: string;
  logInDate: string;
  logInTime: string;
  shopperName: string;
  pickupDate: string;
  pickupTime: string;
}

// --- Mock Data for Vendor Orders ---
const mockOrders: Record<OrderStatusTab, VendorOrder[]> = {
  completed: [
    {
      invoice: '0000001',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000002',
      travelerName: 'Jane Smith',
      logInDate: '15-11-2024',
      logInTime: '8:00 AM',
      shopperName: 'Mike Johnson',
      pickupDate: '16-11-2024',
      pickupTime: '8:00 AM',
    },
    // ... more completed orders (8 more to match the screenshot)
    {
      invoice: '0000003',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000004',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000005',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000006',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000007',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000008',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000009',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000010',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
    {
      invoice: '0000011',
      travelerName: 'Daramola Oluwadara',
      logInDate: '15-11-2024',
      logInTime: '7:45 AM',
      shopperName: 'Daramola Oluwadara',
      pickupDate: '16-11-2024',
      pickupTime: '7:45 AM',
    },
  ],
  incoming: [
    {
      invoice: '0000012',
      travelerName: 'Incoming Traveler',
      logInDate: '17-11-2024',
      logInTime: '9:00 AM',
      shopperName: 'Incoming Shopper',
      pickupDate: '18-11-2024',
      pickupTime: '9:00 AM',
    },
    // ... more incoming orders
  ],
  awaiting: [
    {
      invoice: '0000013',
      travelerName: 'Awaiting Traveler',
      logInDate: '18-11-2024',
      logInTime: '10:00 AM',
      shopperName: 'Awaiting Shopper',
      pickupDate: '19-11-2024',
      pickupTime: '10:00 AM',
    },
    // ... more awaiting orders
  ],
};

// --- Main Vendor Orders Page ---
export default function VendorOrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatusTab>('completed');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // As seen in the screenshot
  const currentOrderData = mockOrders[activeTab];
  const totalPages = Math.ceil(currentOrderData.length / itemsPerPage);
  const paginatedOrders = currentOrderData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (invoice: string) => {
    router.push(`/dashboard/vendor/orders/${invoice}`);
  };

  const handleOpenDispute = (invoice: string) => {
    setSelectedOrderId(invoice);
    setDisputeModalOpen(true);
  };

  const tabs: { key: OrderStatusTab; label: string }[] = [
    { key: 'completed', label: 'Completed' },
    { key: 'incoming', label: 'Incoming' },
    { key: 'awaiting', label: 'Awaiting Pick-up' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title (as in screenshot) */}
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Orders
        </h2>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1); // Reset to page 1 on tab switch
              }}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-b-2 border-purple-800 text-purple-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table Card */}
        <Card className="rounded-xl shadow-xs border-gray-200 font-space-grotesk">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-end space-y-4 md:space-y-0 p-4">
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-[120px] bg-white border-gray-300 rounded-md">
                  <SelectValue placeholder="Filter By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="traveler">Traveler</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[120px] bg-white border-gray-300 rounded-md">
                  <SelectValue placeholder="Order By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date Asc</SelectItem>
                  <SelectItem value="date-desc">Date Desc</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search"
                  className="pl-8 w-[180px] bg-white border-gray-300 rounded-md"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-purple-50">
                  <TableRow>
                    <TableHead className="w-[50px] px-4">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="px-4 text-purple-900">Invoice</TableHead>
                    <TableHead className="px-4 text-purple-900">Traveler's Name</TableHead>
                    <TableHead className="px-4 text-purple-900" colSpan={2}>Log In Date & Time</TableHead>
                    <TableHead className="px-4 text-purple-900">Shopper's Name</TableHead>
                    <TableHead className="px-4 text-purple-900" colSpan={2}>Pick up Date & Time</TableHead>
                    <TableHead className="w-[50px] px-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-4">
                        <Checkbox />
                      </TableCell>
                      <TableCell className="px-4 font-medium text-gray-900">
                        {order.invoice}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.travelerName}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.logInDate}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.logInTime}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.shopperName}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.pickupDate}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.pickupTime}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-gray-500 hover:text-gray-900">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleViewDetails(order.invoice)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDispute(order.invoice)}>
                              Open Dispute
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* pagination */}
        <div className="flex justify-center p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>

              {/* Logic to show pagination links */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                // Implement Ellipsis logic if many pages
                .map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                      className={
                        page === currentPage
                          ? 'bg-purple-100 text-purple-800' // Active style
                          : ''
                      }
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              {/* Add Ellipsis logic here if totalPages > 10 */}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <OpenDisputeModal
        isOpen={disputeModalOpen}
        onOpenChange={setDisputeModalOpen}
        orderId={selectedOrderId}
      />
    </DashboardLayout>
  );
}