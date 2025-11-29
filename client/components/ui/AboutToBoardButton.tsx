'use client';

import { Button } from './button';
import { useState } from 'react';

interface AboutToBoardButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AboutToBoardButton({
  onClick,
  isLoading,
  className,
}: AboutToBoardButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full h-14 text-base font-medium bg-purple-900 hover:bg-purple-800 text-white cursor-pointer ${className}`}
    >
      {isLoading ? 'Processing...' : 'I am about to board'}
    </Button>
  );
}
