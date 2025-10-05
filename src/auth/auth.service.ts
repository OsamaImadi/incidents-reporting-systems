import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuditService } from 'src/audit/audit.service';
import { AuditAction, AuditStatus } from 'src/audit/entities/audit-log.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && user.password && await bcrypt.compare(password, user.password)) {
        const { password: _, ...result } = user;
        return result;
      }
      
      // Log failed login attempt with specific reason
      if (user) {
        await this.auditService.log({
          user: null, // Don't associate with user for failed attempts
          action: AuditAction.LOGIN_FAILED,
          description: `Failed login attempt for existing user: ${email}`,
          status: AuditStatus.FAILED,
          metadata: { email, reason: 'Invalid password', userId: user.id },
          ipAddress,
          userAgent,
        });
      } else {
        await this.auditService.log({
          user: null,
          action: AuditAction.LOGIN_FAILED,
          description: `Failed login attempt for non-existent user: ${email}`,
          status: AuditStatus.FAILED,
          metadata: { email, reason: 'User not found' },
          ipAddress,
          userAgent,
        });
      }
      
      return null;
    } catch (error) {
      // Log system error during login validation
      await this.auditService.log({
        user: null,
        action: AuditAction.LOGIN_FAILED,
        description: `System error during login validation for: ${email}`,
        status: AuditStatus.FAILED,
        metadata: { email, reason: 'System error', error: error.message },
        ipAddress,
        userAgent,
      });
      return null;
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password, ipAddress, userAgent);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { 
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'
    });

    // Log successful login
    await this.auditService.log({
      user: user,
      action: AuditAction.LOGIN_SUCCESS,
      description: `Successful login for user: ${user.email}`,
      status: AuditStatus.SUCCESS,
      metadata: { email: user.email },
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
      },
    };
  }

  async register(registerDto: RegisterDto, currentUser?: any): Promise<AuthResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const existingUsername = await this.usersService.findByUsername(registerDto.username);
      if (existingUsername) {
        throw new ConflictException('User with this username already exists');
      }

      // Check if trying to create admin user
      if (registerDto.userType === 'admin') {
        // Only existing admins can create new admin users
        if (!currentUser || currentUser.userType !== 'admin') {
          throw new ForbiddenException('Only existing admins can create new admin users');
        }
      }

      // Create new user
      const user = await this.usersService.create(registerDto, currentUser);

      // Log user creation
      await this.auditService.log({
        user: currentUser || null,
        action: AuditAction.USER_CREATED,
        description: `User created: ${user.email} with role: ${user.userType}`,
        status: AuditStatus.SUCCESS,
        metadata: { 
          createdUser: { id: user.id, email: user.email, userType: user.userType },
          createdBy: currentUser ? { id: currentUser.id, email: currentUser.email } : 'self-registration'
        },
      });

      // Generate tokens
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { 
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          userType: user.userType,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ConflictException('Registration failed');
    }
  }

  async refreshToken(user: any): Promise<{ accessToken: string }> {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    return { accessToken };
  }
}
