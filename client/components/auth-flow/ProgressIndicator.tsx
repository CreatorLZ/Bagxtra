import React from 'react';
import { ProgressIndicatorProps } from '@/types/auth';
import { cn } from '@/lib/utils';

/**
 * ProgressIndicator Component
 * Visual indicator showing current step in the authentication flow
 *
 * Features:
 * - Animated progress dots
 * - Accessible with screen reader support
 * - Customizable styling
 * - Smooth transitions between steps
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role='progressbar'
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className={cn(
              'h-2 rounded-full transition-all duration-300 ease-out',
              // Size variations
              isActive ? 'w-8' : 'w-2',
              // Color states
              isCompleted
                ? 'bg-purple-900'
                : isActive
                ? 'bg-purple-900'
                : 'bg-purple-200'
            )}
            aria-hidden='true'
          />
        );
      })}
    </div>
  );
};
