import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../entities/audit-log.entity';

export const AUDIT_KEY = 'audit';
export const Audit = (action: AuditAction, description?: string) => 
  SetMetadata(AUDIT_KEY, { action, description });
