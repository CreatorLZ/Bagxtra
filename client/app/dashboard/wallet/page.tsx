'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function WalletPage() {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Mock data - replace with actual API call
  const walletBalance = 1250.75;
  const monthlyEarnings = 875.5;
  const pendingPayouts = 320.25;

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'credit',
      amount: 150.0,
      description: 'Delivery reward - iPhone 15 Pro',
      date: '2024-11-15',
      status: 'completed',
    },
    {
      id: '2',
      type: 'credit',
      amount: 200.0,
      description: 'Delivery reward - MacBook Air',
      date: '2024-11-12',
      status: 'completed',
    },
    {
      id: '3',
      type: 'debit',
      amount: 50.0,
      description: 'Platform fee',
      date: '2024-11-10',
      status: 'completed',
    },
    {
      id: '4',
      type: 'credit',
      amount: 180.0,
      description: 'Delivery reward - Nike Air Max',
      date: '2024-11-08',
      status: 'pending',
    },
    {
      id: '5',
      type: 'credit',
      amount: 95.5,
      description: 'Delivery reward - Samsung Galaxy',
      date: '2024-11-05',
      status: 'completed',
    },
  ];

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Wallet</h1>
            <p className='text-gray-600'>
              Track your earnings and manage payouts
            </p>
          </div>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Export Statement
          </Button>
        </div>

        {/* Balance Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <Wallet className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Available Balance
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${walletBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>This Month</p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${monthlyEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-orange-600' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Pending Payouts
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  ${pendingPayouts.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Quick Actions
          </h3>
          <div className='flex flex-wrap gap-3'>
            <Button className='bg-purple-900 hover:bg-purple-800'>
              Withdraw Funds
            </Button>
            <Button variant='outline'>Add Bank Account</Button>
            <Button variant='outline'>View Tax Documents</Button>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Transaction History
            </h3>
            <div className='flex space-x-2'>
              {[
                { key: 'all', label: 'All' },
                { key: 'credit', label: 'Credits' },
                { key: 'debit', label: 'Debits' },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter(key as any)}
                  className={
                    filter === key ? 'bg-purple-900 hover:bg-purple-800' : ''
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className='space-y-4'>
            {filteredTransactions.map(transaction => (
              <div
                key={transaction.id}
                className='flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <div className='flex items-center space-x-4'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    {transaction.type === 'credit' ? (
                      <ArrowUpRight className='h-5 w-5 text-green-600' />
                    ) : (
                      <ArrowDownRight className='h-5 w-5 text-red-600' />
                    )}
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {transaction.description}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-4'>
                  <Badge
                    className={`${getStatusColor(
                      transaction.status
                    )} capitalize`}
                  >
                    {transaction.status}
                  </Badge>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.type === 'credit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}$
                    {transaction.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className='text-center py-8'>
              <p className='text-gray-600'>
                No transactions found for the selected filter.
              </p>
            </div>
          )}
        </Card>

        {/* Earnings Summary */}
        <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Earnings Summary
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>
                $
                {transactions
                  .filter(t => t.type === 'credit' && t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
              <p className='text-sm text-gray-600'>Total Earned</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-600'>
                $
                {transactions
                  .filter(t => t.type === 'debit')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
              <p className='text-sm text-gray-600'>Total Fees</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-purple-600'>
                {transactions.filter(t => t.status === 'pending').length}
              </p>
              <p className='text-sm text-gray-600'>Pending</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-900'>
                {transactions.length}
              </p>
              <p className='text-sm text-gray-600'>Total Transactions</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
