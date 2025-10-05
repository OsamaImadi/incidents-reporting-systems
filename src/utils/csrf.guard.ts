import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CryptoService } from './crypto.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cryptoService: CryptoService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Skip CSRF for public endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    // Check CSRF token
    const csrfToken = request.headers['x-csrf-token'] || request.body?.csrfToken;
    const sessionToken = request.session?.csrfToken;

    if (!csrfToken || !sessionToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    try {
      const isValid = this.cryptoService.verifyCSRFToken(csrfToken, sessionToken);
      if (!isValid) {
        throw new ForbiddenException('Invalid CSRF token');
      }
      return true;
    } catch (error) {
      throw new ForbiddenException('CSRF token verification failed');
    }
  }
}
