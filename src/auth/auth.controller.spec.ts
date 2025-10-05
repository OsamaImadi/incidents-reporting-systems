import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserType } from '../utils/userTypes.enum';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      userType: UserType.USER,
    },
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    userType: UserType.USER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith({
        ...registerDto,
        userType: UserType.USER,
      });
    });
  });

  describe('registerAdmin', () => {
    it('should register a new admin user', async () => {
      const registerDto = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        userType: UserType.ADMIN,
      };

      const req = { user: mockUser };
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.registerAdmin(registerDto, req);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto, mockUser);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const req = {
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' },
        get: jest.fn().mockReturnValue('Mozilla/5.0...'),
      };

      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, req);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        '192.168.1.1',
        'Mozilla/5.0...'
      );
    });
  });

  describe('refresh', () => {
    it('should refresh access token', async () => {
      const req = { user: mockUser };
      const refreshResponse = { accessToken: 'new-access-token' };

      authService.refreshToken.mockResolvedValue(refreshResponse);

      const result = await controller.refresh(req);

      expect(result).toEqual(refreshResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = { user: mockUser };

      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
    });
  });
});