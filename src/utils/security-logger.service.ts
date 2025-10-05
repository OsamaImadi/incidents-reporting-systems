import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction, AuditStatus } from 'src/audit/entities/audit-log.entity';

@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger(SecurityLoggerService.name);

  constructor(private readonly auditService: AuditService) {}

  async logSecurityEvent(
    action: AuditAction,
    description: string,
    metadata: any,
    ipAddress?: string,
    userAgent?: string,
    user?: any,
    status: AuditStatus = AuditStatus.SUCCESS
  ): Promise<void> {
    try {
      // Log to application logs
      this.logger.warn(`Security Event: ${action} - ${description}`, {
        action,
        description,
        metadata,
        ipAddress,
        userAgent,
        userId: user?.id,
        status
      });

      // Log to audit system
      await this.auditService.log({
        user,
        action,
        description,
        status,
        metadata: {
          ...metadata,
          securityEvent: true,
          timestamp: new Date().toISOString()
        },
        ipAddress,
        userAgent
      });
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  async logSuspiciousActivity(
    activity: string,
    metadata: any,
    ipAddress?: string,
    userAgent?: string,
    user?: any
  ): Promise<void> {
    await this.logSecurityEvent(
      AuditAction.SECURITY_VIOLATION,
      `Suspicious activity detected: ${activity}`,
      {
        ...metadata,
        severity: 'HIGH',
        requiresInvestigation: true
      },
      ipAddress,
      userAgent,
      user,
      AuditStatus.FAILED
    );
  }

  async logRateLimitExceeded(
    endpoint: string,
    ipAddress: string,
    userAgent?: string,
    user?: any
  ): Promise<void> {
    await this.logSecurityEvent(
      AuditAction.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for endpoint: ${endpoint}`,
      {
        endpoint,
        rateLimitType: 'THROTTLE_VIOLATION'
      },
      ipAddress,
      userAgent,
      user,
      AuditStatus.FAILED
    );
  }

  async logAuthenticationFailure(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent(
      AuditAction.LOGIN_FAILED,
      `Authentication failure for ${email}: ${reason}`,
      {
        email,
        failureReason: reason,
        attemptType: 'AUTHENTICATION'
      },
      ipAddress,
      userAgent,
      null,
      AuditStatus.FAILED
    );
  }

  async logPrivilegeEscalationAttempt(
    userId: number,
    attemptedAction: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSuspiciousActivity(
      'Privilege escalation attempt',
      {
        userId,
        attemptedAction,
        violationType: 'PRIVILEGE_ESCALATION'
      },
      ipAddress,
      userAgent,
      { id: userId }
    );
  }
}
