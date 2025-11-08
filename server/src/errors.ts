export class ValidationError extends Error {
  constructor(message: string, public field?: string, public details?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class InsufficientPermissionsError extends ForbiddenError {
  constructor(
    message: string,
    public requiredPermissions?: string[],
    public userPermissions?: string[],
    public userRole?: string
  ) {
    super(message, 'INSUFFICIENT_PERMISSIONS', {
      requiredPermissions,
      userPermissions,
      userRole,
    });
    this.name = 'InsufficientPermissionsError';
  }
}

export class InvalidRoleError extends ForbiddenError {
  constructor(message: string, public invalidRole?: string) {
    super(message, 'INVALID_ROLE', { invalidRole });
    this.name = 'InvalidRoleError';
  }
}

export class AuthRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthRequiredError';
    this.code = 'AUTH_REQUIRED';
  }

  code?: string;
}

// Enhanced error types for better client handling
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

// Error response interface for consistent API responses
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string | undefined;
  details?: any[] | undefined;
  retryAfter?: number | undefined;
  timestamp?: string | undefined;
}

// Helper function to create standardized error responses
export const createErrorResponse = (
  error: string,
  message: string,
  code?: string,
  details?: any[],
  retryAfter?: number
): ErrorResponse => ({
  error,
  message,
  code,
  details,
  retryAfter,
  timestamp: new Date().toISOString(),
});
