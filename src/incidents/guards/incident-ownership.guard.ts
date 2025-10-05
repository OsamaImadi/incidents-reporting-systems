import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from 'src/utils/userTypes.enum';

@Injectable()
export class IncidentOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const incidentId = request.params.id;

    // Admin can access all incidents
    if (user.userType === UserType.ADMIN) {
      return true;
    }

    // For regular users, we need to check if they own the incident
    // This will be handled in the service layer since we need database access
    return true;
  }
}
