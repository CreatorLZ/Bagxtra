'use client';

import { useState, useCallback } from 'react';

interface UseClerkRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface UseClerkRetryReturn {
  retry: () => void;
  isRetrying: boolean;
  retryCount: number;
  reset: () => void;
}

export const useClerkRetry = (
  onRetry?: () => void | Promise<void>,
  options: UseClerkRetryOptions = {}
): UseClerkRetryReturn => {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const retry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      console.warn('Max retry attempts reached for Clerk initialization');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Calculate exponential backoff delay
      const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Execute the retry function
      if (onRetry) {
        await onRetry();
      }

      // Placeholder for Sentry logging - to be implemented post-MVP
      // console.log(`Clerk retry attempt ${retryCount + 1} successful`);

    } catch (error) {
      console.error(`Clerk retry attempt ${retryCount + 1} failed:`, error);

      // Placeholder for Sentry logging - to be implemented post-MVP
      // console.log('Logging Clerk retry failure to Sentry');

      // If this was the last retry, don't set isRetrying to false yet
      // Let the component handle the final failure state
      if (retryCount >= maxRetries - 1) {
        setIsRetrying(false);
        return;
      }
    }

    setIsRetrying(false);
  }, [retryCount, maxRetries, baseDelay, maxDelay, onRetry]);

  return {
    retry,
    isRetrying,
    retryCount,
    reset,
  };
};