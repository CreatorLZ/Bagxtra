'use client';

import DashboardLayout from '@/app/dashboard/DashboardLayout';
import { ChevronRight, User, Bell, Shield, CreditCard, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

const settingsSections = [
  {
    title: 'Account Settings',
    icon: User,
    items: [
      { name: 'Profile Information', description: 'Update your personal details', href: '/dashboard/profile' },
      { name: 'Password & Security', description: 'Change password and security settings', href: '/dashboard/settings/security' },
      { name: 'Notification Preferences', description: 'Manage how you receive notifications', href: '/dashboard/settings/notifications' },
    ],
  },
  {
    title: 'Business Settings',
    icon: Shield,
    items: [
      { name: 'Store Information', description: 'Update your store details and branding', href: '/dashboard/settings/store' },
      { name: 'Payment Methods', description: 'Manage payment options and preferences', href: '/dashboard/settings/payments' },
      { name: 'Shipping Settings', description: 'Configure shipping rates and options', href: '/dashboard/settings/shipping' },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    items: [
      { name: 'Privacy Settings', description: 'Control your data and privacy', href: '/dashboard/settings/privacy' },
      { name: 'Two-Factor Authentication', description: 'Add an extra layer of security', href: '/dashboard/settings/2fa' },
      { name: 'Login History', description: 'View recent login activity', href: '/dashboard/settings/login-history' },
    ],
  },
];

export default function SettingsPage() {
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

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
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

  return (
    <DashboardLayout>
      <motion.div
        className='max-w-4xl mx-auto space-y-6'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Settings</h1>
            <p className='text-gray-600 mt-1'>Manage your account and business preferences</p>
          </div>
        </motion.div>

        {/* Quick Toggles */}
        <motion.div variants={itemVariants}>
          <Card className='p-6 rounded-2xl shadow-sm border border-gray-100'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>Quick Settings</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium text-gray-900'>Email Notifications</p>
                  <p className='text-sm text-gray-600'>Receive order updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium text-gray-900'>SMS Notifications</p>
                  <p className='text-sm text-gray-600'>Receive important alerts via SMS</p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium text-gray-900'>Auto-save Drafts</p>
                  <p className='text-sm text-gray-600'>Automatically save product drafts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Settings Sections */}
        <div className='space-y-6'>
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              custom={sectionIndex}
              variants={sectionVariants}
              initial='hidden'
              animate='visible'
            >
              <Card className='rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                <div className='p-6 border-b border-gray-100'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                      <section.icon className='h-5 w-5 text-purple-900' />
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900'>{section.title}</h3>
                  </div>
                </div>
                <div className='divide-y divide-gray-100'>
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      className='p-6 hover:bg-gray-50 transition-colors cursor-pointer group'
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <h4 className='font-medium text-gray-900 mb-1'>{item.name}</h4>
                          <p className='text-sm text-gray-600'>{item.description}</p>
                        </div>
                        <ChevronRight className='h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors' />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <Card className='p-6 rounded-2xl shadow-sm border border-red-200 bg-red-50'>
            <h3 className='text-lg font-semibold text-red-900 mb-4'>Danger Zone</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-white rounded-lg border border-red-200'>
                <div>
                  <p className='font-medium text-red-900'>Delete Account</p>
                  <p className='text-sm text-red-700'>Permanently delete your account and all data</p>
                </div>
                <Button variant='destructive' size='sm'>
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}