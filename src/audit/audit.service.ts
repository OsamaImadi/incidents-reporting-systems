import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditStatus } from './entities/audit-log.entity';
import { User } from 'src/users/entities/user.entity';

export interface AuditLogData {
  user?: User | null;
  action: AuditAction;
  description?: string;
  status: AuditStatus;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        user: data.user || null,
        action: data.action,
        description: data.description || null,
        status: data.status,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Don't throw errors from audit logging to avoid breaking the main flow
      console.error('Failed to log audit event:', error);
    }
  }

  async getLogs(
    userId?: number,
    action?: AuditAction,
    status?: AuditStatus,
    limit: number = 20,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.timestamp', 'DESC')
      .take(limit)
      .skip(offset);

    if (userId) {
      queryBuilder.andWhere('auditLog.user.id = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('auditLog.action = :action', { action });
    }

    if (status) {
      queryBuilder.andWhere('auditLog.status = :status', { status });
    }

    return await queryBuilder.getMany();
  }
}
