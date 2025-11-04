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
} from 'lucide-react';
import Link from 'next/link';
import { UserRole, STORAGE_KEYS } from '@/types/auth';

// Define types for field-specific errors and password strength
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

// Password validation utility
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

  // Get pre-selected role from localStorage
  const [preSelectedRole, setPreSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const savedRoleString = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE);
    if (savedRoleString) {
      const validRoles: UserRole[] = ['shopper', 'traveler', 'vendor'];
      if (validRoles.includes(savedRoleString as UserRole)) {
        setPreSelectedRole(savedRoleString as UserRole);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
      }
    }
  }, []);

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

  // Update role when preSelectedRole is loaded
  useEffect(() => {
    if (preSelectedRole) {
      setFormData(prev => ({ ...prev, role: preSelectedRole }));
    }
  }, [preSelectedRole]);

  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  // Use state for field-specific errors
  const [errors, setErrors] = useState<FieldErrors>({});

  // Track password strength for real-time feedback
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength>('weak');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear the error for this field when the user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Update password strength in real-time for better UX
    if (field === 'password') {
      const validation = validatePassword(value);
      setPasswordStrength(validation.strength);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    // Clear previous errors
    setErrors({});

    // Validate password strength and requirements
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setErrors({ password: passwordValidation.message });
      return;
    }

    // Check that passwords match
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

      // --- New Error Handling Logic ---
      const newErrors: FieldErrors = {};
      let generalError = 'Failed to create account. Please try again.';

      if (err.errors) {
        err.errors.forEach((error: any) => {
          // 'meta.paramName' maps to your form fields
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
            // Use the first unmapped error as the general error
            generalError = error.message;
          }
        });
      }

      setErrors(newErrors);

      // If no specific field errors were found, show the general error
      if (Object.keys(newErrors).length === 0) {
        setErrors({ general: generalError });
      }
      // --- End of New Logic ---
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ CHANGED: Updated handleVerify to set field-specific errors
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/dashboard');
      } else {
        // This case is unlikely with email_code but good to have
        console.log('Verification result:', completeSignUp);
        setErrors({ general: 'Verification is not yet complete.' });
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      // Clerk usually provides a specific error for the code
      const message =
        err.errors?.[0]?.message || 'Failed to verify email. Please try again.';

      // Check if the error is about the code
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
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center'>
              Verify Your Email
            </CardTitle>
            <CardDescription className='text-center'>
              We've sent a verification code to {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className='space-y-4'>
              {/* ✨ CHANGED: Show general error or code error if it exists */}
              {(errors.general || errors.code) && (
                <Alert variant='destructive'>
                  {/* Show code error preferably, fall back to general */}
                  <AlertDescription>
                    {errors.code || errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div className='space-y-2'>
                <Label htmlFor='code'>Verification Code</Label>
                <Input
                  id='code'
                  type='text'
                  placeholder='Enter verification code'
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {/* ✨ ADDED: Inline error for verification code */}
                {errors.code && (
                  <p className='text-xs text-destructive mt-1'>{errors.code}</p>
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
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>
            Create Account
          </CardTitle>
          <CardDescription className='text-center'>
            Join BagXtra and start connecting with travelers and shoppers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* ✨ CHANGED: Only show the general error here */}
            {errors.general && (
              <Alert variant='destructive'>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>First Name</Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='firstName'
                    type='text'
                    placeholder='First name'
                    value={formData.firstName}
                    onChange={e =>
                      handleInputChange('firstName', e.target.value)
                    }
                    className='pl-10'
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* ✨ ADDED: Inline error for first name */}
                {errors.firstName && (
                  <p className='text-xs text-destructive mt-1'>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last Name</Label>
                <Input
                  id='lastName'
                  type='text'
                  placeholder='Last name'
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  required
                  disabled={isLoading}
                />
                {/* ✨ ADDED: Inline error for last name */}
                {errors.lastName && (
                  <p className='text-xs text-destructive mt-1'>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className='pl-10'
                  required
                  disabled={isLoading}
                />
              </div>
              {/* ✨ ADDED: Inline error for email */}
              {errors.email && (
                <p className='text-xs text-destructive mt-1'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role'>I am a</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  handleInputChange('role', value)
                }
                disabled={!!preSelectedRole}
              >
                <SelectTrigger>
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

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone (Optional)</Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='phone'
                  type='tel'
                  placeholder='+1 (555) 123-4567'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className='pl-10'
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='country'>Country (Optional)</Label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='country'
                  type='text'
                  placeholder='Your country'
                  value={formData.country}
                  onChange={e => handleInputChange('country', e.target.value)}
                  className='pl-10'
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Create a password'
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
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

              {/* Password strength indicator */}
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

              {/* Inline error for password */}
              {errors.password && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.password}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  className='pl-10 pr-10'
                  required
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 focus:outline-none'
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {/* Inline error for confirm password */}
              {errors.confirmPassword && (
                <p className='text-xs text-destructive mt-1'>
                  {errors.confirmPassword}
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Clerk CAPTCHA element for bot protection */}
          <div id='clerk-captcha' className='mt-4'></div>

          <div className='mt-6 text-center'>
            <div className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link
                href='/auth/login'
                className='text-blue-600 hover:text-blue-500 font-medium'
              >
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
