import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RoleCardProps } from '@/types/auth';
import { cn } from '@/lib/utils';

/**
 * RoleCard Component
 * Interactive card for selecting user roles in the authentication flow
 *
 * Features:
 * - Visual feedback for selection state
 * - Icon and descriptive text
 * - Keyboard and mouse accessibility
 * - Smooth hover animations
 */
export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const IconComponent = role.icon;

  /**
   * Handle card selection
   */
  const handleSelect = () => {
    if (!disabled) {
      onSelect(role.id);
    }
  };

  /**
   * Handle keyboard interactions
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      onSelect(role.id);
    }
  };

  return (
    <Card
      className={cn(
        // Base styles
        'relative cursor-pointer transition-all duration-300 ease-out',
        'border-2 hover:shadow-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2',

        // Selection state styles
        isSelected
          ? 'border-purple-600 bg-purple-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-purple-300',

        // Disabled state styles
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-none'
      )}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role='button'
      aria-pressed={isSelected}
      aria-disabled={disabled}
      aria-label={`Select ${role.title} role: ${role.description}`}
    >
      <CardContent className='p-6 text-center'>
        {/* Icon */}
        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300',
            isSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100'
          )}
        >
          <IconComponent className='h-8 w-8' />
        </div>

        {/* Title */}
        <h3
          className={cn(
            'mb-2 text-lg font-semibold transition-colors duration-300',
            isSelected ? 'text-purple-900' : 'text-gray-900'
          )}
        >
          {role.title}
        </h3>

        {/* Description */}
        <p
          className={cn(
            'text-sm leading-relaxed transition-colors duration-300',
            isSelected ? 'text-purple-700' : 'text-gray-600'
          )}
        >
          {role.description}
        </p>

        {/* Selection indicator */}
        {isSelected && (
          <div className='absolute top-3 right-3'>
            <div className='h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center'>
              <svg
                className='h-4 w-4 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
