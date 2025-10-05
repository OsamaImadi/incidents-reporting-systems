import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/entities/user.entity';
import { UserType } from '../utils/userTypes.enum';
import { AuditAction, AuditStatus } from '../audit/entities/audit-log.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    userType: UserType.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    incidents: []
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = '$2a$10$hashedpassword';

      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      // Mock bcrypt.compare to return true
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        userType: mockUser.userType,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        incidents: mockUser.incidents,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(auditService.log).toHaveBeenCalledWith({
        user: null,
        action: AuditAction.LOGIN_FAILED,
        description: `Failed login attempt for non-existent user: ${email}`,
        status: AuditStatus.FAILED,
        metadata: { email, reason: 'User not found' },
        ipAddress: undefined,
        userAgent: undefined,
      });
    });

    it('should return null when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      usersService.findByEmail.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(auditService.log).toHaveBeenCalledWith({
        user: null,
        action: AuditAction.LOGIN_FAILED,
        description: `Failed login attempt for existing user: ${email}`,
        status: AuditStatus.FAILED,
        metadata: { email, reason: 'Invalid password', userId: mockUser.id },
        ipAddress: undefined,
        userAgent: undefined,
      });
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const userData = {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        userType: mockUser.userType,
      };

      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        user: userData,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(auditService.log).toHaveBeenCalledWith({
        user: {
          ...userData,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          incidents: [],
        },
        action: AuditAction.LOGIN_SUCCESS,
        description: `Successful login for user: ${userData.email}`,
        status: AuditStatus.SUCCESS,
        metadata: { email: userData.email },
        ipAddress: undefined,
        userAgent: undefined,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        userType: UserType.USER,
      };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          userType: mockUser.userType,
        },
      });
      expect(usersService.create).toHaveBeenCalledWith(registerDto, undefined);
    });

    it('should allow admin to create admin user', async () => {
      const registerDto = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        userType: UserType.ADMIN,
      };

      const currentUser = { ...mockUser, userType: UserType.ADMIN };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, userType: UserType.ADMIN });
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.register(registerDto, currentUser);

      expect(result.user.userType).toBe(UserType.ADMIN);
      expect(usersService.create).toHaveBeenCalledWith(registerDto, currentUser);
    });

    it('should throw ForbiddenException when non-admin tries to create admin', async () => {
      const registerDto = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        userType: UserType.ADMIN,
      };

      const currentUser = { ...mockUser, userType: UserType.USER };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);

      await expect(service.register(registerDto, currentUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when username already exists', async () => {
      const registerDto = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshToken', () => {
    it('should return new access token', async () => {
      const user = {
        id: mockUser.id,
        email: mockUser.email,
      };

      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(user);

      expect(result).toEqual({
        accessToken: 'new-access-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: user.email, sub: user.id },
        { expiresIn: '15m' }
      );
    });
  });
});