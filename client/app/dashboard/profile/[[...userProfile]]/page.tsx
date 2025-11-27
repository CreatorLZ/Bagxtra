'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import {
  Lock,
  Wallet,
  Landmark, // Using Landmark for "Saved Accounts"
  Bell,
  HelpCircle,
  Users,
  LogOut,
  Star,
  CheckCircle,
  ChevronLeft,
  Plane,
  MapPin,
  CreditCard,
} from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { formatName } from '@/lib/utils';

// --- Re-usable Toggle Switch Component ---
const ToggleSwitch = ({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}) => (
  <button
    onClick={() => setEnabled(!enabled)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      enabled ? 'bg-purple-900' : 'bg-gray-200'
    }`}
  >
    <span
      aria-hidden='true'
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// --- Edit Profile Form Component ---
const EditProfileForm = ({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await user.update({
        firstName: firstName,
        lastName: lastName,
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='p-6 md:p-8'>
      <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
        Edit Profile
      </h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='firstName'
            className='block text-sm font-medium text-gray-700'
          >
            First Name
          </label>
          <input
            type='text'
            id='firstName'
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm'
          />
        </div>
        <div>
          <label
            htmlFor='lastName'
            className='block text-sm font-medium text-gray-700'
          >
            Last Name
          </label>
          <input
            type='text'
            id='lastName'
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm'
          />
        </div>
        {success && <p className='text-sm text-green-600'>{success}</p>}
        {error && <p className='text-sm text-red-600'>{error}</p>}
        <div className='flex justify-end space-x-3 pt-2'>
          <button
            type='button'
            onClick={onBack}
            className='rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50'
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Change Password Form Component ---
const ChangePasswordForm = ({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='p-0 md:p-0'>
      <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
        Change Password
      </h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='currentPassword'
            className='block text-sm font-medium text-gray-700'
          >
            Current Password
          </label>
          <input
            type='password'
            id='currentPassword'
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm'
          />
        </div>
        <div>
          <label
            htmlFor='newPassword'
            className='block text-sm font-medium text-gray-700'
          >
            New Password
          </label>
          <input
            type='password'
            id='newPassword'
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm'
          />
        </div>
        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-gray-700'
          >
            Confirm New Password
          </label>
          <input
            type='password'
            id='confirmPassword'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm'
          />
        </div>
        {success && <p className='text-sm text-green-600'>{success}</p>}
        {error && <p className='text-sm text-red-600'>{error}</p>}
        <div className='flex justify-end space-x-3 pt-2'>
          <button
            type='button'
            onClick={onBack}
            className='rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            className='rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50'
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Main Profile Page Component ---
export default function UserProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    return (
      <DashboardLayout>
        <div className='flex items-center justify-center h-screen'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'edit':
        return (
          <EditProfileForm user={user} onBack={() => setActiveTab('profile')} />
        );
      case 'password':
        return (
          <ChangePasswordForm
            user={user}
            onBack={() => setActiveTab('profile')}
          />
        );
      case 'wallet':
        return (
          <div className='p-6 md:p-8'>
            <h2 className='text-2xl font-semibold mb-4'>Wallet</h2>
            <p className='text-gray-600'>Wallet management coming soon...</p>
          </div>
        );
      case 'saved':
        return (
          <div className='p-6 md:p-8'>
            <h2 className='text-2xl font-semibold mb-4'>Saved Accounts</h2>
            <p className='text-gray-600'>Saved accounts coming soon...</p>
          </div>
        );
      case 'support':
        return (
          <div className='p-6 md:p-8'>
            <h2 className='text-2xl font-semibold mb-4'>Support and FAQ</h2>
            <p className='text-gray-600'>Support resources coming soon...</p>
          </div>
        );
      case 'invite':
        return (
          <div className='p-6 md:p-8'>
            <h2 className='text-2xl font-semibold mb-4'>Invite Friends</h2>
            <p className='text-gray-600'>Invite friends coming soon...</p>
          </div>
        );
      case 'travel-prefs':
        return (
          <div className='p-6 md:p-8'>
            <h2 className='text-2xl font-semibold mb-4'>Travel Preferences</h2>
            <p className='text-gray-600'>
              Set your travel preferences and restrictions...
            </p>
          </div>
        );
      case 'payment-methods':
        return (
          <div className='p-6 md:p-8'>
            <h2 className='text-2xl font-semibold mb-4'>Payment Methods</h2>
            <p className='text-gray-600'>
              Manage your payment methods for payouts...
            </p>
          </div>
        );
      case 'profile':
      default:
        return (
          <div className='p-0 md:p-0'>
            {/* Profile Header */}
            <h1 className='text-2xl font-bold text-gray-900 mb-6 font-space-grotesk'>
              Profile
            </h1>

            {/* User Info Card */}
            <div className='flex flex-col items-center'>
              <img
                src={user.imageUrl}
                alt={user.fullName || 'Profile'}
                className='w-24 h-24 rounded-full border-4 border-white shadow-lg'
              />
              <div className='flex items-center justify-center space-x-1 mt-3'>
                <h2 className='text-xl font-bold text-gray-900'>
                  {formatName(user.fullName)}
                </h2>
                <img src='/verified.png' alt='verified' />
              </div>
              <div className='flex items-center space-x-1 mt-1'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='w-5 h-5 text-gray-300' />
                ))}
              </div>
              <button
                onClick={() => setActiveTab('edit')}
                className='mt-4 px-5 py-2 border border-purple-900 hover:bg-purple-50 rounded-lg text-sm font-medium text-purple-900 cursor-pointer'
              >
                Edit Profile
              </button>
            </div>

            {/* Stats Bar - Role-specific */}
            {role === 'traveler' ? (
              <div className='flex items-center justify-around w-full my-6 py-4 border rounded-md border-gray-200 shadow-sm bg-white'>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>23</p>
                  <p className='text-xs text-gray-500'>No of Trips</p>
                </div>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>20</p>
                  <p className='text-xs text-gray-500'>Orders</p>
                </div>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>1</p>
                  <p className='text-xs text-gray-500'>Orders Cancelled</p>
                </div>
              </div>
            ) : role === 'shopper' ? (
              <div className='flex items-center justify-around w-full my-6 py-4 border rounded-md border-gray-200 shadow-sm bg-white'>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>20</p>
                  <p className='text-xs text-gray-500'>No. of Orders</p>
                </div>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>23</p>
                  <p className='text-xs text-gray-500'>Orders Completed</p>
                </div>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>1</p>
                  <p className='text-xs text-gray-500'>Orders Canceled</p>
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-around w-full my-6 py-4 border-t border-b border-gray-200'>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>0</p>
                  <p className='text-xs text-gray-500'>Stats</p>
                </div>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>0</p>
                  <p className='text-xs text-gray-500'>Available</p>
                </div>
                <div className='text-center'>
                  <p className='text-xl font-bold text-gray-900'>0</p>
                  <p className='text-xs text-gray-500'>Soon</p>
                </div>
              </div>
            )}

            {/* Settings List - Role-specific */}
            <div className='shadow-sm rounded-sm border border-gray-200 py-4 bg-white'>
              <h3 className='text-sm font-semibold text-gray-500 px-2 mb-2'>
                SETTINGS
              </h3>
              <div className='space-y-1'>
                <SettingsButton
                  icon={Lock}
                  label='Password'
                  onClick={() => setActiveTab('password')}
                />

                {role === 'traveler' && (
                  <>
                    <SettingsButton
                      icon={Wallet}
                      label='Wallet'
                      onClick={() => setActiveTab('wallet')}
                    />
                    <SettingsButton
                      icon={Plane}
                      label='Travel Preferences'
                      onClick={() => setActiveTab('travel-prefs')}
                    />
                    <SettingsButton
                      icon={CreditCard}
                      label='Payment Methods'
                      onClick={() => setActiveTab('payment-methods')}
                    />
                  </>
                )}

                {role === 'shopper' && (
                  <>
                    <SettingsButton
                      icon={Wallet}
                      label='Wallet'
                      onClick={() => setActiveTab('wallet')}
                    />
                    <SettingsButton
                      icon={Landmark}
                      label='Saved Accounts'
                      onClick={() => setActiveTab('saved')}
                    />
                  </>
                )}

                {/* Notification Toggle Item */}
                <div className='flex items-center justify-between w-full py-3 px-2'>
                  <div className='flex items-center space-x-3'>
                    <Bell className='w-5 h-5 text-gray-500' />
                    <span className='font-medium text-gray-700'>
                      Notifications
                    </span>
                  </div>
                  <ToggleSwitch
                    enabled={notificationsEnabled}
                    setEnabled={setNotificationsEnabled}
                  />
                </div>

                <SettingsButton
                  icon={HelpCircle}
                  label='Support and FAQ'
                  onClick={() => setActiveTab('support')}
                />
                <SettingsButton
                  icon={Users}
                  label='Invite Friends'
                  onClick={() => setActiveTab('invite')}
                />
              </div>
            </div>

            {/* Log Out */}
            <div className='mt-6 border-t border-gray-200 pt-6'>
              <button
                onClick={() => signOut()}
                className='flex items-center space-x-3 w-full py-3 px-2 rounded-lg text-red-600 hover:bg-red-50'
              >
                <LogOut className='w-5 h-5' />
                <span className='font-medium'>Log Out</span>
              </button>
            </div>
          </div>
        );
    }
  };

  // Helper for settings buttons
  const SettingsButton = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className='flex items-center space-x-3 w-full py-3 px-2 rounded-lg text-gray-700 hover:bg-gray-100'
    >
      <Icon className='w-5 h-5 text-gray-500' />
      <span className='font-medium'>{label}</span>
    </button>
  );

  // Get title for the header
  const getTitle = () => {
    switch (activeTab) {
      case 'edit':
        return 'Edit Profile';
      case 'password':
        return 'Change Password';
      case 'wallet':
        return 'Wallet';
      case 'saved':
        return 'Saved Accounts';
      case 'support':
        return 'Support and FAQ';
      case 'invite':
        return 'Invite Friends';
      case 'travel-prefs':
        return 'Travel Preferences';
      case 'payment-methods':
        return 'Payment Methods';
      default:
        return 'Profile';
    }
  };

  return (
    <DashboardLayout>
      <div className='w-full h-full '>
        <div className='bg-transparent overflow-hidden w-full '>
          {/* Custom Header for sub-pages */}
          {activeTab !== 'profile' && (
            <div className='p-4 border-b border-gray-200 flex space-x-3'>
              <button
                onClick={() => setActiveTab('profile')}
                className='p-1 rounded-full text-gray-600 hover:bg-gray-100'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
              <h2 className='text-lg font-semibold text-gray-800'>
                {getTitle()}
              </h2>
            </div>
          )}

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
