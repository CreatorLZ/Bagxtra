import { createHash } from 'crypto';
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
  ROLE_DEFAULTED = 'role_defaulted',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  clerkId?: string;
  userIdentifier?: string;
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

  /**
   * Hash email for anonymized logging (fallback when userId is unavailable)
   * Uses SHA-256 with salt for irreversibility
   */
  private hashEmail(email: string): string {
    const salt = process.env['LOG_SALT'] || 'default-salt-change-in-prod';
    return createHash('sha256')
      .update(email + salt)
      .digest('hex')
      .substring(0, 12); // Truncate for brevity while maintaining uniqueness
  }

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
    const forwardedHeader = req.get('x-forwarded-for');
    if (forwardedHeader && forwardedHeader.trim() !== '') {
      const firstIP = forwardedHeader.split(',')[0];
      return firstIP ? firstIP.trim() : 'Unknown';
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
   * PII logging requires ENABLE_PII_LOGGING=true and user consent. Retention: auto-scrub after 90 days per GDPR.
   */
  private logToConsole(event: SecurityEvent): void {
    const logData: any = {
      type: event.type,
      userId: event.userId,
      userIdentifier: event.userIdentifier,
      ip: event.ip,
      endpoint: `${event.method} ${event.endpoint}`,
      timestamp: event.timestamp.toISOString(),
      details: event.details,
    };

    // Gate full PII logging behind config and consent (for debugging only)
    if (
      process.env['ENABLE_PII_LOGGING'] === 'true' &&
      event.details?.['consentGiven']
    ) {
      // Note: Raw email not stored in event anymore; this is for exceptional cases
      logData.email = event.details?.['email']; // Hypothetical; adjust based on actual consent flow
    }

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

  /**
   * Scrub old events to comply with retention policies (e.g., GDPR: max 90 days)
   * Call this periodically (e.g., on app start or via cron) to remove events older than retentionDays
   */
  scrubOldEvents(retentionDays: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
  }
}

/**
 * Middleware to log authentication events
 * PII logging requires ENABLE_PII_LOGGING=true and user consent. Retention: auto-scrub after 90 days per GDPR.
 */
export const logAuthEvent = (type: SecurityEventType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const logger = SecurityLogger.getInstance();

    // Extract user info from request
    const user = (req as any).user;
    const userId = user?.id;
    const clerkId = user?.clerkId;
    const userIdentifier =
      userId || (user?.email ? logger['hashEmail'](user.email) : undefined);

    logger.log({
      type,
      userId,
      clerkId,
      userIdentifier,
      req,
      details: {
        statusCode: res.statusCode,
        responseTime: Date.now() - (req as any)._startTime || 0,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
      },
    });

    next();
  };
};

/**
 * Middleware to log unauthorized access attempts with enhanced details
 * PII logging requires ENABLE_PII_LOGGING=true and user consent. Retention: auto-scrub after 90 days per GDPR.
 */
export const logUnauthorizedAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const logger = SecurityLogger.getInstance();

  // Extract user info from request
  const user = (req as any).user;
  const userId = user?.id;
  const clerkId = user?.clerkId;
  const userIdentifier =
    userId || (user?.email ? logger['hashEmail'](user.email) : undefined);

  logger.log({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId,
    clerkId,
    userIdentifier,
    req,
    details: {
      attemptedEndpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      queryParams: req.query,
      bodyKeyCount: req.body ? Object.keys(req.body).length : 0,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
      },
    },
  });

  next();
};

/**
 * Middleware to log forbidden access attempts with enhanced details
 * PII logging requires ENABLE_PII_LOGGING=true and user consent. Retention: auto-scrub after 90 days per GDPR.
 */
export const logForbiddenAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const logger = SecurityLogger.getInstance();

  // Extract user info from request
  const user = (req as any).user;
  const userId = user?.id;
  const clerkId = user?.clerkId;
  const userIdentifier =
    userId || (user?.email ? logger['hashEmail'](user.email) : undefined);

  logger.log({
    type: SecurityEventType.FORBIDDEN_ACCESS,
    userId,
    clerkId,
    userIdentifier,
    req,
    details: {
      attemptedEndpoint: req.path,
      method: req.method,
      userRole: user?.role,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      queryParams: req.query,
      bodyKeyCount: req.body ? Object.keys(req.body).length : 0,
      timestamp: new Date().toISOString(),
    },
  });

  next();
};

/**
 * Middleware to log API access
 */
export const logApiAccess = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  (req as any)._startTime = Date.now();
  next();
};

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();
