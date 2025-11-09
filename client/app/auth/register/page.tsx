'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { UserRole, STORAGE_KEYS, VALID_USER_ROLES } from '@/types/auth';

type FieldErrors = {
  [key: string]: string | undefined;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  code?: string;
  general?: string;
};

type PasswordStrength = 'weak' | 'medium' | 'strong';

const validatePassword = (
  password: string
): { isValid: boolean; message?: string; strength: PasswordStrength } => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long.',
      strength: 'weak',
    };
  }
  if (password.length < 12) {
    return { isValid: true, strength: 'medium' };
  }
  return { isValid: true, strength: 'strong' };
};

export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  // Initialize pre-selected role from localStorage (SSR-safe)
  const [preSelectedRole, setPreSelectedRole] = useState<UserRole | null>(null);

  // Load pre-selected role from localStorage on client mount to avoid SSR errors
  useEffect(() => {
    const savedRoleString = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE);
    if (
      savedRoleString &&
      VALID_USER_ROLES.includes(savedRoleString as UserRole)
    ) {
      setPreSelectedRole(savedRoleString as UserRole);
    }
  }, []);

  // Initialize form data with default values (SSR-safe)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    role: 'shopper' as UserRole,
  });

  // Update form data role when preSelectedRole is loaded from localStorage
  useEffect(() => {
    if (preSelectedRole) {
      setFormData(prev => ({ ...prev, role: preSelectedRole }));
    }
  }, [preSelectedRole]);

  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});

  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength>('weak');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (field === 'password') {
      const validation = validatePassword(value);
      setPasswordStrength(validation.strength);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setErrors({});

    // Validate role selection
    if (!formData.role || !VALID_USER_ROLES.includes(formData.role)) {
      setErrors({ general: 'Please select a valid role.' });
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setErrors({ password: passwordValidation.message });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);

    try {
      await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.email,
        password: formData.password,
        unsafeMetadata: {
          phone: formData.phone,
          country: formData.country,
          role: formData.role,
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      console.error('Registration error:', err);

      const newErrors: FieldErrors = {};
      let generalError = 'Failed to create account. Please try again.';

      if (err.errors) {
        err.errors.forEach((error: any) => {
          const fieldName = error.meta?.paramName;

          if (fieldName === 'email_address') {
            newErrors.email = error.message;
          } else if (fieldName === 'password') {
            newErrors.password = error.message;
          } else if (fieldName === 'first_name') {
            newErrors.firstName = error.message;
          } else if (fieldName === 'last_name') {
            newErrors.lastName = error.message;
          } else {
            generalError = error.message;
          }
        });
      } else if (err.message) {
        // Handle role-related errors or other Clerk errors
        if (err.message.includes('role') || err.message.includes('metadata')) {
          generalError =
            'There was an issue with role selection. Please try again.';
        } else {
          generalError = err.message;
        }
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        setErrors({ general: generalError });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors({});

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/dashboard');
      } else {
        console.log('Verification result:', completeSignUp);
        setErrors({ general: 'Verification is not yet complete.' });
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const message =
        err.errors?.[0]?.message || 'Failed to verify email. Please try again.';

      if (err.errors?.[0]?.meta?.paramName === 'code') {
        setErrors({ code: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className='h-screen flex' style={{ overflow: 'hidden' }}>
        {/* Left Side - Verification Form */}
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
              <h1 className='text-xl font-semibold text-gray-900 mb-2'>
                Verify Your Email
              </h1>
              <p className='text-gray-500 text-sm'>
                We've sent a verification code to {formData.email}
              </p>
            </div>

            <form onSubmit={handleVerify} className='space-y-6'>
              {(errors.general || errors.code) && (
                <Alert variant='destructive'>
                  <AlertDescription>
                    {errors.code || errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div className='space-y-2'>
                <Label
                  htmlFor='code'
                  className='text-sm font-medium text-gray-700'
                >
                  Verification Code
                </Label>
                <Input
                  id='code'
                  type='text'
                  placeholder='Enter verification code'
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className='h-10 border-gray-300'
                  required
                  disabled={isLoading}
                />
                {errors.code && (
                  <p className='text-xs text-red-500 mt-1'>{errors.code}</p>
                )}
              </div>

              <Button
                type='submit'
                className='w-full h-10 bg-purple-900 hover:bg-purple-800 text-white font-medium'
                disabled={isLoading || !isLoaded}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            <div className='mt-12 text-center text-xs text-gray-400'>
              © 2025 BagXtra
            </div>
          </div>
        </div>

        {/* Right Side - Branded Content (MODIFIED) */}
        <div className='hidden  lg:flex flex-1 bg-linear-to-br from-purple-900 via-purple-800 to-indigo-900 flex-col justify-between px-12 py-8 text-white relative overflow-y-hidden'>
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
            </p>
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

  return (
    <div className='h-screen flex' style={{ overflow: 'hidden' }}>
      {/* Left Side - Registration Form */}
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
              Create Account
            </h1>
            <p className='text-gray-500 text-sm'>
              Join BagXtra and start connecting with travelers and shoppers
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {errors.general && (
              <Alert variant='destructive'>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='firstName'
                  className='text-sm font-medium text-gray-700'
                >
                  First Name
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    id='firstName'
                    type='text'
                    placeholder='First name'
                    value={formData.firstName}
                    onChange={e =>
                      handleInputChange('firstName', e.target.value)
                    }
                    className='pl-10 h-11 border-gray-300'
                    required
                    disabled={isLoading}
                  />
                </div>
                {errors.firstName && (
                  <p className='text-xs text-red-500 mt-1'>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='lastName'
                  className='text-sm font-medium text-gray-700'
                >
                  Last Name
                </Label>
                <Input
                  id='lastName'
                  type='text'
                  placeholder='Last name'
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className='h-11 border-gray-300'
                  required
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className='text-xs text-red-500 mt-1'>{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-sm font-medium text-gray-700'
              >
                Email
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='email'
                  type='email'
                  placeholder='name@example.com'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className='pl-10 h-11 border-gray-300'
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
                htmlFor='role'
                className='text-sm font-medium text-gray-700'
              >
                I am a
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  handleInputChange('role', value)
                }
                disabled={!!preSelectedRole}
              >
                <SelectTrigger className='h-11 border-gray-300'>
                  <SelectValue placeholder='Select your role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='shopper'>
                    Shopper - I need items delivered
                  </SelectItem>
                  <SelectItem value='traveler'>
                    Traveler - I can carry items
                  </SelectItem>
                  <SelectItem value='vendor'>
                    Vendor - I provide services
                  </SelectItem>
                </SelectContent>
              </Select>
              {preSelectedRole && (
                <p className='text-xs text-gray-500 mt-1'>
                  Role pre-selected from onboarding flow
                </p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='phone'
                  className='text-sm font-medium text-gray-700'
                >
                  Phone (Optional)
                </Label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    id='phone'
                    type='tel'
                    placeholder='+1 (555) 000-0000'
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className='pl-10 h-11 border-gray-300'
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='country'
                  className='text-sm font-medium text-gray-700'
                >
                  Country (Optional)
                </Label>
                <div className='relative'>
                  <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    id='country'
                    type='text'
                    placeholder='Your country'
                    value={formData.country}
                    onChange={e => handleInputChange('country', e.target.value)}
                    className='pl-10 h-11 border-gray-300'
                    disabled={isLoading}
                  />
                </div>
              </div>
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
                  placeholder='Create a password'
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className='pl-10 pr-10 h-11 border-gray-300'
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

              {formData.password && (
                <div className='flex items-center space-x-2 mt-1'>
                  <div className='flex space-x-1'>
                    <div
                      className={`h-1 w-6 rounded ${
                        passwordStrength === 'weak'
                          ? 'bg-red-500'
                          : passwordStrength === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <div
                      className={`h-1 w-6 rounded ${
                        passwordStrength === 'medium'
                          ? 'bg-yellow-500'
                          : passwordStrength === 'strong'
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                    <div
                      className={`h-1 w-6 rounded ${
                        passwordStrength === 'strong'
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs ${
                      passwordStrength === 'weak'
                        ? 'text-red-500'
                        : passwordStrength === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {passwordStrength === 'weak'
                      ? 'Weak'
                      : passwordStrength === 'medium'
                      ? 'Medium'
                      : 'Strong'}
                  </span>
                </div>
              )}

              {errors.password && (
                <p className='text-xs text-red-500 mt-1'>{errors.password}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='confirmPassword'
                className='text-sm font-medium text-gray-700'
              >
                Confirm Password
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  className='pl-10 pr-10 h-11 border-gray-300'
                  required
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                  disabled={isLoading}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='text-xs text-red-500 mt-1'>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full h-11 bg-purple-900 hover:bg-purple-800 text-white font-medium'
              disabled={isLoading || !isLoaded}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div id='clerk-captcha' className='mt-4'></div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link
                href='/auth/login'
                className='text-purple-900 hover:text-purple-700 font-medium'
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className='mt-8 text-center text-xs text-gray-400'>
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
          </p>
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
                Already have an account?{' '}
                <Link
                  href='/auth/login'
                  className=' hover:text-white font-medium'
                >
                  Login
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
