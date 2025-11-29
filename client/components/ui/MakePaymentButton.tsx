'use client';

import { Button } from './button';
import { useState } from 'react';

interface MakePaymentButtonProps {
  amount: string;
  onPaymentSuccess: () => void;
  className?: string;
}

export function MakePaymentButton({
  amount,
  onPaymentSuccess,
  className,
}: MakePaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Integrate with payment provider (Stripe, etc.)
      // For now, just simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      onPaymentSuccess();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className={`w-full h-14 text-base font-medium bg-purple-900 hover:bg-purple-800 text-white ${className}`}
    >
      {isProcessing ? 'Processing...' : `Make Payment ${amount}`}
    </Button>
  );
}
