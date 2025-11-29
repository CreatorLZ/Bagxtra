'use client';

import { Button } from './button';
import { useState } from 'react';

interface ItemPurchasedButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ItemPurchasedButton({
  onClick,
  isLoading,
  className,
}: ItemPurchasedButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={`w-full h-14 text-base font-medium bg-purple-900 hover:bg-purple-800 text-white ${className}`}
    >
      {isLoading ? 'Processing...' : 'I have bought the item'}
    </Button>
  );
}
