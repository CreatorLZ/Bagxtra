'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseClerkRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface UseClerkRetryReturn {
  retry: () => Promise<void>;
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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRetryingRef = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    isRetryingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    // Guard against concurrent retry operations
    if (isRetryingRef.current) {
      console.warn('Retry operation already in progress');
      return;
    }

    if (retryCount >= maxRetries) {
      console.warn('Max retry attempts reached for Clerk initialization');
      return;
    }

    isRetryingRef.current = true;
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Calculate exponential backoff delay
      const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);

      // Wait for the delay with cleanup tracking
      await new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          resolve();
        }, delay);
      });

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
        isRetryingRef.current = false;
        return;
      }
    }

    setIsRetrying(false);
    isRetryingRef.current = false;
  }, [retryCount, maxRetries, baseDelay, maxDelay, onRetry]);

  return {
    retry,
    isRetrying,
    retryCount,
    reset,
  };
};