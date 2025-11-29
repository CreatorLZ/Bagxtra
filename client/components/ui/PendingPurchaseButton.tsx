'use client';

import { Button } from './button';

interface PendingPurchaseButtonProps {
  className?: string;
}

export function PendingPurchaseButton({
  className,
}: PendingPurchaseButtonProps) {
  return (
    <Button
      disabled
      className={`w-full h-14 text-base font-medium bg-gray-100 text-gray-500 cursor-not-allowed ${className}`}
    >
      Pending purchase
    </Button>
  );
}
