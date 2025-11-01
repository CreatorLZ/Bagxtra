import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import validator from 'validator';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: z.infer<z.ZodSchema>;
    }
  }
}

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Validation failed',
      });
      return;
    }
  };
};

/**
 * Middleware to validate request query parameters against a Zod schema
 */
export const validateQuery = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Query validation failed',
      });
      return;
    }
  };
};

/**
 * Middleware to validate request params against a Zod schema
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid URL parameters',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Params validation failed',
      });
      return;
    }
  };
};

/**
 * Sanitize string inputs to prevent XSS and other injection attacks
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';

  return validator.escape(str.trim()).slice(0, 1000);
};

/**
 * Middleware to sanitize request body strings
 */
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitizeObject(req.body);
  next();
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/)
    .optional(),
  country: z.string().max(100).trim().optional(),
  fullName: z.string().min(1).max(100).trim(),
  role: z.enum(['shopper', 'traveler', 'vendor', 'admin']),

  // Pagination
  pagination: z.object({
    page: z
      .string()
      .transform(val => parseInt(val, 10))
      .superRefine((val, ctx) => {
        if (Number.isNaN(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Page must be a valid number',
          });
          return;
        }
        if (val <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Page must be positive',
          });
        }
      })
      .optional(),
    limit: z
      .string()
      .transform(val => parseInt(val, 10))
      .superRefine((val, ctx) => {
        if (Number.isNaN(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Limit must be a valid number',
          });
          return;
        }
        if (val <= 0 || val > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Limit must be between 1 and 100',
          });
        }
      })
      .optional(),
  }),

  // User ID param
  userId: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
};
