'use client';

import { Button } from './button';

interface WaitingForPaymentButtonProps {
  className?: string;
}

export function WaitingForPaymentButton({
  className,
}: WaitingForPaymentButtonProps) {
  return (
    <Button
      disabled
      className={`w-full h-14 text-base font-medium bg-gray-100 text-gray-500 cursor-not-allowed ${className}`}
    >
      Waiting for payment
    </Button>
  );
}
