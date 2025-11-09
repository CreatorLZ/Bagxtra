'use client';

import { useState } from 'react';
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
import { Loader2, Mail, ArrowLeft, CheckCircle, Key } from 'lucide-react';
import Link from 'next/link';

type Step = 'email' | 'code' | 'password';

export default function ResetPasswordPage() {
  const { signIn, isLoaded } = useSignIn();

  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setCurrentStep('code');
    } catch (err: any) {
      console.error('Reset password email error:', err);
      setError(err.errors?.[0]?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });
      setCurrentStep('password');
    } catch (err: any) {
      console.error('Reset password code error:', err);
      setError(err.errors?.[0]?.message || 'Invalid reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signIn.resetPassword({
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.errors?.[0]?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center text-green-600'>
              <CheckCircle className='mx-auto h-12 w-12 mb-4' />
              Password Reset Successful
            </CardTitle>
            <CardDescription className='text-center'>
              Your password has been successfully reset. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center space-y-2'>
              <Link href='/auth/login'>
                <Button className='w-full'>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Sign In Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderEmailStep = () => (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Reset Password
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your email address and we'll send you a reset code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
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
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending Reset Code...
                </>
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <Link
              href='/auth/login'
              className='text-sm text-blue-600 hover:text-blue-500'
            >
              ← Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCodeStep = () => (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Check Your Email
          </CardTitle>
          <CardDescription className='text-center'>
            We've sent a reset code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCodeSubmit} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='code'>Reset Code</Label>
              <div className='relative'>
                <Key className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='code'
                  type='text'
                  placeholder='Enter the 6-digit code'
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className='pl-10 text-center tracking-widest'
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying Code...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </form>

          <div className='mt-6 text-center space-y-2'>
            <Button
              variant='ghost'
              onClick={() => setCurrentStep('email')}
              disabled={isLoading}
              className='text-sm'
            >
              ← Use Different Email
            </Button>
            <p className='text-xs text-gray-500'>
              Didn't receive the code? Check your spam folder
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPasswordStep = () => (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Set New Password
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <Input
                id='password'
                type='password'
                placeholder='Enter new password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='Confirm new password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <Button
              variant='ghost'
              onClick={() => setCurrentStep('code')}
              disabled={isLoading}
              className='text-sm'
            >
              ← Back to Code Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (currentStep === 'email') return renderEmailStep();
  if (currentStep === 'code') return renderCodeStep();
  if (currentStep === 'password') return renderPasswordStep();

  return renderEmailStep();
}
