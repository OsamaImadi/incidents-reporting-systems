import { Controller, Post, Body, UseGuards, Get, Request, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from 'src/incidents/guards/roles.guard';
import { Roles } from 'src/incidents/decorators/roles.decorator';
import { UserType } from 'src/utils/userTypes.enum';
import { Audit } from 'src/audit/decorators/audit.decorator';
import { AuditInterceptor } from 'src/audit/interceptors/audit.interceptor';
import { AuditAction } from 'src/audit/entities/audit-log.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.USER_CREATED, 'User self-registration')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Public registration - force userType to 'user' for security
    const publicRegisterDto = { ...registerDto, userType: UserType.USER };
    return this.authService.register(publicRegisterDto);
  }

  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit(AuditAction.USER_CREATED, 'Admin user created by admin')
  async registerAdmin(@Body() registerDto: RegisterDto, @Request() req): Promise<AuthResponseDto> {
    return this.authService.register(registerDto, req.user);
  }

  @Throttle({ short: { limit: 3, ttl: 1000 }, medium: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Request() req): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
