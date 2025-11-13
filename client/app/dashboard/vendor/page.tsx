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
  Package,
  CheckSquare,
  PauseCircle,
  DollarSign,
  Search,
  Filter,
  MoreHorizontal,
  Bell,
  ShoppingBag,
  CalendarCheck2,
  CalendarX2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Helper Components ---

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}) => {
  return (
    <Card className={`rounded-lg shadow-xs border border-gray-200 font-space-grotesk ${bgColor}`}>
      <CardHeader className="flex flex-col items-start space-y-2 pb-2">
        <Icon className="h-6 w-6 font-medium text-gray-700" />
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-700">{value}</div>
      </CardContent>
    </Card>
  );
};

// Status Label Component
const StatusBadge = ({ status }: { status: string }) => {
  let colorClass = '';
  switch (status.toLowerCase()) {
    case 'received':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'disputed':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'logged in':
    default:
      colorClass = 'bg-purple-800 text-purple-800'; // Assuming Logged In is a "pending" state
  }

  return (
    <div className="flex items-center">
      <div
        className={`h-2 w-2 rounded-full mr-2 ${
          status.toLowerCase() === 'received'
            ? 'bg-green-500'
            : status.toLowerCase() === 'disputed'
            ? 'bg-red-500'
            : 'bg-purple-800'
        }`}
      />
      <span className={`text-sm font-medium ${colorClass.split(' ')[1]}`}>
        {status}
      </span>
    </div>
  );
};

// --- Mock Data ---
const mockRecentOrders = [
  {
    invoice: '0000001',
    shopper: 'Daramola Oluwadara',
    traveler: 'Daramola Oluwadara',
    verCode: '09475',
    status: 'Logged In',
    logInDate: '15-11-2024',
  },
  {
    invoice: '0000002',
    shopper: 'Jane Smith',
    traveler: 'Mike Johnson',
    verCode: '34521',
    status: 'Received',
    logInDate: '14-11-2024',
  },
  {
    invoice: '0000003',
    shopper: 'Alice Brown',
    traveler: 'Bob Wilson',
    verCode: '25678',
    status: 'Disputed',
    logInDate: '13-11-2024',
  },
  {
    invoice: '0000004',
    shopper: 'Charlie Davis',
    traveler: 'Eva Garcia',
    verCode: '09870',
    status: 'Logged In',
    logInDate: '12-11-2024',
  },
  {
    invoice: '0000005',
    shopper: 'Frank Miller',
    traveler: 'Grace Lee',
    verCode: '56789',
    status: 'Received',
    logInDate: '11-11-2024',
  },
  {
    invoice: '0000006',
    shopper: 'Helen Taylor',
    traveler: 'Ian Brown',
    verCode: '12345',
    status: 'Logged In',
    logInDate: '10-11-2024',
  },
  {
    invoice: '0000007',
    shopper: 'Jack Wilson',
    traveler: 'Karen Davis',
    verCode: '67890',
    status: 'Disputed',
    logInDate: '09-11-2024',
  },
  {
    invoice: '0000008',
    shopper: 'Laura Garcia',
    traveler: 'Mark Johnson',
    verCode: '54321',
    status: 'Received',
    logInDate: '08-11-2024',
  },
];

// --- Main Vendor Dashboard Page ---
export default function VendorDashboardPage() {
  // Mock data for the stat cards
  const stats = [
    {
      title: 'Total Orders',
      value: '0',
      icon: ShoppingBag,
      bgColor: 'bg-lime-50',
      iconColor: 'text-gray-700',
    },
    {
      title: 'Verified Orders',
      value: '0',
      icon: CalendarCheck2,
      bgColor: 'bg-blue-50',
      iconColor: 'text-gray-700',
    },
    {
      title: 'Orders Withheld',
      value: '0',
      icon: CalendarX2,
      bgColor: 'bg-purple-50',
      iconColor: 'text-gray-700',
    },
    {
      title: 'Commission Earned',
      value: '0',
      icon: DollarSign,
      bgColor: 'bg-cyan-50',
      iconColor: 'text-gray-700',
    },
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(mockRecentOrders.length / itemsPerPage);
  const paginatedOrders = mockRecentOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Overview Section */}
        <div>
          <h2 className="text-xs  font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                bgColor={stat.bgColor}
                iconColor={stat.iconColor}
              />
            ))}
          </div>
        </div>

        {/* Recent Orders Table */}
        <Card className="rounded-xl shadow-xs border-gray-200 font-space-grotesk">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 p-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Recent Orders
            </h3>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-[120px] bg-white border-gray-300 rounded-md">
                  <SelectValue placeholder="Order By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[100px] bg-white border-gray-300 rounded-md">
                  {/* <Filter className="h-4 w-4 mr-2 text-gray-500" /> */}
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="logged-in">Logged In</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
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
                    <TableHead className="px-4 text-purple-900">Invoice</TableHead>
                    <TableHead className="px-4 text-purple-900">Shopper's Name</TableHead>
                    <TableHead className="px-4 text-purple-900">Traveler's Name</TableHead>
                    <TableHead className="px-4 text-purple-900">Ver. Code</TableHead>
                    <TableHead className="px-4 text-purple-900">Status</TableHead>
                    <TableHead className="px-4 text-purple-900">Log In Date</TableHead>
                    <TableHead className="w-[50px] px-4 text-purple-900!"></TableHead>
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
                        {order.shopper}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.traveler}
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.verCode}
                      </TableCell>
                      <TableCell className="px-4">
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="px-4 text-gray-600">
                        {order.logInDate}
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
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
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
