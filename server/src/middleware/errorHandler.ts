import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError
} from '../errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  // 1. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      code: 'VALIDATION_ERROR',
      details: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  // 2. Handle Custom Validation Error (Lead time, Dates, etc.)
  if (err instanceof ValidationError) {
    const response: any = {
      error: 'Validation Error',
      message: err.message,
      code: err.code || 'VALIDATION_ERROR',
      details: err.details,
    };

    // Add suggestion if available in details
    if (err.details && typeof err.details === 'object' && 'requiredDays' in err.details) {
      const details = err.details as any;
      response.suggestion = `Please select a departure date at least ${details.requiredDays || 5} days from now`;
    }

    return res.status(400).json(response);
  }

  // 3. Handle Other Custom Errors
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: 'Not Found', message: err.message, code: 'NOT_FOUND' });
  }
  if (err instanceof ForbiddenError) {
    return res.status(403).json({ error: 'Forbidden', message: err.message, code: err.code || 'FORBIDDEN' });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: 'Unauthorized', message: err.message, code: 'UNAUTHORIZED' });
  }
  if (err instanceof BadRequestError) {
    return res.status(400).json({ error: 'Bad Request', message: err.message, code: 'BAD_REQUEST' });
  }

  // 4. Fallback for unknown errors
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong. Please try again later.',
    code: 'SERVER_ERROR'
  });
};