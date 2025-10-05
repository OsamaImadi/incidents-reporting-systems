import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/incidents/guards/roles.guard';
import { Roles } from 'src/incidents/decorators/roles.decorator';
import { UserType } from 'src/utils/userTypes.enum';
import { AuditAction } from './entities/audit-log.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserType.ADMIN)
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const userIdNum = userId ? parseInt(userId, 10) : undefined;

    return this.auditService.getLogs(userIdNum, action, status as any, limitNum, offsetNum);
  }

  @Get('my-logs')
  @Roles(UserType.USER, UserType.ADMIN)
  async getMyLogs(
    @Request() req: any,
    @Query('action') action?: AuditAction,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    const userId = req.user.id;

    return this.auditService.getLogs(userId, action, status as any, limitNum, offsetNum);
  }
}
