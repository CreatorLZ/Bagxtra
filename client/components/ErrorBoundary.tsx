'use client';

import React, {
  Component,
  ErrorInfo,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ClerkErrorMessage } from '@/components/ui/error-message';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='p-6 max-w-2xl mx-auto'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className='mt-2'>
              <p className='mb-4'>
                An unexpected error occurred. This might be due to a network
                issue or a temporary problem.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className='mb-4'>
                  <summary className='cursor-pointer font-medium'>
                    Error Details (Development)
                  </summary>
                  <pre className='mt-2 text-xs bg-muted p-2 rounded overflow-auto'>
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className='flex gap-2'>
                <Button onClick={this.handleRetry} variant='outline' size='sm'>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant='outline'
                  size='sm'
                >
                  Reload Page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
/**
 * Hook that integrates with React Error Boundaries by storing errors in state
 * and throwing them during render so React can catch them.
 *
 * @returns A function that sets the error state, triggering the error boundary.
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

// Specialized error boundary for Clerk authentication errors
interface ClerkErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface ClerkErrorBoundaryState {
  hasClerkError: boolean;
  isRetrying: boolean;
}

export class ClerkErrorBoundary extends Component<ClerkErrorBoundaryProps, ClerkErrorBoundaryState> {
  constructor(props: ClerkErrorBoundaryProps) {
    super(props);
    this.state = { hasClerkError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): ClerkErrorBoundaryState {
    // Check if this is a Clerk-related error
    const isClerkError = error.message?.includes('clerk') ||
                        error.message?.includes('Clerk') ||
                        error.stack?.includes('@clerk/nextjs') ||
                        error.name === 'ClerkError';

    if (isClerkError) {
      return { hasClerkError: true, isRetrying: false };
    }

    // Re-throw non-Clerk errors to be caught by parent boundaries
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Placeholder for Sentry logging - to be implemented post-MVP
    // console.log('Clerk error caught:', error, errorInfo);

    console.error('Clerk authentication error:', error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Reset error state
      this.setState({ hasClerkError: false, isRetrying: false });
      // Call the retry function if provided
      await this.props.onRetry?.();
    } catch (error) {
      console.error('Retry failed:', error);
      this.setState({ hasClerkError: true, isRetrying: false });
    }
  };

  render() {
    if (this.state.hasClerkError) {
      return (
        <div className='p-6 max-w-2xl mx-auto'>
          <ClerkErrorMessage
            onRetry={this.handleRetry}
            isRetrying={this.state.isRetrying}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
