import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserType } from 'src/utils/userTypes.enum';
import { Audit } from 'src/audit/decorators/audit.decorator';
import { AuditInterceptor } from 'src/audit/interceptors/audit.interceptor';
import { AuditAction } from 'src/audit/entities/audit-log.entity';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(UserType.USER, UserType.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.INCIDENT_CREATED, 'Incident created')
  create(@Body() createIncidentDto: CreateIncidentDto, @Request() req) {
    return this.incidentsService.create(createIncidentDto, req.user);
  }

  @Get()
  @Roles(UserType.USER, UserType.ADMIN)
  findAll(@Request() req) {
    return this.incidentsService.findAll(req.user);
  }

  @Get('search')
  @Roles(UserType.USER, UserType.ADMIN)
  findWithFilters(@Query() queryDto: QueryIncidentsDto, @Request() req) {
    return this.incidentsService.findWithFilters(queryDto, req.user);
  }

  @Get('user/:userId')
  @Roles(UserType.USER, UserType.ADMIN)
  findByUser(@Param('userId') userId: string, @Request() req) {
    return this.incidentsService.findByUser(+userId, req.user);
  }

  @Get(':id')
  @Roles(UserType.USER, UserType.ADMIN)
  findOne(@Param('id') id: string, @Request() req) {
    return this.incidentsService.findOne(+id, req.user);
  }

  @Patch(':id')
  @Roles(UserType.USER, UserType.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.INCIDENT_UPDATED, 'Incident updated')
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto, @Request() req) {
    return this.incidentsService.update(+id, updateIncidentDto, req.user);
  }

  @Delete(':id')
  @Roles(UserType.USER, UserType.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.INCIDENT_DELETED, 'Incident deleted')
  remove(@Param('id') id: string, @Request() req) {
    return this.incidentsService.remove(+id, req.user);
  }
}
