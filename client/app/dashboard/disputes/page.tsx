'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatName } from '@/lib/utils';

// --- Helper Components (Inlined to fix import error) ---

// --- Types (Exported so the main page can use them) ---
export type DisputeStatus = 'resolving' | 'resolved' | 'pending';

export interface Dispute {
  id: string;
  status: DisputeStatus;
  description: string;
  travelerName: string;
  travelerAvatar: string;
  shopperName: string;
  shopperAvatar: string;
}

// --- Status Badge Helper (Exact Colors from Screenshot) ---
const StatusBadge = ({ status }: { status: DisputeStatus }) => {
  let colors = '';
  let text = '';

  switch (status) {
    case 'resolving':
      // Yellow/Orange color
      colors = 'bg-yellow-100 text-yellow-800';
      text = 'Resolving';
      break;
    case 'resolved':
      // Green color
      colors = 'bg-green-100 text-green-800';
      text = 'Resolved';
      break;
    case 'pending':
      // Purple/Pink color
      colors = 'bg-purple-100 text-purple-800';
      text = 'Pending Review';
      break;
  }

  return (
    <div
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center ${colors}`}
    >
      {/* Dot color matches the text color */}
      <span
        className='inline-block w-2 h-2 rounded-full mr-1.5'
        style={{ backgroundColor: 'currentColor' }}
      />
      {text}
    </div>
  );
};

// --- User Info Helper ---
const UserInfo = ({
  title,
  name,
  avatar,
}: {
  title: string;
  name: string;
  avatar: string;
}) => (
  <div className='shadow-sm p-3 px-5 rounded-lg'>
    <h4 className='text-xs font-medium text-gray-500 mb-2'>{title}</h4>
    <div className='flex items-start gap-2 flex-col space-x-2'>
      <Avatar className='h-14 w-14 rounded-md'>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className='flex items-center'>
        <span className='text-sm font-medium text-gray-900'>{name}</span>
        {/* <CheckCircle className="h-4 w-4 text-green-500" /> */}
        <img src='/verified.png' alt='' className='h-4 w-4' />
      </div>
    </div>
  </div>
);

// --- Main Card Component ---
interface DisputeCardProps {
  dispute: Dispute;
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  return (
    <Card className='rounded-xl shadow-xs border border-gray-200 font-sans hover:shadow-md transition-shadow'>
      <CardContent className='p-5 space-y-4'>
        {/* Header: ID and Status */}
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold text-gray-900'>{dispute.id}</h3>
          <StatusBadge status={dispute.status} />
        </div>

        {/* Description */}
        <p className='text-sm text-gray-600 leading-relaxed'>
          {dispute.description}
        </p>

        {/* User Info */}
        <div className='flex items-center justify-between pt-2'>
          <UserInfo
            title="Traveler's Information"
            name={formatName(dispute.travelerName)}
            avatar={dispute.travelerAvatar}
          />
          <UserInfo
            title="Shopper's Information"
            name={formatName(dispute.shopperName)}
            avatar={dispute.shopperAvatar}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Mock Data ---
const mockDisputes: Dispute[] = [
  {
    id: 'DISP 0001',
    status: 'resolving',
    description:
      'The bag was exposed, looked very tattered and I thought to flag it, as I don’t think the traveler would want it like this.',
    travelerName: 'Daramola Oluwadara',
    travelerAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    shopperName: 'Daramola Oluwadara',
    shopperAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
  },
  {
    id: 'DISP 0001',
    status: 'resolved',
    description:
      'The bag was exposed, looked very tattered and I thought to flag it, as I don’t think the traveler would want it like this.',
    travelerName: 'Daramola Oluwadara',
    travelerAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    shopperName: 'Daramola Oluwadara',
    shopperAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
  },
  {
    id: 'DISP 0001',
    status: 'pending',
    description:
      'The bag was exposed, looked very tattered and I thought to flag it, as I don’t think the traveler would want it like this.',
    travelerName: 'Daramola Oluwadara',
    travelerAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    shopperName: 'Daramola Oluwadara',
    shopperAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
  },
  {
    id: 'DISP 0001',
    status: 'resolving',
    description:
      'The bag was exposed, looked very tattered and I thought to flag it, as I don’t think the traveler would want it like this.',
    travelerName: 'Daramola Oluwadara',
    travelerAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    shopperName: 'Daramola Oluwadara',
    shopperAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
  },
  {
    id: 'DISP 0001',
    status: 'resolved',
    description:
      'The bag was exposed, looked very tattered and I thought to flag it, as I don’t think the traveler would want it like this.',
    travelerName: 'Daramola Oluwadara',
    travelerAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    shopperName: 'Daramola Oluwadara',
    shopperAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
  },
  {
    id: 'DISP 0001',
    status: 'resolving',
    description:
      'The bag was exposed, looked very tattered and I thought to flag it, as I don’t think the traveler would want it like this.',
    travelerName: 'Daramola Oluwadara',
    travelerAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    shopperName: 'Daramola Oluwadara',
    shopperAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
  },
];

// --- Main Vendor Dispute Page ---
export default function VendorDisputePage() {
  return (
    <DashboardLayout>
      <div className='space-y-6 font-space-grotesk'>
        {/* Header: Title and Filters (Copied from your homepage structure) */}
        <div className='flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0'>
          <h2 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
            DISPUTES
          </h2>
          <div className='flex items-center space-x-2'>
            <Select>
              <SelectTrigger className='w-[120px] bg-white border-gray-300 rounded-md'>
                <SelectValue placeholder='Order By' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date-new'>Newest</SelectItem>
                <SelectItem value='date-old'>Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className='w-[100px] bg-white border-gray-300 rounded-md'>
                <Filter className='h-4 w-4 mr-2 text-gray-500' />
                <SelectValue placeholder='Filter' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='resolving'>Resolving</SelectItem>
                <SelectItem value='resolved'>Resolved</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className='relative'>
              <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500' />
              <Input
                placeholder='Search'
                className='pl-8 w-[180px] bg-white border-gray-300 rounded-md'
              />
            </div>
          </div>
        </div>

        {/* Disputes Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {mockDisputes.map((dispute, index) => (
            <DisputeCard key={index} dispute={dispute} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
