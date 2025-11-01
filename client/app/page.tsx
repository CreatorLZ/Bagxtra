'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const BagXtraApp = (): React.JSX.Element => {
  const [currentScreen, setCurrentScreen] = useState<string>('landing');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect((): (() => void) | undefined => {
    // Auto-transition from splash to onboarding after 2.5 seconds
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        // Start onboarding fade in immediately
        setCurrentScreen('onboarding');
        // Keep splash fading out for a bit longer
        setTimeout(() => {
          setIsTransitioning(false);
        }, 800); // Extended fade out duration
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const SplashScreen = () => (
    <div
      className={`min-h-screen bg-purple-900 flex items-center justify-center p-4 transition-opacity duration-800 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className='w-full max-w-sm lg:max-w-6xl'>
        <div className='text-center flex flex-col gap-3 lg:gap-2'>
          <h1 className='text-white text-5xl lg:text-8xl font-bold tracking-wider lg:mb-4'>
            BagXtra
          </h1>
          <p className='text-purple-200 text-xs md:text-base '>
            Connect. Shop. Receive — the new way to buy globally.
          </p>
        </div>
      </div>
    </div>
  );

  const OnboardingScreen = () => (
    <div
      className={`min-h-screen bg-white flex items-center justify-center p-0 lg:p-0 transition-opacity duration-500 ${
        currentScreen === 'onboarding' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className='w-full max-w-none mx-auto'>
        {/* Mobile Layout */}
        <div className='lg:hidden relative h-screen flex flex-col'>
          {/* Header with Skip */}
          <div className='flex justify-between items-center p-6 absolute top-0 left-0 right-0 z-10'>
            <h2 className='text-white text-xl font-semibold'>BagXtra</h2>
            <button className='text-white text-sm font-medium'>Skip</button>
          </div>

          {/* Top Hero Section */}
          <div className='h-1/2 relative bg-purple-900 overflow-hidden'>
            {/* Background Image */}
            <img
              src='/planes.png'
              alt='Planes background'
              className='absolute inset-0 w-full h-full object-fit opacity-20'
            />
          </div>

          {/* Bottom Content Section */}

          <div className='h-1/2 bg-white flex flex-col justify-center items-center px-6 '>
            {/* Continue Button part */}
            <div className='flex flex-col gap-5'>
              {/* Progress Indicator */}
              <div className=' flex items-center justify-center gap-2'>
                <div className='w-8 h-2 bg-purple-900 rounded-full'></div>
                <div className='w-2 h-2 bg-purple-200 rounded-full'></div>
              </div>
              <h1 className='text-gray-700 text-center text-2xl font-bold mb-3 leading-tight'>
                Connect. Shop. Receive — the new way to buy globally.
              </h1>

              <p className='text-gray-400 text-xs leading-relaxed text-center'>
                Explore global shopping without the hassle of shipping. With
                BagXtra, travelers help you bring it home.
              </p>
              <button
                onClick={() => setCurrentScreen('role-selection')}
                className='w-full max-w-sm bg-purple-900 hover:bg-purple-800 text-white font-semibold py-4 rounded-xl transition-colors'
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
                <div className='flex gap-3 items-center'>
                  <div className='w-12 h-2 bg-purple-900 rounded-full'></div>
                  <div className='w-3 h-3 bg-purple-200 rounded-full'></div>
                </div>
              </div>

              <h1 className='text-gray-700 text-5xl font-bold mb-6 leading-tight'>
                Connect. Shop. Receive — the new way to buy globally.
              </h1>

              <p className='text-gray-600 text-base mb-8 leading-relaxed'>
                Explore global shopping without the hassle of shipping. With
                BagXtra, travelers help you bring it home. Shop from anywhere,
                receive from everywhere.
              </p>

              <div className='flex gap-4'>
                <button
                  onClick={() => setCurrentScreen('role-selection')}
                  className='bg-purple-900 text-white font-normal px-12 py-4 rounded-xl transition-colors text-base'
                >
                  Continue
                </button>

                {/* <button className="border-2 border-gray-300 hover:border-purple-700 text-gray-700 hover:text-purple-700 font-semibold px-12 py-4 rounded-xl transition-colors text-lg">
                  Learn More
                </button> */}
              </div>
            </div>
          </div>

          {/* Left Side - Hero Image */}
          <div className='w-1/2 relative bg-purple-900 overflow-hidden'>
            {/* Background Image */}
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

  const RoleSelection = () => (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>
          Choose Your Role
        </h1>
        <p className='text-gray-600 mb-8'>
          This is the role selection screen - to be implemented next
        </p>
        <button
          onClick={() => setCurrentScreen('onboarding')}
          className='text-purple-700 hover:underline'
        >
          ← Back to Onboarding
        </button>
      </div>
    </div>
  );

  const LandingPage = (): React.JSX.Element => (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-3xl font-bold text-purple-900'>
            BagXtra
          </CardTitle>
          <CardDescription className='text-lg'>
            Connect. Shop. Receive — the new way to buy globally.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-gray-600 text-center'>
            Welcome to BagXtra! A peer-to-peer logistics platform connecting
            shoppers, travelers, and vendors worldwide.
          </p>
          <div className='flex flex-col gap-2'>
            <Button
              onClick={() => setCurrentScreen('onboarding')}
              className='w-full'
            >
              Get Started
            </Button>
            <Button
              variant='outline'
              onClick={() => setCurrentScreen('splash')}
              className='w-full'
            >
              View Splash Screen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {currentScreen === 'landing' && <LandingPage />}
      {currentScreen === 'splash' && <SplashScreen />}
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'role-selection' && <RoleSelection />}
    </>
  );
};

export default BagXtraApp;
