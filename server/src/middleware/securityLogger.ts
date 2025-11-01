import { Request, Response, NextFunction } from 'express';

/**
 * Security event types
 */
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  FORBIDDEN_ACCESS = 'forbidden_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  TOKEN_EXPIRED = 'token_expired',
  INVALID_TOKEN = 'invalid_token',
  INVALID_TOKEN_PAYLOAD = 'invalid_token_payload',
  USER_REGISTERED = 'user_registered',
  USER_UPDATED = 'user_updated',
  ROLE_CHANGED = 'role_changed',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  clerkId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  details?: Record<string, any> | undefined;
}

/**
 * Security logger class
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000; // Keep last 1000 events in memory

  private constructor() {}

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event
   */
  log(
    event: Omit<
      SecurityEvent,
      'ip' | 'userAgent' | 'endpoint' | 'method' | 'timestamp'
    > & { req: Request; details?: Record<string, any> }
  ): void {
    const securityEvent: SecurityEvent = {
      ...event,
      ip: this.getClientIP(event.req),
      userAgent: event.req.get('User-Agent') || 'Unknown',
      endpoint: event.req.path,
      method: event.req.method,
      timestamp: new Date(),
      details: event.details,
    };

    this.events.push(securityEvent);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console with appropriate level
    this.logToConsole(securityEvent);
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    // Check for forwarded IP
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    // Check for real IP
    const realIP = req.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback to connection remote address
    return (
      req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown'
    );
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(event: SecurityEvent): void {
    const logData = {
      type: event.type,
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      endpoint: `${event.method} ${event.endpoint}`,
      timestamp: event.timestamp.toISOString(),
      details: event.details,
    };

    switch (event.type) {
      case SecurityEventType.AUTH_FAILURE:
      case SecurityEventType.UNAUTHORIZED_ACCESS:
      case SecurityEventType.FORBIDDEN_ACCESS:
      case SecurityEventType.INVALID_TOKEN:
      case SecurityEventType.INVALID_TOKEN_PAYLOAD:
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        console.warn('🔐 SECURITY EVENT:', logData);
        break;

      case SecurityEventType.AUTH_SUCCESS:
      case SecurityEventType.USER_REGISTERED:
        console.log('🔐 SECURITY EVENT:', logData);
        break;

      default:
        console.info('🔐 SECURITY EVENT:', logData);
    }
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(
    type: SecurityEventType,
    limit: number = 50
  ): SecurityEvent[] {
    return this.events.filter(event => event.type === type).slice(-limit);
  }

  /**
   * Get events for a specific user
   */
  getEventsForUser(userId: string, limit: number = 20): SecurityEvent[] {
    return this.events.filter(event => event.userId === userId).slice(-limit);
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Middleware to log authentication events
 */
export const logAuthEvent = (type: SecurityEventType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const logger = SecurityLogger.getInstance();

    // Extract user info from request
    const user = (req as any).user;
    const userId = user?.id;
    const clerkId = user?.clerkId;
    const email = user?.email;

    logger.log({
      type,
      userId,
      clerkId,
      email,
      req,
      details: {
        statusCode: res.statusCode,
        responseTime: Date.now() - (req as any)._startTime || 0,
      },
    });

    next();
  };
};

/**
 * Middleware to log API access
 */
export const logApiAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  (req as any)._startTime = Date.now();
  next();
};

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();
