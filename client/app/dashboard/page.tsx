'use client';

import { useUser } from '@/hooks/useUser';
import { UserButton, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Loader2, User, Mail, MapPin, Phone, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useUser();
  const { signOut } = useClerk();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Please sign in to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <Link href='/auth/login'>
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header with User Widget */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
            <p className='text-gray-600'>Welcome to BagXtra</p>
          </div>

          {/* User Widget */}
          <div className='flex items-center space-x-4'>
            <div className='text-right'>
              <p className='text-sm font-medium text-gray-900'>
                {user?.fullName}
              </p>
              <p className='text-xs text-gray-500'>{user?.email}</p>
            </div>
            <div className='flex items-center space-x-2'>
              <UserButton afterSignOutUrl='/' />
              <Button
                variant='outline'
                size='sm'
                onClick={handleSignOut}
                className='flex items-center space-x-2'
              >
                <LogOut className='h-4 w-4' />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <User className='h-5 w-5' />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <User className='h-4 w-4 text-gray-500' />
                  <span className='text-sm font-medium'>Full Name</span>
                </div>
                <p className='text-sm text-gray-900'>{user?.fullName}</p>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <Mail className='h-4 w-4 text-gray-500' />
                  <span className='text-sm font-medium'>Email</span>
                </div>
                <p className='text-sm text-gray-900'>{user?.email}</p>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <Badge variant='secondary' className='text-xs'>
                    Role: {user?.role}
                  </Badge>
                </div>
              </div>

              {user?.phone && (
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Phone className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium'>Phone</span>
                  </div>
                  <p className='text-sm text-gray-900'>{user?.phone}</p>
                </div>
              )}

              {user?.country && (
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <MapPin className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium'>Country</span>
                  </div>
                  <p className='text-sm text-gray-900'>{user?.country}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Test different authentication flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-4'>
              <Link href='/auth/register'>
                <Button variant='outline'>Register New Account</Button>
              </Link>
              <Link href='/auth/login'>
                <Button variant='outline'>Switch Account</Button>
              </Link>
              <Button
                variant='outline'
                onClick={() => window.location.reload()}
              >
                Refresh Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>For testing purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='bg-gray-100 p-4 rounded-lg'>
              <pre className='text-xs text-gray-700 whitespace-pre-wrap'>
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
