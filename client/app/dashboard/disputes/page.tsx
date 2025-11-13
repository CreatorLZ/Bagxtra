'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { ChevronRight, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Mock data - replace with actual API call
const disputes = [
  {
    id: 'DSP001',
    orderId: 'ORD12345',
    customer: 'John Doe',
    reason: 'Item not as described',
    amount: 150.00,
    status: 'open',
    date: '2024-11-12',
    description: 'Customer claims the handbag received is different from the one shown in photos.',
  },
  {
    id: 'DSP002',
    orderId: 'ORD12346',
    customer: 'Jane Smith',
    reason: 'Late delivery',
    amount: 89.99,
    status: 'resolved',
    date: '2024-11-10',
    description: 'Package was delivered 3 days late. Customer was compensated.',
  },
  {
    id: 'DSP003',
    orderId: 'ORD12347',
    customer: 'Mike Johnson',
    reason: 'Damaged item',
    amount: 299.99,
    status: 'under_review',
    date: '2024-11-11',
    description: 'Customer reports the electronics item arrived damaged.',
  },
];

export default function DisputesPage() {
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

  const disputeCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className='h-5 w-5 text-orange-500' />;
      case 'resolved':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'under_review':
        return <Clock className='h-5 w-5 text-blue-500' />;
      case 'rejected':
        return <XCircle className='h-5 w-5 text-red-500' />;
      default:
        return <AlertTriangle className='h-5 w-5 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      under_review: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const openDisputes = disputes.filter(d => d.status === 'open').length;
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved').length;

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
              <h1 className='text-2xl font-bold text-gray-900'>Disputes</h1>
              <p className='text-gray-600 mt-1'>Manage customer disputes and resolutions</p>
            </div>
            <Button className='bg-purple-900 hover:bg-purple-800'>
              New Dispute
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants}>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                  <AlertTriangle className='h-6 w-6 text-orange-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Open Disputes</p>
                  <p className='text-2xl font-bold text-gray-900'>{openDisputes}</p>
                </div>
              </div>
            </Card>

            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                  <CheckCircle className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Resolved</p>
                  <p className='text-2xl font-bold text-gray-900'>{resolvedDisputes}</p>
                </div>
              </div>
            </Card>

            <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Clock className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Under Review</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {disputes.filter(d => d.status === 'under_review').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Disputes List */}
        <motion.div variants={itemVariants}>
          <div className='space-y-4'>
            {disputes.map((dispute, index) => (
              <motion.div
                key={dispute.id}
                custom={index}
                variants={disputeCardVariants}
                initial='hidden'
                animate='visible'
              >
                <Card className='p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-4 flex-1'>
                      <div className='flex-shrink-0'>
                        {getStatusIcon(dispute.status)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-3 mb-2'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            Dispute #{dispute.id}
                          </h3>
                          <Badge className={getStatusBadge(dispute.status)}>
                            {dispute.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mb-2'>
                          Order: {dispute.orderId} • Customer: {dispute.customer}
                        </p>
                        <p className='text-sm text-gray-800 mb-3'>
                          {dispute.description}
                        </p>
                        <div className='flex items-center space-x-4 text-sm text-gray-500'>
                          <span>Reason: {dispute.reason}</span>
                          <span>Amount: ${dispute.amount.toFixed(2)}</span>
                          <span>Date: {new Date(dispute.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Button variant='outline' size='sm'>
                        View Details
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}