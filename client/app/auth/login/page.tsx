'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
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
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { UserRole, STORAGE_KEYS } from '@/types/auth';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  // Check if user came from the auth flow
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const savedRoleRaw = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE);
    const allowedRoles: UserRole[] = ['shopper', 'traveler', 'vendor'];
    if (savedRoleRaw && allowedRoles.includes(savedRoleRaw as UserRole)) {
      setSelectedRole(savedRoleRaw as UserRole);
    } else if (savedRoleRaw) {
      // Invalid role, remove from localStorage
      localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
    }
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field-specific errors to match signup pattern
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard'); // Redirect to dashboard after login
      } else {
        console.log('Sign in result:', result);
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Map Clerk errors to field-specific errors
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

      // If no specific field errors were found, show the general error
      if (Object.keys(newErrors).length === 0) {
        setErrors({ general: generalError });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Sign in to BagXtra
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your credentials to access your account
          </CardDescription>
          {selectedRole && (
            <div className='text-center mt-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize'>
                {selectedRole}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {errors.general && (
              <Alert variant='destructive'>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='pl-10'
                  required
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className='text-xs text-destructive mt-1'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='pl-10 pr-10'
                  required
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 focus:outline-none'
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={isLoading || !isLoaded}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className='mt-6 text-center space-y-2'>
            <Link
              href='/auth/reset-password'
              className='text-sm text-blue-600 hover:text-blue-500'
            >
              Forgot your password?
            </Link>
            <div className='text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link
                href='/auth/register'
                className='text-blue-600 hover:text-blue-500 font-medium'
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
