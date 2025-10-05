import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuditService } from '../audit.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditStatus } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditData = this.reflector.getAllAndOverride(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditData) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.get('User-Agent');

    return next.handle().pipe(
      tap(async (response) => {
        // Log successful action
        await this.auditService.log({
          user: user || null,
          action: auditData.action,
          description: auditData.description,
          status: AuditStatus.SUCCESS,
          metadata: {
            method: request.method,
            url: request.url,
            response: response,
          },
          ipAddress,
          userAgent,
        });
      }),
      catchError(async (error) => {
        // Log failed action
        await this.auditService.log({
          user: user || null,
          action: auditData.action,
          description: auditData.description,
          status: AuditStatus.FAILED,
          metadata: {
            method: request.method,
            url: request.url,
            error: error.message,
          },
          ipAddress,
          userAgent,
        });
        return throwError(() => error);
      }),
    );
  }
}
