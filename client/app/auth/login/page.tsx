'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, Package } from 'lucide-react';
import Link from 'next/link';
import { UserRole, STORAGE_KEYS } from '@/types/auth';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const savedRoleRaw = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE);
    const allowedRoles: UserRole[] = ['shopper', 'traveler', 'vendor'];
    if (savedRoleRaw && allowedRoles.includes(savedRoleRaw as UserRole)) {
      setSelectedRole(savedRoleRaw as UserRole);
    } else if (savedRoleRaw) {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setErrors({});

    try {
      await signOut();
    } catch (err: any) {
      console.error('Sign out error:', err);
      setErrors({ general: 'Failed to sign out. Please try again.' });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        console.log('Sign in result:', result);
      }
    } catch (err: any) {
      console.error('Login error:', err);

      const newErrors: { email?: string; password?: string; general?: string } =
        {};
      let generalError = 'Failed to sign in. Please try again.';

      if (err.errors) {
        err.errors.forEach((error: any) => {
          const fieldName = error.meta?.paramName;

          if (fieldName === 'identifier' || fieldName === 'email_address') {
            newErrors.email = error.message;
          } else if (fieldName === 'password') {
            newErrors.password = error.message;
          } else {
            generalError = error.message;
          }
        });
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        setErrors({ general: generalError });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSignedIn) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center'>
              Already Signed In
            </CardTitle>
            <CardDescription className='text-center'>
              You're already signed in to BagXtra. If you're having trouble
              accessing the dashboard, try signing out and signing back in.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Button
              onClick={handleSignOut}
              variant='outline'
              className='w-full'
              disabled={isSigningOut}
              aria-busy={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
            <Link href='/dashboard'>
              <Button className='w-full'>Try Dashboard Again</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='h-screen flex' style={{ overflow: 'hidden' }}>
      {/* Left Side - Login Form */}
      <div className='flex-1 flex justify-center bg-white p-8 py-8 overflow-y-auto'>
        <div className='w-full max-w-md'>
          {/* Logo */}
          <div className='mb-8'>
            {/* <div className='w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center mb-4'>
              <Package className='w-6 h-6 text-white' />
            </div> */}
            <h2 className='text-xl font-bold text-gray-900 '>BAGXTRA</h2>
          </div>

          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-semibold text-gray-900 mb-2'>
              Login to your account
            </h1>
            <p className='text-gray-500 text-sm'>
              Welcome back! Please sign in to continue
            </p>
          </div>

          {selectedRole && (
            <div className='mb-6'>
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 capitalize'>
                {selectedRole}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            {errors.general && (
              <Alert variant='destructive'>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-sm font-medium text-gray-700'
              >
                Email Address
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='email'
                  type='email'
                  placeholder='name@example.com'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='pl-10 h-10 border-gray-300'
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className='text-xs text-red-500 mt-1'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-sm font-medium text-gray-700'
              >
                Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='pl-10 pr-10 h-10 border-gray-300'
                  required
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-xs text-red-500 mt-1'>{errors.password}</p>
              )}
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <input
                  id='remember'
                  type='checkbox'
                  className='h-4 w-4 text-purple-900 border-gray-300 rounded focus:ring-purple-900'
                />
                <label
                  htmlFor='remember'
                  className='ml-2 text-sm text-gray-600'
                >
                  Keep me logged in
                </label>
              </div>
              <Link
                href='/auth/reset-password'
                className='text-sm text-purple-900 hover:text-purple-700 font-medium'
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type='submit'
              className='w-full h-10 bg-purple-900 hover:bg-purple-800 text-white font-medium'
              disabled={isLoading || !isLoaded}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className='mt-8 text-center'>
            <p className='text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link
                href='/auth/register'
                className='text-purple-900 hover:text-purple-700 font-medium'
              >
                Register
              </Link>
            </p>
          </div>

          <div className='mt-12 text-center text-xs text-gray-400'>
            © 2025 BagXtra
          </div>
        </div>
      </div>

      {/* Right Side - Branded Content (MODIFIED) */}
      <div className='hidden  lg:flex flex-1 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex-col justify-between px-12 py-8 text-white relative overflow-y-hidden'>
        {/* Decorative elements (kept from your original code) */}
        <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]'></div>

        {/* Top Section (Logo, App Name, Tagline) */}
        <div className='relative z-10'>
          <div className='flex items-center space-x-3 mb-4'>
            {/* <div className='w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20'>
              <Package className='w-5 h-5 text-white' />
            </div> */}
            {/* Text from screenshot */}
            <span className='text-2xl font-bold'>BAGXTRA</span>
          </div>
          <p className='text-base text-purple-100'>
            <span className='font-semibold text-white'>Connect</span>.{' '}
            <span className='font-semibold text-white'>Shop</span>.{' '}
            <span className='font-semibold text-white'>Receive</span>. the new
            way to buy globally.
          </p>{' '}
        </div>

        {/* Bottom Section (Get Access, Questions) */}
        <div className='relative z-10 flex justify-between items-end space-x-8'>
          {/* Get Access Block */}
          <div className='max-w-[250px]'>
            <h3 className='text-base font-semibold text-white mb-1'>
              Get Access
            </h3>
            <div className='text-center'>
              <p className='text-sm text-white/60'>
                Don't have an account?{' '}
                <Link
                  href='/auth/register'
                  className=' hover:text-white font-medium'
                >
                  Register
                </Link>
              </p>
            </div>
          </div>

          {/* Questions? Block */}
          <div className='max-w-[250px]'>
            <h3 className='text-base font-semibold text-white mb-0'>
              Questions?
            </h3>
            <p className='text-sm text-white/60'>
              Reach us at info@bagxtra.co or call +12 35 9800 454
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
