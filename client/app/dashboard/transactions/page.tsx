'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { ChevronRight, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Mock data - replace with actual API call
const transactions = [
  {
    id: 'TXN001',
    type: 'credit',
    amount: 2500.00,
    description: 'Order payment - Zara handbag',
    date: '2024-11-13',
    status: 'completed',
  },
  {
    id: 'TXN002',
    type: 'debit',
    amount: 150.00,
    description: 'Platform fee',
    date: '2024-11-12',
    status: 'completed',
  },
  {
    id: 'TXN003',
    type: 'credit',
    amount: 1800.00,
    description: 'Order payment - Nike sneakers',
    date: '2024-11-11',
    status: 'completed',
  },
  {
    id: 'TXN004',
    type: 'credit',
    amount: 3200.00,
    description: 'Order payment - Gucci wallet',
    date: '2024-11-10',
    status: 'pending',
  },
];

export default function TransactionsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  const totalCredits = transactions
    .filter(t => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter(t => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout>
      <motion.div
        className='max-w-6xl mx-auto space-y-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Transactions</h1>
              <p className='text-gray-600 mt-1'>Track all your financial transactions</p>
            </div>
            <Button variant='outline' className='flex items-center space-x-2'>
              <Filter className='h-4 w-4' />
              <span>Filter</span>
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants}>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                  <ArrowDownLeft className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Credits</p>
                  <p className='text-2xl font-bold text-gray-900'>${totalCredits.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <ArrowUpRight className='h-6 w-6 text-red-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Debits</p>
                  <p className='text-2xl font-bold text-gray-900'>${totalDebits.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                  <div className='w-6 h-6 bg-purple-600 rounded-full'></div>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Net Balance</p>
                  <p className='text-2xl font-bold text-gray-900'>${(totalCredits - totalDebits).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div variants={itemVariants}>
          <Card className='rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='font-semibold'>Transaction ID</TableHead>
                  <TableHead className='font-semibold'>Type</TableHead>
                  <TableHead className='font-semibold'>Description</TableHead>
                  <TableHead className='font-semibold'>Amount</TableHead>
                  <TableHead className='font-semibold'>Date</TableHead>
                  <TableHead className='font-semibold'>Status</TableHead>
                  <TableHead className='font-semibold'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    className='border-b border-gray-100 hover:bg-gray-50'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TableCell className='font-medium'>{transaction.id}</TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        {transaction.type === 'credit' ? (
                          <ArrowDownLeft className='h-4 w-4 text-green-600' />
                        ) : (
                          <ArrowUpRight className='h-4 w-4 text-red-600' />
                        )}
                        <span className='capitalize'>{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className={transaction.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant='ghost' size='sm'>
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}