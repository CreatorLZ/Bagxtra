'use client';

import React, { useState } from 'react';
import { useUsers, User } from '@/hooks/useUsers';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { VALID_USER_ROLES, UserRole } from '@/types/auth';
import { useUser } from '@/hooks/useUser';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorMessage } from '@/components/ui/error-message';

const AdminUserManagement = () => {
  const { user: currentUser } = useUser();
  const [page, setPage] = useState(1);
  const [failedRoleUpdateUserId, setFailedRoleUpdateUserId] = useState<
    string | null
  >(null);
  const [failedRoleUpdateRole, setFailedRoleUpdateRole] =
    useState<UserRole | null>(null);
  const limit = 10;
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
    isOffline,
    cachedData,
  } = useUsers(page, limit);

  const {
    updateUserRole,
    isUpdatingUserRole,
    updateUserRoleError,
    updateUserRoleSuccess,
    isOffline: roleManagementOffline,
    retryUpdateUserRole,
  } = useRoleManagement();

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      // Refetch users to get updated data
      refetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      setFailedRoleUpdateUserId(userId);
      setFailedRoleUpdateRole(newRole);
      // Error is already handled by the hook and displayed in the UI
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRetryUsers = () => {
    refetchUsers();
  };

  const handleRetryRoleUpdate = (userId: string, role: UserRole) => {
    if (!userId || !role) {
      console.warn('Cannot retry role update: missing userId or role');
      return;
    }
    retryUpdateUserRole(userId, role);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'vendor':
        return 'secondary';
      case 'traveler':
        return 'outline';
      case 'shopper':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAdmin) {
    return (
      <div className='container mx-auto p-6'>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            You do not have permission to access this page. Admin access
            required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className='container mx-auto p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Users className='h-6 w-6' />
            <h1 className='text-2xl font-bold'>User Management</h1>
          </div>
          <div className='flex items-center gap-2'>
            {isOffline || roleManagementOffline ? (
              <Badge variant='destructive' className='flex items-center gap-1'>
                <WifiOff className='h-3 w-3' />
                Offline
              </Badge>
            ) : (
              <Badge variant='default' className='flex items-center gap-1'>
                <Wifi className='h-3 w-3' />
                Online
              </Badge>
            )}
            {usersLoading && (
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Loader2 className='h-3 w-3 animate-spin' />
                Loading...
              </Badge>
            )}
          </div>
        </div>

        {/* Network status alerts */}
        {(isOffline || roleManagementOffline) && (
          <Alert>
            <WifiOff className='h-4 w-4' />
            <AlertDescription>
              You are currently offline. Some features may be limited. Changes
              will be synced when connection is restored.
              {cachedData && (
                <div className='mt-2 text-sm'>
                  Showing cached data from last sync
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {usersError && (
          <ErrorMessage
            error={usersError}
            onRetry={handleRetryUsers}
            isRetrying={usersLoading}
            isOffline={isOffline}
            title='Failed to Load Users'
          />
        )}

        {updateUserRoleError && (
          <ErrorMessage
            error={updateUserRoleError}
            onRetry={() =>
              handleRetryRoleUpdate(
                failedRoleUpdateUserId!,
                failedRoleUpdateRole!
              )
            }
            isRetrying={isUpdatingUserRole}
            isOffline={roleManagementOffline}
            title='Failed to Update User Role'
          />
        )}

        {updateUserRoleSuccess && (
          <Alert>
            <CheckCircle className='h-4 w-4' />
            <AlertDescription>User role updated successfully.</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <TableSkeleton rows={limit} columns={7} />
            ) : usersData?.users.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                No users found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users.map((user: User) => (
                      <TableRow key={user._id}>
                        <TableCell className='font-medium'>
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{user.country || '-'}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value: UserRole) =>
                              handleRoleChange(user._id, value)
                            }
                            disabled={
                              updatingUserId === user._id ||
                              user._id === currentUser?.id ||
                              roleManagementOffline
                            }
                          >
                            <SelectTrigger className='w-32'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VALID_USER_ROLES.map(role => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {updatingUserId === user._id && (
                            <div className='flex items-center gap-1 mt-1 text-xs text-muted-foreground'>
                              <Loader2 className='h-3 w-3 animate-spin' />
                              Updating...
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {usersData && usersData.pagination.pages > 1 && (
                  <div className='flex items-center justify-between mt-4'>
                    <div className='text-sm text-muted-foreground'>
                      Showing {(page - 1) * limit + 1} to{' '}
                      {Math.min(page * limit, usersData.pagination.total)} of{' '}
                      {usersData.pagination.total} users
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage(page + 1)}
                        disabled={page === usersData.pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default AdminUserManagement;
