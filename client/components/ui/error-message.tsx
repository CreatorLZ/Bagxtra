import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ApiError } from '@/types/auth';

interface ErrorMessageProps {
  error: ApiError | Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  isOffline?: boolean;
  title?: string;
  className?: string;
  onRecoveryAction?: (action: string) => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  isRetrying = false,
  isOffline = false,
  title,
  className,
  onRecoveryAction,
}) => {
  if (!error) return null;

  const getErrorMessage = (error: ApiError | Error): string => {
    if ('message' in error && error.message) {
      return error.message;
    }
    if ('error' in error && error.error) {
      return error.error;
    }
    return 'An unexpected error occurred';
  };

  const getErrorCode = (error: ApiError | Error): string | undefined => {
    return 'code' in error ? error.code : undefined;
  };

  const getUserFriendlyMessage = (error: ApiError | Error): string => {
    const message = getErrorMessage(error);
    const code = getErrorCode(error);

    // Map error codes to user-friendly messages
    switch (code) {
      case 'AUTH_REQUIRED':
        return 'Please log in to continue';
      case 'INSUFFICIENT_PERMISSIONS':
        return "You don't have permission to perform this action";
      case 'USER_NOT_FOUND':
        return 'The requested user could not be found';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again';
      case 'INVALID_ROLE':
        return 'The selected role is not valid';
      case 'SELF_MODIFICATION_NOT_ALLOWED':
        return 'You cannot modify your own role';
      case 'ADMIN_MODIFICATION_NOT_ALLOWED':
        return 'Regular admins cannot modify other admin roles';
      case 'ADMIN_ROLE_NOT_ALLOWED':
        return 'You cannot assign yourself admin privileges';
      case 'ADMIN_ROLE_CHANGE_NOT_ALLOWED':
        return 'Admins cannot change their own role';
      case 'ROLE_ALREADY_SET':
        return 'This role is already assigned to the user';
      case 'INVALID_PARAMETER':
        return 'The provided parameters are invalid';
      case 'INTERNAL_ERROR':
        return 'Something went wrong on our end. Please try again later';
      default:
        if (isOffline) {
          return 'You appear to be offline. Please check your connection and try again';
        }
        return message;
    }
  };

  const getRecoveryAction = (error: ApiError | Error): string | null => {
    const code = getErrorCode(error);

    switch (code) {
      case 'AUTH_REQUIRED':
        return 'Log in';
      case 'INSUFFICIENT_PERMISSIONS':
        return 'Contact administrator';
      default:
        return onRetry ? 'Try again' : null;
    }
  };

  const message = getErrorMessage(error);
  const userFriendlyMessage = getUserFriendlyMessage(error);
  const recoveryAction = getRecoveryAction(error);

  return (
    <Alert variant='destructive' className={className}>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>{title || 'Error'}</AlertTitle>
      <AlertDescription className='mt-2'>
        <p className='mb-3'>{userFriendlyMessage}</p>

        {isOffline && (
          <div className='flex items-center gap-2 mb-3 text-sm'>
            <WifiOff className='h-4 w-4' />
            <span>You are currently offline</span>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <details className='mb-3'>
            <summary className='cursor-pointer text-sm font-medium'>
              Technical Details
            </summary>
            <pre className='mt-2 text-xs bg-muted p-2 rounded overflow-auto'>
              {message}
            </pre>
          </details>
        )}

        <div className='flex gap-2'>
          {onRetry && recoveryAction === 'Try again' && (
            <Button
              onClick={onRetry}
              variant='outline'
              size='sm'
              disabled={isRetrying}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
              />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          {recoveryAction &&
            recoveryAction !== 'Try again' &&
            (onRecoveryAction ? (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onRecoveryAction(recoveryAction)}
              >
                {recoveryAction}
              </Button>
            ) : (
              <span className='text-sm text-muted-foreground'>
                {recoveryAction}
              </span>
            ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Specialized error components for common scenarios
export const NetworkErrorMessage: React.FC<{
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying }) => (
  <ErrorMessage
    error={{
      error: 'Network Error',
      message: 'Unable to connect to the server',
    }}
    onRetry={onRetry}
    isRetrying={isRetrying}
    isOffline={true}
    title='Connection Problem'
  />
);

export const AuthErrorMessage: React.FC = () => (
  <ErrorMessage
    error={{
      error: 'Authentication Required',
      message: 'Please log in to continue',
      code: 'AUTH_REQUIRED',
    }}
    title='Authentication Required'
  />
);

export const PermissionErrorMessage: React.FC = () => (
  <ErrorMessage
    error={{
      error: 'Insufficient Permissions',
      message: "You don't have permission to perform this action",
      code: 'INSUFFICIENT_PERMISSIONS',
    }}
    title='Access Denied'
  />
);
