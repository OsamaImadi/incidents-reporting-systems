import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class RateLimitLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      catchError((error) => {
        // Check if it's a rate limit error
        if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
          const ipAddress = request.ip || request.connection.remoteAddress;
          const userAgent = request.get('User-Agent');
          const endpoint = request.url;
          const method = request.method;
          
          // Log rate limit exceeded
          this.logger.warn(`Rate limit exceeded: ${method} ${endpoint}`, {
            ipAddress,
            userAgent,
            userId: request.user?.id,
            endpoint: `${method} ${endpoint}`,
            rateLimitType: 'THROTTLE_VIOLATION'
          });
        }
        
        return throwError(() => error);
      })
    );
  }
}
