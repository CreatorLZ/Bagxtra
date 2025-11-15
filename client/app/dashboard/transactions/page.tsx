'use client';

import { useState } from 'react';
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
  DollarSign,
  Search,
  MoreHorizontal,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Helper Components ---

// Status Label Component (Adapted for Transactions Page Screenshot)
const StatusBadge = ({ status }: { status: string }) => {
  let dotClass = '';
  let textClass = '';

  switch (status.toLowerCase()) {
    case 'received':
      dotClass = 'bg-green-500';
      textClass = 'text-green-800';
      break;
    case 'pending':
    default:
      dotClass = 'bg-yellow-500';
      textClass = 'text-yellow-800';
  }

  return (
    <div className="flex items-center">
      <div className={`h-2 w-2 rounded-full mr-2 ${dotClass}`} />
      <span className={`text-sm font-medium ${textClass}`}>
        {status}
      </span>
    </div>
  );
};

// --- Mock Data ---
const mockTransactions = [
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Babariga Alex',
    commission: 'NGN 500.00',
    status: 'Pending',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  {
    shopper: 'Daramola Oluwadara',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1500.00',
    status: 'Received',
    paymentDate: '15-11-2024',
  },
  // Add more data for pagination
  {
    shopper: 'Jane Smith',
    traveler: 'Adeshina Adewale',
    commission: 'NGN 1000.00',
    status: 'Received',
    paymentDate: '14-11-2024',
  },
];

// --- Main Vendor Transactions Page ---
export default function VendorTransactionsPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Screenshot shows 8 items
  const totalPages = Math.ceil(mockTransactions.length / itemsPerPage);
  const paginatedTransactions = mockTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Transactions
        </h2>

        {/* Commissions Received Banner */}
        <Card className="rounded-lg shadow-xs border border-gray-200 font-space-grotesk bg-purple-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Commissions Received
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                NGN 20,000.00
              </p>
            </div>
            <Button className="bg-purple-800 hover:bg-purple-900 text-white">
              <Wallet className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="rounded-xl shadow-xs border-gray-200 font-space-grotesk">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 p-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Transactions
            </h3>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-[120px] bg-white border-gray-300 rounded-md">
                  <SelectValue placeholder="Order By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[100px] bg-white border-gray-300 rounded-md">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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
                <TableHeader className="bg-purple-50 text-purple-900!">
                  <TableRow>
                    <TableHead className="w-[50px] px-4 text-purple-900!">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="px-4 text-purple-900">Shopper</TableHead>
                    <TableHead className="px-4 text-purple-900">Traveler</TableHead>
                    <TableHead className="px-4 text-purple-900">Commission Earned</TableHead>
                    <TableHead className="px-4 text-purple-900">Status</TableHead>
                    <TableHead className="px-4 text-purple-900">Payment Date</TableHead>
                    <TableHead className="w-[50px] px-4 text-purple-900!"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((tx, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-4">
                        <Checkbox />
                      </TableCell>
                      <TableCell className="px-4 font-medium text-gray-900">
                        {tx.shopper}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {tx.traveler}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {tx.commission}
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {tx.paymentDate}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <button className="text-gray-500 hover:text-gray-900">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
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
                    )
                  )}
                  {/* Add ellipsis logic here if totalPages is large */}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}