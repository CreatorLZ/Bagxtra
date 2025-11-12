'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TransactionItem } from '@/components/TransactionItem';

// --- Data Types ---
interface Transaction {
  id: number;
  type: 'payment' | 'deposit';
  status: 'successful' | 'failed';
  description: string;
  amount: number; // Stored as a number, formatted on display
  currency: string;
  date: string;
  time: string;
}

// --- Mock Data ---
const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: 'payment',
    status: 'successful',
    description: 'Payment for delivery',
    amount: 400000,
    currency: '₦',
    date: '22 March, 2025',
    time: '11:02:34',
  },
  {
    id: 2,
    type: 'deposit',
    status: 'successful',
    description: 'Wallet Deposit',
    amount: 400000,
    currency: '₦',
    date: '22 March, 2025',
    time: '11:02:34',
  },
  {
    id: 3,
    type: 'payment',
    status: 'failed',
    description: 'Payment for delivery',
    amount: 400000,
    currency: '₦',
    date: '22 March, 2025',
    time: '11:02:34',
  },
  {
    id: 4,
    type: 'payment',
    status: 'successful',
    description: 'Payment for delivery',
    amount: 400000,
    currency: '₦',
    date: '22 March, 2025',
    time: '11:02:34',
  },
  {
    id: 5,
    type: 'deposit',
    status: 'successful',
    description: 'Wallet Deposit',
    amount: 400000,
    currency: '₦',
    date: '21 March, 2025',
    time: '18:15:00',
  },
  {
    id: 6,
    type: 'payment',
    status: 'successful',
    description: 'Payment for delivery',
    amount: 400000,
    currency: '₦',
    date: '21 March, 2025',
    time: '15:30:00',
  },
];

// Group transactions by date
const groupedTransactions = mockTransactions.reduce(
  (acc: Record<string, Transaction[]>, tx) => {
    const dateKey = tx.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  },
  {}
);

// --- Main Component ---
export default function WalletPage() {
  const mockBalance = 170000;
  const currencySymbol = '$'; // Using USD for the balance display
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); // Mock currency selector

  const formatAmount = (amount: number): string =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 3, // Assuming this is how $170.000 is represented
    }).format(amount);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 font-space-grotesk">Wallet</h1>
        </div>

        {/* 1. Wallet Balance Card */}
        <div className="p-6 rounded-2xl shadow-xl text-white overflow-hidden relative isolate bg-purple-900">
          {/* Background pattern/overlay (like the faint circles in the screenshot) */}
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="h-64 w-64 rounded-full bg-white blur-3xl absolute -top-16 -left-16" />
            <div className="h-48 w-48 rounded-full bg-white blur-3xl absolute -bottom-12 -right-12" />
          </div>

          <div className="relative z-10 space-y-4">
            <p className="text-sm font-medium opacity-80">Wallet Balance</p>

            {/* Currency Selector (Mocked) */}
            <div className="flex justify-between items-center">
              <p className="text-4xl font-extrabold tracking-tight">
                {currencySymbol}
                {formatAmount(mockBalance)}
              </p>
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer">
                <img src="/usflag.png" alt="US Flag" className="inline w-4 h-4 md:w-7 md:h-7 mr-2" />
                <span className="mr-1">USD</span>
                <ChevronDown className="h-4 w-4 ml-1" /> {/* Mock dropdown icon */}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-around pt-6">
              <WalletActionButton
                icon={ArrowDownRight}
                label="Withdraw"
                color="text-white"
              />
              <WalletActionButton
                icon={ArrowUpRight}
                label="Fund"
                color="text-white"
              />
              <WalletActionButton
                icon={ArrowLeftRight}
                label="Convert"
                color="text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Transaction History Header */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Transaction History
          </h2>
          <button className="flex items-center text-sm text-purple-800 font-medium hover:text-purple-800">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* 3. Transactions List */}
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, transactions]) => (
            <div key={date}>
              <div className="text-sm text-gray-500 mb-3 font-medium border-b border-gray-100 pb-2">
                {date}
              </div>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          ))}

          {mockTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No transactions recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// --- Helper Components for WalletPage ---

// Component for the Withdraw/Fund/Convert buttons
interface WalletActionButtonProps {
  icon: React.ElementType;
  label: string;
  color: string;
}

const WalletActionButton = ({
  icon: Icon,
  label,
  color,
}: WalletActionButtonProps) => (
  <button className="flex flex-col items-center group focus:outline-none">
    <div className={`p-3 bg-purple-800 rounded-full transition-transform group-hover:scale-105 ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <span className="mt-2 text-xs font-semibold text-white group-hover:text-gray-200">
      {label}
    </span>
  </button>
);