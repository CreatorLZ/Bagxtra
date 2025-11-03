'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { ProgressIndicator } from '@/components/auth-flow/ProgressIndicator';
import { RoleCard } from '@/components/auth-flow/RoleCard';
import { ShoppingBag, Plane, Store } from 'lucide-react';
import { RoleOption, UserRole } from '@/types/auth';

/**
 * BagXtraApp Component
 * Main application component handling the authentication flow
 *
 * Flow: Splash (2s) → Onboarding → Role Selection → Auth Pages
 */
const BagXtraApp = (): React.JSX.Element => {
  const {
    currentScreen,
    selectedRole,
    isTransitioning,
    goToNextScreen,
    goToPreviousScreen,
    setSelectedRole,
    canGoNext,
    canGoBack,
    currentStepIndex,
    totalSteps,
  } = useAuthFlow();

  /**
   * Role options configuration
   */
  const roleOptions: RoleOption[] = [
    {
      id: 'shopper',
      title: 'Shopper',
      description: 'I need items delivered',
      icon: ShoppingBag,
    },
    {
      id: 'traveler',
      title: 'Traveler',
      description: 'I can carry items',
      icon: Plane,
    },
    {
      id: 'vendor',
      title: 'Vendor',
      description: 'I provide services',
      icon: Store,
    },
  ];

  /**
   * SplashScreen Component
   * Displays BagXtra branding for 2 seconds before transitioning to onboarding
   */
  const SplashScreen = () => (
    <div
      className={`min-h-screen bg-purple-900 flex items-center justify-center p-4 transition-all duration-800 ease-out ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      role='presentation'
      aria-label='BagXtra splash screen'
    >
      <div className='w-full max-w-sm lg:max-w-6xl'>
        <div className='text-center flex flex-col gap-3 lg:gap-2'>
          <h1 className='text-white text-5xl lg:text-8xl font-bold tracking-wider lg:mb-4'>
            BagXtra
          </h1>
          <p className='text-purple-200 text-xs md:text-base'>
            Connect. Shop. Receive — the new way to buy globally.
          </p>
        </div>
      </div>
    </div>
  );

  /**
   * OnboardingScreen Component
   * Displays BagXtra introduction with call-to-action to continue to role selection
   */
  const OnboardingScreen = () => (
    <div
      className={`min-h-screen bg-white flex items-center justify-center p-0 lg:p-0 transition-all duration-500 ease-out ${
        currentScreen === 'onboarding'
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      }`}
      role='main'
      aria-labelledby='onboarding-title'
    >
      <div className='w-full max-w-none mx-auto'>
        {/* Mobile Layout */}
        <div className='lg:hidden relative h-screen flex flex-col'>
          {/* Header with Skip */}
          <div className='flex justify-between items-center p-6 absolute top-0 left-0 right-0 z-10'>
            <h2 className='text-white text-xl font-semibold'>BagXtra</h2>
            <button
              className='text-white text-sm font-medium hover:text-purple-200 transition-colors'
              onClick={() => goToNextScreen()}
              aria-label='Skip to role selection'
            >
              Skip
            </button>
          </div>

          {/* Top Hero Section */}
          <div className='h-1/2 relative bg-purple-900 overflow-hidden'>
            {/* Background Image */}
            <img
              src='/planes.png'
              alt='Planes background'
              className='absolute inset-0 w-full h-full object-cover opacity-20'
            />
          </div>

          {/* Bottom Content Section */}
          <div className='h-1/2 bg-white flex flex-col justify-center items-center px-6'>
            <div className='flex flex-col gap-5'>
              {/* Progress Indicator */}
              <ProgressIndicator
                currentStep={currentStepIndex}
                totalSteps={totalSteps}
                className='mb-2'
              />
              <h1
                id='onboarding-title'
                className='text-gray-700 text-center text-2xl font-bold mb-3 leading-tight'
              >
                Connect. Shop. Receive — the new way to buy globally.
              </h1>

              <p className='text-gray-400 text-xs leading-relaxed text-center'>
                Explore global shopping without the hassle of shipping. With
                BagXtra, travelers help you bring it home.
              </p>
              <button
                onClick={() => goToNextScreen()}
                className='w-full max-w-sm bg-purple-900 hover:bg-purple-800 text-white font-semibold py-4 rounded-xl transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                aria-label='Continue to role selection'
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className='hidden lg:flex w-full h-screen'>
          {/* Left Side - Content */}
          <div className='w-1/2 flex items-center justify-center'>
            <div className='max-w-xl'>
              <div className='mb-8'>
                <h2 className='text-purple-900 text-2xl font-bold mb-2'>
                  BagXtra
                </h2>
                <ProgressIndicator
                  currentStep={currentStepIndex}
                  totalSteps={totalSteps}
                />
              </div>

              <h1
                id='onboarding-title'
                className='text-gray-700 text-5xl font-bold mb-6 leading-tight'
              >
                Connect. Shop. Receive — the new way to buy globally.
              </h1>

              <p className='text-gray-600 text-base mb-8 leading-relaxed'>
                Explore global shopping without the hassle of shipping. With
                BagXtra, travelers help you bring it home. Shop from anywhere,
                receive from everywhere.
              </p>

              <div className='flex gap-4'>
                <button
                  onClick={() => goToNextScreen()}
                  className='bg-purple-900 hover:bg-purple-800 text-white font-normal px-12 py-4 rounded-xl transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-base'
                  aria-label='Continue to role selection'
                >
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className='w-1/2 relative bg-purple-900 overflow-hidden'>
            <img
              src='/planes.png'
              alt='Planes background'
              className='absolute inset-0 w-full h-full object-cover opacity-20'
            />
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * RoleSelectionScreen Component
   * Allows users to select their role (shopper, traveler, or vendor) before authentication
   */
  const RoleSelectionScreen = () => {
    const handleRoleSelect = (roleId: UserRole) => {
      setSelectedRole(roleId);
    };

    const handleContinue = () => {
      if (selectedRole) {
        goToNextScreen();
      }
    };

    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4 transition-all duration-500 ease-out ${
          currentScreen === 'role-selection'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
        role='main'
        aria-labelledby='role-selection-title'
      >
        <div className='w-full max-w-4xl mx-auto text-center'>
          {/* Header */}
          <div className='mb-8'>
            <h1
              id='role-selection-title'
              className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'
            >
              Choose Your Role
            </h1>
            <p className='text-gray-600 text-lg mb-6'>
              Select how you'd like to use BagXtra
            </p>
            <ProgressIndicator
              currentStep={currentStepIndex}
              totalSteps={totalSteps}
            />
          </div>

          {/* Role Cards Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            {roleOptions.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole === role.id}
                onSelect={handleRoleSelect}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            {canGoBack && (
              <button
                onClick={goToPreviousScreen}
                className='text-purple-700 hover:text-purple-800 font-medium transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 px-4 py-2 rounded-lg'
                aria-label='Go back to onboarding'
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={!canGoNext}
              className='bg-purple-900 hover:bg-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
              aria-label={
                selectedRole
                  ? 'Continue to sign in'
                  : 'Please select a role to continue'
              }
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * AuthRedirect Component
   * Handles redirection to appropriate auth page based on selected role
   */
  const AuthRedirect = () => {
    React.useEffect(() => {
      // Redirect to login page - the role selection is already saved in localStorage
      // and will be picked up by the login/register pages
      window.location.href = '/auth/login';
    }, []);

    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl font-bold text-purple-900'>
              Redirecting...
            </CardTitle>
            <CardDescription>Taking you to the sign in page</CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900 mx-auto'></div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      {currentScreen === 'splash' && <SplashScreen />}
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'role-selection' && <RoleSelectionScreen />}
      {currentScreen === 'auth' && <AuthRedirect />}
    </>
  );
};

export default BagXtraApp;
